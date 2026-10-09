"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import PageBeacon, { captureSource, sendBeacon } from "../../PageBeacon";

/* ============================================================
   EXP-124 · CHECKOUT DA COLEÇÃO NO MODELO DO OQEL (braço B) + SORTEIO DOS DOIS BRAÇOS
   Decisão do HC em 08/10/26: todos os checkouts divididos entre (A) o de hoje, 3 colunas no computador, e (B) o
   modelo do checkout do OQEL (pele H «Traço leve», protótipo da Estante de 08/10). Este arquivo é IDÊNTICO byte a
   byte em toda casa da família: tudo o que é da casa (textos, capa, bump, prova, marca, cores) chega por props do
   page.tsx; aqui só mora a moldura do B, o sorteio e os beacons de braço.
   O B monta o pedido na página (coleção, o bump antes do botão, linhas e total, sem Stripe nenhuma) e a Stripe
   embutida só nasce no toque em «Finalizar o pedido», dentro da folha do pedido, no lugar do bump, do total e do
   botão. «Mudar o pedido» desmonta a Stripe e devolve tudo. Uma session por toque em «Finalizar», nunca uma por
   carga de página nem por bump marcado. Computador a partir de 1.280 px: o que leva e a prova à esquerda, o pedido
   (e depois a Stripe) no meio, o bump empilhado à direita, nunca embaixo da Stripe. Sem linha divisória por dentro
   (espaço e tom separam, contorno só por fora), capa do bump ocupando a largura do cartão, texto de 13 px pra cima,
   botão preenchido de 60 px.
   Uma variável só: texto, preço, bump, prova, popup de saída (e o holdout dele), oferta e estados de erro são os do
   A (a rota é a mesma e decide o preço). Só a moldura muda.
   ============================================================ */

/** Chave do teste. true = sorteio 50/50 por visitante (localStorage `ck_modelo`, todos os aparelhos) e beacon
 *  `ck-modelo-a|b|x` ao decidir; false = todo mundo no A, nenhum beacon de braço, `?v=` ignorado. */
export const SPLIT_MODELO = true;

/** Largada do EXP-125 (HC 08/10/26): o sorteio só divide a partir deste instante (horário de Brasília); antes dele todo
 *  mundo fica no A, sem beacon de braço e sem carimbo, e só o `?v=` mostra outro braço (prova). O rollout reescreve
 *  esta linha: hora da largada, ou 2099 pra subir armado e calado. */
const LARGADA = "2026-10-09T00:01:00-03:00";
function largou(): boolean {
  const t = Date.parse(LARGADA);
  return Number.isFinite(t) && Date.now() >= t;
}

/** O braço real desta carga: «a» (o checkout de hoje), «b» (o pedido do OQEL em 3 colunas no computador) ou «c» (o mesmo
 *  pedido em 2 colunas, com os extras dentro do pedido em toda largura, como no funil do OQEL). A página só separa o A
 *  do pedido novo; o Pedido lê o braço daqui pra escolher as colunas. 1/3 pra cada um. */
export type Braco = "a" | "b" | "c";
let bracoAtual: Braco = "a";
function sorteia3(): Braco {
  const n = Math.floor(Math.random() * 3);
  return n === 0 ? "a" : n === 1 ? "b" : "c";
}

export type Modelo = "a" | "b";

/* O que o sorteio decidiu nesta carga: vale pro carimbo da session dos dois braços. null = chave desligada ou
   localStorage que falhou (a session sai sem carimbo e fica fora da leitura). */
let decidido: Braco | null = null;

/* A chave é uma só pros checkouts da casa (guia, app, Coleção, Estante): grava «a» ou «b» em minúscula e lê sem
   distinguir caixa, pra pessoa ver o mesmo modelo em todos. `?v=A|B` força o braço só nesta carga (prova): nada
   gravado e nenhum beacon de braço, a jornada fica fora da leitura. localStorage que falha = A e `ck-modelo-x`. */
function sorteiaModelo(): { braco: Braco; beacon: Braco | "x" | null } {
  if (!SPLIT_MODELO) return { braco: "a", beacon: null };
  try {
    const f = (new URLSearchParams(location.search).get("v") || "").toLowerCase();
    if (f === "a" || f === "b" || f === "c") return { braco: f, beacon: null };
  } catch {
    /* sem URLSearchParams: segue pro sorteio */
  }
  if (!largou()) return { braco: "a", beacon: null };
  try {
    const v = (localStorage.getItem("ck_modelo") || "").toLowerCase();
    if (v === "a" || v === "b" || v === "c") return { braco: v, beacon: v };
    const b = sorteia3();
    localStorage.setItem("ck_modelo", b);
    return { braco: b, beacon: b };
  } catch {
    return { braco: "a", beacon: "x" };
  }
}

/** Vai no body da session dos dois braços: `metadata.ck_modelo` = "a" | "b". Vazio com a chave desligada, com o braço
 *  forçado por `?v=` e com o localStorage falho. */
export function carimboModelo(): { ck_modelo?: Braco } {
  return SPLIT_MODELO && decidido ? { ck_modelo: decidido } : {};
}

/** Sorteio do braço, decidido depois da hidratação (no servidor não há localStorage): null até decidir, e a página
 *  mostra só o fundo da casa nesse meio tempo. Nunca A piscando pra B: o A só monta quando o sorteio diz A. */
export function useModelo(slug: string): Modelo | null {
  const [modelo, setModelo] = useState<Modelo | null>(null);
  useEffect(() => {
    captureSource("colecao"); // mesma porta do PageBeacon: origem e jornada gravadas antes do 1º beacon
    const s = sorteiaModelo();
    bracoAtual = s.braco;
    decidido = SPLIT_MODELO && s.beacon && s.beacon !== "x" ? s.braco : null;
    setModelo(s.braco === "a" ? "a" : "b");
    if (SPLIT_MODELO && s.beacon) sendBeacon(slug, `ck-modelo-${s.beacon}`);
  }, [slug]);
  return modelo;
}

export type Bump = { titulo: string; ponte: string; frase: string; formato: string; capa: string; capaAlt: string; preco: string; de: string };
export type Casa = { slug: string; news: string; kicker: string; titulo: string; capa: string; capaAlt: string; leva: string; bump: Bump | null; despedida: string };
export type Prova = {
  exibir: boolean;
  exibir_nota: boolean;
  media_exibido: string;
  media_pct: number;
  votos: number;
  distribuicao: { estrelas: number; pct: number }[];
  leitores_exibido: string;
  depoimento: { texto: string; quem: string; nota: number } | null;
};
export type Guia = { titulo: string; capa: string; resumo: string; preco: string };
export type Jornada = Partial<Record<"journey" | "src" | "sid" | "oferta", string>>;

