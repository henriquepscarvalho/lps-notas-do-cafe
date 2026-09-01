import { NextRequest, NextResponse } from "next/server";

/**
 * Porta de venda do ebook: D única (EXP-036, vencedora em 31/08/26).
 *
 * A variante D (molde golden ALQ/EE de 11/08/26) vendeu 2,72% por visita contra
 * 0,64% do A/B/C pooled (+2,08 pp, p=0,000, P(D>ABC)=100%) e R$ 0,61 por visita
 * contra R$ 0,20. Decisão do HC em 31/08/26: D vira a LP única de venda em toda
 * a rede (ticket 40 do build-ebooks-premium). Molde gerado pelo
 * build_lp_ebook_d.py / push_deploy_d.py, o mesmo em todas as news.
 *
 * /ebook-premium, -b e -c levam pra /ebook-premium-d com 307 preservando a
 * query (?src, ?internal, ?jump, utm_*): link compartilhado das variantes velhas
 * não morre e o banner da edição diária continua apontando pro mesmo
 * /ebook-premium sem reassar nada. Nenhum cookie de sorteio (lp_eb, lp_v) grava
 * mais; o cookie antigo de quem ficou preso em A/B/C perde efeito porque a porta
 * não lê cookie. /vsl segue vivo como link direto (tráfego frio via /teste), fora
 * do matcher; as páginas A/B/C ficam no repo só como histórico.
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone(); // preserva query
  url.pathname = "/ebook-premium-d";
  return NextResponse.redirect(url, 307);
}

export const config = {
  matcher: ["/ebook-premium", "/ebook-premium-b", "/ebook-premium-c"],
};
