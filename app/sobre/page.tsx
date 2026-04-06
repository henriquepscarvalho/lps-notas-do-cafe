"use client";

import { useEffect } from "react";

export default function Sobre() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("active");
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const pilares = [
    {
      title: "Curadoria",
      desc: "Lemos tudo, testamos em casa, conversamos com produtores. Só entra na edição o que passa pelo filtro. Sem patrocínio disfarçado de review.",
    },
    {
      title: "Clareza",
      desc: "Sem jargão em inglês. Sem vocabulário de Q-Grader. Café explicado pra quem toma café. O termo técnico aparece, sim, mas sempre traduzido.",
    },
    {
      title: "Honestidade",
      desc: "Se um equipamento não vale, a gente fala. Se um café está caro demais pelo que entrega, a gente fala. Opinião com prós e contras.",
    },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
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
      <section
        style={{
          padding: "10rem 1.5rem 5rem",
          textAlign: "center",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <img
          src="/images/logo/simbolo.png"
          alt="Notas do Café"
          width={72}
          height={72}
          style={{ display: "block", margin: "0 auto 1.5rem" }}
        />
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(2.5rem, 6vw, 4rem)",
            fontWeight: 700,
            lineHeight: 1.1,
            color: "var(--text)",
            marginBottom: "1rem",
          }}
        >
          NOTAS <span style={{ color: "var(--accent)", opacity: 0.5 }}>DO</span>{" "}
          <span style={{ color: "var(--accent)" }}>CAFÉ</span>
        </h1>
        <p
          style={{
            fontFamily: "var(--font-heading)",
            fontStyle: "italic",
            fontSize: "1.125rem",
            color: "var(--text-secondary)",
          }}
        >
          Da fazenda à xícara, sem frescura.
        </p>
      </section>

      {/* Intro */}
      <section style={{ padding: "6rem 1.5rem" }}>
        <div className="reveal" style={{ maxWidth: "720px", margin: "0 auto" }}>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: "1.5rem",
            }}
          >
            A newsletter
          </p>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 700,
              lineHeight: 1.2,
              color: "var(--text)",
              marginBottom: "1.5rem",
            }}
          >
            Café especial brasileiro, sem o ruído
          </h2>
          <div
            style={{
              width: "40px",
              height: "1px",
              background: "var(--accent)",
              marginBottom: "2rem",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <p style={{ fontSize: "1.125rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
              O Brasil é o maior produtor de café do mundo e tem um dos cenários mais vivos de café especial
              do planeta. Mas o conteúdo sobre isso está espalhado: 50 perfis no Instagram, 20 canais no
              YouTube, reviews patrocinados e jargão em inglês. Nenhum editorial semanal que organiza tudo.
            </p>
            <p style={{ fontSize: "1.125rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
              Notas do Café é curadoria semanal de café especial. Uma edição todo sábado com três seções
              fixas: Grão da Semana, Preparo da Semana, Setup Honesto. Pensado pra quem quer entender o que
              toma, sem virar barista.
            </p>
            <p style={{ fontSize: "1.125rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
              Em um ano, você terá conhecido 52 grãos, testado 52 receitas e lido review honesto de dezenas
              de equipamentos. O suficiente pra escolher seu café na prateleira com confiança — e acertar na
              xícara toda manhã.
            </p>
          </div>
        </div>
      </section>

      {/* Pilares */}
      <section
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
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--accent)",
              textAlign: "center",
              marginBottom: "1rem",
            }}
          >
            No que acreditamos
          </p>
          <h2
            className="reveal"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 700,
              color: "var(--text)",
              textAlign: "center",
              margin: "0 auto 3rem",
              maxWidth: "640px",
              lineHeight: 1.2,
            }}
          >
            Três princípios <em style={{ fontStyle: "italic", color: "var(--accent)" }}>inegociáveis</em>
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {pilares.map((p, i) => (
              <div
                key={i}
                className="reveal"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  padding: "2.25rem 1.75rem",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "var(--accent)",
                    marginBottom: "0.75rem",
                  }}
                >
                  0{i + 1}
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
                <p style={{ fontSize: "0.975rem", color: "var(--text-secondary)", lineHeight: 1.75 }}>
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formato */}
      <section style={{ padding: "6rem 1.5rem" }}>
        <div
          className="reveal"
          style={{
            maxWidth: "680px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
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
            Formato
          </p>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 700,
              color: "var(--text)",
              lineHeight: 1.2,
              marginBottom: "2rem",
            }}
          >
            Como funciona
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "2rem",
              textAlign: "center",
            }}
          >
            {[
              { label: "Frequência", value: "Semanal" },
              { label: "Quando", value: "Sábado" },
              { label: "Leitura", value: "5 minutos" },
              { label: "Custo", value: "Gratuita" },
            ].map((item) => (
              <div key={item.label}>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.65rem",
                    fontWeight: 600,
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    color: "var(--accent)",
                    marginBottom: "0.5rem",
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "1.75rem",
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  {item.value}
                </p>
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
          textAlign: "center",
        }}
      >
        <div className="reveal" style={{ maxWidth: "560px", margin: "0 auto" }}>
          <h3
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.5rem, 3.5vw, 2rem)",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "1rem",
              lineHeight: 1.3,
            }}
          >
            Comece sábado. <em style={{ fontStyle: "italic", color: "var(--accent)" }}>Bom café.</em>
          </h3>
          <p style={{ fontSize: "1rem", color: "var(--text-secondary)", marginBottom: "2rem", lineHeight: 1.75 }}>
            Uma edição por semana. Cinco minutos. Três seções que cabem na primeira xícara.
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
    </main>
  );
}
