"use client";

import { useEffect, useState } from "react";
import PageBeacon, { sendBeacon } from "../../PageBeacon";
import QuizComprador, { type QuizPergunta } from "../../QuizComprador";

/* ============================================================
   TOKENS DO APP (ticket 10 do app-scriptorium; a fábrica troca por news)
   ============================================================ */
const APP = {
  "slug": "notas-do-cafe",
  "titulo": "Café de Balcão no Coador de Casa",
  "kicker": "App Notas do Café",
  "url": "/app/d25d111a",
  "capa": "/ebook-web/capa-app-notas-do-cafe.webp",
  "formato": "Ebook + app, web e PDF",
  "remetente": "leia@notasdocafe.com.br",
  "dominio": "notasdocafe.com.br",
  "despedida": "Sem frescura. Bom café. Notas do Café"
};

/* Pergunta de 1 clique (obg/07, mapa obrigado-do-comprador): a missão 3 do obrigado do app. As respostas
   da casa são as da LP do guia (promessa, amostra, prova) mais a do app; a taxonomia é a comum da rede.
   A resposta vai pro Pharos (/api/ebook/motivo) com o session_id da compra; a versão diz que veio do app. */
const MOTIVOS = {
  "sc": "NC",
  "versao": "nc-app-quiz-v1",
  "pergunta": "O que te fez levar o ebook + app?",
  "opcoes": [
    { "k": "promessa", "t": "Depois desse guia, o coador da cozinha vira xícara de balcão que você faz sozinho" },
    { "k": "ficha", "t": "Ter o guia no app, na tela inicial do celular" },
    { "k": "amostra", "t": "A primeira variável, aberta na íntegra" },
    { "k": "prova", "t": "Os depoimentos de quem já lê a news" },
    { "k": "outro", "t": "Outro motivo" }
  ],
  "campo": "Conta em uma frase",
  "enviar": "Enviar"
};

/* Quiz do comprador (obg/12): os toques da missão 3. O 1º é o motivo (tokens acima); os outros dizem
   pra que o comprador usa, o próximo desafio e o formato. Chave comum da rede, texto da casa. */
const QUIZ: QuizPergunta[] = [
  { k: "motivo", q: MOTIVOS.pergunta, opcoes: MOTIVOS.opcoes },
  {
    k: "uso",
    q: "Pra que você faz café hoje?",
    opcoes: [
      { k: "trabalho", t: "No meu trabalho" },
      { k: "negocio", t: "No meu negócio" },
      { k: "estudo", t: "Estudando pra ser barista" },
      { k: "prazer", t: "Por prazer" },
      { k: "outro", t: "Outro uso" },
    ],
  },
  {
    k: "desafio",
    q: "Qual é o seu próximo desafio no café?",
    opcoes: [
      { k: "comecar", t: "Saber por onde começar no coador" },
      { k: "tecnica", t: "Acertar a coada toda vez" },
      { k: "rotina", t: "Fazer um café bom todo dia" },
      { k: "renda", t: "Ganhar dinheiro com café" },
      { k: "outro", t: "Outro desafio" },
    ],
  },
  {
    k: "formato",
    q: "Em que formato você aprende melhor?",
    opcoes: [
      { k: "guia", t: "Guia pra ler no meu tempo" },
      { k: "modelos", t: "Receitas prontas pra seguir" },
      { k: "video", t: "Aulas curtas em vídeo" },
      { k: "desafio_7d", t: "Desafio de 7 dias, um passo por dia" },
      { k: "outro", t: "Outro formato" },
    ],
  },
];

/* Guia de OUTRA newsletter (EXP-079, c4-20k/125): card da missão 2, abaixo do bundle quando ele existe. A venda
   cai no ebook_purchases.src = obrigado-irma-app pelo caminho de sempre; os tokens saem do mapa
   .wayfinder/c4-20k/assets/125-obrigado-irma.json. Casa sem par fica com ativo=false. */
