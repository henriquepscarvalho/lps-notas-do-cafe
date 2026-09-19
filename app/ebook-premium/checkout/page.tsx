"use client";

import { useEffect, useState } from "react";
import PageBeacon, { sendBeacon } from "../../PageBeacon";
import LpWidgets from "../../LpWidgets";
import ExitIntent from "./ExitIntent";
import PROVA from "../../../checkout-prova.json";
import MANIFEST from "../../../proof-manifest.json";

/* ============================================================
   TOKENS DA NEWS (a fábrica troca por news; layout idêntico nas 30)
   ============================================================ */
const EBOOK = {
  "slug": "notas-do-cafe",
  "news": "Notas do Café",
  "capa": "/ebook-web/capa-notas-do-cafe.webp",
  "capaAlt": "Capa do guia Café de Balcão no Coador de Casa",
  "titulo": "Café de Balcão no Coador de Casa",
  "kicker": "Guia Notas do Café",
  "preco": "R$ 27",
  "resumo": "Guia completo, web + PDF.",
  "garantiaNome": "7 dias de garantia.",
  // riscado removido junto com a âncora da LP D (critique 01/09): sem base
  // declarada; o render já é condicional, token vazio = sem <s>
  "precoDe": "",
  "app": {
    "capa": "/app-ouro/telas/NC/capa-app.webp",
    "capaAlt": "Capa do app do guia Café de Balcão no Coador de Casa",
    "preco": "R$ 48,50",
    "de": "R$ 97",
    "linhas": [
      "O guia inteiro no celular, pronto pra abrir em qualquer fila.",
      "Destaques e notas que ficam guardados no seu exemplar.",
      "Plano de leitura que marca onde você parou e o que falta."
    ],
    "nota": "Metade do preço, só neste pedido. Abre no celular e no computador, sem instalar nada."
  },
  "despedida": "Bom café. Até sábado."
};

/* Checkout B (c4-20k/54, HC 11/09/26, rec + dois prints rabiscados):
   acima do formulário só capa, kicker e título (a linha do resumo com preço e a
   faixa de confiança saíram: o formulário da Stripe já mostra preço, Pix, cartão
   e boleto), e o reforço, o que o A não tinha (B2, escolhido em teste contra o B
   com o reforço abaixo do bump). Abaixo do formulário só o bump:
   1. Nota dos leitores no método Amazon: média com uma casa, estrelas
      preenchidas na proporção e barras por estrela; leitores ativos com as
      carinhas do `proof-manifest.json` da casa. Tudo de `checkout-prova.json`,
      gravado no build por `prova_checkout.py` a partir do Pharos; a página
      nunca carrega número na mão e arredonda pra baixo.
   2. Voto real de leitor da news (edition_votes, curadoria do HC por casa),
      reconhecível por quem chega frio; zero personagem do guia.
   "Você leva", "Pix ou cartão" e a contagem de edições saíram por decisão do HC. */
const AVATARES = (MANIFEST.avatares || []).slice(0, 5);

/* Dois splits, um por fator, sorteados por visitante e independentes (2 x 2). A é
   sempre o controle e B a variante (convenção do HC, 11/09/26):
   EXP-058 cabeçalho: A = imersivo (a arte da própria capa sangra na largura, chip,
   título e sub à esquerda sobre o degradê); B = capa em 104 px à esquerda, chip,
   título e sub à direita, sem fundo.
   EXP-059 posição do bump: A = depois do formulário (hoje); B = antes, logo abaixo
   da avaliação. Sorteio 50/50 no localStorage pra pessoa ver sempre o mesmo; os
   braços viajam no create-session (`checkout_variant: "hA-bB"`) e a leitura é por
   session na metadata, cada fator somando os dois braços do outro.
   Chaves ligadas em 12/09/26 (EXP-058 e EXP-059 registradas no Probatorium, HC 12/09):
   o beacon `ck-split-hX-bY` carimba o braço na jornada (1 por sessão) e a leitura cruza
   com ebook_purchases pelo journey_id. Desligar = trocar pra false e subir: todo mundo
   volta a ver A + A e o carimbo sai "golden". */
