"use client";

import { useEffect, useState } from "react";
import PageBeacon, { isInternalAccess, sendBeacon } from "../../PageBeacon";

/* ============================================================
   TOKENS DA NEWS (a fábrica troca por news)
   ============================================================ */
const EBOOK = {
  "slug": "notas-do-cafe",
  "titulo": "Café de Balcão no Coador de Casa",
  "kicker": "Guia Notas do Café",
  "capa": "/ebook-web/capa-notas-do-cafe.webp",
  "formato": "Guia completo, web + PDF",
  "appUrl": "/app/d25d111a",
  "remetente": "leia@notasdocafe.com.br",
  "dominio": "notasdocafe.com.br",
  "despedida": "Bom café. Até sábado."
};

/* Pergunta de 1 clique (obg/01, mapa obrigado-do-comprador): «o que te fez levar o ebook?»,
   a missão 3. As 4 respostas fixas saem dos argumentos da LP de venda servida da casa, na
   taxonomia comum da rede (k): promessa do hero, dor do mecanismo do problema, o trecho aberto
   na página e a ficha do que você leva. A 5ª, «Outro motivo», abre um campo de uma frase
   (HC 23/09/26). A resposta vai pro Pharos (/api/ebook/motivo) com o session_id da compra;
   tocar de novo troca a resposta. */
const MOTIVOS = {
  "sc": "NC",
  "versao": "nc-v1",
  "pergunta": "O que te fez levar o ebook?",
  "opcoes": [
    { "k": "promessa", "t": "Depois desse guia, o coador da cozinha vira xícara de balcão que você faz sozinho" },
    { "k": "amostra", "t": "A primeira variável, aberta na íntegra" },
    { "k": "ficha", "t": "O checklist da coada e a ficha da coada" },
    { "k": "prova", "t": "Os depoimentos de quem já lê a news" },
    { "k": "outro", "t": "Outro motivo" }
  ],
  "campo": "Conta em uma frase",
  "enviar": "Enviar"
};

/* Guia de OUTRA newsletter (EXP-079, c4-20k/125): card da missão 2, abaixo do bundle quando ele
   existe, apontando pro checkout que a outra casa já tem. A venda cai no ebook_purchases.src =
   obrigado-irma pelo caminho de sempre. Os tokens saem do mapa .wayfinder/c4-20k/assets/125-obrigado-irma.json
   (obrigado_irma.py); o preço é o que a ficha de lá cobra hoje. */
const OUTRO = {
  "ativo": true,
  "news": "Fotografia do Dia",
  "kicker": "Guia Fotografia do Dia",
  "titulo": "Vitrine de Mesa",
  "promessa": "As fotos que fazem o que está parado em casa vender no mesmo fim de semana.",
  "formato": "Guia completo, web + PDF",
  "preco": "R$ 47",
  "capa": "https://lp.fotografiadodia.com.br/ebook-web/capa-fotografia-do-dia.webp",
  "url": "https://lp.fotografiadodia.com.br/ebook-premium/checkout?src=obrigado-irma"
};

/* Missão 1 (HC 23/09/26): o botão abre a caixa de email já buscando o email da casa. A busca
   é pelo DOMÍNIO (from:engenhariadaescrita.com.br), que acha a entrega venha de leia@ (o sender
   da rede desde os tickets c1 «sender leia@»), de hc@ (o que a rota /abrir-email ainda diz) ou
   de subdomínio de envio; o remetente completo fica no texto, pra pessoa reconhecer o email.
   Gmail é o botão; Hotmail e Yahoo ficam como link, porque a página não sabe o provedor. */
