"use client";

/* ============================================================
 * PÁGINAS /voto-melhoria e /voto-feedback, MODELO CANÔNICO ÚNICO (rede Scriptorium)
 * AUTO-GERADO por _shared/voto-melhoria/build.py
 * NÃO EDITAR À MÃO. Fonte = page.template.tsx + copy.json (copy por casa)
 * + o config.json do voto-positivo (identidade: marca, logo, tema).
 * Para re-skinar TODAS as news: editar este template ou o copy.json e rodar
 * `python3 _shared/voto-melhoria/build.py`.
 *
 * Fluxo: a nota já foi gravada pelo VoteBeacon no load; a caixa de comentário
 * é a primeira ação. Depois do envio, «Recebido» na própria caixa, só quando
 * submitVoteComment devolve true (gam/219); no false, a caixa fica com o texto,
 * o aviso de que não chegou e o botão «Tentar de novo».
 *
 * Próximo ato (gam/194): abaixo da caixa, nos dois estados, o AtoSeguinte leva
 * o leitor pra votar a próxima pauta (4 opções do discover.json da casa) ou,
 * sem oferta aberta, pro hub do leitor. Antes do envio o bloco fica quieto;
 * depois do envio ele é a saída da página. Beacon por destino em lp_page_views:
 * voto-ato-pauta e voto-ato-hub.
 *
 * Caixa (fnx/330): casa com app/CaixaMelhoria.tsx recebe a caixa de duas caras
 * (nota 4 elogio, nota 3 «o que você cortaria»); as outras, a textarea simples.
 * build.py escolhe pelo arquivo; a caixa em si não muda aqui.
 * ============================================================ */

import { useEffect, useState } from "react";
import PageBeacon from "../PageBeacon";
import VoteBeacon, { submitVoteComment } from "../VoteBeacon";
import AtoSeguinte from "../AtoSeguinte";

const CFG = {
  "slug": "notas-do-cafe",
  "brand": "Notas do Café",
  "logo": "/images/logo/simbolo.png",
  "logoW": 56,
  "logoH": 56,
  "step": "voto-feedback",
  "theme": {
    "bg": "#2C1810",
    "text": "#D4C4AE",
    "accent": "#C8963E",
    "heading": "#F5EDE0",
    "btnBg": "#C8963E",
    "btnText": "#2C1810",
    "glow": "rgba(200,150,62,0.14)",
    "font": "var(--font-heading)"
  },
  "copy": {
    "kicker": "Voto registrado",
    "headline": "O que deu",
    "highlight": "errado?",
    "sub": "Fala sem rodeio. Lemos cada resposta, e a crítica que se repete muda a xícara.",
    "placeholder": "O que te incomodou na edição de hoje?",
    "recebidoTitulo": "Recebido",
    "recebidoTexto": "Obrigado pela franqueza. É assim que a gente acerta o ponto do café."
  },
  "ato": {
    "pauta": {
      "json": "https://ecmveymyzdqiehvtqxms.supabase.co/storage/v1/object/public/assets/news/notas-do-cafe/discover.json",
      "rota": "/voto-pauta"
    },
    "hub": {
      "href": "https://q.notasdocafe.com.br/xp"
    }
  }
};


