"use client";

/* ============================================================
 * PÁGINA /voto-pauta, MODELO CANÔNICO ÚNICO (rede Scriptorium)
 * AUTO-GERADO por _shared/voto-pauta/build.py
 * NÃO EDITAR À MÃO. Fonte = page.template.tsx + o config.json do
 * voto-positivo (SOT único de identidade das páginas de voto).
 * Para re-skinar TODAS as news: editar este template e rodar
 * `python3 _shared/voto-pauta/build.py`.
 *
 * Fluxo (bloco Discover do email, gamificacao-do-leitor/15):
 * o leitor clica numa das 4 pautas (p=a..d) e cai aqui. A gravação
 * é no load (best-effort, tabela public.pauta_votes, insert-only);
 * a página confirma a letra escolhida e promete o resultado na
 * edição de amanhã. Sem comentário obrigatório: o voto é o
 * engajamento, fricção extra derrubaria a taxa.
 * ============================================================ */

import { useEffect, useMemo, useState } from "react";
import PageBeacon from "../PageBeacon";

const CFG = {
  "slug": "notas-do-cafe",
  "brand": "Notas do Café",
  "logo": "/images/logo/simbolo.png",
  "logoW": 56,
  "logoH": 56,
  "emojis": [
    "☕",
    "🫘",
    "♨️",
    "📦",
    "✨"
  ],
  "escada": [
    {
      "n": 3,
      "em": "🥇",
      "premio": "Edição de Colecionador do mês",
      "promessa": ""
    },
    {
      "n": 5,
      "em": "📕",
      "premio": "Ebook Café de Balcão no Coador de Casa",
      "promessa": "A técnica completa sem máquina de R$ 2 mil"
    },
    {
      "n": 10,
      "em": "💎",
      "premio": "Colecionador vitalício + ebook Brasa Pronta em 20 Minutos, da Brasa Certa",
      "promessa": ""
    }
  ],
  "theme": {
    "bg": "#2C1810",
    "text": "#D4C4AE",
    "accent": "#C8963E",
    "heading": "#F5EDE0",
    "glow": "rgba(200,150,62,0.14)",
    "font": "var(--font-heading)",
    "btnBg": "#C8963E",
    "btnText": "#2C1810"
  }
} as {
  slug: string; brand: string; logo: string; logoW: number; logoH: number;
  emojis: string[]; escada: Degrau[]; theme: Record<string, string>;
};

interface Degrau { n: number; em: string; premio: string; promessa: string; }

interface Piece { id: number; left: number; delay: number; duration: number; size: number; emoji: string; }

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function maskEmail(email: string): string | null {
  const at = email.indexOf("@");
  if (at < 1) return null;
  return email[0] + "****@" + email.slice(at + 1);
}

function parsePautaParams() {
  const p = new URLSearchParams(window.location.search);
  const opt = (p.get("p") || "").trim().toLowerCase();
  const ed = parseInt(p.get("ed") || "", 10);
  if (!["a", "b", "c", "d"].includes(opt)) return null;
  if (!Number.isInteger(ed) || ed < 1) return null;
  return { opt, ed, email: (p.get("s") || "").trim().toLowerCase() };
}

