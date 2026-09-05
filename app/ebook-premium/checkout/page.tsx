"use client";

import { useEffect, useState } from "react";
import PageBeacon from "../../PageBeacon";

/* ============================================================
   TOKENS DA NEWS (a fábrica troca por news; layout idêntico nas 30)
   ============================================================ */
const EBOOK = {
  "slug": "notas-do-cafe",
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

/* Faixa de confiança acima do formulário (ticket 46). A primeira linha é a única
   que muda quando o Pix ligar na conta da NM (02/09/26: a capability não existe,
   a session volta com card e boleto): vira "Pix, cartão ou boleto". */
const CONFIANCA = [
  "Cartão ou boleto",
  "Pagamento pela Stripe",
  "7 dias de garantia",
  "Entrega imediata por email",
];

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
  const [metade, setMetade] = useState(false); // c4-20k/11: só o rótulo; o preço real é da rota
  useEffect(() => {
    const j = jornada();
    setMetade(j.oferta === "metade" && Number(j.ate) > Date.now() / 1000);
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
    if (!stripeOk || !PK || !window.Stripe) return;
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
            body: JSON.stringify({ bump: bump ? "app" : false, ...jornada() }),
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

  const configurado = Boolean(PK);

  return (
    <>
      <PageBeacon slug={EBOOK.slug} step="ebook-premium-checkout" source="ebook-premium" />

      <nav>
        <div className="wrap nav-inner">
          <a href="/" className="brand" aria-label="Home">
            <img src="/ebook-web/simbolo.png" alt="" width={32} height={32} />
            <span className="wm"><span className="t">Notas</span><span className="s">{" do Café"}</span></span>
          </a>
          <a href="/ebook-premium" className="voltar">← voltar pro guia</a>
        </div>
      </nav>

      <main className="ck-page">
        <header className="ck-head">
          {/* HC 10/08: quem chega pela variante C não viu capa nenhuma até aqui.
              O objeto entra antes do título pra pessoa saber que compra um guia. */}
          <div className="ck-obj">
            <span className="ck-lomb" aria-hidden="true" />
            <img src={EBOOK.capa} alt={EBOOK.capaAlt} />
          </div>
          <p className="kicker">{EBOOK.kicker}</p>
          <h1>{EBOOK.titulo}</h1>
          {/* oraculum lp-vendas m02 (HC 02/09): quem entra pela recuperação não viu a LP;
              o cabeçalho diz o que vem, quanto custa, quando chega e a garantia. */}
          <p className="ck-resumo">
            {EBOOK.resumo}{" "}
            {!bump && (metade ? <s>R$ 27</s> : EBOOK.precoDe && <s>{EBOOK.precoDe}</s>)}
            <b>{metade ? (bump ? "R$ 62,00" : "R$ 13,50") : bump ? "R$ 75,50" : EBOOK.preco}</b>, uma vez só.
            {bump ? " Guia + o app do guia." : ""}
          </p>
          <p className="ck-resumo">O link chega no email assim que o pagamento confirma. {EBOOK.garantiaNome}</p>
        </header>

        <ul className="ck-conf">
          {CONFIANCA.map((linha) => (
            <li key={linha}>{linha}</li>
          ))}
        </ul>

        <div className={`ck-box${configurado && !montado && !erro ? " carregando" : ""}`}>
          {configurado ? (
            <>
              <div id="checkout-box" />
              {/* Esqueleto por cima do container enquanto o embedded checkout monta:
                  sem ele a caixa branca fica vazia até a Stripe pintar (medido: 0,7 a
                  1,7 s), e a sessão média no checkout é de 19 s (Clarity, ago/26). */}
              {!montado && !erro && (
                <div className="ck-skel" role="status" aria-label="Abrindo o pagamento">
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
              <p>O pagamento abre aqui assim que as chaves da Stripe entrarem no ambiente. Nada é cobrado até lá.</p>
            </div>
          )}
          {erro && <div className="ck-pend"><p><b>O pagamento não abriu.</b></p><p>{erro}</p></div>}
        </div>

        <label htmlFor="bump" className={`bumpcard${bump ? " on" : ""}`}>
          <input
            id="bump"
            type="checkbox"
            checked={bump}
            onChange={(e) => setBump(e.target.checked)}
          />
          <span className="bx" aria-hidden="true">{bump ? "✓" : ""}</span>
          <span className="btexto">
            <span className="blinha">
              <span className="btag">Adicione ao pedido</span>
              <span className="bpreco"><s>{EBOOK.app.de}</s> {EBOOK.app.preco}</span>
            </span>
            <span className="bnome">O app do guia</span>
            <ul className="blista">
              {EBOOK.app.linhas.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            <span className="bdesc">{EBOOK.app.nota}</span>
          </span>
          {/* a capa do app, no mesmo frame de celular da LP /app (.fone-p do golden ouro) */}
          <span className="bfone" aria-hidden="true">
            <img src={EBOOK.app.capa} alt={EBOOK.app.capaAlt} width={390} height={844} loading="lazy" />
          </span>
        </label>

      </main>

      <footer className="ck-foot">
        <p>{EBOOK.despedida}</p>
      </footer>

      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
:root{--bg:#0F0E0D;--bg-deep:#120B06;--text:#CFCBC8;--text-dim:#8E8986;--sage:#94908E;--hair:rgba(207,203,200,.12);--hair-accent:rgba(225,114,35,.30);--bright:#E17223;--serif:"Playfair Display",Georgia,serif;--sans:"Inter",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,monospace}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--sans);background:var(--bg);color:var(--text);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
nav{position:sticky;top:0;z-index:50;background:rgba(15,14,13,.82);backdrop-filter:saturate(140%) blur(8px);-webkit-backdrop-filter:saturate(140%) blur(8px);border-bottom:1px solid var(--hair)}
a{color:inherit;text-decoration:none}
.wrap{width:100%;max-width:1140px;margin:0 auto;padding:0 28px}
.nav-inner{display:flex;align-items:center;justify-content:space-between;height:66px}
.brand{display:flex;align-items:center;gap:11px}
.brand img{width:32px;height:32px}
.wm{font-weight:700;font-size:20px;letter-spacing:-.02em}
.wm .t{color:var(--bright)}.wm .s{color:#fff}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:var(--sans);font-weight:600;font-size:15px;padding:12px 22px;border-radius:6px;border:0;cursor:pointer;background:var(--bright);color:#140B04;transition:transform .16s ease,background .16s ease;letter-spacing:-.01em;white-space:nowrap}
.btn:hover{background:#E5833D;transform:translateY(-1px)}
.kicker{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.24em;text-transform:uppercase;color:var(--bright)}

        .voltar{font-size:13.5px;color:var(--text-dim);text-decoration:none}
        .voltar:hover{color:var(--bright)}
        .ck-page{max-width:560px;margin:0 auto;padding:3rem 1.25rem 4rem}
        .ck-head{text-align:center;margin-bottom:1.8rem}
        .ck-obj{position:relative;width:136px;margin:0 auto 1.6rem}
        .ck-obj img{display:block;width:100%;height:auto;border-radius:8px;box-shadow:0 24px 54px rgba(0,0,0,.6),0 0 70px rgba(225,114,35,.16)}
        .ck-lomb{position:absolute;top:2%;bottom:2%;left:-5px;width:6px;border-radius:4px 0 0 4px;background:linear-gradient(90deg,rgba(0,0,0,.85),rgba(255,255,255,.10))}
        .ck-head .kicker{display:block;margin-bottom:.9rem}
        .ck-head h1{font-family:var(--serif);font-style:italic;font-weight:900;font-size:clamp(1.8rem,5vw,2.6rem);color:#fff;letter-spacing:-.02em;margin-bottom:.7rem}
        .ck-resumo{font-size:15px;color:var(--text);line-height:1.6}
        .ck-resumo b{color:#fff;font-variant-numeric:tabular-nums}
        .ck-resumo s{color:var(--text-dim);font-variant-numeric:tabular-nums;margin-right:6px}
        .ck-conf{list-style:none;display:flex;flex-wrap:wrap;justify-content:center;gap:7px 18px;margin:0 -60px 15px;padding:0}
        .ck-conf li{display:flex;align-items:center;gap:6px;font-size:12px;white-space:nowrap;color:var(--text-dim);letter-spacing:-.01em}
        @media (max-width:640px){.ck-conf{margin:0 0 15px;gap:7px 22px}}
        .ck-conf li::before{content:"✓";font-size:11px;font-weight:700;color:var(--bright)}
        .ck-box{position:relative;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.5),0 0 60px rgba(225,114,35,.10);min-height:120px}
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
        .bumpcard{display:grid;grid-template-columns:26px 1fr 74px;gap:14px;align-items:start;margin-top:18px;padding:18px 20px;border:1px solid var(--hair);border-radius:14px;background:var(--bg-deep);cursor:pointer;transition:border-color .2s ease,background .2s ease}
        .bumpcard.on{border-color:var(--bright);background:rgba(225,114,35,.07)}
        .bumpcard input{position:absolute;opacity:0;width:0;height:0}
        .bx{width:22px;height:22px;margin-top:2px;border-radius:6px;border:2px solid var(--bright);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#140B04;background:transparent;transition:background .2s ease}
        .bumpcard.on .bx{background:var(--bright)}
        .blinha{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap}
        .btag{font-family:var(--mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--bright)}
        .bpreco{font-size:14px;font-weight:700;color:var(--bright);white-space:nowrap}
        .bpreco s{color:var(--text-dim);font-weight:400;margin-right:4px}
        .bnome{display:block;font-family:var(--serif);font-weight:700;font-size:16.5px;color:#fff;margin:6px 0 4px}
        .bdesc{display:block;font-size:12.5px;color:var(--text-dim);line-height:1.5}
        .blista{list-style:none;margin:0 0 8px;padding:0;display:flex;flex-direction:column;gap:4px}
        .blista li{font-size:13.5px;color:var(--text);line-height:1.5;padding-left:14px;position:relative}
        .blista li::before{content:"✓";position:absolute;left:0;top:0;font-size:11px;font-weight:700;color:var(--bright)}
        .bfone{display:block;width:74px;aspect-ratio:390/844;margin-top:2px;padding:2%;border-radius:9.5% / 4.4%;background:#0b0b0b;box-shadow:0 18px 30px -14px rgba(0,0,0,.85),inset 0 0 0 2px #2a2a2a}
        .bfone img{display:block;width:100%;height:100%;object-fit:cover;object-position:top;border-radius:7.5% / 3.5%}
        @media (max-width:430px){.bumpcard{grid-template-columns:22px 1fr 62px;gap:10px;padding:16px 14px}.bfone{width:62px}.bx{width:20px;height:20px;font-size:12px}}
        .ck-foot{padding:2.5rem 1.5rem;text-align:center;border-top:1px solid var(--hair);background:var(--bg-deep)}
        .ck-foot p{font-family:var(--serif);font-style:italic;font-size:1rem;color:var(--sage)}
      `}</style>
    </>
  );
}
