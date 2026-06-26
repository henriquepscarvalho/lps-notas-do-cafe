"use client";

import { useEffect, useState, type CSSProperties } from "react";
import PageBeacon from "../PageBeacon";

/* Pagina cadastro-confirmado: PADRAO OURO da rede (gerado, nao editar a mao).
   Fonte: _shared (gen_confirmado_pages.py). Reskin por marca: cor + fonte + logo. */

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
const TAGLINE = "Todo dia, um café melhor";

const CC_CSS = `
.cc-main{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:28px 20px 48px;text-align:center;background:var(--cc-bg);color:var(--cc-text);font-family:var(--cc-fb)}
.cc-col{width:100%;max-width:432px}
.cc-seal{position:relative;width:70px;height:70px;margin:0 auto 12px}
.cc-orb{position:absolute;inset:-12px;border-radius:50%;background:conic-gradient(from 0deg, transparent, var(--cc-accent), transparent);opacity:.4;animation:ccSpin 4s linear infinite;filter:blur(3px)}
.cc-seal img{position:relative;display:block;width:70px;height:70px;object-fit:contain;animation:ccPop .6s cubic-bezier(.16,1,.3,1) both}
.cc-kicker{font-family:var(--cc-fb);font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--cc-accent);margin:0 0 10px;opacity:0;transform:translateY(6px);transition:opacity .5s ease, transform .5s ease}
.cc-kicker.in{opacity:1;transform:none}
.cc-name{font-family:var(--cc-fh);font-weight:700;font-size:clamp(30px,9vw,42px);line-height:1.05;color:var(--cc-accent);letter-spacing:-.01em;margin:0 0 10px;clip-path:inset(0 100% 0 0);transition:clip-path .7s cubic-bezier(.16,1,.3,1)}
.cc-name.shown{clip-path:inset(0 0 0 0)}
.cc-tag{font-size:15px;line-height:1.5;color:var(--cc-muted);max-width:340px;margin:0 auto 16px;opacity:0;transform:translateY(8px);transition:opacity .6s ease, transform .6s ease}
.cc-tag.in{opacity:1;transform:none}
.cc-pair{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 18px;opacity:0;transform:translateY(8px);transition:opacity .6s ease, transform .6s ease}
.cc-pair.in{opacity:1;transform:none}
.cc-stat{background:var(--cc-card);border:1px solid var(--cc-border);border-radius:14px;padding:15px 10px;display:grid;grid-template-rows:18px 1fr 16px;align-items:center;justify-items:center;gap:6px;min-height:116px}
.cc-lab{font-family:var(--cc-fb);font-size:9.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--cc-muted);line-height:1.1;white-space:nowrap}
.cc-big{font-family:var(--cc-fh);font-weight:700;font-size:clamp(34px,10.5vw,44px);line-height:1;color:var(--cc-text);font-variant-numeric:tabular-nums;white-space:nowrap}
.cc-big.acc{color:var(--cc-accent)}
.cc-big.word{font-size:clamp(18px,6vw,22px);line-height:1.15;white-space:normal}
.cc-sub{font-family:var(--cc-fb);font-size:11px;color:var(--cc-muted);line-height:1.1;white-space:nowrap}
.cc-sub.live{color:var(--cc-accent);font-weight:600;font-variant-numeric:tabular-nums;opacity:.9}
.cc-steps{list-style:none;display:grid;gap:14px;text-align:left;padding:0;margin:0}
.cc-step{background:var(--cc-card);border:1px solid var(--cc-border);border-radius:14px;padding:20px 20px 22px;transform:translateY(12px);opacity:0;transition:transform .5s cubic-bezier(.16,1,.3,1), opacity .5s}
.cc-step.on{transform:translateY(0);opacity:1}
.cc-n{font-family:var(--cc-fb);font-size:10.5px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--cc-accent);margin-bottom:9px}
.cc-step h3{font-family:var(--cc-fh);font-weight:700;font-size:18.5px;line-height:1.2;color:var(--cc-text);margin:0 0 7px}
.cc-step p{font-size:14px;line-height:1.6;color:var(--cc-muted);margin:0 0 16px}
.cc-btnP{display:flex;align-items:center;justify-content:center;text-decoration:none;font-family:var(--cc-fb);font-weight:700;border-radius:9px;background:var(--cc-accent);color:var(--cc-accentText);font-size:15px;padding:14px 18px;border:1px solid var(--cc-accent);width:100%}
.cc-btnG{display:flex;align-items:center;justify-content:center;text-decoration:none;font-family:var(--cc-fb);font-weight:600;border-radius:9px;background:transparent;color:var(--cc-text);font-size:13.5px;padding:12px 10px;border:1px solid var(--cc-border)}
.cc-ghosts{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:9px}
@keyframes ccSpin{to{transform:rotate(360deg)}}
@keyframes ccPop{from{opacity:0;transform:scale(.82)}to{opacity:1;transform:scale(1)}}
@media (prefers-reduced-motion: reduce){
  .cc-orb,.cc-seal img{animation:none}
  .cc-name{clip-path:inset(0 0 0 0)}
  .cc-kicker,.cc-tag,.cc-pair{opacity:1;transform:none}
  .cc-step{opacity:1;transform:none}
}`;