const SPLIT = { cabecalho: true, bump: true };
let sorteioOk = true; // false quando o localStorage falhou: a jornada sai como "ck-split-x" e não conta
type Braco = "A" | "B";
const HERO = {
  arte: "/ebook-web/capa-arte-notas-do-cafe.webp", // recorte da capa sem texto (1200 × 713), c4-20k/55
  sub: "O coador de papel da sua cozinha repete a xícara do balcão, sem a máquina de R$ 2 mil.",
};
function sorteia(chave: "ck_h" | "ck_b", ligado: boolean): Braco {
  if (!ligado) return "A";
  try {
    const v = localStorage.getItem(chave);
    if (v === "A" || v === "B") return v;
    const b: Braco = Math.random() < 0.5 ? "A" : "B";
    localStorage.setItem(chave, b);
    return b;
  } catch {
    sorteioOk = false;
    return "A";
  }
}

const PK = process.env.NEXT_PUBLIC_STRIPE_PK;

type CheckoutHandle = { mount: (sel: string) => void; destroy: () => void };
type StripeJs = {
  initEmbeddedCheckout: (opts: { fetchClientSecret: () => Promise<string> }) => Promise<CheckoutHandle>;
};
declare global {
  interface Window {
    Stripe?: (pk: string) => StripeJs;
  }
}

/* Lê a jornada que o PageBeacon abriu na primeira página. Best-effort: modo privado
   ou storage bloqueado devolve vazio e o checkout segue igual, só sem atribuição. */
function jornada() {
  try {
    return {
      journey: sessionStorage.getItem("vdn_journey") || "",
      src: sessionStorage.getItem("vdn_source") || "",
      // onda mensal (c4-20k/11): janela de 24h a R$ 13,50, carimbada pelo PageBeacon
      oferta: sessionStorage.getItem("vdn_oferta") || "",
      ate: sessionStorage.getItem("vdn_ate") || "",
    };
  } catch {
    return { journey: "", src: "", oferta: "", ate: "" };
  }
}

