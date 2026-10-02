"use client";

import { useEffect, useRef, useState } from "react";
import { isInternalAccess, sendBeacon, sendCtaPos } from "./PageBeacon";

/* ============================================================
   LpWidgets · vitrine das LPs de venda (ebook premium e app), 02/09/26.
   - canto inferior direito: chat de dúvidas (Haiku, via Pharos /api/lp/chat),
     que chama o visitante depois de 60 s sem interação;
   - `local="checkout"` (19/09/26): o mesmo chat na página de checkout, enxuto.
     Sem card de prova e sem botão de compra (a pessoa já está no formulário),
     beacons próprios (`ebook-checkout-chat`, `app-checkout-chat`), o atendente
     recebe `local` e leva ao formulário. No celular o botão some enquanto o foco
     está dentro do formulário da Stripe, pra nunca cobrir campo nem o "Pagar";
   - canto inferior esquerdo (bui/54, 01/10/26): a PÍLULA de prova social, uma
     mensagem por vez no padrão do ProveSource e da Proof (ícone, 2 linhas, selo
     «✓ dado verificado»). As mensagens vêm prontas da /api/lp/prova (`itens`:
     nota, voto recente, leitores do dia, compra recente, depoimento curto, as
     etiquetas de compras e visitas) mais o tamanho da casa que a página passa
     por prop. Ritmo decidido pelo HC (ajustado 01/10/26): entra aos 5 s (no
     celular, 2 s depois que o botão do herói sai da tela), 6 s na tela, 4 s de
     pausa (troca a cada 10 s), teto de 4 por sessão, pausa com o mouse em cima,
     × encerra na sessão. Medição: beacon
     `<step>-prova` apareceu (1ª mensagem) e converteu (×); 1 em 5 jornadas fica
     sem pílula e manda `<step>-prova-sem` (grupo de comparação). Rota antiga,
     sem `itens`: cai nas etiquetas e nos depoimentos selados de até 90 letras.
     Depoimento entre aspas curvas “ ” (HC 01/10/26); o filtro do herói aceita « » e “ ”.
     Rollout pras outras casas: bui/55, fábrica .wayfinder/build-ebooks-premium/assets/rollout/pilula/.
   Classes com prefixo lpw- pra não colidir com o globals.css da casa
   (.btn, .hero). Cor de acento entra por prop; o resto herda --bg/--text/
   --dim/--hair da página (com fallback). A EE é o golden e a fábrica copia
   este arquivo pras outras casas (build_lp_ebook_d.py).
   ============================================================ */

const PHAROS = "https://hc-pharos.vercel.app";
const OCIO_MS = 60_000; // HC: mais de 1 minuto sem interação = o chat chama
// Checkout: com o foco dentro do iframe da Stripe a página não enxerga toque nem tecla,
// e preencher o cartão leva mais de 1 min. Ali a chamada espera o dobro.
const OCIO_FORM_MS = 120_000;
// pílula de prova (bui/54): ritmo decidido pelo HC no report de 01/10/26
const PROVA_INICIO_MS = 5_000; // computador: 5 s depois da carga (HC 01/10: 8 s era demorado)
const PROVA_INICIO_CEL_MS = 2_000; // celular: 2 s depois que o botão do herói saiu da tela
const PROVA_TELA_MS = 6_000;
const PROVA_PAUSA_MS = 4_000; // 6 s na tela + 4 s de pausa = troca a cada 10 s (HC 01/10)
const PROVA_HOVER_MS = 3_000; // mouse em cima segura; ao sair, mais 3 s
const PROVA_TETO = 4; // mensagens por sessão
const PROVA_UM_EM = 5; // 1 em cada 5 jornadas fica sem pílula (grupo de comparação)
const DEPO_MAX = 90; // frase inteira na pílula, nunca cortada
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
type Item = { k: string; t: string; s: string };
type Prova = { compras?: string; visitantes?: string; depoimentos?: Depo[]; itens?: Item[] };

