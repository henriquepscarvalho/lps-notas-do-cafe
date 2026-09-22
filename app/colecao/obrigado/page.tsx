"use client";

import { useEffect, useState } from "react";
import PageBeacon from "../../PageBeacon";

/* TOKENS DA COLEÇÃO COMPLETA (colecao-rede, 22/09/26; a fábrica troca por casa) */
const COL = {
  slug: "notas-do-cafe",
  news: "Notas do Café",
  kicker: "Coleção completa",
  n: "115",
  bumpTitulo: "Café de Balcão no Coador de Casa",
  appUrl: "/app/d25d111a",
  despedida: "Sem frescura. Bom café. Notas do Café",
};
const VALOR_COM_BUMP = 14550;

/* Purchase no navegador, dedup por eventID = session_id. O valor vem carimbado no return_url pela rota. */
function pixelPurchase(sessionId: string, centavos: number) {
  let tries = 0;
  const fire = () => {
    try {
      const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
      if (typeof fbq === "function") {
        fbq("track", "Purchase", { value: centavos / 100, currency: "BRL" }, { eventID: sessionId });
        return;
      }
    } catch {
      /* pixel opcional */
    }
    if (tries++ < 20) setTimeout(fire, 250);
  };
  fire();
}

export default function ColecaoObrigado() {
  const [comBump, setComBump] = useState(false);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const sid = p.get("session_id");
    const centavos = Number(p.get("v"));
    if (centavos >= VALOR_COM_BUMP) setComBump(true);
    if (!sid || !centavos || centavos < 100 || centavos > 100000) return;
    const key = "purchase_" + sid;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* modo privado: o dedup fica por conta do event_id */
    }
    pixelPurchase(sid, centavos);
  }, []);

  return (
    <>
      <PageBeacon slug={COL.slug} step="colecao-obrigado" source="colecao" />

      <nav>
        <div className="wrap nav-inner">
          <a href="/" className="brand" aria-label="Home">
            <img src="/ebook-web/simbolo.png" alt="" width={32} height={32} />
            <span className="wm"><span className="t">Notas</span><span className="s">{" do Café"}</span></span>
          </a>
        </div>
      </nav>

      <main className="ob-page">
        <div className="ob-selo" aria-hidden="true">✓</div>
        <p className="kicker">{COL.kicker}</p>
        <h1>Compra confirmada</h1>

        <ul className="ob-itens">
          <li>Coleção completa da {COL.news}: {COL.n} edições num PDF</li>
          {comBump && COL.bumpTitulo && <li>{COL.bumpTitulo} · ebook + app</li>}
        </ul>

        <p className="ob-texto">
          O PDF chega neste email em até 24 horas depois da confirmação (no cartão e no Pix, normalmente em
          minutos; no boleto, quando compensar). Guarde o email: o link é permanente e o arquivo é seu.
        </p>

        {comBump && COL.appUrl && (
          <>
            <a className="ob-abrir" href={COL.appUrl}>Abrir seu app →</a>
            <p className="ob-texto">O ebook + app chega em email separado, com o passo a passo pra instalar. Entre no app com o email desta compra.</p>
          </>
        )}

        <p className="ob-nota">
          O email não apareceu? Confira spam e promoções. Qualquer dúvida, responda o email da compra.
        </p>
        <p className="ob-despedida">{COL.despedida}</p>
      </main>

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
        .ob-page{max-width:560px;margin:0 auto;padding:3.4rem 1.5rem 4.5rem;text-align:center}
        .ob-selo{width:52px;height:52px;margin:0 auto 1.3rem;border-radius:50%;background:color-mix(in srgb,var(--bright) 12%,transparent);border:1px solid var(--bright);color:var(--bright);font-size:24px;font-weight:700;display:flex;align-items:center;justify-content:center}
        .ob-page .kicker{display:block;margin-bottom:.8rem}
        .ob-page h1{font-family:var(--serif);font-style:italic;font-weight:900;font-size:clamp(1.9rem,5.2vw,2.6rem);color:#fff;letter-spacing:-.02em;margin-bottom:1rem}
        .ob-itens{list-style:none;padding:0;margin:0 0 1.4rem;display:flex;flex-direction:column;gap:6px;align-items:center}
        .ob-itens li{font-family:var(--serif);font-weight:700;font-size:17px;color:#fff}
        .ob-itens li::before{content:"✓";color:var(--bright);font-weight:700;margin-right:8px}
        .ob-abrir{display:block;max-width:340px;margin:0 auto 1rem;padding:16px 22px;border-radius:12px;background:var(--bright);color:#140408;font-weight:800;font-size:17px;letter-spacing:-.01em;transition:filter .15s ease,transform .15s ease}
        .ob-abrir:hover{filter:brightness(1.08);transform:translateY(-1px)}
        .ob-texto{font-size:15px;color:var(--text);line-height:1.65;margin-bottom:1.6rem}
        .ob-nota{font-size:13px;color:var(--text-dim);line-height:1.6;margin-top:1.8rem}
        .ob-despedida{font-family:var(--serif);font-style:italic;font-size:1.05rem;color:var(--sage,var(--text-dim));margin-top:2.4rem}
      `}</style>
    </>
  );
}
