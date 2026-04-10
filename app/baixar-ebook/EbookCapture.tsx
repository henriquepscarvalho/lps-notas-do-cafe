"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const AUTOMATION_ID = "aut_e7997773-c01a-46ec-b616-a3a08ea4e3cf";

const CHAPTERS = [
  {
    num: "01",
    title: "Espresso",
    desc: "O concentrado que define a cultura do café. 30ml que revelam tudo sobre a qualidade do grão.",
    score: "9.2/10",
  },
  {
    num: "02",
    title: "V60",
    desc: "A filtração que revela o grão sem piedade. O método mais honesto do café especial.",
    score: "9.0/10",
  },
  {
    num: "03",
    title: "French Press",
    desc: "Imersão total, corpo cheio, debate eterno. O método mais democrático do café.",
    score: "7.5/10",
  },
  {
    num: "04",
    title: "AeroPress",
    desc: "Versatilidade máxima em 2 minutos. Faz espresso, cold brew e filtrado. O melhor custo-benefício.",
    score: "8.8/10",
    highlight: true,
  },
  {
    num: "05",
    title: "Chemex",
    desc: "Beleza de laboratório, clareza na xícara. O filtro grosso produz o café mais limpo que existe.",
    score: "8.4/10",
  },
  {
    num: "06",
    title: "Moka (Bialetti)",
    desc: "O café da vovó reinventado. Extração por vapor, sabor intenso, consistência previsível.",
    score: "7.8/10",
  },
  {
    num: "07",
    title: "Cold Brew",
    desc: "Extração fria, 12 horas, resultado que divide opiniões. Naturalmente adocicado e concentrado.",
    score: "8.1/10",
  },
];

type Status = "idle" | "sending" | "success" | "error";

const BUTTON_TEXT: Record<Status, string> = {
  idle: "Quero o guia",
  sending: "Enviando...",
  success: "Pronto!",
  error: "Erro — tente novamente",
};

