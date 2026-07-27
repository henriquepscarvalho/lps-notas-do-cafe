import { NextRequest, NextResponse } from "next/server";

/**
 * Split A/B/C da LP de venda do ebook (EXP-027).
 *
 *  /ebook-premium    → A (controle) + sorteio 1/3 na 1ª visita
 *  /ebook-premium-b  → B
 *  /ebook-premium-c  → C
 *
 * Sorteio na BORDA (antes de qualquer render/beacon): cookie `lp_eb` grava a
 * variante por 1 ano. Cookie B/C na porta principal = redirect 307 pra rota
 * própria; cookie A = segue. Hit direto em -b/-c (link compartilhado) seta o
 * cookie da rota, sem sorteio. `?v=a|b|c` força a variante pra revisão. Chave
 * NOVA de propósito: não reusa `vdn_exp014` (travada em "B", contamina o carimbo).
 */

const COOKIE = "lp_eb";
const ROUTE: Record<string, string> = {
  A: "/ebook-premium",
  B: "/ebook-premium-b",
  C: "/ebook-premium-c",
};

function valid(v: string | undefined | null): "A" | "B" | "C" | null {
  return v === "A" || v === "B" || v === "C" ? v : null;
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  const forced = valid(searchParams.get("v")?.toUpperCase());
  const routeV = pathname === "/ebook-premium-b" ? "B" : pathname === "/ebook-premium-c" ? "C" : null;
  const cookieV = valid(req.cookies.get(COOKIE)?.value);

  // precedência: ?v= (revisão) > rota direta (-b/-c) > cookie existente > sorteio 1/3
  const variant =
    forced ?? routeV ?? cookieV ?? (["A", "B", "C"] as const)[Math.floor(Math.random() * 3)];

  const canonical = ROUTE[variant];
  let res: NextResponse;
  if (pathname !== canonical) {
    const url = req.nextUrl.clone(); // preserva query (?internal, ?jump, ?v)
    url.pathname = canonical;
    res = NextResponse.redirect(url, 307);
  } else {
    res = NextResponse.next();
  }

  res.cookies.set(COOKIE, variant, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}

export const config = {
  matcher: ["/ebook-premium", "/ebook-premium-b", "/ebook-premium-c"],
};
