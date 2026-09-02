"use client";

import { useEffect, useRef, useState } from "react";
import { sendBeacon } from "./PageBeacon";

/* ============================================================
   LpWidgets · vitrine das LPs de venda (ebook premium e app), 02/09/26.
   - canto inferior direito: chat de dúvidas (Haiku, via Pharos /api/lp/chat),
     que chama o visitante depois de 60 s sem interação;
   - canto inferior esquerdo: prova social (compras ou visitantes via
     /api/lp/prova) + depoimentos selados da news em carrossel.
   Classes com prefixo lpw- pra não colidir com o globals.css da casa
   (.btn, .hero). Cor de acento entra por prop; o resto herda --bg/--text/
   --dim/--hair da página (com fallback). A EE é o golden e a fábrica copia
   este arquivo pras outras casas (build_lp_ebook_d.py).
   ============================================================ */

const PHAROS = "https://hc-pharos.vercel.app";
const OCIO_MS = 60_000; // HC: mais de 1 minuto sem interação = o chat chama
const GIRO_MS = 7_000; // troca de depoimento no carrossel
const MAX_TURNOS = 10; // perguntas por conversa; depois manda pro /contato
const FALHA = "Não consegui responder agora. Escreva pra gente pela página /contato.";

export type Depo = { x: string; who: string };
export type Ficha = {
  titulo: string;
  news: string;
  preco: string;
  cta: string;
  manchete?: string;
  sub?: string;
  specs?: string[];
  sumario?: string[];
  kit?: string[];
  faq?: { q: string; a: string }[];
  garantia?: string;
};
type Msg = { role: "user" | "assistant"; content: string };
type Prova = { compras?: string; visitantes?: string };

type EbookLike = {
  kicker?: string;
  titulo?: string;
  manchete?: string;
  subApoio?: string;
  specs?: { n: string; l: string }[];
  sumario?: { colunas?: { nome: string; itens: string[] }[] };
  kit?: { nome: string; desc: string }[];
  faq?: { itens?: { q: string; a: string }[] };
  garantia?: string;
  garantiaNome?: string;
};

/** Ficha do chat a partir do bloco EBOOK da página D (fábrica ou artesanal). */
export function fichaDoEbook(e: EbookLike, news: string, preco: string, cta: string): Ficha {
  return {
    titulo: e.titulo || e.kicker || "o guia",
    news,
    preco,
    cta,
    manchete: e.manchete,
    sub: e.subApoio,
    specs: (e.specs ?? []).map((s) => `${s.n} ${s.l}`),
    sumario: (e.sumario?.colunas ?? []).flatMap((c) => c.itens),
    kit: (e.kit ?? []).map((k) => `${k.nome}: ${k.desc}`),
    faq: e.faq?.itens ?? [],
    garantia: [e.garantiaNome, e.garantia].filter(Boolean).join(". "),
  };
}

type AppLike = {
  nome?: string;
  manchete?: string;
  sub?: string;
  specs?: { n: string; l: string }[];
  features?: { itens?: { nome: string; desc: string }[] };
  faq?: { itens?: { q: string; a: string }[] };
  garantia?: string;
  garantiaNome?: string;
};

/** Ficha do chat a partir do bloco APP da LP /app. */
export function fichaDoApp(a: AppLike, news: string, preco: string, cta: string): Ficha {
  return {
    titulo: a.nome ? `${a.nome} (app)` : "o app",
    news,
    preco,
    cta,
    manchete: a.manchete,
    sub: a.sub,
    specs: (a.specs ?? []).map((s) => `${s.n} ${s.l}`),
    kit: (a.features?.itens ?? []).map((f) => `${f.nome}: ${f.desc}`),
    faq: a.faq?.itens ?? [],
    garantia: [a.garantiaNome, a.garantia].filter(Boolean).join(". "),
  };
}

function corta(t: string, max = 150): string {
  if (t.length <= max) return t;
  const c = t.slice(0, max);
  return c.slice(0, Math.max(c.lastIndexOf(" "), 60)) + "…";
}

