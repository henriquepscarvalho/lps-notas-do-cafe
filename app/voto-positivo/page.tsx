"use client";

/* ============================================================
 * PÁGINA /voto-positivo — MODELO CANÔNICO ÚNICO (rede Scriptorium)
 * AUTO-GERADO por _shared/voto-positivo/build.py
 * NÃO EDITAR À MÃO. Fonte = page.template.tsx + config.json.
 * Para re-skinar TODAS as news: editar este template ou o config
 * e rodar `python3 _shared/voto-positivo/build.py`.
 *
 * Fluxo (nota 5): caixa de comentário PRIMEIRO. Só depois de o leitor
 * ENVIAR a resposta aparecem a mensagem de agradecimento, o confete e o
 * botão de compartilhar no WhatsApp. A recompensa vem após o engajamento.
 * ============================================================ */

import { useState } from "react";
import PageBeacon from "../PageBeacon";
import VoteBeacon, { submitVoteComment } from "../VoteBeacon";

const CFG = {
  "slug": "notas-do-cafe",
  "brand": "Notas do Café",
  "logo": "/images/logo/simbolo.png",
  "logoW": 56,
  "logoH": 56,
  "kicker": "VOTO REGISTRADO",
  "headline": "Obrigado pelo seu",
  "highlight": "voto.",
  "paragraph": "Saber que a edição de hoje acertou na xícara é o que faz cada manhã valer a pena.",
  "tagline": "Bom café. Até amanhã.",
  "shareUrl": "https://api.whatsapp.com/send/?text=A%20Notas%20do%20Caf%C3%A9%20traz%20o%20gr%C3%A3o%2C%20o%20m%C3%A9todo%20e%20a%20curadoria%20pra%20sua%20x%C3%ADcara%20render%20mais.%20https%3A%2F%2Flp.notasdocafe.com.br%2Fcadastro",
  "emojis": [
    "☕",
    "🫘",
    "♨️",
    "📦",
    "✨"
  ],
  "theme": {
    "bg": "#2C1810",
    "text": "#D4C4AE",
    "accent": "#C8963E",
    "heading": "#F5EDE0",
    "btnBg": "#C8963E",
    "btnText": "#2C1810",
    "glow": "rgba(200,150,62,0.14)",
    "font": "var(--font-heading)"
  }
};

interface Piece { id: number; left: number; delay: number; duration: number; size: number; emoji: string; }