type Props = {
  col: Casa;
  /** A linha `:root{...}` do A (tokens da casa: --bg, --bright, --serif...). */
  raiz: string;
  /** A marca do topo, o mesmo <a className="brand"> do A. */
  marca: ReactNode;
  build: string;
  pk: string | undefined;
  prova: Prova;
  avatares: string[];
  exit: boolean;
  holdout: boolean;
  guia: Guia;
  guiaHref: string;
  jornada: () => Jornada;
  desenho: () => string;
  destaca: (t: string) => ReactNode;
};

type Fase = "pedido" | "abrindo" | "stripe";
type Precos = { valor: number; bump: number };
type BracoSaida = "on" | "off" | "x";

const ROTULO_IR = "Finalizar o pedido";
const ABRINDO = "Abrindo a Stripe…";
/** Teto de espera da rota e do Stripe.js: passou dele, o erro aparece e o botão volta. */
const PRAZO_MS = 20000;
/** O formulário da Stripe conta como montado quando o iframe cresce até aqui (o beacon `ck-montou` leva esse tempo). */
const ALTURA_MONTADO = 300;

type CheckoutHandle = { mount: (sel: string) => void; destroy: () => void };
type StripeJs = {
  initEmbeddedCheckout: (opts: { fetchClientSecret: () => Promise<string> }) => Promise<CheckoutHandle>;
};
declare global {
  interface Window {
    Stripe?: (pk: string) => StripeJs;
  }
}

/** R$ 97 quando é inteiro, R$ 145,50 quando tem centavo. */
function reais(centavos: number): string {
  const r = Math.floor(centavos / 100);
  const c = centavos % 100;
  const int = r.toLocaleString("pt-BR");
  return c ? `R$ ${int},${String(c).padStart(2, "0")}` : `R$ ${int}`;
}

/* Stripe.js por script tag, uma vez por página: o aquecimento no ocioso e o clique esperam a mesma promessa. */
let stripeJs: Promise<StripeJs> | null = null;
function carregaStripe(pk: string): Promise<StripeJs> {
  if (stripeJs) return stripeJs;
  stripeJs = new Promise<StripeJs>((ok, falha) => {
    const pronto = () => (window.Stripe ? ok(window.Stripe(pk)) : falha(new Error("stripe_js_vazio")));
    if (window.Stripe) return pronto();
    const s = document.createElement("script");
    const prazo = window.setTimeout(() => falha(new Error("stripe_js_demorou")), PRAZO_MS);
    s.src = "https://js.stripe.com/v3/";
    s.async = true;
    s.onload = () => {
      clearTimeout(prazo);
      pronto();
    };
    s.onerror = () => {
      clearTimeout(prazo);
      falha(new Error("stripe.js não carregou"));
    };
    document.head.appendChild(s);
  });
  stripeJs.catch(() => {
    stripeJs = null;
  });
  return stripeJs;
}

/* col/17: o mesmo sorteio do holdout do popup de saída do A (localStorage `col_exit_holdout`, `?saida=on|off` força). */
function sorteiaSaida(): BracoSaida {
  try {
    const f = new URLSearchParams(location.search).get("saida");
    if (f === "on" || f === "off") {
      localStorage.setItem("col_exit_holdout", f);
      return f;
    }
    const v = localStorage.getItem("col_exit_holdout");
    if (v === "on" || v === "off") return v;
    const b: BracoSaida = Math.random() < 0.5 ? "on" : "off";
    localStorage.setItem("col_exit_holdout", b);
    return b;
  } catch {
    return "x";
  }
}

const suave = (): ScrollBehavior =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

/** Mistura de duas cores em hex (#rrggbb), `p` = peso da primeira. */
function mistura(a: string, b: string, p: number): string {
  const h = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const [x, y] = [h(a), h(b)];
  return "#" + x.map((v, i) => Math.round(v * p + y[i] * (1 - p)).toString(16).padStart(2, "0")).join("");
}

/** A cor viva da casa (--bright do :root) escurecida, a mesma conta da Estante: é o botão do pedido e o botão da
 *  Stripe aberta na folha (`ck_cor` no corpo da session). Sem hex legível, um vinho neutro. */