export default function EbookCapture() {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("active");
        }),
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email") as string;
    if (!email) return;
    setStatus("sending");
    try {
      const body: Record<string, string> = { email };
      if (AUTOMATION_ID) body.automationId = AUTOMATION_ID;
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setTimeout(() => {
        window.location.href = "/baixar-ebook-confirmado";
      }, 1500);
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes float { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-12px) } }
            .animate-float { animation: float 6s ease-in-out infinite; }
            .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s, transform 0.6s; }
            .reveal.active { opacity: 1; transform: translateY(0); }
          `,
        }}
      />

      {/* ── Top Bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          padding: "20px 24px",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
      >
        <Image
          src="/images/logo/simbolo.png"
          alt="Notas do Café"
          width={32}
          height={32}
          style={{ objectFit: "contain" }}
        />
        <span
          style={{
            fontFamily: "'Eczar', Georgia, serif",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#C4A882",
            letterSpacing: "0.02em",
          }}
        >
          Notas do Café
        </span>
      </div>

      {/* ── Hero ── */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          background: "#2C1810",
          position: "relative",
          overflow: "hidden",
          padding: "100px 24px 80px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-200px",
            right: "-200px",
            width: "700px",
            height: "700px",
            background:
              "radial-gradient(circle, rgba(200,150,62,0.09) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "72px",
            alignItems: "center",
            position: "relative",
            zIndex: 1,
            width: "100%",
          }}
        >
          {/* Left */}
          <div>
            <p
              style={{
                display: "inline-flex",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "0.73rem",
                fontWeight: 600,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                color: "#C8963E",
                background: "rgba(200,150,62,0.10)",
                border: "1px solid rgba(200,150,62,0.22)",
                padding: "7px 16px",
                borderRadius: "100px",
                marginBottom: "24px",
              }}
            >
              Guia gratuito em PDF
            </p>
            <h1
              style={{
                fontFamily: "'Eczar', Georgia, serif",
                fontSize: "clamp(2.8rem, 5vw, 4rem)",
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1.05,
                marginBottom: "16px",
                letterSpacing: "-0.01em",
              }}
            >
              A Xícara Certa
            </h1>
            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "1rem",
                color: "#C4A882",
                lineHeight: 1.75,
                marginBottom: "36px",
              }}
            >
              7 métodos de preparo avaliados com o filtro editorial. Sem
              frescura. Sem snobismo. Só o que vale a xícara.
            </p>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", gap: "12px", marginBottom: "14px" }}
            >
              <input
                type="email"
                name="email"
                required
                placeholder="Seu melhor email"
                style={{
                  flex: 1,
                  padding: "16px 20px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(245,237,224,0.08)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "0.88rem",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={status === "sending" || status === "success"}
                style={{
                  padding: "16px 28px",
                  background: "#C8963E",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontFamily: "'Eczar', Georgia, serif",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.01em",
                  opacity: status === "sending" || status === "success" ? 0.7 : 1,
                }}
              >
                {BUTTON_TEXT[status]}
              </button>
            </form>
            <p
              style={{
                fontSize: "0.72rem",
                color: "#C4A882",
                lineHeight: 1.6,
                opacity: 0.65,
              }}
            >
              Gratuito. Você recebe o PDF na hora + a newsletter Notas do Café
              (curadoria semanal de café especial).
            </p>
          </div>

          {/* Right */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              src="/images/mockup-ebook.png"
              alt="Ebook A Xícara Certa"
              width={380}
              height={480}
              className="animate-float"
              style={{
                maxWidth: "390px",
                width: "100%",
                height: "auto",
                filter: "drop-shadow(0 32px 64px rgba(200,150,62,0.18))",
              }}
              priority
            />
          </div>
        </div>
      </section>

      {/* ── Capítulos ── */}
      <section
        style={{
          padding: "100px 24px",
          background: "#3D2517",
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
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(200,150,62,0.2), transparent)",
          }}
        />

        <div style={{ maxWidth: "920px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "'Eczar', Georgia, serif",
              fontSize: "clamp(1.9rem, 3.5vw, 2.6rem)",
              fontWeight: 700,
              textAlign: "center",
              marginBottom: "64px",
              color: "#F5EDE0",
              lineHeight: 1.2,
            }}
          >
            7 métodos.{" "}
            <span style={{ color: "#C8963E" }}>7 veredictos.</span>
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            {CHAPTERS.map((ch) => (
              <div
                key={ch.num}
                className="reveal"
                style={{
                  padding: "30px",
                  border: ch.highlight
                    ? "1px solid rgba(200,150,62,0.18)"
                    : "1px solid rgba(245,237,224,0.08)",
                  borderRadius: "12px",
                  background: ch.highlight
                    ? "rgba(200,150,62,0.04)"
                    : "rgba(44,24,16,0.6)",
                  gridColumn: ch.highlight ? "1 / -1" : undefined,
                  display: ch.highlight ? "flex" : undefined,
                  alignItems: ch.highlight ? "center" : undefined,
                  gap: ch.highlight ? "28px" : undefined,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Eczar', Georgia, serif",
                    fontSize: ch.highlight ? "4.5rem" : "3.2rem",
                    fontWeight: 800,
                    color: "#C8963E",
                    opacity: ch.highlight ? 0.18 : 0.14,
                    lineHeight: 1,
                    marginBottom: ch.highlight ? 0 : "12px",
                    display: "block",
                    minWidth: ch.highlight ? "90px" : undefined,
                    textAlign: ch.highlight ? "center" : undefined,
                  }}
                >
                  {ch.num}
                </span>
                <div>
                  <h3
                    style={{
                      fontFamily: "'Eczar', Georgia, serif",
                      fontSize: ch.highlight ? "1.3rem" : "1.18rem",
                      fontWeight: 700,
                      color: "#F5EDE0",
                      marginBottom: "10px",
                    }}
                  >
                    {ch.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: "0.86rem",
                      color: "#C4A882",
                      lineHeight: 1.65,
                    }}
                  >
                    {ch.desc}
                  </p>
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: "12px",
                      padding: "3px 10px",
                      background: "rgba(200,150,62,0.10)",
                      border: "1px solid rgba(200,150,62,0.18)",
                      borderRadius: "100px",
                      fontFamily: "'Eczar', Georgia, serif",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: "#C8963E",
                    }}
                  >
                    Score: {ch.score}
                    {ch.highlight && " — O mais versátil dos 7"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section
        style={{
          padding: "100px 24px",
          background: "#2C1810",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "700px",
            height: "700px",
            background:
              "radial-gradient(circle, rgba(200,150,62,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <h2
            style={{
              fontFamily: "'Eczar', Georgia, serif",
              fontSize: "clamp(2rem, 3.5vw, 2.8rem)",
              fontWeight: 800,
              color: "#F5EDE0",
              marginBottom: "8px",
            }}
          >
            Notas do Café
          </h2>
          <p
            style={{
              fontFamily: "'Eczar', Georgia, serif",
              fontSize: "1.05rem",
              color: "#C8963E",
              fontStyle: "italic",
              marginBottom: "24px",
            }}
          >
            Da fazenda à xícara, sem frescura.
          </p>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "0.92rem",
              color: "#C4A882",
              lineHeight: 1.75,
              marginBottom: "40px",
            }}
          >
            Este guia é o começo. Notas do Café entrega curadoria semanal com o
            mesmo filtro: grão avaliado com critério, origem mapeada, veredicto
            direto. Todo sábado de manhã, uma xícara com história.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              maxWidth: "420px",
              margin: "0 auto",
            }}
          >
            <input
              type="email"
              name="email"
              required
              placeholder="Seu melhor email"
              style={{
                padding: "16px 20px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(245,237,224,0.08)",
                borderRadius: "8px",
                color: "#fff",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "0.88rem",
                outline: "none",
                textAlign: "center",
              }}
            />
            <button
              type="submit"
              disabled={status === "sending" || status === "success"}
              style={{
                width: "100%",
                padding: "18px 28px",
                background: "#C8963E",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontFamily: "'Eczar', Georgia, serif",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "pointer",
                letterSpacing: "0.01em",
                opacity: status === "sending" || status === "success" ? 0.7 : 1,
              }}
            >
              Receber toda semana
            </button>
          </form>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          padding: "40px 24px",
          textAlign: "center",
          borderTop: "1px solid rgba(245,237,224,0.08)",
          background: "#1E100A",
        }}
      >
        <p
          style={{
            fontFamily: "'Eczar', Georgia, serif",
            fontSize: "0.85rem",
            color: "#C4A882",
            opacity: 0.45,
          }}
        >
          Notas do Café
        </p>
      </footer>
    </>
  );
}
