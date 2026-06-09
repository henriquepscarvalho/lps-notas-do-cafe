import { NextResponse } from "next/server";

// Contrato de origem de lead (UTM).
// Ordem de captura: body.utm (cliente) > Referer da LP > click-id > "direct" honesto.
// Nunca cair pra nome da news no fallback (mascara o ponto cego).

const clean = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : undefined;

function fromReferer(ref: string) {
  try {
    const p = new URL(ref).searchParams;
    const get = (k: string) => clean(p.get(k));
    let source = get("utm_source");
    let medium = get("utm_medium");
    // sem utm_source explícito: inferir pelo click-id da plataforma
    if (!source) {
      if (p.get("fbclid")) {
        source = "meta";
        medium = medium ?? "paid_social";
      } else if (p.get("gclid")) {
        source = "google";
        medium = medium ?? "cpc";
      }
    }
    return {
      source,
      medium,
      campaign: get("utm_campaign"),
    };
  } catch {
    return {} as { source?: string; medium?: string; campaign?: string };
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

  // Origem: cliente > Referer > click-id > direct
  const ref = req.headers.get("referer") ?? "";
  const r = fromReferer(ref);
  const c = (body?.utm ?? {}) as Record<string, unknown>;

  const utm_source = clean(c.source) ?? r.source ?? "direct";
  const utm_medium = clean(c.medium) ?? r.medium ?? "";
  const utm_campaign = clean(c.campaign) ?? r.campaign ?? "";
  const referring_site = clean(c.referrer) ?? (ref || undefined);

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  // 1. Cria a inscrição com a origem carimbada
  const subRes = await fetch(
    `https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        email,
        reactivate_existing: true,
        send_welcome_email: true,
        utm_source,
        utm_medium,
        utm_campaign,
        referring_site,
      }),
    }
  );

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
