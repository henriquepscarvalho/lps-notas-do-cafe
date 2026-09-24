import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { validateEmail } from "../../lib/validate-email";

export const maxDuration = 70;   // espera do 429 até o ratelimit-reset (fornax/214)

// ── referral interno (gamificacao-do-leitor/10) ─────────────────────────────
// Com ?ref= presente o cadastro passa a render prêmio: o email valida (descartável/
// typo/denylist) ANTES do Beehiiv e a indicação vira linha em referral_signups (SOT;
// hash server-side, email cru nunca gravado). Falha do INSERT nunca derruba o
// cadastro; dedupe = unique (slug, indicado_hash), primeiro ref vence.
const REFERRAL_SLUG = "notas-do-cafe";

const sha256hex = (s: string) =>
  crypto.createHash("sha256").update(s.trim().toLowerCase()).digest("hex");

async function emailDenied(email: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  try {
    const res = await fetch(`${url}/rest/v1/rpc/is_email_denied`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_email: email }),
    });
    if (!res.ok) return false; // fail-open: hiccup nunca perde lead
    return (await res.json()) === true;
  } catch {
    return false;
  }
}

async function recordReferral(opts: {
  refCode: string;
  email: string;
  req: Request;
  journeyId?: string;
}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return;
  // IP real do visitante (1º hop do XFF): o enrich do banco só veria o IP da Vercel
  const ip = (opts.req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  try {
    const res = await fetch(`${url}/rest/v1/referral_signups`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        slug: REFERRAL_SLUG,
        ref_code: opts.refCode,
        indicado_hash: sha256hex(opts.email),
        ip: ip || null,
        user_agent: opts.req.headers.get("user-agent"),
        journey_id: opts.journeyId ?? null,
      }),
    });
    // 409 = mesmo indicado já registrado nesta news (primeiro ref vence): benigno
    if (!res.ok && res.status !== 409) {
      console.error("referral insert error:", res.status, await res.text());
    }
  } catch (e) {
    console.error("referral insert exception:", e);
  }
}


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

// sorteio-braco (pfa/23, 14/09/26): braço de experimento no cadastro. O mapa mora no combo
// (_combo/public/braco_map.json, uma cópia só pras LPs e o combo); sem entrada pra esta pub e
// esta automação, nada muda. Mapa fora do ar = comportamento de hoje, nunca derruba o cadastro.
// Braço = sha256(lower(email) + ":" + exp), 8 hex, módulo n (a mesma conta do srm.py).
type EntradaBraco = { exp: string; de: string; bracos: Record<string, string>; so_com_exp?: boolean };
const BRACO_MAP_URL = process.env.BRACO_MAP_URL || "https://scriptorium-combo.vercel.app/braco_map.json";
let bracoMapa: { em: number; pubs: Record<string, EntradaBraco[]> } | null = null;

async function mapaDeBracos(): Promise<Record<string, EntradaBraco[]>> {
  if (bracoMapa && Date.now() - bracoMapa.em < 60_000) return bracoMapa.pubs;
  let pubs = bracoMapa?.pubs || {};
  try {
    const r = await fetch(BRACO_MAP_URL, { cache: "no-store", signal: AbortSignal.timeout(1500) });
    if (r.ok) pubs = ((await r.json()) as { pubs?: Record<string, EntradaBraco[]> })?.pubs || {};
  } catch {
    // segue com a última cópia boa (ou nenhuma) e tenta de novo em 60 s
  }
  bracoMapa = { em: Date.now(), pubs };
  return pubs;
}

