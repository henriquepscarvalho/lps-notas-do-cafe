import { NextRequest, NextResponse } from "next/server";

/**
 * Porta de venda do guia: sorteio 1/3 entre as três LPs (EXP-060 na rede, c4-20k/85, HC 15/09/26).
 *
 *   A → /ebook-premium-d   a D de sempre (controle)
 *   B → /ebook-premium-b   molde B, o mecanismo (a dor com nome e o método em 4 gestos)
 *   C → /ebook-premium-c   molde C, a promessa com o teste (a unidade 01 aberta pra fazer agora)
 *
 * Mesma porta da EE (c4-20k/62 → 63): a bifurcação mora AQUI, o banner da edição
 * diária, a automação de monetização e a recuperação seguem apontando pro mesmo
 * /ebook-premium, e o braço perdedor morre trocando este arquivo, sem reescrever
 * nenhum email. B e C são gerados por _shared/scripts/build_lp_ebook_bc.py; as
 * rotas -b e -c do EXP-027 (encerrado em 31/08) foram sobrescritas por eles.
 *
 * Cookie PRÓPRIO desta rodada (`lp_v`), de propósito: o `lp_eb` do EXP-027 ficou
 * gravado em quem visitou desde julho e reusá-lo compararia populações diferentes
 * (memória reference_split_novo_precisa_de_chave_de_cookie_propria). 1 ano, lax.
 *
 * Sorteio antes de qualquer render/beacon; redirect 307 preservando a query
 * (?src, ?internal, ?jump, utm_*). Hit direto em -b/-c/-d (link compartilhado) não
 * sorteia: serve a rota e grava o cookie só se ainda não existe, pra pessoa
 * continuar no mesmo braço quando voltar pelo /ebook-premium. `?v=a|b|c|d`
 * força pra revisão sem gravar o forçado (a conferência não polui o bucket).
 * Reverter = templates/middleware-porta-ebook-d.ts (tudo pra -d, sem cookie).
 */

const COOKIE = "lp_v";
type Arm = "d" | "b" | "c";
const ARMS: readonly Arm[] = ["d", "b", "c"];
const ROUTE: Record<Arm, string> = { d: "/ebook-premium-d", b: "/ebook-premium-b", c: "/ebook-premium-c" };

function valid(v: string | undefined | null): Arm | null {
  const x = (v || "").toLowerCase();
  if (x === "a") return "d"; // "a" é o apelido do controle no split
  return x === "d" || x === "b" || x === "c" ? x : null;
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const forced = valid(searchParams.get("v"));
  const routeArm = (ARMS as readonly string[]).find((a) => pathname === ROUTE[a as Arm]) as Arm | undefined;
  const cookieArm = valid(req.cookies.get(COOKIE)?.value);
  const sorteado = cookieArm ?? ARMS[Math.floor(Math.random() * ARMS.length)];
  const arm: Arm = forced ?? routeArm ?? sorteado;

  let res: NextResponse;
  if (pathname !== ROUTE[arm]) {
    const url = req.nextUrl.clone(); // preserva query (?src, ?internal, ?jump, utm_*)
    url.pathname = ROUTE[arm];
    url.searchParams.delete("v");
    res = NextResponse.redirect(url, 307);
  } else {
    res = NextResponse.next();
  }
  // grava o sorteio (ou a rota direta de quem chegou sem cookie), nunca o ?v= forçado
  if (!forced && !cookieArm) {
    res.cookies.set(COOKIE, arm, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  return res;
}

export const config = {
  matcher: ["/ebook-premium", "/ebook-premium-b", "/ebook-premium-c", "/ebook-premium-d"],
};
