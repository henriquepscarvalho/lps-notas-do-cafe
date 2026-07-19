"use client";

import PageBeacon from "../../PageBeacon";

/* ============================================================
   TOKENS DA NEWS (a fábrica troca por news)
   ============================================================ */
const EBOOK = {
  "slug": "notas-do-cafe",
  "titulo": "Café de Balcão no Coador de Casa",
  "kicker": "Guia Notas do Café",
  "despedida": "Bom café. Até sábado."
};

export default function EbookObrigado() {
  return (
    <>
      <PageBeacon slug={EBOOK.slug} step="ebook-premium-obrigado" source="ebook-premium" />

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
        <p className="kicker">{EBOOK.kicker}</p>
        <h1>Compra confirmada</h1>
        <p className="ob-texto">
          <b>{EBOOK.titulo}</b> chega no seu email em alguns minutos: o link
          permanente da versão web e o PDF pra guardar.
        </p>
        <p className="ob-nota">
          Não apareceu? Confira spam e promoções. O email sai do endereço da
          newsletter que você já recebe.
        </p>
        <p className="ob-despedida">{EBOOK.despedida}</p>
      </main>

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

        .ob-page{max-width:520px;margin:0 auto;padding:5.5rem 1.5rem 6rem;text-align:center}
        .ob-selo{width:58px;height:58px;margin:0 auto 1.8rem;border-radius:50%;background:rgba(225,114,35,.12);border:1px solid var(--bright);color:var(--bright);font-size:26px;font-weight:700;display:flex;align-items:center;justify-content:center}
        .ob-page .kicker{display:block;margin-bottom:1rem}
        .ob-page h1{font-family:var(--serif);font-style:italic;font-weight:900;font-size:clamp(2rem,5.5vw,2.8rem);color:#fff;letter-spacing:-.02em;margin-bottom:1.2rem}
        .ob-texto{font-size:16px;color:var(--text);line-height:1.7;margin-bottom:1.4rem}
        .ob-texto b{color:#fff}
        .ob-nota{font-size:13.5px;color:var(--text-dim);line-height:1.6}
        .ob-despedida{font-family:var(--serif);font-style:italic;font-size:1.05rem;color:var(--sage);margin-top:3rem}
      `}</style>
    </>
  );
}
