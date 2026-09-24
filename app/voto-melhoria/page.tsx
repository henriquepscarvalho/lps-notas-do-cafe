"use client";

import { useState } from "react";
import PageBeacon from "../PageBeacon";
import VoteBeacon, { submitVoteComment } from "../VoteBeacon";
import AssinaComo, { enviarAssinatura } from "../AssinaComo"; // exo/25

export default function VotoMelhoria() {
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [falhou, setFalhou] = useState(false);

  async function handleSubmit() {
    if (sending || !comment.trim()) return;
    setSending(true);
    if (!(await submitVoteComment("notas-do-cafe", comment))) {
      setFalhou(true);
      setSending(false);
      return;
    }
    setFalhou(false);
    await enviarAssinatura("notas-do-cafe"); // exo/25
    setSent(true);
    setSending(false);
  }

  return (
    <>
      <PageBeacon slug="notas-do-cafe" step="voto-melhoria" />
      <VoteBeacon slug="notas-do-cafe" />
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

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
            width: "min(500px, 100vw)",
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
          O que faria virar{" "}
          <em style={{ fontStyle: "italic", color: "var(--accent)" }}>5</em>?
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
          Quase um café perfeito. Conte o que faltou: lemos cada resposta, e o pedido que volta muda a xícara.
        </p>

        <div
          style={{
            background: "rgba(200,150,62,0.06)",
            border: "1px solid rgba(200,150,62,0.25)",
            borderRadius: "8px",
            padding: "2rem",
            maxWidth: "480px",
            width: "100%",
            animation: "fadeUp 0.9s ease-out 1.1s both",
            position: "relative",
          }}
        >
          {sent ? (
            <>
              <h3
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.375rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: "0.75rem",
                }}
              >
                Recebido
              </h3>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                Sua resposta vai pra bancada de edição. Lemos cada uma; quando o mesmo pedido volta, a xícara muda.
              </p>
            </>
          ) : (
            <>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="O que faltou na xícara de hoje?"
                rows={4}
                maxLength={2000}
                style={{
                  width: "100%",
                  background: "var(--bg)",
                  border: "1px solid rgba(200,150,62,0.3)",
                  borderRadius: "4px",
                  padding: "0.9rem 1rem",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.9375rem",
                  color: "var(--text)",
                  lineHeight: 1.6,
                  resize: "vertical",
                  outline: "none",
                  marginBottom: "1rem",
                }}
              />
              <AssinaComo slug="notas-do-cafe" />
              <button
                onClick={handleSubmit}
                disabled={sending || !comment.trim()}
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
                  border: "none",
                  cursor: comment.trim() ? "pointer" : "default",
                  opacity: comment.trim() ? 1 : 0.5,
                  transition: "background 0.3s",
                }}
              >
                {sending ? "Enviando..." : falhou ? "Tentar de novo" : "Enviar resposta"}
              </button>
              {falhou ? (
                <p role="alert" data-voto-erro style={{ fontSize: ".9rem", lineHeight: 1.5, marginTop: ".85rem", opacity: 0.85 }}>
                  Sua resposta não chegou. Tente de novo; se falhar outra vez, responda o email da edição.
                </p>
              ) : null}
            </>
          )}
        </div>
      </main>
    </>
  );
}
