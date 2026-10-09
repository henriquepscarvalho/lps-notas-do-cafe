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
const BUMP_PRICE = "price_1UIojp40q2kXDh5BbZVpodcE"; // R$ 48,50 (live, NM); vazio = casa sem app, sem bump
const BUMP_TITULO = "Coleção completa · Brasa Certa";
const BUMP_SC = "BC"; // a news do par (colecao-rede, col/08)
const VALOR_COLECAO = 9700;
const VALOR_BUMP = 4850;
// col/27 (HC 29/09/26): resgate da rodada 2, email 2 com a coleção pela metade até segunda 05/10 23:59 BRT.
// Cupom colecao-metade-4850 da NM: R$ 48,50 de desconto, uma vez, só nos 30 produtos da Coleção. Valor fixo de
// propósito: o bump da irmã é o produto da Coleção dela, e 50% cortaria o bump junto (provado em live, 29/09).
// Fora da janela o pedido de metade sai com o preço cheio.
const CUPOM_METADE = "colecao-metade-4850";
const METADE_DE = Date.parse("2026-10-04T00:00:00-03:00");
const METADE_ATE = Date.parse("2026-10-05T23:59:59-03:00");
// HC 28/09/26 (col/06): o checkout fica aberto depois da campanha. O 410 de sexta só mostrava o erro da
// Stripe em inglês («Something went wrong»), sem sensação de perda pro leitor e 122 visitas em 3 dias sem
// venda. Fechar de novo = voltar a data e o if de lp/route.ts.tpl.bak-aberto-2809.

