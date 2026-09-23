"use client";

import { useEffect, useState } from "react";
import PageBeacon, { sendBeacon } from "../../PageBeacon";

/* TOKENS DA COLEÇÃO COMPLETA (colecao-rede, 22/09/26; a fábrica troca por casa) */
const COL = {
  slug: "notas-do-cafe",
  sc: "NC",
  news: "Notas do Café",
  kicker: "Coleção completa",
  n: "115",
  capa: "https://ecmveymyzdqiehvtqxms.supabase.co/storage/v1/object/public/assets/scriptorium/colecao/notas-do-cafe-capa.png",
  formato: "PDF, todas as edições em ordem",
  bumpTitulo: "Coleção completa · Brasa Certa",
  appUrl: "",
  remetente: "leia@notasdocafe.com.br",
  dominio: "notasdocafe.com.br",
  despedida: "Sem frescura. Bom café. Notas do Café",
};
const VALOR_COM_BUMP = 14550;

/* Missão 2 (obg/08): o guia da casa, o mesmo do popup de saída do checkout, com o preço da página do guia
   (a fábrica derruba a geração se a rota cobrar outro valor). Casa sem guia validado fica com ativo=false
   e a página tem 2 missões. */
const GUIA = {
  ativo: true,
  titulo: "Café de Balcão no Coador de Casa",
  resumo: "Guia completo, web + PDF.",
  capa: "/ebook-web/capa-notas-do-cafe.webp",
  preco: "R$ 47",
  url: "/ebook-premium/checkout?src=colecao-obrigado",
};

/* Missão 3 (obg/08): a pergunta de 1 clique. As respostas são as da rede (a coleção vende o mesmo argumento
   em toda casa); a taxonomia é a comum do /api/ebook/motivo e a versão diz que veio da coleção. */
const MOTIVOS = {
  versao: "nc-colecao-v1",
  pergunta: "O que te fez levar a coleção?",
  opcoes: [
    { k: "promessa", t: "Todas as edições em ordem, num PDF só" },
    { k: "dor", t: "Ler o que saiu antes de eu assinar" },
    { k: "ficha", t: "Guardar o arquivo, sem depender do email" },
    { k: "preco", t: "O preço, cobrado uma vez só" },
    { k: "outro", t: "Outro motivo" },
  ],
  campo: "Conta em uma frase",
  enviar: "Enviar",
};

/* Missão 1: o botão abre a caixa de email já buscando o email da casa, pelo DOMÍNIO (acha a entrega venha de
   leia@, hc@ ou subdomínio de envio). Gmail é o botão; Hotmail e Yahoo ficam como link. */
const BUSCA = encodeURIComponent(`from:${COL.dominio}`);
const EMAIL = {
  gmail: `https://mail.google.com/mail/u/0/?utm_source=${COL.dominio}&utm_medium=obrigado-colecao#search/${BUSCA}`,
  hotmail: `https://outlook.live.com/mail/0/search?q=${BUSCA}&utm_source=${COL.dominio}&utm_medium=obrigado-colecao`,
  yahoo: `https://mail.yahoo.com/d/search/keyword=${BUSCA}?utm_source=${COL.dominio}&utm_medium=obrigado-colecao`,
};

const PHAROS = process.env.NEXT_PUBLIC_PHAROS_URL || "https://hc-pharos.vercel.app";

/* A mesma regra do PageBeacon (?internal=1 grava, ?internal=0 apaga), inline: nem toda casa exporta isInternalAccess. */
const isInternalAccess = () => {
  try {
    const p = new URLSearchParams(window.location.search).get("internal");
    if (p === "1") localStorage.setItem("vdn_internal", "1");
    if (p === "0") localStorage.removeItem("vdn_internal");
    return localStorage.getItem("vdn_internal") === "1";
  } catch {
    return false;
  }
};

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

/* Rótulo da missão: mono, pequeno, na cor da casa; ganha «cumprida» quando a ação aconteceu. */
function Missao({ n, de, ok }: { n: number; de: number; ok?: boolean }) {
  return (
    <p className="mis-k">
      Missão {n} de {de}{ok && <span className="mis-ok"> · cumprida ✓</span>}
    </p>
  );
}