const BUSCA = encodeURIComponent(`from:${EBOOK.dominio}`);
const EMAIL = {
  gmail: `https://mail.google.com/mail/u/0/?utm_source=${EBOOK.dominio}&utm_medium=obrigado#search/${BUSCA}`,
  hotmail: `https://outlook.live.com/mail/0/search?q=${BUSCA}&utm_source=${EBOOK.dominio}&utm_medium=obrigado`,
  yahoo: `https://mail.yahoo.com/d/search/keyword=${BUSCA}?utm_source=${EBOOK.dominio}&utm_medium=obrigado`,
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

/* Purchase no navegador. O event_id e o session_id do Stripe, o mesmo que o webhook
   central manda pela CAPI: a Meta recebe dos dois lados e conta uma venda so. O valor
   vem carimbado no return_url pelo create-session, que e quem sabe se teve bump. O
   snippet do pixel mora no layout com strategy afterInteractive, entao espera o fbq. */
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

export default function EbookObrigado() {
  // F5 na pagina de obrigado nao pode virar segunda venda no painel. O teto no valor
  // barra query forjada na URL; a fonte confiavel de receita e o Purchase da CAPI.
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
  // Bump = app do guia (c4-20k/20): o create-session carimba app=1 no return_url.
  const [temApp, setTemApp] = useState(false);
  // Missão 1 cumprida = tocou em abrir o email ou o app.
  const [abriu, setAbriu] = useState(false);
  // Pergunta de 1 clique (obg/01): a escolha, o envio em curso, o «Anotado» e o campo do «Outro».
  const [motivo, setMotivo] = useState<string | null>(null);
  const [motivoEnviando, setMotivoEnviando] = useState(false);
  const [motivoOk, setMotivoOk] = useState(false);
  const [outroTexto, setOutroTexto] = useState("");
  const [outroEnviado, setOutroEnviado] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const sid = q.get("session_id") || "";
    setSessionId(sid);
    setTemApp(q.get("app") === "1");
    // Volta do checkout do fallback (boleto/3DS): a compra já foi feita lá.
    if (q.get("biblioteca") === "ok") setLiberada(true);
    if (!sid) return;
    fetch(`${PHAROS}/api/ebook/cart?session_id=${encodeURIComponent(sid)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Carrinho | null) => d && setCarrinho(d))
      .catch(() => undefined);
  }, []);

  function abrirEmail() {
    setAbriu(true);
    sendBeacon(EBOOK.slug, "obrigado-abrir-email", { eventType: "converteu" });
  }

  /* Grava a resposta no Pharos com o session_id da compra; a jornada e a origem são as
     mesmas do beacon (sessionStorage). ?prova=<ticket> carimba a linha como prova, que se
     apaga pelo carimbo; o leitor nunca tem esse parâmetro. Uma linha por compra: a última
     gravação vale (upsert), e é assim que o «Outro» primeiro conta o toque e depois recebe
     a frase. Falha de rede: devolve false e a página segue de pé. */
  async function gravar(k: string, t: string | null): Promise<boolean> {
    if (!sessionId) return false;
    setMotivoEnviando(true);
    try {
      const q = new URLSearchParams(window.location.search);
      const prova = (q.get("prova") || "").trim();
      let journey: string | null = null;
      let src: string | null = null;
      try {
        journey = sessionStorage.getItem("vdn_journey");
        src = sessionStorage.getItem("vdn_source");
      } catch {
        /* storage bloqueado: vai sem jornada */
      }
      const r = await fetch(`${PHAROS}/api/ebook/motivo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          sc: MOTIVOS.sc,
          slug: EBOOK.slug,
          resposta: k,
          texto: t,
          versao: MOTIVOS.versao,
          journey_id: journey,
          src,
          internal: isInternalAccess(),
          fonte: /^[a-z0-9-]{1,30}$/.test(prova) ? `prova-${prova}` : undefined,
        }),
      });
      if (!r.ok) throw new Error(String(r.status));
      if (!motivoOk) sendBeacon(EBOOK.slug, "obrigado-motivo", { eventType: "converteu" });
      return true;
    } catch {
      return false;
    } finally {
      setMotivoEnviando(false);
    }
  }

  /* Um toque numa resposta. O «Outro motivo» grava o toque na hora (sem frase) e abre o campo;
     a frase, quando vier, entra por cima na mesma linha. */
  async function responder(o: { k: string; t: string }) {
    if (motivoEnviando || motivo === o.k) return;
    const antes = motivo;
    setMotivo(o.k);
    if (o.k === "outro") setOutroEnviado(false);
    const ok = await gravar(o.k, o.k === "outro" ? null : o.t);
    if (ok) setMotivoOk(true);
    else setMotivo(antes);
  }

  async function enviarOutro() {
    const t = outroTexto.trim();
    if (!t || motivoEnviando || outroEnviado) return;
    const ok = await gravar("outro", t);
    if (ok) {
      setMotivoOk(true);
      setOutroEnviado(true);
    }
  }

  const motivoSub = !motivoOk
    ? "Um toque só."
    : motivo === "outro" && !outroEnviado
      ? "Anotado. Se quiser, conta em uma frase."
      : "Anotado. Obrigado por contar.";

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

  /* EXP-079: o link do guia de outra newsletter leva a jornada junto (?j=), pra venda no checkout de lá
     ficar colada a esta obrigado; a origem viaja em src=obrigado-irma. */
  const [outroHref, setOutroHref] = useState(OUTRO.url);
  useEffect(() => {
    try {
      const j = sessionStorage.getItem("vdn_journey");
      if (j) setOutroHref(`${OUTRO.url}&j=${encodeURIComponent(j)}`);
    } catch {
      /* storage bloqueado: o link segue só com o src */
    }
  }, []);
  // O guia que já veio nesta compra não é oferecido de novo.
  const jaLevouOutro = Boolean(carrinho?.comprados?.some((c) => c.news === OUTRO.news));
  // A missão 2 só existe quando tem o que oferecer.
  const temProximoPasso = (mostraBiblioteca && Boolean(oferta)) || (mostraOferta && Boolean(oferta)) || (OUTRO.ativo && !jaLevouOutro);
  // Casa sem par no mapa do EXP-079 e sessão sem bundle: a página tem 2 missões, e o rótulo diz «de 2».
  const totalMissoes = temProximoPasso ? 3 : 2;

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

        {/* Missão 1 (HC 23/09/26): acessar o ebook. Recibo com a capa, como um checkout mostra o
            produto, e o botão que abre o email já buscando o remetente. Botão vazado: o preenchido
            é o da missão 2. */}
        <section className="sec sec-1" aria-label="Missão 1: acesse o seu ebook">
          <Missao n={1} de={totalMissoes} ok={abriu} />
          <h2 className="sec-t">Acesse o seu ebook</h2>
          <p className="sec-sub">
            {levados.length > 1 ? "Os dois chegam" : "Chega"} no seu email em alguns minutos: o
            link permanente da versão web e o PDF pra guardar.
          </p>

          <div className="ob-recibo">
            <span className="ob-capa">
              <img src={EBOOK.capa} alt={`Capa do guia ${EBOOK.titulo}`} width={96} height={128} loading="eager" />
            </span>
            <div className="ob-recibo-txt">
              <ul className="ob-itens">
                {levados.map((nome) => (
                  <li key={nome}>{nome}</li>
                ))}
                {temApp && <li>O app do guia</li>}
              </ul>
              <p className="ob-recibo-meta">{EBOOK.formato}</p>
            </div>
          </div>

          {temApp && (
            <>
              <a className="ob-vazado" href={EBOOK.appUrl || "/app"} onClick={() => setAbriu(true)}>Abrir seu app →</a>
              <p className="ob-nota-btn">
                Entre com o email desta compra: é ele que destranca o guia no app. O mesmo link
                chega no seu email, com o passo a passo pra deixar na tela inicial.
              </p>
            </>
          )}

          <a className="ob-vazado" href={EMAIL.gmail} target="_blank" rel="noopener" onClick={abrirEmail}>
            Abrir meu email
          </a>
          <p className="ob-nota-btn">
            Abre o Gmail já buscando os emails de {EBOOK.dominio}.
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
                ? "O bundle com o seu guia já abatido, ou o guia que continua este."
                : "O guia que continua o que você acabou de levar."}
            </p>

            {mostraBiblioteca && oferta && (
              <div className="bib bib-ok">
                <p className="btag">Bundle liberado</p>
                <h3>{oferta.nome}</h3>
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
              </div>
            )}

            {mostraOferta && oferta && (
              <div className="bib">
                <p className="btag">Só nesta página</p>
                <h3>{oferta.nome}</h3>
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
                  onClick={() => sendBeacon(EBOOK.slug, "obrigado-irma", { eventType: "converteu" })}
                >
                  Levar por {OUTRO.preco}
                </a>
                <p className="bnota">Abre o checkout do guia, com pix, cartão ou boleto.</p>
              </div>
            )}
          </section>
        )}

        {sessionId && (
          <section className="sec" aria-label={`Missão ${totalMissoes}: o que te fez levar o ebook`}>
            <Missao n={totalMissoes} de={totalMissoes} ok={motivoOk} />
            <h2 className="sec-t">{MOTIVOS.pergunta}</h2>
            <p className="sec-sub" aria-live="polite">{motivoSub}</p>
            <div className="mot-ops" role="group" aria-label={MOTIVOS.pergunta}>
              {MOTIVOS.opcoes.map((o) => (
                <button
                  key={o.k}
                  type="button"
                  className={"mot-op" + (motivo === o.k ? " on" : "")}
                  aria-pressed={motivo === o.k}
                  disabled={motivoEnviando}
                  onClick={() => responder(o)}
                >
                  <span className="mot-dot" aria-hidden="true" />
                  {o.t}
                </button>
              ))}
              {motivo === "outro" && (
                <div className="mot-outro">
                  <textarea
                    aria-label={MOTIVOS.campo}
                    placeholder={MOTIVOS.campo}
                    maxLength={300}
                    rows={3}
                    value={outroTexto}
                    onChange={(e) => {
                      setOutroTexto(e.target.value);
                      setOutroEnviado(false);
                    }}
                  />
                  <button
                    type="button"
                    className="mot-enviar"
                    disabled={!outroTexto.trim() || motivoEnviando || outroEnviado}
                    onClick={enviarOutro}
                  >
                    {outroEnviado ? "Enviado ✓" : MOTIVOS.enviar}
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        <p className="ob-nota">
          Não apareceu? Confira spam e promoções. O email sai de {EBOOK.remetente}, o mesmo
          endereço da newsletter que você já recebe.
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
        .ob-selo{width:52px;height:52px;margin:0 auto 1.3rem;border-radius:50%;background:rgba(200,125,146,.12);border:1px solid var(--bright);color:var(--bright);font-size:24px;font-weight:700;display:flex;align-items:center;justify-content:center}
        .ob-page .kicker{display:block;margin-bottom:.8rem}
        .ob-page h1{font-family:var(--serif);font-style:italic;font-weight:900;font-size:clamp(1.9rem,5.2vw,2.6rem);color:#fff;letter-spacing:-.02em;margin-bottom:.4rem}
        .ob-nota{font-size:13px;color:var(--text-dim);line-height:1.6;margin-top:2.2rem}
        .ob-despedida{font-family:var(--serif);font-style:italic;font-size:1.05rem;color:var(--sage,var(--text-dim));margin-top:2.4rem}

        /* Missões (HC 23/09/26): três seções com filete + rótulo mono + subtítulo serif. A 1ª não
           leva filete, cola no H1. */
        .sec{border-top:1px solid var(--hair);margin-top:2.1rem;padding-top:1.6rem;text-align:left}
        .sec-1{border-top:0;margin-top:1.4rem;padding-top:0}
        .mis-k{font-family:var(--mono);font-size:10.5px;font-weight:500;letter-spacing:.22em;text-transform:uppercase;color:var(--bright);margin:0 0 7px}
        .mis-ok{color:var(--text-dim)}
        .sec-t{font-family:var(--serif);font-style:normal;font-weight:900;font-size:23px;line-height:1.2;color:#fff;letter-spacing:-.01em;margin:0 0 5px}
        .sec-sub{font-size:13.5px;color:var(--text-dim);line-height:1.5;margin:0 0 14px}

        /* Recibo: capa + o que ela levou, como um checkout mostra o produto. */
        .ob-recibo{display:flex;gap:18px;align-items:center;margin:0;padding:16px 18px;border:1px solid var(--hair);border-radius:14px;background:rgba(255,255,255,.025)}
        .ob-capa{flex:0 0 92px;width:92px}
        .ob-capa img{display:block;width:100%;height:auto;border-radius:5px;box-shadow:0 14px 34px rgba(0,0,0,.5)}
        .ob-recibo-txt{min-width:0;flex:1}
        .ob-itens{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px;align-items:flex-start}
        .ob-itens li{font-family:var(--serif);font-weight:700;font-size:18px;line-height:1.25;color:#fff;letter-spacing:-.01em}
        .ob-itens li::before{content:"✓";color:var(--bright);font-weight:700;margin-right:8px}
        .ob-recibo-meta{font-family:var(--mono);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim);margin:10px 0 0}

        /* Dois pesos de botão, um por missão: vazado na 1 (acessar), cheio na 2 (levar). */
        .ob-vazado{display:block;margin-top:14px;padding:13px 16px;border:1px solid var(--bright);border-radius:11px;color:var(--bright);text-align:center;font-family:var(--sans,inherit);font-weight:700;font-size:14.5px;letter-spacing:-.01em;transition:background .15s ease}
        .ob-vazado:hover{background:rgba(200,125,146,.10)}
        .ob-cheio{display:block;width:100%;margin-top:14px;padding:15px 18px;border:0;border-radius:11px;background:var(--bright);color:#140408;text-align:center;font-family:var(--sans,inherit);font-size:15.5px;font-weight:800;letter-spacing:-.01em;cursor:pointer;box-shadow:0 16px 40px rgba(200,125,146,.22);transition:filter .15s ease,transform .15s ease}
        .ob-cheio:hover{filter:brightness(1.08);transform:translateY(-1px)}
        .ob-cheio:disabled{opacity:.6;cursor:default;transform:none}
        .ob-nota-btn{font-size:12px;color:var(--text-dim);line-height:1.55;text-align:center;margin:8px 0 0}
        .ob-nota-btn a{color:var(--bright);text-decoration:underline;text-underline-offset:2px}

        /* obg/01: a pergunta de 1 clique. Uma coluna, altura de toque, cor de destaque só no
           escolhido (a cor de ação é da interação). O «Outro motivo» abre um campo de uma frase. */
        .mot-ops{display:grid;gap:8px}
        .mot-op{display:flex;align-items:center;gap:11px;width:100%;min-height:48px;padding:11px 14px;border:1px solid var(--hair,rgba(128,128,128,.28));border-radius:11px;background:transparent;color:var(--text);font-family:var(--sans,inherit);font-size:14.5px;font-weight:600;line-height:1.3;text-align:left;cursor:pointer;transition:border-color .15s ease,background .15s ease}
        .mot-op:hover{border-color:var(--bright)}
        .mot-op:disabled{cursor:default}
        .mot-op.on{border-color:var(--bright);background:rgba(200,125,146,.12);color:#fff}
        .mot-dot{flex:0 0 14px;width:14px;height:14px;border-radius:50%;border:1.5px solid var(--text-dim)}
        .mot-op.on .mot-dot{border-color:var(--bright);background:var(--bright);box-shadow:inset 0 0 0 3px var(--bg)}
        .mot-outro{display:grid;gap:8px;margin-top:2px}
        .mot-outro textarea{width:100%;min-height:88px;padding:12px 14px;border:1px solid var(--hair,rgba(128,128,128,.28));border-radius:11px;background:rgba(255,255,255,.03);color:#fff;font-family:var(--sans,inherit);font-size:16px;line-height:1.45;resize:vertical}
        .mot-outro textarea::placeholder{color:var(--text-dim)}
        .mot-outro textarea:focus{outline:none;border-color:var(--bright)}
        .mot-enviar{min-height:48px;padding:12px 18px;border:0;border-radius:11px;background:var(--bright);color:#140408;font-family:var(--sans,inherit);font-size:15px;font-weight:800;letter-spacing:-.01em;cursor:pointer;transition:filter .15s ease}
        .mot-enviar:hover{filter:brightness(1.08)}
        .mot-enviar:disabled{opacity:.5;cursor:default;filter:none}

        .bib{margin:0 0 .9rem;padding:22px 22px 24px;border:1px solid var(--bright);border-radius:14px;background:rgba(200,125,146,.12)}
        .bib .btag{font-family:var(--mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--bright);margin-bottom:10px}
        .bib h3{font-family:var(--serif);font-weight:900;font-size:22px;color:#fff;letter-spacing:-.01em;margin-bottom:8px}
        .bsub{font-size:14px;color:var(--text);line-height:1.6}
        .bpreco{display:flex;align-items:baseline;gap:10px;margin:16px 0 4px;font-variant-numeric:tabular-nums}
        .bpreco s{font-size:16px;color:var(--text-dim)}
        .bpreco b{font-size:32px;font-weight:800;color:var(--bright);letter-spacing:-.02em}
        .bdesc{font-size:13px;color:var(--text);line-height:1.55;margin-bottom:14px}
        .blista{list-style:none;padding:0;margin:14px 0 4px;display:grid;grid-template-columns:1fr 1fr;gap:6px 14px}
        .blista li{font-size:13px;color:var(--text);line-height:1.45;padding-left:14px;position:relative}
        .blista li::before{content:"›";position:absolute;left:0;color:var(--bright)}
        .blista li.tem{color:var(--text-dim)}
        .blista .tag{font-family:var(--mono);font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--bright);margin-left:6px;vertical-align:1px}
        .bnews{display:block;font-family:var(--mono);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim);margin-top:1px}
        .blinks a{color:var(--text);text-decoration:underline;text-underline-offset:2px}
        .blinks a:hover{color:var(--bright)}
        .bnota{font-size:12.5px;color:var(--text-dim);line-height:1.5;margin-top:8px;text-align:center}
        .berro{font-size:13px;color:#F0A28A;margin-top:10px}
        .bib-ok .blista{grid-template-columns:1fr}
        @media (max-width:430px){.blista{grid-template-columns:1fr}}

        /* EXP-079: guia de outra newsletter na missão 2, abaixo do bundle quando ele existe. Variáveis com
           fallback porque nem toda casa define --hair/--mono. */
        .outro{margin:0;padding:18px;border:1px solid var(--hair,rgba(128,128,128,.28));border-radius:14px}
        .outro-topo{display:flex;gap:16px;align-items:flex-start}
        .outro-capa{flex:0 0 76px;width:76px}
        .outro-capa img{display:block;width:100%;height:auto;border-radius:5px;box-shadow:0 12px 28px rgba(0,0,0,.35)}
        .outro-tag{font-family:var(--mono,ui-monospace,monospace);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--bright);margin:0 0 6px}
        .outro h3{font-family:var(--serif);font-style:normal;font-weight:700;font-size:19px;line-height:1.25;letter-spacing:-.01em;margin:0 0 6px;color:#fff}
        .outro-p{font-size:13.5px;line-height:1.55;color:var(--text,inherit);margin:0}
        .outro-meta{font-family:var(--mono,ui-monospace,monospace);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim);margin:8px 0 0}
        @media (max-width:430px){.ob-recibo{gap:14px;padding:14px}.ob-capa{flex-basis:84px;width:84px}.ob-itens li{font-size:17px}.outro-topo{gap:13px}.outro-capa{flex-basis:66px;width:66px}.outro h3{font-size:17.5px}}
      `}</style>
    </>
  );
}