/* EXP-124 (HC 08/10/26, modelo do checkout do OQEL): o braço B monta o pedido na página e só cria a session no
   «Finalizar o pedido», então pergunta na carga, sem tocar na Stripe, o preço de hoje (a mesma conta do POST: cheio,
   ou metade dentro da janela do col/27) e se a casa tem bump. Quando a rodada fechar pela rota (o if do 410, molde
   route.ts.tpl.bak-aberto-2809), o mesmo if entra aqui antes da resposta: o B lê o 410 na carga e mostra o aviso do A. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const agora = Date.now();
  const metade = q.get("oferta") === "metade" && agora >= METADE_DE && agora <= METADE_ATE;
  return NextResponse.json(
    { aberto: true, valor: metade ? VALOR_COLECAO / 2 : VALOR_COLECAO, cheio: VALOR_COLECAO, bump: BUMP_PRICE ? VALOR_BUMP : 0 },
    { headers: { "Cache-Control": "no-store" } },
  );
}

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

  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const bump = body?.bump === true && Boolean(BUMP_PRICE);

  const agora = Date.now();
  const metade = body?.oferta === "metade" && agora >= METADE_DE && agora <= METADE_ATE;
  const valorColecao = metade ? VALOR_COLECAO / 2 : VALOR_COLECAO;

  const origin = new URL(req.url).origin;
  const params: Record<string, string> = {
    ui_mode: "embedded",
    mode: "payment",
    locale: "pt-BR",
    return_url: `${origin}/colecao/obrigado?session_id={CHECKOUT_SESSION_ID}&v=${bump ? valorColecao + VALOR_BUMP : valorColecao}`,
    // Contrato: o webhook central do Pharos ignora este produto (price fora do mapa dos ebooks);
    // quem entrega a coleção e o bump é a vigia (_shared/colecao-rede/vigia.py), lendo as sessions
    // pagas pelo price da coleção nos line_items e pelo metadata abaixo.
    "metadata[produto]": "colecao",
    "metadata[sc]": SC,
    "adaptive_pricing[enabled]": "false",
  };
  // Bump = coleção completa da news do par pela metade (HC 23/09/26, col/08): a vigia entrega o PDF
  // pela automação 💎 [Entrega] da news do par, lendo metadata bump_sc.
  if (bump) {
    params["metadata[bump]"] = "colecao";
    params["metadata[bump_sc]"] = BUMP_SC;
  }

  // Jornada e origem (mesmo desenho do app-checkout): a vigia grava em ebook_purchases.journey_id/src.
  const curto = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 120) : "");
  const journey = curto(body?.journey);
  const src = curto(body?.src);
  if (journey) params["metadata[journey]"] = journey;
  params["metadata[src]"] = src || "lp-colecao";
  const variante = curto(body?.checkout_variant);
  if (variante) params["metadata[checkout_variant]"] = variante;
  // EXP-124: braço do modelo do checkout (a = 3 colunas de hoje, b = pedido do OQEL); a leitura separa a receita por braço aqui.
  const modelo = curto(body?.ck_modelo).toLowerCase();
  if (/^[abc]$/.test(modelo)) params["metadata[ck_modelo]"] = modelo;
  // No B a Stripe abre dentro da folha do pedido: no papel dela e com o botão na cor da casa, igual à Estante. Quem
  // pede a moldura é a página do B, mandando o hex em `ck_cor` (validado aqui); o A nunca manda. Vale também no
  // braço forçado por `?v=B`, que sai sem carimbo. Só a moldura muda; itens, valores e metadados são os do A.
  const ckCor = String(body?.ck_cor ?? "").toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(ckCor)) {
    params["branding_settings[background_color]"] = "#F7F1E6";
    params["branding_settings[border_style]"] = "rounded";
    params["branding_settings[font_family]"] = "inter";
    params["branding_settings[button_color]"] = ckCor;
  }
  // col/28: id do assinante da beehiiv (sid={{subscriber_id}} do link do email, uuid sem sub_). A session só ganha email
  // quando paga; com o sid, quem tocou no formulário e saiu vira pessoa (GET /subscriptions/by_subscriber_id/{uuid}).
  // Só uuid: merge tag cru ou robô cai fora.
  const sid = curto(body?.sid).toLowerCase();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(sid)) params["metadata[beehiiv_sid]"] = sid;
  if (metade) params["metadata[oferta]"] = "metade";
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

  params["payment_intent_data[description]"] = `Colecao completa ${NEWS} (${SC})` + (bump ? ` + bump colecao ${BUMP_SC}` : "");
  params["payment_intent_data[statement_descriptor_suffix]"] = `COLECAO ${SC}`.slice(0, 22);

  // ponytail: price IDs live não existem em test mode; rk_test_ usa price_data inline com os mesmos valores.
  if (isTestKey) {
    params["line_items[0][price_data][currency]"] = "brl";
    params["line_items[0][price_data][unit_amount]"] = String(valorColecao);
    params["line_items[0][price_data][product_data][name]"] = `Colecao completa ${NEWS}`;
    params["line_items[0][quantity]"] = "1";
    if (bump) {
      params["line_items[1][price_data][currency]"] = "brl";
      params["line_items[1][price_data][unit_amount]"] = String(VALOR_BUMP);
      params["line_items[1][price_data][product_data][name]"] = `${BUMP_TITULO}`;
      params["line_items[1][quantity]"] = "1";
    }
  } else {
    params["line_items[0][price]"] = PRICE_COLECAO;
    params["line_items[0][quantity]"] = "1";
    if (metade) params["discounts[0][coupon]"] = CUPOM_METADE;
    if (bump) {
      params["line_items[1][price]"] = BUMP_PRICE;
      params["line_items[1][quantity]"] = "1";
    }
  }

  try {
    // HC 18/09/26 (nota fiscal): Customer criado sempre e CPF por custom field (o
    // tax_id_collection da Stripe não cobre o Brasil).
    // checkout-sem-endereco-v1 (HC 01/10/26): produto digital, sem bloco de endereço no checkout. Endereço
    // só chega quando a própria Stripe pede (boleto); o webhook do Pharos grava user_* vazio no resto.
    params["customer_creation"] = "always";
    params["custom_fields[0][key]"] = "cpf";
    params["custom_fields[0][label][type]"] = "custom";
    params["custom_fields[0][label][custom]"] = "CPF ou CNPJ (só números)";
    params["custom_fields[0][type]"] = "numeric";
    params["custom_fields[0][numeric][minimum_length]"] = "11";
    params["custom_fields[0][numeric][maximum_length]"] = "14";
    // c4-20k/126 (HC 23/09/26): cartão salvo religado só no cartão, pro upsell de um clique da obrigado.
    // No nível do PaymentIntent a Stripe tirava o Pix da session inteira (24/08); no nível do cartão
    // Pix e boleto seguem na session e só o cartão fica ligado ao Customer.
    params["payment_method_options[card][setup_future_usage]"] = "off_session";
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
