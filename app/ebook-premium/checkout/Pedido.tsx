"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import PageBeacon, { sendBeacon } from "../../PageBeacon";
import ExitIntent from "./ExitIntent";
import LpWidgets from "../../LpWidgets";

/* ============================================================
   EXP-124 (ck124, HC 08/10/26): «todos os checkouts se dividindo entre (A) antes, 3 colunas no computador, e (B)
   depois, modelo OQEL». Este arquivo é o braço B do checkout do guia e é IDÊNTICO byte a byte nas casas da família:
   tudo o que é da casa chega por props do page.tsx (EBOOK, HERO, PK, AVATARES, PROVA, o tema do <style> do A e a
   cor do chat). Zero texto da casa escrito aqui.
   Também moram aqui as peças que os dois braços compartilham: o sorteio (useModelo), o carimbo da session
   (carimboModelo), o beacon do primeiro toque na Stripe (PagarBeacon) e o placeholder de antes do sorteio (Sorteando).
   Molde do B: .scratch/ck124/ref/estante-depois-page.tsx (pele H «Traço leve» do checkout do OQEL, 08/10/26):
   a página monta o pedido sozinha (guia, bump, linhas e total, sem Stripe nenhuma) e a Stripe embutida só nasce no
   toque em «Finalizar o pedido», dentro da folha do pedido. «Mudar o pedido» desmonta a Stripe e devolve tudo.
   Uma session por toque em «Finalizar», nunca uma por carga de página nem por bump marcado.
   Computador a partir de 1.280 px: o que leva e a prova à esquerda, o pedido (e depois a Stripe) no meio, o bump
   à direita, nunca embaixo da Stripe. De 1.024 a 1.279 px, duas colunas (os mesmos cortes do carimbo do A).
   ============================================================ */

/** Chave do teste. false = todo mundo no A, nenhum beacon de braço e a session sem `ck_modelo`. */
export const SPLIT_MODELO: boolean = true;

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

type Modelo = "a" | "b";
const CHAVE = "ck_modelo";
/* O que o sorteio (ou ?v=) decidiu nesta carga. Vale pro carimbo da session dos dois braços; null = storage falhou
   (a jornada sai como ck-modelo-x e a session sem carimbo, fora da leitura). */
let decidido: Braco | null = null;

/* 50/50 por visitante, todos os aparelhos. A chave é uma só pros checkouts da casa (guia, app, Coleção, Estante):
   grava «a» ou «b» em minúscula e lê sem distinguir caixa, pra pessoa ver o mesmo modelo em todos. `?v=A` ou `?v=B`
   força o braço só nesta carga (prova): nada gravado e nenhum beacon de braço, a jornada fica fora da leitura.
   localStorage que falha = A e beacon ck-modelo-x. */
function sorteiaModelo(): { braco: Braco; beacon: Braco | "x" | null } {
  try {
    const v = (new URLSearchParams(window.location.search).get("v") || "").toLowerCase();
    if (v === "a" || v === "b" || v === "c") return { braco: v, beacon: null };
  } catch {
    /* sem URLSearchParams: segue pro sorteio */
  }
  if (!largou()) return { braco: "a", beacon: null };
  try {
    const g = (localStorage.getItem(CHAVE) || "").toLowerCase();
    if (g === "a" || g === "b" || g === "c") return { braco: g, beacon: g };
    const m = sorteia3();
    localStorage.setItem(CHAVE, m);
    return { braco: m, beacon: m };
  } catch {
    return { braco: "a", beacon: "x" };
  }
}

/** null até o sorteio decidir (a página mostra o Sorteando); com a chave desligada, "a" desde o servidor. */
export function useModelo(slug: string): Modelo | null {
  const [modelo, setModelo] = useState<Modelo | null>(SPLIT_MODELO ? null : "a");
  useEffect(() => {
    if (!SPLIT_MODELO) return;
    const r = sorteiaModelo();
    bracoAtual = r.braco;
    decidido = r.beacon && r.beacon !== "x" ? r.braco : null;
    setModelo(r.braco === "a" ? "a" : "b");
    // 1 por jornada (dedupe do sendBeacon), ao decidir; mesmo journey_id da compra. Braço forçado por ?v= não manda.
    if (r.beacon) sendBeacon(slug, `ck-modelo-${r.beacon}`);
  }, [slug]);
  return modelo;
}

/** Vai no body do create-session dos dois braços: `metadata.ck_modelo` = "a" | "b". Vazio com a chave desligada, com o
 *  braço forçado por `?v=` e com o localStorage falho (a session fica fora da leitura). */
export function carimboModelo(): { ck_modelo?: Braco } {
  return SPLIT_MODELO && decidido ? { ck_modelo: decidido } : {};
}

/** Antes do sorteio: só o fundo da casa, sem texto, pra nunca piscar de um braço pro outro. */
export function Sorteando({ tema }: { tema: string }) {
  return (
    <>
      <style>{tema}</style>
      <style>{"body{background:var(--bg)}"}</style>
      <main aria-busy="true" style={{ minHeight: "100vh" }} />
    </>
  );
}

/* Primeiro toque no formulário da Stripe: beacon `passo`, 1 vez por jornada (molde do app-ck-pagar,
   app-scriptorium/66). O formulário mora num iframe de outra origem, então o toque nunca chega aqui
   como clique: o que a página enxerga é a janela perder o foco (blur) com o iframe de dentro do #checkout-box como
   elemento ativo. Duas redes pro mesmo predicado: a conferência no próximo tick e a de 1 em 1 segundo (webview que
   não entrega o blur). Idêntico nos dois braços: o A monta ao lado do PageBeacon, o B dentro do Pedido, e os dois
   montam a Stripe em #checkout-box. */