// ícones da pílula, por chave da mensagem (traço simples, herdam a cor do círculo)
const ICONE: Record<string, React.ReactNode> = {
  nota: <path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9l-5.3 2.7 1-5.8L3.5 9.7l5.9-.9z" fill="currentColor" stroke="none" />,
  voto: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.3 12.3l2.5 2.5 4.9-5.3" />
    </>
  ),
  abert: (
    <>
      <path d="M3.5 9.5L12 4l8.5 5.5V19a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z" />
      <path d="M3.5 9.5L12 15l8.5-5.5" />
    </>
  ),
  compra: (
    <>
      <path d="M5.5 8h13l-1 12h-11z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </>
  ),
  depo: <path d="M5 17c2.5-1 4-3 4-6V7H5v4h2c0 1.5-.8 2.6-2 3.2zM14 17c2.5-1 4-3 4-6V7h-4v4h2c0 1.5-.8 2.6-2 3.2z" fill="currentColor" stroke="none" />,
  casa: (
    <>
      <circle cx="9" cy="9" r="3" />
      <path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5" />
      <circle cx="16.5" cy="8" r="2.3" />
      <path d="M15.5 13.6c2.6.1 4.3 1.6 5 4.4" />
    </>
  ),
  visitas: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
};
ICONE.compras = ICONE.compra;

/** Rodízio por jornada (bui/58, HC 01/10/26): com teto de 4 por visita e ordem fixa, as mensagens
 *  5 a 8 (tamanho da casa, depoimento, compras e visitas acumuladas) nunca apareciam. A nota fica
 *  sempre primeiro; as outras embaralham com semente da jornada (estável na sessão, recarga continua
 *  o rodízio) e cada visitante vê 3 delas, então a rede inteira vê as 8. */
