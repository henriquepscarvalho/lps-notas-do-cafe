export const dynamic = "force-static";

// ads.txt dirigido pelo MESMO env que liga o AdSense (NEXT_PUBLIC_ADSENSE_CLIENT).
// Sem conta aprovada a env fica vazia => 404 (nao ha publisher pra declarar).
// Ao aprovar e setar NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXX no projeto Vercel,
// o ads.txt vai ao ar sozinho no redeploy. Uma so fonte de verdade, zero pub-id manual.
const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export function GET() {
  if (!CLIENT) return new Response("Not found", { status: 404 });
  const pub = CLIENT.replace(/^ca-/, "");
  return new Response(`google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