export function PagarBeacon({ slug, passo }: { slug: string; passo: string }) {
  const ja = useRef(false);
  useEffect(() => {
    let relogio = 0;
    const para = () => {
      window.removeEventListener("blur", onBlur);
      window.clearInterval(relogio);
    };
    const confere = () => {
      if (ja.current) return;
      const el = document.activeElement;
      if (!el || el.tagName !== "IFRAME" || !el.closest("#checkout-box")) return;
      ja.current = true;
      para();
      sendBeacon(slug, passo, { eventType: "converteu" });
    };
    function onBlur() {
      confere();
      window.setTimeout(confere, 0);
    }
    window.addEventListener("blur", onBlur);
    relogio = window.setInterval(confere, 1000);
    return para;
  }, [slug, passo]);
  return null;
}

/** A marca da nav como o A escreve (fábrica): a primeira palavra em destaque e o resto; «AIShot» vira «AI» + «Shot». */
export function marcaDaNews(news: string): { t: string; s: string } {
  const i = news.indexOf(" ");
  if (i > 0) return { t: news.slice(0, i), s: news.slice(i) };
  if (news.endsWith("Shot") && news.length > 4) return { t: news.slice(0, -4), s: "Shot" };
  return { t: news, s: "" };
}

/* ---------------------------------------------------------------- o braço B */

export type EbookDaCasa = {
  slug: string;
  news: string;
  capa: string;
  capaAlt: string;
  titulo: string;
  kicker: string;
  preco: string;
  precoDe: string;
  resumo: string;
  garantiaNome: string;
  app: { capa: string; capaAlt: string; preco: string; de: string; linhas: string[]; nota: string };
  despedida: string;
};
export type HeroDaCasa = { arte: string; sub: string };
export type ProvaDaCasa = {
  exibir: boolean;
  exibir_nota: boolean;
  media_exibido: string | number;
  media_pct: number;
  votos: number | string;
  leitores_exibido: string | number;
  distribuicao: { estrelas: number; pct: number }[];
  depoimento: { texto: string; quem: string; nota: number | string } | null;
};
type Props = {
  ebook: EbookDaCasa;
  hero: HeroDaCasa;
  pk: string | undefined;
  avatares: string[];
  prova: ProvaDaCasa;
  /** Fontes e tokens do :root do <style> do A (vazio quando a casa já os tem no globals.css). */
  tema: string;
  chat: { cor: string; corTexto: string };
};

const ROTULO_IR = "Finalizar o pedido";
const ABRINDO = "Abrindo a Stripe…";
/** Teto de espera da rota e do Stripe.js: passou dele, o erro aparece e o botão volta. */
const PRAZO_MS = 20000;
/** Altura do formulário embutido (CPF, Pix, cartão, boleto e Link), pra prova e rodapé não pularem enquanto monta. */
const ALTURA_FORM = 720;
/** Com o iframe nesta altura o formulário já pintou: é o «montou» do beacon. */
const ALTURA_MONTOU = 300;

type CheckoutHandle = { mount: (sel: string) => void; destroy: () => void };
type StripeJs = {
  initEmbeddedCheckout: (opts: { fetchClientSecret: () => Promise<string> }) => Promise<CheckoutHandle>;
};
const stripeDaJanela = () => (window as unknown as { Stripe?: (pk: string) => StripeJs }).Stripe;

/** R$ 47 quando é inteiro, R$ 48,50 quando tem centavo. */
function reais(centavos: number): string {
  const r = Math.floor(centavos / 100);
  const c = centavos % 100;
  const int = r.toLocaleString("pt-BR");
  return c ? `R$ ${int},${String(c).padStart(2, "0")}` : `R$ ${int}`;
}

/** "R$ 48,50" → 4850; "R$ 1.000" → 100000. Reserva pra quando a rota não responde o preço. */
function centavos(texto: string): number {
  const m = /(\d[\d.]*)(?:,(\d{1,2}))?/.exec(texto || "");
  if (!m) return NaN;
  return Number(m[1].replace(/\./g, "")) * 100 + Number((m[2] || "0").padEnd(2, "0"));
}

/* LEGIVEL: o valor em reais nunca quebra de linha entre o "R$" e o número */
const nb = (t: string) => t.replace(/R\$ (?=\d)/g, "R$ ");

