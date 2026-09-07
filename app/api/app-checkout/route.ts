import { NextResponse } from "next/server";

/* ============================================================
   TOKENS DO APP (ticket 10 do app-scriptorium; a fábrica troca por news.
   Fonte: stripe-produtos-app.json, conta Stripe News Makers)
   ============================================================ */
const SC = "NC";
const TITULO = "Café de Balcão no Coador de Casa";
const PRICE_APP = "price_1UC5G240q2kXDh5BSh9j8wdJ"; // R$ 97 (live, NM)
// Bump = guia irmão desbloqueado NO APP (decisão do ticket 25): NC recebe BC
const BUMP_SC = "BC";
const BUMP_PRICE = "price_1UC5G340q2kXDh5Bh4c2QQsy"; // R$ 48,50 (live, NM)
const BUMP_TITULO = "Brasa Pronta em 20 Minutos";

// Espelho dos prices live: o create-session e o unico que sabe se teve bump,
// entao carimba o total no return_url e a /app/obrigado dispara o Purchase certo.
const VALOR_APP = 9700;
const VALOR_BUMP = 4850;
// Recuperação pelo checkout próprio (ticket 35 do app-scriptorium): `oferta=bonus`
// = app cheio + guia irmão de graça (metadata bump sem line item, o webhook
// desbloqueia); `oferta=metade` = price de R$ 48,50 do D2, bump card permitido.
const PRICE_METADE = "price_1UC5G340q2kXDh5Bh4c2QQsy"; // R$ 48,50 (live, NM). ponytail: sem recuperação nesta casa ainda; mesmo valor do bump
const VALOR_METADE = 4850;

export async function POST(req: Request) {
  // Conta Stripe = News Makers (decisão HC 31/08, ticket app/14), nunca a VDN.
  const apiKey = process.env.STRIPE_API_KEY_NM;
  if (!apiKey) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 500 });
  }
  // Mesmo gate de dinheiro vivo do ebook (decisão HC 19/07): sem EBOOK_LIVE=1,
  // só key de teste cria session. Default-deny: o gate é "não é test", não "é live".
  const isTestKey = apiKey.startsWith("sk_test_") || apiKey.startsWith("rk_test_");
  if (!isTestKey && process.env.EBOOK_LIVE !== "1") {
    return NextResponse.json({ error: "live_gated" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  // c4-20k/23: `leitor` = CTA dentro do ebook (versao web e PDF). Mesmo price da metade,
  // carimbo proprio, sem conferencia de posse: o link so existe dentro do produto pago.
  const oferta = ["bonus", "metade", "leitor"].includes(String(body?.oferta)) ? String(body.oferta) : "";
  const bump = body?.bump === true && oferta !== "bonus";
  const valorApp = oferta === "metade" || oferta === "leitor" ? VALOR_METADE : VALOR_APP;

  const origin = new URL(req.url).origin;
  const params: Record<string, string> = {
    ui_mode: "embedded",
    mode: "payment",
    locale: "pt-BR",
    return_url: `${origin}/app/obrigado?session_id={CHECKOUT_SESSION_ID}&v=${
      bump ? valorApp + VALOR_BUMP : valorApp
    }`,
    // Contrato do webhook central: o app não tem price no mapa dos ebooks, quem o
    // identifica lá é o produto + sc (e o bump, quando levado).
    "metadata[produto]": "app",
    "metadata[sc]": SC,
  };
  if (bump || oferta === "bonus") params["metadata[bump]"] = BUMP_SC;
  if (oferta) params["metadata[oferta]"] = oferta;

  // Jornada e origem (mesmo desenho do create-session do ebook): o webhook persiste
  // em ebook_purchases.journey_id/src e cada real fica colado no caminho.
  const curto = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, 120) : "";
  const journey = curto(body?.journey);
  const src = curto(body?.src);
  if (journey) params["metadata[journey]"] = journey;
  params["metadata[src]"] = src || "lp-app";
  // funil-pixel: fbp, fbc, IP e user agent pra CAPI casar a venda com o clique.
  const cookies = req.headers.get("cookie") || "";
  const cookie = (k: string) => cookies.match(new RegExp(`(?:^|;\\s*)${k}=([^;]+)`))?.[1] || "";
  const fbp = cookie("_fbp").slice(0, 120);
  const fbc = cookie("_fbc").slice(0, 200);
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim().slice(0, 64);
  const ua = (req.headers.get("user-agent") || "").slice(0, 500);
  if (fbp) params["metadata[fbp]"] = fbp;
  if (fbc) params["metadata[fbc]"] = fbc;
  if (ip) params["metadata[ip]"] = ip;
  if (ua) params["metadata[ua]"] = ua;

  params["payment_intent_data[description]"] =
    `App ${TITULO} (${SC})` +
    (oferta === "metade" ? " metade" : oferta === "leitor" ? " leitor do ebook" : "") +
    (oferta === "bonus" ? ` + bônus ${BUMP_SC} no app` : bump ? ` + bump ${BUMP_SC} no app` : "");
  params["payment_intent_data[statement_descriptor_suffix]"] = `APP ${SC}`;

  // ponytail: price IDs live não existem em test mode; rk_test_ usa price_data
  // inline com os mesmos valores. Flip pra live = trocar a env key, código intacto.
  if (isTestKey) {
    params["line_items[0][price_data][currency]"] = "brl";
    params["line_items[0][price_data][unit_amount]"] = String(valorApp);
    params["line_items[0][price_data][product_data][name]"] = `App ${TITULO}`;
    params["line_items[0][quantity]"] = "1";
    if (bump) {
      params["line_items[1][price_data][currency]"] = "brl";
      params["line_items[1][price_data][unit_amount]"] = String(VALOR_BUMP);
      params["line_items[1][price_data][product_data][name]"] = `${BUMP_TITULO} · no app`;
      params["line_items[1][quantity]"] = "1";
    }
  } else {
    params["line_items[0][price]"] =
      oferta === "metade" || oferta === "leitor" ? PRICE_METADE : PRICE_APP;
    params["line_items[0][quantity]"] = "1";
    if (bump) {
      params["line_items[1][price]"] = BUMP_PRICE;
      params["line_items[1][quantity]"] = "1";
    }
  }

  try {
    const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error("[app-checkout] Stripe:", data.error?.message);
      return NextResponse.json({ error: data.error?.message }, { status: r.status });
    }
    return NextResponse.json({ clientSecret: data.client_secret });
  } catch (err) {
    console.error("[app-checkout] fetch:", (err as Error).message);
    return NextResponse.json({ error: "stripe_unreachable" }, { status: 500 });
  }
}
