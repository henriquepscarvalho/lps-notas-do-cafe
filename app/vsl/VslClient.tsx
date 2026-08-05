"use client";

import { useEffect, useRef, useState } from "react";
import PageBeacon, { sendBeacon } from "../PageBeacon";
import VslPlayer from "./VslPlayer";

/* ============================================================
   TOKENS DA NEWS (única parte que a fábrica troca por news)
   LP de vendas da VSL (réplica leva 2 do golden FI, ticket 15):
   oferta revelada por tempo REAL de play (currentTime), nunca
   por relógio de parede; safety timer só como fallback.
   ============================================================ */
const CFG = {
  slug: "notas-do-cafe",
  videoSrc: "https://gkkfxo4yn3utlvh2.public.blob.vercel-storage.com/vsl/vsl-nc-web-9HFkVTSEq2442CI86bh8xtUliZr9pP.mp4",
  poster: "https://gkkfxo4yn3utlvh2.public.blob.vercel-storage.com/vsl/vsl-nc-poster-5Dbtg8HBJBJYLcMdvB89yEA5Nnyfcp.jpg",
  // Segundo de play em que a voz fecha o nome do produto (158,3s no whisper
  // do corte final). ?offer=5 na URL testa sem esperar.
  offerDelaySeconds: 158,
  // Sem resultado de quiz o vídeo começa aqui: a abertura assume \"analisei as
  // suas respostas\" e o braço quente nunca respondeu. Valor = fim da última
  // frase que cita as respostas no whisper (vo.json). ?skip=0 revisa a abertura.
  skipSemQuizSeconds: 1.8,
  checkout: "/ebook-premium/checkout",
  produto: "Café de Balcão no Coador de Casa",
  preco: "R$ 27",
  precoDe: "R$ 47",
  capa: "/ebook-web/capa-notas-do-cafe.webp",
  bullets: [
    "As 8 variáveis da coada, uma por uma, com o defeito nomeado em cada xícara",
    "O checklist de uma página pra riscar enquanto a água esquenta",
    "A ficha da coada, que soma sozinha o que o balcão custava no seu ano",
    "Guia web + PDF, com as quatro falas prontas pra copa",
  ],
  garantiaNome: "Melhorou a coada ou devolve · 7 dias",
  garantia:
    "Leu o guia e não encontrou nenhuma variável pra corrigir na sua coada? Responda o email da compra em até 7 dias e devolvemos os R$ 27.",
  fontes:
    "ABIC e Instituto Axxus (2025) · Cotter, Batali, Ristenpart & Guinard (2021) · Batali, Ristenpart & Guinard (2020) · Uman e colegas (2016)",
  disclaimer:
    "O guia não vende equipamento e não promete paladar treinado. Ele cuida de uma janela específica: os três minutos entre o pacote e a xícara.",
};

const CTA_LABEL = "Quero o guia";

type QuizResult = {
  name?: string;
  profile?: number;
  profileName?: string;
  profileUrgency?: string;
  familyName?: string;
  familyWhat?: string;
};