/* Stripe.js por script tag, uma vez por página: o aquecimento no ocioso e o clique esperam a mesma promessa. */
let stripeJs: Promise<StripeJs> | null = null;
function carregaStripe(pk: string): Promise<StripeJs> {
  if (stripeJs) return stripeJs;
  stripeJs = new Promise<StripeJs>((ok, falha) => {
    const pronto = () => {
      const S = stripeDaJanela();
      return S ? ok(S(pk)) : falha(new Error("stripe.js vazio"));
    };
    if (stripeDaJanela()) return pronto();
    const s = document.createElement("script");
    const prazo = window.setTimeout(() => falha(new Error("stripe.js demorou")), PRAZO_MS);
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

/* Lê a jornada que o PageBeacon abriu na primeira página (mesmos campos do A). Best-effort: modo privado
   ou storage bloqueado devolve vazio e o checkout segue igual, só sem atribuição. */
function jornada() {
  try {
    return {
      journey: sessionStorage.getItem("vdn_journey") || "",
      src: sessionStorage.getItem("vdn_source") || "",
      // onda mensal (c4-20k/11) e recuperação (rec-v2): janela de 24h carimbada pelo PageBeacon
      oferta: sessionStorage.getItem("vdn_oferta") || "",
      ate: sessionStorage.getItem("vdn_ate") || "",
    };
  } catch {
    return { journey: "", src: "", oferta: "", ate: "" };
  }
}

/* c420/153: o desenho que a pessoa viu viaja na session como `checkout_variant`, com os mesmos cortes do A:
   "cel" (até 639 px), "1col" (640 a 1.023), "2col" (1.024 a 1.279) e "3col" (1.280 px ou mais). */
function desenho(): "cel" | "1col" | "2col" | "3col" {
  try {
    const m = (q: string) => window.matchMedia(q).matches;
    return m("(max-width: 639px)") ? "cel" : m("(min-width: 1280px)") ? (bracoAtual === "c" ? "2col" : "3col") : m("(min-width: 1024px)") ? "2col" : "1col";
  } catch {
    return "2col";
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
  let m = /--bright:\s*(#[0-9a-fA-F]{6})\b/.exec(tema);
  // Casa com os tokens no globals.css (tema vazio): a cor sai do :root já pintado. Só roda no toque, no navegador.
  if (!m && typeof window !== "undefined") {
    try {
      m = /^(#[0-9a-fA-F]{6})$/.exec(getComputedStyle(document.documentElement).getPropertyValue("--bright").trim());
    } catch {
      /* sem estilo lido: fica o vinho neutro */
    }
  }
  return mistura(m ? m[1] : "#8A6670", "#1A0E12", 0.58);
}

/* A partir de 1.280 px: o B abre em 3 colunas (o que leva | o pedido | os extras); o C fica nas 2 colunas do
   1.024, um pouco mais largo, com os extras dentro do pedido (EXP-125). */
const CSS_TRES = `@media (min-width:1280px){
  .ck-top{max-width:1416px}
  .ck-grade{max-width:1360px;grid-template-columns:minmax(0,1fr) 500px minmax(300px,360px);column-gap:40px}
  .ck-prod{grid-column:1;grid-row:1}
  .ck-extra{grid-column:1;grid-row:2}
  .ck-caixa{grid-column:2;grid-row:1/span 2}
  .ck-bumps-folha{display:none}
  .ck-lado{display:block;grid-column:3;grid-row:1/span 2}
  .ck-bumps-lado{gap:22px;padding-top:10px}
  .ck-bumps-k{font:500 13px/1.2 var(--mono);letter-spacing:.18em;text-transform:uppercase;color:var(--bright);text-align:center;margin:0 0 4px}
  .ck-bumps-lado .bumpcard{padding:16px 12px 12px;gap:7px}
  .ck-bumps-lado .bnome{font-size:17px}
  .ck-bumps-lado .blista li{font-size:14px}
  .ck-bumps-lado .bbar{min-height:44px;font-size:15px}
  .ck-bumps-lado .ck-blinha{flex-direction:column;align-items:flex-start;gap:4px}
  .ck-par{--h:220px}
  /* o pedido fica à vista enquanto a pessoa rola o bump da direita */
  .ck-caixa.fixa{position:sticky;top:16px}
  .ck-pg{padding-bottom:16px}
  .ck-barra{display:none}
}
`;
const CSS_DUAS = `@media (min-width:1280px){
  .ck-top{max-width:1296px}
  .ck-grade{max-width:1240px;grid-template-columns:minmax(0,1fr) 540px;column-gap:80px}
  .ck-barra{right:max(28px,calc((100vw - 1240px) / 2));width:540px}
}
`;

export default function Pedido({ ebook, hero, pk, avatares, prova, tema, chat }: Props) {
  const duas = bracoAtual === "c";
  // Bump = o app do próprio guia pela metade (c4-20k/20): a rota recebe `bump: "app"`, como no A.
  const [bump, setBump] = useState(false);
  const [fase, setFase] = useState<"pedido" | "abrindo" | "stripe">("pedido");
  const [erro, setErro] = useState<string | null>(null);
  // Preço em centavos, lido da rota com o mesmo cálculo da session (oferta e janela); null enquanto chega.
  const [preco, setPreco] = useState<{ base: number; app: number } | null>(null);
  // Barra fixa do total (até 1.279 px): aparece enquanto o botão do pedido está fora da tela.
  const [btnVisivel, setBtnVisivel] = useState(true);
  const atual = useRef<CheckoutHandle | null>(null);
  const ocupado = useRef(false);
  const caixaRef = useRef<HTMLElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const clicou = useRef(0);
  const montouJa = useRef(false);

  // O preço antes de qualquer session: `so_preco` na rota devolve base e app sem tocar na Stripe. Se a rota não
  // responde, os valores da casa (EBOOK.preco e EBOOK.app.preco) seguram a folha; a session vem com o preço certo.
  useEffect(() => {
    const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    fetch("/api/create-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ so_preco: true, ...jornada() }),
      signal: ctl?.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        if (typeof d?.base !== "number" || typeof d?.app !== "number") throw new Error("sem preço");
        setPreco({ base: d.base, app: d.app });
      })
      .catch(() => {
        if (ctl?.signal.aborted) return;
        setPreco((p) => p ?? { base: centavos(ebook.preco), app: centavos(ebook.app.preco) });
      });
    return () => ctl?.abort();
  }, [ebook.preco, ebook.app.preco]);

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
  }, [fase]);

  // A Stripe monta depois que o contêiner aparece (efeito da fase), nunca num quadro solto.
  useEffect(() => {
    if (fase !== "stripe") return;
    const alvo = formRef.current;
    const emb = atual.current;
    if (!alvo || !emb || alvo.childElementCount) return;
    alvo.classList.add("reserva");
    emb.mount("#checkout-box");
    const fim = Date.now() + 15000;
    const confere = () => {
      const ifr = alvo.querySelector("iframe");
      const altura = ifr ? ifr.getBoundingClientRect().height : 0;
      if (altura >= ALTURA_MONTOU && !montouJa.current) {
        montouJa.current = true;
        // ms do clique em «Finalizar» até o formulário pintado, no nome do passo (a tabela não tem campo numérico)
        sendBeacon(ebook.slug, `ebook-ck-montou@${Date.now() - clicou.current}`, { eventType: "converteu" });
      }
      if (altura >= ALTURA_FORM - 60 || Date.now() > fim || !alvo.isConnected) alvo.classList.remove("reserva");
      else window.setTimeout(confere, 100);
    };
    window.setTimeout(confere, 100);
    // O pedido encolhe (bump e botão saem): se o topo dele ficou acima da tela, ele volta pra vista.
    const cx = caixaRef.current;
    if (cx && (cx.getBoundingClientRect().top < 0 || window.matchMedia("(max-width: 1023px)").matches)) {
      cx.scrollIntoView({ block: "start", behavior: suave() });
    }
    alvo.focus({ preventScroll: true });
  }, [fase, ebook.slug]);

  const aberto = fase === "stripe";
  const travado = fase !== "pedido";
  const total = preco ? preco.base + (bump ? preco.app : 0) : null;
  const marca = marcaDaNews(ebook.news);
  const depo = prova.depoimento;

  /** «Mudar o pedido»: desmonta a Stripe e devolve bump e botão; o foco volta pro «Finalizar». */
  function mudaPedido() {
    atual.current?.destroy();
    atual.current = null;
    setFase("pedido");
    window.setTimeout(() => {
      caixaRef.current?.scrollIntoView({ block: "nearest", behavior: suave() });
      btnRef.current?.focus({ preventScroll: true });
    }, 30);
  }

  function alterna() {
    // Com a Stripe aberta ou abrindo, o bump fica travado: mudar o pedido é pelo «Mudar o pedido»,
    // nunca apagando o formulário em silêncio.
    if (travado) return;
    setBump((b) => !b);
  }

  async function abre(origem: "folha" | "barra") {
    if (!pk || fase !== "pedido" || ocupado.current) return;
    ocupado.current = true;
    setErro(null);
    setFase("abrindo");
    clicou.current = Date.now();
    sendBeacon(ebook.slug, "ebook-ck-finalizar", { eventType: "converteu" });
    sendBeacon(ebook.slug, `ebook-ck-finalizar@${origem}`, { eventType: "converteu" });
    // Quem tocou na barra vê o «Abrindo a Stripe…» no botão do pedido.
    if (origem === "barra") btnRef.current?.scrollIntoView({ block: "center", behavior: suave() });
    // Mesmo body do A (bump, carimbo do desenho e jornada) mais o braço do modelo.
    const corpo = { bump: bump ? "app" : false, checkout_variant: desenho(), ck_cor: acentoDaCasa(tema), ...jornada(), ...carimboModelo() };
    try {
      // A session nasce só aqui, no toque; o Stripe.js já veio no aquecimento (ou chega junto).
      const sinal = "timeout" in AbortSignal ? AbortSignal.timeout(PRAZO_MS) : undefined;
      const d = await fetch("/api/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
        signal: sinal,
      }).then((r) => r.json());
      if (!d.clientSecret) throw new Error(d.error || "sem clientSecret");
      const sj = await carregaStripe(pk);
      atual.current = await sj.initEmbeddedCheckout({ fetchClientSecret: () => Promise.resolve(d.clientSecret as string) });
      setFase("stripe");
    } catch (e) {
      atual.current?.destroy();
      atual.current = null;
      setFase("pedido");
      setErro((e as Error).message || "a Stripe não respondeu");
      window.setTimeout(() => {
        btnRef.current?.scrollIntoView({ block: "center", behavior: suave() });
        btnRef.current?.focus({ preventScroll: true });
      }, 30);
    } finally {
      ocupado.current = false;
    }
  }

  /* Card do bump «Você leva os dois» com os textos do A (a capa do guia, o sinal de mais e o celular, nome, preço
     de/por, as linhas e a barra de marcar), na pele do modelo: bloco creme com fita, a cena ocupando a largura do
     cartão. Até 1.279 px mora dentro da folha, antes do botão; de 1.280 px vai pra coluna da direita. */
  const cartao = (onde: "folha" | "lado") => {
    const id = `bump-${onde}`;
    return (
      <section className={`ck-bumps ck-bumps-${onde}`} aria-label="Adicione ao pedido">
        {onde === "lado" && <p className="ck-bumps-k">Adicione ao pedido</p>}
        <div className={`bumpcard${bump ? " on" : ""}${travado ? " trava" : ""}`}>
          <span className="ck-fita" aria-hidden="true" />
          {onde === "folha" && <span className="ck-btag">Adicione ao pedido</span>}
          <span className="ck-palco" style={{ "--img": `url("${ebook.app.capa}")` } as CSSProperties}>
            <span className="bcapa"><img src={ebook.capa} alt="" width={78} height={104} loading="lazy" /></span>
            <span className="bmais" aria-hidden="true">+</span>
            <span className="bfone"><img src={ebook.app.capa} alt={ebook.app.capaAlt} width={390} height={844} loading="lazy" /></span>
          </span>
          <span className="bleg" aria-hidden="true"><span>o guia</span><span>o app</span></span>
          <span className="ck-blinha">
            <span className="bnome" id={`${id}-nome`}>O app do guia pela metade</span>
            <span className="bpreco" id={`${id}-preco`}><s aria-hidden="true">{ebook.app.de}</s><span className="ck-vh">de {ebook.app.de} por </span> {nb(ebook.app.preco)}</span>
          </span>
          <ul className="blista">
            {ebook.app.linhas.map((l) => (
              <li key={l}>{nb(l)}</li>
            ))}
          </ul>
          <label className="bbar" htmlFor={id}>
            <input type="checkbox" id={id} checked={bump} disabled={travado} onChange={alterna} aria-describedby={`${id}-nome ${id}-preco`} />
            <span className="bx" aria-hidden="true">{bump ? "✓" : ""}</span>
            <span>{bump ? "Adicionado ao pedido" : aberto ? "Pra levar junto, toque em «Mudar o pedido»" : "Levar os dois"}</span>
          </label>
        </div>
      </section>
    );
  };

  return (
    <>
      <style>{tema}</style>
      <PageBeacon slug={ebook.slug} step="ebook-premium-checkout" source="ebook-premium" />
      <PagarBeacon slug={ebook.slug} passo="ebook-ck-pagar" />
      {/* saída do checkout (c4-20k/40): capítulo 1 na versão web, uma vez por sessão, só no gesto de sair */}
      <ExitIntent slug={ebook.slug} titulo={ebook.titulo} />

      <header className="ck-top">
        <a href="/" className="brand" aria-label="Home">
          <img src="/ebook-web/simbolo.png" alt="" width={32} height={32} />
          <span className="wm"><span className="t">{marca.t}</span><span className="s">{marca.s}</span></span>
        </a>
        <span className="ck-seg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
          Pedido seguro
        </span>
      </header>

      <main className={duas ? "ck-pg ck-duas" : "ck-pg"} data-legivel="1" data-braco={bracoAtual}>{/* LEGIVEL (col/32) */}
        <h1 className="ck-vh">Finalizar o pedido: {ebook.titulo}</h1>
        <div className="ck-grade">
          <section className="ck-prod" aria-label="O guia">
            <div className={`ck-par${bump ? " dois" : ""}`}>
              <img className="ck-pcapa" src={ebook.capa} alt={ebook.capaAlt} width={600} height={800} fetchPriority="high" />
              <span className="ck-fone" aria-hidden="true"><img src={ebook.app.capa} alt="" width={390} height={844} loading="lazy" /></span>
            </div>
            <div className="ck-tit">
              <span className="ck-kick">{ebook.kicker}</span>
              <b className="ck-nome">{ebook.titulo}</b>
              <span className="ck-sub">{nb(hero.sub)}</span>
            </div>
          </section>

          <section className={`ck-caixa${aberto ? "" : " fixa"}`} aria-label="Seu pedido" aria-busy={fase === "abrindo"} ref={caixaRef}>
            <p className="ck-rot" role="heading" aria-level={2}>Seu pedido</p>

            <div className="ck-linhas">
              <div className="ck-li"><span>{ebook.titulo}<small>{ebook.kicker}</small></span><b>{preco ? reais(preco.base) : " "}</b></div>
              {bump && <div className="ck-li ck-li-b"><span>O app do guia<small>pela metade</small></span><b>{preco ? reais(preco.app) : " "}</b></div>}
            </div>

            {!aberto && cartao("folha")}

            <div className="ck-tot" aria-live="polite" aria-atomic="true" hidden={aberto}>
              <span>Total hoje</span>
              <div><b>{total !== null && Number.isFinite(total) ? reais(total) : " "}</b><small>uma vez só</small></div>
            </div>

            {!aberto && (
              <div className="pv-cta">
                <button ref={btnRef} className="pv-btn" type="button" onClick={() => abre("folha")} disabled={fase === "abrindo" || !pk}>
                  {fase === "abrindo" ? ABRINDO : ROTULO_IR}
                </button>
                <p className="ck-acel">Pix ou cartão · acesso no seu email na hora</p>
              </div>
            )}
            {!pk && (
              <div className="ck-pend">
                <p><b>Checkout em preparação.</b></p>
                <p>O checkout abre aqui assim que as chaves da Stripe entrarem no ambiente. Nada é cobrado até lá.</p>
              </div>
            )}
            <p className="ck-vh" role="status">{fase === "abrindo" ? ABRINDO : ""}</p>
            {erro && <div className="ck-pend ck-erro" role="alert"><p><b>O checkout não abriu.</b></p><p>{erro}</p></div>}

            {aberto && (
              <button type="button" className="ck-mudar" onClick={mudaPedido}>Mudar o pedido</button>
            )}
            <div className="ck-stripe" hidden={!aberto} role="region" aria-label="Formulário da Stripe">
              <div id="checkout-box" className="ck-form" ref={formRef} tabIndex={-1} />
            </div>
          </section>

          <aside className="ck-lado">{cartao("lado")}</aside>

          <div className="ck-extra">
            {/* reforço igual ao A (HC 11/09, B2): nota no método Amazon + leitores da casa + um voto real. Some inteiro
                em casa sem lastro (piso: 1.000 leitores, 50 votos), em vez de mostrar número fraco. */}
            {prova.exibir && prova.exibir_nota && (
              <section className="ck-prova" aria-label={`O que os leitores da ${ebook.news} dizem`}>
                <div className="ck-media">
                  <b>{prova.media_exibido}</b>
                  <div>
                    <span className="ck-stars" style={{ "--f": `${prova.media_pct}%` } as CSSProperties} aria-label={`${prova.media_exibido} de 5`}>
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

        {/* celular e duas colunas: a barra do total presa embaixo enquanto o botão da folha não está na tela */}
        {fase === "pedido" && pk && (
          <div className={`ck-barra${btnVisivel ? "" : " on"}`} inert={btnVisivel}>
            <div className="ck-barra-tot"><span>Total hoje</span><b>{total !== null && Number.isFinite(total) ? reais(total) : " "}</b></div>
            <button type="button" className="ck-barra-btn" onClick={() => abre("barra")}>{ROTULO_IR}</button>
          </div>
        )}
      </main>

      <footer className="ck-foot">
        <p>{ebook.despedida}</p>
      </footer>

      {/* chat de dúvidas também no checkout (HC 19/09/26): só o chat, sem prova nem botão de compra */}
      <LpWidgets slug={ebook.slug} produto="ebook" local="checkout" cor={chat.cor} corTexto={chat.corTexto} />

      <style>{`
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--sans);background:var(--bg);color:var(--text);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{color:inherit;text-decoration:none}
img{display:block;max-width:100%}
/* a folha de papel do pedido: tinta e acento derivados do --bright da casa, papel igual em todas */
:root{--papel:#F7F1E6;--creme:#EFE4D3;--ink:color-mix(in srgb,var(--bright) 14%,#1C1517);--ink2:color-mix(in srgb,var(--bright) 10%,#463B3F);--mut:#6F6367;--acc:color-mix(in srgb,var(--bright) 56%,#000);--acc-d:color-mix(in srgb,var(--bright) 46%,#000);--marcado:color-mix(in srgb,var(--bright) 16%,#F7F1E6);--verde:#2F7D5B;--sombra:color-mix(in srgb,var(--bright) 62%,#000);--fita:color-mix(in srgb,var(--bright) 55%,transparent)}
.ck-vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

/* topo: marca e «Pedido seguro» numa linha só */
.ck-top{display:flex;justify-content:space-between;align-items:center;gap:10px;max-width:592px;margin:0 auto;padding:12px 16px 4px}
.brand{display:flex;align-items:center;gap:9px;min-height:44px}
.brand img{width:26px;height:26px}
.wm{font-weight:700;font-size:17px;letter-spacing:-.02em;white-space:nowrap}
.wm .t{color:var(--bright)}.wm .s{color:#fff}
.ck-seg{display:inline-flex;align-items:center;gap:6px;font:600 13px/1 var(--sans);color:var(--text);white-space:nowrap}
.ck-seg svg{width:15px;height:15px;flex:none}

/* grade: no celular, guia, pedido, prova */
.ck-pg{padding:8px 16px 96px}
.ck-grade{display:grid;gap:18px;max-width:560px;margin:0 auto}
.ck-grade>*{min-width:0}
.ck-prod{display:flex;align-items:center;gap:16px;padding-inline:2px}
.ck-par{flex:none;display:flex;align-items:center;--h:76px}
.ck-pcapa{height:var(--h);width:auto;aspect-ratio:3/4;object-fit:cover;border-radius:3px 6px 6px 3px;box-shadow:0 10px 22px rgba(0,0,0,.6)}
.ck-fone{display:none}
.ck-tit{display:flex;flex-direction:column;gap:2px;min-width:0}
.ck-kick{font:500 13px/1.3 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--bright)}
.ck-nome{font:italic 900 24px/1.12 var(--serif);color:#fff;letter-spacing:-.01em;text-wrap:balance}
.ck-sub{font-size:15px;line-height:1.4;color:var(--text);text-wrap:pretty}

/* o pedido: folha de papel com contorno de tinta e sombra dura; por dentro, zero linha */
.ck-caixa{display:flex;flex-direction:column;gap:14px;background:var(--papel);color:var(--ink2);border:2px solid var(--ink);border-radius:22px;padding:20px 15px 22px;box-shadow:6px 6px 0 var(--sombra);scroll-margin-top:12px}
.ck-caixa>*{min-width:0}
.ck-rot{font:500 13px/1.2 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--acc)}
.ck-linhas{display:flex;flex-direction:column;gap:10px}
.ck-li{display:flex;justify-content:space-between;align-items:baseline;gap:14px;font:600 16px/1.35 var(--sans);color:var(--ink2)}
.ck-li>span{display:flex;flex-direction:column;gap:1px;min-width:0}
.ck-li small{font:500 13px/1.3 var(--sans);color:var(--mut)}
.ck-li b{flex:none;font:900 19px/1 var(--serif);color:var(--ink);font-variant-numeric:tabular-nums}
.ck-li-b{font-size:15px}
.ck-li-b b{font-size:17px}

/* bump: bloco creme colado com fita; marcado, vira a cor da casa clareada */
.ck-bumps{display:flex;flex-direction:column;gap:18px}
.ck-bumps-folha{margin-top:6px}
.bumpcard{position:relative;display:flex;flex-direction:column;gap:8px;padding:18px 14px 14px;background:var(--creme);border-radius:18px;color:var(--ink2);transition:background-color .2s}
.ck-fita{position:absolute;left:50%;top:-10px;width:80px;height:20px;margin-left:-40px;background:var(--fita);transform:rotate(-3deg)}
.ck-btag{font:500 13px/1.2 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--acc)}
.ck-palco{position:relative;display:flex;align-items:center;justify-content:center;gap:12px;width:100%;aspect-ratio:2/1;border-radius:12px;overflow:hidden;isolation:isolate;background:#1a1012}
.ck-palco::before{content:"";position:absolute;inset:-24px;z-index:-1;background:var(--img) center/cover no-repeat;filter:blur(20px) brightness(.45) saturate(1.15)}
.bcapa{display:block;height:76%;aspect-ratio:3/4}
.bcapa img{height:100%;width:auto;border-radius:3px 6px 6px 3px;box-shadow:0 14px 30px rgba(0,0,0,.6)}
.bmais{font-family:var(--serif);font-size:30px;line-height:1;color:#fff;width:18px;text-align:center}
.bfone{display:block;height:88%;aspect-ratio:390/844;padding:2%;border-radius:9.5% / 4.4%;background:#0b0b0b;box-shadow:0 18px 30px -14px rgba(0,0,0,.85),inset 0 0 0 2px #2a2a2a}
.bfone img{width:100%;height:100%;object-fit:cover;object-position:top;border-radius:7.5% / 3.5%}
.bleg{display:flex;justify-content:center;gap:34px;font:500 13px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--mut)}
.ck-blinha{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:2px 12px;margin-top:2px}
.bnome{flex:1 1 auto;min-width:0;font:700 18px/1.2 var(--serif);color:var(--ink);text-wrap:balance}
.bpreco{flex:none;font:900 18px/1 var(--serif);color:var(--ink);font-variant-numeric:tabular-nums;white-space:nowrap}
.bpreco s{font:500 14px/1 var(--sans);color:var(--mut);margin-right:4px}
.blista{list-style:none;display:flex;flex-direction:column;gap:7px}
.blista li{font-size:15px;color:var(--ink2);line-height:1.45;padding-left:24px;position:relative}
.blista li::before{content:"✓";position:absolute;left:0;top:0;font-weight:800;color:var(--verde)}
.bbar{position:relative;display:flex;align-items:center;gap:12px;min-height:50px;margin-top:4px;padding:7px 13px;background:var(--papel);border:2px solid var(--ink);border-radius:14px;font:700 16px/1.2 var(--sans);color:var(--ink);cursor:pointer;user-select:none}
.bbar input{position:absolute;opacity:0;width:1px;height:1px;margin:0}
.bx{flex:none;display:grid;place-items:center;width:28px;height:28px;border:2px solid var(--ink);border-radius:8px;background:#FFFDF8;font:900 17px/1 var(--sans);color:#fff;transition:background-color .15s}
.bbar input:focus-visible+.bx{outline:3px solid var(--acc);outline-offset:2px}
.bumpcard.on{background:var(--marcado)}
.bumpcard.trava .bbar{cursor:default;font-size:14px}
.bumpcard.trava:not(.on){opacity:.72}
.bumpcard.on .bx{background:var(--verde);animation:ck-salta .45s cubic-bezier(.3,1.6,.5,1)}
@keyframes ck-salta{0%{transform:scale(.5) rotate(-14deg)}60%{transform:scale(1.22) rotate(5deg)}100%{transform:none}}
@media (prefers-reduced-motion:reduce){.bumpcard.on .bx{animation:none}}

/* total, botão, apoio */
.ck-tot{display:flex;justify-content:space-between;align-items:baseline;gap:14px;margin-top:4px}
.ck-tot>span{font:700 17px/1.2 var(--sans);color:var(--ink2);white-space:nowrap}
.ck-tot>div{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.ck-tot[hidden]{display:none}
.ck-tot b{font:900 40px/1 var(--serif);color:var(--ink);letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.ck-tot small{font:600 13px/1.2 var(--sans);color:var(--mut)}
.pv-cta{display:flex;flex-direction:column;gap:12px}
.pv-btn{display:flex;align-items:center;justify-content:center;width:100%;min-height:62px;padding:14px 22px;border:2px solid var(--ink);border-radius:18px;background:var(--acc);color:#FFF8EE;font:800 20px/1.1 var(--sans);cursor:pointer;box-shadow:4px 4px 0 var(--ink);transition:transform .12s,box-shadow .12s,background-color .15s}
.pv-btn:hover{background:var(--acc-d);transform:translate(-1px,-1px);box-shadow:6px 6px 0 var(--ink)}
.pv-btn:active{transform:translate(3px,3px);box-shadow:1px 1px 0 var(--ink)}
.pv-btn:focus-visible{outline:3px solid var(--acc);outline-offset:4px}
.pv-btn[disabled]{opacity:.7;cursor:wait;transform:none;box-shadow:4px 4px 0 var(--ink)}
.ck-acel{text-align:center;font:600 14px/1.3 var(--sans);color:var(--mut)}
.ck-pend{padding:4px 2px 0;color:var(--ink2)}
.ck-pend p{font-size:15px;line-height:1.5;margin:0 0 .4rem}
.ck-pend b{color:var(--ink)}
.ck-erro b{color:#A3293F}
.ck-mudar{align-self:flex-start;border:0;background:none;padding:6px 0;min-height:32px;color:var(--acc);font:700 15px var(--sans);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.ck-mudar:focus-visible{outline:3px solid var(--acc);outline-offset:2px}
.ck-stripe{margin-inline:-6px}
.ck-stripe[hidden]{display:none}
.ck-form{border-radius:14px;overflow:hidden;background:#fff}
.ck-form:focus{outline:none}
.ck-form.reserva{min-height:${ALTURA_FORM}px}

/* celular: barra do total presa embaixo enquanto o botão da folha não aparece */
.ck-barra{position:fixed;left:16px;right:16px;bottom:10px;z-index:40;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 10px 10px 16px;background:var(--papel);border:2px solid var(--ink);border-radius:18px;box-shadow:4px 4px 0 var(--sombra);transform:translateY(140%);visibility:hidden;transition:transform .25s ease,visibility .25s}
.ck-barra.on{transform:none;visibility:visible}
.ck-barra-tot{display:flex;flex-direction:column;gap:1px;min-width:0}
.ck-barra-tot span{font:600 13px/1.2 var(--sans);color:var(--mut)}
.ck-barra-tot b{font:900 24px/1 var(--serif);color:var(--ink);font-variant-numeric:tabular-nums;white-space:nowrap}
.ck-barra-btn{flex:none;min-height:56px;padding:10px 18px;border:2px solid var(--ink);border-radius:14px;background:var(--acc);color:#FFF8EE;font:800 16px/1.1 var(--sans);cursor:pointer;box-shadow:3px 3px 0 var(--ink)}
.ck-barra-btn:focus-visible{outline:3px solid #fff;outline-offset:3px}
@media (prefers-reduced-motion:reduce){.ck-barra{transition:none}}

/* prova, direto no fundo da casa (mesmo bloco do A) */
.ck-lado{display:none}
.ck-extra{display:flex;flex-direction:column;gap:24px;padding:10px 0 0}
.ck-prova{margin:0;padding:20px 18px;border:1px solid var(--hair);border-radius:16px;background:var(--bg-deep);display:flex;flex-direction:column;gap:16px}
.ck-media{display:flex;align-items:center;gap:14px}
.ck-media>b{font-family:var(--serif);font-size:60px;line-height:.95;color:#fff;font-variant-numeric:tabular-nums}
.ck-media>div{display:flex;flex-direction:column;gap:5px}
.ck-media small{font-size:15px;color:var(--text)}
.ck-stars{position:relative;display:inline-block;font-size:27px;line-height:1;letter-spacing:2px}
.ck-stars .st-b{color:rgba(207,200,202,.22)}
.ck-stars .st-f{position:absolute;left:0;top:0;width:var(--f,100%);overflow:hidden;white-space:nowrap;color:#E6B85C}
.ck-bars{display:flex;flex-direction:column;gap:8px}
.ck-bar{display:grid;grid-template-columns:38px 1fr 46px;align-items:center;gap:10px;font-size:15px;color:var(--text);font-variant-numeric:tabular-nums}
.ck-bar .tr{height:10px;border-radius:5px;background:rgba(207,200,202,.12);overflow:hidden}
.ck-bar .tr i{display:block;height:100%;background:#E6B85C;border-radius:5px}
.ck-bar .pc{text-align:right}
.ck-leit{display:flex;align-items:center;gap:12px;font-size:16px;color:var(--text)}
.ck-leit>span:last-child{display:flex;flex-direction:column;gap:4px;line-height:1.3}
.ck-leit b{color:#fff;font-size:26px;font-weight:800;line-height:1;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.ck-avs{display:inline-flex;flex:none}
.ck-avs img{width:34px;height:34px;border-radius:50%;border:2px solid var(--bg-deep);margin-left:-10px;background:#333}
.ck-avs img:first-child{margin-left:0}
.ck-depo{margin:0;text-align:left}
.ck-depo blockquote{font-family:var(--serif);font-style:italic;font-size:18px;line-height:1.4;color:#fff;quotes:"\\201C" "\\201D"}
.ck-depo blockquote::before{content:open-quote;color:var(--bright)}
.ck-depo blockquote::after{content:close-quote;color:var(--bright)}
.ck-depo figcaption{margin-top:8px;font-family:var(--mono);font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--text)}
.ck-foot{padding:2.5rem 1.5rem;text-align:center;border-top:1px solid var(--hair);background:var(--bg-deep)}
.ck-foot p{font-family:var(--serif);font-style:italic;font-size:1rem;color:var(--sage)}

/* de 1.024 px: duas colunas (guia e prova à esquerda, o pedido com o bump à direita) */
@media (min-width:1024px){
  .ck-top{max-width:1136px;padding:16px 28px 6px}
  .brand img{width:32px;height:32px}
  .wm{font-size:20px}
  .ck-seg{font-size:15px}
  .ck-pg{padding:18px 28px 16px}
  .ck-grade{max-width:1080px;gap:0;grid-template-columns:minmax(0,1fr) 470px;grid-template-rows:auto 1fr;column-gap:64px;row-gap:30px;align-items:start}
  .ck-prod{grid-column:1;grid-row:1;flex-direction:column;align-items:flex-start;gap:26px;padding:12px 0 0}
  .ck-par{--h:250px;margin-left:12px}
  .ck-pcapa{transform:rotate(-4deg);z-index:1;border-radius:4px 8px 8px 4px;box-shadow:0 18px 40px rgba(0,0,0,.65)}
  .ck-par.dois .ck-fone{display:block;height:calc(var(--h) * 1.06);aspect-ratio:390/844;padding:2%;border-radius:9.5% / 4.4%;background:#0b0b0b;box-shadow:0 22px 40px -14px rgba(0,0,0,.9),inset 0 0 0 2px #2a2a2a;margin-left:-22px;z-index:2}
  .ck-fone img{width:100%;height:100%;object-fit:cover;object-position:top;border-radius:7.5% / 3.5%}
  .ck-nome{font-size:36px}
  .ck-sub{font-size:16px;max-width:36ch}
  .ck-caixa{grid-column:2;grid-row:1/span 2;padding:24px 26px 26px;box-shadow:8px 8px 0 var(--sombra)}
  .ck-extra{grid-column:1;grid-row:2;padding:0}
  .ck-stripe{margin-inline:0}
  .ck-barra{left:auto;right:max(28px,calc((100vw - 1080px) / 2));width:470px;bottom:14px}
}
/* de 1.280 px: três colunas, o guia e a prova | o pedido e depois a Stripe | o bump, nunca embaixo da Stripe */
${duas ? CSS_DUAS : CSS_TRES}
      `}</style>
    </>
  );
}