const OUTRO = {
  "ativo": true,
  "news": "Fotografia do Dia",
  "kicker": "Guia Fotografia do Dia",
  "titulo": "Vitrine de Mesa",
  "promessa": "As fotos que fazem o que está parado em casa vender no mesmo fim de semana.",
  "formato": "Guia completo, web + PDF",
  "preco": "R$ 47",
  "capa": "/ebook-web/irma/FD.webp",
  "url": "https://lp.fotografiadodia.com.br/ebook-premium/checkout?src=obrigado-irma-app"
};

/* Missão 1: o botão abre a caixa de email já buscando o email da casa, pelo DOMÍNIO (acha a entrega venha de
   leia@, hc@ ou subdomínio de envio). Gmail é o botão; Hotmail e Yahoo ficam como link. */
const BUSCA = encodeURIComponent(`from:${APP.dominio}`);
const EMAIL = {
  gmail: `https://mail.google.com/mail/u/0/?utm_source=${APP.dominio}&utm_medium=obrigado-app#search/${BUSCA}`,
  hotmail: `https://outlook.live.com/mail/0/search?q=${BUSCA}&utm_source=${APP.dominio}&utm_medium=obrigado-app`,
  yahoo: `https://mail.yahoo.com/d/search/keyword=${BUSCA}?utm_source=${APP.dominio}&utm_medium=obrigado-app`,
};

/* Carrinho e upsell moram no Pharos (rota central, ticket 02 do mapa
   monetizacao-frentes): a página só desenha o que a rota devolve. Falha de
   rede deixa a confirmação e o botão do app de pé, sem oferta. */
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

/* Purchase no navegador, dedup por eventID = session_id (o webhook manda o mesmo
   id pela CAPI). O valor vem carimbado no return_url pelo create-session do app. */
function pixelPurchase(sessionId: string, centavos: number) {
  let tries = 0;
  const fire = () => {
    try {
      const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
      if (typeof fbq === "function") {
        fbq(
          "track",
          "Purchase",
          { value: centavos / 100, currency: "BRL" },
          { eventID: sessionId }
        );
        return;
      }
    } catch {
      /* pixel opcional */
    }
    if (tries++ < 20) setTimeout(fire, 250);
  };
  fire();
}

/* Rótulo da missão: mono, pequeno, na cor da casa; ganha «cumprida» quando a ação aconteceu. */
function Missao({ n, de, ok }: { n: number; de: number; ok?: boolean }) {
  return (
    <p className="mis-k">
      Missão {n} de {de}{ok && <span className="mis-ok"> · cumprida ✓</span>}
    </p>
  );
}

