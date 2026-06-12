// Proxy da pagina "edicao selada" (Surpresa de Quarta).
// O storage publico do Supabase serve HTML com Content-Type text/plain +
// CSP sandbox (o leitor ve codigo cru). Esta rota busca o arquivo do bucket
// `pages` e re-serve como text/html no dominio da LP.

const SLUG = "notas-do-cafe";
const BUCKET_BASE =
  "https://ecmveymyzdqiehvtqxms.supabase.co/storage/v1/object/public/pages/news";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ file: string }> }
) {
  const { file } = await ctx.params;
  // so nomes simples tipo surpresa-20260617.html (sem path traversal)
  if (!/^[a-z0-9-]+\.html$/.test(file)) {
    return new Response("Not found", { status: 404 });
  }
  const res = await fetch(`${BUCKET_BASE}/${SLUG}/surpresa/${file}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return new Response("Not found", { status: 404 });
  }
  const html = await res.text();
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
