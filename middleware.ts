import { NextRequest, NextResponse } from "next/server";

/**
 * Split A/B/C/Q da porta de venda do ebook (EXP-027 + ticket 24 do quiz-vsl-ebooks).
 *
 *  /ebook-premium    → A (controle) + sorteio na 1ª visita
 *  /ebook-premium-b  → B
 *  /ebook-premium-c  → C
 *  /teste            → Q, metade do sorteio: quiz de diagnóstico + VSL
 *
 * A bifurcação pro quiz mora AQUI, na porta, e não na copy: o banner da edição
 * diária e a automação de monetização continuam apontando pro mesmo
 * /ebook-premium, então as duas superfícies entram no teste sem reescrever
 * nenhum email nem reassar nenhuma edição.
 *
 * Sorteio na BORDA (antes de qualquer render/beacon): cookie `lp_eb` grava a
 * variante por 1 ano. Cookie B/C/Q na porta principal = redirect 307 pra rota
 * própria; cookie A = segue. Hit direto em -b/-c (link compartilhado) seta o
 * cookie da rota, sem sorteio. `?v=a|b|c|q` força a variante pra revisão. Chave
 * NOVA de propósito: não reusa `vdn_exp014` (travada em "B", contamina o carimbo).
 */

const COOKIE = "lp_eb";
const ROUTE: Record<string, string> = {
  A: "/ebook-premium",
  B: "/ebook-premium-b",
  C: "/ebook-premium-c",
  Q: "/teste",
};
// metade pro quiz, metade repartida no A/B/C (o EXP-027 segue rodando, com meia base)
const POOL = ["Q", "Q", "Q", "A", "B", "C"] as const;

function valid(v: string | undefined | null): "A" | "B" | "C" | "Q" | null {
  return v === "A" || v === "B" || v === "C" || v === "Q" ? v : null;
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  const forced = valid(searchParams.get("v")?.toUpperCase());
  const routeV = pathname === "/ebook-premium-b" ? "B" : pathname === "/ebook-premium-c" ? "C" : null;
  const cookieV = valid(req.cookies.get(COOKIE)?.value);

  // precedência: ?v= (revisão) > rota direta (-b/-c) > cookie existente > sorteio
  const variant = forced ?? routeV ?? cookieV ?? POOL[Math.floor(Math.random() * POOL.length)];

  const canonical = ROUTE[variant];
  let res: NextResponse;
  if (pathname !== canonical) {
    const url = req.nextUrl.clone(); // preserva query (?internal, ?jump, ?v)
    // o quiz carimba source="quiz" quando a jornada chega sem ?src=; sem este
    // carimbo a visita da automação trocaria de origem só por cair no braço Q,
    // e a comparação entre as duas portas perderia a régua de canal
    if (variant === "Q" && !searchParams.get("src")) url.searchParams.set("src", "ebook-premium");
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
