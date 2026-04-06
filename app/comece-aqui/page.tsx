"use client";

import { useEffect } from "react";

export default function ComeceAqui() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const parent = entry.target.parentElement;
            if (parent) {
              const siblings = Array.from(parent.querySelectorAll(".reveal"));
              const index = siblings.indexOf(entry.target);
              (entry.target as HTMLElement).style.transitionDelay = `${index * 0.1}s`;
            }
            entry.target.classList.add("active");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const pilares = [
    {
      number: "I",
      title: "Grão da Semana",
      desc: "Um café destrinchado por completo: origem, notas de sabor, preparo ideal, onde comprar. Sem jargão de Q-Grader.",
    },
    {
      number: "II",
      title: "Preparo da Semana",
      desc: "Uma receita com proporções, temperatura e tempo. E por que funciona. Do V60 à prensa francesa, passo a passo.",
    },
    {
      number: "III",
      title: "Setup Honesto",
      desc: "Review de equipamento com prós e contras. Sem patrocínio, sem link disfarçado. Se não vale, a gente fala.",
    },
  ];

  const passos = [
    {
      step: "01",
      title: "Leia todo sábado de manhã",
      desc: "Antes do primeiro gole, você recebe a edição da semana. 5 minutos de leitura. Combina com a primeira xícara.",
    },
    {
      step: "02",
      title: "Teste uma coisa só",
      desc: "Não mude tudo de uma vez. Escolha um grão, uma receita ou um equipamento. Teste na semana. Veja o que muda na xícara.",
    },
    {
      step: "03",
      title: "Monte seu repertório",
      desc: "Aos poucos, você entende o que funciona pro seu paladar. Salva o que acerta. Ignora o que não faz sentido pra sua rotina.",
    },
  ];

  return (
    <>
      {/* Nav */}
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
      <section style={{ padding: "10rem 1.5rem 5rem", textAlign: "center", background: "var(--bg)" }}>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: "1.25rem",
          }}
        >
          Por onde começar
        </p>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            fontWeight: 700,
            lineHeight: 1.1,
            color: "var(--text)",
            maxWidth: "700px",
            margin: "0 auto 1.5rem",
          }}
        >
          Seu guia para as <em style={{ fontStyle: "italic", color: "var(--accent)" }}>Notas do Café</em>
        </h1>
        <p
          style={{
            fontSize: "1.125rem",
            color: "var(--text-secondary)",
            maxWidth: "520px",
            margin: "0 auto 2.5rem",
            lineHeight: 1.75,
          }}
        >
          Tudo que você precisa saber para transformar 5 minutos por semana em café de verdade na sua xícara.
          Sem elitismo. Sem patrocínio. Só curadoria.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
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
              transition: "all 0.3s",
            }}
          >
            Receber todo sábado
          </a>
          <a
            href="#pilares"
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
            Como funciona
          </a>
        </div>
      </section>

      {/* Pilares */}
      <section
        id="pilares"
        style={{
          padding: "6rem 1.5rem",
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <p
            className="reveal"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--accent)",
              textAlign: "center",
              marginBottom: "1rem",
            }}
          >
            O que você recebe toda semana
          </p>
          <h2
            className="reveal"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              fontWeight: 700,
              color: "var(--text)",
              textAlign: "center",
              margin: "0 auto 3rem",
              maxWidth: "700px",
              lineHeight: 1.2,
            }}
          >
            Três seções. Uma <em style={{ fontStyle: "italic", color: "var(--accent)" }}>xícara</em>.
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {pilares.map((p) => (
              <div
                key={p.number}
                className="reveal"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  padding: "2.5rem 2rem",
                  transition: "border-color 0.4s, transform 0.4s",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "3rem",
                    fontWeight: 400,
                    color: "var(--accent)",
                    marginBottom: "1rem",
                    lineHeight: 1,
                  }}
                >
                  {p.number}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "var(--text)",
                    marginBottom: "0.75rem",
                  }}
                >
                  {p.title}
                </h3>
                <p style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.75 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Passos */}
      <section style={{ padding: "6rem 1.5rem", background: "var(--bg)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <p
            className="reveal"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--accent)",
              textAlign: "center",
              marginBottom: "1rem",
            }}
          >
            O caminho
          </p>
          <h2
            className="reveal"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              fontWeight: 700,
              color: "var(--text)",
              textAlign: "center",
              margin: "0 auto 3.5rem",
              maxWidth: "700px",
              lineHeight: 1.2,
            }}
          >
            3 passos para <em style={{ fontStyle: "italic", color: "var(--accent)" }}>acertar na xícara</em>
          </h2>
          <div
            style={{
              maxWidth: "620px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "2rem",
            }}
          >
            {passos.map((p, i) => (
              <div
                key={i}
                className="reveal"
                style={{
                  display: "flex",
                  gap: "1.5rem",
                  alignItems: "flex-start",
                  position: "relative",
                }}
              >
                {i < passos.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      left: "24px",
                      top: "52px",
                      width: "1px",
                      height: "calc(100% + 0.5rem)",
                      background: "linear-gradient(to bottom, var(--accent), transparent)",
                      opacity: 0.3,
                    }}
                  />
                )}
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    border: "1px solid var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-heading)",
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "var(--accent)",
                    flexShrink: 0,
                    background: "var(--bg)",
                  }}
                >
                  {p.step}
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "1.375rem",
                      fontWeight: 700,
                      color: "var(--text)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {p.title}
                  </h3>
                  <p style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.75 }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section
        style={{
          padding: "6rem 1.5rem",
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div
          className="reveal"
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "2.75rem",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "2px",
              background: "linear-gradient(90deg, var(--primary), var(--accent))",
            }}
          />
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: "1rem",
            }}
          >
            Próximo sábado
          </p>
          <h3
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "1rem",
            }}
          >
            Uma edição por semana. Direto no seu email.
          </h3>
          <p style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1.5rem" }}>
            Comece no próximo sábado de manhã. Cancele quando quiser. Sem taxa, sem patrocínio, sem elitismo.
          </p>
          <a
            href="/cadastro"
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
            }}
          >
            Receber todo sábado
          </a>
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
