"use client";

import { useEffect } from "react";

interface Tool {
  name: string;
  description: string;
  pricing: "grátis" | "freemium" | "pago";
  platform: string;
  featured: boolean;
  url: string;
}

const TOOLS: Tool[] = [
  {
    name: "Beanz",
    description: "Marketplace brasileiro de café especial. Filtra por torrefação, origem, processo. Boa curadoria e frete nacional.",
    pricing: "grátis",
    platform: "Web",
    featured: true,
    url: "https://beanz.com.br",
  },
  {
    name: "Filter Ratio Coffee",
    description: "App de proporção e timer de café pra métodos de filtragem. V60, Chemex, Aeropress, Clever. Calcula café, água e tempo.",
    pricing: "grátis",
    platform: "iOS · Android",
    featured: true,
    url: "https://apps.apple.com/app/filtru-coffee-brewing-guide/id1486380682",
  },
  {
    name: "Coffee Review",
    description: "Maior base de dados de cupping do mundo, com notas de 90+ pontos. Referência global pra avaliar café especial.",
    pricing: "grátis",
    platform: "Web",
    featured: false,
    url: "https://www.coffeereview.com",
  },
  {
    name: "Acaia Coffee Scale app",
    description: "App que conecta com balanças Acaia (padrão do mundo do café). Grava receitas, acompanha extração, salva histórico.",
    pricing: "grátis",
    platform: "iOS · Android",
    featured: false,
    url: "https://acaia.co/pages/apps",
  },
  {
    name: "Brew Guide",
    description: "Guia passo a passo de preparo pra diversos métodos. V60, Chemex, French Press, Moka. Timer integrado, receitas visuais.",
    pricing: "freemium",
    platform: "iOS · Android",
    featured: false,
    url: "https://apps.apple.com/app/brew-better-coffee/id1459056244",
  },
  {
    name: "Um Coffee Co.",
    description: "Torrefação referência no Brasil. Catálogo rotativo de grãos nacionais e importados, com ficha técnica detalhada.",
    pricing: "pago",
    platform: "Web",
    featured: false,
    url: "https://umcoffeeco.com",
  },
];

export default function Ferramentas() {
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

  const pricingColors: Record<string, { bg: string; color: string }> = {
    "grátis": { bg: "rgba(200,150,62,0.12)", color: "var(--accent)" },
    "freemium": { bg: "rgba(210,105,30,0.12)", color: "var(--secondary)" },
    "pago": { bg: "rgba(139,69,19,0.15)", color: "var(--primary)" },
  };

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
      <section style={{ padding: "9rem 1.5rem 3rem", textAlign: "center", background: "var(--bg)" }}>
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
          Ferramentas do café
        </p>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(2.5rem, 6vw, 4rem)",
            fontWeight: 700,
            lineHeight: 1.12,
            color: "var(--text)",
            maxWidth: "620px",
            margin: "0 auto 1rem",
          }}
        >
          Apps, lojas e <em style={{ fontStyle: "italic", color: "var(--accent)" }}>curadorias</em>
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
          As ferramentas que usamos pra testar cada edição — e que você pode usar pra melhorar
          o café da sua cozinha.
        </p>
      </section>

      {/* Grid */}
      <section style={{ padding: "0 1.5rem 6rem", background: "var(--bg)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {TOOLS.map((tool, i) => (
              <a
                key={i}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="reveal"
                style={{
                  background: "var(--surface)",
                  border: tool.featured ? "1px solid var(--accent)" : "1px solid var(--border)",
                  borderRadius: "6px",
                  padding: "1.75rem",
                  textDecoration: "none",
                  transition: "all 0.4s",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(200,150,62,0.15)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                {tool.featured && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-10px",
                      right: "1rem",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "var(--bg)",
                      background: "var(--accent)",
                      padding: "0.3rem 0.75rem",
                      borderRadius: "3px",
                    }}
                  >
                    Essencial
                  </span>
                )}
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: pricingColors[tool.pricing].color,
                      background: pricingColors[tool.pricing].bg,
                      padding: "0.3rem 0.6rem",
                      borderRadius: "3px",
                    }}
                  >
                    {tool.pricing}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.62rem",
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      background: "rgba(245,237,224,0.06)",
                      padding: "0.3rem 0.6rem",
                      borderRadius: "3px",
                    }}
                  >
                    {tool.platform}
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "1.375rem",
                    fontWeight: 700,
                    color: "var(--text)",
                    marginBottom: "0.5rem",
                    lineHeight: 1.3,
                  }}
                >
                  {tool.name}
                </h3>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.7,
                    marginBottom: "1rem",
                    flex: 1,
                  }}
                >
                  {tool.description}
                </p>
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
                  Acessar →
                </span>
              </a>
            ))}
          </div>
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