export default function VotoPositivo() {
  const [confetti, setConfetti] = useState<Piece[]>([]);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  function fireConfetti() {
    setConfetti(
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 3 + Math.random() * 3,
        size: 16 + Math.random() * 12,
        emoji: CFG.emojis[Math.floor(Math.random() * CFG.emojis.length)],
      }))
    );
  }

  async function handleSubmit() {
    if (sending || !comment.trim()) return;
    setSending(true);
    await submitVoteComment(CFG.slug, comment);
    setSent(true);
    setSending(false);
    fireConfetti();
  }

  const t = CFG.theme;

  return (
    <>
      <PageBeacon slug={CFG.slug} step="voto-positivo" />
      <VoteBeacon slug={CFG.slug} />

      <style>{`
        @keyframes vpFall { 0% { opacity:.6; transform:translateY(0) rotate(0) } 100% { opacity:0; transform:translateY(100vh) rotate(720deg) } }
        @keyframes vpUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .vp-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; font-weight:700; font-size:16px; padding:15px 28px; border-radius:10px; text-decoration:none; line-height:1; border:none; cursor:pointer; transition:transform .16s ease, opacity .16s ease }
        .vp-btn:hover { transform:translateY(-1px); opacity:.92 }
        .vp-btn:disabled { cursor:default; opacity:.45; transform:none }
        .vp-ta { width:100%; box-sizing:border-box; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:.9rem 1rem; font-family:var(--font-body, system-ui, sans-serif); font-size:.95rem; line-height:1.6; resize:vertical; outline:none; transition:border-color .18s ease }
        .vp-ta:focus { border-color:var(--vp-accent) }
        .vp-ta::placeholder { color:var(--vp-text); opacity:.5 }
        @media (max-width:480px){ .vp-btn{ width:100%; max-width:340px } }
      `}</style>

      {/* Confetti — emojis da marca, dispara só DEPOIS do envio */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50, overflow: "hidden" }}>
        {confetti.map((p) => (
          <span key={p.id} style={{ position: "absolute", top: -30, left: `${p.left}%`, fontSize: p.size, animation: `vpFall ${p.duration}s ease-in ${p.delay}s forwards`, opacity: 0 }}>{p.emoji}</span>
        ))}
      </div>

      <main
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2.5rem 1.5rem",
          textAlign: "center",
          position: "relative",
          background: t.bg,
          ["--vp-accent" as string]: t.accent,
          ["--vp-text" as string]: t.text,
        }}
      >
        {/* glow de acento atrás do conteúdo */}
        <div style={{ position: "absolute", top: "28%", left: "50%", transform: "translateX(-50%)", width: 480, height: 480, maxWidth: "92vw", background: `radial-gradient(circle, ${t.glow}, transparent 65%)`, pointerEvents: "none" }} />

        <a href="/" style={{ marginBottom: "1.75rem", animation: "vpUp .9s ease-out .3s both", position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={CFG.logo} alt={CFG.brand} width={CFG.logoW} height={CFG.logoH} style={{ height: "auto", maxWidth: "70vw" }} />
        </a>

        <p style={{ fontFamily: t.font, letterSpacing: ".22em", textTransform: "uppercase", fontSize: 12, fontWeight: 600, color: "var(--vp-accent)", marginBottom: "1rem", animation: "vpUp .9s ease-out .5s both", position: "relative" }}>{CFG.kicker}</p>

        <h1 style={{ fontFamily: t.font, fontWeight: 800, fontSize: "clamp(2rem, 5vw, 3.25rem)", lineHeight: 1.1, letterSpacing: "-.015em", color: t.heading, marginBottom: "1.25rem", maxWidth: 640, animation: "vpUp .9s ease-out .7s both", position: "relative" }}>
          {CFG.headline} <span style={{ color: "var(--vp-accent)" }}>{CFG.highlight}</span>
        </h1>

        {!sent ? (
          /* ESTADO A — caixa de comentário primeiro */
          <>
            <p style={{ fontSize: "1.125rem", color: t.text, maxWidth: 480, lineHeight: 1.7, marginBottom: "1.75rem", animation: "vpUp .9s ease-out .9s both", position: "relative" }}>
              O que te fez dar nota máxima hoje? Uma frase já molda a próxima edição.
            </p>

            <div style={{ width: "100%", maxWidth: 480, animation: "vpUp .9s ease-out 1.1s both", position: "relative" }}>
              <textarea
                className="vp-ta"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="O que mais te marcou nesta edição?"
                rows={4}
                maxLength={2000}
                style={{ color: t.heading, marginBottom: "1rem" }}
              />
              <button
                className="vp-btn"
                onClick={handleSubmit}
                disabled={sending || !comment.trim()}
                style={{ background: t.btnBg, color: t.btnText }}
              >
                {sending ? "Enviando..." : "Enviar resposta"}
              </button>
            </div>
          </>
        ) : (
          /* ESTADO B — pós-envio: agradecimento + WhatsApp */
          <>
            <p style={{ fontSize: "1.125rem", color: t.text, maxWidth: 480, lineHeight: 1.7, marginBottom: "2.5rem", animation: "vpUp .7s ease-out .05s both", position: "relative" }}>{CFG.paragraph}</p>

            <a href={CFG.shareUrl} target="_blank" rel="noopener noreferrer" className="vp-btn" style={{ background: t.btnBg, color: t.btnText, animation: "vpUp .7s ease-out .25s both", position: "relative" }}>
              Indicar pra um amigo no WhatsApp
            </a>

            <p style={{ fontFamily: t.font, fontStyle: "italic", fontSize: "1rem", color: t.text, opacity: .7, marginTop: "3rem", animation: "vpUp .7s ease-out .45s both", position: "relative" }}>{CFG.tagline}</p>
          </>
        )}
      </main>
    </>
  );
}
