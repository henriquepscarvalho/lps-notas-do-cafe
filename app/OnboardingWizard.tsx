"use client";

import { useEffect, useState, useCallback, type CSSProperties } from "react";
import { captureSource, sendBeacon } from "./PageBeacon";

/* OnboardingWizard — onboarding de 7 passos (cadastro + 6 telas), PADRAO OURO da rede (gerado pelo rollout).
   Componente unico montado nos slugs de confirmacao. source na coluna; context muda
   so a copy do passo 1 e o fecho. Beacon apareceu/converteu por etapa. */

const C = {
  bg: "#2C1810", card: "#1E100A", accent: "#C8963E",
  accentText: "#2C1810", text: "#F5EDE0", muted: "#9E8E7A", border: "rgba(200, 150, 62, 0.12)",
};
const FH = "\"Eczar\", Georgia, serif";
const FB = "\"Plus Jakarta Sans\", -apple-system, system-ui, sans-serif";
const FONTS_HREF = "https://fonts.googleapis.com/css2?family=Eczar:ital,wght@0,400;0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";
const LOGO = "/images/logo/simbolo.png";
const ENC = "leia%40notasdocafe.com.br";
const WHATS = "https://sndflw.com/i/3bRJTg1vXSQL9pyKp5nE";
const HORA = "08:08";
const SLUG = "notas-do-cafe";
const NAME = "Notas do Café";
const ARQUIVO = "https://notasdocafe.com.br";
const SHARE_URL = "https://api.whatsapp.com/send/?text=A%20Notas%20do%20Caf%C3%A9%20traz%20o%20gr%C3%A3o%2C%20o%20m%C3%A9todo%20e%20a%20curadoria%20pra%20sua%20x%C3%ADcara%20render%20mais.%20https%3A%2F%2Flp.notasdocafe.com.br%2Fcadastro";

/* vdn-rec-step: passo REC (combo cross-rede), baked pelo rollout_rec_step.py.
   SOT = _combo/lib/newsletters.json (pool sanguíneo TOP4 da Notas do Café). Não editar à mão. */
const COMBO_API = "https://scriptorium-combo.vercel.app/api/combo";
const REC_POOL = [
  { slug: "brasa-certa", name: "Brasa Certa", card: "O churrasco perfeito sem mistério: o corte certo, o ponto, o tempo da brasa.", hora: "14:14", leitores: "2.138", emoji: "🔥", logo: "/images/rec/brasa-certa.png" },
  { slug: "jogos-de-valor", name: "Jogos de Valor", card: "Os jogos de tabuleiro que valem a mesa, com curadoria honesta.", hora: "14:14", leitores: "1.257", emoji: "👑", logo: "/images/rec/jogos-de-valor.png" },
  { slug: "setup-memoravel", name: "Setup Memorável", card: "Produtividade digital sem culto a app: o que de fato move o ponteiro.", hora: "08:08", leitores: "489", emoji: "🖥️", logo: "/images/rec/setup-memoravel.png" },
  { slug: "turno-do-pai", name: "Turno do Pai", card: "O manual prático da paternidade nos primeiros anos, sem julgamento.", hora: "06:06", leitores: "325", emoji: "👶", logo: "/images/rec/turno-do-pai.png" },
];

/* vdn-ebook-step: passo do guia premium (passo 6), baked pelo rollout_ebook_step.py.
   Layout Capa Herói (escolha do HC no burst de 10/08): a capa carrega a tela, título e
   promessa embaixo. Tokens saem de app/ebook-premium/page.tsx (EBOOK.titulo/sub/capa).
   `url` vazio = news sem LP de venda e o passo pula sozinho. Preço fica FORA daqui de
   propósito (decisão HC 10/08): o passo apresenta o guia, quem vende é a página. O link
   entra em /ebook-premium sem carimbo de origem: o middleware sorteia LP x VSL na borda
   como já faz pro banner da edição, e o `vdn_source` da jornada continua sendo o canal
   que trouxe a pessoa. Quem veio pelo wizard se lê pela interseção de journey_id com o
   step `ebook` no lp_page_views, mesmo método da porta do quiz. */
const EB = {
  url: "/ebook-premium",
  titulo: "Café de Balcão no Coador de Casa",
  linha: "As oito variáveis que fazem o coador de papel da sua cozinha repetir a xícara do balcão, sem a máquina de R$ 2 mil.",
  capa: "/ebook-web/capa-notas-do-cafe.webp",
};

