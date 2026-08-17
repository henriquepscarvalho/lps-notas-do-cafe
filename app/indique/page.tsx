import { createHash } from "crypto";
import type { Metadata } from "next";
import PageBeacon from "../PageBeacon";
import ShareBox from "./ShareBox";

// Página "suas indicações" (gamificacao-do-leitor/10, arquitetura do ticket 09).
// Espelho do padrão /xp: identidade por ?e={{email}} (merge tag do Beehiiv) ou ?h=,
// hash derivado server-side, email nunca vai pro banco. Contagem lida da SOT
// referral_signups via service role (SELECT é revogado de anon). Sem lista de
// indicados, nem mascarada: contagem basta (privacidade primeiro).
export const dynamic = "force-dynamic";

const SLUG = "notas-do-cafe";
const NOME = "Notas do Café";
const LP = "https://lp.notasdocafe.com.br";

export const metadata: Metadata = {
  title: `Indique e destrave prêmios · ${NOME}`,
  description: `Indique amigos pra ${NOME} e destrave prêmios do acervo a cada degrau.`,
};

// escada selada pelo HC (17/08): 3 / 5 / 10 confirmadas, prêmios 100% digitais
const DEGRAUS = [
  { n: 3, premio: "Edição de colecionador do mês", em: "🥇" },
  { n: 5, premio: `Ebook premium da ${NOME}`, em: "📕" },
  { n: 10, premio: "Colecionador vitalício + ebook premium de uma news irmã", em: "💎" },
];

function hashEmail(e: string): string {
  return createHash("sha256").update(e.trim().toLowerCase()).digest("hex");
}

async function contagem(refCode: string): Promise<{ conf: number; pend: number } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(
      `${url}/rest/v1/referral_signups?slug=eq.${SLUG}&ref_code=eq.${refCode}&select=status`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" }
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as { status: string }[];
    return {
      conf: rows.filter((r) => r.status === "confirmada").length,
      pend: rows.filter((r) => r.status === "pendente").length,
    };
  } catch {
    return null;
  }
}

export default async function IndiquePage({
  searchParams,
}: {
  searchParams: Promise<{ h?: string; e?: string }>;
}) {
  const { h, e } = await searchParams;
  const subHash = h || (e ? hashEmail(e) : null);
  const refCode = subHash ? subHash.slice(0, 12) : null;
  const link = refCode ? `${LP}/cadastro?ref=${refCode}` : null;
  const c = refCode ? await contagem(refCode) : null;

  const conf = c?.conf ?? 0;
  const prox = DEGRAUS.find((d) => d.n > conf) ?? null;
  const alvo = prox ? prox.n : 10;

  return (
    <main className="idq-wrap">
      <PageBeacon slug={SLUG} step="indique" source="email" />
      <style>{`
        .idq-wrap{min-height:100vh;background:#0E0E0F;color:#D3D1CF;
          font-family:var(--serif),Georgia,serif;padding:48px 20px 72px;display:flex;
          flex-direction:column;align-items:center}
        .idq-card{width:100%;max-width:560px}
        .idq-kicker{font-family:system-ui,sans-serif;font-size:12px;letter-spacing:.18em;
          text-transform:uppercase;color:#AA7853;margin-bottom:10px}
        .idq-h1{font-size:30px;line-height:1.2;margin:0 0 10px}
        .idq-sub{color:#8D8B89;font-family:system-ui,sans-serif;font-size:15px;
          line-height:1.55;margin:0 0 28px}
        .idq-num{font-size:56px;line-height:1;color:#AA7853;font-weight:700}
        .idq-numlbl{font-family:system-ui,sans-serif;font-size:13px;color:#8D8B89;margin-top:4px}
        .idq-pend{font-family:system-ui,sans-serif;font-size:12px;color:#8D8B89;margin-top:2px}
        .idq-painel{background:#151517;border:1px solid rgba(255,255,255,.10);
          border-radius:14px;padding:24px;margin-bottom:16px}
        .idq-cells{display:flex;gap:6px;margin:18px 0 6px}
        .idq-cell{flex:1;height:10px;border-radius:5px;background:rgba(255,255,255,.10)}
        .idq-cell.on{background:#AA7853}
        .idq-celllbl{display:flex;justify-content:space-between;
          font-family:system-ui,sans-serif;font-size:12px;color:#8D8B89}
        .idq-esc{list-style:none;margin:0;padding:0}
        .idq-esc li{display:flex;align-items:baseline;gap:10px;padding:12px 0;
          border-top:1px solid rgba(255,255,255,.10);font-family:system-ui,sans-serif;
          font-size:14px;line-height:1.45}
        .idq-esc li:first-child{border-top:0}
        .idq-esc .n{color:#AA7853;font-weight:700;white-space:nowrap}
        .idq-esc .ok{opacity:.55}
        .idq-xp{font-family:system-ui,sans-serif;font-size:12px;color:#8D8B89;margin-top:14px}
        .idq-semid{font-family:system-ui,sans-serif;font-size:14px;color:#8D8B89;
          background:#151517;border:1px solid rgba(255,255,255,.10);border-radius:14px;
          padding:20px;line-height:1.55}
      `}</style>
      <div className="idq-card">
        <div className="idq-kicker">{NOME} · Indique e destrave</div>
        <h1 className="idq-h1">Suas indicações</h1>
        <p className="idq-sub">
          Compartilhe seu link pessoal. Quando um amigo se cadastra e lê de verdade,
          a indicação conta aqui, e cada degrau destrava um prêmio do acervo.
        </p>

        {refCode && link ? (
          <>
            <div className="idq-painel">
              <div className="idq-num">{conf}</div>
              <div className="idq-numlbl">
                {conf === 1 ? "indicação confirmada" : "indicações confirmadas"}
              </div>
              {c && c.pend > 0 && (
                <div className="idq-pend">
                  + {c.pend} aguardando a primeira leitura do indicado
                </div>
              )}
              {!c && (
                <div className="idq-pend">
                  Não conseguimos carregar sua contagem agora. O link funciona normalmente.
                </div>
              )}
              <div className="idq-cells">
                {/* passo zero honesto: o seu cadastro. As demais células são o degrau real. */}
                <div className="idq-cell on" />
                {Array.from({ length: alvo }, (_, i) => (
                  <div key={i} className={`idq-cell${i < Math.min(conf, alvo) ? " on" : ""}`} />
                ))}
              </div>
              <div className="idq-celllbl">
                <span>você está dentro</span>
                <span>
                  {prox
                    ? `${prox.n - conf} pra destravar: ${prox.premio}`
                    : "degrau máximo destravado"}
                </span>
              </div>
            </div>

            <ShareBox link={link} nome={NOME} />
          </>
        ) : (
          <div className="idq-semid">
            Abra esta página pelo link da sua edição diária pra ver seu link pessoal
            e sua contagem. O botão &quot;indique e destrave&quot; da edição já vem com
            a sua identificação.
          </div>
        )}

        <div className="idq-painel" style={{ marginTop: 16 }}>
          <ul className="idq-esc">
            {DEGRAUS.map((d) => (
              <li key={d.n} className={conf >= d.n ? "ok" : undefined}>
                <span className="n">
                  {d.em} {d.n}
                </span>
                <span>
                  {d.premio}
                  {conf >= d.n ? " · destravado" : ""}
                </span>
              </li>
            ))}
          </ul>
          <div className="idq-xp">Cada indicação confirmada também vale +20 XP na sua jornada.</div>
        </div>
      </div>
    </main>
  );
}
