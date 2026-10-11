import { NextRequest, NextResponse } from "next/server";

/**
 * Porta de venda do guia: a B (o mecanismo) é a única LP, EXP-060 venceu em 10/10/26 (c4-20k/168).
 *
 *   /ebook-premium, /ebook-premium-d e /ebook-premium-c → 307 pra /ebook-premium-b com a query
 *   inteira (?src, ?internal, ?jump, utm_*). Link antigo que caía direto na -d (onda-*, edicao) chega na B.
 *
 * Leitura de 10/10: a B levou 28,2% das visitas ao checkout contra 12,5% da D (59 de 209 contra
 * 25 de 200, +12,4 pp padronizados por casa, p 0,004). O sorteio 1/3 no cookie `lp_v` (c4-20k/85)
 * acabou: o cookie não decide mais a rota e é regravado como `b` em quem vê a B, porque o
 * /api/create-session carimba metadata.variant por ele.
 * `?v=d|c` (ou `a`) abre a página pedida pra conferência interna, sem gravar nada; o ?v= segue na
 * query do 307 pra rota pedida reconhecer a conferência.
 * /ebook-premium/checkout fica fora do matcher (EXP-058, EXP-059 e o ExitIntent moram lá).
 * Reverter = git revert do commit c4-20k/168 (volta o sorteio 1/3 de templates/middleware-porta-ebook-bcd.ts).
 */

const COOKIE = "lp_v";
type Arm = "d" | "b" | "c";
const UNICA: Arm = "b"; // EXP-060: a B venceu, -d e -c só abrem com ?v=
const ROUTE: Record<Arm, string> = { d: "/ebook-premium-d", b: "/ebook-premium-b", c: "/ebook-premium-c" };

function valid(v: string | undefined | null): Arm | null {
  const x = (v || "").toLowerCase();
  if (x === "a") return "d"; // "a" é o apelido do controle no split
  return x === "d" || x === "b" || x === "c" ? x : null;
}

/**
 * LP do app (flb/20): sorteio 50/50, por visitante, do braço do vídeo no bloco de recursos.
 *   a → o celular com as cenas de hoje (controle)
 *   b → o mesmo celular tocando a gravação do app (flb/19)
 * Hero, oferta, preço, botões e checkout são iguais nos dois; a página lê o cookie e marca o
 * bloco antes de pintar. Cookie PRÓPRIO (`lp_app`), 1 ano, lax: não toca o `lp_v` da porta do
 * ebook. Sem cookie a página serve o a, então este bloco é o interruptor do teste inteiro.
 * `?v=a|b` força a revisão sem gravar. Freio da ficha: `APP_B_NO_AR = false` serve só o a e
 * regrava o cookie de quem tinha caído no b.
 */
const APP_COOKIE = "lp_app";
const APP_B_NO_AR = true;

function appVideo(req: NextRequest): NextResponse {
  const res = NextResponse.next();
  const f = (req.nextUrl.searchParams.get("v") || "").toLowerCase();
  if (f === "a" || f === "b") return res;
  const atual = req.cookies.get(APP_COOKIE)?.value || "";
  const ano = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" as const };
  if (!APP_B_NO_AR) {
    if (atual !== "a") res.cookies.set(APP_COOKIE, "a", ano);
  } else if (atual !== "a" && atual !== "b") {
    res.cookies.set(APP_COOKIE, Math.random() < 0.5 ? "a" : "b", ano);
  }
  return res;
}

/**
 * Destino do clique do banner ebook + app (EXP-072, app-scriptorium/66): sorteio 50/50, por visitante.
 *   lp → a LP /app de sempre (controle); segue pro sorteio do vídeo logo acima (flb/20)
 *   ck → 307 pro /app/checkout com a query inteira (?src, utm, ?j, ?internal)
 * Só entra no sorteio quem chega em /app com o `src` do banner da edição (`edicao-app*`), menos o formato D
 * (`edicao-app-d`: o botão dele promete sortear uma fonte e só a LP cumpre). Email de campanha, WhatsApp e acesso
 * direto seguem pra LP sem sorteio. Cookie PRÓPRIO (`app_dst`), 1 ano, lax: não toca o `lp_app` nem o `lp_v`.
 * Ordem: destino primeiro, vídeo depois. O braço ck sai no 307 sem passar pelo `appVideo`, então não recebe o
 * `lp_app` e fica fora do EXP-071; o PageBeacon carimba `app-k` em quem tem `app_dst=ck`.
 * `?d=lp|ck` força a revisão sem gravar cookie (o `d` segue na query do 307 pra página carimbar o braço).
 * Freio da ficha: `APP_CK_NO_AR = false` não sorteia ninguém e regrava pra lp quem tinha caído no ck.
 */
const DST_COOKIE = "app_dst";
const APP_CK_NO_AR = true;
const APP_CK_ROTA = "/app/checkout";

/** `src` do banner da edição que entra no sorteio de destino: `edicao-app*`, menos o formato D. */
function srcDoBanner(src: string | null): boolean {
  const s = (src || "").trim().toLowerCase();
  return s.startsWith("edicao-app") && s !== "edicao-app-d";
}

function appDestino(req: NextRequest): NextResponse {
  const q = req.nextUrl.searchParams;
  const paraCheckout = () => {
    const url = req.nextUrl.clone(); // preserva a query inteira (?src, utm, ?j, ?internal, ?d)
    url.pathname = APP_CK_ROTA;
    return NextResponse.redirect(url, 307);
  };
  const f = (q.get("d") || "").toLowerCase();
  if (f === "ck") return paraCheckout(); // revisão: nunca grava cookie
  if (f === "lp") return appVideo(req);
  const ano = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" as const };
  const atual = req.cookies.get(DST_COOKIE)?.value || "";
  if (!APP_CK_NO_AR) {
    const res = appVideo(req);
    if (atual === "ck") res.cookies.set(DST_COOKIE, "lp", ano);
    return res;
  }
  if (!srcDoBanner(q.get("src"))) return appVideo(req);
  const dst = atual === "lp" || atual === "ck" ? atual : Math.random() < 0.5 ? "lp" : "ck";
  const res = dst === "ck" ? paraCheckout() : appVideo(req);
  if (dst !== atual) res.cookies.set(DST_COOKIE, dst, ano);
  return res;
}

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/app") return appDestino(req); // EXP-072 (destino) e, no braço lp, flb/20 (vídeo)
  const { pathname, searchParams } = req.nextUrl;
  const forced = valid(searchParams.get("v"));
  const arm: Arm = forced ?? UNICA;

  let res: NextResponse;
  if (pathname !== ROUTE[arm]) {
    const url = req.nextUrl.clone(); // preserva query (?src, ?internal, ?jump, utm_* e o ?v= da conferência)
    url.pathname = ROUTE[arm];
    res = NextResponse.redirect(url, 307);
  } else {
    res = NextResponse.next();
  }
  // lp_v=b em quem vê a B (o /api/create-session carimba metadata.variant por ele); o ?v= forçado não grava
  if (!forced && req.cookies.get(COOKIE)?.value !== UNICA) {
    res.cookies.set(COOKIE, UNICA, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  return res;
}

export const config = {
  matcher: ["/app", "/ebook-premium", "/ebook-premium-b", "/ebook-premium-c", "/ebook-premium-d"],
};