const CC_CSS = `
.cc-main{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:26px 20px 56px;text-align:center;background:var(--cc-bg);color:var(--cc-text);font-family:var(--cc-fb)}
.cc-col{width:100%;max-width:432px}
.cc-head{margin-bottom:20px}
.cc-prog{display:flex;align-items:center;gap:10px;margin:6px 0 12px}
.cc-chip{display:block;margin:0 0 20px;color:#57C784;font-family:var(--cc-fb);font-size:12.5px;font-weight:700;line-height:1.2;letter-spacing:.01em}
.cc-bars{display:flex;gap:5px;flex:1}
.cc-bar{flex:1;height:4px;border-radius:99px;background:var(--cc-card);overflow:hidden;position:relative}
.cc-bar i{position:absolute;inset:0;background:var(--cc-accent);transform:scaleX(0);transform-origin:left;transition:transform .5s cubic-bezier(.16,1,.3,1)}
.cc-bar.done i{transform:scaleX(1)}
.cc-bar.cur i{transform:scaleX(.5)}
.cc-ptxt{font-family:var(--cc-fb);font-size:11px;font-weight:700;letter-spacing:.06em;color:var(--cc-muted);white-space:nowrap}
.cc-ptxt b{color:var(--cc-accent)}
.cc-stage{position:relative}
.cc-step{background:var(--cc-card);border:1px solid var(--cc-border);border-radius:16px;padding:26px 22px 24px;text-align:left;animation:ccIn .45s cubic-bezier(.16,1,.3,1) both}
.cc-n{font-family:var(--cc-fb);font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--cc-accent);margin-bottom:11px}
.cc-step h2{font-family:var(--cc-fh);font-weight:700;font-size:26px;line-height:1.08;color:var(--cc-text);letter-spacing:.005em;margin:0 0 9px}
.cc-step p{font-size:14.5px;line-height:1.62;color:var(--cc-muted);margin:0 0 18px}
.cc-btnP{display:flex;align-items:center;justify-content:center;text-decoration:none;font-family:var(--cc-fh);font-weight:700;font-size:17px;letter-spacing:.01em;border-radius:10px;background:var(--cc-accent);color:var(--cc-accentText);padding:15px 18px;border:1px solid var(--cc-accent);width:100%;cursor:pointer}
.cc-btnG{display:block;width:100%;text-align:center;background:none;border:none;color:var(--cc-muted);font-family:var(--cc-fb);font-size:13px;font-weight:600;padding:13px 8px 2px;cursor:pointer;text-decoration:none}
.cc-btnG:hover{color:var(--cc-text)}
.cc-ghosts{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:9px}
.cc-prov{display:flex;align-items:center;justify-content:center;text-decoration:none;font-family:var(--cc-fb);font-weight:600;font-size:13.5px;border-radius:9px;background:transparent;color:var(--cc-text);padding:13px 10px;border:1px solid var(--cc-border);cursor:pointer}
.cc-prov:hover{border-color:var(--cc-accent)}
.cc-reveal{margin-top:11px;animation:ccIn .4s ease both}
.cc-seal{position:relative;width:60px;height:60px;margin:0 auto 11px}
.cc-orb{position:absolute;inset:-12px;border-radius:50%;background:conic-gradient(from 0deg, transparent, var(--cc-accent), transparent);opacity:.4;animation:ccSpin 4s linear infinite;filter:blur(3px)}
.cc-seal img{position:relative;display:block;width:60px;height:60px;object-fit:contain;animation:ccPop .6s cubic-bezier(.16,1,.3,1) both}
.cc-kicker{font-family:var(--cc-fb);font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--cc-accent);margin:0 0 10px}
.cc-name{font-family:var(--cc-fh);font-weight:700;font-size:clamp(28px,8.5vw,38px);line-height:1.04;color:var(--cc-accent);letter-spacing:-.01em;margin:0}
.cc-pair{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:2px 0 4px}
.cc-stat{background:var(--cc-card);border:1px solid var(--cc-border);border-radius:14px;padding:16px 10px;display:grid;grid-template-rows:18px 1fr 16px;align-items:center;justify-items:center;gap:6px;min-height:118px}
.cc-lab{font-family:var(--cc-fb);font-size:9.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--cc-muted);line-height:1.1;white-space:nowrap}
.cc-big{font-family:var(--cc-fh);font-weight:700;font-size:clamp(34px,10.5vw,44px);line-height:1;color:var(--cc-text);font-variant-numeric:tabular-nums;white-space:nowrap}
.cc-big.acc{color:var(--cc-accent)}
.cc-big.word{font-size:clamp(18px,6vw,22px);line-height:1.15;white-space:normal}
.cc-sub{font-family:var(--cc-fb);font-size:11px;color:var(--cc-muted);line-height:1.1;white-space:nowrap}
.cc-sub.live{color:var(--cc-accent);font-weight:600;font-variant-numeric:tabular-nums;opacity:.9}
.cc-fin-note{font-size:13.5px;line-height:1.55;color:var(--cc-muted);margin:16px auto 0;max-width:330px}
.cc-share-q{font-size:12.5px;color:var(--cc-muted);margin:24px 0 0}
.cc-share{display:flex;align-items:center;justify-content:center;gap:9px;text-decoration:none;font-family:var(--cc-fh);font-weight:700;font-size:16px;letter-spacing:.01em;border-radius:10px;background:var(--cc-accent);color:var(--cc-accentText);padding:14px 18px;border:1px solid var(--cc-accent);width:100%;max-width:330px;margin:11px auto 0;cursor:pointer}
.cc-share svg{flex:0 0 auto}
@keyframes ccIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes ccSpin{to{transform:rotate(360deg)}}
@keyframes ccPop{from{opacity:0;transform:scale(.82)}to{opacity:1;transform:scale(1)}}
/* vdn-rec-css */
.cc-recgrid{display:flex;flex-direction:column;gap:9px;margin:2px 0 16px}
.cc-reccard{display:flex;gap:11px;align-items:flex-start;background:rgba(255,255,255,0.045);border:1px solid var(--cc-border);border-radius:13px;padding:11px 12px;cursor:pointer;position:relative;transition:box-shadow .12s,opacity .15s}
.cc-rectile{flex:0 0 44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;overflow:hidden;background:rgba(0,0,0,0.35);position:relative}
.cc-rectile img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.cc-recbody{min-width:0;flex:1;padding-right:26px}
.cc-recname{font-family:var(--cc-fb);font-weight:700;font-size:13.5px;line-height:1.25;color:var(--cc-text)}
.cc-reccard p.cc-recpr{font-size:11.6px;line-height:1.4;color:var(--cc-muted);margin:2px 0 0}
.cc-recchip{display:inline-block;color:var(--cc-muted);opacity:.85;font-size:9.5px;font-weight:600;letter-spacing:.05em;margin-top:5px;margin-right:5px;background:rgba(0,0,0,0.35);border-radius:5px;padding:1px 7px}
.cc-recpk{position:absolute;top:11px;right:11px;width:20px;height:20px;border-radius:50%;border:2px solid var(--cc-muted);opacity:.9;display:flex;align-items:center;justify-content:center;background:transparent;transition:all .12s}
.cc-recpk svg{display:none;width:11px;height:11px}
.cc-reccard.sel{box-shadow:0 0 0 2px var(--cc-accent)}
.cc-reccard.sel .cc-recpk{background:var(--cc-accent);border-color:var(--cc-accent);color:var(--cc-accentText);opacity:1}
.cc-reccard.sel .cc-recpk svg{display:block}
.cc-reccard:not(.sel){opacity:.5}
.cc-btnP:disabled{opacity:.4;cursor:default}
.cc-recerr{font-size:12px;color:var(--cc-muted);text-align:center;margin:10px 0 0}
/* vdn-ebook-css */
.cc-ebhero{display:flex;justify-content:center;margin:4px 0 18px}
.cc-ebhero img{width:158px;max-width:52%;height:auto;display:block;border-radius:7px;box-shadow:0 18px 38px rgba(0,0,0,.6);transform:perspective(760px) rotateY(-7deg);animation:ccPop .6s cubic-bezier(.16,1,.3,1) both}
@media (prefers-reduced-motion: reduce){
  .cc-orb,.cc-seal img,.cc-step,.cc-reveal,.cc-ebhero img{animation:none}
  .cc-bar i{transition:none}
}`;

