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
// D+3 da Escada de Ascensão (c4-20k/58, golden da EE no 57): o dono do ebook desta casa chega
// com `oferta=dono27` e o email. Até compra + 5 d, contados pela linha do banco (nunca pelo
// `ate=` do link, esse é só pra tela), paga R$ 27, o valor do ebook; vencido cai em `dono`, a
// metade pelo price do leitor (price_app_leitor do catálogo); sem posse, cheio.
const PRICE_DONO = "price_1UCLTr40q2kXDh5BsAem5o8F"; // R$ 48,50 (live, NM, price_app_leitor)
const PRICE_DONO27 = "price_1UFDqg40q2kXDh5BolQmTD8A"; // R$ 27 (live, NM, canal ascensao-d3)
const VALOR_DONO27 = 2700;
const JANELA_DONO27_S = 5 * 86400;

/**
 * A primeira linha paga do EBOOK desta casa pro email, ou null. Service role no servidor,
 * nunca no cliente. A data da compra é o relógio da janela do `dono27`.
 */
async function compraDoEbook(email: string): Promise<{ created_at: string } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const q = new URLSearchParams({
    select: "created_at",
    email: `eq.${email}`,
    sc: `eq.${SC}`,
    produto: "eq.ebook",
    payment_status: "eq.paid",
    order: "created_at.asc",
    limit: "1",
  });
  try {
    const r = await fetch(`${url}/rest/v1/ebook_purchases?${q}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!r.ok) return null;
    const rows = (await r.json()) as Array<{ created_at: string }>;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/** `dono27` dentro da janela (compra + 5 d)? Fora dela vira `dono`; sem posse, vazio. */
function resolveDono(oferta: string, compra: { created_at: string } | null, agoraMs: number): string {
  if (!compra) return "";
  if (oferta !== "dono27") return oferta;
  const t = Date.parse(compra.created_at);
  return Number.isFinite(t) && agoraMs < t + JANELA_DONO27_S * 1000 ? "dono27" : "dono";
}

/* c4-20k/93 (HC 15/09/26, EXP de cadência da Monetização): o bônus da `oferta=bonus` pode vir com
   prazo. `fim=<dia>-<HHMM>` é a gramática do contador do email: vale da segunda 00:00 até <dia>
   HH:MM:59 da mesma semana, relógio BRT (UTC-3 fixo). `ate=<epoch>` vale até o instante. Com os
   dois, os dois valem; sem nenhum, ou ilegível, sem prazo (a recuperação do app segue igual). */
function bonusNoPrazo(fim: unknown, ate: unknown, agoraMs: number): boolean {
  const f = /^(seg|ter|qua|qui|sex|sab|dom)-([01]\d|2[0-3])([0-5]\d)$/.exec(String(fim ?? "").trim());
  if (f) {
    const brt = new Date(agoraMs - 3 * 3600 * 1000);
    const hoje = (brt.getUTCDay() + 6) % 7; // segunda = 0, domingo = 6
    const dia = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"].indexOf(f[1]);
    const agoraS = brt.getUTCHours() * 3600 + brt.getUTCMinutes() * 60 + brt.getUTCSeconds();
    if (hoje > dia || (hoje === dia && agoraS > Number(f[2]) * 3600 + Number(f[3]) * 60 + 59)) return false;
  }
  let a = Number(String(ate ?? "").trim());
  if (a > 1e12) a = Math.floor(a / 1000); // epoch em ms, como o contador aceita
  return !(Number.isFinite(a) && a > 0 && agoraMs >= a * 1000);
}

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
  let oferta = ["bonus", "metade", "leitor", "dono", "dono27"].includes(String(body?.oferta)) ? String(body.oferta) : "";
  // `+` do email chega como espaço quando o merge tag do beehiiv não vem url-encoded.
  const email = String(body?.email ?? "").replace(/ /g, "+").trim().toLowerCase();
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && !email.includes("{");
  if (oferta === "dono" || oferta === "dono27") {
    oferta = resolveDono(oferta, emailOk ? await compraDoEbook(email) : null, Date.now());
  }
  // c4-20k/93: `oferta=bonus` com `fim`/`ate` vencido sai sem o bônus (app cheio, bump card de volta).
  const bonusVencido = oferta === "bonus" && !bonusNoPrazo(body?.fim, body?.ate, Date.now());
  if (bonusVencido) oferta = "";
  const bump = body?.bump === true && oferta !== "bonus";
  const valorApp =
    oferta === "metade" || oferta === "leitor" || oferta === "dono" ? VALOR_METADE : oferta === "dono27" ? VALOR_DONO27 : VALOR_APP;

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
  if (bonusVencido) params["metadata[oferta_vencida]"] = "bonus";
  // O dono paga com o email que tem o ebook: a linha do app cai no mesmo email e a posse fecha sozinha.
  if (oferta === "dono" || oferta === "dono27") params.customer_email = email;

  // Jornada e origem (mesmo desenho do create-session do ebook): o webhook persiste
  // em ebook_purchases.journey_id/src e cada real fica colado no caminho.
  const curto = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, 120) : "";
  const journey = curto(body?.journey);
  const src = curto(body?.src);
  if (journey) params["metadata[journey]"] = journey;
  params["metadata[src]"] = src || "lp-app";
  // app-scriptorium/55: o braço do checkout ("golden" sem split, "hA-bB" quando as chaves
  // ligarem) viaja na metadata da session pra separar A e B por jornada no rio do C4.
  const variante = curto(body?.checkout_variant);
  if (variante) params["metadata[checkout_variant]"] = variante;
  // EXP-072 (app-scriptorium/66): braço do destino do clique do banner (lp = passou pela LP, ck = caiu direto
  // aqui), lido pela página do `?d=` ou do cookie `app_dst`. Viaja na metadata pra compra ficar colada no braço.
  const dst = body?.dst === "lp" || body?.dst === "ck" ? String(body.dst) : "";
  if (dst) params["metadata[dst]"] = dst;
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
    (oferta === "metade" ? " metade" : oferta === "leitor" ? " leitor do ebook" : oferta === "dono" ? " dono do ebook" : oferta === "dono27" ? " dono do ebook, janela D+3" : "") +
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
      oferta === "metade" || oferta === "leitor" ? PRICE_METADE : oferta === "dono" ? PRICE_DONO : oferta === "dono27" ? PRICE_DONO27 : PRICE_APP;
    params["line_items[0][quantity]"] = "1";
    if (bump) {
      params["line_items[1][price]"] = BUMP_PRICE;
      params["line_items[1][quantity]"] = "1";
    }
  }

  try {
    // HC 18/09/26 (nota fiscal): o eNotas emite a NF com nome, CPF/CNPJ e endereço com CEP.
    // Nome e endereço pelo bloco nativo da Stripe (Customer criado sempre, que é onde o eNotas
    // lê); CPF por custom field, porque o tax_id_collection da Stripe não cobre o Brasil.
    // O webhook central do Pharos transforma tudo em metadata user_* na venda.
    params["billing_address_collection"] = "required";
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
      console.error("[app-checkout] Stripe:", data.error?.message);
      return NextResponse.json({ error: data.error?.message }, { status: r.status });
    }
    // `oferta` de volta: a página só escreve R$ 27 ou R$ 48,50 quando a posse foi confirmada aqui.
    return NextResponse.json({ clientSecret: data.client_secret, oferta });
  } catch (err) {
    console.error("[app-checkout] fetch:", (err as Error).message);
    return NextResponse.json({ error: "stripe_unreachable" }, { status: 500 });
  }
}
