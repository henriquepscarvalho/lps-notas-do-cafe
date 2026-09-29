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
      "titulo": "Coleção completa · Brasa Certa",
      "ponte": "Você está levando todas as edições. Leve junto a coleção completa de outra newsletter, pela metade do preço.",
      "frase": "Churrasco todo dia: cortes, técnicas, equipamentos e harmonizações. 117 edições, de abril de 2026 até esta semana, num PDF só.",
      "formato": "PDF, entrega separada por email",
      "capa": "https://ecmveymyzdqiehvtqxms.supabase.co/storage/v1/object/public/assets/scriptorium/colecao/brasa-certa-capa.png",
      "capaAlt": "Capa da Coleção completa: Brasa Certa",
      "preco": "R$ 48,50",
      "de": "R$ 97"
  },
  despedida: "Sem frescura. Bom café. Notas do Café",
};
const BUILD = "legivel-colecao-20260928-0956";

/* Saída do checkout (HC 23/09, JSON col_exit_intent): quem faz o gesto de sair ANTES de tocar no formulário
   recebe o guia da casa e o botão abre direto o /ebook-premium/checkout. O preço vem do token `preco` da
   página do guia e a fábrica confere contra o VALOR_CHEIO da rota /api/create-session (o que a Stripe cobra).
   Uma vez por sessão. Computador = mouse cruza o topo; celular = volta pra aba depois de 3 s fora, ou subida
   rápida (320 px em 350 ms, molde do ExitIntent do checkout do guia). Nunca depois do primeiro toque no
   formulário da Stripe: no Pix e no 3DS a pessoa vai ao app do banco e volta pagando.
   Beacons: colecao-exit-topo|volta|rolagem (abriu, por gatilho) e colecao-exit-cta (clicou). A venda do guia
   carrega a origem da jornada (email-colecao-… no vdn_source), que separa quem veio daqui.
   Desligar = EXIT false e subir. ALQ fora (âncora, Regra 2). */
const EXIT = true;
const GUIA = { titulo: "Café de Balcão no Coador de Casa", capa: "/ebook-web/capa-notas-do-cafe.webp", resumo: "Guia completo, web + PDF.", preco: "R$ 47" };
const GUIA_HREF = "/ebook-premium/checkout?src=colecao-exit";

/* col/08 (HC 23/09): «Qual checkout vende mais: com as páginas do volume ou só com a capa?»
   A = só a capa (controle, o golden de 22/09); B = capa + 3 páginas do PDF entregue (sumário
   por mês, abertura de uma edição, uma página do texto). Sorteio 50/50 no localStorage (a pessoa
   vê sempre o mesmo); `?v=A|B` força o braço (prova). O braço viaja no create-session como
   `checkout_variant` ("capa" | "amostra") e o beacon `colecao-split-a|b` carimba a jornada
   (1 por sessão). Desligar = SPLIT false e subir: todo mundo volta pro A, carimbo "golden". */
const SPLIT = true;
type Braco = "A" | "B";
let sorteioOk = true;
function sorteia(): Braco {
  if (!SPLIT) return "A";
  try {
    const f = new URLSearchParams(location.search).get("v");
    if (f === "A" || f === "B") {
      localStorage.setItem("col_ck", f);
      return f;
    }
    const v = localStorage.getItem("col_ck");
    if (v === "A" || v === "B") return v;
    const b: Braco = Math.random() < 0.5 ? "A" : "B";
    localStorage.setItem("col_ck", b);
    return b;
  } catch {
    sorteioOk = false;
    return "A";
  }
}
/* Pintura do braço antes do primeiro quadro: o script roda no parse do HTML (antes da hidratação),
   sorteia com a mesma regra do `sorteia()` e injeta no <head> o CSS do braço B. Sem ele, o B piscaria
   com a linha «N edições» e o chip por um instante e as páginas entrariam empurrando a tela. */
const PINTA = `(function(){try{var q=new URLSearchParams(location.search).get("v"),b=(q==="A"||q==="B")?q:localStorage.getItem("col_ck");if(b!=="A"&&b!=="B")b=Math.random()<.5?"A":"B";localStorage.setItem("col_ck",b);if(b==="B"){var s=document.createElement("style");s.textContent="html .hd-leva,html .hd-chip{display:none}html .hd-h1{margin-top:22px}html .amostra{display:block}";document.head.appendChild(s)}}catch(e){}})();`;
const AMOSTRA = [
  { src: "/colecao/amostra-1.webp", rot: "Sumário por mês", alt: "Página do sumário da Coleção completa, edições agrupadas por mês" },
  { src: "/colecao/amostra-2.webp", rot: "Abertura da edição", alt: "Primeira página de uma edição dentro do volume" },
  { src: "/colecao/amostra-3.webp", rot: "O texto inteiro", alt: "Página do meio de uma edição, com o texto como foi enviado" },
];

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