type StepKey = "rec" | "email" | "whatsapp" | "pesquisa" | "ebook" | "edicoes";
const ORDER: StepKey[] = ["rec", "email", "whatsapp", "pesquisa", "ebook", "edicoes"];
const TOTAL = ORDER.length + 1; // cadastro conta como passo 1 concluído (goal gradient)
const SS = (k: string): string | null => { try { return sessionStorage.getItem(k); } catch { return null; } };
const SET = (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch {} };

type Ctx = "news" | "ebook";
const STEP1_P: Record<Ctx, string> = {
  news: `A primeira edição já está pronta. Procure o email de confirmação e clique no link. Sem ele, nada chega às ${HORA}.`,
  ebook: `Seu material está a caminho. Procure o email de confirmação e clique no link pra liberar o envio. A primeira edição chega logo depois, às ${HORA}.`,
};
const FINAL_NOTE: Record<Ctx, string> = {
  news: `Você está dentro. A primeira edição cai direto na sua caixa às ${HORA}, todo dia.`,
  ebook: `Material a caminho e você está dentro. A primeira edição chega às ${HORA}, todo dia, direto na sua caixa.`,
};

export default function OnboardingWizard({
  context = "news",
  defaultSource,
}: {
  context?: Ctx;
  defaultSource?: string;
}) {
  const [idx, setIdx] = useState<number>(-1);
  const [done, setDone] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [ritual, setRitual] = useState(HORA);
  const [cd, setCd] = useState("");
  const [sec, setSec] = useState("");
  const [secWord, setSecWord] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [recSel, setRecSel] = useState<Set<string>>(() => new Set(REC_POOL.slice(0, 1).map((n) => n.slug)));
  const [recBusy, setRecBusy] = useState(false);
  const [recErr, setRecErr] = useState(false);

  const isHandled = useCallback((k: StepKey): boolean => {
    if (k === "rec") {
      // sem email salvo nao ha POST possivel: nao renderiza NESTA visita, sem gravar skip
      // (gravar skip queimava o passo na sessao se o lead abria a rota antes do cadastro)
      let em: string | null = null;
      try { em = localStorage.getItem("vdn_lead_email"); } catch {}
      if (!em) return true;
    }
    if (k === "ebook" && !EB.url) return true; // news sem LP de venda: passo nao existe
    if (k === "pesquisa") return !!SS("vdn_pesquisa");
    return !!SS(`vdn_ob_${k}`);
  }, []);

  useEffect(() => {
    captureSource(defaultSource);
    sendBeacon(SLUG, "confirmado", { eventType: "apareceu" });
    if (context === "ebook") sendBeacon(SLUG, "lead", { eventType: "converteu" }); // ebook: chegar aqui = lead
    const rm = typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduce(rm);
    const start = ORDER.findIndex((k) => !isHandled(k));
    if (start === -1) { setDone(true); setIdx(ORDER.length); return; }
    setIdx(start);
  }, [isHandled, defaultSource, context]);

  useEffect(() => {
    if (idx < 0 || idx >= ORDER.length) return;
    sendBeacon(SLUG, ORDER[idx], { eventType: "apareceu" });
  }, [idx]);

  useEffect(() => {
    if (done) sendBeacon(SLUG, "done", { eventType: "apareceu" });
  }, [done]);

  const advance = useCallback(() => {
    setEmailOpen(false);
    setIdx((cur) => {
      let n = cur + 1;
      while (n < ORDER.length && isHandled(ORDER[n])) n++;
      if (n >= ORDER.length) { setDone(true); return ORDER.length; }
      return n;
    });
  }, [isHandled]);

  const skip = (k: StepKey) => { SET(`vdn_ob_${k}`, "skip"); advance(); };

  /* Aba nova só herda o sessionStorage quando o navegador copia o contexto, e com
     noopener/noreferrer não copia. Sem a jornada do outro lado, a venda chegaria no
     Supabase como visita nova e o passo viraria um link sem dono. Journey e origem
     viajam na URL; o captureSource do outro lado só adota o que não existir. */
  const ebHref = () => {
    try {
      const p = new URLSearchParams();
      const j = sessionStorage.getItem("vdn_journey");
      const s = sessionStorage.getItem("vdn_source");
      if (j) p.set("j", j);
      if (s) p.set("src", s);
      const q = p.toString();
      return q ? `${EB.url}?${q}` : EB.url;
    } catch {
      return EB.url;
    }
  };

  const toggleRec = (s: string) =>
    setRecSel((cur) => { const n = new Set(cur); if (n.has(s)) n.delete(s); else n.add(s); return n; });

  const confirmRec = async () => {
    if (recBusy || recSel.size === 0) return;
    let email: string | null = null;
    try { email = localStorage.getItem("vdn_lead_email"); } catch {}
    if (!email) { skip("rec"); return; }
    let internal = false;
    try { internal = localStorage.getItem("vdn_internal") === "1"; } catch {}
    setRecBusy(true); setRecErr(false);
    try {
      const r = await fetch(COMBO_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email, from_slug: SLUG, slugs: Array.from(recSel),
          journey_id: SS("vdn_journey"), internal, website: "",
        }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j && j.ok) {
        SET("vdn_ob_rec", "done");
        sendBeacon(SLUG, "rec", { eventType: "converteu" });
        advance();
        return;
      }
      setRecErr(true); setRecBusy(false);
    } catch { setRecErr(true); setRecBusy(false); }
  };

  useEffect(() => {
    if (!done) return;
    if (reduce) { setRitual(HORA); return; }
    const parts = HORA.split(":").map(Number);
    const target = parts[0] * 60 + parts[1];
    const startT = performance.now();
    const dur = 900;
    let raf = 0;
    const pad = (n: number) => String(n).padStart(2, "0");
    const tick = (t: number) => {
      const p = Math.min(1, (t - startT) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      const curv = Math.round(target * e);
      setRitual(`${pad(Math.floor(curv / 60))}:${pad(curv % 60)}`);
      if (p < 1) raf = requestAnimationFrame(tick); else setRitual(HORA);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [done, reduce]);

  useEffect(() => {
    if (!done) return;
    const pad = (n: number) => String(n).padStart(2, "0");
    const delta = () => {
      const parts = HORA.split(":").map(Number);
      const now = new Date();
      const tg = new Date();
      tg.setHours(parts[0], parts[1], 0, 0);
      if (tg.getTime() <= now.getTime()) tg.setDate(tg.getDate() + 1);
      return tg.getTime() - now.getTime();
    };
    const upd = () => {
      const ms = delta();
      if (ms <= 0) { setCd("a caminho"); setSecWord(true); setSec(""); return; }
      const tm = Math.floor(ms / 60000);
      const s = Math.floor(ms / 1000) % 60;
      if (tm < 5) { setCd("agora"); setSecWord(true); setSec(""); return; }
      setSecWord(false);
      if (tm < 60) setCd(`${tm}m`);
      else { const hh = Math.floor(tm / 60); const mm = tm % 60; setCd(`${hh}h ${pad(mm)}m`); }
      setSec(`${pad(s)}s`);
    };
    upd();
    const id = setInterval(upd, 1000);
    return () => clearInterval(id);
  }, [done]);

  const gmail = `https://mail.google.com/mail/u/0/#search/from%3A${ENC}`;
  const hotmail = `https://outlook.live.com/mail/0/search?q=from%3A${ENC}`;
  const yahoo = `https://mail.yahoo.com/d/search/keyword=from%3A${ENC}`;

  const confirmEmail = (href?: string) => {
    SET("vdn_ob_email", "done");
    sendBeacon(SLUG, "email", { eventType: "converteu" });
    if (href) { try { window.open(href, "_blank", "noopener,noreferrer"); } catch {} }
    advance();
  };

  const rootStyle = {
    "--cc-bg": C.bg, "--cc-card": C.card, "--cc-accent": C.accent,
    "--cc-accentText": C.accentText, "--cc-text": C.text, "--cc-muted": C.muted,
    "--cc-border": C.border, "--cc-fh": FH, "--cc-fb": FB,
  } as CSSProperties;

  const stepNo = Math.min(idx + 2, TOTAL); // cadastro = passo 1, já vencido

  return (
    <>
      <link rel="stylesheet" href={FONTS_HREF} />
      <style>{CC_CSS}</style>
      <main className="cc-main" style={rootStyle}>
        <div className="cc-col">
          <div className="cc-head">
            <div className="cc-seal">
              <div className="cc-orb" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO} alt={NAME} width={60} height={60} />
            </div>
            <h1 className="cc-name">{NAME}</h1>
          </div>
          {!done && idx >= 0 && (
            <>
              <div className="cc-prog">
                <div className="cc-bars">
                  {Array.from({ length: TOTAL }, (_, i) => (
                    <span key={i} className={"cc-bar" + (i <= idx ? " done" : i === idx + 1 ? " cur" : "")}><i /></span>
                  ))}
                </div>
                <span className="cc-ptxt">Passo <b>{stepNo}</b> de {TOTAL}</span>
              </div>
              <div className="cc-chip">✓ Cadastro feito, você está dentro!</div>
              <div className="cc-stage">
                {idx === 0 && (
                  <div className="cc-step" key="rec">
                    <div className="cc-n">Você foi convidado</div>
                    <h2>Quem lê a {NAME} também lê <em>estas 4</em></h2>
                    <p>Escolhemos outras 4 news que mais combinam com a {NAME}. Deixamos a primeira marcada. Marque as outras que você quiser receber e confirme.</p>
                    <div className="cc-recgrid">
                      {REC_POOL.map((n) => {
                        const sel = recSel.has(n.slug);
                        return (
                          <div key={n.slug} className={"cc-reccard" + (sel ? " sel" : "")} role="checkbox" aria-checked={sel} tabIndex={0}
                            onClick={() => toggleRec(n.slug)}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleRec(n.slug); } }}>
                            <div className="cc-rectile"><span>{n.emoji}</span>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={n.logo} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                            </div>
                            <div className="cc-recbody">
                              <div className="cc-recname">{n.name}</div>
                              <p className="cc-recpr">{n.card}</p>
                              <span className="cc-recchip">chega {n.hora}</span>
                              {n.leitores ? <span className="cc-recchip">+{n.leitores} leitores</span> : null}
                            </div>
                            <div className="cc-recpk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg></div>
                          </div>
                        );
                      })}
                    </div>
                    <button className="cc-btnP" disabled={recSel.size === 0 || recBusy} onClick={confirmRec}>
                      {recBusy ? "Enviando..." : recSel.size === 0 ? "Selecione pelo menos uma" : recSel.size === 1 ? "Receber esta também" : `Receber estas ${recSel.size} também`}
                    </button>
                    {recErr && <p className="cc-recerr">Não deu certo. Tente de novo ou toque em Agora não.</p>}
                    <button className="cc-btnG" onClick={() => skip("rec")}>Agora não</button>
                  </div>
                )}
                {idx === 1 && (
                  <div className="cc-step" key="email">
                    <div className="cc-n">{`Passo ${stepNo} de ${TOTAL} · essencial`}</div>
                    <h2>Confirme seu email</h2>
                    <p>{STEP1_P[context]}</p>
                    {!emailOpen ? (
                      <button className="cc-btnP" onClick={() => setEmailOpen(true)}>Confirmar email</button>
                    ) : (
                      <div className="cc-reveal">
                        <button className="cc-btnP" onClick={() => confirmEmail(gmail)}>Abrir Gmail →</button>
                        <div className="cc-ghosts">
                          <button className="cc-prov" onClick={() => confirmEmail(hotmail)}>Hotmail →</button>
                          <button className="cc-prov" onClick={() => confirmEmail(yahoo)}>Yahoo →</button>
                        </div>
                        <button className="cc-btnG" onClick={() => confirmEmail()}>Uso outro provedor</button>
                      </div>
                    )}
                  </div>
                )}
                {idx === 2 && (
                  <div className="cc-step" key="whatsapp">
                    <div className="cc-n">{`Passo ${stepNo} de ${TOTAL} · recomendado`}</div>
                    <h2>Receba no seu WhatsApp</h2>
                    <p>Um toque pessoal antes de cada edição, direto no seu WhatsApp. Sem grupo, sem barulho. Leva 10 segundos.</p>
                    <a className="cc-btnP" href={WHATS} target="_blank" rel="noopener noreferrer"
                      onClick={() => { SET("vdn_ob_whatsapp", "done"); sendBeacon(SLUG, "whatsapp", { eventType: "converteu" }); setTimeout(advance, 150); }}
                    >Quero receber no WhatsApp →</a>
                    <button className="cc-btnG" onClick={() => skip("whatsapp")}>Agora não</button>
                  </div>
                )}
                {idx === 3 && (
                  <div className="cc-step" key="pesquisa">
                    <div className="cc-n">{`Passo ${stepNo} de ${TOTAL} · 1 minuto`}</div>
                    <h2>Deixe no ponto pra você</h2>
                    <p>Conta rápido quem é você. Cada edição passa a chegar mais no ponto pro seu interesse.</p>
                    <a className="cc-btnP" href="/pesquisa">Responder (1 min) →</a>
                    <button className="cc-btnG" onClick={() => skip("pesquisa")}>Agora não</button>
                  </div>
                )}
                {idx === 4 && (
                  <div className="cc-step" key="ebook">
                    <div className="cc-n">{`Passo ${stepNo} de ${TOTAL} · guia completo`}</div>
                    <div className="cc-ebhero">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={EB.capa} alt={EB.titulo} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    </div>
                    <h2>{EB.titulo}</h2>
                    <p>{EB.linha}</p>
                    <a className="cc-btnP" href={ebHref()} target="_blank" rel="noopener"
                      onClick={() => { SET("vdn_ob_ebook", "done"); sendBeacon(SLUG, "ebook", { eventType: "converteu" }); setTimeout(advance, 150); }}
                    >Conhecer o guia →</a>
                    <button className="cc-btnG" onClick={() => skip("ebook")}>Agora não</button>
                  </div>
                )}
                {idx === 5 && (
                  <div className="cc-step" key="edicoes">
                    <div className="cc-n">{`Passo ${stepNo} de ${TOTAL} · enquanto espera`}</div>
                    <h2>Leia enquanto espera</h2>
                    <p>A próxima edição chega às {HORA}. Até lá, comece pelas anteriores e já saia na frente.</p>
                    <a className="cc-btnP" href={ARQUIVO} target="_blank" rel="noopener noreferrer"
                      onClick={() => { SET("vdn_ob_edicoes", "done"); sendBeacon(SLUG, "edicoes", { eventType: "converteu" }); setTimeout(advance, 150); }}
                    >Ler edições anteriores →</a>
                    <button className="cc-btnG" onClick={() => skip("edicoes")}>Agora não</button>
                  </div>
                )}
              </div>
            </>
          )}
          {done && (
            <>
              <div className="cc-prog">
                <div className="cc-bars">
                  {Array.from({ length: TOTAL }, (_, i) => (
                    <span key={i} className="cc-bar done"><i /></span>
                  ))}
                </div>
                <span className="cc-ptxt"><b>{TOTAL}</b> de {TOTAL}</span>
              </div>
              <p className="cc-kicker" style={{ marginTop: 2 }}>Tudo pronto</p>
              <div className="cc-pair">
                <div className="cc-stat">
                  <div className="cc-lab">Seu ritual</div>
                  <div className="cc-big acc">{ritual}</div>
                  <div className="cc-sub">todo dia</div>
                </div>
                <div className="cc-stat">
                  <div className="cc-lab">1ª edição em</div>
                  <div className={"cc-big" + (secWord ? " word" : "")}>{cd}</div>
                  <div className="cc-sub live" style={{ visibility: sec ? "visible" : "hidden" }}>{sec || " "}</div>
                </div>
              </div>
              <p className="cc-fin-note">{FINAL_NOTE[context]}</p>
              <p className="cc-share-q">Conhece alguém que vai curtir?</p>
              <a className="cc-share" href={SHARE_URL} target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M16 .4C7.4.4.4 7.4.4 16c0 2.8.7 5.4 2 7.7L.3 31.6l8.1-2.1c2.2 1.2 4.8 1.9 7.5 1.9 8.6 0 15.6-7 15.6-15.6S24.6.4 16 .4zm0 28.5c-2.5 0-4.8-.7-6.8-1.8l-.5-.3-4.8 1.3 1.3-4.7-.3-.5c-1.3-2-2-4.4-2-6.9C2.6 8.6 8.6 2.6 16 2.6S29.4 8.6 29.4 16 23.4 28.9 16 28.9zm7.4-9.7c-.4-.2-2.4-1.2-2.7-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.2 1.5-.2.2-.4.3-.8.1-.4-.2-1.7-.6-3.2-2-1.2-1.1-2-2.4-2.2-2.8-.2-.4 0-.6.2-.8.2-.2.4-.4.5-.7.2-.2.2-.4.4-.6.1-.3 0-.5 0-.7-.1-.2-.9-2.2-1.3-3-.3-.8-.7-.7-.9-.7h-.8c-.3 0-.7.1-1 .5-.4.4-1.4 1.3-1.4 3.3s1.4 3.8 1.6 4.1c.2.3 2.8 4.3 6.8 6 .9.4 1.7.6 2.3.8 1 .3 1.8.3 2.5.2.8-.1 2.4-1 2.7-1.9.3-.9.3-1.7.2-1.9-.1-.2-.3-.3-.7-.5z"/></svg>
                Indicar pra um amigo no WhatsApp
              </a>
            </>
          )}
        </div>
      </main>
    </>
  );
}
