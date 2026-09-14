"use client";

import { useEffect, useRef, useState } from "react";
import PageBeacon, { sendBeacon } from "../../PageBeacon";
import PROVA from "../../../checkout-prova.json";
import MANIFEST from "../../../proof-manifest.json";

/* ============================================================
   TOKENS DO APP (ticket 10 do app-scriptorium; a fábrica troca por news)
   ============================================================ */
const APP = {
  slug: "notas-do-cafe",
  news: "Notas do Café",
  titulo: "Café de Balcão no Coador de Casa",
  // HC 12/09 (rodada 2 do 55): o chip diz o que a pessoa leva, não o nome do produto
  kicker: "Ebook + app",
  // a cena do hero da LP /app (HC 12/09, protótipo C): a capa do ebook e o celular com o app
  capa: "/ebook-web/capa-notas-do-cafe.webp",
  capaAlt: "Capa do ebook Café de Balcão no Coador de Casa",
  fone: "/ebook-web/capa-app-notas-do-cafe.webp",
  foneAlt: "O app Café de Balcão no Coador de Casa no celular",
  leva: "Você leva os dois: o ebook pra baixar e o app pra aplicar",
  // sem preço e sem sub (HC 12/09): o formulário da Stripe mostra o valor certo da session
  // Bump = o segundo guia, desbloqueado dentro do mesmo app (ticket 25): NC recebe BC.
  // HC 12/09 (protótipo C do 55): "irmão" não existe pro leitor; o card apresenta o produto
  // do zero (ponte, nome, de que news vem, o que ensina) e a capa grande na mesma cena do
  // cabeçalho. Ponte e frase vêm da fábrica (app-scriptorium/56): pontes.json + lp-tokens do par.
  bump: {
    titulo: "Brasa Pronta em 20 Minutos",
    ponte: "Você está levando o guia de repetir o café do balcão em casa. Este é o de acender a brasa em 20 minutos.",
    frase: "Da news Brasa Certa: o protocolo de fogo que corta a espera do carvão de uma hora pra 20 minutos, do fósforo à primeira carne, sem equipamento novo.",
    formato: "Ebook + app, igual ao que você está levando",
    capa: "/ebook-web/capa-brasa-certa.webp",
    capaAlt: "Capa do guia Brasa Pronta em 20 Minutos, da Brasa Certa",
    tela: "/ebook-web/capa-app-brasa-certa.webp",
    telaAlt: "O guia Brasa Pronta em 20 Minutos aberto no app",
    preco: "R$ 48,50",
    de: "R$ 97",
  },
  // Saída do checkout (downsell do ticket 25, regra R2: só depois do gesto de sair)
  downsell: {
    kicker: "Antes de ir",
    titulo: "Prefere começar menor?",
    texto: "O mesmo guia em ebook: versão web + PDF, com as 8 variáveis da coada pra imprimir, por R$ 27.",
    cta: "Começar pelo ebook de R$ 27",
    href: "/ebook-premium?src=downsell-app-checkout",
  },
  despedida: "Sem frescura. Bom café. Notas do Café",
};

/* Checkout do app no golden do checkout do ebook (app-scriptorium/55, HC 12/09/26, molde
   c4-20k/54): cabeçalho imersivo na largura (arte da capa, chip, título e sub sem preço),
   reforço no método Amazon (nota com estrelas na proporção e barras por estrela, leitores
   com as carinhas do `proof-manifest.json`, um voto real), formulário da Stripe e o bump
   card F "Você leva os dois" (aqui o segundo é o guia da ALQ no app). Zero preço fora da
   ficha da Stripe: a linha "R$ 97, pagamento único" e a faixa "Pagamento seguro · Garantia"
   saíram. Nav só com a marca, centrada (quem quer voltar, volta sozinho). Tudo de
   `checkout-prova.json`, gravado no build por `prova_checkout.py` a partir do Pharos; a
   página nunca carrega número na mão. */
const AVATARES = (MANIFEST.avatares || []).slice(0, 5);

/* Splits do checkout do ebook (EXP-058 cabeçalho, EXP-059 posição do bump) DESLIGADOS
   aqui: a cobaia das fichas é o checkout do ebook das 97 casas; o app vende 2 por
   trimestre na EE e entraria só pra sujar a leitura. Todo mundo vê A + A. Ligar =
   trocar pra true e subir: o beacon `app-ck-split-hX-bY` carimba o braço na jornada
   (passo próprio, fora do regex de variante) e `checkout_variant` viaja na session. */