/* Jornada que o PageBeacon abriu na primeira página. Best-effort.
   col/28: sid = id do assinante da beehiiv ({{subscriber_id}} no link do email); a LP /colecao guarda no mesmo
   sessionStorage, o checkout lê da própria URL quando o email aponta direto, e a rota grava metadata.beehiiv_sid.
   col/27: oferta=metade do email 2 do resgate; a rota só aplica dentro da janela (preço sai no formulário da Stripe). */
const SID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function jornada() {
  try {
    const u = new URLSearchParams(window.location.search);
    const q = (u.get("sid") || "").toLowerCase();
    if (SID_RE.test(q)) sessionStorage.setItem("vdn_sid", q);
    return {
      journey: sessionStorage.getItem("vdn_journey") || "",
      src: sessionStorage.getItem("vdn_source") || "",
      sid: sessionStorage.getItem("vdn_sid") || "",
      oferta: u.get("oferta") === "metade" ? "metade" : "",
    };
  } catch {
    return {};
  }
}

/* LEGIVEL (passe de legibilidade): o número que abre a linha das edições vira o número grande; na frase do bump,
   o primeiro "N edições" sai em negrito. Sem número na frase, o texto sai como está. */
const LEVA = COL.leva.match(/^(\d[\d.]*)\s+([^\s,]+),?\s+(.*)$/);
function destaca(t: string) {
  const m = t.match(/^(.*?)(\d[\d.]*\s+[^\s,.]+)(.*)$/);
  return m ? <>{m[1]}<b>{m[2]}</b>{m[3]}</> : t;
}

