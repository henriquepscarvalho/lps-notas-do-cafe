import { NextRequest, NextResponse } from "next/server";

/**
 * Porta de venda do ebook: dois sorteios independentes na borda.
 *
 *  EXP-029 (ticket 24 do quiz-vsl-ebooks) — cookie `lp_q`, 50/50:
 *    Q → /teste (quiz de diagnóstico + VSL)   N → a LP de vendas de sempre
 *  EXP-027 — cookie `lp_eb`, 1/3 entre as LPs, só para quem caiu no N:
 *    A → /ebook-premium   B → /ebook-premium-b   C → /ebook-premium-c
 *
 * A bifurcação pro quiz mora AQUI, na porta, e não na copy: o banner da edição
 * diária e a automação de monetização continuam apontando pro mesmo
 * /ebook-premium, então as duas superfícies entram no teste sem reescrever
 * nenhum email nem reassar nenhuma edição.
 *
 * Chave PRÓPRIA de propósito: o `lp_eb` já está gravado desde 27/07 em quem
 * visitou a LP, e reusar essa chave deixaria o braço Q só com visitante novo,
 * comparando duas populações diferentes. Com `lp_q` todo mundo re-sorteia a
 * porta e ninguém perde a variante de LP que já tinha.
 *
 * Sorteio antes de qualquer render/beacon; cookies de 1 ano; redirect 307. Hit
 * direto em -b/-c (link compartilhado) não sorteia. `?v=a|b|c|q` força pra
 * revisão sem gravar o sorteio forçado.
 */

const COOKIE = "lp_eb";
const QCOOKIE = "lp_q";
const ROUTE: Record<string, string> = {
  A: "/ebook-premium",
  B: "/ebook-premium-b",
  C: "/ebook-premium-c",
};
const QROUTE = "/teste";

function valid(v: string | undefined | null): "A" | "B" | "C" | null {
  return v === "A" || v === "B" || v === "C" ? v : null;
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  const f = (searchParams.get("v") || "").toUpperCase();
  const routeV = pathname === "/ebook-premium-b" ? "B" : pathname === "/ebook-premium-c" ? "C" : null;

  const qRaw = req.cookies.get(QCOOKIE)?.value;
  const q = qRaw === "Q" || qRaw === "N" ? qRaw : Math.random() < 0.5 ? "Q" : "N";
  // porta: ?v= (revisão) > rota direta -b/-c > sorteio do EXP-029
  const quiz = f === "Q" ? true : valid(f) || routeV ? false : q === "Q";

  // variante da LP: vale para quem não caiu no quiz, e sobrevive ao sorteio da porta
  const variant =
    valid(f) ?? routeV ?? valid(req.cookies.get(COOKIE)?.value)
    ?? (["A", "B", "C"] as const)[Math.floor(Math.random() * 3)];

  const canonical = quiz ? QROUTE : ROUTE[variant];
  let res: NextResponse;
  if (pathname !== canonical) {
    const url = req.nextUrl.clone(); // preserva query (?internal, ?jump, ?v)
    // o quiz carimba source="quiz" quando a jornada chega sem ?src=; sem este
    // carimbo a visita da automação trocaria de origem só por cair no braço Q,
    // e a régua de canal do report perderia o pé
    if (quiz && !searchParams.get("src")) url.searchParams.set("src", "ebook-premium");
    url.pathname = canonical;
    res = NextResponse.redirect(url, 307);
  } else {
    res = NextResponse.next();
  }

  const ano = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" as const };
  res.cookies.set(COOKIE, variant, ano);
  res.cookies.set(QCOOKIE, q, ano); // grava o sorteio, nunca o ?v= forçado
  return res;
}

export const config = {
  matcher: ["/ebook-premium", "/ebook-premium-b", "/ebook-premium-c"],
};
