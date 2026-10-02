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
  "preco": "R$ 47",
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
/* c420/153 (HC 02/10/26): EXP-058 e EXP-059 fechadas como inconclusivas, o controle fica (A + A: cabeçalho
   imersivo, bump depois do formulário). Chaves desligadas; o carimbo da session passa a ser o desenho. */
const SPLIT = { cabecalho: false, bump: false };
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

/* LEGIVEL: o valor em reais nunca quebra de linha entre o "R$" e o número */
const nb = (t: string) => t.replace(/R\$ (?=\d)/g, "R$\u00a0");

/* c420/153 (HC 02/10/26): o desenho que a pessoa viu viaja na session como `checkout_variant`:
   "cel" (até 639 px), "1col" (640 a 1.023), "2col" (1.024 a 1.279) e "3col" (1.280 px ou mais).
   É por ele que a leitura de D+28 separa a receita por checkout das 3 colunas. */
function desenho(): "cel" | "1col" | "2col" | "3col" {
  try {
    const m = (q: string) => window.matchMedia(q).matches;
    return m("(max-width: 639px)") ? "cel" : m("(min-width: 1280px)") ? "3col" : m("(min-width: 1024px)") ? "2col" : "1col";
  } catch {
    return "2col";
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
  // c4-20k/127 (HC 23/09): abaixo de 640 px não há sorteio. O celular vê sempre a ordem fixa
  // (tira, formulário, bump, imagem, nota) e sai do 2 x 2 dos EXP-058/059, que passam a ler
  // só no desktop. O beacon "ck-split-cel" fica fora das celas do leitor.
  const [celular, setCelular] = useState(false);
  useEffect(() => {
    const cel = window.matchMedia("(max-width: 639px)").matches;
    setCelular(cel);
    const h: Braco = cel ? "A" : sorteia("ck_h", SPLIT.cabecalho);
    const b: Braco = cel ? "A" : sorteia("ck_b", SPLIT.bump);
    setBraco(h);
    setPos(b);
    // EXP-058/059: o braço sorteado viaja na jornada (lp_page_views, 1 beacon por sessão,
    // mesmo journey_id da compra). Storage bloqueado = "ck-split-x", fora da leitura.
    if (SPLIT.cabecalho || SPLIT.bump) sendBeacon(EBOOK.slug, cel ? "ck-split-cel" : sorteioOk ? `ck-split-h${h}-b${b}` : "ck-split-x");
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
              // sem split, o carimbo é o desenho da tela ("cel", "1col", "2col", "3col"); "hA-bB" etc. se as chaves ligarem
              checkout_variant: celular ? "cel" : SPLIT.cabecalho || SPLIT.bump ? `h${braco}-b${pos}` : desenho(),
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
          <li key={l}>{nb(l)}</li>
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

      <main className="ck-page" data-legivel="1">{/* LEGIVEL (col/32) */}
        {/* c4-20k/127: no celular a tira (capa, kicker, título e a nota numa linha) abre a página e o
            formulário da Stripe vem logo abaixo, dentro da 1ª tela; acima de 640 px a tira some. */}
        <div className="ck-tira">
          <span className="ck-tira-capa"><span className="ck-lomb" aria-hidden="true" /><img src={EBOOK.capa} alt={EBOOK.capaAlt} width={44} height={59} /></span>
          <div className="ck-tira-in">
            <span className="ck-tira-kick">{EBOOK.kicker}</span>
            <span className="ck-tira-tit">{EBOOK.titulo}</span>
            {PROVA.exibir && PROVA.exibir_nota && (
              <span className="ck-tira-nota"><b>{PROVA.media_exibido}</b><span className="ck-stars" style={{ "--f": `${PROVA.media_pct}%` } as React.CSSProperties} aria-label={`${PROVA.media_exibido} de 5`}><span className="st-b" aria-hidden="true">★★★★★</span><span className="st-f" aria-hidden="true">★★★★★</span></span><span>{PROVA.votos} votos</span></span>
            )}
          </div>
        </div>
        <div className="ck-lado">
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
              <p className="hd-sub">{nb(HERO.sub)}</p>
            </div>
          </header>
        ) : (
          <header className={`hd hd-bleed${braco ? "" : " hd-sorteando"}`} style={{ "--img": `url(${HERO.arte})` } as React.CSSProperties}>
            <div className="hd-in">
              <span className="hd-chip">{EBOOK.kicker}</span>
              <h1 className="hd-h1">{EBOOK.titulo}</h1>
              <p className="hd-sub">{nb(HERO.sub)}</p>
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

        </div>
        <div className="ck-pg">
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
        </div>


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
.kicker{font-family:var(--mono);font-size:13px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--bright)}

        .ck-page{max-width:560px;margin:0 auto;padding:0 1.25rem 4rem}
        .ck-lado,.ck-pg{display:contents}
        .ck-lomb{position:absolute;top:2%;bottom:2%;left:-5px;width:6px;border-radius:4px 0 0 4px;background:linear-gradient(90deg,rgba(0,0,0,.85),rgba(255,255,255,.10))}
        /* cabeçalho: dois braços (A = imersivo, arte da capa sangrada; B = capa à esquerda) */
        .hd{margin:0 0 18px}
        .hd-chip{display:inline-block;font-family:var(--mono);font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:var(--bright);border:1px solid var(--hair-accent);border-radius:99px;padding:7px 14px;background:rgba(15,13,14,.45);margin-bottom:14px;font-weight:500}
        .hd-h1{font-family:var(--serif);font-style:italic;font-weight:900;font-size:clamp(2.15rem,9.4vw,3rem);line-height:1.08;color:#fff;letter-spacing:-.02em;margin:0 0 10px;text-wrap:balance}
        .hd-sub{font-size:16px;line-height:1.5;color:var(--text);max-width:36ch;margin:0;text-wrap:pretty}
        .hd-bleed{position:relative;margin-left:-1.25rem;margin-right:-1.25rem;min-height:300px;display:flex;align-items:flex-end;background:var(--img) center 30%/cover no-repeat,var(--bg-deep);isolation:isolate}
        .hd-bleed::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,13,14,0) 0%,rgba(15,13,14,.22) 40%,rgba(15,13,14,.78) 72%,rgba(15,13,14,.97) 100%);z-index:0}
        .hd-bleed .hd-in{position:relative;z-index:1;padding:110px 1.25rem 18px}
        .hd-sorteando{background:var(--bg-deep)} /* antes do sorteio: a caixa sem a imagem, pra não piscar do a pro c */
        .hd-sorteando .hd-in{visibility:hidden}
        @media (min-width:640px){.hd-bleed{border-radius:0 0 18px 18px}}
        .hd-split{display:grid;grid-template-columns:132px 1fr;gap:20px;align-items:center;padding:22px 0 6px}
        .hd-capa{position:relative;display:block;width:132px}
        .hd-capa img{display:block;width:100%;height:auto;border-radius:6px;box-shadow:0 18px 40px rgba(0,0,0,.6),0 0 50px rgba(200,125,146,.14)}
        .hd-split .hd-h1{font-size:clamp(1.9rem,7.6vw,2.4rem)}
        .hd-split .hd-sub{font-size:15px}
        .hd-split .hd-chip{font-size:13px;letter-spacing:.08em;padding:6px 12px;white-space:nowrap}
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
        .ck-pend p{font-size:16px;line-height:1.6;margin:0 0 .5rem}
        .ck-pend b{color:#0D0F0E}
        .bumpcard{margin-top:18px;padding:24px 20px;border:1px solid var(--hair);border-radius:16px;background:var(--bg-deep);text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px;transition:border-color .2s ease,background .2s ease}
        .bumpcard.antes{margin:0 0 16px}
        .bumpcard.on{border-color:var(--bright);background:rgba(200,125,146,.07)}
        .bumpcard input{position:absolute;opacity:0;width:0;height:0}
        .btag{font-family:var(--mono);font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:var(--bright);font-weight:500}
        .bpar{display:flex;align-items:center;justify-content:center;gap:14px;margin:16px 0 8px}
        .bcapa{display:block;width:124px}
        .bcapa img{display:block;width:100%;height:auto;border-radius:5px;box-shadow:0 14px 30px rgba(0,0,0,.6)}
        .bmais{font-family:var(--serif);font-size:30px;color:var(--bright);width:18px;text-align:center}
        .bfone{display:block;width:118px;aspect-ratio:390/844;padding:2%;border-radius:9.5% / 4.4%;background:#0b0b0b;box-shadow:0 18px 30px -14px rgba(0,0,0,.85),inset 0 0 0 2px #2a2a2a}
        .bfone img{display:block;width:100%;height:100%;object-fit:cover;object-position:top;border-radius:7.5% / 3.5%}
        .bleg{display:grid;font-family:var(--mono);font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--text);margin-bottom:10px;grid-template-columns:124px 118px;column-gap:46px;text-align:center}
        .bnome{display:block;font-family:var(--serif);font-weight:700;font-size:22px;color:#fff;margin:8px 0 6px;line-height:1.2;text-wrap:balance}
        .bpreco{display:flex;font-size:34px;font-weight:800;color:#fff;align-items:baseline;justify-content:center;gap:10px;line-height:1;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
        .bpreco s{color:var(--text-dim);font-weight:500;font-size:19px;margin:0;letter-spacing:0}
        .blista{list-style:none;margin:16px 0 4px;padding:0;display:flex;flex-direction:column;gap:9px;text-align:left;width:100%}
        .blista li{font-size:16px;color:var(--text);line-height:1.45;padding-left:26px;position:relative}
        .blista li::before{content:"✓";position:absolute;left:0;top:0;font-size:16px;font-weight:700;color:var(--bright)}
        .bbar{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;margin-top:18px;padding:14px 20px;border:0;border-radius:999px;color:#140408;font-weight:800;font-size:18px;cursor:pointer;min-height:60px;background:var(--bright);letter-spacing:.01em;user-select:none;box-shadow:0 5px 0 color-mix(in srgb,var(--bright) 55%,#000);transition:transform .15s ease,box-shadow .15s ease,filter .15s ease}
        .bumpcard.on .bbar{background:var(--bright);transform:translateY(3px);box-shadow:0 2px 0 color-mix(in srgb,var(--bright) 55%,#000)}
        .bbar:hover{filter:brightness(1.06)}
        .bbar:active{transform:translateY(3px);box-shadow:0 2px 0 color-mix(in srgb,var(--bright) 55%,#000)}
        .bbar:has(input:focus-visible){outline:3px solid #fff;outline-offset:4px}
        .bx{width:28px;height:28px;border-radius:8px;border:2px solid #140408;display:inline-flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#fff;flex:none;transition:background .2s ease;background:#fff}
        .bumpcard.on .bx{background:#140408}
        /* reforço abaixo do bump: nota (método Amazon), leitores, voto */
        .ck-prova{margin:0 0 16px;padding:20px 18px;border:1px solid var(--hair);border-radius:16px;background:var(--bg-deep);display:flex;flex-direction:column;gap:16px}
        .ck-media{display:flex;align-items:center;gap:14px}
        .ck-media>b{font-family:var(--serif);font-size:60px;line-height:.95;color:#fff;font-variant-numeric:tabular-nums}
        .ck-media>div{display:flex;flex-direction:column;gap:5px}
        .ck-media small{font-size:15px;color:var(--text)}
        .ck-stars{position:relative;display:inline-block;font-size:27px;line-height:1;letter-spacing:2px}
        .ck-stars .st-b{color:rgba(207,200,202,.22)}
        .ck-stars .st-f{position:absolute;left:0;top:0;width:var(--f,100%);overflow:hidden;white-space:nowrap;color:#E6B85C}
        .ck-bars{display:flex;flex-direction:column;gap:8px}
        .ck-bar{display:grid;grid-template-columns:38px 1fr 46px;align-items:center;gap:10px;font-size:15px;color:var(--text);font-variant-numeric:tabular-nums}
        .ck-bar .tr{height:10px;border-radius:5px;background:rgba(207,200,202,.12);overflow:hidden}
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
        /* tira e ordem do celular (c4-20k/127, HC 23/09): formulário na 1ª tela; desktop segue como está */
        .ck-tira{display:none}
        @media (max-width:639px){
          .ck-page{display:flex;flex-direction:column}
          .ck-tira{display:grid;grid-template-columns:56px 1fr;gap:14px;align-items:center;padding:10px 0 12px;order:1}
          .ck-tira-capa{position:relative;display:block;width:56px}
          .ck-tira-capa img{display:block;width:100%;height:auto;border-radius:4px;box-shadow:0 10px 22px rgba(0,0,0,.6)}
          .ck-tira-in{min-width:0}
          .ck-tira-kick{display:block;font-family:var(--mono);font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--bright);line-height:1.3;font-weight:500}
          .ck-tira-tit{display:block;font-family:var(--serif);font-style:italic;font-weight:900;font-size:22px;line-height:1.12;color:#fff;letter-spacing:-.01em;margin:3px 0 4px;text-wrap:balance}
          .ck-tira-nota{display:flex;align-items:center;gap:7px;font-size:14px;color:var(--text);line-height:1}
          .ck-tira-nota b{color:#fff;font-family:var(--serif);font-size:17px}
          .ck-tira-nota .ck-stars{font-size:16px;letter-spacing:.5px}
          .ck-box{order:2}
          .bumpcard{order:3;margin:18px 0 0}
          .hd{order:4;margin:20px 0 0}
          .hd-bleed{margin:18px -1.25rem 0;border-radius:18px 18px 0 0}
          .ck-prova{order:5;margin:20px 0 0}
          .ck-leit{gap:10px;font-size:15px}
          .ck-avs img{margin-left:-12px}
        }
        /* computador: a largura que sobra vira lateral. Produto e prova à esquerda, formulário e bump à direita,
           formulário dentro da 1ª tela. Entre 640 e 1023 px a página segue em coluna única, como antes. */
        @media (min-width:1024px){
          .ck-page{max-width:1180px;display:grid;grid-template-columns:minmax(0,1fr) 520px;column-gap:64px;align-items:start;padding:36px 28px 5rem}
          .ck-lado,.ck-pg{display:block;min-width:0}
          .ck-lado{grid-column:1;grid-row:1}
          .ck-pg{grid-column:2;grid-row:1}
          .hd{margin:0 0 26px}
          .ck-prova{margin:0}
          .bumpcard.antes{margin:0 0 18px}
          /* a arte entra maior que a caixa e ancorada embaixo: a borda de cima do arquivo (resto do texto da capa) fica fora */
          .hd-bleed{margin-left:0;margin-right:0;border-radius:18px;min-height:340px;background-size:auto 122%,auto;background-position:center 80%,0 0}
          .hd-bleed .hd-in{padding:130px 28px 26px}
        }
        /* c420/153 (HC 02/10/26): a partir de 1.280 px, três colunas numa visão só: produto e prova | formulário | bump.
           Entre 1.024 e 1.279 px seguem as duas colunas; abaixo de 640 px, a ordem do celular (c4-20k/127). O bump
           encolhe na coluna estreita pra barra «Levar os dois» caber na 1ª tela (texto nunca abaixo de 13 px). */
        @media (min-width:1280px){
          .ck-page{max-width:1360px;grid-template-columns:minmax(300px,1.1fr) minmax(440px,1.5fr) minmax(300px,1.1fr);column-gap:36px}
          .ck-pg{display:contents}
          .ck-box{grid-column:2;grid-row:1}
          .bumpcard,.bumpcard.antes{grid-column:3;grid-row:1;margin:0;padding:18px 16px}
          .hd-h1{font-size:2.3rem}
          .hd-bleed{min-height:300px}
          .hd-bleed .hd-in{padding:110px 22px 22px}
          .bpar{gap:10px;margin:10px 0 6px}
          .bcapa{width:92px}
          .bfone{width:84px}
          .bmais{font-size:26px}
          .bleg{grid-template-columns:92px 84px;column-gap:38px;margin-bottom:4px}
          .bnome{font-size:20px;margin:6px 0 4px}
          .bpreco{font-size:30px}
          .bpreco s{font-size:17px}
          .blista{margin:12px 0 2px;gap:7px}
          .blista li{font-size:15px;line-height:1.4}
          .bbar{margin-top:14px}
        }
        /* tela baixa (notebook de 768 px): o bump aperta mais um degrau pra barra seguir na 1ª tela */
        @media (min-width:1280px) and (max-height:779px){
          .bumpcard,.bumpcard.antes{padding:14px 16px}
          .bpar{margin:8px 0 4px}
          .bcapa{width:80px}
          .bfone{width:72px}
          .bleg{grid-template-columns:80px 72px}
          .blista{margin:10px 0 0;gap:5px}
          .bbar{margin-top:12px}
        }
        .ck-foot{padding:2.5rem 1.5rem;text-align:center;border-top:1px solid var(--hair);background:var(--bg-deep)}
        .ck-foot p{font-family:var(--serif);font-style:italic;font-size:1rem;color:var(--sage)}
      `}</style>
    </>
  );
}
