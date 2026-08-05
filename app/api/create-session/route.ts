import { NextResponse } from "next/server";

/* ============================================================
   TOKENS DA NEWS (a fábrica troca por news; fonte: stripe-produtos.json
   do ticket 12 do build-ebooks-premium)
   ============================================================ */
const SC = "NC";
const PRICE_CHEIO = "price_1TukzgLXu3X73K7LaGbdeElv"; // R$ 27 (live)
const TITULO = "Café de Balcão no Coador de Casa";
// Bump = ebook irmão SELADO (bump-pareamento.json, HC 19/07): WS → BZ
const BUMP_SC = "BC";
const BUMP_PRICE = "price_1TukzeLXu3X73K7LdM980r2a"; // bump BC R$ 13,50 (live)
const BUMP_TITULO = "Brasa Pronta em 20 Minutos";

export async function POST(req: Request) {
  const apiKey = process.env.STRIPE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 500 });
  }
  // Gate de dinheiro vivo (decisão HC 19/07): sem o flip explícito EBOOK_LIVE=1,
  // só key de teste cria session. Default-deny: live keys vêm como sk_live_ E
  // rk_live_ (restricted), então o gate é "não é test", não "é live".
  const isTestKey = apiKey.startsWith("sk_test_") || apiKey.startsWith("rk_test_");
  if (!isTestKey && process.env.EBOOK_LIVE !== "1") {
    return NextResponse.json({ error: "live_gated" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const bump = body?.bump === true;

  // Variante do split A/B/C (EXP-027): sai do cookie lp_eb que o middleware setou
  // na borda. Carimba em metadata.variant → o webhook central persiste em
  // ebook_purchases.variant (atribuição de venda por braço, ticket 10).
  const variant = (req.headers.get("cookie") || "").match(/(?:^|;\s*)lp_eb=([ABC])(?:;|$)/)?.[1];

  const origin = new URL(req.url).origin;
  const params: Record<string, string> = {
    ui_mode: "embedded",
    mode: "payment",
    locale: "pt-BR", // leitor BR sempre vê o checkout em português, browser que for

    return_url: `${origin}/ebook-premium/obrigado?session_id={CHECKOUT_SESSION_ID}`,
    "metadata[sc]": SC, // contrato do webhook central (ticket 11): resolve o ebook pelo sc
  };
  if (variant) params["metadata[variant]"] = variant;
  if (bump) params["metadata[bump]"] = BUMP_SC;
  // Jornada e origem (decisão HC 05/08): o webhook central persiste em
  // ebook_purchases.journey_id/src e aí cada real fica colado no caminho (teste, VSL
  // direta, LP) e no canal que trouxe a venda. Sem isso, receita por caminho é só o
  // piso do beacon da /obrigado. Metadata do Stripe tem teto de 500 caracteres por
  // valor, então corta curto e nunca deixa a chave existir vazia.
  const curto = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, 120) : "";
  const journey = curto(body?.journey);
  const src = curto(body?.src);
  if (journey) params["metadata[journey]"] = journey;
  if (src) params["metadata[src]"] = src;

  // Sem description o email de venda e a lista do Dashboard mostram so o valor
  // (metadata nao aparece la). Suffix: fatura do cartao vira "NEWSLETTER* EBOOK <SC>"
  // (prefix 10 + "* " + suffix <= 10 = teto de 22 do cartao; boleto ignora).
  params["payment_intent_data[description]"] =
    `Ebook ${TITULO} (${SC})` + (bump ? ` + bump ${BUMP_SC}` : "");
  params["payment_intent_data[statement_descriptor_suffix]"] = `EBOOK ${SC}`;

  // ponytail: price IDs live não existem em test mode; sk_test_ usa price_data
  // inline com os mesmos valores. Flip pra live = trocar a env key, código intacto.
  if (isTestKey) {
    params["line_items[0][price_data][currency]"] = "brl";
    params["line_items[0][price_data][unit_amount]"] = "2700";
    params["line_items[0][price_data][product_data][name]"] = `Ebook ${TITULO}`;
    params["line_items[0][quantity]"] = "1";
    if (bump) {
      params["line_items[1][price_data][currency]"] = "brl";
      params["line_items[1][price_data][unit_amount]"] = "1350";
      params["line_items[1][price_data][product_data][name]"] = `Ebook ${BUMP_TITULO}`;
      params["line_items[1][quantity]"] = "1";
    }
  } else {
    params["line_items[0][price]"] = PRICE_CHEIO;
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
      console.error("[checkout] Stripe:", data.error?.message);
      return NextResponse.json({ error: data.error?.message }, { status: r.status });
    }
    return NextResponse.json({ clientSecret: data.client_secret });
  } catch (err) {
    console.error("[checkout] fetch:", (err as Error).message);
    return NextResponse.json({ error: "stripe_unreachable" }, { status: 500 });
  }
}
