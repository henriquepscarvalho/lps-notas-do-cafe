"use client";

import { useEffect, useState } from "react";
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

/* Carrinho e upsell moram no Pharos (rota central das 40 news, ticket 02 do mapa
   monetizacao-frentes): a página só desenha o que a rota devolve. Falha de rede
   deixa a confirmação de pé, sem oferta, que é o comportamento de antes. */
const PHAROS = process.env.NEXT_PUBLIC_PHAROS_URL || "https://hc-pharos.vercel.app";

type Item = { sc: string; titulo: string; news: string; url: string; jaTem: boolean };
type Oferta = {
  nome: string;
  itens: Item[];
  jaTem: number;
  novos: number;
  precoCents: number;
  ancoraCents: number;
  descontoCents: number;
};
type Carrinho = {
  news: string;
  paga: boolean;
  comprados: { titulo: string; news: string; isBump: boolean }[];
  umClique: boolean;
  jaTemBiblioteca: boolean;
  oferta: Oferta | null;
};

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function EbookObrigado() {
  const [carrinho, setCarrinho] = useState<Carrinho | null>(null);
  const [comprando, setComprando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [liberada, setLiberada] = useState(false);
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const sid = q.get("session_id") || "";
    setSessionId(sid);
    // Volta do checkout do fallback (boleto/3DS): a compra já foi feita lá.
    if (q.get("biblioteca") === "ok") setLiberada(true);
    if (!sid) return;
    fetch(`${PHAROS}/api/ebook/cart?session_id=${encodeURIComponent(sid)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Carrinho | null) => d && setCarrinho(d))
      .catch(() => undefined);
  }, []);

  const oferta = carrinho?.oferta ?? null;
  const mostraBiblioteca = liberada || Boolean(carrinho?.jaTemBiblioteca);
  const mostraOferta = Boolean(oferta) && carrinho?.paga === true && !mostraBiblioteca;

  async function levar() {
    if (comprando) return;
    setComprando(true);
    setErro(null);
    try {
      const r = await fetch(`${PHAROS}/api/ebook/upsell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const d = await r.json();
      if (d.checkout_url) {
        window.location.href = d.checkout_url;
        return;
      }
      if (!r.ok || !d.ok) throw new Error(d.error || "não deu pra concluir");
      setLiberada(true);
    } catch (e) {
      setErro((e as Error).message);
      setComprando(false);
    }
  }

  /* O que a pessoa acabou de comprar. Sem a rota (rede fora, sessão antiga), cai
     no título da própria news, que é o texto de antes. */
  const levados = carrinho?.comprados?.length
    ? carrinho.comprados.map((c) => c.titulo)
    : [EBOOK.titulo];

  /* Vitrine da oferta: o guia que ela já tem abre a lista com o selo, porque é ele que
     explica o abatimento no preço. Toda família tem 10, então cabe inteira na tela. */
  const vitrine = [...(oferta?.itens ?? [])].sort((a, b) => Number(b.jaTem) - Number(a.jaTem));

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

        <ul className="ob-itens">
          {levados.map((nome) => (
            <li key={nome}>{nome}</li>
          ))}
        </ul>
        <p className="ob-texto">
          {levados.length > 1 ? "Os dois chegam" : "Chega"} no seu email em alguns
          minutos: o link permanente da versão web e o PDF pra guardar.
        </p>

        {mostraBiblioteca && oferta && (
          <section className="bib bib-ok">
            <p className="btag">Biblioteca liberada</p>
            <h2>{oferta.nome}</h2>
            <p className="bsub">
              Os {oferta.itens.length} guias são seus. O email com a lista inteira chega
              junto do seu guia; abaixo já dá pra começar.
            </p>
            <ul className="blista blinks">
              {oferta.itens.map((i) => (
                <li key={i.sc}>
                  <a href={i.url} target="_blank" rel="noopener">{i.titulo}</a>
                  <span className="bnews">{i.news}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {mostraOferta && oferta && (
          <section className="bib">
            <p className="btag">Só nesta página</p>
            <h2>{oferta.nome}</h2>
            <p className="bsub">
              A família inteira: {oferta.itens.length} guias no mesmo formato do que você
              acabou de levar, e o seu já entra na conta.
            </p>

            <p className="bpreco">
              <s>{brl(oferta.ancoraCents)}</s>
              <b>{brl(oferta.precoCents)}</b>
            </p>
            {oferta.descontoCents > 0 && (
              <p className="bdesc">
                Já abatemos {brl(oferta.descontoCents)}: o que você acabou de pagar sai
                do preço da biblioteca.
              </p>
            )}

            <ul className="blista">
              {vitrine.map((i) => (
                <li key={i.sc} className={i.jaTem ? "tem" : ""}>
                  {i.titulo}
                  {i.jaTem && <span className="tag">seu</span>}
                  <span className="bnews">{i.news}</span>
                </li>
              ))}
            </ul>

            <button className="bbtn" onClick={levar} disabled={comprando}>
              {comprando ? "Processando…" : `Levar a biblioteca por ${brl(oferta.precoCents)}`}
            </button>
            <p className="bnota">
              {carrinho?.umClique
                ? "Um clique, no mesmo cartão que você acabou de usar. Sem redigitar nada."
                : "Abre um checkout rápido, com cartão ou boleto."}
            </p>
            {erro && <p className="berro">A cobrança não passou. {erro}</p>}
          </section>
        )}

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

        .ob-page{max-width:560px;margin:0 auto;padding:3.4rem 1.5rem 4.5rem;text-align:center}
        .ob-selo{width:52px;height:52px;margin:0 auto 1.3rem;border-radius:50%;background:rgba(225,114,35,.12);border:1px solid var(--bright);color:var(--bright);font-size:24px;font-weight:700;display:flex;align-items:center;justify-content:center}
        .ob-page .kicker{display:block;margin-bottom:.8rem}
        .ob-page h1{font-family:var(--serif);font-style:italic;font-weight:900;font-size:clamp(1.9rem,5.2vw,2.6rem);color:#fff;letter-spacing:-.02em;margin-bottom:1rem}
        .ob-itens{list-style:none;padding:0;margin:0 0 .9rem;display:flex;flex-direction:column;gap:6px;align-items:center}
        .ob-itens li{font-family:var(--serif);font-weight:700;font-size:17px;color:#fff}
        .ob-itens li::before{content:"✓";color:var(--bright);font-weight:700;margin-right:8px}
        .ob-texto{font-size:15px;color:var(--text);line-height:1.65;margin-bottom:1.6rem}
        .ob-nota{font-size:13px;color:var(--text-dim);line-height:1.6;margin-top:1.8rem}
        .ob-despedida{font-family:var(--serif);font-style:italic;font-size:1.05rem;color:var(--sage,var(--text-dim));margin-top:2.4rem}

        .bib{text-align:left;margin:1.8rem 0 .4rem;padding:22px 22px 24px;border:1px solid var(--bright);border-radius:14px;background:rgba(225,114,35,.12)}
        .bib .btag{font-family:var(--mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--bright);margin-bottom:10px}
        .bib h2{font-family:var(--serif);font-weight:900;font-size:22px;color:#fff;letter-spacing:-.01em;margin-bottom:8px}
        .bsub{font-size:14px;color:var(--text);line-height:1.6}
        .bpreco{display:flex;align-items:baseline;gap:10px;margin:16px 0 4px;font-variant-numeric:tabular-nums}
        .bpreco s{font-size:16px;color:var(--text-dim)}
        .bpreco b{font-size:32px;font-weight:800;color:var(--bright);letter-spacing:-.02em}
        .bdesc{font-size:13px;color:var(--text);line-height:1.55;margin-bottom:14px}
        .blista{list-style:none;padding:0;margin:14px 0 18px;display:grid;grid-template-columns:1fr 1fr;gap:6px 14px}
        .blista li{font-size:13px;color:var(--text);line-height:1.45;padding-left:14px;position:relative}
        .blista li::before{content:"›";position:absolute;left:0;color:var(--bright)}
        .blista li.tem{color:var(--text-dim)}
        .blista .tag{font-family:var(--mono);font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--bright);margin-left:6px;vertical-align:1px}
        .bnews{display:block;font-family:var(--mono);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim);margin-top:1px}
        .blinks a{color:var(--text);text-decoration:underline;text-underline-offset:2px}
        .blinks a:hover{color:var(--bright)}
        .bbtn{width:100%;padding:15px 18px;border:0;border-radius:11px;background:var(--bright);color:#140B04;font-family:var(--sans,inherit);font-size:15.5px;font-weight:800;letter-spacing:-.01em;cursor:pointer;transition:filter .15s ease}
        .bbtn:hover{filter:brightness(1.08)}
        .bbtn:disabled{opacity:.6;cursor:default}
        .bnota{font-size:12.5px;color:var(--text-dim);line-height:1.5;margin-top:10px;text-align:center}
        .berro{font-size:13px;color:#F0A28A;margin-top:10px}
        .bib-ok .blista{grid-template-columns:1fr}
        @media (max-width:430px){.blista{grid-template-columns:1fr}}
      `}</style>
    </>
  );
}
