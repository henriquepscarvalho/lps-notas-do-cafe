"use client";

import Image from "next/image";

const PRIMARY = "#8B4513";
const ACCENT = "#C8963E";

export default function QuizErrou() {
  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 24px", textAlign: "center", background: "#2C1810", position: "relative" }}>
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)", width: 500, height: 500, background: `radial-gradient(circle, rgba(139,69,19,0.30), transparent 70%)`, pointerEvents: "none" }} />

        <a href="/" style={{ position: "relative" }}>
          <Image src="/images/logo/simbolo.png" alt="Notas do Café" width={64} height={64} style={{ marginBottom: "2rem", animation: "fadeUp 0.9s ease-out 0.3s both" }} />
        </a>

        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: ACCENT, marginBottom: "1rem", animation: "fadeUp 0.9s ease-out 0.5s both" }}>❌ Você errou</p>

        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 700, lineHeight: 1.15, color: "#F5EDE0", marginBottom: "1.25rem", animation: "fadeUp 0.9s ease-out 0.7s both", maxWidth: 600 }}>
          Todo primeiro <em style={{ fontStyle: "italic", color: ACCENT }}>gole</em> esconde algo.
        </h1>

        <div style={{ width: 40, height: 1, background: ACCENT, margin: "0 auto 1.25rem", animation: "fadeUp 0.9s ease-out 0.8s both" }} />

        <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", color: "#D4C4AE", maxWidth: 460, lineHeight: 1.75, marginBottom: "2.5rem", animation: "fadeUp 0.9s ease-out 0.9s both" }}>
          Cada edição esconde um detalhe sobre o grão da semana, uma origem, um processo, uma nota sutil no copo. Volte ao email, leia com calma, e o sabor vai aparecer.
        </p>

        <a href="https://api.whatsapp.com/send/?text=Notas%20do%20Caf%C3%A9%3A%20o%20mundo%20do%20caf%C3%A9%20especial%20em%205%20minutos%20por%20semana.%20https%3A%2F%2Flp.notasdocafe.com.br%2Fcadastro" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: ACCENT, color: "#2C1810", padding: "12px 32px", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none", animation: "fadeUp 0.9s ease-out 1.1s both" }}>Indicar para um amigo no WhatsApp</a>

        <p style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "1rem", color: "#D4C4AE", marginTop: "3rem", animation: "fadeUp 0.9s ease-out 1.3s both" }}>Você toma café todo dia. A gente te conta o que tem na xícara.</p>
      </main>
    </>
  );
}
