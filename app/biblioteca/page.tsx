"use client";

import { useState, useEffect } from "react";

interface Book {
  title: string;
  author: string;
  category: string;
  essential: boolean;
  description: string;
  amazonUrl: string;
}

const BOOKS: Book[] = [
  {
    title: "The World Atlas of Coffee",
    author: "James Hoffmann",
    category: "Referência",
    essential: true,
    description: "O atlas definitivo do café especial. Países produtores, processos, variedades, preparo. Hoffmann é a autoridade global — leitura obrigatória.",
    amazonUrl: "https://www.amazon.com.br/s?k=world+atlas+of+coffee+hoffmann",
  },
  {
    title: "The Professional Barista's Handbook",
    author: "Scott Rao",
    category: "Preparo",
    essential: true,
    description: "Livro técnico que virou bíblia pra quem quer entender extração de verdade. Proporções, temperatura, tempo, física do café.",
    amazonUrl: "https://www.amazon.com.br/s?k=professional+barista+handbook+scott+rao",
  },
  {
    title: "Café — A Tinta Que Mancha o Mundo",
    author: "Ricardo Araújo Pereira",
    category: "Cultura",
    essential: false,
    description: "Ensaio sobre a cultura do café, da origem às mesas de hoje. Leitura leve, olhar humano, bom pra começar.",
    amazonUrl: "https://www.amazon.com.br/s?k=cafe+a+tinta+que+mancha+o+mundo",
  },
  {
    title: "God in a Cup",
    author: "Michaele Weissman",
    category: "Indústria",
    essential: true,
    description: "Bastidores da terceira onda do café. Roasters que viraram celebridades, fazendas premiadas, cupping scores. Reportagem viva.",
    amazonUrl: "https://www.amazon.com.br/s?k=god+in+a+cup+weissman",
  },
  {
    title: "Uncommon Grounds",
    author: "Mark Pendergrast",
    category: "História",
    essential: false,
    description: "História do café do século XV ao boom das redes globais. 500 anos condensados, do grão ao Starbucks. Referência histórica sólida.",
    amazonUrl: "https://www.amazon.com.br/s?k=uncommon+grounds+pendergrast",
  },
  {
    title: "The Coffee Dictionary",
    author: "Maxwell Colonna-Dashwood",
    category: "Referência",
    essential: false,
    description: "Dicionário ilustrado com 200+ termos do café especial. Perfeito pra consultar quando bate um jargão desconhecido.",
    amazonUrl: "https://www.amazon.com.br/s?k=coffee+dictionary+colonna-dashwood",
  },
  {
    title: "Coffeeology",
    author: "Benjamin Isaac",
    category: "Preparo",
    essential: false,
    description: "Guia prático pra quem quer preparar café especial em casa sem virar barista. Métodos, receitas, ajustes no moedor.",
    amazonUrl: "https://www.amazon.com.br/s?k=coffeeology+benjamin+isaac",
  },
  {
    title: "Café — Do Pé à Xícara",
    author: "Edgard Bressani",
    category: "Cultura",
    essential: false,
    description: "Panorama do café brasileiro: regiões, fazendas, processos. Bom ponto de partida pra entender o que o Brasil produz.",
    amazonUrl: "https://www.amazon.com.br/s?k=cafe+do+pe+a+xicara+bressani",
  },
];

const CATEGORIES = ["Todos", "Referência", "Preparo", "Cultura", "História", "Indústria"];

const GRADIENTS = [
  "linear-gradient(135deg, #8B4513 0%, #C8963E 100%)",
  "linear-gradient(135deg, #3D2517 0%, #D2691E 100%)",
  "linear-gradient(135deg, #2C1810 0%, #8B4513 100%)",
  "linear-gradient(135deg, #D2691E 0%, #C8963E 100%)",
];

export default function Biblioteca() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");

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

  const filtered = BOOKS.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "Todos" || b.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

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
          Curadoria editorial
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
          A <em style={{ fontStyle: "italic", color: "var(--accent)" }}>Biblioteca</em>
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
          Cada livro aqui foi lido, testado na cozinha e aprovado. Só entra na lista o que aprofunda
          a xícara — referência técnica, cultura, história, indústria.
        </p>
      </section>

      {/* Filters */}
      <section style={{ padding: "0 1.5rem 2rem", background: "var(--bg)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <input
              type="text"
              placeholder="Buscar por título ou autor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.9375rem",
                padding: "0.75rem 1.25rem",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                color: "var(--text)",
                outline: "none",
                width: "280px",
                maxWidth: "100%",
              }}
            />
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "0.55rem 1rem",
                    background: activeCategory === cat ? "var(--accent)" : "transparent",
                    color: activeCategory === cat ? "var(--bg)" : "var(--text-secondary)",
                    border: `1px solid ${activeCategory === cat ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "all 0.3s",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section style={{ padding: "2rem 1.5rem 6rem", background: "var(--bg)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 0" }}>
              <p
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.5rem",
                  color: "var(--text-secondary)",
                  marginBottom: "0.75rem",
                }}
              >
                Nenhum livro encontrado
              </p>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)" }}>
                Tente outro termo de busca ou categoria.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1.25rem",
              }}
            >
              {filtered.map((book, i) => (
                <a
                  key={i}
                  href={book.amazonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reveal"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    overflow: "hidden",
                    textDecoration: "none",
                    transition: "all 0.4s",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(200,150,62,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  {/* Cover */}
                  <div
                    style={{
                      aspectRatio: "3/2",
                      background: GRADIENTS[i % GRADIENTS.length],
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      padding: "1.5rem",
                      position: "relative",
                    }}
                  >
                    {book.essential && (
                      <span
                        style={{
                          position: "absolute",
                          top: "0.75rem",
                          right: "0.75rem",
                          fontFamily: "var(--font-body)",
                          fontSize: "0.6rem",
                          fontWeight: 700,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          color: "var(--text)",
                          background: "rgba(0,0,0,0.4)",
                          padding: "0.25rem 0.55rem",
                          borderRadius: "3px",
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        Essencial
                      </span>
                    )}
                    <p
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "1.25rem",
                        fontWeight: 700,
                        color: "var(--text)",
                        textAlign: "center",
                        lineHeight: 1.3,
                      }}
                    >
                      {book.title}
                    </p>
                  </div>
                  {/* Info */}
                  <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: "var(--accent)",
                        marginBottom: "0.4rem",
                      }}
                    >
                      {book.category}
                    </p>
                    <h3
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        color: "var(--text)",
                        marginBottom: "0.25rem",
                        lineHeight: 1.3,
                      }}
                    >
                      {book.title}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                        marginBottom: "0.75rem",
                      }}
                    >
                      {book.author}
                    </p>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--text-secondary)",
                        lineHeight: 1.65,
                        flex: 1,
                      }}
                    >
                      {book.description}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
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