function acentoDaCasa(tema: string): string {
  const m = /--bright:\s*(#[0-9a-fA-F]{6})\b/.exec(tema);
  return mistura(m ? m[1] : "#8A6670", "#1A0E12", 0.58);
}

/* A partir de 1.280 px: o B abre em 3 colunas (o que leva | o pedido | os extras); o C fica nas 2 colunas do
   1.024, um pouco mais largo, com os extras dentro do pedido (EXP-125). */
const CSS_TRES = `@media (min-width:1280px){
  .pd-grade{max-width:1360px;grid-template-columns:minmax(300px,1.1fr) minmax(440px,1.5fr) minmax(300px,1.1fr);column-gap:36px}
  .pd-grade.sem-bump{max-width:1180px;grid-template-columns:minmax(0,1fr) 520px;column-gap:64px}
  .pd-prod{grid-column:1;grid-row:1}
  .pd-extra{grid-column:1;grid-row:2}
  .pd-folha{grid-column:2;grid-row:1/span 2}
  .pd-bumps-folha{display:none}
  .pd-lado{display:flex;flex-direction:column;gap:14px;grid-column:3;grid-row:1/span 2}
  .pd-lado-k{font-family:var(--mono);font-size:13px;font-weight:500;line-height:1.2;letter-spacing:.18em;text-transform:uppercase;color:var(--bright);text-align:center}
  .pd-lado .pd-bump{background:var(--papel);border:2px solid var(--ink);box-shadow:6px 6px 0 var(--sombra);padding:22px 16px 16px}
  .pd-lado .pd-bump.on{background:var(--marcado)}
  .pd-lado .pd-bbar{background:#FFFDF8}
  .pd-lado .pd-btag{display:none}
  .pd-capa{height:250px}
  /* o pedido fica à vista enquanto a pessoa rola */
  .pd-folha.fixa{position:sticky;top:16px}
  .pd-barra{display:none}
}
/* tela baixa (notebook de 768 px): o bump aperta um degrau pra barra «Levar os dois» seguir na 1ª tela */
@media (min-width:1280px) and (max-height:779px){
  .pd-lado .pd-bump{padding:16px 14px 12px;gap:4px}
  .pd-bponte{font-size:17px;margin:4px 0 6px}
  .pd-palco{aspect-ratio:5/2}
  .pd-bformato{margin-top:6px}
  .pd-bbar{margin-top:6px}
}
`;
const CSS_DUAS = `@media (min-width:1280px){
  .pd-grade{max-width:1240px;grid-template-columns:minmax(0,1fr) 540px;column-gap:80px}
  .pd-barra{right:max(28px,calc((100vw - 1240px) / 2));width:540px}
}
`;

export default function Pedido({ col, raiz, marca, build, pk, prova, avatares, exit, holdout, guia, guiaHref, jornada, desenho, destaca }: Props) {
  const acento = acentoDaCasa(raiz);
  const duas = bracoAtual === "c";
  const [bump, setBump] = useState(false);
  const [fase, setFase] = useState<Fase>("pedido");
  const [precos, setPrecos] = useState<Precos | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  // Rodada fechada pela rota (410): sem botão, o mesmo aviso do A no lugar do pedido.
  const [fechado, setFechado] = useState(false);
  const [montado, setMontado] = useState(false);
  const atual = useRef<CheckoutHandle | null>(null);
  const ocupado = useRef(false);
  const clique = useRef(0);
  const montouJa = useRef(false);
  const caixaRef = useRef<HTMLElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const saidaBraco = useRef<BracoSaida | "">(""); // col/17: vazio onde o holdout não existe
  // Barra fixa do total (até 1.279 px): aparece enquanto o botão do pedido está fora da tela.
  const [btnVisivel, setBtnVisivel] = useState(true);

  // col/17: o sorteio do holdout e o beacon dele, iguais ao A, antes de qualquer outro efeito.
  useEffect(() => {
    if (exit && holdout) {
      saidaBraco.current = sorteiaSaida();
      sendBeacon(col.slug, `colecao-holdout-${saidaBraco.current}`);
    }
  }, [col.slug, exit, holdout]);

  // Preço de hoje na carga, sem criar session: a rota faz a mesma conta do POST (cheio, ou metade na janela do col/27).
  // Rodada fechada = 410 aqui também, e o aviso é o do A.
  useEffect(() => {
    const oferta = jornada().oferta === "metade" ? "?oferta=metade" : "";
    fetch(`/api/colecao-checkout${oferta}`, { cache: "no-store" })
      .then((r) => r.json().then((d) => ({ st: r.status, d })))
      .then(({ st, d }) => {
        if (st === 410) {
          setFechado(true);
          setErro(String(d?.error || "encerrado"));
          return;
        }
        if (typeof d?.valor === "number") setPrecos({ valor: d.valor, bump: typeof d.bump === "number" ? d.bump : 0 });
      })
      .catch(() => {});
  }, [jornada]);

  // Stripe.js chega antes do clique, quando o navegador folga (o clique espera a mesma carga).
  useEffect(() => {
    if (!pk) return;
    const aquece = () => void carregaStripe(pk).catch(() => {});
    const w = window as unknown as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(aquece, { timeout: 3000 });
    else window.setTimeout(aquece, 1500);
  }, [pk]);

  useEffect(() => {
    const el = btnRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setBtnVisivel(e.isIntersecting), { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [fase, fechado, precos]);

  // A Stripe monta depois que o contêiner aparece (efeito da fase), nunca num quadro solto. `colecao-ck-montou@<ms>`
  // leva os milissegundos do clique até o iframe crescer (1 por carga de página).
  useEffect(() => {
    if (fase !== "stripe") return;
    const alvo = formRef.current;
    const emb = atual.current;
    if (!alvo || !emb) return;
    setMontado(false);
    emb.mount("#checkout-box");
    const fim = Date.now() + 15000;
    let vivo = true;
    const confere = () => {
      if (!vivo) return;
      const ifr = alvo.querySelector("iframe");
      const alto = ifr ? ifr.getBoundingClientRect().height >= ALTURA_MONTADO : false;
      if (alto || Date.now() > fim || !alvo.isConnected) {
        setMontado(true);
        if (!montouJa.current && clique.current) {
          montouJa.current = true;
          sendBeacon(col.slug, `colecao-ck-montou@${Math.round(performance.now() - clique.current)}`);
        }
      } else window.setTimeout(confere, 150);
    };
    window.setTimeout(confere, 150);
    // O pedido encolhe (bump, total e botão saem): se o topo dele ficou acima da tela, ele volta pra vista.
    const cx = caixaRef.current;
    if (cx && (cx.getBoundingClientRect().top < 0 || window.matchMedia("(max-width: 1023px)").matches)) cx.scrollIntoView({ block: "start", behavior: suave() });
    alvo.focus({ preventScroll: true });
    return () => {
      vivo = false;
    };
  }, [fase, col.slug]);

  const temBump = Boolean(col.bump);
  const total = precos ? precos.valor + (bump && temBump ? precos.bump : 0) : 0;
  const aberto = fase === "stripe";
  const travado = fase !== "pedido";
  const lendo = precos === null;

  /** «Mudar o pedido»: desmonta a Stripe e devolve bump, total e botão; o foco volta pro «Finalizar». */
  function mudaPedido() {
    atual.current?.destroy();
    atual.current = null;
    setFase("pedido");
    window.setTimeout(() => {
      caixaRef.current?.scrollIntoView({ block: "nearest", behavior: suave() });
      btnRef.current?.focus({ preventScroll: true });
    }, 30);
  }

  async function abre(origem: "folha" | "barra") {
    if (!pk || fase !== "pedido" || fechado || ocupado.current) return;
    ocupado.current = true;
    clique.current = performance.now();
    setErro(null);
    setFase("abrindo");
    sendBeacon(col.slug, "colecao-ck-finalizar", { eventType: "converteu" });
    // Quem tocou na barra vê o «Abrindo a Stripe…» no botão do pedido.
    if (origem === "barra") btnRef.current?.scrollIntoView({ block: "center", behavior: suave() });
    const corpo = { bump: bump && temBump, checkout_variant: duas && desenho() === "3col" ? "2col" : desenho(), exit_holdout: saidaBraco.current, ck_cor: acento, ...carimboModelo(), ...jornada() };
    try {
      // A session nasce só aqui, no toque; o Stripe.js já veio no aquecimento (ou chega junto).
      const sinal = "timeout" in AbortSignal ? AbortSignal.timeout(PRAZO_MS) : undefined;
      const { st, d } = await fetch("/api/colecao-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
        signal: sinal,
      }).then((r) => r.json().then((d) => ({ st: r.status, d })));
      if (st === 410) {
        setFechado(true);
        throw new Error(String(d?.error || "encerrado"));
      }
      if (!d.clientSecret) throw new Error(d.error || "sem clientSecret");
      const sj = await carregaStripe(pk);
      atual.current = await sj.initEmbeddedCheckout({ fetchClientSecret: () => Promise.resolve(d.clientSecret as string) });
      setFase("stripe");
    } catch (e) {
      atual.current?.destroy();
      atual.current = null;
      setFase("pedido");
      setErro((e as Error).message);
      window.setTimeout(() => {
        btnRef.current?.scrollIntoView({ block: "center", behavior: suave() });
        btnRef.current?.focus({ preventScroll: true });
      }, 30);
    } finally {
      ocupado.current = false;
    }
  }

  // Toque no formulário: beacon `colecao-ck-pagar`, 1 vez por jornada, no primeiro toque no formulário da
  // Stripe (iframe de outra origem: a página enxerga o blur da janela com o iframe do #checkout-box ativo).
  const pagarJa = useRef(false);
  useEffect(() => {
    let relogio = 0;
    const para = () => {
      window.removeEventListener("blur", onBlur);
      window.clearInterval(relogio);
    };
    const confere = () => {
      if (pagarJa.current) return;
      const el = document.activeElement;
      if (!el || el.tagName !== "IFRAME" || !el.closest("#checkout-box")) return;
      pagarJa.current = true;
      para();
      sendBeacon(col.slug, "colecao-ck-pagar", { eventType: "converteu" });
    };
    function onBlur() {
      confere();
      window.setTimeout(confere, 0);
    }
    window.addEventListener("blur", onBlur);
    relogio = window.setInterval(confere, 1000);
    return para;
  }, [col.slug]);

  // Saída (HC 23/09): o guia da casa pra quem sai antes de tocar no formulário. Mesmos gatilhos e beacons do A.
  const [saida, setSaida] = useState(false);
  const caixaSaida = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!exit || saidaBraco.current === "off") return; // col/17: o braço sem popup nunca abre
    let ja = false;
    const abre = (gatilho: "topo" | "volta" | "rolagem") => {
      if (ja || pagarJa.current) return;
      try {
        if (sessionStorage.getItem("col_exit")) return;
        sessionStorage.setItem("col_exit", "1");
      } catch {
        /* modo privado: o guard fica só na variável */
      }
      ja = true;
      setSaida(true);
      sendBeacon(col.slug, `colecao-exit-${gatilho}`);
    };
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) abre("topo");
    };
    let fora = 0;
    const onVis = () => {
      if (document.visibilityState === "hidden") fora = Date.now();
      else if (fora && Date.now() - fora >= 3000) abre("volta");
    };
    let uy = window.scrollY, ry = uy, rt = 0;
    const onScroll = () => {
      const y = window.scrollY, t = Date.now();
      if (y < uy) {
        if (!rt) { rt = t; ry = uy; }
        if (ry - y >= 320 && t - rt <= 350) abre("rolagem");
      } else rt = 0;
      uy = y;
    };
    const toque = "ontouchstart" in window || window.matchMedia("(pointer:coarse)").matches;
    document.addEventListener("mouseleave", onLeave);
    if (toque) {
      document.addEventListener("visibilitychange", onVis);
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    return () => {
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("scroll", onScroll);
    };
  }, [col.slug, exit]);
  useEffect(() => {
    if (!saida) return;
    caixaSaida.current?.focus();
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSaida(false);
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [saida]);

  const depo = prova.depoimento;
  const LEVA = col.leva.match(/^(\d[\d.]*)\s+([^\s,]+),?\s+(.*)$/);

  const cartao = (onde: "folha" | "lado") =>
    col.bump ? (
      <section className={`pd-bump${bump ? " on" : ""}${travado ? " trava" : ""}`} aria-label="Adicione ao pedido">
        <span className="pd-fita" aria-hidden="true" />
        <span className="pd-btag">Adicione ao pedido</span>
        <p className="pd-bponte">{col.bump.ponte}</p>
        <span className="pd-palco" style={{ "--img": `url("${col.bump.capa}")` } as React.CSSProperties}>
          <img className="pd-palco-img" src={col.bump.capa} alt={col.bump.capaAlt} width={900} height={1200} loading="lazy" />
        </span>
        <span className="pd-bformato">{col.bump.formato}</span>
        <span className="pd-bnome" id={`bump-${onde}-nome`}>{col.bump.titulo}</span>
        <span className="pd-bfrase">{destaca(col.bump.frase)}</span>
        <span className="pd-bpreco" id={`bump-${onde}-preco`}><s>{col.bump.de}</s> {col.bump.preco}</span>
        <label htmlFor={`bump-${onde}`} className="pd-bbar">
          <input id={`bump-${onde}`} type="checkbox" checked={bump} disabled={travado} onChange={(e) => setBump(e.target.checked)} aria-describedby={`bump-${onde}-nome bump-${onde}-preco`} />
          <span className="pd-bx" aria-hidden="true">{bump ? "✓" : ""}</span>
          <span>Levar os dois</span>
        </label>
      </section>
    ) : null;

  const aviso = erro ? (
    <div className="ck-pend" role="alert"><p><b>O checkout não abriu.</b></p><p>{erro}</p></div>
  ) : null;

  return (
    <>
      <PageBeacon slug={col.slug} step="colecao-checkout" source="colecao" />

      <nav>
        <div className="wrap nav-inner">{marca}</div>
      </nav>

      <main className={duas ? "pd pd-duas" : "pd"} data-build={build} data-modelo={bracoAtual}>
        <div className={`pd-grade${temBump ? "" : " sem-bump"}`}>
          <section className="pd-prod" aria-label={col.kicker}>
            <img className="pd-capa" src={col.capa} alt={col.capaAlt} width={900} height={1200} fetchPriority="high" />
            <div className="pd-tit">
              <span className="pd-kick">{col.kicker}</span>
              <h1 className="pd-h1">{col.titulo}</h1>
            </div>
          </section>

          <section className={`pd-folha${aberto ? "" : " fixa"}${lendo ? " lendo" : ""}`} aria-label="Seu pedido" aria-busy={fase === "abrindo"} ref={caixaRef}>
            <p className="pd-rot" role="heading" aria-level={2}>Seu pedido</p>

            <div className="pd-linhas">
              <div className="pd-li"><span>{col.kicker} · {col.news}</span><b>{precos ? reais(precos.valor) : "R$ 0"}</b></div>
              {bump && col.bump && <div className="pd-li pd-li-b"><span>{col.bump.titulo}</span><b>{precos ? reais(precos.bump) : "R$ 0"}</b></div>}
            </div>

            {!aberto && !fechado && <div className="pd-bumps pd-bumps-folha">{cartao("folha")}</div>}

            {!fechado && (
              <div className="pd-tot" aria-live="polite" aria-atomic="true" hidden={aberto}>
                <span>Total hoje</span>
                <div><b>{reais(total)}</b><small>uma vez só</small></div>
              </div>
            )}

            {fase !== "stripe" && !fechado && (
              <div className="pd-cta">
                <button ref={btnRef} className="pd-btn" type="button" onClick={() => abre("folha")} disabled={fase === "abrindo" || !pk}>
                  {fase === "abrindo" ? ABRINDO : ROTULO_IR}
                </button>
                <p className="pd-acel">Pix ou cartão · acesso no seu email na hora</p>
              </div>
            )}
            {!pk && (
              <div className="ck-pend">
                <p><b>Checkout em preparação.</b></p>
                <p>O checkout abre aqui assim que as chaves da Stripe entrarem no ambiente. Nada é cobrado até lá.</p>
              </div>
            )}
            <p className="pd-vh" role="status">{fase === "abrindo" ? ABRINDO : ""}</p>
            {aviso}

            {aberto && (
              <button type="button" className="pd-mudar" onClick={mudaPedido}>Mudar o pedido</button>
            )}
            <div className={`pd-stripe${aberto && !montado ? " carregando" : ""}`} hidden={!aberto} role="region" aria-label="Formulário da Stripe">
              <div id="checkout-box" className="pd-form" ref={formRef} tabIndex={-1} />
              {aberto && !montado && (
                <div className="ck-skel" role="status" aria-label="Abrindo o checkout">
                  <div className="sk-bars" aria-hidden="true">
                    <span className="sk-l sk-rot" />
                    <span className="sk-l sk-campo" />
                    <span className="sk-l sk-rot sk-curto" />
                    <span className="sk-l sk-campo" />
                    <span className="sk-dupla">
                      <span className="sk-l sk-campo" />
                      <span className="sk-l sk-campo" />
                    </span>
                    <span className="sk-l sk-rot sk-curto" />
                    <span className="sk-l sk-campo" />
                    <span className="sk-l sk-botao" />
                  </div>
                </div>
              )}
            </div>
          </section>

          {temBump && (
            <aside className="pd-lado">
              <p className="pd-lado-k">Adicione ao pedido</p>
              {cartao("lado")}
            </aside>
          )}

          <div className="pd-extra">
            <p className="pd-leva">{LEVA ? <><b>{LEVA[1]}</b> {LEVA[2]}, {LEVA[3]}</> : col.leva}</p>
            {prova.exibir && prova.exibir_nota && (
              <section className="ck-prova" aria-label={`O que os leitores da ${col.news} dizem`}>
                <div className="ck-media">
                  <b>{prova.media_exibido}</b>
                  <div>
                    <span className="ck-stars" style={{ "--f": `${prova.media_pct}%` } as React.CSSProperties} aria-label={`${prova.media_exibido} de 5`}>
                      <span className="st-b" aria-hidden="true">★★★★★</span><span className="st-f" aria-hidden="true">★★★★★</span>
                    </span>
                    <small>{prova.votos} votos de leitores</small>
                  </div>
                </div>
                <div className="ck-bars" aria-hidden="true">
                  {prova.distribuicao.map((d) => (
                    <div className="ck-bar" key={d.estrelas}>
                      <span>{d.estrelas} ★</span>
                      <span className="tr"><i style={{ width: `${d.pct}%` }} /></span>
                      <span className="pc">{d.pct}%</span>
                    </div>
                  ))}
                </div>
                <div className="ck-leit">
                  {avatares.length > 0 && (
                    <span className="ck-avs" aria-hidden="true">
                      {avatares.map((f) => <img key={f} src={`/images/leitores/${f}`} alt="" width={26} height={26} loading="lazy" />)}
                    </span>
                  )}
                  <span><b>{prova.leitores_exibido}</b> leitores recebem a news</span>
                </div>
                {depo && (
                  <figure className="ck-depo">
                    <blockquote>{depo.texto}</blockquote>
                    <figcaption>{depo.quem} · nota {depo.nota} de 5</figcaption>
                  </figure>
                )}
              </section>
            )}
          </div>
        </div>

        {fase === "pedido" && pk && !fechado && (
          <div className={`pd-barra${btnVisivel ? "" : " on"}${lendo ? " lendo" : ""}`} inert={btnVisivel}>
            <div className="pd-barra-tot"><span>Total hoje</span><b>{reais(total)}</b></div>
            <button type="button" className="pd-barra-btn" onClick={() => abre("barra")}>{ROTULO_IR}</button>
          </div>
        )}
      </main>

      <footer className="ck-foot">
        <p>{col.despedida}</p>
      </footer>

      {saida && (
        <div
          className="saida"
          role="dialog"
          aria-modal="true"
          aria-labelledby="saida-titulo"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSaida(false);
          }}
        >
          <div className="saida-box" ref={caixaSaida} tabIndex={-1}>
            <button type="button" className="saida-x" aria-label="Fechar" onClick={() => setSaida(false)}>×</button>
            <p className="saida-kicker">Antes de sair</p>
            <h2 id="saida-titulo">Comece pelo guia da {col.news}.</h2>
            <div className="saida-guia">
              <img src={guia.capa} alt="" width={78} height={104} />
              <div>
                <b>{guia.titulo}</b>
                <span>{guia.resumo}</span>
              </div>
            </div>
            <p className="saida-preco">{guia.preco}, uma vez só · pix ou cartão</p>
            <a className="saida-cta" href={guiaHref} onClick={() => sendBeacon(col.slug, "colecao-exit-cta", { eventType: "converteu" })}>
              Quero o guia →
            </a>
            <button type="button" className="saida-fechar" onClick={() => setSaida(false)}>
              Continuar na Coleção
            </button>
          </div>
        </div>
      )}

      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