export default function ColecaoObrigado() {
  const [comBump, setComBump] = useState(false);
  const [sessionId, setSessionId] = useState("");
  // Missão 1 cumprida = tocou em abrir o email (ou o app, quando ele existe).
  const [abriu, setAbriu] = useState(false);
  // Pergunta de 1 clique: a escolha, o envio em curso, o «Anotado» e o campo do «Outro».
  const [motivo, setMotivo] = useState<string | null>(null);
  const [motivoEnviando, setMotivoEnviando] = useState(false);
  const [motivoOk, setMotivoOk] = useState(false);
  const [outroTexto, setOutroTexto] = useState("");
  const [outroEnviado, setOutroEnviado] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const sid = p.get("session_id");
    setSessionId(sid || "");
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

  function abrirEmail() {
    setAbriu(true);
    sendBeacon(COL.slug, "obrigado-abrir-email", { eventType: "converteu" });
  }

  /* Grava a resposta no Pharos com o session_id da compra. ?prova=<ticket> carimba a linha como prova, que se
     apaga pelo carimbo. Uma linha por compra (upsert): o «Outro» primeiro conta o toque e depois recebe a frase.
     Falha de rede: false, a página segue de pé. */
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
          sc: COL.sc,
          slug: COL.slug,
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
      if (!motivoOk) sendBeacon(COL.slug, "obrigado-motivo", { eventType: "converteu" });
      return true;
    } catch {
      return false;
    } finally {
      setMotivoEnviando(false);
    }
  }

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

  /* Casa sem guia validado: a página tem 2 missões, e o rótulo diz «de 2». */
  const totalMissoes = GUIA.ativo ? 3 : 2;

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

        {/* Missão 1 (HC 23/09/26): acessar a coleção. Recibo com a capa, o PDF que chega por email e o botão
            vazado que abre a caixa já buscando o email da casa. O preenchido é o da missão 2. */}
        <section className="sec sec-1" aria-label="Missão 1: acesse a sua coleção">
          <Missao n={1} de={totalMissoes} ok={abriu} />
          <h2 className="sec-t">Acesse a sua coleção</h2>
          <p className="sec-sub">
            O PDF chega neste email dentro de 24 horas da confirmação (no cartão e no Pix, normalmente em
            minutos; no boleto, quando compensar). O link é permanente e o arquivo é seu.
          </p>

          <div className="ob-recibo">
            <span className="ob-capa">
              <img src={COL.capa} alt={`Capa da Coleção completa da ${COL.news}`} width={96} height={128} loading="eager" />
            </span>
            <div className="ob-recibo-txt">
              <ul className="ob-itens">
                <li>Coleção completa da {COL.news}: {COL.n} edições num PDF</li>
                {comBump && COL.bumpTitulo && <li>{COL.bumpTitulo}: PDF em email separado</li>}
              </ul>
              <p className="ob-recibo-meta">{COL.formato}</p>
            </div>
          </div>

          {comBump && COL.appUrl && (
            <a className="ob-vazado" href={COL.appUrl} onClick={() => setAbriu(true)}>Abrir seu app →</a>
          )}

          <a className="ob-vazado" href={EMAIL.gmail} target="_blank" rel="noopener" onClick={abrirEmail}>
            Abrir meu email
          </a>
          <p className="ob-nota-btn">
            Abre o Gmail já buscando os emails de {COL.dominio}.
            <br />
            Uso <a href={EMAIL.hotmail} target="_blank" rel="noopener" onClick={abrirEmail}>Hotmail</a>
            {" · "}
            Uso <a href={EMAIL.yahoo} target="_blank" rel="noopener" onClick={abrirEmail}>Yahoo</a>
          </p>
        </section>

        {GUIA.ativo && (
          <section className="sec" aria-label="Missão 2: seu próximo passo">
            <Missao n={2} de={totalMissoes} />
            <h2 className="sec-t">Seu próximo passo</h2>
            <p className="sec-sub">O guia da {COL.news}: o método das edições, organizado pra aplicar.</p>

            <div className="outro" aria-label={`Guia ${GUIA.titulo}`}>
              <div className="outro-topo">
                <span className="outro-capa">
                  <img src={GUIA.capa} alt={`Capa do guia ${GUIA.titulo}`} width={76} height={101} loading="lazy" />
                </span>
                <div>
                  <p className="outro-tag">Guia {COL.news}</p>
                  <h3>{GUIA.titulo}</h3>
                  <p className="outro-p">{GUIA.resumo}</p>
                  <p className="outro-meta">Guia completo, web + PDF</p>
                </div>
              </div>
              <a
                className="ob-cheio"
                href={GUIA.url}
                onClick={() => sendBeacon(COL.slug, "obrigado-guia", { eventType: "converteu" })}
              >
                Levar por {GUIA.preco}
              </a>
              <p className="bnota">Abre o checkout do guia, com pix, cartão ou boleto.</p>
            </div>
          </section>
        )}

        {sessionId && (
          <section className="sec" aria-label={`Missão ${totalMissoes}: o que te fez levar a coleção`}>
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
          O email não apareceu? Confira spam e promoções. Ele sai de {COL.remetente}, o mesmo endereço da
          newsletter. Qualquer questão, responda o email da compra.
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
        .ob-page h1{font-family:var(--serif);font-style:italic;font-weight:900;font-size:clamp(1.9rem,5.2vw,2.6rem);color:#fff;letter-spacing:-.02em;margin-bottom:.4rem}
        .ob-nota{font-size:13px;color:var(--text-dim);line-height:1.6;margin-top:2.2rem}
        .ob-despedida{font-family:var(--serif);font-style:italic;font-size:1.05rem;color:var(--sage,var(--text-dim));margin-top:2.4rem}

        /* Missões (HC 23/09/26): três seções com filete + rótulo mono + subtítulo serif. A 1ª cola no H1. */
        .sec{border-top:1px solid var(--hair);margin-top:2.1rem;padding-top:1.6rem;text-align:left}
        .sec-1{border-top:0;margin-top:1.4rem;padding-top:0}
        .mis-k{font-family:var(--mono);font-size:10.5px;font-weight:500;letter-spacing:.22em;text-transform:uppercase;color:var(--bright);margin:0 0 7px}
        .mis-ok{color:var(--text-dim)}
        .sec-t{font-family:var(--serif);font-style:normal;font-weight:900;font-size:23px;line-height:1.2;color:#fff;letter-spacing:-.01em;margin:0 0 5px}
        .sec-sub{font-size:13.5px;color:var(--text-dim);line-height:1.5;margin:0 0 14px}

        /* Recibo: a capa da coleção + o que ela levou, como um checkout mostra o produto. */
        .ob-recibo{display:flex;gap:18px;align-items:center;margin:0;padding:16px 18px;border:1px solid var(--hair);border-radius:14px;background:rgba(255,255,255,.025)}
        .ob-capa{flex:0 0 92px;width:92px}
        .ob-capa img{display:block;width:100%;height:auto;border-radius:5px;box-shadow:0 14px 34px rgba(0,0,0,.5)}
        .ob-recibo-txt{min-width:0;flex:1}
        .ob-itens{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px;align-items:flex-start}
        .ob-itens li{font-family:var(--serif);font-weight:700;font-size:17px;line-height:1.25;color:#fff;letter-spacing:-.01em}
        .ob-itens li::before{content:"✓";color:var(--bright);font-weight:700;margin-right:8px}
        .ob-recibo-meta{font-family:var(--mono);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim);margin:10px 0 0}

        /* Dois pesos de botão, um por missão: vazado na 1 (abrir), cheio na 2 (levar). */
        .ob-vazado{display:block;margin-top:14px;padding:13px 16px;border:1px solid var(--bright);border-radius:11px;color:var(--bright);text-align:center;font-family:var(--sans,inherit);font-weight:700;font-size:14.5px;letter-spacing:-.01em;transition:background .15s ease}
        .ob-vazado:hover{background:color-mix(in srgb,var(--bright) 10%,transparent)}
        .ob-cheio{display:block;width:100%;margin-top:14px;padding:15px 18px;border:0;border-radius:11px;background:var(--bright);color:#140408;text-align:center;font-family:var(--sans,inherit);font-size:15.5px;font-weight:800;letter-spacing:-.01em;cursor:pointer;box-shadow:0 16px 40px color-mix(in srgb,var(--bright) 22%,transparent);transition:filter .15s ease,transform .15s ease}
        .ob-cheio:hover{filter:brightness(1.08);transform:translateY(-1px)}
        .ob-nota-btn{font-size:12px;color:var(--text-dim);line-height:1.55;text-align:center;margin:8px 0 0}
        .ob-nota-btn a{color:var(--bright);text-decoration:underline;text-underline-offset:2px}

        /* A pergunta de 1 clique. Uma coluna, altura de toque, cor de destaque só no escolhido. */
        .mot-ops{display:grid;gap:8px}
        .mot-op{display:flex;align-items:center;gap:11px;width:100%;min-height:48px;padding:11px 14px;border:1px solid var(--hair,rgba(128,128,128,.28));border-radius:11px;background:transparent;color:var(--text);font-family:var(--sans,inherit);font-size:14.5px;font-weight:600;line-height:1.3;text-align:left;cursor:pointer;transition:border-color .15s ease,background .15s ease}
        .mot-op:hover{border-color:var(--bright)}
        .mot-op:disabled{cursor:default}
        .mot-op.on{border-color:var(--bright);background:color-mix(in srgb,var(--bright) 12%,transparent);color:#fff}
        .mot-dot{flex:0 0 14px;width:14px;height:14px;border-radius:50%;border:1.5px solid var(--text-dim)}
        .mot-op.on .mot-dot{border-color:var(--bright);background:var(--bright);box-shadow:inset 0 0 0 3px var(--bg)}
        .mot-outro{display:grid;gap:8px;margin-top:2px}
        .mot-outro textarea{width:100%;min-height:88px;padding:12px 14px;border:1px solid var(--hair,rgba(128,128,128,.28));border-radius:11px;background:rgba(255,255,255,.03);color:#fff;font-family:var(--sans,inherit);font-size:16px;line-height:1.45;resize:vertical}
        .mot-outro textarea::placeholder{color:var(--text-dim)}
        .mot-outro textarea:focus{outline:none;border-color:var(--bright)}
        .mot-enviar{min-height:48px;padding:12px 18px;border:0;border-radius:11px;background:var(--bright);color:#140408;font-family:var(--sans,inherit);font-size:15px;font-weight:800;letter-spacing:-.01em;cursor:pointer;transition:filter .15s ease}
        .mot-enviar:hover{filter:brightness(1.08)}
        .mot-enviar:disabled{opacity:.5;cursor:default;filter:none}

        /* O guia da casa na missão 2. */
        .outro{margin:0;padding:18px;border:1px solid var(--hair,rgba(128,128,128,.28));border-radius:14px}
        .outro-topo{display:flex;gap:16px;align-items:flex-start}
        .outro-capa{flex:0 0 76px;width:76px}
        .outro-capa img{display:block;width:100%;height:auto;border-radius:5px;box-shadow:0 12px 28px rgba(0,0,0,.35)}
        .outro-tag{font-family:var(--mono,ui-monospace,monospace);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--bright);margin:0 0 6px}
        .outro h3{font-family:var(--serif);font-style:normal;font-weight:700;font-size:19px;line-height:1.25;letter-spacing:-.01em;margin:0 0 6px;color:#fff}
        .outro-p{font-size:13.5px;line-height:1.55;color:var(--text,inherit);margin:0}
        .outro-meta{font-family:var(--mono,ui-monospace,monospace);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim);margin:8px 0 0}
        .bnota{font-size:12.5px;color:var(--text-dim);line-height:1.5;margin-top:8px;text-align:center}
        @media (max-width:430px){.ob-recibo{gap:14px;padding:14px}.ob-capa{flex-basis:84px;width:84px}.ob-itens li{font-size:16px}.outro-topo{gap:13px}.outro-capa{flex-basis:66px;width:66px}.outro h3{font-size:17.5px}}
      `}</style>
    </>
  );
}
