"use client";

import { useEffect, useRef, useState } from "react";
import PageBeacon, { sendBeacon } from "../../PageBeacon";
import PROVA from "../../../checkout-prova.json";
import MANIFEST from "../../../proof-manifest.json";

/* ============================================================
   TOKENS DA COLEÇÃO COMPLETA (colecao-rede, 22/09/26; a fábrica troca por casa)
   Clone do /app/checkout (app-scriptorium/55, golden do checkout do ebook c4-20k/54):
   cabeçalho imersivo com a capa do volume, reforço no método Amazon, formulário da
   Stripe embutido e o bump card "Você leva os dois" com o ebook premium + app da casa
   pela metade. Sem oferta/dono/split/downsell: a coleção tem um preço só e a janela
   fecha sexta 23:59 pela rota (a página não escreve valor nenhum).
   ============================================================ */
const COL = {
  slug: "notas-do-cafe",
  news: "Notas do Café",
  kicker: "Coleção completa",
  titulo: "Todas as edições num PDF só",
  capa: "https://ecmveymyzdqiehvtqxms.supabase.co/storage/v1/object/public/assets/scriptorium/colecao/notas-do-cafe-capa.png",
  capaAlt: "Capa da Coleção completa da Notas do Café",
  leva: "115 edições, de abril de 2026 até esta semana, inteiras e em ordem, com sumário por mês",
  bump: {
      "titulo": "Café de Balcão no Coador de Casa",
      "ponte": "Você está levando todas as edições. Este é o guia premium da casa, com o app pra aplicar.",
      "frase": "Da Notas do Café: o ebook Café de Balcão no Coador de Casa em PDF e versão web, mais o app no celular, pela metade do preço.",
      "formato": "Ebook + app, entrega separada por email",
      "capa": "/ebook-web/capa-notas-do-cafe.webp",
      "capaAlt": "Capa do ebook Café de Balcão no Coador de Casa",
      "tela": "/ebook-web/capa-app-notas-do-cafe.webp",
      "telaAlt": "O app Café de Balcão no Coador de Casa no celular",
      "preco": "R$ 48,50",
      "de": "R$ 97"
  },
  despedida: "Sem frescura. Bom café. Notas do Café",
};
const BUILD = "colecao-20260922-1710";
const AVATARES = (MANIFEST.avatares || []).slice(0, 5);

// Publishable key da conta News Makers (a coleção cobra pela NM, como o app).
const PK = process.env.NEXT_PUBLIC_STRIPE_PK_NM;

type CheckoutHandle = { mount: (sel: string) => void; destroy: () => void };
type StripeJs = {
  initEmbeddedCheckout: (opts: { fetchClientSecret: () => Promise<string> }) => Promise<CheckoutHandle>;
};
declare global {
  interface Window {
    Stripe?: (pk: string) => StripeJs;
  }
}

/* Jornada que o PageBeacon abriu na primeira página. Best-effort. */
function jornada() {
  try {
    return {
      journey: sessionStorage.getItem("vdn_journey") || "",
      src: sessionStorage.getItem("vdn_source") || "",
    };
  } catch {
    return {};
  }
}