export default function VotoPauta() {
  const [confetti, setConfetti] = useState<Piece[]>([]);
  const [opt, setOpt] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const v = parsePautaParams();
    setOpt(v ? v.opt : null);
    // `s` sai do href mesmo quando p/ed vem torto: o CTA de indicação não depende do voto
    const s = (new URLSearchParams(window.location.search).get("s") || "").trim().toLowerCase();
    if (s.includes("@")) setEmail(s);
    if (v) {
      setConfetti(
        Array.from({ length: 18 }, (_, i) => ({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 3,
          duration: 3 + Math.random() * 3,
          size: 16 + Math.random() * 12,
          emoji: CFG.emojis[Math.floor(Math.random() * CFG.emojis.length)],
        }))
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key || !v) return;

    const k = `pauta_${CFG.slug}_${v.ed}`;
    try {
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, v.opt);
    } catch {
      /* modo privado etc. — segue e grava */
    }

    (async () => {
      let subHash: string | null = null;
      let emailMask: string | null = null;
      if (v.email.includes("@")) {
        emailMask = maskEmail(v.email);
        try {
          subHash = await sha256Hex(v.email);
        } catch {
          /* SubtleCrypto indisponível (http) — voto segue anônimo */
        }
      }
      fetch(`${url}/rest/v1/pauta_votes`, {
        method: "POST",
        keepalive: true,
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          slug: CFG.slug,
          edition: v.ed,
          opt: v.opt,
          sub_hash: subHash,
          email_mask: emailMask,
          path: window.location.pathname,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
        }),
      }).catch(() => {
        /* best-effort, nunca quebra a página */
      });
    })();
  }, []);

  const t = CFG.theme;
  const letra = useMemo(() => (opt ? opt.toUpperCase() : null), [opt]);
  const indiqueHref = useMemo(
    () =>
      "/indique?" +
      (email ? `e=${encodeURIComponent(email)}&` : "") +
      "utm_source=voto-pauta&utm_medium=lp&utm_campaign=indique",
    [email]
  );

  return (
    <>
      <PageBeacon slug={CFG.slug} step="voto-pauta" />

      <style>{`
        @keyframes vpFall { 0% { opacity:.6; transform:translateY(0) rotate(0) } 100% { opacity:0; transform:translateY(100vh) rotate(720deg) } }
        @keyframes vpUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .vp-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; font-weight:700; font-size:16px; padding:15px 28px; border-radius:10px; text-decoration:none; line-height:1; border:none; cursor:pointer; transition:transform .16s ease, opacity .16s ease }
        .vp-btn:hover { transform:translateY(-1px); opacity:.92 }
        @media (max-width:480px){ .vp-btn{ width:100%; max-width:340px } }
      `}</style>

      {/* Confetti, emojis da marca, dispara no load: o voto já está feito */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50, overflow: "hidden" }}>
        {confetti.map((p) => (
          <span key={p.id} style={{ position: "absolute", top: -30, left: `${p.left}%`, fontSize: p.size, animation: `vpFall ${p.duration}s ease-in ${p.delay}s forwards`, opacity: 0 }}>{p.emoji}</span>
        ))}
      </div>

      <main
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2.5rem 1.5rem",
          textAlign: "center",
          position: "relative",
          background: t.bg,
        }}
      >
        {/* glow de acento atrás do conteúdo */}
        <div style={{ position: "absolute", top: "28%", left: "50%", transform: "translateX(-50%)", width: 480, height: 480, maxWidth: "92vw", background: `radial-gradient(circle, ${t.glow}, transparent 65%)`, pointerEvents: "none" }} />

        <a href="/" style={{ marginBottom: "1.75rem", animation: "vpUp .9s ease-out .3s both", position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={CFG.logo} alt={CFG.brand} width={CFG.logoW} height={CFG.logoH} style={{ height: "auto", maxWidth: "70vw" }} />
        </a>

        <p style={{ fontFamily: t.font, letterSpacing: ".22em", textTransform: "uppercase", fontSize: 12, fontWeight: 600, color: t.accent, marginBottom: "1rem", animation: "vpUp .9s ease-out .5s both", position: "relative" }}>
          Escolha registrada
        </p>

        <h1 style={{ fontFamily: t.font, fontWeight: 800, fontSize: "clamp(2rem, 5vw, 3.25rem)", lineHeight: 1.1, letterSpacing: "-.015em", color: t.heading, marginBottom: "1.25rem", maxWidth: 640, animation: "vpUp .9s ease-out .7s both", position: "relative" }}>
          {letra ? (
            <>Seu voto: pauta <span style={{ color: t.accent }}>{letra}</span>.</>
          ) : (
            <>Voto <span style={{ color: t.accent }}>registrado.</span></>
          )}
        </h1>

        <p style={{ fontSize: "1.125rem", color: t.text, maxWidth: 480, lineHeight: 1.7, marginBottom: "2rem", animation: "vpUp .9s ease-out .9s both", position: "relative" }}>
          A pauta com mais votos vira a edição de amanhã, e a edição abre nomeando o resultado.
        </p>

        {/* Escada de indicação: o prêmio de cada degrau NOMEADO (vem do premios.json,
            mesma SOT que a /indique resolve), pra o clique saber o que está comprando. */}
        <div style={{ width: "100%", maxWidth: 480, textAlign: "left", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 14, padding: "1.25rem 1.25rem 1.1rem", marginBottom: "1.75rem", animation: "vpUp .9s ease-out 1.1s both", position: "relative" }}>
          <p style={{ fontFamily: t.font, letterSpacing: ".18em", textTransform: "uppercase", fontSize: 11, fontWeight: 600, color: t.accent, marginBottom: ".9rem" }}>
            O que você destrava indicando
          </p>

          {CFG.escada.map((d) => (
            <div key={d.n} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: ".55rem 0", borderTop: d.n === 3 ? "none" : "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 18, lineHeight: 1.35 }}>{d.em}</span>
              <span style={{ fontFamily: t.font, fontWeight: 800, fontSize: 15, color: t.accent, lineHeight: 1.35, minWidth: 22 }}>{d.n}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontSize: ".95rem", color: t.heading, lineHeight: 1.4 }}>{d.premio}</span>
                {d.promessa ? (
                  <span style={{ display: "block", fontSize: ".82rem", color: t.text, opacity: .75, lineHeight: 1.45, marginTop: 2 }}>{d.promessa}</span>
                ) : null}
              </span>
            </div>
          ))}
        </div>

        <a
          href={indiqueHref}
          className="vp-btn"
          style={{ background: t.btnBg, color: t.btnText, animation: "vpUp .9s ease-out 1.25s both", position: "relative" }}
        >
          Pegar meu link de indicação
        </a>

        <p style={{ fontSize: ".9rem", color: t.text, opacity: .8, maxWidth: 420, lineHeight: 1.6, marginTop: ".9rem", animation: "vpUp .9s ease-out 1.35s both", position: "relative" }}>
          Do outro lado: seu link pessoal pronto pra enviar, o placar das indicações confirmadas e os prêmios abertos por degrau.
        </p>

        <p style={{ fontFamily: t.font, fontStyle: "italic", fontSize: "1rem", color: t.text, opacity: .7, marginTop: "2.5rem", animation: "vpUp .9s ease-out 1.4s both", position: "relative" }}>
          Amanhã, na sua caixa de entrada, você descobre quem venceu.
        </p>
      </main>
    </>
  );
}