export default function CadastroConfirmado() {
  const [filled, setFilled] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [nameShown, setNameShown] = useState(false);
  const [kIn, setKIn] = useState(false);
  const [tIn, setTIn] = useState(false);
  const [pIn, setPIn] = useState(false);
  const [ritual, setRitual] = useState(HORA);
  const [cd, setCd] = useState("");
  const [sec, setSec] = useState("");
  const [secWord, setSecWord] = useState(false);
  const [stepsOn, setStepsOn] = useState<boolean[]>([false, false, false]);

  useEffect(() => {
    try { if (sessionStorage.getItem("vdn_pesquisa") === "filled") setFilled(true); } catch {}
    const rm = typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (rm) {
      setReduce(true); setNameShown(true); setKIn(true); setTIn(true); setPIn(true);
      setStepsOn([true, true, true]);
      return;
    }
    const timers = [
      setTimeout(() => setKIn(true), 250),
      setTimeout(() => setNameShown(true), 600),
      setTimeout(() => setTIn(true), 1100),
      setTimeout(() => setPIn(true), 1400),
      setTimeout(() => setStepsOn((s) => [true, s[1], s[2]]), 2600),
      setTimeout(() => setStepsOn((s) => [s[0], true, s[2]]), 2740),
      setTimeout(() => setStepsOn((s) => [s[0], s[1], true]), 2880),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // count-up do horario-ritual
  useEffect(() => {
    if (reduce) { setRitual(HORA); return; }
    const parts = HORA.split(":").map(Number);
    const target = parts[0] * 60 + parts[1];
    const start = performance.now();
    const dur = 900;
    let raf = 0;
    const pad = (n: number) => String(n).padStart(2, "0");
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      const cur = Math.round(target * e);
      setRitual(`${pad(Math.floor(cur / 60))}:${pad(cur % 60)}`);
      if (p < 1) raf = requestAnimationFrame(tick); else setRitual(HORA);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  // countdown vivo (segundos pulsam; minuto cai no zero)
  useEffect(() => {
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
  }, []);

  const gmail = `https://mail.google.com/mail/u/0/#search/from%3A${ENC}`;
  const hotmail = `https://outlook.live.com/mail/0/search?q=from%3A${ENC}`;
  const yahoo = `https://mail.yahoo.com/d/search/keyword=from%3A${ENC}`;

  const rootStyle = {
    "--cc-bg": C.bg, "--cc-card": C.card, "--cc-accent": C.accent,
    "--cc-accentText": C.accentText, "--cc-text": C.text, "--cc-muted": C.muted,
    "--cc-border": C.border, "--cc-fh": FH, "--cc-fb": FB,
  } as CSSProperties;

  return (
    <>
      <link rel="stylesheet" href={FONTS_HREF} />
      <PageBeacon slug={SLUG} step="confirmado" />
      <style>{CC_CSS}</style>
      <main className="cc-main" style={rootStyle}>
        <div className="cc-col">
          <div className="cc-seal">
            <div className="cc-orb" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt={NAME} width={70} height={70} />
          </div>
          <p className={"cc-kicker" + (kIn ? " in" : "")}>Você está dentro</p>
          <h1 className={"cc-name" + (nameShown ? " shown" : "")}>{NAME}</h1>
          {TAGLINE ? <p className={"cc-tag" + (tIn ? " in" : "")}>{TAGLINE}</p> : null}
          <div className={"cc-pair" + (pIn ? " in" : "")}>
            <div className="cc-stat">
              <div className="cc-lab">Seu ritual</div>
              <div className="cc-big acc">{ritual}</div>
              <div className="cc-sub">todo dia</div>
            </div>
            <div className="cc-stat">
              <div className="cc-lab">Chega em</div>
              <div className={"cc-big" + (secWord ? " word" : "")}>{cd}</div>
              <div className="cc-sub live" style={{ visibility: sec ? "visible" : "hidden" }}>{sec || " "}</div>
            </div>
          </div>
          <ol className="cc-steps">
            <li className={"cc-step" + (stepsOn[0] ? " on" : "")}>
              <div className="cc-n">Passo 1</div>
              <h3>Garanta a entrega</h3>
              <p>Procure o email de confirmação e clique no link. Sem ele, as edições não chegam.</p>
              <a href={gmail} target="_blank" rel="noopener noreferrer" className="cc-btnP">Abrir Gmail →</a>
              <div className="cc-ghosts">
                <a href={hotmail} target="_blank" rel="noopener noreferrer" className="cc-btnG">Hotmail →</a>
                <a href={yahoo} target="_blank" rel="noopener noreferrer" className="cc-btnG">Yahoo →</a>
              </div>
            </li>
            <li className={"cc-step" + (stepsOn[1] ? " on" : "")}>
              <div className="cc-n">Passo 2</div>
              <h3>Receba o aviso</h3>
              <p>Um toque no WhatsApp antes de cada edição. Sem conversa, leva 10 segundos.</p>
              <a href={WHATS} target="_blank" rel="noopener noreferrer" className="cc-btnP">Entrar no grupo →</a>
            </li>
            {!filled && (
              <li className={"cc-step" + (stepsOn[2] ? " on" : "")}>
                <div className="cc-n">Passo 3</div>
                <h3>Afie pro seu gosto</h3>
                <p>Conta rápido quem é você. Cada edição chega mais no ponto pro seu perfil.</p>
                <a href="/pesquisa" className="cc-btnP">Responder pesquisa →</a>
              </li>
            )}
          </ol>
        </div>
      </main>
    </>
  );
}
