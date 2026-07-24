"use client";

import { useEffect, useState } from "react";
import PageBeacon from "../../PageBeacon";

/* ============================================================
   TOKENS DA NEWS (a fábrica troca por news; layout idêntico nas 30)
   ============================================================ */
const EBOOK = {
  "slug": "notas-do-cafe",
  "titulo": "Café de Balcão no Coador de Casa",
  "kicker": "Guia Notas do Café",
  "preco": "R$ 27",
  "precoDe": "R$ 47",
  "bump": {
    "titulo": "Brasa Pronta em 20 Minutos",
    "news": "Brasa Certa",
    "preco": "R$ 13,50",
    "de": "R$ 27",
    "desc": "O guia irmão: o protocolo de fogo que entrega a brasa pronta em 20 minutos e acaba com o churrasco atrasado e o carvão desperdiçado. Metade do preço, só aqui."
  },
  "despedida": "Bom café. Até sábado."
};

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

export default function EbookCheckout() {
  const [bump, setBump] = useState(false);
  const [stripeOk, setStripeOk] = useState(false);
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
    window
      .Stripe(PK)
      .initEmbeddedCheckout({
        fetchClientSecret: () =>
          fetch("/api/create-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bump }),
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
          <p className="kicker">{EBOOK.kicker}</p>
          <h1>{EBOOK.titulo}</h1>
          <p className="ck-resumo">
            {!bump && EBOOK.precoDe && <s>{EBOOK.precoDe}</s>}
            <b>{bump ? "R$ 40,50" : EBOOK.preco}</b>, pagamento único.
            {bump ? " Guia + irmão da vertical." : " Sem assinatura, sem mensalidade."}
          </p>
        </header>

        <div className="ck-box">
          {configurado ? (
            <div id="checkout-box" />
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
              <span className="bpreco"><s>{EBOOK.bump.de}</s> {EBOOK.bump.preco}</span>
            </span>
            <span className="bnome">{EBOOK.bump.titulo} · {EBOOK.bump.news}</span>
            <span className="bdesc">{EBOOK.bump.desc}</span>
          </span>
        </label>

        <div className="selos">
          <span>Pagamento seguro via Stripe</span>
          <span>Garantia de 7 dias</span>
        </div>
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
        .ck-head .kicker{display:block;margin-bottom:.9rem}
        .ck-head h1{font-family:var(--serif);font-style:italic;font-weight:900;font-size:clamp(1.8rem,5vw,2.6rem);color:#fff;letter-spacing:-.02em;margin-bottom:.7rem}
        .ck-resumo{font-size:15px;color:var(--text);line-height:1.6}
        .ck-resumo b{color:#fff;font-variant-numeric:tabular-nums}
        .ck-resumo s{color:var(--text-dim);font-variant-numeric:tabular-nums;margin-right:6px}
        .ck-box{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.5),0 0 60px rgba(225,114,35,.10);min-height:120px}
        .ck-pend{padding:2.2rem 1.6rem;font-family:var(--sans,inherit);color:#26302B}
        .ck-pend p{font-size:14.5px;line-height:1.6;margin:0 0 .5rem}
        .ck-pend b{color:#0D0F0E}
        .bumpcard{display:grid;grid-template-columns:26px 1fr;gap:14px;align-items:start;margin-top:18px;padding:18px 20px;border:1px solid var(--hair);border-radius:14px;background:var(--bg-deep);cursor:pointer;transition:border-color .2s ease,background .2s ease}
        .bumpcard.on{border-color:var(--bright);background:rgba(225,114,35,.07)}
        .bumpcard input{position:absolute;opacity:0;width:0;height:0}
        .bx{width:22px;height:22px;margin-top:2px;border-radius:6px;border:2px solid var(--bright);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#140B04;background:transparent;transition:background .2s ease}
        .bumpcard.on .bx{background:var(--bright)}
        .blinha{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap}
        .btag{font-family:var(--mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--bright)}
        .bpreco{font-size:14px;font-weight:700;color:var(--bright);white-space:nowrap}
        .bpreco s{color:var(--text-dim);font-weight:400;margin-right:4px}
        .bnome{display:block;font-family:var(--serif);font-weight:700;font-size:16.5px;color:#fff;margin:6px 0 4px}
        .bdesc{display:block;font-size:13.5px;color:var(--text);line-height:1.55}
        .selos{display:flex;justify-content:center;gap:22px;margin-top:22px;font-size:12.5px;color:var(--text-dim)}
        .ck-foot{padding:2.5rem 1.5rem;text-align:center;border-top:1px solid var(--hair);background:var(--bg-deep)}
        .ck-foot p{font-family:var(--serif);font-style:italic;font-size:1rem;color:var(--sage)}
      `}</style>
    </>
  );
}
