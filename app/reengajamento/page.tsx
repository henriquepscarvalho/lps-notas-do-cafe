"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import PageBeacon, { sendBeacon } from "../PageBeacon";

const DOMAIN = "notasdocafe.com.br";
const SENDER = `leia@${DOMAIN}`;
const LS_KEY = "nc_reeng_missoes";
const TOTAL = 5;

// Ouro do reengajamento (ticket 107): todo número do bloco vem desta rota (106), nunca daqui.
const OURO_API = `https://q.${DOMAIN}/api/xp/reengajar/notas-do-cafe`;

type OuroRende = { open: number; click: number; vote: number };
type OuroSt = {
  // novo = crédito caiu agora · ja = já tinha recebido · desc = descoberta (sem identidade ou rota fora)
  fase: "novo" | "ja" | "desc";
  vale: number;
  rende: OuroRende | null;
  idq: string;
};

const webmails = [
  {
    label: "Abrir no Gmail",
    href: `https://mail.google.com/mail/u/0/?utm_source=${DOMAIN}&utm_medium=referral#search/from%3A${encodeURIComponent(SENDER)}`,
  },
  {
    label: "Abrir no Hotmail",
    href: `https://outlook.live.com/mail/0/search?q=from%3A${encodeURIComponent(SENDER)}&utm_source=${DOMAIN}&utm_medium=referral`,
  },
  {
    label: "Abrir no Yahoo",
    href: `https://mail.yahoo.com/d/search/keyword=from%3A${encodeURIComponent(SENDER)}?utm_source=${DOMAIN}&utm_medium=referral`,
  },
];

// top 3 do arquivo por aberturas únicas (Beehiiv API, 16/07/2026)
const melhores = [
  {
    titulo: "O Catuaí Vermelho que três gerações colhem cereja a cereja",
    href: "https://notasdocafe.com.br/p/catuai-vermelho-alto-jequitiba-f2fa",
  },
  {
    titulo: "O Catucaí Amarelo que rende doce de leite em Poço Fundo",
    href: "https://notasdocafe.com.br/p/catucai-amarelo-poco-fundo",
  },
  {
    titulo: "O Catiguá MG2 que resiste ao Cerrado da Serra do Salitre",
    href: "https://notasdocafe.com.br/p/catigua-mg2-serra-do-salitre-b18b",
  },
];

const kicker: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "0.7rem",
  fontWeight: 600,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "var(--accent)",
  marginBottom: "1.25rem",
};

const h2: React.CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(1.5rem, 3.5vw, 2rem)",
  fontWeight: 700,
  color: "var(--text)",
  lineHeight: 1.3,
  marginBottom: "1.25rem",
};

const body: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "1rem",
  color: "var(--text-secondary)",
  lineHeight: 1.8,
  fontWeight: 400,
};

const ctaSolid: React.CSSProperties = {
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
  display: "inline-block",
  cursor: "pointer",
};

const ctaGhost: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "0.8rem",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  padding: "0.95rem 1.75rem",
  background: "transparent",
  color: "var(--accent)",
  border: "1px solid rgba(200,150,62,0.3)",
  borderRadius: "4px",
  textDecoration: "none",
  display: "inline-block",
  cursor: "pointer",
};

