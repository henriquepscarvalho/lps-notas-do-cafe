"use client";

import { useState } from "react";
import PageBeacon, { sendBeacon } from "../PageBeacon";

// Isca da semana 1 da Nutrição (ticket 05, conta RF): o botão do email aponta
// pra cá (Beehiiv não rastreia mailto cru). Converte o clique rastreado em
// mailto pré-preenchido; o reply cai no Worker de auto-reply (leia@).
const EMAIL = "leia@notasdocafe.com.br";
const SUBJECT = "Minha frase pro Notas do Café";
const BODY = "No café, quero entender ";
const MAILTO =
  `mailto:${EMAIL}` +
  `?subject=${encodeURIComponent(SUBJECT)}` +
  `&body=${encodeURIComponent(BODY)}`;

const HEAD = "'Eczar', Georgia, serif";

export default function ResponderEmail() {
  const [copiado, setCopiado] = useState(false);
  const copiar = () => {
    try { navigator.clipboard.writeText(EMAIL); } catch { /* clipboard bloqueado */ }
    setCopiado(true);
    sendBeacon("notas-do-cafe", "responder-email", { eventType: "converteu" });
  };

  return (
    <>
      <PageBeacon slug="notas-do-cafe" step="responder-email" source="nutricao" />
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blink { 0%,55% { opacity:1; } 56%,100% { opacity:0; } }
      `}</style>

      <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 24px", textAlign: "center", background: "#2C1810", color: "#F5EDE0" }}>
        <p style={{ fontFamily: HEAD, fontStyle: "italic", color: "#8B4513", letterSpacing: ".02em", marginBottom: "1rem", fontWeight: 600, animation: "fadeUp .9s ease-out .4s both" }}>✉️ Canal direto</p>

        <h1 style={{ fontFamily: HEAD, fontWeight: 700, fontSize: "clamp(1.9rem, 4vw, 3rem)", lineHeight: 1.12, letterSpacing: "-.01em", marginBottom: "1.25rem", maxWidth: 600, animation: "fadeUp .9s ease-out .6s both" }}>
          Do outro lado <span style={{ color: "#8B4513" }}>tem gente</span>
        </h1>

        <div style={{ width: 40, height: 2, background: "#8B4513", margin: "0 auto 1.25rem", animation: "fadeUp .9s ease-out .7s both" }} />

        <p style={{ fontSize: "1rem", color: "#9B8D82", maxWidth: 460, lineHeight: 1.7, marginBottom: "2.5rem", animation: "fadeUp .9s ease-out .8s both" }}>
          O botão abre seu email com a frase já começada: o que você mais quer descobrir sobre o café que toma todo dia. Complete, envie, e a resposta volta pra sua caixa.
        </p>

        <div style={{ background: "#101010", border: "1px solid rgba(255,255,255,.08)", borderRadius: 36, padding: 10, width: "100%", maxWidth: 320, marginBottom: "2.5rem", animation: "fadeUp .9s ease-out .9s both", boxShadow: "0 18px 50px rgba(0,0,0,.4)" }}>
          <div style={{ background: "#F3F3F1", borderRadius: 28, overflow: "hidden", textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", borderBottom: "1px solid rgba(20,20,20,.1)" }}>
              <span style={{ fontSize: ".8rem", color: "rgba(20,20,20,.45)" }}>Cancelar</span>
              <span style={{ fontSize: ".85rem", fontWeight: 700, color: "#141414" }}>Nova mensagem</span>
              <span style={{ fontSize: ".8rem", fontWeight: 700, color: "#8B4513" }}>Enviar</span>
            </div>
            <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(20,20,20,.08)", fontSize: ".82rem", color: "#141414" }}>
              <span style={{ color: "rgba(20,20,20,.45)" }}>Para: </span>{EMAIL}
            </div>
            <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(20,20,20,.08)", fontSize: ".82rem", fontWeight: 700, color: "#141414" }}>
              {SUBJECT}
            </div>
            <p style={{ padding: "14px 16px 6px", fontSize: ".85rem", lineHeight: 1.65, color: "#141414", margin: 0 }}>
              {BODY}
              <span style={{ borderBottom: "2px solid #8B4513", display: "inline-block", minWidth: 96 }}>
                <span style={{ color: "#8B4513", fontWeight: 700, animation: "blink 1.1s step-end infinite" }}>▍</span>
              </span>
            </p>
            <p style={{ padding: "0 16px 16px", fontSize: ".72rem", color: "#8B4513", fontWeight: 700, margin: 0 }}>
              você completa a frase e envia
            </p>
          </div>
        </div>

        <a href={MAILTO}
          style={{ display: "inline-block", padding: "14px 34px", background: "#8B4513", color: "#fff", fontFamily: HEAD, fontWeight: 700, fontSize: "1rem", textDecoration: "none", borderRadius: 8, animation: "fadeUp .9s ease-out 1s both" }}
          onClick={() => sendBeacon("notas-do-cafe", "responder-email", { eventType: "converteu" })}
        >
          Abrir meu email e responder
        </a>

        <p style={{ fontSize: ".9rem", color: "#9B8D82", marginTop: "1.5rem", animation: "fadeUp .9s ease-out 1.1s both" }}>
          Prefere digitar direto? Escreva pra{" "}
          <button onClick={copiar} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", color: "#8B4513", textDecoration: "underline" }}>
            {copiado ? "copiado ✓" : EMAIL}
          </button>
        </p>

        <p style={{ fontFamily: HEAD, fontStyle: "italic", fontSize: "1rem", color: "#9B8D82", marginTop: "3rem", animation: "fadeUp .9s ease-out 1.2s both" }}>
          Bom café, até a próxima.
        </p>
      </main>
    </>
  );
}
