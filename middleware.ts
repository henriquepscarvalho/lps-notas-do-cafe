import { NextRequest, NextResponse } from "next/server";

/**
 * Split A/B da LP de venda do ebook (EXP-027). Sorteio na BORDA (antes de
 * qualquer render/beacon): cookie `lp_eb` grava a variante por 1 ano. Cookie B
 * na porta principal = redirect 307 pra /ebook-premium-b; cookie A = segue. Hit
 * direto em -b (link compartilhado) seta o cookie da rota, sem sorteio.
 * `?v=a|b` forca a variante pra revisao. Chave nova (nao reusa vdn_exp014).
 * A rota -c (variante C) so existe no golden WS por enquanto.
 */

const COOKIE = "lp_eb";
const ROUTE: Record<string, string> = { A: "/ebook-premium", B: "/ebook-premium-b" };

function valid(v: string | undefined | null): "A" | "B" | null {
  return v === "A" || v === "B" ? v : null;
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  const forced = valid(searchParams.get("v")?.toUpperCase());
  const routeV = pathname === "/ebook-premium-b" ? "B" : null;
  const cookieV = valid(req.cookies.get(COOKIE)?.value);

  const variant = forced ?? routeV ?? cookieV ?? (Math.random() < 0.5 ? "A" : "B");

  const canonical = ROUTE[variant];
  let res: NextResponse;
  if (pathname !== canonical) {
    const url = req.nextUrl.clone();
    url.pathname = canonical;
    res = NextResponse.redirect(url, 307);
  } else {
    res = NextResponse.next();
  }

  res.cookies.set(COOKIE, variant, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return res;
}

export const config = { matcher: ["/ebook-premium", "/ebook-premium-b"] };
