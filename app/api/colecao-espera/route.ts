import { NextResponse } from "next/server";

/* col/14 (HC 28/09/26, opção A): lista de espera da Coleção sem mailto. A LP /colecao no estado «espera» manda o email
   pra cá; a rota cria (ou reativa) a inscrição na beehiiv com o custom field colecao_espera = data, e enrola na automação
   🛍️ [Venda] Lista de espera (1 email com o link direto do checkout, que segue aberto). Mesma env do /api/subscribe (BEEHIIV_API_KEY).
   Ids fixos por casa entram pela fábrica (colecao_fabrica.py): publicação e automação. */
export const runtime = "nodejs";

const PUB_ID: string = "pub_809b90ba-6880-457e-b688-dd045d10d2ed";
const AUT_ID: string = "aut_abbe4a70-9789-4bff-b245-29e40cd32b77";
const SC: string = "NC";

type Body = { email?: string; src?: string };

async function bhPost(url: string, body: Record<string, unknown>, key: string) {
  const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  let res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  // 429 da beehiiv traz ratelimit-reset (epoch s): esperar até o reset, teto de 20 s (o leitor está na frente do form)
  for (let i = 0; i < 3 && res.status === 429; i++) {
    const reset = Number(res.headers.get("ratelimit-reset"));
    const ms = Number.isFinite(reset) && reset > 0 ? Math.min(Math.max(reset * 1000 - Date.now() + 1000, 1000), 20000) : 2000 * (i + 1);
    await new Promise((r) => setTimeout(r, ms));
    res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  }
  return res;
}

export async function POST(req: Request) {
  const key = process.env.BEEHIIV_API_KEY;
  if (!key || !PUB_ID) {
    return NextResponse.json({ error: "sem chave" }, { status: 500 });
  }
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "corpo inválido" }, { status: 400 });
  }
  const email = String(body.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "email inválido" }, { status: 400 });
  }
  const src = String(body.src || "lp-colecao-espera").slice(0, 80);
  // data no fuso da casa (BRT), não em UTC: depois das 21:00 o dia já virava (prova de 28/09)
  const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  const payload: Record<string, unknown> = {
    email,
    reactivate_existing: true,
    send_welcome_email: false,
    utm_source: "colecao-espera",
    utm_medium: src,
    utm_campaign: `colecao-espera-${SC.toLowerCase()}`,
    custom_fields: [{ name: "colecao_espera", value: hoje }],
  };
  const subUrl = `https://api.beehiiv.com/v2/publications/${PUB_ID}/subscriptions`;
  let subRes = await bhPost(subUrl, payload, key);
  if (!subRes.ok) {
    // o custom field nunca derruba o cadastro: tenta sem ele
    delete payload.custom_fields;
    subRes = await bhPost(subUrl, payload, key);
  }
  if (!subRes.ok) {
    const err = await subRes.text();
    console.error("colecao-espera: beehiiv subscription", subRes.status, err.slice(0, 300));
    return NextResponse.json({ error: "beehiiv", source: "bh" }, { status: 502 });
  }

  let enrolado = false;
  if (AUT_ID && AUT_ID !== "placeholder") {
    const jr = await bhPost(`https://api.beehiiv.com/v2/publications/${PUB_ID}/automations/${AUT_ID}/journeys`, { email, double_opt_override: "true" }, key);
    enrolado = jr.ok;
    if (!jr.ok) {
      console.error("colecao-espera: journey", jr.status, (await jr.text()).slice(0, 300));
    }
  }
  return NextResponse.json({ ok: true, enrolado });
}