export default function VslClient() {
  const [res, setRes] = useState<QuizResult | null>(null);
  const [startAt, setStartAt] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stickyOn, setStickyOn] = useState(false);
  const revealedRef = useRef(false);
  const delay = useRef(CFG.offerDelaySeconds);
  const offerRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  function reveal() {
    if (revealedRef.current) return;
    revealedRef.current = true;
    setRevealed(true);
    try {
      sessionStorage.setItem("nc_vsl_revealed", "1");
    } catch {
      /* modo privado */
    }
    sendBeacon(CFG.slug, "vsl-oferta", { eventType: "apareceu" });
  }

  function onPlay() {
    sendBeacon(CFG.slug, "vsl-play", { eventType: "converteu" });
  }

  useEffect(() => {
    // resultado do quiz (mesma origem; ausente = headline neutro)
    try {
      const raw = sessionStorage.getItem("nc_xicara_result");
      if (raw) setRes(JSON.parse(raw));
    } catch {
      /* sem resultado */
    }
    // sem quiz o vídeo pula a abertura que assume as respostas; ?skip=N revisa
    const skipParam = new URLSearchParams(location.search).get(\"skip\");
    let temQuiz = false;
    try {
      temQuiz = !!sessionStorage.getItem(\"nc_xicara_result\");
    } catch {
      /* sem storage */
    }
    if (skipParam !== null) setStartAt(Math.max(0, Number(skipParam) || 0));
    else if (!temQuiz) setStartAt(CFG.skipSemQuizSeconds);
    // ?offer=5 encurta o gate pra teste
    const p = Number(new URLSearchParams(location.search).get("offer"));
    if (p > 0) delay.current = p;
    // já revelou nesta sessão (refresh não re-esconde a oferta)
    try {
      if (sessionStorage.getItem("nc_vsl_revealed") === "1") reveal();
    } catch {
      /* segue escondida até o play */
    }
    // fallback: vídeo travou/falhou = a oferta nunca ficaria acessível
    const safety = setTimeout(reveal, (delay.current + 150) * 1000);
    return () => clearTimeout(safety);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // barra fixa some quando o card da oferta está na tela
  useEffect(() => {
    if (!revealed || !ctaRef.current) return;
    setStickyOn(true);
    const obs = new IntersectionObserver(
      (e) => setStickyOn(!e[0].isIntersecting),
      { threshold: 0.4 }
    );
    obs.observe(ctaRef.current);
    return () => obs.disconnect();
  }, [revealed]);

  function ctaClick() {
    sendBeacon(CFG.slug, "vsl-cta", { eventType: "converteu" });
  }

  const nome = (res?.name || "").trim();
  const xicara = (res?.profileName || "").replace("Xícara de ", "");

  return (
    <>
      <PageBeacon slug={CFG.slug} step="vsl" source="quiz" />

      <header className="topo">
        <img className="logo" src="/ebook-web/simbolo.png" alt="Notas do Café" width={34} height={34} />
        <span className="marca">Notas do Café</span>
      </header>

      <main className="wrap">
        <section className="v-hero">
          <p className="chip">
            {xicara ? `Sua xícara · ${xicara}` : "Diagnóstico em vídeo"}
          </p>
          <h1>{nome ? `${nome}, a sua xícara tem nome.` : "A sua xícara ganha nome neste vídeo."}</h1>
          <p className="sub">
            Aperte o play. O vídeo mostra o que separa a sua coada da xícara do
            balcão{res?.familyName ? `, e por que a família ${res.familyName} é a primeira a ajustar` : ""}.
          </p>

          <VslPlayer
            src={CFG.videoSrc}
            poster={CFG.poster}
            startAt={startAt}
            seekable={revealed}
            onPlay={onPlay}
            onTime={(t) => {
              if (t >= delay.current) reveal();
            }}
          />

          <p className="v-proof">
            Pesquisa citada no vídeo, com fonte: {CFG.fontes}
          </p>
        </section>

        <section
          ref={offerRef}
          className={"oferta" + (revealed ? " on" : "")}
          hidden={!revealed}
        >
          <p className="kicker">Apresentado no vídeo</p>
          <h2>{CFG.produto}</h2>
          <p className="oferta-sub">
            As oito variáveis da coada, uma por uma, com o método Medir,
            Ajustar, Provar. Sem máquina nova na bancada.
          </p>

          <div className="card">
            <img className="capa" src={CFG.capa} alt={`Capa do guia ${CFG.produto}`} loading="lazy" />
            <div className="det">
              <ul>
                {CFG.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <div className="etiqueta">
                <s>{CFG.precoDe}</s>
                <span className="preco">{CFG.preco}</span>
                <span className="uni">pagamento único</span>
              </div>
              <a ref={ctaRef} href={CFG.checkout} className="btn" onClick={ctaClick}>
                {CTA_LABEL} →
              </a>
              <p className="micro">
                Acesso imediato. Prove a diferença na segunda coada.
              </p>
            </div>
          </div>

          <div className="garantia">
            <div className="gtit">{CFG.garantiaNome}</div>
            <p>{CFG.garantia}</p>
          </div>
        </section>

        <footer>
          <p>{CFG.disclaimer}</p>
          <p className="fontes">Fontes: {CFG.fontes}.</p>
        </footer>
      </main>

      <div className={"v-sticky" + (stickyOn ? " on" : "")} hidden={!revealed} aria-hidden={!stickyOn}>
        <img src={CFG.capa} alt="" width={34} height={48} />
        <div className="s-txt">
          <b>{CFG.produto}</b>
          <span>{CFG.preco} · pagamento único</span>
        </div>
        <a href={CFG.checkout} className="btn btn-s" onClick={ctaClick}>
          {CTA_LABEL}
        </a>
      </div>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Eczar:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap");
        :root {
          --roast: #2c1810;
          --card: #241409;
          --line: rgba(200, 150, 62, 0.16);
          --cream: #f5ede0;
          --muted: #9e8e7a;
          --cinnamon: #d2691e;
          --gold: #c8963e;
          --gold-bright: #d4a44a;
          --serif: "Eczar", Georgia, serif;
        }
        html {
          -webkit-text-size-adjust: 100%;
        }
        body {
          margin: 0;
          background: radial-gradient(
              1100px 660px at 50% -200px,
              rgba(139, 69, 19, 0.42),
              transparent 62%
            )
            var(--roast);
          color: var(--cream);
          font-family: "Plus Jakarta Sans", -apple-system, "Segoe UI", sans-serif;
        }
      `}</style>
      <style jsx>{`
        .topo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 14px 16px 4px;
        }
        .marca {
          font-family: var(--serif);
          font-size: 17px;
          font-weight: 600;
          color: var(--cream);
        }
        .wrap {
          max-width: 780px;
          margin: 0 auto;
          padding: 0 16px 40px;
        }
        .v-hero {
          text-align: center;
          padding-top: 14px;
        }
        .chip {
          display: inline-block;
          margin: 0 0 10px;
          padding: 5px 13px;
          border: 1px solid rgba(200, 150, 62, 0.55);
          border-radius: 999px;
          color: var(--gold-bright);
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }
        h1 {
          font-family: var(--serif);
          font-size: clamp(1.65rem, 5.6vw, 2.5rem);
          font-weight: 700;
          line-height: 1.16;
          margin: 0 0 8px;
        }
        .sub {
          color: var(--muted);
          font-size: 14.5px;
          line-height: 1.55;
          max-width: 520px;
          margin: 0 auto 16px;
        }
        .v-proof {
          color: var(--muted);
          font-size: 11.5px;
          line-height: 1.6;
          margin: 12px auto 0;
          max-width: 560px;
        }
        .oferta {
          display: none;
          text-align: center;
          margin-top: 44px;
          padding-top: 34px;
          border-top: 1px solid var(--line);
        }
        .oferta.on {
          display: block;
          animation: rise 0.6s ease-out;
        }
        @keyframes rise {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .kicker {
          color: var(--gold);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin: 0 0 8px;
        }
        h2 {
          font-family: var(--serif);
          font-size: clamp(1.5rem, 4.6vw, 2.1rem);
          font-weight: 700;
          margin: 0 0 6px;
        }
        .oferta-sub {
          color: var(--muted);
          font-size: 14px;
          line-height: 1.55;
          max-width: 480px;
          margin: 0 auto 22px;
        }
        .card {
          display: flex;
          gap: 22px;
          align-items: center;
          text-align: left;
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 22px;
          max-width: 620px;
          margin: 0 auto;
        }
        .capa {
          width: 150px;
          border-radius: 6px;
          box-shadow: 14px 18px 40px rgba(0, 0, 0, 0.5);
          flex-shrink: 0;
        }
        .det ul {
          /* o preflight do Tailwind zera list-style no ul; a oferta precisa do marcador */
          list-style: disc;
          margin: 0 0 14px;
          padding: 0 0 0 18px;
          color: var(--cream);
          font-size: 13.5px;
          line-height: 1.65;
        }
        .det li {
          margin-bottom: 4px;
        }
        .det li::marker {
          color: var(--gold);
        }
        .etiqueta {
          display: flex;
          align-items: baseline;
          gap: 9px;
          margin-bottom: 12px;
        }
        .etiqueta s {
          font-family: var(--serif);
          color: var(--muted);
          font-size: 17px;
        }
        .preco {
          font-family: var(--serif);
          font-weight: 700;
          font-size: 32px;
          color: var(--gold-bright);
        }
        .uni {
          color: var(--muted);
          font-size: 12.5px;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--gold);
          color: #1e100a;
          font-weight: 600;
          font-size: 15.5px;
          padding: 13px 26px;
          border-radius: 10px;
          text-decoration: none;
          transition: background 0.15s;
        }
        .btn:hover {
          background: var(--gold-bright);
        }
        .micro {
          color: var(--muted);
          font-size: 12px;
          margin: 10px 0 0;
        }
        .garantia {
          max-width: 480px;
          margin: 22px auto 0;
          border: 1px solid rgba(200, 150, 62, 0.35);
          border-radius: 12px;
          padding: 16px 18px;
        }
        .gtit {
          font-family: var(--serif);
          font-size: 17px;
          font-weight: 700;
          color: var(--gold-bright);
          margin-bottom: 5px;
        }
        .garantia p {
          color: var(--muted);
          font-size: 13px;
          line-height: 1.6;
          margin: 0;
        }
        footer {
          margin-top: 46px;
          padding-top: 18px;
          border-top: 1px solid var(--line);
          text-align: center;
        }
        footer p {
          color: var(--muted);
          font-size: 11.5px;
          line-height: 1.65;
          max-width: 560px;
          margin: 0 auto 8px;
        }
        .v-sticky {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
          background: rgba(44, 24, 16, 0.94);
          border-top: 1px solid var(--line);
          backdrop-filter: blur(8px);
          transform: translateY(110%);
          transition: transform 0.3s ease;
        }
        .v-sticky.on {
          transform: none;
        }
        .v-sticky img {
          border-radius: 3px;
        }
        .s-txt {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          line-height: 1.3;
        }
        .s-txt b {
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .s-txt span {
          color: var(--gold-bright);
          font-size: 12px;
        }
        .btn-s {
          padding: 10px 18px;
          font-size: 14px;
          flex-shrink: 0;
        }
        @media (max-width: 560px) {
          .card {
            flex-direction: column;
            text-align: center;
          }
          .capa {
            width: 130px;
          }
          .det ul {
            text-align: left;
          }
          .etiqueta {
            justify-content: center;
          }
          .det {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </>
  );
}
