"use client";

import { useEffect, type ReactNode } from "react";
import { PRODUTOS, RETAILER, type Produto } from "./produtos.data";

const sections = [...new Set(PRODUTOS.map((p) => p.section))];

function Card({ p }: { p: Produto }) {
  return (
    <a
      id={p.slug}
      href={RETAILER.search(p.q ?? p.name)}
      target="_blank"
      rel="noopener noreferrer"
      className="reveal produto-card"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "6px",
        padding: "1.75rem",
        textDecoration: "none",
        transition: "all 0.4s",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        scrollMarginTop: "6rem",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.62rem",
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--accent)",
          background: "rgba(200,150,62,0.1)",
          padding: "0.3rem 0.6rem",
          borderRadius: "3px",
          alignSelf: "flex-start",
          marginBottom: "1rem",
        }}
      >
        Edição {p.edicao}
      </span>
      <h3
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.375rem",
          fontWeight: 700,
          color: "var(--text)",
          marginBottom: "1rem",
          lineHeight: 1.3,
          flex: 1,
        }}
      >
        {p.name}
      </h3>
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--accent)",
        }}
      >
        Ver na {RETAILER.label} →
      </span>
    </a>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      className="reveal"
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: "var(--accent)",
        margin: "0 0 1.5rem",
      }}
    >
      {children}
    </h2>
  );
}

export default function Produtos() {
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
            justifyContent: "space-between",
          }}
        >
          <a href="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo/simbolo.png" alt="Notas do Café" width={28} height={28} />
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", fontWeight: 700, color: "var(--accent)" }}>
              Notas do Café
            </span>
          </a>
          <a
            href="/cadastro"
            style={{
              background: "var(--accent)",
              color: "var(--bg)",
              padding: "0.625rem 1.25rem",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Receber
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "9rem 1.5rem 3rem", textAlign: "center", background: "var(--bg)" }}>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: "1rem",
          }}
        >
          Recomendações da curadoria
        </p>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(2.5rem, 6vw, 4rem)",
            fontWeight: 700,
            lineHeight: 1.12,
            color: "var(--text)",
            maxWidth: "640px",
            margin: "0 auto 1rem",
          }}
        >
          Todo equipamento que <em style={{ fontStyle: "italic", color: "var(--accent)" }}>indicamos</em>
        </h1>
        <p
          style={{
            fontSize: "1.125rem",
            color: "var(--text-secondary)",
            maxWidth: "520px",
            margin: "0 auto 3rem",
            lineHeight: 1.8,
          }}
        >
          Cada equipamento já recomendado nas edições. O botão abre a busca na {RETAILER.label} —
          sempre com as ofertas atuais, nunca um link quebrado.
        </p>
      </section>

      {/* Seções */}
      {sections.map((sec) => (
        <section key={sec} style={{ padding: "0 1.5rem 4rem", background: "var(--bg)" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <SectionTitle>{sec}</SectionTitle>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "1.25rem",
              }}
            >
              {PRODUTOS.filter((p) => p.section === sec).map((p) => (
                <Card key={p.slug} p={p} />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Footer */}
      <footer
        style={{
          padding: "3rem 1.5rem",
          textAlign: "center",
          borderTop: "1px solid var(--border)",
          background: "var(--bg)",
        }}
      >
        <p style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontStyle: "italic", color: "var(--text-muted)" }}>
          Bom café. Até sábado.
        </p>
      </footer>

      <style>{`
        html { scroll-behavior: smooth; }
        .produto-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(200,150,62,0.15); }
      `}</style>
    </>
  );
}
