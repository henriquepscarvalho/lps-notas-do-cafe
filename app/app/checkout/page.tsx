"use client";

import { useEffect, useRef, useState } from "react";
import PageBeacon from "../../PageBeacon";

/* ============================================================
   TOKENS DO APP (ticket 10 do app-scriptorium; a fábrica troca por news)
   ============================================================ */
const APP = {
  slug: "notas-do-cafe",
  icone: "https://app-scriptorium.vercel.app/icons/icon-512.png",
  titulo: "Café de Balcão no Coador de Casa",
  kicker: "App Notas do Café",
  preco: "R$ 97",
  resumo: "Leitor, plano de 8 dias, destaques e notas, no seu celular.",
  bump: {
    titulo: "Brasa Pronta em 20 Minutos",
    news: "Brasa Certa",
    preco: "R$ 48,50",
    de: "R$ 97",
    desc: "O guia irmão, desbloqueado dentro do mesmo app: leitura completa, plano de 8 dias, destaques e notas. Metade do preço do app, só aqui.",
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
  // ticket 35: a recuperação chega com ?oferta=bonus (irmão de graça) ou ?oferta=metade (R$ 48,50)
  const [oferta, setOferta] = useState("");
  useEffect(() => {
    try {
      const o = new URLSearchParams(window.location.search).get("oferta");
      if (o === "bonus" || o === "metade") setOferta(o);
    } catch {
      /* sem query */
    }
  }, []);
  const [stripeOk, setStripeOk] = useState(false);
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
    if (!stripeOk || !PK || !window.Stripe) return;
    let handle: CheckoutHandle | null = null;
    let vivo = true;
    setErro(null);
    window
      .Stripe(PK)
      .initEmbeddedCheckout({
        fetchClientSecret: () =>
          fetch("/api/app-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bump, oferta, ...jornada() }),
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
  }, [stripeOk, bump, oferta]);

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

  return (
    <>
      <PageBeacon slug={APP.slug} step="app-checkout" source="app" />

      <nav>
        <div className="wrap nav-inner">
          <a href="/" className="brand" aria-label="Home">
            <img src="/app-ouro/simbolo.png" alt="" width={32} height={32} />
            <span className="wm"><span className="t">Notas</span><span className="s">{" do Café"}</span></span>
          </a>
          <a
            href="/app"
            className="voltar"
            onClick={(e) => {
              // Voltar é o gesto de saída do mobile: o downsell aparece uma vez aqui.
              if (!saidaJa.current) {
                e.preventDefault();
                saidaJa.current = true;
                setSaida(true);
              }
            }}
          >
            ← voltar pro app
          </a>
        </div>
      </nav>

      <main className="ck-page">
        <header className="ck-head">
          <div className="ck-app">
            <img src={APP.icone} alt={`Ícone do app ${APP.titulo}`} />
          </div>
          <p className="kicker">{APP.kicker}</p>
          <h1>{APP.titulo}</h1>
          <p className="ck-resumo">
            <b>{oferta === "metade" ? (bump ? "R$ 97" : "R$ 48,50") : bump ? "R$ 145,50" : APP.preco}</b>, pagamento único.
            {oferta === "bonus"
              ? ` App + ${APP.bump.titulo} desbloqueado de bônus.`
              : bump
                ? " App + guia irmão desbloqueado."
                : ` ${APP.resumo}`}
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

        {oferta === "bonus" ? (
          <div className="bumpcard on" aria-label="Bônus incluído">
            <span className="bx" aria-hidden="true">✓</span>
            <span className="btexto">
              <span className="blinha">
                <span className="btag">Bônus incluído</span>
                <span className="bpreco"><s>{APP.bump.preco}</s> R$ 0</span>
              </span>
              <span className="bnome">{APP.bump.titulo} · {APP.bump.news}</span>
              <span className="bdesc">{APP.bump.desc.split(". Metade")[0]}. Entra sem custo neste pedido.</span>
            </span>
          </div>
        ) : (
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
              <span className="bpreco"><s>{APP.bump.de}</s> {APP.bump.preco}</span>
            </span>
            <span className="bnome">{APP.bump.titulo} · {APP.bump.news}</span>
            <span className="bdesc">{APP.bump.desc}</span>
          </span>
        </label>
        )}

        <div className="selos">
          <span>Pagamento seguro via Stripe</span>
          <span>Garantia de 7 dias</span>
        </div>
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
nav{position:sticky;top:0;z-index:50;background:rgba(20,17,12,.82);backdrop-filter:saturate(140%) blur(8px);-webkit-backdrop-filter:saturate(140%) blur(8px);border-bottom:1px solid var(--hair)}
a{color:inherit;text-decoration:none}
.wrap{width:100%;max-width:1140px;margin:0 auto;padding:0 28px}
.nav-inner{display:flex;align-items:center;justify-content:space-between;height:66px}
.brand{display:flex;align-items:center;gap:11px}
.brand img{width:32px;height:32px}
.wm{font-weight:700;font-size:20px;letter-spacing:-.02em}
.wm .t{color:var(--bright)}.wm .s{color:#fff}
.kicker{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.24em;text-transform:uppercase;color:var(--bright)}

        .voltar{font-size:13.5px;color:var(--text-dim);text-decoration:none}
        .voltar:hover{color:var(--bright)}
        .ck-page{max-width:560px;margin:0 auto;padding:3rem 1.25rem 4rem}
        .ck-head{text-align:center;margin-bottom:1.8rem}
        .ck-app{width:104px;margin:0 auto 1.5rem}
        .ck-app img{display:block;width:100%;height:auto;border-radius:24px;box-shadow:0 24px 54px rgba(0,0,0,.6),0 0 70px rgba(226,120,44,.16)}
        .ck-head .kicker{display:block;margin-bottom:.9rem}
        .ck-head h1{font-family:var(--serif);font-style:italic;font-weight:900;font-size:clamp(1.8rem,5vw,2.6rem);color:#fff;letter-spacing:-.02em;margin-bottom:.7rem}
        .ck-resumo{font-size:15px;color:var(--text);line-height:1.6}
        .ck-resumo b{color:#fff;font-variant-numeric:tabular-nums}
        .ck-box{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.5),0 0 60px rgba(226,120,44,.10);min-height:120px}
        .ck-pend{padding:2.2rem 1.6rem;font-family:var(--sans,inherit);color:#26302B}
        .ck-pend p{font-size:14.5px;line-height:1.6;margin:0 0 .5rem}
        .ck-pend b{color:#0D0F0E}
        .bumpcard{display:grid;grid-template-columns:26px 1fr;gap:14px;align-items:start;margin-top:18px;padding:18px 20px;border:1px solid var(--hair);border-radius:14px;background:var(--bg-deep);cursor:pointer;transition:border-color .2s ease,background .2s ease}
        .bumpcard.on{border-color:var(--bright);background:rgba(226,120,44,.07)}
        .bumpcard input{position:absolute;opacity:0;width:0;height:0}
        .bx{width:22px;height:22px;margin-top:2px;border-radius:6px;border:2px solid var(--bright);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#140408;background:transparent;transition:background .2s ease}
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