export default function ColecaoCheckout() {
  const [bump, setBump] = useState(false);
  const [stripeOk, setStripeOk] = useState(false);
  const [montado, setMontado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // stripe.js por script tag (zero dependência npm, igual nos 30 repos)
  useEffect(() => {
    if (!PK) return;
    if (window.Stripe) {
      setStripeOk(true);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://js.stripe.com/v3/";
    s.onload = () => setStripeOk(true);
    s.onerror = () => setErro("stripe.js não carregou");
    document.head.appendChild(s);
  }, []);

  // monta (e remonta quando o bump muda: session nova com line_items[1])
  useEffect(() => {
    if (!stripeOk || !PK || !window.Stripe) return;
    let handle: CheckoutHandle | null = null;
    let vivo = true;
    setErro(null);
    setMontado(false);
    window
      .Stripe(PK)
      .initEmbeddedCheckout({
        fetchClientSecret: () =>
          fetch("/api/colecao-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bump, checkout_variant: "golden", ...jornada() }),
          })
            .then((r) => r.json())
            .then((d) => {
              if (!d.clientSecret) throw new Error(d.error || "sem clientSecret");
              return d.clientSecret;
            }),
      })
      .then((c) => {
        if (!vivo) {
          c.destroy();
          return;
        }
        handle = c;
        c.mount("#checkout-box");
        setMontado(true);
      })
      .catch((e: Error) => setErro(e.message));
    return () => {
      vivo = false;
      handle?.destroy();
    };
  }, [stripeOk, bump]);

  // Início de pagamento: beacon `colecao-ck-pagar`, 1 vez por jornada, no primeiro toque no formulário da
  // Stripe (iframe de outra origem: a página enxerga o blur da janela com o iframe do #checkout-box ativo).
  const pagarJa = useRef(false);
  useEffect(() => {
    let relogio = 0;
    const para = () => {
      window.removeEventListener("blur", onBlur);
      window.clearInterval(relogio);
    };
    const confere = () => {
      if (pagarJa.current) return;
      const el = document.activeElement;
      if (!el || el.tagName !== "IFRAME" || !el.closest("#checkout-box")) return;
      pagarJa.current = true;
      para();
      sendBeacon(COL.slug, "colecao-ck-pagar", { eventType: "converteu" });
    };
    function onBlur() {
      confere();
      window.setTimeout(confere, 0);
    }
    window.addEventListener("blur", onBlur);
    relogio = window.setInterval(confere, 1000);
    return para;
  }, []);

  const configurado = Boolean(PK);
  const depo = PROVA.depoimento;

  const bumpCard = COL.bump ? (
    <section className={`bumpcard${bump ? " on" : ""}`} aria-label="Adicione ao pedido">
      <span className="btag">Adicione ao pedido</span>
      <p className="bponte">{COL.bump.ponte}</p>
      <div className="hd-par b-par">
        <img className="hd-pcapa" src={COL.bump.capa} alt={COL.bump.capaAlt} width={1800} height={2400} loading="lazy" />
        <span className="hd-mais" aria-hidden="true">+</span>
        <span className="hd-fone"><img src={COL.bump.tela} alt={COL.bump.telaAlt} width={780} height={1688} loading="lazy" /></span>
      </div>
      <span className="bformato">{COL.bump.formato}</span>
      <span className="bnome">{COL.bump.titulo}</span>
      <span className="bfrase">{COL.bump.frase}</span>
      <span className="bpreco"><s>{COL.bump.de}</s> {COL.bump.preco}</span>
      <label htmlFor="bump" className="bbar">
        <input id="bump" type="checkbox" checked={bump} onChange={(e) => setBump(e.target.checked)} />
        <span className="bx" aria-hidden="true">{bump ? "✓" : ""}</span>
        <span>Levar os dois</span>
      </label>
    </section>
  ) : null;

  return (
    <>
      <PageBeacon slug={COL.slug} step="colecao-checkout" source="colecao" />

      <nav>
        <div className="wrap nav-inner">
          <a href="/" className="brand" aria-label="Home">
            <img src="/ebook-web/simbolo.png" alt="" width={32} height={32} />
            <span className="wm"><span className="t">Notas</span><span className="s">{" do Café"}</span></span>
          </a>
        </div>
      </nav>

      <main className="ck-page" data-build={BUILD}>
        <header className="hd hd-cena">
          <div className="hd-par hd-solo">
            <img className="hd-pcapa" src={COL.capa} alt={COL.capaAlt} width={900} height={1200} />
          </div>
          <p className="hd-leva">{COL.leva}</p>
          <span className="hd-chip">{COL.kicker}</span>
          <h1 className="hd-h1">{COL.titulo}</h1>
        </header>

        {PROVA.exibir && PROVA.exibir_nota && (
          <section className="ck-prova" aria-label={`O que os leitores da ${COL.news} dizem`}>
            <div className="ck-media">
              <b>{PROVA.media_exibido}</b>
              <div>
                <span className="ck-stars" style={{ "--f": `${PROVA.media_pct}%` } as React.CSSProperties} aria-label={`${PROVA.media_exibido} de 5`}>
                  <span className="st-b" aria-hidden="true">★★★★★</span><span className="st-f" aria-hidden="true">★★★★★</span>
                </span>
                <small>{PROVA.votos} votos de leitores</small>
              </div>
            </div>
            <div className="ck-bars" aria-hidden="true">
              {PROVA.distribuicao.map((d) => (
                <div className="ck-bar" key={d.estrelas}>
                  <span>{d.estrelas} ★</span>
                  <span className="tr"><i style={{ width: `${d.pct}%` }} /></span>
                  <span className="pc">{d.pct}%</span>
                </div>
              ))}
            </div>
            <div className="ck-leit">
              {AVATARES.length > 0 && (
                <span className="ck-avs" aria-hidden="true">
                  {AVATARES.map((f) => <img key={f} src={`/images/leitores/${f}`} alt="" width={26} height={26} loading="lazy" />)}
                </span>
              )}
              <span><b>{PROVA.leitores_exibido}</b> leitores recebem a news</span>
            </div>
            {depo && (
              <figure className="ck-depo">
                <blockquote>{depo.texto}</blockquote>
                <figcaption>{depo.quem} · nota {depo.nota} de 5</figcaption>
              </figure>
            )}
          </section>
        )}

        <div className={`ck-box${configurado && !montado && !erro ? " carregando" : ""}`}>
          {configurado ? (
            <>
              <div id="checkout-box" />
              {!montado && !erro && (
                <div className="ck-skel" role="status" aria-label="Abrindo o checkout">
                  <div className="sk-bars" aria-hidden="true">
                    <span className="sk-l sk-rot" />
                    <span className="sk-l sk-campo" />
                    <span className="sk-l sk-rot sk-curto" />
                    <span className="sk-l sk-campo" />
                    <span className="sk-dupla">
                      <span className="sk-l sk-campo" />
                      <span className="sk-l sk-campo" />
                    </span>
                    <span className="sk-l sk-rot sk-curto" />
                    <span className="sk-l sk-campo" />
                    <span className="sk-l sk-botao" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="ck-pend">
              <p><b>Checkout em preparação.</b></p>
              <p>O checkout abre aqui assim que as chaves da Stripe entrarem no ambiente. Nada é cobrado até lá.</p>
            </div>
          )}
          {erro && <div className="ck-pend"><p><b>O checkout não abriu.</b></p><p>{erro}</p></div>}
        </div>

        {bumpCard}
      </main>

      <footer className="ck-foot">
        <p>{COL.despedida}</p>
      </footer>

      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
:root{--bg:#14110C;--bg-deep:#19170F;--text:#E9EAE3;--text-dim:#96917E;--sage:#96917E;--hair:rgba(233,234,227,.12);--hair-accent:rgba(226,120,44,.30);--bright:#E2782C;--serif:"Playfair Display",Georgia,serif;--sans:"Inter",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,monospace}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--sans);background:var(--bg);color:var(--text);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
nav{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--bg) 82%,transparent);backdrop-filter:saturate(140%) blur(8px);-webkit-backdrop-filter:saturate(140%) blur(8px);border-bottom:1px solid var(--hair)}
a{color:inherit;text-decoration:none}
.wrap{width:100%;max-width:1140px;margin:0 auto;padding:0 28px}
.nav-inner{display:flex;align-items:center;justify-content:center;height:66px}
.brand{display:flex;align-items:center;gap:11px}
.brand img{width:32px;height:32px}
.wm{font-weight:700;font-size:20px;letter-spacing:-.02em}
.wm .t{color:var(--bright)}.wm .s{color:#fff}
.kicker{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.24em;text-transform:uppercase;color:var(--bright)}

        .ck-page{max-width:560px;margin:0 auto;padding:0 1.25rem 4rem}
        .hd{margin:0 0 18px}
        .hd-chip{display:inline-block;font-family:var(--mono);font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--bright);border:1px solid var(--hair-accent);border-radius:99px;padding:5px 10px;background:color-mix(in srgb,var(--bg) 45%,transparent);margin-bottom:12px}
        .hd-h1{font-family:var(--serif);font-style:italic;font-weight:900;font-size:clamp(2rem,8.8vw,2.7rem);line-height:1.08;color:#fff;letter-spacing:-.02em;margin:0 0 10px;text-wrap:balance}
        .hd-cena{display:flex;flex-direction:column;align-items:center;text-align:center;padding:22px 0 4px}
        .hd-par{display:flex;align-items:center;justify-content:center;position:relative;--h:170px}
        .hd-pcapa{height:var(--h);width:auto;aspect-ratio:3/4;object-fit:cover;border-radius:4px 8px 8px 4px;box-shadow:0 18px 40px rgba(0,0,0,.65);transform:rotate(-4deg);z-index:1}
        .hd-solo{--h:210px}
        .hd-solo .hd-pcapa{transform:rotate(-2deg);box-shadow:0 22px 48px rgba(0,0,0,.7),12px 12px 0 -4px rgba(255,255,255,.06),24px 24px 0 -8px rgba(255,255,255,.04)}
        .hd-fone{display:block;height:calc(var(--h) * 1.06);aspect-ratio:390/844;padding:2%;border-radius:9.5% / 4.4%;background:#0b0b0b;box-shadow:0 22px 40px -14px rgba(0,0,0,.9),inset 0 0 0 2px #2a2a2a;margin-left:-22px;z-index:2}
        .hd-fone img{display:block;width:100%;height:100%;object-fit:cover;object-position:top;border-radius:7.5% / 3.5%}
        .hd-mais{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:34px;height:34px;border-radius:50%;background:#fff;color:#140408;font-family:var(--serif);font-size:24px;line-height:34px;text-align:center;z-index:3;box-shadow:0 6px 18px rgba(0,0,0,.5)}
        .hd-leva{font-size:12.5px;color:var(--text-dim);margin:12px 0 14px;max-width:34ch}
        .ck-box{position:relative;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.5);min-height:120px}
        .ck-box.carregando{min-height:400px}
        .ck-skel{position:absolute;inset:0;padding:22px 20px 24px;pointer-events:none;background:#fff}
        .sk-bars{display:flex;flex-direction:column;gap:9px}
        .sk-l{display:block;border-radius:6px;background:linear-gradient(100deg,#EDE7E9 0%,#F7F3F4 45%,#EDE7E9 90%);background-size:220% 100%;animation:sk 1.5s linear infinite}
        .sk-rot{width:96px;height:9px;margin-top:5px}
        .sk-curto{width:74px}
        .sk-campo{width:100%;height:42px}
        .sk-dupla{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .sk-botao{margin-top:12px;width:100%;height:46px;background:linear-gradient(100deg,color-mix(in srgb,var(--bright) 30%,#fff) 0%,color-mix(in srgb,var(--bright) 14%,#fff) 45%,color-mix(in srgb,var(--bright) 30%,#fff) 90%);background-size:220% 100%}
        @keyframes sk{from{background-position:130% 0}to{background-position:-30% 0}}
        @media (prefers-reduced-motion:reduce){.sk-l{animation:none}}
        .ck-pend{padding:2.2rem 1.6rem;font-family:var(--sans,inherit);color:#26302B}
        .ck-pend p{font-size:14.5px;line-height:1.6;margin:0 0 .5rem}
        .ck-pend b{color:#0D0F0E}
        .bumpcard{margin-top:18px;padding:18px 20px;border:1px solid var(--hair);border-radius:14px;background:var(--bg-deep);text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px;transition:border-color .2s ease,background .2s ease}
        .bumpcard.on{border-color:var(--bright);background:color-mix(in srgb,var(--bright) 7%,transparent)}
        .bumpcard input{position:absolute;opacity:0;width:0;height:0}
        .btag{font-family:var(--mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--bright)}
        .bponte{font-family:var(--serif);font-style:italic;font-size:16.5px;line-height:1.3;color:#fff;margin:8px 0 12px;max-width:30ch}
        .b-par{--h:134px}
        .b-par .hd-fone{height:calc(var(--h) * .92);margin-left:-8px}
        .b-par .hd-mais{width:30px;height:30px;font-size:21px;line-height:30px}
        .bformato{font-size:12px;color:var(--text-dim);margin:12px 0 4px}
        .bfrase{display:block;font-size:13px;color:var(--text);line-height:1.45;margin:0 0 8px;max-width:34ch}
        .bnome{display:block;font-family:var(--serif);font-weight:700;font-size:16.5px;color:#fff;margin:6px 0 4px}
        .bpreco{display:block;font-size:14px;font-weight:700;color:var(--bright)}
        .bpreco s{color:var(--text-dim);font-weight:400;margin-right:4px}
        .bbar{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;margin-top:8px;padding:12px;border:1.5px solid var(--bright);border-radius:8px;color:#fff;font-weight:600;font-size:14.5px;cursor:pointer}
        .bumpcard.on .bbar{background:color-mix(in srgb,var(--bright) 14%,transparent)}
        .bx{width:22px;height:22px;border-radius:6px;border:2px solid var(--bright);display:inline-flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#140408;flex:none;transition:background .2s ease}
        .bumpcard.on .bx{background:var(--bright)}
        .ck-prova{margin:0 0 16px;padding:14px 16px;border:1px solid var(--hair);border-radius:14px;background:var(--bg-deep);display:flex;flex-direction:column;gap:12px}
        .ck-media{display:flex;align-items:center;gap:12px}
        .ck-media>b{font-family:var(--serif);font-size:40px;line-height:1;color:#fff;font-variant-numeric:tabular-nums}
        .ck-media>div{display:flex;flex-direction:column;gap:3px}
        .ck-media small{font-size:12px;color:var(--text-dim)}
        .ck-stars{position:relative;display:inline-block;font-size:20px;line-height:1;letter-spacing:1px}
        .ck-stars .st-b{color:color-mix(in srgb,var(--text) 22%,transparent)}
        .ck-stars .st-f{position:absolute;left:0;top:0;width:var(--f,100%);overflow:hidden;white-space:nowrap;color:#E6B85C}
        .ck-bars{display:flex;flex-direction:column;gap:5px}
        .ck-bar{display:grid;grid-template-columns:30px 1fr 34px;align-items:center;gap:8px;font-size:12px;color:var(--text-dim);font-variant-numeric:tabular-nums}
        .ck-bar .tr{height:8px;border-radius:4px;background:color-mix(in srgb,var(--text) 12%,transparent);overflow:hidden}
        .ck-bar .tr i{display:block;height:100%;background:#E6B85C;border-radius:4px}
        .ck-bar .pc{text-align:right}
        .ck-leit{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--text-dim)}
        .ck-leit b{color:#fff}
        .ck-avs{display:inline-flex}
        .ck-avs img{width:26px;height:26px;border-radius:50%;border:2px solid var(--bg-deep);margin-left:-8px;background:#333}
        .ck-avs img:first-child{margin-left:0}
        .ck-depo{margin:0;text-align:left}
        .ck-depo blockquote{font-family:var(--serif);font-style:italic;font-size:14.5px;line-height:1.45;color:#fff;quotes:"\\201C" "\\201D"}
        .ck-depo blockquote::before{content:open-quote;color:var(--bright)}
        .ck-depo blockquote::after{content:close-quote;color:var(--bright)}
        .ck-depo figcaption{margin-top:5px;font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim)}
        .ck-foot{padding:2.5rem 1.5rem;text-align:center;border-top:1px solid var(--hair);background:var(--bg-deep)}
        .ck-foot p{font-family:var(--serif);font-style:italic;font-size:1rem;color:var(--sage)}
      `}</style>
    </>
  );
}
