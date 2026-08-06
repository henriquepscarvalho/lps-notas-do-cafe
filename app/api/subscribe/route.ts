import { NextResponse } from "next/server";
import crypto from "node:crypto";

// CAPI server-side: dispara o evento Lead na Conversions API da Meta depois do
// cadastro confirmado. Dedup com o pixel do navegador via event_id (Meta conta 1x).
// Captura iOS/adblock que o pixel client-side perde. No-op se META_CAPI_TOKEN ausente.
async function sendCapiLead(opts: {
  email: string;
  eventId?: string;
  req: Request;
  eventSourceUrl?: string;
}) {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return; // desligado até o token estar no env
  const pixelId = process.env.META_PIXEL_ID || "1350334970327217";
  const sha = (s: string) =>
    crypto.createHash("sha256").update(s.trim().toLowerCase()).digest("hex");
  const cookie = opts.req.headers.get("cookie") || "";
  const getCookie = (k: string) => {
    const m = cookie.match(new RegExp("(?:^|; )" + k + "=([^;]+)"));
    return m ? decodeURIComponent(m[1]) : undefined;
  };
  const user_data: Record<string, unknown> = { em: [sha(opts.email)] };
  const ip = (opts.req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  if (ip) user_data.client_ip_address = ip;
  const ua = opts.req.headers.get("user-agent");
  if (ua) user_data.client_user_agent = ua;
  const fbp = getCookie("_fbp");
  if (fbp) user_data.fbp = fbp;
  const fbc = getCookie("_fbc");
  if (fbc) user_data.fbc = fbc;
  const event: Record<string, unknown> = {
    event_name: "Lead",
    event_time: Math.floor(Date.now() / 1000),
    action_source: "website",
    user_data,
  };
  if (opts.eventId) event.event_id = opts.eventId;
  if (opts.eventSourceUrl) event.event_source_url = opts.eventSourceUrl;
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [event] }),
      }
    );
    if (!res.ok) console.error("Meta CAPI Lead error:", await res.text());
  } catch (e) {
    console.error("Meta CAPI Lead exception:", e);
  }
}

// Contrato de origem de lead (UTM).
// Ordem de captura: body.utm (cliente, via localStorage) > Referer da LP > click-id > "direct" honesto.
// Nunca cair pra nome da news no fallback (mascara o ponto cego).
// fbclid/gclid (e utm_content/term) vao como custom_fields no Beehiiv.

const clean = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : undefined;

function fromReferer(ref: string) {
  try {
    const p = new URL(ref).searchParams;
    const get = (k: string) => clean(p.get(k));
    return {
      source: get("utm_source"),
      medium: get("utm_medium"),
      campaign: get("utm_campaign"),
      fbclid: get("fbclid"),
      gclid: get("gclid"),
    };
  } catch {
    return {} as {
      source?: string;
      medium?: string;
      campaign?: string;
      fbclid?: string;
      gclid?: string;
    };
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));

  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const apiKey = process.env.BEEHIIV_API_KEY;
  const pubId = process.env.BEEHIIV_PUBLICATION_ID;
  const autoId = body?.automationId || process.env.BEEHIIV_AUTOMATION_ID;

  if (!apiKey || !pubId) {
    return NextResponse.json(
      { error: "Configuração do servidor incompleta" },
      { status: 500 }
    );
  }

  // Origem: cliente (body.utm) > Referer > click-id > direct
  const ref = req.headers.get("referer") ?? "";
  const r = fromReferer(ref);
  const c = (body?.utm ?? {}) as Record<string, unknown>;

  const fbclid = clean(c.fbclid) ?? r.fbclid;
  const gclid = clean(c.gclid) ?? r.gclid;

  let utm_source = clean(c.source) ?? r.source;
  let utm_medium = clean(c.medium) ?? r.medium;
  // sem utm_source explícito: inferir pelo click-id da plataforma
  if (!utm_source && fbclid) {
    utm_source = "meta";
    utm_medium = utm_medium ?? "paid_social";
  } else if (!utm_source && gclid) {
    utm_source = "google";
    utm_medium = utm_medium ?? "cpc";
  }

  const utm_campaign = clean(c.campaign) ?? r.campaign ?? "";
  const referring_site = clean(c.referrer) ?? (ref || undefined);

  // Atribuição fina vai como custom_field (Beehiiv não tem campo nativo).
  // "utm_content"/"utm_term" são nomes RESERVADOS no Beehiiv -> ad_content/ad_term.
  const custom_fields: { name: string; value: string }[] = [];
  if (fbclid) custom_fields.push({ name: "fbclid", value: fbclid });
  if (gclid) custom_fields.push({ name: "gclid", value: gclid });
  const utm_content = clean(c.content);
  if (utm_content) custom_fields.push({ name: "ad_content", value: utm_content });
  const utm_term = clean(c.term);
  if (utm_term) custom_fields.push({ name: "ad_term", value: utm_term });

  // Lead do quiz (ticket 38): nome e estágio do diagnóstico viram custom fields.
  const nome = clean(body?.nome);
  if (nome) custom_fields.push({ name: "nome", value: nome });
  const quizEstagio = clean(body?.quiz_estagio);
  if (quizEstagio) custom_fields.push({ name: "quiz_estagio", value: quizEstagio });

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  // vdn-retry-429: rate limit do Beehiiv é por CONTA (key compartilhada entre
  // news); batch interno rodando na mesma key não pode perder cadastro de
  // leitor (incidente RF 30/07/26: 6 subscribes perdidos em rajada de 1 min).
  // Retry só no 429: até 2 tentativas extras (1.5s, 3s), devolve a última.
  const bhPost = async (url: string, body: unknown) => {
    let res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    for (const ms of [1500, 3000]) {
      if (res.status !== 429) break;
      await new Promise((r) => setTimeout(r, ms));
      res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
    }
    return res;
  };

  const payload: Record<string, unknown> = {
    email,
    reactivate_existing: true,
    send_welcome_email: true,
    utm_source: utm_source ?? "direct",
    utm_medium: utm_medium ?? "",
    utm_campaign,
    referring_site,
  };
  if (custom_fields.length) payload.custom_fields = custom_fields;

  // 1. Cria a inscrição com a origem carimbada
  const subUrl = `https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`;
  let subRes = await bhPost(subUrl, payload);

  // custom_fields nunca podem derrubar o cadastro: retry sem eles
  if (!subRes.ok && custom_fields.length) {
    delete payload.custom_fields;
    subRes = await bhPost(subUrl, payload);
  }

  if (!subRes.ok) {
    const err = await subRes.text();
    console.error("Beehiiv subscription error:", err);
    // source:"bh" marca que a falha veio do Beehiiv (nao da rota):
    // o beacon do cliente grava erro-subscribe-bh<status> e o report separa
    // upstream fora do ar de bug nosso. Additivo, contrato existente intacto.
    return NextResponse.json(
      { error: "Falha ao criar assinatura", source: "bh" },
      { status: subRes.status }
    );
  }

  // 2. Dispara a automação (mesmo padrão de antes)
  if (autoId && autoId !== "placeholder") {
    const journeyRes = await bhPost(
      `https://api.beehiiv.com/v2/publications/${pubId}/automations/${autoId}/journeys`,
      { email }
    );
    if (!journeyRes.ok) {
      console.error("Beehiiv automation journey error:", await journeyRes.text());
    }
  }

  // CAPI Lead server-side (dedup via event_id com o pixel). Nunca quebra o cadastro.
  await sendCapiLead({
    email,
    eventId: clean(body?.eventId),
    req,
    eventSourceUrl: referring_site,
  });

  return NextResponse.json({ success: true });
}