export default function VotoPagina() {
  const t = CFG.theme;
  const [sent, setSent] = useState(false);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [falhou, setFalhou] = useState(false);
  // caf/41: a pergunta-aberta que fecha a edição chega no link do voto (&q=, insert_voto)
  // e vira o título da caixa; sem q, a caixa fica como sempre.
  const [pergunta, setPergunta] = useState("");
  useEffect(() => {
    try {
      const v = new URLSearchParams(window.location.search).get("q") || "";
      setPergunta(v.trim().slice(0, 200));
    } catch {
      /* sem URL legível: caixa como sempre */
    }
  }, []);
  const vis = {} as const;

  async function handleSubmit() {
    if (sending || !comment.trim()) return;
    setSending(true);
    // gam/219: «Recebido» só com a resposta gravada; no false o leitor vê o erro e tenta de novo
    if (!(await submitVoteComment(CFG.slug, comment))) {
      setFalhou(true);
      setSending(false);
      return;
    }
    setFalhou(false);
    setSent(true);
    setSending(false);
  }

  return (
    <>
      <PageBeacon slug={CFG.slug} step={CFG.step} />
      <VoteBeacon slug={CFG.slug} />

      <style>{`
        @keyframes vpUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .vp-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; font-weight:700; font-size:16px; padding:15px 28px; border-radius:10px; text-decoration:none; line-height:1; border:none; cursor:pointer; transition:transform .16s ease, opacity .16s ease }
        .vp-btn:hover { transform:translateY(-1px); opacity:.92 }
        .vp-btn:disabled { cursor:default; opacity:.45; transform:none }
        .vp-ta { width:100%; box-sizing:border-box; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:.9rem 1rem; font-family:var(--font-body, system-ui, sans-serif); font-size:.95rem; line-height:1.6; resize:vertical; outline:none; transition:border-color .18s ease }
        .vp-ta:focus { border-color:var(--vp-accent) }
        .vp-ta::placeholder { color:var(--vp-text); opacity:.5 }
        .vp-box { width:100%; max-width:480px; box-sizing:border-box; padding:1.5rem; border-radius:14px; border:1px solid; background:rgba(255,255,255,0.03); position:relative }
        @media (max-width:480px){ .vp-btn{ width:100%; max-width:340px } }
      `}</style>

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
          ["--vp-accent" as string]: t.accent,
          ["--vp-text" as string]: t.text,
        }}
      >
        {/* glow de acento atrás do conteúdo */}
        <div style={{ position: "absolute", top: "28%", left: "50%", transform: "translateX(-50%)", width: 480, height: 480, maxWidth: "92vw", background: `radial-gradient(circle, ${t.glow}, transparent 65%)`, pointerEvents: "none" }} />

        <a href="/" style={{ marginBottom: "1.75rem", animation: "vpUp .9s ease-out .3s both", position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={CFG.logo} alt={CFG.brand} width={CFG.logoW} height={CFG.logoH} style={{ height: "auto", maxWidth: "70vw" }} />
        </a>

        <p style={{ fontFamily: t.font, letterSpacing: ".22em", textTransform: "uppercase", fontSize: 12, fontWeight: 600, color: "var(--vp-accent)", marginBottom: "1rem", animation: "vpUp .9s ease-out .5s both", position: "relative" }}>{CFG.copy.kicker}</p>

        <h1 style={{ fontFamily: t.font, fontWeight: 800, fontSize: "clamp(2rem, 5vw, 3.25rem)", lineHeight: 1.1, letterSpacing: "-.015em", color: t.heading, marginBottom: "1.25rem", maxWidth: 640, animation: "vpUp .9s ease-out .7s both", position: "relative", ...vis }}>
          {CFG.copy.headline} <span style={{ color: "var(--vp-accent)" }}>{CFG.copy.highlight}</span>
        </h1>

        <p style={{ fontSize: "1.125rem", color: t.text, maxWidth: 480, lineHeight: 1.7, marginBottom: "1.75rem", animation: "vpUp .9s ease-out .9s both", position: "relative", ...vis }}>
          {CFG.copy.sub}
        </p>

        <div className="vp-box" style={{ borderColor: `${t.accent}40`, color: t.heading, animation: "vpUp .9s ease-out 1.1s both", ...vis }}>
          {sent ? (
            <>
              <h3 style={{ fontFamily: t.font, fontSize: "1.25rem", fontWeight: 700, color: t.heading, marginBottom: ".75rem" }}>{CFG.copy.recebidoTitulo}</h3>
              <p style={{ fontSize: ".9375rem", color: t.text, lineHeight: 1.7 }}>{CFG.copy.recebidoTexto}</p>
            </>
          ) : (
            <>
              {pergunta ? (
                <p data-pergunta style={{ fontFamily: t.font, fontSize: "1.125rem", fontStyle: "italic", color: t.heading, margin: "0 0 .75rem", lineHeight: 1.4, textAlign: "left" }}>
                  {pergunta}
                </p>
              ) : null}
              <textarea
                className="vp-ta"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={pergunta ? "Sua resposta" : CFG.copy.placeholder}
                rows={4}
                maxLength={2000}
                style={{ color: t.heading, marginBottom: "1rem" }}
              />
              <button className="vp-btn" onClick={handleSubmit} disabled={sending || !comment.trim()} style={{ background: t.btnBg, color: t.btnText }}>
                {sending ? "Enviando..." : falhou ? "Tentar de novo" : "Enviar resposta"}
              </button>
              {falhou ? (
                <p role="alert" data-voto-erro style={{ fontSize: ".9rem", color: t.text, lineHeight: 1.5, marginTop: ".85rem" }}>
                  Sua resposta não chegou. Tente de novo; se falhar outra vez, responda o email da edição.
                </p>
              ) : null}
            </>
          )}
        </div>

        {/* Próximo ato: quieto antes do envio, saída da página depois dele (gam/194). */}
        <AtoSeguinte slug={CFG.slug} pauta={CFG.ato.pauta} hub={CFG.ato.hub} t={t} delay={sent ? ".2s" : "1.3s"} destaque={sent} />
      </main>
    </>
  );
}
