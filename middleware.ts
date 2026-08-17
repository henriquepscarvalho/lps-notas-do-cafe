import { NextRequest, NextResponse } from "next/server";

/**
 * Porta de venda do ebook: os dois experimentos da porta ESTÃO ENCERRADOS.
 *
 *  EXP-031 — encerrado em 15/08/26, o braço V (VSL) perdeu. O cookie `lp_v` só
 *    sobrevive pra escrever N por cima de quem ficou preso no V.
 *  EXP-027 — encerrado em 17/08/26, a variante B (editorial quente) VENCEU:
 *    +62% relativo em LP→checkout sobre a A (17,4% contra 10,7%, p=0,00008,
 *    839/856 visitas por braço) sem queda no guardrail checkout→venda (8,7%
 *    contra 8,9%). Parada antecipada decidida pelo HC em 16/08, antes da
 *    leitura pré-registrada de 31/08 e abaixo do mínimo de 2.000 visitas por
 *    braço; registro completo no experiments.json. O sorteio morre e TODO o
 *    tráfego da porta cai na /ebook-premium-b.
 *
 * Pela regra de propagação do EXP-027, /ebook-premium e /ebook-premium-c ficam
 * no matcher redirecionando pro braço vencedor: link velho compartilhado, o
 * banner da edição diária e a automação de monetização continuam apontando pro
 * mesmo /ebook-premium e chegam na B sem reescrever nenhum email nem reassar
 * nenhuma edição. Gravar `lp_eb=B` por cima resgata quem tinha caído no A e
 * ficaria preso nele por um ano de cookie.
 *
 * ALQ e EE não usam este molde: servem a variante D única desde 11/08, com
 * middleware próprio, e o rollout_porta_quiz.py as pula pelo marcador
 * `ebook-premium-d`.
 *
 * Escotilhas de revisão, nenhuma grava cookie de braço forçado: `?v=A` abre a
 * página A antiga e `?v=V` abre a VSL (viva fora do matcher pro /teste, tráfego
 * frio, e pro link do WhatsApp). Redirect 307; cookies de 1 ano.
 */

const COOKIE = "lp_eb";
const VCOOKIE = "lp_v";
const LP_B = "/ebook-premium-b";
const LP_A = "/ebook-premium"; // só a escotilha ?v=A chega aqui
const VROUTE = "/vsl";

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  const f = (searchParams.get("v") || "").toUpperCase();
  // só o ?v=V de revisão manda pra VSL: o sorteio do EXP-031 morreu em 15/08/26
  const vsl = f === "V";

  const canonical = vsl ? VROUTE : f === "A" ? LP_A : LP_B;
  let res: NextResponse;
  if (pathname !== canonical) {
    const url = req.nextUrl.clone(); // preserva query (?internal, ?jump, ?v)
    // carimbo de origem quando a jornada chega sem ?src=; sem ele a visita da
    // automação trocaria de origem só por cair na VSL, e a régua de canal do
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
  res.cookies.set(COOKIE, "B", ano); // braço vencedor por cima: resgata preso no A
  res.cookies.set(VCOOKIE, "N", ano); // idem no EXP-031: resgata preso no V
  return res;
}

export const config = {
  matcher: ["/ebook-premium", "/ebook-premium-b", "/ebook-premium-c"],
};
