import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, automationId } = await req.json();

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json(
      { error: "Email inválido" },
      { status: 400 }
    );
  }

  const apiKey = process.env.BEEHIIV_API_KEY;
  const pubId = process.env.BEEHIIV_PUBLICATION_ID;
  const autoId = process.env.BEEHIIV_AUTOMATION_ID;

  if (!apiKey || !pubId) {
    return NextResponse.json(
      { error: "Configuração do servidor incompleta" },
      { status: 500 }
    );
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  // 1. Create subscription
  const subRes = await fetch(
    `https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        email,
        reactivate_existing: true,
        send_welcome_email: true,
        utm_source: "website",
        utm_medium: "organic",
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

  // 2. Start automation journey
  const effectiveAutoId = automationId || autoId;
  if (effectiveAutoId) {
    const journeyRes = await fetch(
      `https://api.beehiiv.com/v2/publications/${pubId}/automations/${effectiveAutoId}/journeys`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ email }),
      }
    );

    if (!journeyRes.ok) {
      console.error(
        "Beehiiv automation journey error:",
        await journeyRes.text()
      );
    }
  }

  return NextResponse.json({ success: true });
}