type Props = {
  slug: string;
  produto: "ebook" | "app";
  cor: string;
  corTexto?: string;
  cta: string;
  ficha: Ficha;
  depoimentos: Depo[];
};

export default function LpWidgets({ slug, produto, cor, corTexto = "#fff", cta, ficha, depoimentos }: Props) {
  const step = produto === "app" ? "app-lp" : "ebook-premium-d";
  const objeto = produto === "app" ? "o app" : "o guia";
  const sugestoes =
    produto === "app" ? ["Como instalo?", "Funciona no iPhone?", "Como pago?"] : ["Como pago?", "Como recebo?", "Tem garantia?"];

  const [aberto, setAberto] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [chamada, setChamada] = useState(false);
  const [prova, setProva] = useState<Prova | null>(null);
  const [provaOn, setProvaOn] = useState(true);
  // começa pelo último selado: no herói da D os dois primeiros já estão no tríptico
  const [idx, setIdx] = useState(Math.max(depoimentos.length - 1, 0));
  const [rolou, setRolou] = useState(false);
  const [celular, setCelular] = useState(false);
  // a D tem barra de compra fixa no celular (.dsticky); a vitrine sobe pra não cobri-la
  const [comSticky, setComSticky] = useState(false);
  const lista = useRef<HTMLDivElement>(null);
  const abertoRef = useRef(false);
  const perguntas = msgs.filter((m) => m.role === "user").length;
  const esgotou = perguntas >= MAX_TURNOS;

  // prova social: busca 1,5 s depois da carga, pra não disputar o LCP com a capa
  useEffect(() => {
    try {
      if (sessionStorage.getItem("lpw_prova_x")) setProvaOn(false);
    } catch {
      /* sessionStorage indisponível */
    }
    const t = setTimeout(() => {
      fetch(`${PHAROS}/api/lp/prova?slug=${encodeURIComponent(slug)}&produto=${produto}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((j: Prova | null) => {
          if (j && (j.compras || j.visitantes)) setProva(j);
        })
        .catch(() => {
          /* sem prova, sem placeholder */
        });
    }, 1500);
    return () => clearTimeout(t);
  }, [slug, produto]);

  // celular: o card de prova só entra depois que o CTA do herói sai da tela (senão
  // cobre o botão na primeira dobra) e some sozinho em 12 s; no desktop fica até o ×
  useEffect(() => {
    const mq = window.matchMedia("(max-width:760px)");
    setCelular(mq.matches);
    setComSticky(!!document.querySelector(".dsticky"));
    const el = document.querySelector(".btn-hero");
    if (!el) {
      setRolou(true);
      return;
    }
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting && e.boundingClientRect.top < 0) setRolou(true);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!celular || !rolou) return;
    const t = setTimeout(() => setProvaOn(false), 12_000);
    return () => clearTimeout(t);
  }, [celular, rolou]);

  // carrossel de depoimentos
  useEffect(() => {
    if (depoimentos.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % depoimentos.length), GIRO_MS);
    return () => clearInterval(t);
  }, [depoimentos.length]);

  // chamada por ócio: 60 s sem toque, rolagem ou tecla, uma vez por sessão
  useEffect(() => {
    try {
      if (sessionStorage.getItem("lpw_chamou")) return;
    } catch {
      /* segue sem memória de sessão */
    }
    let ultimo = Date.now();
    const toca = () => {
      ultimo = Date.now();
    };
    const evs: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "scroll", "touchstart"];
    evs.forEach((e) => window.addEventListener(e, toca, { passive: true }));
    let esconde: ReturnType<typeof setTimeout> | undefined;
    const t = setInterval(() => {
      if (abertoRef.current || document.hidden) {
        ultimo = Date.now();
        return;
      }
      if (Date.now() - ultimo < OCIO_MS) return;
      clearInterval(t);
      setChamada(true);
      try {
        sessionStorage.setItem("lpw_chamou", "1");
      } catch {
        /* idem */
      }
      esconde = setTimeout(() => setChamada(false), 15_000);
    }, 5_000);
    return () => {
      evs.forEach((e) => window.removeEventListener(e, toca));
      clearInterval(t);
      if (esconde) clearTimeout(esconde);
    };
  }, []);

  useEffect(() => {
    abertoRef.current = aberto;
    if (!aberto) return;
    setChamada(false);
    sendBeacon(slug, `${step}-chat`, { eventType: "apareceu" });
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [aberto, slug, step]);

  useEffect(() => {
    lista.current?.scrollTo({ top: lista.current.scrollHeight });
  }, [msgs, ocupado]);

  async function enviar(pergunta: string) {
    const p = pergunta.trim().slice(0, 600);
    if (!p || ocupado || esgotou) return;
    const novo: Msg[] = [...msgs, { role: "user", content: p }];
    setMsgs(novo);
    setTexto("");
    setOcupado(true);
    sendBeacon(slug, `${step}-chat`, { eventType: "converteu" });
    let journey: string | null = null;
    let internal = false;
    try {
      journey = sessionStorage.getItem("vdn_journey");
      internal = localStorage.getItem("vdn_internal") === "1";
    } catch {
      /* sem storage */
    }
    try {
      const ctl = new AbortController();
      const to = setTimeout(() => ctl.abort(), 25_000);
      const r = await fetch(`${PHAROS}/api/lp/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // os últimos 15 turnos: ímpar, então começa e termina em pergunta
        body: JSON.stringify({ slug, produto, ficha, mensagens: novo.slice(-15), journey, internal }),
        signal: ctl.signal,
      });
      clearTimeout(to);
      const j = r.ok ? ((await r.json()) as { resposta?: string }) : null;
      setMsgs([...novo, { role: "assistant", content: j?.resposta || FALHA }]);
    } catch {
      setMsgs([...novo, { role: "assistant", content: FALHA }]);
    }
    setOcupado(false);
  }

  const temProva = provaOn && (!celular || rolou) && (prova !== null || depoimentos.length > 0);
  const depo = depoimentos.length ? depoimentos[idx % depoimentos.length] : null;

  return (
    <div className={"lpw" + (comSticky ? " lpw-com-sticky" : "")} style={{ ["--lpw-acc" as string]: cor, ["--lpw-acc-text" as string]: corTexto }}>
      {temProva && (
        <aside className="lpw-prova" aria-live="polite">
          <button
            className="lpw-x"
            aria-label="Fechar"
            onClick={() => {
              setProvaOn(false);
              try {
                sessionStorage.setItem("lpw_prova_x", "1");
              } catch {
                /* idem */
              }
            }}
          >
            ×
          </button>
          {prova?.compras && (
            <p className="lpw-n">
              <i /> {prova.compras}
            </p>
          )}
          {prova?.visitantes && (
            <p className="lpw-n">
              <i /> {prova.visitantes}
            </p>
          )}
          {depo && (
            <figure key={idx} className="lpw-depo">
              <blockquote>&ldquo;{corta(depo.x)}&rdquo;</blockquote>
              <figcaption>{depo.who}</figcaption>
            </figure>
          )}
        </aside>
      )}

      {chamada && !aberto && (
        <button className="lpw-balao" onClick={() => setAberto(true)}>
          Alguma dúvida antes de decidir? Pergunte aqui.
        </button>
      )}

      <button
        className="lpw-fab"
        aria-label={aberto ? "Fechar o chat" : "Tirar uma dúvida"}
        aria-expanded={aberto}
        onClick={() => setAberto((a) => !a)}
      >
        {aberto ? (
          <span className="lpw-fx">×</span>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a8 8 0 0 1-8 8H8l-5 3 1.2-4.2A8 8 0 1 1 21 12z" />
            <path d="M8 11h8M8 14h5" />
          </svg>
        )}
      </button>

      {aberto && (
        <section className="lpw-chat" role="dialog" aria-label="Dúvidas sobre a compra">
          <header className="lpw-h">
            <div>
              <b>Dúvidas sobre {objeto}</b>
              <span>pagamento, entrega, garantia</span>
            </div>
            <button className="lpw-close" aria-label="Fechar o chat" onClick={() => setAberto(false)}>
              ×
            </button>
          </header>
          <div className="lpw-lista" ref={lista}>
            <div className="lpw-m lpw-bot">Oi! Tiro dúvidas rápidas sobre {objeto}: pagamento, entrega e garantia. O que você quer saber?</div>
            {msgs.map((m, i) => (
              <div key={i} className={"lpw-m " + (m.role === "user" ? "lpw-eu" : "lpw-bot")}>
                {m.content}
              </div>
            ))}
            {ocupado && (
              <div className="lpw-m lpw-bot lpw-dots" aria-label="escrevendo">
                <i />
                <i />
                <i />
              </div>
            )}
            {esgotou && (
              <div className="lpw-m lpw-bot">
                Pra continuar, escreva pra gente pela página <a href="/contato">/contato</a>.
              </div>
            )}
          </div>
          {msgs.length === 0 && (
            <div className="lpw-chips">
              {sugestoes.map((s) => (
                <button key={s} type="button" onClick={() => enviar(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <form
            className="lpw-form"
            onSubmit={(e) => {
              e.preventDefault();
              enviar(texto);
            }}
          >
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={600}
              placeholder="Sua dúvida antes de comprar"
              disabled={ocupado || esgotou}
              aria-label="Sua dúvida"
              autoFocus
            />
            <button type="submit" disabled={ocupado || esgotou || !texto.trim()} aria-label="Enviar">
              ➤
            </button>
          </form>
          <p className="lpw-pe">Resposta automática. O botão &ldquo;{cta.replace(" →", "")}&rdquo; abre o checkout.</p>
        </section>
      )}

      <style>{`
.lpw{font-family:var(--sans,Inter,system-ui,sans-serif)}
.lpw button{font-family:inherit}
.lpw-fab{position:fixed;right:18px;bottom:18px;z-index:70;width:56px;height:56px;border-radius:50%;border:0;background:var(--lpw-acc);color:var(--lpw-acc-text);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.35);transition:transform .15s ease}
.lpw-fab:hover{transform:translateY(-1px)}
.lpw-fab svg{width:26px;height:26px}
.lpw-fx{font-size:28px;line-height:1}
.lpw-balao{position:fixed;right:84px;bottom:26px;z-index:70;max-width:250px;background:var(--bg,#111);color:var(--text,#eee);border:1px solid var(--lpw-acc);border-radius:14px 14px 4px 14px;padding:10px 14px;font-size:13.5px;font-weight:500;line-height:1.4;text-align:left;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.35);animation:lpw-pop .3s ease}
@keyframes lpw-pop{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.lpw-chat{position:fixed;right:18px;bottom:86px;z-index:71;width:360px;max-width:calc(100vw - 36px);height:520px;max-height:calc(100vh - 110px);display:flex;flex-direction:column;background:var(--bg,#111);color:var(--text,#eee);border:1px solid var(--hair,rgba(255,255,255,.14));border-radius:16px;box-shadow:0 18px 48px rgba(0,0,0,.45);overflow:hidden;animation:lpw-pop .2s ease}
.lpw-h{padding:12px 14px 12px 16px;border-bottom:1px solid var(--hair,rgba(255,255,255,.14));display:flex;align-items:center;justify-content:space-between;gap:10px}
.lpw-h div{display:flex;flex-direction:column;gap:1px}
.lpw-h b{font-size:15px}.lpw-h span{font-size:12px;color:var(--dim,#999)}
.lpw-close{background:none;border:0;color:var(--dim,#999);font-size:24px;line-height:1;cursor:pointer;padding:2px 6px}
.lpw-lista{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px}
.lpw-m{max-width:88%;padding:9px 12px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-break:break-word}
.lpw-bot{align-self:flex-start;background:rgba(127,127,127,.14);border-bottom-left-radius:4px}
.lpw-eu{align-self:flex-end;background:var(--lpw-acc);color:var(--lpw-acc-text);border-bottom-right-radius:4px}
.lpw-m a{color:inherit;text-decoration:underline}
.lpw-dots{display:flex;gap:4px;padding:12px 14px}
.lpw-dots i{width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.5;animation:lpw-dot 1s infinite}
.lpw-dots i:nth-child(2){animation-delay:.15s}.lpw-dots i:nth-child(3){animation-delay:.3s}
@keyframes lpw-dot{0%,100%{opacity:.25}50%{opacity:.9}}
.lpw-chips{display:flex;gap:6px;flex-wrap:wrap;padding:0 14px 10px}
.lpw-chips button{font-size:12.5px;font-weight:500;padding:6px 10px;border-radius:99px;border:1px solid var(--lpw-acc);background:transparent;color:inherit;cursor:pointer}
.lpw-chips button:hover{background:var(--lpw-acc);color:var(--lpw-acc-text)}
.lpw-form{display:flex;gap:8px;padding:10px 12px 6px;border-top:1px solid var(--hair,rgba(255,255,255,.14))}
.lpw-form input{flex:1;min-width:0;font-family:inherit;font-size:14px;padding:10px 12px;border-radius:10px;border:1px solid var(--hair,rgba(255,255,255,.2));background:transparent;color:inherit}
.lpw-form input:focus{outline:2px solid var(--lpw-acc);outline-offset:1px}
.lpw-form button{width:42px;border-radius:10px;border:0;background:var(--lpw-acc);color:var(--lpw-acc-text);font-size:16px;cursor:pointer}
.lpw-form button:disabled{opacity:.45;cursor:default}
.lpw-pe{margin:0;padding:0 14px 10px;font-size:11px;color:var(--dim,#999)}
.lpw-prova{position:fixed;left:18px;bottom:18px;z-index:69;width:300px;max-width:calc(100vw - 110px);background:var(--bg,#111);color:var(--text,#eee);border:1px solid var(--hair,rgba(255,255,255,.14));border-radius:14px;padding:12px 34px 12px 14px;box-shadow:0 12px 32px rgba(0,0,0,.35);animation:lpw-pop .3s ease}
.lpw-x{position:absolute;top:6px;right:8px;background:none;border:0;color:var(--dim,#999);font-size:18px;line-height:1;cursor:pointer;padding:4px}
.lpw-n{margin:0 0 6px;font-size:12.5px;font-weight:600;line-height:1.35}
.lpw-n i{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--lpw-acc);margin-right:6px;vertical-align:1px}
.lpw-depo{margin:0;animation:lpw-fade .5s ease}
.lpw-depo blockquote{margin:0;font-family:var(--serif,Georgia,serif);font-style:italic;font-size:13px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.lpw-depo figcaption{margin-top:4px;font-size:11px;color:var(--dim,#999)}
@keyframes lpw-fade{from{opacity:0}to{opacity:1}}
@media(max-width:760px){
  .lpw-fab{right:12px;bottom:18px;width:50px;height:50px}
  .lpw-balao{right:12px;bottom:76px;max-width:240px;border-radius:14px 14px 14px 4px}
  .lpw-chat{right:0;left:0;bottom:0;width:auto;max-width:none;height:72vh;max-height:none;border-radius:16px 16px 0 0}
  .lpw-prova{left:12px;right:74px;bottom:18px;width:auto;max-width:none;padding:10px 30px 10px 12px}
  .lpw-com-sticky .lpw-fab{bottom:84px}
  .lpw-com-sticky .lpw-balao{bottom:142px}
  .lpw-com-sticky .lpw-prova{bottom:84px}
  .lpw-depo blockquote{-webkit-line-clamp:2;font-size:12.5px}
}
@media(prefers-reduced-motion:reduce){.lpw *{animation:none!important;transition:none!important}}
`}</style>
    </div>
  );
}