async function sortearBraco(email: string, pubId: string, autoId: string | undefined, exp?: string) {
  if (!autoId) return null;
  try {
    const e = ((await mapaDeBracos())[pubId] || []).find(
      (x) => x && x.de === autoId && (exp ? x.exp === exp : !x.so_com_exp),
    );
    if (!e) return null;
    const letras = Object.keys(e.bracos || {})
      .filter((k) => /^[A-C]$/.test(k) && /^aut_/.test(e.bracos[k]))
      .sort();
    if (letras.length < 2) return null;
    const dig = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${email}:${e.exp}`));
    const hex = Array.from(new Uint8Array(dig).slice(0, 4), (b) => b.toString(16).padStart(2, "0")).join("");
    const braco = letras[parseInt(hex, 16) % letras.length];
    return { exp: e.exp, braco, automationId: e.bracos[braco] };
  } catch {
    return null;
  }
}

// denylist-rv11 (reputacao-vigiada/11, HC 24/09/26): quem denunciou spam em qualquer casa da rede
// está na email_denylist (Supabase) e nenhuma página nossa aceita o email de volta. A RPC
// is_email_denied é SECURITY DEFINER e só devolve boolean; a anon key é pública por desenho.
// Fail-open: erro, timeout de 1,5 s ou resposta que não seja `true` liberam o cadastro
// (lead nunca se perde por falha da checagem).
const DENYLIST_RPC = "https://ecmveymyzdqiehvtqxms.supabase.co/rest/v1/rpc/is_email_denied";
const DENYLIST_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbXZleW15emRxaWVodnRxeG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTA0MTAsImV4cCI6MjA4NTI4NjQxMH0.Po6pTYlWVwBpPn1PsKhwF4zYj5XMva9n9alLHskuqbE";

async function emailNaDenylist(email: string): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 1500);
  try {
    const res = await fetch(DENYLIST_RPC, {
      method: "POST",
      headers: { apikey: DENYLIST_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ p_email: email }),
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) return false;
    return (await res.json()) === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));

  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  // denylist-rv11: email da denylist recebe o mesmo sucesso do cadastro e não chega à beehiiv
  // (o front segue o fluxo normal e a página não revela a lista).
  if (await emailNaDenylist(email)) {
    return NextResponse.json({ success: true });
  }

  const rawRef = (body?.utm as Record<string, unknown> | undefined)?.ref;
  const refCode =
    typeof rawRef === "string" && /^[0-9a-f]{8,16}$/i.test(rawRef.trim())
      ? rawRef.trim().toLowerCase()
      : undefined;

  if (refCode) {
    // caminho com prêmio: higiene dura ANTES do Beehiiv (fail-open só em hiccup)
    const v = await validateEmail(email);
    if (!v.ok) {
      return NextResponse.json({ error: "Email inválido", reason: v.reason }, { status: 400 });
    }
    if (await emailDenied(email)) {
      return NextResponse.json({ error: "Email inválido", reason: "denylist" }, { status: 400 });
    }
  }

  const apiKey = process.env.BEEHIIV_API_KEY;
  const pubId = process.env.BEEHIIV_PUBLICATION_ID;
  let autoId: string | undefined = body?.automationId || process.env.BEEHIIV_AUTOMATION_ID;

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

  // indicação: rastro secundário no Beehiiv (a SOT é referral_signups; gotcha
  // conhecido: subscription de email já existente ignora utm)
  if (refCode) {
    utm_source = "referral";
    utm_medium = "indicacao";
  }
  const utm_campaign = refCode
    ? `ref-${refCode}`
    : clean(c.campaign) ?? r.campaign ?? "";
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

  // sorteio-braco (pfa/23): braço do experimento desta pub, se o braco_map.json tiver entrada
  const sorteio = await sortearBraco(email, pubId, autoId, clean(body?.exp));
  if (sorteio) {
    autoId = sorteio.automationId;
    custom_fields.push({ name: "braco", value: sorteio.braco }, { name: "braco_exp", value: sorteio.exp });
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  // vdn-retry-429: rate limit do Beehiiv é por CONTA (key compartilhada entre
  // news); batch interno rodando na mesma key não pode perder cadastro de
  // leitor (incidente RF 30/07/26: 6 subscribes perdidos em rajada de 1 min).
  // Retry só no 429: até 3 tentativas extras, cada uma esperando o reset do balde.
  const bhPost = async (url: string, body: unknown) => {
    let res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    // vdn-retry-429-reset (fornax/214, 01/09/26): o balde e da CONTA (180/min pras
    // 91 pubs desde a workspace única de 25/08/26) e o 429 do Beehiiv traz
    // `ratelimit-reset` (epoch s), nunca Retry-After. Dormir 1,5s/3s gastava as 3
    // tentativas DENTRO do mesmo minuto do balde: 39 leads perdidos em 13 news num
    // dia só. Aqui a espera vai até o reset (teto de 20s por tentativa: o leitor
    // está parado na frente do form).
    for (let i = 0; i < 3 && res.status === 429; i++) {
      const reset = Number(res.headers.get("ratelimit-reset"));
      const ms = Number.isFinite(reset) && reset > 0
        ? Math.min(Math.max(reset * 1000 - Date.now() + 1000, 1000), 20000)
        : 2000 * (i + 1);
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
  // cadastro real criado: a indicação vira linha na SOT (nunca derruba o cadastro)
  if (refCode) {
    await recordReferral({
      refCode,
      email,
      req,
      journeyId: clean(body?.journey_id),
    });
  }

  await sendCapiLead({
    email,
    eventId: clean(body?.eventId),
    req,
    eventSourceUrl: referring_site,
  });

  return NextResponse.json({ success: true });
}
