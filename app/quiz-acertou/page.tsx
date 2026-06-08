"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import PageBeacon from "../PageBeacon";

interface ConfettiPiece { id: number; left: number; delay: number; duration: number; size: number; emoji: string; }

const EMOJIS = ["☕", "🫘", "🍫", "🍂", "🌱"];

const PRIMARY = "#C8963E";
const ACCENT = "#D2691E";

export default function QuizAcertou() {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    setConfetti(
      Array.from({ length: 25 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 7,
        duration: 3 + Math.random() * 3,
        size: 16 + Math.random() * 12,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      }))
    );
  }, []);

  return (
    <>
      <PageBeacon slug="notas-do-cafe" step="quiz-acertou" />
      <style>{`
        @keyframes confettiFall { 0% { opacity: 0.6; transform: translateY(0) rotate(0deg); } 100% { opacity: 0; transform: translateY(100vh) rotate(720deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50, overflow: "hidden" }}>
        {confetti.map((p) => (
          <span key={p.id} style={{ position: "absolute", top: -20, left: `${p.left}%`, fontSize: p.size, animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`, opacity: 0 }}>{p.emoji}</span>
        ))}
      </div>

      <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 24px", textAlign: "center", background: "#2C1810", position: "relative" }}>
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)", width: 500, height: 500, background: `radial-gradient(circle, rgba(200,150,62,0.22), transparent 70%)`, pointerEvents: "none" }} />

        <a href="/" style={{ position: "relative" }}>
          <Image src="/images/logo/simbolo.png" alt="Notas do Café" width={64} height={64} style={{ marginBottom: "2rem", animation: "fadeUp 0.9s ease-out 0.3s both" }} />
        </a>

        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: PRIMARY, marginBottom: "1rem", animation: "fadeUp 0.9s ease-out 0.5s both" }}>✅ Você acertou</p>

        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 700, lineHeight: 1.15, color: "#F5EDE0", marginBottom: "1.25rem", animation: "fadeUp 0.9s ease-out 0.7s both", maxWidth: 600 }}>
          Você leu até a última <em style={{ fontStyle: "italic", color: ACCENT }}>nota</em>. O perfil não escapou.
        </h1>

        <div style={{ width: 40, height: 1, background: PRIMARY, margin: "0 auto 1.25rem", animation: "fadeUp 0.9s ease-out 0.8s both" }} />

        <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", color: "#D4C4AE", maxWidth: 460, lineHeight: 1.75, marginBottom: "2.5rem", animation: "fadeUp 0.9s ease-out 0.9s both" }}>
          Cada edição esconde um detalhe pra quem lê com atenção, uma altitude, um processo de fermentação, uma nota cítrica escondida. Hoje, você foi quem percebeu.
        </p>

        <a href="https://api.whatsapp.com/send/?text=Notas%20do%20Caf%C3%A9%3A%20o%20mundo%20do%20caf%C3%A9%20especial%20em%205%20minutos%20por%20semana.%20https%3A%2F%2Flp.notasdocafe.com.br%2Fcadastro" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: PRIMARY, color: "#2C1810", padding: "12px 32px", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none", animation: "fadeUp 0.9s ease-out 1.1s both" }}>Indicar para um amigo no WhatsApp</a>

        <p style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "1rem", color: "#D4C4AE", marginTop: "3rem", animation: "fadeUp 0.9s ease-out 1.3s both" }}>Você toma café todo dia. A gente te conta o que tem na xícara.</p>
      </main>
    </>
  );
}