export default function EbookCheckout() {
  // Bump = o app do próprio guia pela metade (c4-20k/20, HC 04/09): a rota recebe
  // `bump: "app"`; o guia irmão a R$ 13,50 saiu do checkout e vive na Escada.
  const [bump, setBump] = useState(false);
  // c4-20k/11 (onda, R$ 13,50): o preço real é da rota e aparece no formulário da
  // Stripe; o cabeçalho do B não repete preço nenhum.
  const [braco, setBraco] = useState<Braco | null>(null); // null até o sorteio: sem piscar de um braço pro outro
  const [pos, setPos] = useState<Braco>("A"); // A = bump depois do formulário, B = antes
  useEffect(() => {
    const h = sorteia("ck_h", SPLIT.cabecalho);
    const b = sorteia("ck_b", SPLIT.bump);
    setBraco(h);
    setPos(b);
    // EXP-058/059: o braço sorteado viaja na jornada (lp_page_views, 1 beacon por sessão,
    // mesmo journey_id da compra). Storage bloqueado = "ck-split-x", fora da leitura.
    if (SPLIT.cabecalho || SPLIT.bump) sendBeacon(EBOOK.slug, sorteioOk ? `ck-split-h${h}-b${b}` : "ck-split-x");
  }, []);
  const [stripeOk, setStripeOk] = useState(false);
  const [montado, setMontado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // carrega o stripe.js por script tag (zero dependência npm, igual nos 30 repos)
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
    setMontado(false); // trocar o bump remonta a session: o esqueleto volta junto
    window
      .Stripe(PK)
      .initEmbeddedCheckout({
        fetchClientSecret: () =>
          fetch("/api/create-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // jornada e origem viajam com a compra: sem isso a venda chega no Supabase
            // sem saber por qual caminho (teste, VSL direta, LP) nem por qual canal ela
            // veio, e a receita por caminho fica só no piso do beacon da /obrigado.
            // sessionStorage é onde o PageBeacon guarda os dois desde a 1ª página.
            // `checkout_variant` (c4-20k/55): o braço da série temporal viaja na metadata
            // da session pra separar A e B por jornada no rio do C4.
            body: JSON.stringify({
              bump: bump ? "app" : false,
              // "golden" = sem split; "hA-bB" etc. quando as chaves ligam (h = cabeçalho, b = bump)
              checkout_variant: SPLIT.cabecalho || SPLIT.bump ? `h${braco}-b${pos}` : "golden",
              ...jornada(),
            }),
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

  const configurado = Boolean(PK);
  const depo = PROVA.depoimento;

  /* Card do bump "Você leva os dois" (F do protótipo do 54, HC 11/09): a capa do guia, o
     sinal de mais e o celular lado a lado, nome, preço e a barra de marcar. Posição
     decidida por `pos` (EXP-059): A depois do formulário (hoje), B antes dele. */
  const bumpCard = (
    <section className={`bumpcard${bump ? " on" : ""}${pos === "B" ? " antes" : ""}`}>
      <span className="btag">Adicione ao pedido</span>
      <div className="bpar">
        <span className="bcapa"><img src={EBOOK.capa} alt="" width={78} height={104} loading="lazy" /></span>
        <span className="bmais" aria-hidden="true">+</span>
        <span className="bfone" aria-hidden="true">
          <img src={EBOOK.app.capa} alt={EBOOK.app.capaAlt} width={390} height={844} loading="lazy" />
        </span>
      </div>
      <div className="bleg"><span>o guia</span><span>o app</span></div>
      <span className="bnome">O app do guia pela metade</span>
      <span className="bpreco"><s>{EBOOK.app.de}</s> {EBOOK.app.preco}</span>
      <ul className="blista">
        {EBOOK.app.linhas.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      <label htmlFor="bump" className="bbar">
        <input id="bump" type="checkbox" checked={bump} onChange={(e) => setBump(e.target.checked)} />
        <span className="bx" aria-hidden="true">{bump ? "✓" : ""}</span>
        <span>Levar os dois</span>
      </label>
    </section>
  );

  return (
    <>
      <PageBeacon slug={EBOOK.slug} step="ebook-premium-checkout" source="ebook-premium" />
      {/* saída do checkout (c4-20k/40): capítulo 1 na versão web, uma vez por sessão, só no gesto de sair */}
      <ExitIntent slug={EBOOK.slug} titulo={EBOOK.titulo} />

      <nav>
        <div className="wrap nav-inner">
          <a href="/" className="brand" aria-label="Home">
            <img src="/ebook-web/simbolo.png" alt="" width={32} height={32} />
            <span className="wm"><span className="t">Notas</span><span className="s">{" do Café"}</span></span>
          </a>
          {/* HC 11/09: sem "voltar pro guia"; quem quer voltar, volta sozinho */}
        </div>
      </nav>

      <main className="ck-page">
        {/* cabeçalho na largura, não na altura (HC 11/09): A imersivo (controle), B capa ao lado */}
        {braco === "B" ? (
          <header className="hd hd-split">
            <span className="hd-capa">
              <span className="ck-lomb" aria-hidden="true" />
              <img src={EBOOK.capa} alt={EBOOK.capaAlt} />
            </span>
            <div className="hd-in">
              <span className="hd-chip">{EBOOK.kicker}</span>
              <h1 className="hd-h1">{EBOOK.titulo}</h1>
              <p className="hd-sub">{HERO.sub}</p>
            </div>
          </header>
        ) : (
          <header className={`hd hd-bleed${braco ? "" : " hd-sorteando"}`} style={{ "--img": `url(${HERO.arte})` } as React.CSSProperties}>
            <div className="hd-in">
              <span className="hd-chip">{EBOOK.kicker}</span>
              <h1 className="hd-h1">{EBOOK.titulo}</h1>
              <p className="hd-sub">{HERO.sub}</p>
            </div>
          </header>
        )}

        {/* reforço antes do formulário (HC 11/09 23:05, B2 testado contra o B e escolhido):
            nota no método Amazon + leitores da casa + um voto real. Some inteiro em casa
            sem lastro (piso: 1.000 leitores, 50 votos), em vez de mostrar número fraco. */}
        {PROVA.exibir && PROVA.exibir_nota && (
          <section className="ck-prova" aria-label={`O que os leitores da ${EBOOK.news} dizem`}>
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

        {pos === "B" && bumpCard}

        <div className={`ck-box${configurado && !montado && !erro ? " carregando" : ""}`}>
          {configurado ? (
            <>
              <div id="checkout-box" />
              {/* Esqueleto por cima do container enquanto o embedded checkout monta:
                  sem ele a caixa branca fica vazia até a Stripe pintar (medido: 0,7 a
                  1,7 s), e a sessão média no checkout é de 19 s (Clarity, ago/26). */}
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

        {pos === "A" && bumpCard}


      </main>

      <footer className="ck-foot">
        <p>{EBOOK.despedida}</p>
      </footer>

      {/* chat de dúvidas também no checkout (HC 19/09/26): só o chat, sem prova nem botão de compra */}
      <LpWidgets slug={EBOOK.slug} produto="ebook" local="checkout" cor="var(--bright)" corTexto="#140B04" />

      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
:root{--bg:#0F0E0D;--bg-deep:#120B06;--text:#CFCBC8;--text-dim:#8E8986;--sage:#94908E;--hair:rgba(207,203,200,.12);--hair-accent:rgba(225,114,35,.30);--bright:#E17223;--serif:"Playfair Display",Georgia,serif;--sans:"Inter",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,monospace}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--sans);background:var(--bg);color:var(--text);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
nav{position:sticky;top:0;z-index:50;background:rgba(15,13,14,.82);backdrop-filter:saturate(140%) blur(8px);-webkit-backdrop-filter:saturate(140%) blur(8px);border-bottom:1px solid var(--hair)}
a{color:inherit;text-decoration:none}
.wrap{width:100%;max-width:1140px;margin:0 auto;padding:0 28px}
.nav-inner{display:flex;align-items:center;justify-content:center;height:66px} /* HC 11/09: marca centrada, sem link de voltar */
.brand{display:flex;align-items:center;gap:11px}
.brand img{width:32px;height:32px}
.wm{font-weight:700;font-size:20px;letter-spacing:-.02em}
.wm .t{color:var(--bright)}.wm .s{color:#fff}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:var(--sans);font-weight:600;font-size:15px;padding:12px 22px;border-radius:6px;border:0;cursor:pointer;background:var(--bright);color:#140408;transition:transform .16s ease,background .16s ease;letter-spacing:-.01em;white-space:nowrap}
.btn:hover{background:#CF8D9F;transform:translateY(-1px)}
.kicker{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.24em;text-transform:uppercase;color:var(--bright)}

        .ck-page{max-width:560px;margin:0 auto;padding:0 1.25rem 4rem}
        .ck-lomb{position:absolute;top:2%;bottom:2%;left:-5px;width:6px;border-radius:4px 0 0 4px;background:linear-gradient(90deg,rgba(0,0,0,.85),rgba(255,255,255,.10))}
        /* cabeçalho: dois braços (A = imersivo, arte da capa sangrada; B = capa à esquerda) */
        .hd{margin:0 0 18px}
        .hd-chip{display:inline-block;font-family:var(--mono);font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--bright);border:1px solid var(--hair-accent);border-radius:99px;padding:5px 10px;background:rgba(15,13,14,.45);margin-bottom:12px}
        .hd-h1{font-family:var(--serif);font-style:italic;font-weight:900;font-size:clamp(2rem,8.8vw,2.7rem);line-height:1.08;color:#fff;letter-spacing:-.02em;margin:0 0 10px;text-wrap:balance}
        .hd-sub{font-size:14.5px;line-height:1.5;color:var(--text);max-width:34ch;margin:0}
        .hd-bleed{position:relative;margin-left:-1.25rem;margin-right:-1.25rem;min-height:300px;display:flex;align-items:flex-end;background:var(--img) center 30%/cover no-repeat,var(--bg-deep);isolation:isolate}
        .hd-bleed::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,13,14,0) 0%,rgba(15,13,14,.22) 40%,rgba(15,13,14,.78) 72%,rgba(15,13,14,.97) 100%);z-index:0}
        .hd-bleed .hd-in{position:relative;z-index:1;padding:110px 1.25rem 18px}
        .hd-sorteando{background:var(--bg-deep)} /* antes do sorteio: a caixa sem a imagem, pra não piscar do a pro c */
        .hd-sorteando .hd-in{visibility:hidden}
        @media (min-width:640px){.hd-bleed{border-radius:0 0 18px 18px}}
        .hd-split{display:grid;grid-template-columns:104px 1fr;gap:16px;align-items:center;padding:22px 0 6px}
        .hd-capa{position:relative;display:block;width:104px}
        .hd-capa img{display:block;width:100%;height:auto;border-radius:6px;box-shadow:0 18px 40px rgba(0,0,0,.6),0 0 50px rgba(200,125,146,.14)}
        .hd-split .hd-h1{font-size:clamp(1.7rem,7.2vw,2.2rem)}
        .hd-split .hd-sub{font-size:13.5px}
        .hd-split .hd-chip{font-size:9px;letter-spacing:.1em;padding:4px 8px;white-space:nowrap}
        .ck-box{position:relative;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.5),0 0 60px rgba(200,125,146,.10);min-height:120px}
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
        .bumpcard.antes{margin:0 0 16px}
        .bumpcard.on{border-color:var(--bright);background:rgba(200,125,146,.07)}
        .bumpcard input{position:absolute;opacity:0;width:0;height:0}
        .btag{font-family:var(--mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--bright)}
        .bpar{display:flex;align-items:center;justify-content:center;gap:12px;margin:10px 0 4px}
        .bcapa{display:block;width:78px}
        .bcapa img{display:block;width:100%;height:auto;border-radius:5px;box-shadow:0 14px 30px rgba(0,0,0,.6)}
        .bmais{font-family:var(--serif);font-size:26px;color:var(--bright)}
        .bfone{display:block;width:74px;aspect-ratio:390/844;padding:2%;border-radius:9.5% / 4.4%;background:#0b0b0b;box-shadow:0 18px 30px -14px rgba(0,0,0,.85),inset 0 0 0 2px #2a2a2a}
        .bfone img{display:block;width:100%;height:100%;object-fit:cover;object-position:top;border-radius:7.5% / 3.5%}
        .bleg{display:flex;gap:56px;font-family:var(--mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--text-dim);margin-bottom:6px}
        .bnome{display:block;font-family:var(--serif);font-weight:700;font-size:16.5px;color:#fff;margin:6px 0 4px}
        .bpreco{display:block;font-size:14px;font-weight:700;color:var(--bright)}
        .bpreco s{color:var(--text-dim);font-weight:400;margin-right:4px}
        .blista{list-style:none;margin:8px 0;padding:0;display:flex;flex-direction:column;gap:4px;text-align:left;width:100%}
        .blista li{font-size:13.5px;color:var(--text);line-height:1.5;padding-left:14px;position:relative}
        .blista li::before{content:"✓";position:absolute;left:0;top:0;font-size:11px;font-weight:700;color:var(--bright)}
        .bbar{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;margin-top:8px;padding:12px;border:1.5px solid var(--bright);border-radius:8px;color:#fff;font-weight:600;font-size:14.5px;cursor:pointer}
        .bumpcard.on .bbar{background:rgba(200,125,146,.14)}
        .bx{width:22px;height:22px;border-radius:6px;border:2px solid var(--bright);display:inline-flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#140408;flex:none;transition:background .2s ease}
        .bumpcard.on .bx{background:var(--bright)}
        /* reforço abaixo do bump: nota (método Amazon), leitores, voto */
        .ck-prova{margin:0 0 16px;padding:14px 16px;border:1px solid var(--hair);border-radius:14px;background:var(--bg-deep);display:flex;flex-direction:column;gap:12px}
        .ck-media{display:flex;align-items:center;gap:12px}
        .ck-media>b{font-family:var(--serif);font-size:40px;line-height:1;color:#fff;font-variant-numeric:tabular-nums}
        .ck-media>div{display:flex;flex-direction:column;gap:3px}
        .ck-media small{font-size:12px;color:var(--text-dim)}
        .ck-stars{position:relative;display:inline-block;font-size:20px;line-height:1;letter-spacing:1px}
        .ck-stars .st-b{color:rgba(207,200,202,.22)}
        .ck-stars .st-f{position:absolute;left:0;top:0;width:var(--f,100%);overflow:hidden;white-space:nowrap;color:#E6B85C}
        .ck-bars{display:flex;flex-direction:column;gap:5px}
        .ck-bar{display:grid;grid-template-columns:30px 1fr 34px;align-items:center;gap:8px;font-size:12px;color:var(--text-dim);font-variant-numeric:tabular-nums}
        .ck-bar .tr{height:8px;border-radius:4px;background:rgba(207,200,202,.12);overflow:hidden}
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
