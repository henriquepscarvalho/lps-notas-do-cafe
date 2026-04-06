"use client";

import { useEffect, useState } from "react";

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  emoji: string;
}

export default function VotoPositivo() {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const emojis = ["☕", "🫘", "♨️", "📦", "✨"];
    const pieces: ConfettiPiece[] = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 7,
      duration: 3 + Math.random() * 3,
      size: 16 + Math.random() * 14,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
    setConfetti(pieces);
  }, []);

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0% { opacity: 0.6; transform: translateY(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(100vh) rotate(720deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Confetti */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50, overflow: "hidden" }}>
        {confetti.map((p) => (
          <span
            key={p.id}
            style={{
              position: "absolute",
              top: "-40px",
              left: `${p.left}%`,
              fontSize: `${p.size}px`,
              animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
              opacity: 0,
            }}
          >
            {p.emoji}
          </span>
        ))}
      </div>

      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem 1.5rem",
          textAlign: "center",
          background: "var(--bg)",
          position: "relative",
        }}
      >
        {/* Gold glow */}
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "500px",
            height: "500px",
            background: "radial-gradient(circle, rgba(200,150,62,0.10) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />

        <a href="/" style={{ marginBottom: "2rem", animation: "fadeUp 0.9s ease-out 0.3s both", position: "relative" }}>
          <img
            src="/images/logo/simbolo.png"
            alt="Notas do Café"
            width={64}
            height={64}
          />
        </a>

        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: "1rem",
            animation: "fadeUp 0.9s ease-out 0.5s both",
            position: "relative",
          }}
        >
          Voto registrado
        </p>

        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 700,
            lineHeight: 1.1,
            color: "var(--text)",
            marginBottom: "1.25rem",
            maxWidth: "640px",
            animation: "fadeUp 0.9s ease-out 0.7s both",
            position: "relative",
          }}
        >
          Obrigado pelo seu{" "}
          <em style={{ fontStyle: "italic", color: "var(--accent)" }}>voto</em>
        </h1>

        <p
          style={{
            fontSize: "1.125rem",
            color: "var(--text-secondary)",
            maxWidth: "480px",
            lineHeight: 1.8,
            marginBottom: "2.5rem",
            animation: "fadeUp 0.9s ease-out 0.9s both",
            position: "relative",
          }}
        >
          Saber que a edição de hoje acertou na xícara é o que faz cada sábado valer a pena.
          Semana que vem tem mais — sábado de manhã, como sempre.
        </p>

        <a
          href="https://api.whatsapp.com/send/?text=https%3A%2F%2Flp.notasdocafe.com.br%2Fcadastro"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            fontFamily: "var(--font-body)",
            fontSize: "0.8rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "0.95rem 2rem",
            background: "var(--accent)",
            color: "var(--bg)",
            borderRadius: "4px",
            textDecoration: "none",
            transition: "background 0.3s",
            animation: "fadeUp 0.9s ease-out 1.1s both",
            position: "relative",
          }}
        >
          Indicar para um amigo no WhatsApp
        </a>

        <p
          style={{
            fontFamily: "var(--font-heading)",
            fontStyle: "italic",
            fontSize: "1rem",
            color: "var(--text-muted)",
            marginTop: "3rem",
            animation: "fadeUp 0.9s ease-out 1.3s both",
            position: "relative",
          }}
        >
          Bom café. Até sábado.
        </p>
      </main>
    </>
  );
}