export default function ColecaoCheckout() {
  const [bump, setBump] = useState(false);
  const [braco, setBraco] = useState<Braco | null>(null); // null até o sorteio: sem piscar de um braço pro outro
  useEffect(() => {
    const b = sorteia();
    setBraco(b);
    if (SPLIT) sendBeacon(COL.slug, sorteioOk ? `colecao-split-${b.toLowerCase()}` : "colecao-split-x");
  }, []);
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
    if (!stripeOk || !PK || !window.Stripe || !braco) return;
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
            body: JSON.stringify({ bump, checkout_variant: SPLIT ? (braco === "B" ? "amostra" : "capa") : "golden", ...jornada() }),
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
  }, [stripeOk, bump, braco]);

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

  // Saída (HC 23/09): o guia da casa pra quem sai antes de tocar no formulário.
  const [saida, setSaida] = useState(false);
  const caixaSaida = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!EXIT) return;
    let ja = false;
    const abre = (gatilho: "topo" | "volta" | "rolagem") => {
      if (ja || pagarJa.current) return;
      try {
        if (sessionStorage.getItem("col_exit")) return;
        sessionStorage.setItem("col_exit", "1");
      } catch {
        /* modo privado: o guard fica só na variável */
      }
      ja = true;
      setSaida(true);
      sendBeacon(COL.slug, `colecao-exit-${gatilho}`);
    };
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) abre("topo");
    };
    let fora = 0;
    const onVis = () => {
      if (document.visibilityState === "hidden") fora = Date.now();
      else if (fora && Date.now() - fora >= 3000) abre("volta");
    };
    let uy = window.scrollY, ry = uy, rt = 0;
    const onScroll = () => {
      const y = window.scrollY, t = Date.now();
      if (y < uy) {
        if (!rt) { rt = t; ry = uy; }
        if (ry - y >= 320 && t - rt <= 350) abre("rolagem");
      } else rt = 0;
      uy = y;
    };
    const toque = "ontouchstart" in window || window.matchMedia("(pointer:coarse)").matches;
    document.addEventListener("mouseleave", onLeave);
    if (toque) {
      document.addEventListener("visibilitychange", onVis);
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    return () => {
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  useEffect(() => {
    if (!saida) return;
    caixaSaida.current?.focus();
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSaida(false);
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [saida]);

  const configurado = Boolean(PK);
  const depo = PROVA.depoimento;

  const bumpCard = COL.bump ? (
    <section className={`bumpcard${bump ? " on" : ""}`} aria-label="Adicione ao pedido">
      <span className="btag">Adicione ao pedido</span>
      <p className="bponte">{COL.bump.ponte}</p>
      <div className="hd-par b-par">
        <img className="hd-pcapa" src={COL.bump.capa} alt={COL.bump.capaAlt} width={900} height={1200} loading="lazy" />
      </div>
      <span className="bformato">{COL.bump.formato}</span>
      <span className="bnome">{COL.bump.titulo.split(" · ").map((p, i) => (<span key={i}>{i > 0 && <span className="bsep">{" · "}</span>}{p}</span>))}</span>
      <span className="bfrase">{destaca(COL.bump.frase)}</span>
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

      {SPLIT && <script dangerouslySetInnerHTML={{ __html: PINTA }} />}
      <main className="ck-page" data-build={BUILD}>
        {/* col/11 (molde do c4-20k/127 e 130): no celular a tira (capa, kicker e título) abre a página e o
            formulário da Stripe vem logo abaixo, dentro da 1ª tela; acima de 640 px a tira some. */}
        <div className="ck-tira">
          <span className="ck-tira-capa"><img src={COL.capa} alt={COL.capaAlt} width={44} height={59} /></span>
          <div className="ck-tira-in">
            <span className="ck-tira-kick">{COL.kicker}</span>
            <span className="ck-tira-tit">{COL.titulo}</span>
          </div>
        </div>
        <div className="ck-lado">
        <header className="hd hd-cena">
          <div className="hd-par hd-solo">
            <img className="hd-pcapa" src={COL.capa} alt={COL.capaAlt} width={900} height={1200} />
          </div>
          <p className="hd-leva">{LEVA ? <><span className="hd-num"><b>{LEVA[1]}</b> {LEVA[2]}</span>{LEVA[3]}</> : COL.leva}</p>
          <span className="hd-chip">{COL.kicker}</span>
          <h1 className="hd-h1">{COL.titulo}</h1>
        </header>

        {SPLIT && (
          <section className="amostra" aria-label="Páginas do volume" hidden={braco === "A"}>
            <span className="am-k">Por dentro do volume</span>
            <div className="am-row">
              {AMOSTRA.map((p) => (
                <figure key={p.src}>
                  <img src={p.src} alt={p.alt} width={600} height={850} />
                  <figcaption>{p.rot}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

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

        </div>
        <div className="ck-pg">
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
        </div>
      </main>

      <footer className="ck-foot">
        <p>{COL.despedida}</p>
      </footer>

      {saida && (
        <div
          className="saida"
          role="dialog"
          aria-modal="true"
          aria-labelledby="saida-titulo"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSaida(false);
          }}
        >
          <div className="saida-box" ref={caixaSaida} tabIndex={-1}>
            <button type="button" className="saida-x" aria-label="Fechar" onClick={() => setSaida(false)}>×</button>
            <p className="saida-kicker">Antes de sair</p>
            <h2 id="saida-titulo">Comece pelo guia da {COL.news}.</h2>
            <div className="saida-guia">
              <img src={GUIA.capa} alt="" width={78} height={104} />
              <div>
                <b>{GUIA.titulo}</b>
                <span>{GUIA.resumo}</span>
              </div>
            </div>
            <p className="saida-preco">{GUIA.preco}, uma vez só · pix ou cartão</p>
            <a className="saida-cta" href={GUIA_HREF} onClick={() => sendBeacon(COL.slug, "colecao-exit-cta", { eventType: "converteu" })}>
              Quero o guia →
            </a>
            <button type="button" className="saida-fechar" onClick={() => setSaida(false)}>
              Continuar na Coleção
            </button>
          </div>
        </div>
      )}

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
        .ck-lado,.ck-pg{display:contents}
        .hd{margin:0 0 18px}
        .hd-chip{display:inline-block;font-family:var(--mono);font-size:13px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:var(--bright);border:1px solid var(--hair-accent);border-radius:99px;padding:7px 14px;background:color-mix(in srgb,var(--bg) 45%,transparent);margin-bottom:14px}
        .hd-h1{font-family:var(--serif);font-style:italic;font-weight:900;font-size:clamp(2.15rem,9.4vw,3rem);line-height:1.08;color:#fff;letter-spacing:-.02em;margin:0 0 10px;text-wrap:balance}
        .hd-cena{display:flex;flex-direction:column;align-items:center;text-align:center;padding:22px 0 4px}
        .hd-par{display:flex;align-items:center;justify-content:center;position:relative;--h:170px}
        .hd-pcapa{height:var(--h);width:auto;aspect-ratio:3/4;object-fit:cover;border-radius:4px 8px 8px 4px;box-shadow:0 18px 40px rgba(0,0,0,.65);transform:rotate(-4deg);z-index:1}
        .hd-solo{--h:260px}
        .hd-solo .hd-pcapa{transform:rotate(-2deg);box-shadow:0 22px 48px rgba(0,0,0,.7),12px 12px 0 -4px rgba(255,255,255,.06),24px 24px 0 -8px rgba(255,255,255,.04)}
        .hd-fone{display:block;height:calc(var(--h) * 1.06);aspect-ratio:390/844;padding:2%;border-radius:9.5% / 4.4%;background:#0b0b0b;box-shadow:0 22px 40px -14px rgba(0,0,0,.9),inset 0 0 0 2px #2a2a2a;margin-left:-22px;z-index:2}
        .hd-fone img{display:block;width:100%;height:100%;object-fit:cover;object-position:top;border-radius:7.5% / 3.5%}
        .hd-mais{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:34px;height:34px;border-radius:50%;background:#fff;color:#140408;font-family:var(--serif);font-size:24px;line-height:34px;text-align:center;z-index:3;box-shadow:0 6px 18px rgba(0,0,0,.5)}
        .hd-leva{font-size:16px;line-height:1.5;color:var(--text);margin:22px 0 16px;max-width:36ch;text-wrap:balance}
        .hd-num{display:block;font-family:var(--serif);font-size:21px;line-height:1;color:#fff;margin:0 0 8px}
        .hd-num b{font-size:56px;font-weight:900;line-height:.95;letter-spacing:-.02em;font-variant-numeric:tabular-nums;margin-right:4px}
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
        .ck-pend p{font-size:16px;line-height:1.6;margin:0 0 .5rem}
        .ck-pend b{color:#0D0F0E}
        .bumpcard{margin-top:18px;padding:24px 20px 24px;border:1px solid var(--hair);border-radius:16px;background:var(--bg-deep);text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px;transition:border-color .2s ease,background .2s ease}
        .bumpcard.on{border-color:var(--bright);background:color-mix(in srgb,var(--bright) 7%,transparent)}
        .bumpcard input{position:absolute;opacity:0;width:0;height:0}
        .btag{font-family:var(--mono);font-size:13px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--bright)}
        .bponte{font-family:var(--serif);font-style:italic;font-size:21px;line-height:1.28;color:#fff;margin:10px 0 18px;max-width:25ch;text-wrap:balance}
        .b-par{--h:230px}
        .b-par .hd-fone{height:calc(var(--h) * .92);margin-left:-8px}
        .b-par .hd-mais{width:30px;height:30px;font-size:21px;line-height:30px}
        .bformato{font-size:15px;color:var(--text);margin:20px 0 2px}
        .bfrase{display:block;font-size:16px;color:var(--text);line-height:1.5;margin:0 0 14px;max-width:32ch;text-wrap:pretty}
        .bfrase b{color:#fff;font-weight:700}
        .bnome{display:block;font-family:var(--serif);font-weight:700;font-size:22px;line-height:1.2;color:#fff;margin:8px 0 6px;text-wrap:balance}
        .bsep{white-space:pre}
        .bpreco{display:flex;align-items:baseline;justify-content:center;gap:10px;font-size:34px;font-weight:800;line-height:1;color:#fff;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
        .bpreco s{font-size:19px;font-weight:500;color:var(--text-dim);margin:0;letter-spacing:0}
        .bbar{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;min-height:60px;margin-top:18px;padding:14px 20px;border:0;border-radius:999px;background:var(--bright);color:#140408;font-weight:800;font-size:18px;letter-spacing:.01em;cursor:pointer;user-select:none;box-shadow:0 5px 0 color-mix(in srgb,var(--bright) 55%,#000);transition:transform .15s ease,box-shadow .15s ease,filter .15s ease}
        .bbar:hover{filter:brightness(1.06)}
        .bbar:active,.bumpcard.on .bbar{transform:translateY(3px);box-shadow:0 2px 0 color-mix(in srgb,var(--bright) 55%,#000)}
        .bbar:has(input:focus-visible){outline:3px solid #fff;outline-offset:4px}
        .bx{width:28px;height:28px;border-radius:8px;border:2px solid #140408;background:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#fff;flex:none;transition:background .2s ease}
        .bumpcard.on .bx{background:#140408}
        .ck-prova{margin:0 0 16px;padding:20px 18px;border:1px solid var(--hair);border-radius:16px;background:var(--bg-deep);display:flex;flex-direction:column;gap:16px}
        .ck-media{display:flex;align-items:center;gap:14px}
        .ck-media>b{font-family:var(--serif);font-size:60px;line-height:.95;color:#fff;font-variant-numeric:tabular-nums}
        .ck-media>div{display:flex;flex-direction:column;gap:5px}
        .ck-media small{font-size:15px;color:var(--text)}
        .ck-stars{position:relative;display:inline-block;font-size:27px;line-height:1;letter-spacing:2px}
        .ck-stars .st-b{color:color-mix(in srgb,var(--text) 22%,transparent)}
        .ck-stars .st-f{position:absolute;left:0;top:0;width:var(--f,100%);overflow:hidden;white-space:nowrap;color:#E6B85C}
        .ck-bars{display:flex;flex-direction:column;gap:8px}
        .ck-bar{display:grid;grid-template-columns:38px 1fr 46px;align-items:center;gap:10px;font-size:15px;color:var(--text);font-variant-numeric:tabular-nums}
        .ck-bar .tr{height:10px;border-radius:5px;background:color-mix(in srgb,var(--text) 12%,transparent);overflow:hidden}
        .ck-bar .tr i{display:block;height:100%;background:#E6B85C;border-radius:5px}
        .ck-bar .pc{text-align:right}
        .ck-leit{display:flex;align-items:center;gap:12px;font-size:16px;color:var(--text)}
        .ck-leit>span:last-child{display:flex;flex-direction:column;gap:4px;line-height:1.3}
        .ck-leit b{color:#fff;font-size:26px;font-weight:800;line-height:1;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
        .ck-avs{display:inline-flex;flex:none}
        .ck-avs img{width:34px;height:34px;border-radius:50%;border:2px solid var(--bg-deep);margin-left:-10px;background:#333}
        .ck-avs img:first-child{margin-left:0}
        .ck-depo{margin:0;text-align:left}
        .ck-depo blockquote{font-family:var(--serif);font-style:italic;font-size:18px;line-height:1.4;color:#fff;quotes:"\\201C" "\\201D"}
        .ck-depo blockquote::before{content:open-quote;color:var(--bright)}
        .ck-depo blockquote::after{content:close-quote;color:var(--bright)}
        .ck-depo figcaption{margin-top:8px;font-family:var(--mono);font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--text)}
        .amostra{display:none;margin:0 0 18px;text-align:center}
        .amostra[hidden]{display:none!important}
        .am-k{display:block;font-family:var(--mono);font-size:13px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--text);margin-bottom:12px}
        .am-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        .am-row figure{margin:0}
        .am-row img{display:block;width:100%;height:auto;aspect-ratio:600/850;border-radius:3px;background:#fff;box-shadow:0 12px 28px rgba(0,0,0,.55)}
        .am-row figcaption{font-size:14px;color:var(--text);margin-top:9px;line-height:1.3}
        .saida{position:fixed;inset:0;z-index:9999;background:rgba(6,4,5,.82);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:24px}
        .saida-box{position:relative;width:100%;max-width:440px;background:var(--bg-deep);border:1px solid var(--hair-accent);border-radius:20px;padding:34px 24px 28px;text-align:center;outline:none;box-shadow:0 30px 70px rgba(0,0,0,.6)}
        .saida-x{position:absolute;top:6px;right:10px;width:44px;height:44px;background:none;border:0;color:var(--text);font-size:30px;line-height:1;cursor:pointer}
        .saida-kicker{font-family:var(--mono);font-size:13px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--bright);margin:0 0 12px}
        .saida-box h2{font-family:var(--serif);font-style:italic;font-weight:900;font-size:27px;line-height:1.18;color:#fff;margin:0 0 20px;letter-spacing:-.01em;text-wrap:balance}
        .saida-guia{display:flex;align-items:center;gap:16px;text-align:left;margin:0 0 18px}
        .saida-guia img{width:96px;height:128px;object-fit:cover;border-radius:3px 6px 6px 3px;box-shadow:0 12px 28px rgba(0,0,0,.55);flex:none}
        .saida-guia b{display:block;font-family:var(--serif);font-weight:700;font-size:20px;line-height:1.22;color:#fff;margin-bottom:6px}
        .saida-guia span{display:block;font-size:16px;line-height:1.45;color:var(--text);text-wrap:balance}
        .saida-preco{font-size:16px;color:var(--text);margin:0 0 20px}
        .saida-cta{display:block;width:100%;box-sizing:border-box;padding:17px 24px;border-radius:999px;background:var(--bright);color:#140408;font-weight:800;font-size:18px;text-decoration:none;box-shadow:0 5px 0 color-mix(in srgb,var(--bright) 55%,#000);transition:transform .15s ease,box-shadow .15s ease,filter .16s ease}
        .saida-cta:hover{filter:brightness(1.08)}
        .saida-cta:active{transform:translateY(3px);box-shadow:0 2px 0 color-mix(in srgb,var(--bright) 55%,#000)}
        .saida-fechar{margin-top:20px;padding:6px 8px;background:none;border:0;color:var(--text);font-family:var(--sans);font-size:16px;cursor:pointer;text-decoration:underline;text-underline-offset:4px}
        @media (max-width:480px){.saida{align-items:flex-end;padding:0}.saida-box{max-width:none;border-radius:20px 20px 0 0;padding:30px 20px calc(24px + env(safe-area-inset-bottom))}}
        /* tira e ordem do celular (col/11, molde do c4-20k/127 e 130): formulário na 1ª tela nos dois braços */
        .ck-tira{display:none}
        @media (max-width:639px){
          .ck-page{display:flex;flex-direction:column}
          .ck-tira{display:grid;grid-template-columns:56px 1fr;gap:14px;align-items:center;padding:10px 0 12px;order:1}
          .ck-tira-capa{display:block;width:56px}
          .ck-tira-capa img{display:block;width:100%;height:auto;aspect-ratio:3/4;object-fit:cover;border-radius:3px 5px 5px 3px;box-shadow:0 10px 22px rgba(0,0,0,.6)}
          .ck-tira-in{min-width:0}
          .ck-tira-kick{display:block;font-family:var(--mono);font-size:13px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--bright);line-height:1.3}
          .ck-tira-tit{display:block;font-family:var(--serif);font-style:italic;font-weight:900;font-size:22px;line-height:1.12;color:#fff;letter-spacing:-.01em;margin:3px 0 0;text-wrap:balance}
          .ck-box{order:2}
          .bumpcard{order:3;margin:18px 0 0}
          .amostra{order:4;margin:24px 0 0}
          .hd{order:5;margin:20px 0 0}
          .ck-prova{order:6;margin:20px 0 0}
          /* páginas do volume grandes o bastante pra ler: fileira que desliza, a 2ª página aparece pela metade */
          .am-row{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 -1.25rem;padding:4px 1.25rem 16px;scrollbar-width:none}
          .am-row::-webkit-scrollbar{display:none}
          .am-row figure{flex:0 0 62%;scroll-snap-align:center}
          /* nome do bump em duas linhas limpas: o ponto do meio some quando a linha quebra */
          .bsep{display:block;height:0;overflow:hidden;font-size:0}
          /* leitores numa linha só ao lado das carinhas */
          .ck-leit{gap:10px;font-size:15px}
          .ck-avs img{margin-left:-12px}
        }
        /* computador: a largura que sobra vira lateral (regra da casa de 24/09). Produto à esquerda, formulário e bump à direita,
           formulário dentro da 1ª tela. Entre 640 e 1023 px a página segue em coluna única, como antes. */
        @media (min-width:1024px){
          .ck-page{max-width:1180px;display:grid;grid-template-columns:minmax(0,1fr) 520px;column-gap:64px;align-items:start;padding:36px 28px 5rem}
          .ck-lado,.ck-pg{display:block;min-width:0}
          .ck-lado{grid-column:1;grid-row:1}
          .ck-pg{grid-column:2;grid-row:1}
          .hd{margin:0 0 26px}
          .hd-cena{padding-top:0}
          .hd-solo{--h:300px}
          .amostra{margin:0 0 26px}
          .ck-prova{margin:0}
        }
        .ck-foot{padding:2.5rem 1.5rem;text-align:center;border-top:1px solid var(--hair);background:var(--bg-deep)}
        .ck-foot p{font-family:var(--serif);font-style:italic;font-size:1rem;color:var(--sage)}
      `}</style>
    </>
  );
}
