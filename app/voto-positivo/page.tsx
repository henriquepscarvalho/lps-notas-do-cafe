"use client";

/* ============================================================
 * PÁGINA /voto-positivo — MODELO CANÔNICO ÚNICO (rede Scriptorium)
 * AUTO-GERADO por _shared/voto-positivo/build.py
 * NÃO EDITAR À MÃO. Fonte = page.template.tsx + config.json.
 * Para re-skinar TODAS as news: editar este template ou o config
 * e rodar `python3 _shared/voto-positivo/build.py`.
 * Layout = referência bizshot: tela única, CTA sempre acima da dobra.
 * ============================================================ */

import { useEffect, useState } from "react";
import PageBeacon from "../PageBeacon";
import VoteBeacon from "../VoteBeacon";

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

  useEffect(() => {
    setConfetti(
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 7,
        duration: 3 + Math.random() * 3,
        size: 16 + Math.random() * 12,
        emoji: CFG.emojis[Math.floor(Math.random() * CFG.emojis.length)],
      }))
    );
  }, []);

  const t = CFG.theme;

  return (
    <>
      <PageBeacon slug={CFG.slug} step="voto-positivo" />
      <VoteBeacon slug={CFG.slug} />

      <style>{`
        @keyframes vpFall { 0% { opacity:.6; transform:translateY(0) rotate(0) } 100% { opacity:0; transform:translateY(100vh) rotate(720deg) } }
        @keyframes vpUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .vp-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; font-weight:700; font-size:16px; padding:15px 28px; border-radius:10px; text-decoration:none; line-height:1; transition:transform .16s ease, opacity .16s ease }
        .vp-btn:hover { transform:translateY(-1px); opacity:.92 }
        @media (max-width:480px){ .vp-btn{ width:100%; max-width:340px } }
      `}</style>

      {/* Confetti — emojis da marca, some após ~10s */}
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

        <p style={{ fontSize: "1.125rem", color: t.text, maxWidth: 480, lineHeight: 1.7, marginBottom: "2.5rem", animation: "vpUp .9s ease-out .9s both", position: "relative" }}>{CFG.paragraph}</p>

        <a href={CFG.shareUrl} target="_blank" rel="noopener noreferrer" className="vp-btn" style={{ background: t.btnBg, color: t.btnText, animation: "vpUp .9s ease-out 1.1s both", position: "relative" }}>
          Indicar pra um amigo no WhatsApp
        </a>

        <p style={{ fontFamily: t.font, fontStyle: "italic", fontSize: "1rem", color: t.text, opacity: .7, marginTop: "3rem", animation: "vpUp .9s ease-out 1.3s both", position: "relative" }}>{CFG.tagline}</p>
      </main>
    </>
  );
}