function loadDone(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export default function Reengajamento() {
  const [done, setDone] = useState<string[]>([]);
  const [copiado, setCopiado] = useState(false);
  const [ouro, setOuro] = useState<OuroSt | null>(null);
  const [conta, setConta] = useState(0);
  // tracker mini na nav: só aparece quando o tracker do hero sai da tela (nunca os dois juntos)
  const [heroTrackerVisivel, setHeroTrackerVisivel] = useState(true);

  // crédito na chegada (decisão do 107): POST idempotente da rota; a fase e os números saem
  // da resposta. Sem identidade (ou rota fora), o GET de erro ainda traz vale/rende e o bloco
  // vira descoberta, sem promessa de crédito.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const h = q.get("h");
    const e = q.get("e");
    const idq = e ? `?e=${encodeURIComponent(e)}` : h ? `?h=${h}` : "";
    (async () => {
      try {
        if (idq) {
          const r = await fetch(OURO_API + idq, { method: "POST" });
          const j = await r.json().catch(() => null);
          if (j?.ok && j.estado?.disponivel) {
            setOuro({ fase: j.repetido ? "ja" : "novo", vale: j.estado.vale, rende: j.estado.rende ?? null, idq });
            return;
          }
        }
        const r = await fetch(OURO_API + idq);
        const j = await r.json();
        const eco = j?.estado ?? j ?? {};
        setOuro({ fase: "desc", vale: eco.vale ?? 0, rende: eco.rende ?? null, idq });
      } catch {
        setOuro({ fase: "desc", vale: 0, rende: null, idq });
      }
    })();
  }, []);

  // contador da cerimônia; reduced-motion pula direto pro final
  useEffect(() => {
    if (!ouro) return;
    if (ouro.fase !== "novo" || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setConta(ouro.vale);
      return;
    }
    let n = 0;
    const t = setInterval(() => {
      n += 1;
      setConta(n);
      if (n >= ouro.vale) clearInterval(t);
    }, 85);
    return () => clearInterval(t);
  }, [ouro]);

  useEffect(() => {
    setDone(loadDone());
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("active");
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    const alvoTracker = document.querySelector(".bc-tracker");
    let obsTracker: IntersectionObserver | undefined;
    if (alvoTracker) {
      obsTracker = new IntersectionObserver(
        (entries) => setHeroTrackerVisivel(entries[0].isIntersecting),
        { threshold: 0 }
      );
      obsTracker.observe(alvoTracker);
    }
    return () => {
      observer.disconnect();
      obsTracker?.disconnect();
    };
  }, []);

  const complete = useCallback((id: string) => {
    setDone((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(next));
      } catch {
        /* modo privado: progresso vive só na sessão */
      }
      if (next.length === TOTAL) {
        sendBeacon("notas-do-cafe", "reengajamento-missoes-5de5", { eventType: "converteu" });
      }
      return next;
    });
  }, []);

  const feito = (id: string) => done.includes(id);
  const todas = done.length === TOTAL;

  const copiarContato = () => {
    const marcar = () => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    };
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(SENDER).then(marcar, marcar);
      } else {
        marcar();
      }
    } catch {
      marcar();
    }
    sendBeacon("notas-do-cafe", "reengajamento-contato", { eventType: "converteu" });
    complete("m3");
  };

  const Badge = ({ n, id }: { n: number; id: string }) => (
    <span className={`bc-missao${feito(id) ? " done" : ""}`}>
      {feito(id) ? `Missão ${n} concluída ✓` : `Missão ${n} de ${TOTAL}`}
    </span>
  );

  return (
    <>
      <PageBeacon slug="notas-do-cafe" step="reengajamento" source="reengajamento" />
      <style>{`
        body { background: var(--bg); color: var(--text); overflow-x: hidden; }
        .nav-nc {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
          background: rgba(44,24,16,0.88);
          border-bottom: 1px solid var(--border);
        }
        .nav-nc-inner {
          max-width: 80rem; margin: 0 auto; padding: 1rem 1.5rem;
          display: flex; align-items: center;
        }
        .nav-nc-brand {
          display: flex; align-items: center; gap: 0.75rem; text-decoration: none;
          font-family: var(--font-heading);
          font-size: 1.125rem; font-weight: 700; color: var(--accent);
        }
        @media (prefers-reduced-motion: reduce) { .reveal { opacity: 1; transform: none; transition: none; } }
        .bc-edicao {
          display: block; padding: 1.1rem 1.25rem;
          background: var(--bg);
          border: 1px solid rgba(200,150,62,0.2); border-radius: 4px;
          text-decoration: none; transition: border-color .2s;
        }
        .bc-edicao:hover { border-color: var(--accent); }
        .bc-missao {
          display: inline-block;
          font-family: var(--font-body);
          font-size: 0.68rem; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase;
          padding: 0.35rem 0.75rem; border-radius: 4px;
          border: 1px solid rgba(200,150,62,0.35); color: var(--accent);
          margin-bottom: 1.1rem;
        }
        .bc-missao.done { background: var(--accent); color: var(--bg); border-color: var(--accent); }
        .bc-tracker { display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 0.9rem; }
        .bc-slot {
          width: 38px; height: 38px; border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-heading); font-size: 0.95rem; font-weight: 700;
          border: 1px solid rgba(200,150,62,0.3); color: var(--text-muted);
        }
        .bc-slot.done { background: var(--accent); border-color: var(--accent); color: var(--bg); }
        .bc-nav-tracker { display: flex; gap: 4px; margin-left: auto; opacity: 1; transition: opacity 0.35s; }
        .bc-nav-tracker.oculto { opacity: 0; pointer-events: none; }
        @media (prefers-reduced-motion: reduce) { .bc-nav-tracker { transition: none; } }
        .bc-nav-slot {
          width: 22px; height: 22px;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-heading); font-size: 0.7rem;
          border: 1px solid rgba(200,150,62,0.3); color: #D4C4AE;
        }
        .bc-nav-slot.done { background: #C8963E; border-color: #C8963E; color: #2C1810; }
        .ouro-kicker { font-family: var(--font-heading); font-size: 0.8rem; font-weight: 600; letter-spacing: 0.28em; text-transform: uppercase; color: #D4A93C; margin-bottom: 1.1rem; }
        .ouro-fileira { display: flex; gap: 9px; flex-wrap: wrap; justify-content: center; margin: 0 0 1.2rem; min-height: 26px; }
        .ouro-gem { display: inline-block; width: 24px; height: 24px; flex: none; border-radius: 50% 7px 50% 7px; background-color: #D4A93C; border: 1.5px solid #4f3f16; background-image: linear-gradient(135deg,#f1dfa4 0%,#f1dfa4 38%,#D4A93C 38%,#D4A93C 72%,#4f3f16 72%,#4f3f16 100%); }
        .ouro-gem.mini { width: 12px; height: 12px; border-radius: 50% 3px 50% 3px; border-width: 1px; vertical-align: -2px; }
        .ouro-gem.drop { animation: ouro-drop 0.5s cubic-bezier(0.2,1.4,0.4,1) backwards; }
        @keyframes ouro-drop { from { transform: translateY(-16px) scale(0.55); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .ouro-gem.drop { animation: none; } }
        .ouro-hero { font-family: var(--font-heading); font-size: clamp(1.9rem, 8vw, 2.6rem); letter-spacing: 0.06em; text-transform: uppercase; color: #D4A93C; line-height: 1; display: block; margin-bottom: 0.5rem; }
        .ouro-conceitos { list-style: none; max-width: 340px; margin: 1.5rem auto 1.8rem; padding: 0; text-align: left; display: grid; gap: 0.7rem; }
        .ouro-conceitos li { display: flex; gap: 0.7rem; align-items: baseline; font-size: 0.92rem; color: #D4C4AE; line-height: 1.6; }
        .ouro-conceitos li strong { color: #F5EDE0; font-weight: 500; }
        .ouro-glifo { flex: none; min-width: 22px; text-align: center; }
        .ouro-glifo.romano { font-family: var(--font-heading); color: #D4A93C; font-size: 0.82rem; border: 1px solid rgba(212,169,60,0.45); padding: 2px 4px; border-radius: 2px; letter-spacing: 0.05em; white-space: nowrap; }
      `}</style>

      <nav className="nav-nc">
        <div className="nav-nc-inner">
          <a href="/" className="nav-nc-brand">
            <Image src="/images/logo/simbolo.png" alt="Notas do Café" width={25} height={28} />
            <span>Notas do Café</span>
          </a>
          <div
            className={`bc-nav-tracker${heroTrackerVisivel ? " oculto" : ""}`}
            aria-hidden={heroTrackerVisivel}
          >
            {["m1", "m2", "m3", "m4", "m5"].map((id, i) => (
              <div key={id} className={`bc-nav-slot${feito(id) ? " done" : ""}`}>
                {feito(id) ? "✓" : i + 1}
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero */}
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
          overflow: "hidden",
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

        <p className="reveal" style={{ ...kicker, position: "relative" }}>
          Sinal de vida recebido
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
          Você clicou.<br />
          <em style={{ fontStyle: "italic", color: "var(--accent)" }}>O café voltou a passar.</em>
        </h1>
        <p
          className="reveal"
          style={{ ...body, fontSize: "1.125rem", maxWidth: "540px", margin: "0 auto 2rem", position: "relative" }}
        >
          Bom te ver por aqui. Pra voltar de vez, preparamos cinco missões rápidas:
          um presente, dois ajustes na caixa de entrada e duas leituras. Complete as
          cinco e nenhuma edição se perde mais. A de hoje sai às 08:08.
        </p>

        <div className="reveal" style={{ position: "relative", marginBottom: "2rem" }}>
          <div className="bc-tracker">
            {["m1", "m2", "m3", "m4", "m5"].map((id, i) => (
              <div key={id} className={`bc-slot${feito(id) ? " done" : ""}`}>
                {feito(id) ? "✓" : i + 1}
              </div>
            ))}
          </div>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: todas ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            {todas ? "Xícara cheia de novo" : `${done.length} de ${TOTAL} concluídas`}
          </p>
        </div>

        <div
          className="reveal"
          style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", position: "relative" }}
        >
          <a href="#presente" style={ctaSolid}>
            Começar a missão 1
          </a>
        </div>
      </section>

      {/* Missão 1 · Presente */}
      <section
        id="presente"
        style={{ padding: "5rem 1.5rem", background: "var(--surface)", borderTop: "1px solid var(--border)" }}
      >
        <div
          className="reveal"
          style={{
            maxWidth: "760px",
            margin: "0 auto",
            display: "flex",
            gap: "2.5rem",
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <div style={{ flex: "0 0 200px", maxWidth: "200px" }}>
            <Image
              src="/images/mockup-ebook.png"
              alt="Guia A Xícara Certa"
              width={200}
              height={200}
              style={{ width: "100%", height: "auto" }}
            />
          </div>
          <div style={{ flex: "1 1 320px", maxWidth: "440px", textAlign: "left" }}>
            <Badge n={1} id="m1" />
            <p style={{ ...kicker, marginBottom: "0.9rem" }}>Um presente pela volta</p>
            <h2 style={h2}>Baixe A Xícara Certa, grátis</h2>
            <p style={{ ...body, marginBottom: "2rem" }}>
              Sete métodos de preparo avaliados na régua honesta de sempre: o que cada um
              entrega na xícara, o que exige da sua manhã e qual vale o dinheiro do
              equipamento. Sem frescura: abre na hora.
            </p>
            <a
              href="/downloads/ebook-a-xicara.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={ctaSolid}
              onClick={() => {
                sendBeacon("notas-do-cafe", "reengajamento-presente", { eventType: "converteu" });
                complete("m1");
              }}
            >
              Baixar o guia
            </a>
          </div>
        </div>
      </section>

      {/* Missões 2 e 3 · Entrega */}
      <section
        id="proxima"
        style={{ padding: "5rem 1.5rem", background: "var(--bg)", borderTop: "1px solid var(--border)" }}
      >
        <div className="reveal" style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ ...kicker, letterSpacing: "0.25em" }}>Pra próxima chegar na sua frente</p>
          <h2 style={h2}>A edição some na aba Promoções</h2>
          <p style={{ ...body, marginBottom: "2.5rem" }}>
            O motivo mais comum de perder a edição nem é falta de vontade: o Gmail esconde
            a news. As duas missões seguintes resolvem de vez.
          </p>

          <div style={{ display: "grid", gap: "1.25rem", textAlign: "left", marginBottom: "0.5rem" }}>
            <div
              style={{
                padding: "1.5rem",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "4px",
              }}
            >
              <Badge n={2} id="m2" />
              <p style={{ ...body, color: "var(--text)", marginBottom: "1.25rem" }}>
                Abra seu email e arraste a edição do Notas do Café pra aba <strong>Principal</strong>
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                {webmails.map((wm) => (
                  <a
                    key={wm.label}
                    href={wm.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...ctaGhost, fontSize: "0.72rem", padding: "0.7rem 1.1rem" }}
                    onClick={() => {
                      sendBeacon("notas-do-cafe", "reengajamento-inbox", { eventType: "converteu" });
                      complete("m2");
                    }}
                  >
                    {wm.label}
                  </a>
                ))}
              </div>
            </div>

            <div
              style={{
                padding: "1.5rem",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "4px",
              }}
            >
              <Badge n={3} id="m3" />
              <p style={{ ...body, color: "var(--text)", marginBottom: "1.25rem" }}>
                Salve <strong>{SENDER}</strong> nos seus contatos
              </p>
              <button
                type="button"
                style={{ ...ctaGhost, fontSize: "0.72rem", padding: "0.7rem 1.1rem" }}
                onClick={copiarContato}
              >
                {copiado ? "Copiado ✓" : "Copiar o email"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Missões 4 e 5 · Hábito */}
      <section style={{ padding: "5rem 1.5rem", background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        <div className="reveal" style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ ...kicker, letterSpacing: "0.25em" }}>Todo dia, às 08:08</p>
          <h2 style={h2}>Comece pelo melhor do arquivo</h2>
          <div style={{ textAlign: "left", marginBottom: "1rem" }}>
            <Badge n={4} id="m4" />
          </div>
          <p style={{ ...body, marginBottom: "1.75rem", textAlign: "left" }}>
            Releia um clássico: as três edições que os leitores mais abriram.
          </p>
          <div style={{ display: "grid", gap: "0.75rem", textAlign: "left", marginBottom: "3rem" }}>
            {melhores.map((ed) => (
              <a
                key={ed.href}
                href={ed.href}
                target="_blank"
                rel="noopener noreferrer"
                className="bc-edicao"
                onClick={() => {
                  sendBeacon("notas-do-cafe", "reengajamento-arquivo", { eventType: "converteu" });
                  complete("m4");
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  {ed.titulo}
                </span>
                <span style={{ ...body, fontSize: "0.85rem", display: "block", marginTop: "0.2rem" }}>
                  Ler no navegador ↗
                </span>
              </a>
            ))}
          </div>

          <div style={{ textAlign: "left", marginBottom: "1rem" }}>
            <Badge n={5} id="m5" />
          </div>
          <p style={{ ...body, marginBottom: "1.75rem", textAlign: "left" }}>
            E feche o ciclo com a xícara mais fresca da casa:
          </p>
          <div style={{ textAlign: "left" }}>
            <a
              href={`https://leia.${DOMAIN}/`}
              target="_blank"
              rel="noopener noreferrer"
              style={ctaSolid}
              onClick={() => {
                sendBeacon("notas-do-cafe", "reengajamento-hoje", { eventType: "converteu" });
                complete("m5");
              }}
            >
              Ler a edição de hoje
            </a>
          </div>
        </div>
      </section>

      {/* Bloco de Ouro (golden 107, forma D: cerimônia das pepitas) */}
      {ouro && (
        <section
          id="ouro"
          style={{
            padding: "5rem 1.5rem",
            background: "#2C1810",
            borderTop: "1px solid rgba(200,150,62,0.08)",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: "480px", margin: "0 auto" }}>
            <p className="ouro-kicker">
              {ouro.fase === "novo"
                ? "O café reconhece quem volta"
                : ouro.fase === "ja"
                  ? "Ouro guardado"
                  : "Leitura vira ouro"}
            </p>
            <div className="ouro-fileira">
              {Array.from({ length: ouro.fase === "desc" ? 3 : ouro.vale }, (_, i) => (
                <span
                  key={i}
                  className={`ouro-gem${ouro.fase === "novo" ? " drop" : ""}`}
                  style={ouro.fase === "novo" ? { animationDelay: `${i * 70}ms` } : undefined}
                />
              ))}
            </div>
            <span className="ouro-hero">
              {ouro.fase === "desc" ? "Cada leitura vira ouro" : `+${conta} de ouro`}
            </span>
            <p style={{ ...body, fontSize: "0.95rem", marginBottom: "0.4rem" }}>
              {ouro.fase === "novo"
                ? "Pela sua volta. Guardado na sua carteira."
                : ouro.fase === "ja"
                  ? "Sua volta já foi paga. O ouro está na carteira."
                  : ouro.rende
                    ? `Abrir a edição rende +${ouro.rende.open}. Clicar, +${ouro.rende.click}.`
                    : "Abrir a edição de hoje já começa a render."}
            </p>
            <ul className="ouro-conceitos">
              {ouro.fase !== "desc" && ouro.rende && (
                <li>
                  <span className="ouro-glifo"><span className="ouro-gem mini" /></span>
                  <span>
                    <strong>Toda edição aberta rende +{ouro.rende.open} de ouro.</strong> Cada
                    clique no que te interessa: +{ouro.rende.click}.
                  </span>
                </li>
              )}
              <li>
                <span className="ouro-glifo romano">Ⅰ→Ⅱ</span>
                <span>
                  Leitura constante sobe sua <strong>patente de Barista</strong>.
                </span>
              </li>
              <li>
                <span className="ouro-glifo">🔥</span>
                <span>
                  Dias seguidos lendo mantêm sua <strong>ofensiva</strong> viva.
                </span>
              </li>
            </ul>
            <a
              href={`https://q.${DOMAIN}/xp${ouro.idq}`}
              target="_blank"
              rel="noopener noreferrer"
              style={ctaSolid}
              onClick={() => sendBeacon("notas-do-cafe", "reengajamento-ouro", { eventType: "converteu" })}
            >
              {ouro.idq ? "Abrir minha carteira" : "Conhecer minha carteira"}
            </a>
          </div>
        </section>
      )}

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
          Da fazenda à xícara, sem frescura. Bom café.
        </p>
      </footer>
    </>
  );
}