export default function AppObrigado() {
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const sid = p.get("session_id");
    const centavos = Number(p.get("v"));
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

  const [carrinho, setCarrinho] = useState<Carrinho | null>(null);
  const [comprando, setComprando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [liberada, setLiberada] = useState(false);
  const [sessionId, setSessionId] = useState("");
  // Missão 1 cumprida = tocou em abrir o app ou o email.
  const [abriu, setAbriu] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const sid = q.get("session_id") || "";
    setSessionId(sid);
    if (q.get("biblioteca") === "ok") setLiberada(true);
    if (!sid) return;
    fetch(`${PHAROS}/api/ebook/cart?session_id=${encodeURIComponent(sid)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Carrinho | null) => d && setCarrinho(d))
      .catch(() => undefined);
  }, []);

  function abrirEmail() {
    setAbriu(true);
    sendBeacon(APP.slug, "obrigado-abrir-email", { eventType: "converteu" });
  }

  const oferta = carrinho?.oferta ?? null;
  const mostraBiblioteca = liberada || Boolean(carrinho?.jaTemBiblioteca);
  const mostraOferta = Boolean(oferta) && carrinho?.paga === true && !mostraBiblioteca;
  const temBump = Boolean(carrinho?.comprados?.some((c) => c.isBump));
  const bumpTitulo = carrinho?.comprados?.find((c) => c.isBump)?.titulo;

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

  const vitrine = [...(oferta?.itens ?? [])].sort((a, b) => Number(b.jaTem) - Number(a.jaTem));

  /* EXP-079: o link do guia de outra newsletter leva a jornada junto (?j=). */
  const [outroHref, setOutroHref] = useState(OUTRO.url);
  useEffect(() => {
    try {
      const j = sessionStorage.getItem("vdn_journey");
      if (j) setOutroHref(`${OUTRO.url}&j=${encodeURIComponent(j)}`);
    } catch {
      /* storage bloqueado: o link segue só com o src */
    }
  }, []);
  const jaLevouOutro = Boolean(carrinho?.comprados?.some((c) => c.news === OUTRO.news));
  const temProximoPasso = (mostraBiblioteca && Boolean(oferta)) || (mostraOferta && Boolean(oferta)) || (OUTRO.ativo && !jaLevouOutro);
  const totalMissoes = 1 + (temProximoPasso ? 1 : 0) + (sessionId ? 1 : 0); // MISSOES-SESSAO (obg/17): a última missão (quiz ou pergunta) só existe com a sessão na URL

  return (
    <>
      <PageBeacon slug={APP.slug} step="app-obrigado" source="app" />

      <nav>
        <div className="wrap nav-inner">
          <a href="/" className="brand" aria-label="Home">
            <img src="/app-ouro/simbolo.png" alt="" width={32} height={32} />
            <span className="wm"><span className="t">Notas</span><span className="s">{" do Café"}</span></span>
          </a>
        </div>
      </nav>

      <main className="ob-page" data-legivel="2.2">{/* LEGIVEL (col/32) · LEGIVEL-CEL (col/45) */}
        <div className="ob-selo" aria-hidden="true">✓</div>
        <p className="kicker">{APP.kicker}</p>
        <h1>Compra confirmada</h1>

        {/* Missão 1 (HC 23/09/26): abrir o app. Recibo com a tela do app, botão vazado do app, as instruções de
            tela inicial e o email, também vazado. O preenchido é o da missão 2. */}
        <section className="sec sec-1" aria-label="Missão 1: abra o seu app">
          <Missao n={1} de={totalMissoes} ok={abriu} />
          <h2 className="sec-t">Abra o seu app</h2>
          <p className="sec-sub">Entre com o email desta compra: é ele que destranca seus guias.</p>

          <div className="ob-recibo">
            <span className="ob-capa">
              <img src={APP.capa} alt={`Tela do app ${APP.titulo}`} width={96} height={128} loading="eager" />
            </span>
            <div className="ob-recibo-txt">
              <ul className="ob-itens">
                <li>{APP.titulo}, o app</li>
                {temBump && <li>{bumpTitulo ?? "O segundo ebook + app"} · desbloqueado no app</li>}
              </ul>
              <p className="ob-recibo-meta">{APP.formato}</p>
            </div>
          </div>

          <a className="ob-vazado" href={APP.url} onClick={() => setAbriu(true)}>Abrir seu app →</a>

          <div className="ob-inst">
            <p className="ob-inst-t">Pra deixar na tela inicial:</p>
            <p><b>Android</b> (Chrome): abra o app no botão acima, toque no menu ⋮ e escolha <b>Instalar aplicativo</b>.</p>
            <p><b>iPhone</b> (Safari): abra o app no botão acima, toque em <b>Compartilhar</b> e escolha <b>Adicionar à Tela de Início</b>.</p>
          </div>

          <a className="ob-vazado" href={EMAIL.gmail} target="_blank" rel="noopener" onClick={abrirEmail}>
            Abrir meu email
          </a>
          <p className="ob-nota-btn">
            O mesmo link chega no seu email, com o passo a passo. Abre o Gmail já buscando os emails de {APP.dominio}.
            <br />
            Uso <a href={EMAIL.hotmail} target="_blank" rel="noopener" onClick={abrirEmail}>Hotmail</a>
            {" · "}
            Uso <a href={EMAIL.yahoo} target="_blank" rel="noopener" onClick={abrirEmail}>Yahoo</a>
          </p>
        </section>

        {temProximoPasso && (
          <section className="sec" aria-label="Missão 2: seu próximo passo">
            <Missao n={2} de={totalMissoes} />
            <h2 className="sec-t">Seu próximo passo</h2>
            <p className="sec-sub">
              {mostraOferta
                ? "O bundle com o guia do seu app já abatido, ou o guia que continua este."
                : "O guia que continua o que você acabou de levar."}
            </p>

            {mostraBiblioteca && oferta && (
              <div className="bib bib-ok">
                <p className="btag">Bundle liberado</p>
                <h3>{oferta.nome}</h3>
                <p className="bsub">
                  Os {oferta.itens.length} guias são seus. O email com a lista inteira chega
                  junto; abaixo já dá pra começar.
                </p>
                <ul className="blista blinks">
                  {oferta.itens.map((i) => (
                    <li key={i.sc}>
                      <a href={i.url} target="_blank" rel="noopener">{i.titulo}</a>
                      <span className="bnews">{i.news}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {mostraOferta && oferta && (
              <div className="bib">
                <p className="btag">Só nesta página</p>
                <h3>{oferta.nome}</h3>
                <p className="bsub">
                  A família inteira: {oferta.itens.length} guias no mesmo formato, e o guia
                  do seu app já entra na conta.
                </p>

                <p className="bpreco">
                  <s>{brl(oferta.ancoraCents)}</s>
                  <b>{brl(oferta.precoCents)}</b>
                </p>
                {oferta.descontoCents > 0 && (
                  <p className="bdesc">
                    Já abatemos {brl(oferta.descontoCents)}: o guia que o seu app inclui sai
                    do preço do bundle.
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

                <button className="ob-cheio" onClick={levar} disabled={comprando}>
                  {comprando ? "Processando…" : `Levar o bundle por ${brl(oferta.precoCents)}`}
                </button>
                <p className="bnota">
                  {carrinho?.umClique
                    ? "Um clique, no mesmo cartão que você acabou de usar. Sem redigitar nada."
                    : "Abre um checkout rápido, com cartão ou boleto."}
                </p>
                {erro && <p className="berro">A cobrança não passou. {erro}</p>}
              </div>
            )}

            {OUTRO.ativo && !jaLevouOutro && (
              <div className="outro" aria-label={`Guia ${OUTRO.titulo} (${OUTRO.news})`}>
                <div className="outro-topo">
                  <span className="outro-capa">
                    <img src={OUTRO.capa} alt={`Capa do guia ${OUTRO.titulo}`} width={76} height={101} loading="lazy" />
                  </span>
                  <div>
                    <p className="outro-tag">{OUTRO.kicker}</p>
                    <h3>{OUTRO.titulo}</h3>
                    <p className="outro-p">{OUTRO.promessa}</p>
                    <p className="outro-meta">{OUTRO.formato}</p>
                  </div>
                </div>
                <a
                  className="ob-cheio"
                  href={outroHref}
                  onClick={() => sendBeacon(APP.slug, "obrigado-irma", { eventType: "converteu" })}
                >
                  Levar por {OUTRO.preco}
                </a>
                <p className="bnota">Abre o checkout do guia, com pix, cartão ou boleto.</p>
              </div>
            )}
          </section>
        )}

        {sessionId && (
          <QuizComprador
            sessionId={sessionId}
            sc={MOTIVOS.sc}
            slug={APP.slug}
            versao={MOTIVOS.versao}
            perguntas={QUIZ}
            n={totalMissoes}
            de={totalMissoes}
            pharos={PHAROS}
          />
        )}

        <p className="ob-nota">
          O email não apareceu? Confira spam e promoções. Ele sai de {APP.remetente}, o mesmo endereço da
          newsletter, e o botão acima já abre o app agora, sem esperar nada.
        </p>
        <p className="ob-despedida">{APP.despedida}</p>
      </main>

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
.kicker{font-family:var(--mono);font-size:13px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--bright)}
        .ob-page{max-width:560px;margin:0 auto;padding:3.4rem 1.5rem 4.5rem;text-align:center}
        .ob-selo{width:52px;height:52px;margin:0 auto 1.3rem;border-radius:50%;background:rgba(200,125,146,.12);border:1px solid var(--bright);color:var(--bright);font-size:24px;font-weight:700;display:flex;align-items:center;justify-content:center}
        .ob-page .kicker{display:block;margin-bottom:.8rem;font-size:13px;letter-spacing:.2em}
        .ob-page h1{font-family:var(--serif);font-style:italic;font-weight:900;font-size:clamp(1.9rem,5.2vw,2.6rem);color:#fff;letter-spacing:-.02em;margin-bottom:.4rem}
        .ob-nota{font-size:15px;color:var(--text);line-height:1.6;margin-top:2.2rem}
        .ob-despedida{font-family:var(--serif);font-style:italic;font-size:1.05rem;color:var(--sage,var(--text-dim));margin-top:2.4rem}

        /* Missões (HC 23/09/26): três seções com filete + rótulo mono + subtítulo serif. A 1ª cola no H1. */
        .sec{border-top:1px solid var(--hair);margin-top:2.1rem;padding-top:1.6rem;text-align:left}
        .sec-1{border-top:0;margin-top:1.4rem;padding-top:0}
        .mis-k{font-family:var(--mono);font-size:13px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--bright);margin:0 0 8px}
        .mis-ok{color:var(--text)}
        .sec-t{font-family:var(--serif);font-style:normal;font-weight:900;font-size:26px;line-height:1.2;color:#fff;letter-spacing:-.01em;margin:0 0 5px}
        .sec-sub{font-size:16px;color:var(--text);line-height:1.55;margin:0 0 16px;text-wrap:pretty}

        /* Recibo: a tela do app + o que ela levou, como um checkout mostra o produto. */
        .ob-recibo{display:flex;gap:18px;align-items:center;margin:0;padding:18px;border:1px solid var(--hair);border-radius:14px;background:rgba(255,255,255,.025)}
        .ob-capa{flex:0 0 120px;width:120px}
        .ob-capa img{display:block;width:100%;height:auto;border-radius:5px;box-shadow:0 14px 34px rgba(0,0,0,.5)}
        .ob-recibo-txt{min-width:0;flex:1}
        .ob-itens{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px;align-items:flex-start}
        .ob-itens li{font-family:var(--serif);font-weight:700;font-size:19px;line-height:1.25;color:#fff;letter-spacing:-.01em}
        .ob-itens li::before{content:"✓";color:var(--bright);font-weight:700;margin-right:8px}
        .ob-recibo-meta{font-family:var(--mono);font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:var(--text);margin:12px 0 0;text-wrap:balance}

        /* Dois pesos de botão, um por missão: vazado na 1 (abrir), cheio na 2 (levar). */
        .ob-vazado{display:flex;margin-top:16px;padding:14px 18px;border:2px solid var(--bright);border-radius:999px;color:#fff;text-align:center;font-family:var(--sans,inherit);font-weight:700;font-size:18px;letter-spacing:0;transition:background .15s ease;align-items:center;justify-content:center;min-height:58px}
        .ob-vazado:hover{background:rgba(200,125,146,.10)}
        .ob-cheio{display:flex;width:100%;margin-top:16px;padding:16px 20px;border:0;border-radius:999px;background:var(--bright);color:#140408;text-align:center;font-family:var(--sans,inherit);font-size:18px;font-weight:800;letter-spacing:0;cursor:pointer;box-shadow:0 5px 0 color-mix(in srgb,var(--bright) 55%,#000);transition:filter .15s ease,transform .15s ease,box-shadow .15s ease;align-items:center;justify-content:center;min-height:60px}
        .ob-cheio:hover{filter:brightness(1.08)}
        .ob-cheio:active{transform:translateY(3px);box-shadow:0 2px 0 color-mix(in srgb,var(--bright) 55%,#000)}
        .ob-cheio:disabled{opacity:.6;cursor:default;transform:none;box-shadow:none}
        .ob-nota-btn{font-size:15px;color:var(--text);line-height:1.55;text-align:center;margin:12px 0 0;text-wrap:balance}
        .ob-nota-btn a{color:var(--bright);text-decoration:underline;text-underline-offset:2px}
        .ob-inst{margin:16px 0 0;padding:18px;border:1px solid var(--hair);border-radius:12px;background:var(--bg-deep,rgba(0,0,0,.25))}
        .ob-inst p{font-size:16px;color:var(--text);line-height:1.55;margin:0 0 8px}
        .ob-inst p:last-child{margin-bottom:0}
        .ob-inst b{color:#fff}
        .ob-inst-t{font-family:var(--mono);font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:var(--bright)}

        /* A pergunta de 1 clique. Uma coluna, altura de toque, cor de destaque só no escolhido. */
        .mot-ops{display:grid;gap:8px}
        .mot-op{display:flex;align-items:center;gap:12px;width:100%;min-height:56px;padding:13px 16px;border:1px solid var(--hair,rgba(128,128,128,.28));border-radius:11px;background:transparent;color:var(--text);font-family:var(--sans,inherit);font-size:16px;font-weight:600;line-height:1.3;text-align:left;cursor:pointer;transition:border-color .15s ease,background .15s ease}
        .mot-op:hover{border-color:var(--bright)}
        .mot-op:disabled{cursor:default}
        .mot-op.on{border-color:var(--bright);background:rgba(200,125,146,.12);color:#fff}
        .mot-dot{flex:0 0 18px;width:18px;height:18px;border-radius:50%;border:1.5px solid var(--text-dim)}
        .mot-op.on .mot-dot{border-color:var(--bright);background:var(--bright);box-shadow:inset 0 0 0 3px var(--bg)}
        .mot-outro{display:grid;gap:8px;margin-top:2px}
        .mot-outro textarea{width:100%;min-height:88px;padding:12px 14px;border:1px solid var(--hair,rgba(128,128,128,.28));border-radius:11px;background:rgba(255,255,255,.03);color:#fff;font-family:var(--sans,inherit);font-size:16px;line-height:1.45;resize:vertical}
        .mot-outro textarea::placeholder{color:var(--text-dim)}
        .mot-outro textarea:focus{outline:none;border-color:var(--bright)}
        .mot-enviar{min-height:56px;padding:12px 18px;border:0;border-radius:999px;background:var(--bright);color:#140408;font-family:var(--sans,inherit);font-size:17px;font-weight:800;letter-spacing:-.01em;cursor:pointer;transition:filter .15s ease}
        .mot-enviar:hover{filter:brightness(1.08)}
        .mot-enviar:disabled{opacity:.5;cursor:default;filter:none}

        .bib{margin:0 0 .9rem;padding:22px 22px 24px;border:1px solid var(--bright);border-radius:14px;background:rgba(200,125,146,.12)}
        .bib .btag{font-family:var(--mono);font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:var(--bright);margin-bottom:10px}
        .bib h3{font-family:var(--serif);font-weight:900;font-size:24px;color:#fff;letter-spacing:-.01em;margin-bottom:8px;line-height:1.2}
        .bsub{font-size:16px;color:var(--text);line-height:1.6}
        .bpreco{display:flex;align-items:baseline;gap:10px;margin:16px 0 4px;font-variant-numeric:tabular-nums}
        .bpreco s{font-size:19px;color:var(--text-dim)}
        .bpreco b{font-size:40px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1}
        .bdesc{font-size:15px;color:var(--text);line-height:1.55;margin-bottom:14px}
        .blista{list-style:none;padding:0;margin:14px 0 4px;display:grid;grid-template-columns:1fr 1fr;gap:10px 16px}
        .blista li{font-size:15px;color:var(--text);line-height:1.45;padding-left:14px;position:relative}
        .blista li::before{content:"›";position:absolute;left:0;color:var(--bright)}
        .blista li.tem{color:var(--text-dim)}
        .blista .tag{font-family:var(--mono);font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--bright);margin-left:6px;vertical-align:1px}
        .bnews{display:block;font-family:var(--mono);font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--text);margin-top:2px}
        .blinks a{color:var(--text);text-decoration:underline;text-underline-offset:2px}
        .blinks a:hover{color:var(--bright)}
        .bnota{font-size:15px;color:var(--text);line-height:1.5;margin-top:12px;text-align:center}
        .berro{font-size:15px;color:#F0A28A;margin-top:10px}
        .bib-ok .blista{grid-template-columns:1fr}
        @media (min-width:1024px){.ob-page{max-width:640px}}
        @media (max-width:430px){.blista{grid-template-columns:1fr}}

        /* Guia de outra newsletter na missão 2. */
        .outro{margin:0;padding:18px;border:1px solid var(--hair,rgba(128,128,128,.28));border-radius:14px}
        .outro-topo{display:flex;gap:16px;align-items:flex-start}
        .outro-capa{flex:0 0 104px;width:104px}
        .outro-capa img{display:block;width:100%;height:auto;border-radius:5px;box-shadow:0 12px 28px rgba(0,0,0,.35)}
        .outro-tag{font-family:var(--mono,ui-monospace,monospace);font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--bright);margin:0 0 6px}
        .outro h3{font-family:var(--serif);font-style:normal;font-weight:700;font-size:21px;line-height:1.25;letter-spacing:-.01em;margin:0 0 6px;color:#fff;text-wrap:balance}
        .outro-p{font-size:16px;line-height:1.55;color:var(--text,inherit);margin:0;text-wrap:pretty}
        .outro-meta{font-family:var(--mono,ui-monospace,monospace);font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:var(--text);margin:8px 0 0}
        @media (max-width:430px){.ob-recibo{gap:14px;padding:14px}.ob-capa{flex-basis:104px;width:104px}.ob-itens li{font-size:18px}.outro-topo{gap:13px}.outro-capa{flex-basis:92px;width:92px}.outro h3{font-size:19px}}
        /* celular (col/45, HC 29/09/26): nenhuma seção em duas colunas; capa em cima, texto embaixo, tudo centrado */
        @media (max-width:639px){
          .ob-recibo{flex-direction:column;align-items:center;gap:14px;text-align:center}
          .ob-recibo-txt{width:100%}
          .ob-itens{align-items:center}
          .ob-capa{flex:0 0 auto;width:128px}
          .outro-topo{flex-direction:column;align-items:center;gap:14px;text-align:center}
          .outro-topo>div{width:100%}
          .outro-capa{flex:0 0 auto;width:112px}
        }
        /* LEGIVEL-QUAD · computador (col/47, HC 30/09/26): cartões em quadrado, capa em cima, título e ficha centrados; acima de
           1024 px o topo da página (selo, kicker, título) aperta 46 px pra o botão da missão 1 caber em 1280 × 800 */
        @media (min-width:640px){
          .ob-recibo{flex-direction:column;align-items:center;gap:16px;text-align:center;padding:24px;border-radius:16px}
          .ob-recibo-txt{width:100%}
          .ob-itens{align-items:center}
          .ob-itens li{font-size:21px}
          .ob-capa{flex:0 0 auto;width:auto}
          .ob-capa img{width:auto;height:180px;margin:0 auto}
          .outro{border-radius:16px;padding:24px}
          .outro-topo{flex-direction:column;align-items:center;gap:16px;text-align:center}
          .outro-topo>div{width:100%}
          .outro-capa{flex:0 0 auto;width:auto}
          .outro-capa img{width:auto;height:160px;margin:0 auto}
          .outro h3{font-size:23px}
        }
        @media (min-width:1024px){
          .ob-page{padding-top:2rem}
          .ob-selo{margin-bottom:12px}
          .ob-page>.kicker{margin-bottom:8px}
          .ob-page>h1{margin-bottom:4px}
          .sec-1{margin-top:12px}
        }
      `}</style>
    </>
  );
}
