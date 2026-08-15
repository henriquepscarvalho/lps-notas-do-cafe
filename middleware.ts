import { NextRequest, NextResponse } from "next/server";

/**
 * Porta de venda do ebook: dois sorteios independentes na borda.
 *
 *  EXP-031 (ticket 37 do quiz-vsl-ebooks) — ENCERRADO em 15/08/26, o braço V
 *    perdeu. Detalhe no corte lá embaixo; o cookie `lp_v` só sobrevive pra escrever
 *    N por cima de quem ficou preso no V.
 *  EXP-027 — cookie `lp_eb`, 50/50 entre as LPs, agora com todo o tráfego:
 *    A → /ebook-premium   B → /ebook-premium-b
 *
 * CORTE 15/08/26 (decisão do HC): o braço C (calculadora do vazamento) saiu do
 * sorteio. Puxava mais gente pro checkout que todo mundo (20,0% contra 11,4% do A)
 * e fechava quase ninguém lá dentro (2,3% contra 9,1% do A e 9,2% do B), então
 * gerou R$ 81,00 contra R$ 364,50 do B no mesmo período. Pela regra de braço
 * perdedor do EXP-027, `/ebook-premium-c` fica no matcher e passa a redirecionar
 * pro braço vivo, então link velho compartilhado não morre nem volta a mostrar a
 * calculadora. Quem tinha `lp_eb=C` re-sorteia entre A e B no primeiro hit, porque
 * `valid()` não aceita mais C.
 *
 * A bifurcação mora AQUI, na porta, e não na copy: o banner da edição diária e a
 * automação de monetização continuam apontando pro mesmo /ebook-premium, então as
 * duas superfícies entram no teste sem reescrever nenhum email nem reassar nenhuma
 * edição.
 *
 * Quem clica num link de venda da própria news chega trabalhado, então não paga o
 * pedágio de 15 perguntas antes de um vídeo de R$ 27 (decisão do HC em 04/08). O
 * teste segue vivo em `/teste`, como porta do tráfego FRIO (ticket 38) e como link
 * direto, fora deste sorteio.
 *
 * Chave PRÓPRIA de propósito: o `lp_q` do EXP-029 já está gravado em quem passou
 * pelo teste, e reusar essa chave deixaria no braço V gente que já viu o
 * diagnóstico, contaminando a primeira leitura da VSL direta. O `lp_eb` tem o mesmo
 * problema desde 27/07. Com `lp_v` todo mundo re-sorteia a porta e ninguém perde a
 * variante de LP que já tinha.
 *
 * Sorteio antes de qualquer render/beacon; cookies de 1 ano; redirect 307. Hit
 * direto em -b (link compartilhado) não sorteia. `?v=a|b|v` força pra revisão
 * sem gravar o sorteio forçado.
 */

const COOKIE = "lp_eb";
const VCOOKIE = "lp_v";
const ROUTE: Record<string, string> = {
  A: "/ebook-premium",
  B: "/ebook-premium-b",
};
const VROUTE = "/vsl";

function valid(v: string | undefined | null): "A" | "B" | null {
  return v === "A" || v === "B" ? v : null;
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  const f = (searchParams.get("v") || "").toUpperCase();
  const routeV = pathname === "/ebook-premium-b" ? "B" : null;

  // CORTE 15/08/26 (ticket 15 do c4-b5-b6-b7): o EXP-031 acabou e o braço V perdeu.
  // Em 12 de 12 origens pareadas a LP de vendas bateu a VSL: 438 entradas viraram 10
  // checkouts (2,3%) contra 431 virando 69 (16,0%), 7 vezes de diferença. Nem quem
  // apertou o play escapou: 6,0% contra 15,2% da LP, nas 3 news que medem play. O
  // sorteio morre e todo mundo entra pela LP de vendas. Gravar "N" por cima ainda
  // resgata quem tinha caído no V e ficaria preso nele por um ano de cookie. A /vsl
  // segue viva fora do matcher, pro /teste (tráfego frio), pro link do WhatsApp e
  // pro ?v=V de revisão.
  const sorteio = "N";
  // porta: só o ?v=V de revisão manda pra VSL. Com o sorteio morto isto é o que
  // sobrou de `f === "V" ? true : valid(f) || routeV ? false : sorteio === "V"`,
  // e escrever a comparação com o literal "N" reprovaria no typecheck (TS2367).
  const vsl = f === "V";

  // variante da LP: vale para quem não caiu na VSL, e sobrevive ao sorteio da porta
  const variant =
    valid(f) ?? routeV ?? valid(req.cookies.get(COOKIE)?.value)
    ?? (Math.random() < 0.5 ? "A" : "B");

  const canonical = vsl ? VROUTE : ROUTE[variant];
  let res: NextResponse;
  if (pathname !== canonical) {
    const url = req.nextUrl.clone(); // preserva query (?internal, ?jump, ?v)
    // carimbo de origem quando a jornada chega sem ?src=; sem ele a visita da
    // automação trocaria de origem só por cair no braço V, e a régua de canal do
    // report perderia o pé
    // com utm_campaign na URL o email já vem carimbado; anexar o default aqui
    // sobrescreveria o carimbo (src explícito vence utm no beacon)
    if (vsl && !searchParams.get("src") && !searchParams.get("utm_campaign"))
      url.searchParams.set("src", "ebook-premium");
    url.pathname = canonical;
    res = NextResponse.redirect(url, 307);
  } else {
    res = NextResponse.next();
  }

  const ano = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" as const };
  res.cookies.set(COOKIE, variant, ano);
  res.cookies.set(VCOOKIE, sorteio, ano); // grava o sorteio, nunca o ?v= forçado
  return res;
}

export const config = {
  matcher: ["/ebook-premium", "/ebook-premium-b", "/ebook-premium-c"],
};