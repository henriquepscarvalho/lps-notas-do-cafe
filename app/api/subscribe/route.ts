import { NextResponse } from "next/server";

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

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
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
  let subRes = await fetch(subUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  // custom_fields nunca podem derrubar o cadastro: retry sem eles
  if (!subRes.ok && custom_fields.length) {
    delete payload.custom_fields;
    subRes = await fetch(subUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  }

  if (!subRes.ok) {
    const err = await subRes.text();
    console.error("Beehiiv subscription error:", err);
    return NextResponse.json(
      { error: "Falha ao criar assinatura" },
      { status: subRes.status }
    );
  }

  // 2. Dispara a automação (mesmo padrão de antes)
  if (autoId && autoId !== "placeholder") {
    const journeyRes = await fetch(
      `https://api.beehiiv.com/v2/publications/${pubId}/automations/${autoId}/journeys`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ email }),
      }
    );
    if (!journeyRes.ok) {
      console.error("Beehiiv automation journey error:", await journeyRes.text());
    }
  }

  return NextResponse.json({ success: true });
}
