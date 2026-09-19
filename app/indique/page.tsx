import { redirect } from "next/navigation";

// A escada de indicação mora num lugar só: a /indique do app do leitor (scriptorium-quiz,
// lib/indique.ts), a mesma página que o botão «Indique e destrave» da edição abre. Esta rota
// guardava uma cópia da escada 3 · 5 · 10 de 17/08 que não conhecia o degrau 1 (pack de
// wallpapers): o leitor via 1 · 3 · 5 na edição e na /voto-pauta e 3 · 5 · 10 aqui (gam/175).
// Gerado por _shared/voto-pauta/rollout_indique.py. Não editar à mão.
export const dynamic = "force-dynamic";

const DESTINO = "https://q.notasdocafe.com.br/indique";

export default async function IndiquePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") q.set(k, v);
  }
  const qs = q.toString();
  redirect(qs ? `${DESTINO}?${qs}` : DESTINO);
}