${raiz}
:root{--papel:#F7F1E6;--creme:#EFE4D3;--ink:#1F1A18;--ink2:#4A4340;--mut:#7A716C;--verde:#2F7D5B;--acento:color-mix(in srgb,var(--bright) 62%,#1F1A18);--marcado:color-mix(in srgb,var(--bright) 16%,#F7F1E6);--sombra:color-mix(in srgb,var(--bright) 55%,#000)}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--sans);background:var(--bg);color:var(--text);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
nav{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--bg) 82%,transparent);backdrop-filter:saturate(140%) blur(8px);-webkit-backdrop-filter:saturate(140%) blur(8px);border-bottom:1px solid var(--hair)}
a{color:inherit;text-decoration:none}
img{max-width:100%}
.wrap{width:100%;max-width:1140px;margin:0 auto;padding:0 28px}
.nav-inner{display:flex;align-items:center;justify-content:center;height:66px}
.brand{display:flex;align-items:center;gap:11px}
.brand img{width:32px;height:32px}
.wm{font-weight:700;font-size:20px;letter-spacing:-.02em}
.wm .t{color:var(--bright)}.wm .s{color:#fff}
.pd-vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

/* grade: no celular, produto (tira), o pedido, depois o que leva e a prova */
.pd{padding:10px 16px 110px}
.pd-grade{display:grid;gap:18px;max-width:560px;margin:0 auto}
.pd-grade>*{min-width:0}
.pd-prod{display:flex;align-items:center;gap:14px;padding:4px 2px 0}
.pd-capa{flex:none;display:block;width:56px;height:auto;aspect-ratio:3/4;object-fit:cover;border-radius:3px 5px 5px 3px;box-shadow:0 10px 22px rgba(0,0,0,.6)}
.pd-tit{display:flex;flex-direction:column;gap:3px;min-width:0}
.pd-kick{font-family:var(--mono);font-size:13px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--bright);line-height:1.3}
.pd-h1{font-family:var(--serif);font-style:italic;font-weight:900;font-size:22px;line-height:1.12;color:#fff;letter-spacing:-.01em;text-wrap:balance}

/* o pedido: folha de papel com contorno de tinta e sombra dura; por dentro, zero linha */
.pd-folha{display:flex;flex-direction:column;gap:14px;background:var(--papel);color:var(--ink2);border:2px solid var(--ink);border-radius:22px;padding:20px 15px 22px;box-shadow:6px 6px 0 var(--sombra);scroll-margin-top:12px}
.pd-folha>*{min-width:0}
.pd-rot{font-family:var(--mono);font-size:13px;font-weight:500;line-height:1.2;letter-spacing:.16em;text-transform:uppercase;color:var(--acento)}
.pd-linhas{display:flex;flex-direction:column;gap:8px}
.pd-li{display:flex;justify-content:space-between;align-items:baseline;gap:14px;font-size:16px;font-weight:600;line-height:1.35;color:var(--ink2)}
.pd-li b{flex:none;font-family:var(--serif);font-weight:900;font-size:19px;line-height:1;color:var(--ink);font-variant-numeric:tabular-nums}
.pd-li-b{font-size:15px}
.pd-li-b b{font-size:17px}
.pd-folha.lendo .pd-li b,.pd-folha.lendo .pd-tot b,.pd-barra.lendo b{visibility:hidden}

/* bump: bloco creme com fita dentro da folha; marcado, ganha a cor da casa bem clara */
.pd-bumps{display:flex;flex-direction:column;gap:18px;margin-top:6px}
.pd-bump{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:20px 14px 14px;background:var(--creme);border-radius:18px;color:var(--ink2);transition:background-color .2s}
.pd-fita{position:absolute;left:50%;top:-10px;width:80px;height:20px;margin-left:-40px;background:color-mix(in srgb,var(--bright) 55%,transparent);transform:rotate(-3deg)}
.pd-btag{font-family:var(--mono);font-size:13px;font-weight:500;line-height:1.2;letter-spacing:.16em;text-transform:uppercase;color:var(--acento)}
.pd-bponte{font-family:var(--serif);font-style:italic;font-size:19px;line-height:1.28;color:var(--ink);margin:6px 0 10px;max-width:26ch;text-wrap:balance}
.pd-palco{position:relative;display:flex;align-items:center;justify-content:center;width:100%;aspect-ratio:2/1;border-radius:12px;overflow:hidden;isolation:isolate;background:#1a1012}
.pd-palco::before{content:"";position:absolute;inset:-24px;z-index:-1;background:var(--img) center/cover no-repeat;filter:blur(20px) brightness(.45) saturate(1.15)}
.pd-palco-img{display:block;height:84%;width:auto;aspect-ratio:3/4;object-fit:cover;border-radius:3px 6px 6px 3px;transform:translateX(-7px);box-shadow:7px -5px 0 -1px #d8cfc0,14px -10px 0 -2px #b9ad9b,0 16px 32px rgba(0,0,0,.6)}
.pd-bformato{font-size:14px;color:var(--mut);margin-top:10px}
.pd-bnome{display:block;font-family:var(--serif);font-weight:700;font-size:20px;line-height:1.2;color:var(--ink);text-wrap:balance}
.pd-bfrase{display:block;font-size:15px;line-height:1.45;color:var(--ink2);max-width:32ch;text-wrap:pretty}
.pd-bfrase b{color:var(--ink);font-weight:700}
.pd-bpreco{display:flex;align-items:baseline;justify-content:center;gap:10px;font-family:var(--serif);font-size:30px;font-weight:900;line-height:1;color:var(--ink);font-variant-numeric:tabular-nums;margin-top:4px}
.pd-bpreco s{font-family:var(--sans);font-size:16px;font-weight:500;color:var(--mut)}
.pd-bbar{position:relative;display:flex;align-items:center;justify-content:center;gap:12px;width:100%;min-height:56px;margin-top:10px;padding:10px 16px;background:var(--papel);border:2px solid var(--ink);border-radius:14px;font-size:17px;font-weight:700;line-height:1.2;color:var(--ink);cursor:pointer;user-select:none}
.pd-bbar input{position:absolute;opacity:0;width:1px;height:1px;margin:0}
.pd-bx{flex:none;display:grid;place-items:center;width:28px;height:28px;border:2px solid var(--ink);border-radius:8px;background:#FFFDF8;font-size:17px;font-weight:900;line-height:1;color:#fff;transition:background-color .15s}
.pd-bbar input:focus-visible+.pd-bx{outline:3px solid var(--acento);outline-offset:2px}
.pd-bump.on{background:var(--marcado)}
.pd-bump.on .pd-bx{background:var(--verde);animation:pd-salta .45s cubic-bezier(.3,1.6,.5,1)}
.pd-bump.trava .pd-bbar{cursor:default}
.pd-bump.trava:not(.on){opacity:.72}
@keyframes pd-salta{0%{transform:scale(.5) rotate(-14deg)}60%{transform:scale(1.22) rotate(5deg)}100%{transform:none}}
@media (prefers-reduced-motion:reduce){.pd-bump.on .pd-bx{animation:none}}

/* total, botão, apoio */
.pd-tot{display:flex;justify-content:space-between;align-items:baseline;gap:14px;margin-top:4px}
.pd-tot>span{font-size:17px;font-weight:700;line-height:1.2;color:var(--ink2);white-space:nowrap}
.pd-tot>div{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.pd-tot[hidden]{display:none}
.pd-tot b{font-family:var(--serif);font-size:40px;font-weight:900;line-height:1;color:var(--ink);letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.pd-tot small{font-size:13px;font-weight:600;line-height:1.2;color:var(--mut)}
.pd-cta{display:flex;flex-direction:column;gap:12px}
.pd-btn{display:flex;align-items:center;justify-content:center;width:100%;min-height:60px;padding:14px 22px;border:2px solid var(--ink);border-radius:18px;background:${acento};color:#FFF8EE;font-family:var(--sans);font-size:19px;font-weight:800;line-height:1.1;cursor:pointer;box-shadow:4px 4px 0 var(--ink);transition:transform .12s,box-shadow .12s,filter .15s}
.pd-btn:hover{filter:brightness(1.06);transform:translate(-1px,-1px);box-shadow:6px 6px 0 var(--ink)}
.pd-btn:active{transform:translate(3px,3px);box-shadow:1px 1px 0 var(--ink)}
.pd-btn:focus-visible{outline:3px solid var(--acento);outline-offset:4px}
.pd-btn[disabled]{opacity:.7;cursor:wait;transform:none;box-shadow:4px 4px 0 var(--ink)}
.pd-acel{text-align:center;font-size:14px;font-weight:600;line-height:1.3;color:var(--mut)}
.pd-mudar{align-self:flex-start;border:0;background:none;padding:6px 0;min-height:32px;color:var(--acento);font-family:var(--sans);font-size:15px;font-weight:700;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.pd-mudar:focus-visible{outline:3px solid var(--acento);outline-offset:2px}
.pd-stripe{position:relative;margin-inline:-6px;border-radius:16px;overflow:hidden;background:#fff}
.pd-stripe[hidden]{display:none}
.pd-stripe.carregando{min-height:400px}
.pd-form:focus{outline:none}
.ck-skel{position:absolute;inset:0;padding:22px 20px 24px;pointer-events:none;background:#fff}
.sk-bars{display:flex;flex-direction:column;gap:9px}
.sk-l{display:block;border-radius:6px;background:linear-gradient(100deg,#EDE7E9 0%,#F7F3F4 45%,#EDE7E9 90%);background-size:220% 100%;animation:sk 1.5s linear infinite}
.sk-rot{width:96px;height:9px;margin-top:5px}
.sk-curto{width:74px}
.sk-campo{width:100%;height:42px}
.sk-dupla{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.sk-botao{margin-top:12px;width:100%;height:46px;background:linear-gradient(100deg,color-mix(in srgb,var(--bright) 30%,#fff) 0%,color-mix(in srgb,var(--bright) 14%,#fff) 45%,color-mix(in srgb,var(--bright) 30%,#fff) 90%);background-size:220% 100%}
@keyframes sk{from{background-position:130% 0}to{background-position:-30% 0}}
@media (prefers-reduced-motion:reduce){.sk-l{animation:none}}
.ck-pend{padding:6px 2px 0;color:var(--ink2)}
.ck-pend p{font-size:16px;line-height:1.6;margin:0 0 .5rem}
.ck-pend b{color:var(--ink)}

/* celular: barra do total presa embaixo enquanto o botão da folha não aparece */
.pd-barra{position:fixed;left:16px;right:16px;bottom:10px;z-index:40;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 10px 10px 16px;background:var(--papel);border:2px solid var(--ink);border-radius:18px;box-shadow:4px 4px 0 var(--sombra);transform:translateY(140%);visibility:hidden;transition:transform .25s ease,visibility .25s}
.pd-barra.on{transform:none;visibility:visible}
.pd-barra-tot{display:flex;flex-direction:column;gap:1px;min-width:0}
.pd-barra-tot span{font-size:13px;font-weight:600;line-height:1.2;color:var(--mut)}
.pd-barra-tot b{font-family:var(--serif);font-size:24px;font-weight:900;line-height:1;color:var(--ink);font-variant-numeric:tabular-nums;white-space:nowrap}
.pd-barra-btn{flex:none;min-height:56px;padding:10px 18px;border:2px solid var(--ink);border-radius:14px;background:${acento};color:#FFF8EE;font-family:var(--sans);font-size:16px;font-weight:800;line-height:1.1;cursor:pointer;box-shadow:3px 3px 0 var(--ink)}
.pd-barra-btn:focus-visible{outline:3px solid #fff;outline-offset:3px}
@media (prefers-reduced-motion:reduce){.pd-barra{transition:none}}

/* o que leva e a prova, direto no fundo da casa */
.pd-lado{display:none}
.pd-extra{display:flex;flex-direction:column;gap:20px;padding:6px 2px 0}
.pd-leva{font-size:16px;line-height:1.5;color:var(--text);text-wrap:pretty}
.pd-leva b{color:#fff;font-size:22px;font-weight:900;font-family:var(--serif);font-variant-numeric:tabular-nums}
.ck-prova{padding:20px 18px;border:1px solid var(--hair);border-radius:16px;background:var(--bg-deep);display:flex;flex-direction:column;gap:16px}
.ck-media{display:flex;align-items:center;gap:14px}
.ck-media>b{font-family:var(--serif);font-size:60px;line-height:.95;color:#fff;font-variant-numeric:tabular-nums}
.ck-media>div{display:flex;flex-direction:column;gap:5px}
.ck-media small{font-size:15px;color:var(--text)}
.ck-stars{position:relative;display:inline-block;font-size:27px;line-height:1;letter-spacing:2px}
.ck-stars .st-b{color:color-mix(in srgb,var(--text) 22%,transparent)}
.ck-stars .st-f{position:absolute;left:0;top:0;width:var(--f,100%);overflow:hidden;white-space:nowrap;color:#E6B85C}
.ck-bars{display:flex;flex-direction:column;gap:8px}
.ck-bar{display:grid;grid-template-columns:38px 1fr 46px;align-items:center;gap:10px;font-size:15px;color:var(--text);font-variant-numeric:tabular-nums}
.ck-bar .tr{height:10px;border-radius:5px;background:color-mix(in srgb,var(--text) 12%,transparent);overflow:hidden}
.ck-bar .tr i{display:block;height:100%;background:#E6B85C;border-radius:5px}
.ck-bar .pc{text-align:right}
.ck-leit{display:flex;align-items:center;gap:10px;font-size:15px;color:var(--text)}
.ck-leit>span:last-child{display:flex;flex-direction:column;gap:4px;line-height:1.3}
.ck-leit b{color:#fff;font-size:26px;font-weight:800;line-height:1;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.ck-avs{display:inline-flex;flex:none}
.ck-avs img{width:34px;height:34px;border-radius:50%;border:2px solid var(--bg-deep);margin-left:-12px;background:#333}
.ck-avs img:first-child{margin-left:0}
.ck-depo{margin:0;text-align:left}
.ck-depo blockquote{font-family:var(--serif);font-style:italic;font-size:18px;line-height:1.4;color:#fff;quotes:"\\201C" "\\201D"}
.ck-depo blockquote::before{content:open-quote;color:var(--bright)}
.ck-depo blockquote::after{content:close-quote;color:var(--bright)}
.ck-depo figcaption{margin-top:8px;font-family:var(--mono);font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--text)}

/* rodapé e popup de saída, os do A */
.ck-foot{padding:2.5rem 1.5rem;text-align:center;border-top:1px solid var(--hair);background:var(--bg-deep)}
.ck-foot p{font-family:var(--serif);font-style:italic;font-size:1rem;color:var(--sage)}
.saida{position:fixed;inset:0;z-index:9999;background:rgba(6,4,5,.82);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:24px}
.saida-box{position:relative;width:100%;max-width:440px;background:var(--bg-deep);border:1px solid var(--hair-accent);border-radius:20px;padding:34px 24px 28px;text-align:center;outline:none;box-shadow:0 30px 70px rgba(0,0,0,.6)}
.saida-x{position:absolute;top:6px;right:10px;width:44px;height:44px;background:none;border:0;color:var(--text);font-size:30px;line-height:1;cursor:pointer}
.saida-kicker{font-family:var(--mono);font-size:13px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--bright);margin:0 0 12px}
.saida-box h2{font-family:var(--serif);font-style:italic;font-weight:900;font-size:27px;line-height:1.18;color:#fff;margin:0 0 20px;letter-spacing:-.01em;text-wrap:balance}
.saida-guia{display:flex;align-items:center;gap:16px;text-align:left;margin:0 0 18px}
.saida-guia img{width:96px;height:128px;object-fit:cover;border-radius:3px 6px 6px 3px;box-shadow:0 12px 28px rgba(0,0,0,.55);flex:none}
.saida-guia b{display:block;font-family:var(--serif);font-weight:700;font-size:20px;line-height:1.22;color:#fff;margin-bottom:6px}
.saida-guia span{display:block;font-size:16px;line-height:1.45;color:var(--text);text-wrap:balance}
.saida-preco{font-size:16px;color:var(--text);margin:0 0 20px}
.saida-cta{display:block;width:100%;box-sizing:border-box;padding:17px 24px;border-radius:999px;background:var(--bright);color:#140408;font-weight:800;font-size:18px;text-decoration:none;box-shadow:0 5px 0 color-mix(in srgb,var(--bright) 55%,#000);transition:transform .15s ease,box-shadow .15s ease,filter .16s ease}
.saida-cta:hover{filter:brightness(1.08)}
.saida-cta:active{transform:translateY(3px);box-shadow:0 2px 0 color-mix(in srgb,var(--bright) 55%,#000)}
.saida-fechar{margin-top:20px;padding:6px 8px;background:none;border:0;color:var(--text);font-family:var(--sans);font-size:16px;cursor:pointer;text-decoration:underline;text-underline-offset:4px}
@media (max-width:480px){.saida{align-items:flex-end;padding:0}.saida-box{max-width:none;border-radius:20px 20px 0 0;padding:30px 20px calc(24px + env(safe-area-inset-bottom))}}

/* computador (de 1.024 px): produto e prova à esquerda, a folha do pedido com o bump à direita, folha na 1ª tela */
@media (min-width:1024px){
  .pd{padding:26px 28px 24px}
  .pd-grade{max-width:1180px;gap:0;grid-template-columns:minmax(0,1fr) 520px;grid-template-rows:auto 1fr;column-gap:64px;row-gap:28px;align-items:start}
  .pd-prod{grid-column:1;grid-row:1;flex-direction:column;align-items:center;text-align:center;gap:24px;padding:6px 0 0}
  .pd-capa{width:auto;height:280px;border-radius:4px 8px 8px 4px;transform:rotate(-2deg);box-shadow:0 22px 48px rgba(0,0,0,.7),12px 12px 0 -4px rgba(255,255,255,.06),24px 24px 0 -8px rgba(255,255,255,.04)}
  .pd-tit{align-items:center;gap:10px}
  .pd-kick{display:inline-block;border:1px solid var(--hair-accent);border-radius:99px;padding:7px 14px;background:color-mix(in srgb,var(--bg) 45%,transparent)}
  .pd-h1{font-size:2.3rem;line-height:1.08;letter-spacing:-.02em}
  .pd-folha{grid-column:2;grid-row:1/span 2;padding:24px 26px 26px;box-shadow:8px 8px 0 var(--sombra)}
  .pd-extra{grid-column:1;grid-row:2;padding:0;align-items:center;text-align:center}
  .pd-leva{max-width:36ch;text-wrap:balance}
  .ck-prova{width:100%;text-align:left}
  .pd-stripe{margin-inline:0}
  .pd-barra{left:auto;right:max(28px,calc((100vw - 1180px) / 2));width:520px;bottom:14px}
}
/* de 1.280 px: três colunas numa visão só, o que leva e a prova | o pedido e depois a Stripe | o bump empilhado */
${duas ? CSS_DUAS : CSS_TRES}
      `}</style>
    </>
  );
}
