"use client";

import { useEffect } from "react";

export default function Reengajamento() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("active");
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          width: "100%",
          zIndex: 50,
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          background: "rgba(44,24,16,0.88)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            maxWidth: "80rem",
            margin: "0 auto",
            padding: "1rem 1.5rem",
            display: "flex",
            alignItems: "center",
          }}
        >
          <a
            href="/"
            style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}
          >
            <img src="/images/logo/simbolo.png" alt="Notas do Café" width={28} height={28} />
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.125rem",
                fontWeight: 700,
                color: "var(--accent)",
              }}
            >
              Notas do Café
            </span>
          </a>
        </div>
      </nav>

      {/* Hero emocional */}
      <section
        style={{
          minHeight: "72vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "8rem 1.5rem 4rem",
          position: "relative",
          background: "var(--bg)",
        }}
      >
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

        <p
          className="reveal"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: "1.25rem",
            position: "relative",
          }}
        >
          Faz tempo que não nos vemos
        </p>
        <h1
          className="reveal"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(2.25rem, 5.5vw, 4rem)",
            fontWeight: 700,
            lineHeight: 1.15,
            color: "var(--text)",
            maxWidth: "720px",
            margin: "0 auto 1.5rem",
            position: "relative",
          }}
        >
          O café continua quente.<br />
          <em style={{ fontStyle: "italic", color: "var(--accent)" }}>A xícara, também.</em>
        </h1>
        <p
          className="reveal"
          style={{
            fontSize: "1.125rem",
            color: "var(--text-secondary)",
            maxWidth: "520px",
            margin: "0 auto 2.5rem",
            lineHeight: 1.8,
            position: "relative",
          }}
        >
          Percebemos que você não tem aberto as últimas edições. Sem culpa, sem drama. A semana
          corre. Se quiser voltar, é só clicar abaixo e a próxima edição chega sábado de manhã.
        </p>
        <div
          className="reveal"
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            flexWrap: "wrap",
            position: "relative",
          }}
        >
          <a
            href="/cadastro"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "0.95rem 1.75rem",
              background: "var(--accent)",
              color: "var(--bg)",
              border: "1px solid var(--accent)",
              borderRadius: "4px",
              textDecoration: "none",
              transition: "background 0.3s",
            }}
          >
            Quero voltar
          </a>
          <a
            href="/sobre"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "0.95rem 1.75rem",
              background: "transparent",
              color: "var(--accent)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              textDecoration: "none",
              transition: "all 0.3s",
            }}
          >
            Relembrar o que é
          </a>
        </div>
      </section>

      {/* Relembrar */}
      <section
        style={{
          padding: "5rem 1.5rem",
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div className="reveal" style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center" }}>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: "1rem",
            }}
          >
            O que você perde ao sair
          </p>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.5rem, 3.5vw, 2rem)",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "1.5rem",
              lineHeight: 1.3,
            }}
          >
            Uma edição por semana. Cinco minutos. Três seções que cabem na primeira xícara.
          </h2>
          <p
            style={{
              fontSize: "1rem",
              color: "var(--text-secondary)",
              lineHeight: 1.8,
            }}
          >
            Em um ano, você teria conhecido 52 grãos, testado 52 receitas e visto reviews honestos de
            dezenas de equipamentos. Repertório pra escolher café na prateleira com confiança — e
            acertar na xícara toda manhã. Ainda dá tempo.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "3rem 1.5rem",
          textAlign: "center",
          borderTop: "1px solid var(--border)",
          background: "var(--bg)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1rem",
            fontStyle: "italic",
            color: "var(--text-muted)",
          }}
        >
          Bom café. Até sábado.
        </p>
      </footer>
    </>
  );
}
