import { NextResponse } from "next/server";

/* ============================================================
   TOKENS DA COLEÇÃO COMPLETA (colecao-rede, 22/09/26; a fábrica troca por casa.
   Fonte: _shared/colecao-rede/links.json (preço da coleção) e lib/ebook-delivery.json
   do Pharos (price_app_bump), conta Stripe News Makers)
   ============================================================ */
const SC = "NC";
const NEWS = "Notas do Café";
const PRICE_COLECAO = "price_1UIZpt40q2kXDh5Bxl3KLipz"; // R$ 97 (live, NM)
// Bump = o ebook premium + app da PRÓPRIA casa pela metade (HC 22/09/26)
const BUMP_PRICE = "price_1UC5G340q2kXDh5Bh4c2QQsy"; // R$ 48,50 (live, NM); vazio = casa sem app, sem bump
const BUMP_TITULO = "Café de Balcão no Coador de Casa";
const VALOR_COLECAO = 9700;
const VALOR_BUMP = 4850;
// A janela da campanha: depois de sexta 25/09/26 23:59:59 (BRT) a rota recusa criar session (a copy
// promete que o link fecha). Reabrir = trocar esta constante e subir.
const FECHA_EM_MS = Date.UTC(2026, 8, 26, 2, 59, 59); // 25/09/26 23:59:59 BRT = 26/09 02:59:59 UTC

export async function POST(req: Request) {
  // Conta Stripe = News Makers (decisão HC 31/08, ticket app/14), nunca a VDN.
  const apiKey = process.env.STRIPE_API_KEY_NM;
  if (!apiKey) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 500 });
  }
  // Mesmo gate de dinheiro vivo do ebook (decisão HC 19/07): sem EBOOK_LIVE=1, só key de teste cria session.
  const isTestKey = apiKey.startsWith("sk_test_") || apiKey.startsWith("rk_test_");
  if (!isTestKey && process.env.EBOOK_LIVE !== "1") {
    return NextResponse.json({ error: "live_gated" }, { status: 503 });
  }
  if (Date.now() > FECHA_EM_MS) {
    return NextResponse.json({ error: "janela_fechada" }, { status: 410 });
  }

  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const bump = body?.bump === true && Boolean(BUMP_PRICE);

  const origin = new URL(req.url).origin;
  const params: Record<string, string> = {
    ui_mode: "embedded",
    mode: "payment",
    locale: "pt-BR",
    return_url: `${origin}/colecao/obrigado?session_id={CHECKOUT_SESSION_ID}&v=${bump ? VALOR_COLECAO + VALOR_BUMP : VALOR_COLECAO}`,
    // Contrato: o webhook central do Pharos ignora este produto (price fora do mapa dos ebooks);
    // quem entrega a coleção e o bump é a vigia (_shared/colecao-rede/vigia.py), lendo as sessions
    // pagas pelo price da coleção nos line_items e pelo metadata abaixo.
    "metadata[produto]": "colecao",
    "metadata[sc]": SC,
    "adaptive_pricing[enabled]": "false",
  };
  if (bump) params["metadata[bump]"] = "app";

  // Jornada e origem (mesmo desenho do app-checkout): a vigia grava em ebook_purchases.journey_id/src.
  const curto = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 120) : "");
  const journey = curto(body?.journey);
  const src = curto(body?.src);
  if (journey) params["metadata[journey]"] = journey;
  params["metadata[src]"] = src || "lp-colecao";
  const variante = curto(body?.checkout_variant);
  if (variante) params["metadata[checkout_variant]"] = variante;
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

  params["payment_intent_data[description]"] = `Colecao completa ${NEWS} (${SC})` + (bump ? ` + bump ebook e app` : "");
  params["payment_intent_data[statement_descriptor_suffix]"] = `COLECAO ${SC}`.slice(0, 22);

  // ponytail: price IDs live não existem em test mode; rk_test_ usa price_data inline com os mesmos valores.
  if (isTestKey) {
    params["line_items[0][price_data][currency]"] = "brl";
    params["line_items[0][price_data][unit_amount]"] = String(VALOR_COLECAO);
    params["line_items[0][price_data][product_data][name]"] = `Colecao completa ${NEWS}`;
    params["line_items[0][quantity]"] = "1";
    if (bump) {
      params["line_items[1][price_data][currency]"] = "brl";
      params["line_items[1][price_data][unit_amount]"] = String(VALOR_BUMP);
      params["line_items[1][price_data][product_data][name]"] = `${BUMP_TITULO} · ebook + app`;
      params["line_items[1][quantity]"] = "1";
    }
  } else {
    params["line_items[0][price]"] = PRICE_COLECAO;
    params["line_items[0][quantity]"] = "1";
    if (bump) {
      params["line_items[1][price]"] = BUMP_PRICE;
      params["line_items[1][quantity]"] = "1";
    }
  }

  try {
    // HC 18/09/26 (nota fiscal): nome e endereço pelo bloco nativo da Stripe (Customer criado sempre),
    // CPF por custom field (o tax_id_collection da Stripe não cobre o Brasil).
    params["billing_address_collection"] = "required";
    params["customer_creation"] = "always";
    params["custom_fields[0][key]"] = "cpf";
    params["custom_fields[0][label][type]"] = "custom";
    params["custom_fields[0][label][custom]"] = "CPF ou CNPJ (só números)";
    params["custom_fields[0][type]"] = "numeric";
    params["custom_fields[0][numeric][minimum_length]"] = "11";
    params["custom_fields[0][numeric][maximum_length]"] = "14";
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
      console.error("[colecao-checkout] Stripe:", data.error?.message);
      return NextResponse.json({ error: data.error?.message }, { status: r.status });
    }
    return NextResponse.json({ clientSecret: data.client_secret });
  } catch (err) {
    console.error("[colecao-checkout] fetch:", (err as Error).message);
    return NextResponse.json({ error: "stripe_unreachable" }, { status: 500 });
  }
}