const SPLIT = { cabecalho: false, bump: false };
let sorteioOk = true;
type Braco = "A" | "B";
function sorteia(chave: "app_ck_h" | "app_ck_b", ligado: boolean): Braco {
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

// Publishable key da conta News Makers (o app cobra pela NM, ticket app/14).
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

export default function AppCheckout() {
  const [bump, setBump] = useState(false);
  // ticket 35: a recuperação chega com ?oferta=bonus (o guia da ALQ de graça) ou ?oferta=metade (R$ 48,50);
  // ticket 41: o dono do ebook chega com ?oferta=dono&e=<email> (R$ 48,50, posse conferida na rota);
  // c4-20k/57: `dono27` = a janela de 48 h do D+3 (R$ 27); ticket c4-20k/22: `leitor` (R$ 48,50, sem email).
  // A rota decide o preço e a Stripe mostra; o cabeçalho não repete valor nenhum.
  const [oferta, setOferta] = useState("");
  const [email, setEmail] = useState("");
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const o = q.get("oferta");
      if (o === "bonus" || o === "metade" || o === "dono" || o === "dono27" || o === "leitor") setOferta(o);
      setEmail((q.get("e") || "").replace(/ /g, "+").trim());
    } catch {
      /* sem query */
    }
  }, []);
  const [braco, setBraco] = useState<Braco | null>(null); // null até o sorteio: sem piscar de um braço pro outro
  const [pos, setPos] = useState<Braco>("A"); // A = bump depois do formulário, B = antes
  useEffect(() => {
    const h = sorteia("app_ck_h", SPLIT.cabecalho);
    const b = sorteia("app_ck_b", SPLIT.bump);
    setBraco(h);
    setPos(b);
    if (SPLIT.cabecalho || SPLIT.bump) sendBeacon(APP.slug, sorteioOk ? `app-ck-split-h${h}-b${b}` : "app-ck-split-x");
  }, []);
  const [stripeOk, setStripeOk] = useState(false);
  const [montado, setMontado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [saida, setSaida] = useState(false);
  const saidaJa = useRef(false);

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
    setMontado(false); // trocar o bump remonta a session: o esqueleto volta junto
    window
      .Stripe(PK)
      .initEmbeddedCheckout({
        fetchClientSecret: () =>
          fetch("/api/app-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bump,
              oferta,
              email,
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
  }, [stripeOk, bump, oferta, email, braco]);

  // Saída do checkout (ticket 25, ponto 3 do downsell): abriu o embedded e fez o
  // gesto de sair sem pagar. Uma vez por sessão; o corpo da página não cita o ebook.
  useEffect(() => {
    const abre = () => {
      if (saidaJa.current) return;
      try {
        if (sessionStorage.getItem("app_ck_exit")) return;
        sessionStorage.setItem("app_ck_exit", "1");
      } catch {
        /* modo privado: o guard fica só no ref */
      }
      saidaJa.current = true;
      setSaida(true);
    };
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) abre();
    };
    document.addEventListener("mouseleave", onLeave);
    return () => document.removeEventListener("mouseleave", onLeave);
  }, []);

  const configurado = Boolean(PK);
  const depo = PROVA.depoimento;
  const bonus = oferta === "bonus";

  /* Card do bump (C do protótipo de 12/09): a ponte, a cena com a capa grande e o celular,
     o nome do guia, de que news vem e o que ensina, preço e a barra de marcar. Com
     `oferta=bonus` o guia entra de graça (a rota manda o bump na metadata sem line item)
     e o card fica marcado sem barra. Posição por `pos`: A depois do formulário, B antes. */
  const bumpCard = (
    <section className={`bumpcard${bump || bonus ? " on" : ""}${pos === "B" ? " antes" : ""}`} aria-label={bonus ? "Bônus incluído" : "Adicione ao pedido"}>
      <span className="btag">{bonus ? "Bônus incluído" : "Adicione ao pedido"}</span>
      <p className="bponte">{APP.bump.ponte}</p>
      <div className="hd-par b-par">
        <img className="hd-pcapa" src={APP.bump.capa} alt={APP.bump.capaAlt} width={1800} height={2400} loading="lazy" />
        <span className="hd-mais" aria-hidden="true">+</span>
        <span className="hd-fone"><img src={APP.bump.tela} alt={APP.bump.telaAlt} width={780} height={1688} loading="lazy" /></span>
      </div>
      <span className="bformato">{APP.bump.formato}</span>
      <span className="bnome">{APP.bump.titulo}</span>
      <span className="bfrase">{APP.bump.frase}</span>
      <span className="bpreco">{bonus ? <><s>{APP.bump.preco}</s> R$ 0</> : <><s>{APP.bump.de}</s> {APP.bump.preco}</>}</span>
      {bonus ? (
        <span className="bbar bfixo"><span className="bx" aria-hidden="true">✓</span><span>Entra sem custo neste pedido</span></span>
      ) : (
        <label htmlFor="bump" className="bbar">
          <input id="bump" type="checkbox" checked={bump} onChange={(e) => setBump(e.target.checked)} />
          <span className="bx" aria-hidden="true">{bump ? "✓" : ""}</span>
          <span>Levar os dois</span>
        </label>
      )}
    </section>
  );

  return (
    <>
      <PageBeacon slug={APP.slug} step="app-checkout" source="app" />

      <nav>
        <div className="wrap nav-inner">
          <a href="/" className="brand" aria-label="Home">
            <img src="/ebook-web/simbolo.png" alt="" width={32} height={32} />
            <span className="wm"><span className="t">Notas</span><span className="s">{" do Café"}</span></span>
          </a>
          {/* HC 11/09 (regra do 54): sem "voltar pro app"; quem quer voltar, volta sozinho */}
        </div>
      </nav>

      <main className="ck-page">
        {/* cabeçalho: A = a cena da LP (par ebook + app, chip "Ebook + app", título; HC 12/09, protótipo C);
            B = capa ao lado (só quando o split ligar) */}
        {braco === "B" ? (
          <header className="hd hd-split">
            <span className="hd-capa">
              <span className="ck-lomb" aria-hidden="true" />
              <img src="/ebook-web/capa-notas-do-cafe.webp" alt={APP.capaAlt} />
            </span>
            <div className="hd-in">
              <span className="hd-chip">{APP.kicker}</span>
              <h1 className="hd-h1">{APP.titulo}</h1>
            </div>
          </header>
        ) : (
          <header className={`hd hd-cena${braco ? "" : " hd-sorteando"}`}>
            <div className="hd-par">
              <img className="hd-pcapa" src={APP.capa} alt={APP.capaAlt} width={1800} height={2400} />
              <span className="hd-mais" aria-hidden="true">+</span>
              <span className="hd-fone"><img src={APP.fone} alt={APP.foneAlt} width={780} height={1688} /></span>
            </div>
            <p className="hd-leva">{APP.leva}</p>
            <span className="hd-chip">{APP.kicker}</span>
            <h1 className="hd-h1">{APP.titulo}</h1>
          </header>
        )}

        {/* reforço antes do formulário (regra do 54): nota no método Amazon + leitores da casa +
            um voto real. Some inteiro em casa sem lastro (piso: 1.000 leitores, 50 votos). */}
        {PROVA.exibir && PROVA.exibir_nota && (
          <section className="ck-prova" aria-label={`O que os leitores da ${APP.news} dizem`}>
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
                  sem ele a caixa branca fica vazia até a Stripe pintar (0,7 a 1,7 s). */}
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

      {saida && (
        <div className="exitov" role="dialog" aria-modal="true" aria-label={APP.downsell.titulo}>
          <div className="exitbox">
            <button className="exitx" aria-label="Fechar" onClick={() => setSaida(false)}>×</button>
            <p className="kicker">{APP.downsell.kicker}</p>
            <h2>{APP.downsell.titulo}</h2>
            <p className="exittexto">{APP.downsell.texto}</p>
            <a className="exitcta" href={APP.downsell.href}>{APP.downsell.cta}</a>
            <button className="exitfica" onClick={() => setSaida(false)}>Continuar com o app</button>
          </div>
        </div>
      )}

      <footer className="ck-foot">
        <p>{APP.despedida}</p>
      </footer>

      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
:root{--bg:#14110C;--bg-deep:#19170F;--text:#E9EAE3;--text-dim:#96917E;--sage:#96917E;--hair:rgba(233,234,227,.12);--hair-accent:rgba(226,120,44,.30);--bright:#E2782C;--serif:"Playfair Display",Georgia,serif;--sans:"Inter",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,monospace}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--sans);background:var(--bg);color:var(--text);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
nav{position:sticky;top:0;z-index:50;background:rgba(15,13,14,.82);backdrop-filter:saturate(140%) blur(8px);-webkit-backdrop-filter:saturate(140%) blur(8px);border-bottom:1px solid var(--hair)}
a{color:inherit;text-decoration:none}
.wrap{width:100%;max-width:1140px;margin:0 auto;padding:0 28px}
.nav-inner{display:flex;align-items:center;justify-content:center;height:66px} /* marca centrada, sem link de voltar */
.brand{display:flex;align-items:center;gap:11px}
.brand img{width:32px;height:32px}
.wm{font-weight:700;font-size:20px;letter-spacing:-.02em}
.wm .t{color:var(--bright)}.wm .s{color:#fff}
.kicker{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.24em;text-transform:uppercase;color:var(--bright)}

        .ck-page{max-width:560px;margin:0 auto;padding:0 1.25rem 4rem}
        .ck-lomb{position:absolute;top:2%;bottom:2%;left:-5px;width:6px;border-radius:4px 0 0 4px;background:linear-gradient(90deg,rgba(0,0,0,.85),rgba(255,255,255,.10))}
        /* cabeçalho: dois braços (A = imersivo, arte da capa sangrada; B = capa à esquerda) */
        .hd{margin:0 0 18px}
        .hd-chip{display:inline-block;font-family:var(--mono);font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--bright);border:1px solid var(--hair-accent);border-radius:99px;padding:5px 10px;background:rgba(15,13,14,.45);margin-bottom:12px}
        .hd-h1{font-family:var(--serif);font-style:italic;font-weight:900;font-size:clamp(2rem,8.8vw,2.7rem);line-height:1.08;color:#fff;letter-spacing:-.02em;margin:0 0 10px;text-wrap:balance}
        .hd-cena{display:flex;flex-direction:column;align-items:center;text-align:center;padding:22px 0 4px}
        .hd-sorteando{visibility:hidden} /* antes do sorteio: sem piscar de um braço pro outro */
        .hd-par{display:flex;align-items:center;justify-content:center;position:relative;--h:170px}
        .hd-pcapa{height:var(--h);width:auto;aspect-ratio:3/4;object-fit:cover;border-radius:4px 8px 8px 4px;box-shadow:0 18px 40px rgba(0,0,0,.65);transform:rotate(-4deg);z-index:1}
        .hd-fone{display:block;height:calc(var(--h) * 1.06);aspect-ratio:390/844;padding:2%;border-radius:9.5% / 4.4%;background:#0b0b0b;box-shadow:0 22px 40px -14px rgba(0,0,0,.9),inset 0 0 0 2px #2a2a2a;margin-left:-22px;z-index:2}
        .hd-fone img{display:block;width:100%;height:100%;object-fit:cover;object-position:top;border-radius:7.5% / 3.5%}
        .hd-mais{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:34px;height:34px;border-radius:50%;background:#fff;color:#140408;font-family:var(--serif);font-size:24px;line-height:34px;text-align:center;z-index:3;box-shadow:0 6px 18px rgba(0,0,0,.5)}
        .hd-leva{font-size:12.5px;color:var(--text-dim);margin:12px 0 14px;max-width:34ch}
        .hd-split{display:grid;grid-template-columns:104px 1fr;gap:16px;align-items:center;padding:22px 0 6px}
        .hd-capa{position:relative;display:block;width:104px}
        .hd-capa img{display:block;width:100%;height:auto;border-radius:6px;box-shadow:0 18px 40px rgba(0,0,0,.6),0 0 50px rgba(200,125,146,.14)}
        .hd-split .hd-h1{font-size:clamp(1.7rem,7.2vw,2.2rem)}
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
        .bbar.bfixo{cursor:default}
        .bumpcard.on .bbar{background:rgba(200,125,146,.14)}
        .bx{width:22px;height:22px;border-radius:6px;border:2px solid var(--bright);display:inline-flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#140408;flex:none;transition:background .2s ease}
        .bumpcard.on .bx{background:var(--bright)}
        /* reforço: nota (método Amazon), leitores, voto */
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

        .exitov{position:fixed;inset:0;z-index:90;background:rgba(10,8,9,.78);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px}
        .exitbox{position:relative;max-width:400px;width:100%;background:var(--bg-deep);border:1px solid var(--hair-accent);border-radius:16px;padding:30px 26px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.6)}
        .exitbox .kicker{display:block;margin-bottom:.7rem}
        .exitbox h2{font-family:var(--serif);font-style:italic;font-weight:900;font-size:1.5rem;color:#fff;margin-bottom:.6rem}
        .exittexto{font-size:14.5px;color:var(--text);line-height:1.6;margin-bottom:1.2rem}
        .exitcta{display:block;padding:14px 18px;border-radius:10px;background:var(--bright);color:#140408;font-weight:800;font-size:15px;letter-spacing:-.01em}
        .exitcta:hover{filter:brightness(1.08)}
        .exitfica{margin-top:12px;background:none;border:0;color:var(--text-dim);font-family:var(--sans);font-size:13px;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
        .exitfica:hover{color:var(--text)}
        .exitx{position:absolute;top:10px;right:14px;background:none;border:0;color:var(--text-dim);font-size:22px;cursor:pointer;line-height:1}
        .exitx:hover{color:#fff}
      `}</style>
    </>
  );
}