function rodizio(lista: Item[]): Item[] {
  const primeira = lista.findIndex((i) => i.k === "nota");
  const topo = primeira >= 0 ? [lista[primeira]] : [];
  const resto = lista.filter((_, n) => n !== primeira);
  let h = 0;
  try {
    const j = sessionStorage.getItem("vdn_journey") || sessionStorage.getItem("lpw_prova_semente") || String(Math.random());
    sessionStorage.setItem("lpw_prova_semente", j);
    for (let i = 0; i < j.length; i++) h = (h * 31 + j.charCodeAt(i)) >>> 0;
  } catch {
    h = Math.floor(Math.random() * 2 ** 32);
  }
  for (let i = resto.length - 1; i > 0; i--) {
    h = (Math.imul(h ^ (h >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    const k = h % (i + 1);
    [resto[i], resto[k]] = [resto[k], resto[i]];
  }
  return [...topo, ...resto];
}

/** 1 em cada 5 jornadas fica sem pílula, decidido uma vez pela jornada do beacon (estável na sessão).
 *  Visita interna (vdn_internal, já fora da medição) e `?prova=1` (conferência em qualquer aparelho)
 *  sempre veem: em 01/10/26 o HC caiu no «sem» na primeira olhada e a pílula «não apareceu». */
function grupoProva(): "com" | "sem" {
  try {
    if (new URLSearchParams(window.location.search).get("prova") === "1") {
      sessionStorage.removeItem("lpw_prova_n");
      sessionStorage.removeItem("lpw_prova_i");
      sessionStorage.removeItem("lpw_pil_x");
      return "com";
    }
    if (isInternalAccess()) return "com";
    const g = sessionStorage.getItem("lpw_prova_grupo");
    if (g === "com" || g === "sem") return g;
    const j = sessionStorage.getItem("vdn_journey") || String(Math.random());
    let h = 0;
    for (let i = 0; i < j.length; i++) h = (h * 31 + j.charCodeAt(i)) >>> 0;
    const novo = h % PROVA_UM_EM === 0 ? "sem" : "com";
    sessionStorage.setItem("lpw_prova_grupo", novo);
    return novo;
  } catch {
    return "com";
  }
}

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

/** página de venda do VDN (bui/57): só a pílula, sem chat; a rota lê o dado pelo produto */
type ProdutoVdn = "curso" | "ws" | "news-agents" | "apollo" | "escritor";

type Props = {
  slug: string;
  /** "colecao" (bui/56) = LP /colecao: só a pílula, sem chat (a ficha do chat é a do guia e do app).
   *  Produto do VDN (bui/57): só a pílula, beacons `<slug>-prova` e `<slug>-prova-sem`. */
  produto: "ebook" | "app" | "colecao" | ProdutoVdn;
  cor: string;
  corTexto?: string;
  /** "checkout" = só o chat, sem prova nem botão de compra; cta, ficha e depoimentos ficam de fora */
  local?: "lp" | "checkout";
  cta?: string;
  /** href do checkout: o botão de compra vive dentro do chat (HC 02/09: chat vende, não dá suporte) */
  checkout?: string;
  ficha?: Ficha;
  depoimentos?: Depo[];
  /** tamanho da casa, o mesmo número da barra do topo (ex.: «3,8 mil leitores recebem a news todo dia») */
  casa?: { t: string; s: string };
};

const SEM_DEPOS: Depo[] = [];

function focoNoForm(): boolean {
  return document.activeElement?.tagName === "IFRAME";
}

export default function LpWidgets({ slug, produto, cor, corTexto = "#fff", local = "lp", cta = "", checkout, ficha, depoimentos = SEM_DEPOS, casa }: Props) {
  const noCheckout = local === "checkout";
  const daCasa = produto === "ebook" || produto === "app" || produto === "colecao";
  const step = !daCasa
    ? slug
    : noCheckout
    ? produto === "app" ? "app-checkout" : produto === "colecao" ? "colecao-checkout" : "ebook-checkout"
    : produto === "app" ? "app-lp" : produto === "colecao" ? "colecao-lp" : "ebook-premium-d";
  const objeto = produto === "app" ? "o app" : produto === "colecao" ? "a coleção" : "o guia";
  const comChat = produto === "ebook" || produto === "app";
  const sugestoes =
    produto === "app" ? ["Como instalo?", "Funciona no iPhone?", "Como pago?"] : ["Como pago?", "Como recebo?", "Tem garantia?"];

  const [aberto, setAberto] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [chamada, setChamada] = useState(false);
  const [provaOn, setProvaOn] = useState(true);
  // as mensagens da pílula, na ordem; o rodízio começa quando a lista chega
  const [itens, setItens] = useState<Item[]>([]);
  const [atual, setAtual] = useState<Item | null>(null);
  const [visivel, setVisivel] = useState(false);
  const hover = useRef(false);
  const [rolou, setRolou] = useState(false);
  const [celular, setCelular] = useState(false);
  // a D tem barra de compra fixa no celular (.dsticky); a vitrine sobe pra não cobri-la
  const [comSticky, setComSticky] = useState(false);
  // checkout no celular: foco dentro do formulário da Stripe = o botão do chat sai da frente
  const [noForm, setNoForm] = useState(false);
  const lista = useRef<HTMLDivElement>(null);
  const abertoRef = useRef(false);
  const perguntas = msgs.filter((m) => m.role === "user").length;
  const esgotou = perguntas >= MAX_TURNOS;

  // prova social: busca 1,5 s depois da carga, pra não disputar o LCP com a capa
  useEffect(() => {
    try {
      // `?prova=1` (conferência) ignora o × guardado na sessão; o grupoProva limpa a chave logo abaixo
      const forcada = new URLSearchParams(window.location.search).get("prova") === "1";
      if (!forcada && sessionStorage.getItem("lpw_pil_x")) setProvaOn(false);
    } catch {
      /* sessionStorage indisponível */
    }
    if (noCheckout) return; // o checkout já tem o reforço dele acima do formulário
    const t = setTimeout(() => {
      if (grupoProva() === "sem") {
        // grupo de comparação: nada na tela, só o carimbo de que esta jornada ficou sem
        sendBeacon(slug, `${step}-prova-sem`, { eventType: "apareceu" });
        setProvaOn(false);
        return;
      }
      fetch(`${PHAROS}/api/lp/prova?slug=${encodeURIComponent(slug)}&produto=${produto}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((j: Prova | null) => {
          if (!j) return;
          // os dois primeiros selados estão no tríptico do herói da D: não repetir na pílula
          const noHero = new Set(depoimentos.slice(0, 2).map((d) => d.x));
          const curto = (d: Depo) => d.x.length <= DEPO_MAX && !noHero.has(d.x) && !/\[\.\.\.\]|…|\.\.\./.test(d.x);
          let lista: Item[] = j.itens?.length
            ? j.itens.filter((i) => i.k !== "depo" || !noHero.has(i.t.replace(/^[«“]|[»”]$/g, "")))
            : [
                ...(j.compras ? [{ k: "compras", t: j.compras, s: "compras confirmadas" }] : []),
                ...(j.visitantes ? [{ k: "visitas", t: j.visitantes, s: "visitas de gente, robô fora" }] : []),
                ...(j.depoimentos ?? []).filter(curto).map((d) => ({ k: "depo", t: `“${d.x}”`, s: d.who })),
              ];
          if (!lista.some((i) => i.k === "depo")) {
            lista = lista.concat(depoimentos.slice(2).filter(curto).slice(0, 2).map((d) => ({ k: "depo", t: `“${d.x}”`, s: d.who })));
          }
          if (casa) lista.splice(Math.min(4, lista.length), 0, { k: "casa", ...casa });
          setItens(rodizio(lista));
        })
        .catch(() => {
          /* sem prova, sem placeholder */
        });
    }, 1500);
    return () => clearTimeout(t);
  }, [slug, produto, noCheckout, step, depoimentos, casa]);

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
  // rodízio da pílula: 1 mensagem por vez, no ritmo do HC, com teto por sessão
  useEffect(() => {
    if (noCheckout || !provaOn || !itens.length || (celular && !rolou)) return;
    let vistas = 0;
    try {
      vistas = Number(sessionStorage.getItem("lpw_prova_n") || 0);
    } catch {
      /* sem memória de sessão: conta só nesta página */
    }
    if (vistas >= PROVA_TETO) return;
    // continua de onde parou: recarregar a página não repete a primeira mensagem
    let i = 0;
    try {
      i = Number(sessionStorage.getItem("lpw_prova_i") || 0) % itens.length;
    } catch {
      /* idem */
    }
    let t: ReturnType<typeof setTimeout>;
    const esconde = () => {
      if (hover.current) {
        t = setTimeout(esconde, PROVA_HOVER_MS);
        return;
      }
      setVisivel(false);
      vistas++;
      try {
        sessionStorage.setItem("lpw_prova_n", String(vistas));
      } catch {
        /* idem */
      }
      if (vistas >= PROVA_TETO || i >= itens.length) return;
      t = setTimeout(mostra, PROVA_PAUSA_MS);
    };
    const mostra = () => {
      setAtual(itens[i]);
      i++;
      try {
        sessionStorage.setItem("lpw_prova_i", String(i));
      } catch {
        /* idem */
      }
      setVisivel(true);
      sendBeacon(slug, `${step}-prova`, { eventType: "apareceu" });
      t = setTimeout(esconde, PROVA_TELA_MS);
    };
    // computador: os 5 s contam do início da navegação, não do fim da busca na rota
    // (a rota responde entre 0,4 s e 4 s; sem o desconto a pílula entrava aos 7 a 9 s)
    const espera = celular ? PROVA_INICIO_CEL_MS : Math.max(300, PROVA_INICIO_MS - performance.now());
    t = setTimeout(mostra, espera);
    return () => clearTimeout(t);
  }, [noCheckout, provaOn, itens, celular, rolou, slug, step]);

  // chamada por ócio: 60 s sem toque, rolagem ou tecla, uma vez por sessão
  useEffect(() => {
    if (!comChat) return;
    try {
      if (sessionStorage.getItem("lpw_chamou")) return;
    } catch {
      /* segue sem memória de sessão */
    }
    let ultimo = Date.now();
    const toca = () => {
      ultimo = Date.now();
    };
    // blur = o foco entrou no iframe da Stripe (o último gesto que a página enxerga)
    const evs: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "scroll", "touchstart", "blur"];
    evs.forEach((e) => window.addEventListener(e, toca, { passive: true }));
    let esconde: ReturnType<typeof setTimeout> | undefined;
    const t = setInterval(() => {
      if (abertoRef.current || document.hidden) {
        ultimo = Date.now();
        return;
      }
      if (Date.now() - ultimo < (noCheckout && focoNoForm() ? OCIO_FORM_MS : OCIO_MS)) return;
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
  }, [noCheckout, comChat]);

  // checkout: acompanha o foco entrando e saindo do formulário da Stripe
  useEffect(() => {
    if (!noCheckout) return;
    // o activeElement só vira o iframe depois que o blur termina
    const entrou = () => setTimeout(() => setNoForm(focoNoForm()), 0);
    const saiu = () => setNoForm(false);
    window.addEventListener("blur", entrou);
    window.addEventListener("focus", saiu);
    return () => {
      window.removeEventListener("blur", entrou);
      window.removeEventListener("focus", saiu);
    };
  }, [noCheckout]);

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
        body: JSON.stringify({ slug, produto, local, ficha, mensagens: novo.slice(-15), journey, internal }),
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

  const temProva = !noCheckout && provaOn && atual !== null;
  // some só enquanto a pessoa preenche; a chamada por ócio e o chat aberto trazem de volta
  const fabFora = noCheckout && celular && noForm && !aberto && !chamada;

  return (
    <div className={"lpw" + (comSticky ? " lpw-com-sticky" : "")} style={{ ["--lpw-acc" as string]: cor, ["--lpw-acc-text" as string]: corTexto }}>
      {temProva && atual && (
        <aside
          className={"lpw-pil" + (visivel ? " lpw-in" : "")}
          aria-live="polite"
          onMouseEnter={() => {
            hover.current = true;
          }}
          onMouseLeave={() => {
            hover.current = false;
          }}
        >
          <button
            className="lpw-x"
            aria-label="Fechar"
            onClick={() => {
              setProvaOn(false);
              sendBeacon(slug, `${step}-prova`, { eventType: "converteu" });
              try {
                sessionStorage.setItem("lpw_pil_x", "1");
              } catch {
                /* idem */
              }
            }}
          >
            ×
          </button>
          <span className="lpw-pil-ic" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              {ICONE[atual.k] ?? ICONE.nota}
            </svg>
          </span>
          <span className="lpw-pil-t">
            <b>{atual.t}</b>
            <i>
              {atual.s} · <u>✓ dado verificado</u>
            </i>
          </span>
        </aside>
      )}

      {comChat && chamada && !aberto && (
        <button className="lpw-balao" onClick={() => setAberto(true)}>
          Quer perguntar algo antes de decidir? Escreva aqui.
        </button>
      )}

      {comChat && !fabFora && (
        <button
          className="lpw-fab"
          aria-label={aberto ? "Fechar o chat" : "Fazer uma pergunta"}
          aria-expanded={aberto}
          onClick={() => setAberto((a) => !a)}
        >
          {aberto ? (
            <span className="lpw-fx">×</span>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 5h16v11H9l-5 4V5Z" />
                <path d="M8 9h8M8 12.5h5" />
              </svg>
              <span className="lpw-on" aria-hidden="true" />
            </>
          )}
        </button>
      )}

      {aberto && (
        <section className="lpw-chat" role="dialog" aria-label="Perguntas antes de decidir">
          <header className="lpw-h">
            <div>
              <b>Perguntas sobre {objeto}</b>
              <span>como pago, como recebo, garantia</span>
            </div>
            <button className="lpw-close" aria-label="Fechar o chat" onClick={() => setAberto(false)}>
              ×
            </button>
          </header>
          <div className="lpw-lista" ref={lista}>
            <div className="lpw-m lpw-bot">Oi! Respondo rápido sobre {objeto}: como pago, como recebo, garantia. O que você quer saber?</div>
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
              placeholder="Sua pergunta antes de decidir"
              disabled={ocupado || esgotou}
              aria-label="Sua pergunta"
              autoFocus
            />
            <button type="submit" disabled={ocupado || esgotou || !texto.trim()} aria-label="Enviar">
              ➤
            </button>
          </form>
          {checkout && ficha && (
            <a
              className="lpw-cta"
              href={checkout}
              onClick={(e) => {
                sendBeacon(slug, `${step}-cta`, { eventType: "converteu" });
                sendCtaPos(slug, `${step}-cta`, e.currentTarget);
              }}
            >
              {cta.replace(" →", "")}
              <span>{ficha.preco} · abre o checkout</span>
            </a>
          )}
          <p className="lpw-pe">Resposta automática.</p>
        </section>
      )}

      <style>{`
.lpw{font-family:var(--sans,Inter,system-ui,sans-serif)}
.lpw button{font-family:inherit}
.lpw-fab{position:fixed;right:18px;bottom:18px;z-index:70;width:56px;height:56px;border-radius:50%;border:0;background:var(--lpw-acc);color:var(--lpw-acc-text);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.35);transition:transform .15s ease}
.lpw-fab:hover{transform:translateY(-1px)}
.lpw-fab svg{width:26px;height:26px}
.lpw-fx{font-size:28px;line-height:1}
.lpw-balao{position:fixed;right:84px;bottom:26px;z-index:70;max-width:250px;background:var(--bg,#111);color:var(--text,var(--ink,#eee));border:1px solid var(--lpw-acc);border-radius:14px 14px 4px 14px;padding:10px 14px;font-size:13.5px;font-weight:500;line-height:1.4;text-align:left;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.35);animation:lpw-pop .3s ease}
@keyframes lpw-pop{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.lpw-on{position:absolute;top:2px;right:2px;width:12px;height:12px;border-radius:50%;background:#3BD66E;border:2px solid var(--lpw-acc);animation:lpw-on 1.6s ease-out infinite}
@keyframes lpw-on{0%{box-shadow:0 0 0 0 rgba(59,214,110,.6)}100%{box-shadow:0 0 0 10px rgba(59,214,110,0)}}
@media(prefers-reduced-motion:reduce){.lpw-on{animation:none}}
.lpw-chat{padding:0;position:fixed;right:18px;bottom:86px;z-index:71;width:360px;max-width:calc(100vw - 36px);height:auto;max-height:min(520px,calc(100vh - 110px));display:flex;flex-direction:column;background:var(--bg,#111);color:var(--text,var(--ink,#eee));border:1px solid var(--hair,rgba(255,255,255,.14));border-radius:16px;box-shadow:0 18px 48px rgba(0,0,0,.45);overflow:hidden;animation:lpw-pop .2s ease}
.lpw-h{padding:12px 14px 12px 16px;border-bottom:1px solid var(--hair,rgba(255,255,255,.14));display:flex;align-items:center;justify-content:space-between;gap:10px}
.lpw-h div{display:flex;flex-direction:column;gap:1px}
.lpw-h b{font-size:15px}.lpw-h span{font-size:12px;color:var(--dim,#999)}
.lpw-close{background:none;border:0;color:var(--dim,#999);font-size:24px;line-height:1;cursor:pointer;padding:2px 6px}
.lpw-lista{flex:1 1 auto;min-height:0;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px}
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
.lpw-cta{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 12px 8px;padding:11px 14px;border-radius:10px;background:var(--lpw-acc);color:var(--lpw-acc-text);font-weight:700;font-size:14px;text-decoration:none}
.lpw-cta span{font-weight:500;font-size:12px;opacity:.85}
.lpw-pe{margin:0;padding:0 14px 10px;font-size:11px;color:var(--dim,#999)}
/* pílula de prova: clara de propósito, pra ler em cima de página escura ou clara */
.lpw-pil{position:fixed;left:18px;bottom:18px;z-index:69;width:340px;max-width:calc(100vw - 110px);min-height:76px;display:flex;align-items:center;gap:12px;padding:12px 36px 12px 12px;background:#FBF6F3;color:#1B1416;border:1px solid rgba(27,20,22,.08);border-radius:14px;box-shadow:0 14px 40px rgba(0,0,0,.45);transform:translateY(150%);opacity:0;pointer-events:none;transition:transform .5s cubic-bezier(.2,.9,.3,1.1),opacity .3s}
.lpw-pil.lpw-in{transform:none;opacity:1;pointer-events:auto}
.lpw-pil-ic{flex:none;width:52px;height:52px;border-radius:50%;background:var(--lpw-acc);color:var(--lpw-acc-text);display:flex;align-items:center;justify-content:center}
.lpw-pil-ic svg{width:26px;height:26px}
.lpw-pil-t{min-width:0}
.lpw-pil b{display:block;font-weight:650;font-size:14px;line-height:1.3;color:#1B1416}
.lpw-pil i{display:block;font-style:normal;font-size:12px;line-height:1.35;color:#6F6367;margin-top:3px}
.lpw-pil u{text-decoration:none;color:#2E7D32;font-weight:600;white-space:nowrap}
.lpw-x{position:absolute;top:6px;right:8px;background:none;border:0;color:#8A7E82;font-size:18px;line-height:1;cursor:pointer;padding:4px}
@media(max-width:760px){
  .lpw-fab{right:12px;bottom:18px;width:50px;height:50px}
  .lpw-balao{right:12px;bottom:76px;max-width:240px;border-radius:14px 14px 14px 4px}
  .lpw-chat{right:0;left:0;bottom:0;width:auto;max-width:none;height:auto;max-height:72vh;border-radius:16px 16px 0 0}
  .lpw-pil{left:12px;right:74px;bottom:18px;width:auto;max-width:none;min-height:56px;padding:9px 30px 9px 9px;gap:10px}
  .lpw-pil-ic{width:38px;height:38px}
  .lpw-pil-ic svg{width:19px;height:19px}
  .lpw-pil b{font-size:13px}
  .lpw-pil i{font-size:11px;margin-top:1px}
  .lpw-com-sticky .lpw-fab{bottom:84px}
  .lpw-com-sticky .lpw-balao{bottom:142px}
  .lpw-com-sticky .lpw-pil{bottom:84px}
}
@media(prefers-reduced-motion:reduce){.lpw *{animation:none!important;transition:none!important}}
`}</style>
    </div>
  );
}
