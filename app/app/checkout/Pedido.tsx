"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import PageBeacon, { sendBeacon } from "../../PageBeacon";
import { ViaPcLinha } from "../ViaPc";

/* ============================================================
   EXP-124 · CHECKOUT DO APP NO MODELO DO OQEL (braço B; decisão do HC em 08/10/26)
   Molde: oqel-funil app/checkout, pele H «Traço leve», adaptado à EE em .scratch/ck124/ref/estante-depois-page.tsx.
   Este arquivo é IDÊNTICO byte a byte em todas as casas da família app: nada da casa mora aqui. Tudo que é da
   casa (APP, PK, AVATARES, PROVA, tema, marca, chat, Coleção, regras) chega por props do page.tsx, que segue
   dono do braço A (AppCheckoutA) e do sorteio (useModelo, exportado daqui).
   O que o B faz de diferente do A é só a moldura: o pedido nasce montado na página (produto, bumps antes do
   botão, linhas e total), a session da Stripe nasce UMA vez, no toque em «Finalizar o pedido», e o formulário
   embutido abre dentro da folha do pedido; «Mudar o pedido» destrói a Stripe e devolve os bumps. Texto, preço,
   bumps, prova, popup de saída, prazos, bônus e regras de oferta são os do A (a rota segue a única dona do preço:
   a página pergunta o valor da oferta com `so_oferta` antes de qualquer session).
   Computador a partir de 1.280 px: o que leva e a prova à esquerda, o pedido (que vira a Stripe) no meio, TODOS os
   bumps empilhados à direita, nunca bump embaixo da Stripe. De 1.024 a 1.279 px, duas colunas. Celular: coluna
   única com a barra fixa do total (inerte enquanto o botão principal está na tela).
   ============================================================ */

/** Chave do teste (EXP-124): true = sorteio 50/50 por visitante, em todo aparelho (`ck_modelo` no localStorage);
 *  false = todo mundo no A, nenhum beacon de braço e nada gravado. `?v=A` ou `?v=B` força o braço (prova). */
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
export type Modelo = "A" | "B";
const CHAVE_MODELO = "ck_modelo";
const BUILD = "ck124-app-b-20261008";

export type AppTokens = {
  slug: string;
  news: string;
  titulo: string;
  kicker: string;
  capa: string;
  capaAlt: string;
  fone: string;
  foneAlt: string;
  leva: string;
  bump: { titulo: string; news?: string; ponte: string; frase: string; formato: string; capa: string; capaAlt: string; tela: string; telaAlt: string; preco: string; de: string };
  downsell: { kicker: string; titulo: string; texto: string; cta: string; href: string };
  despedida: string;
};
export type ColecaoTokens = { ponte: string; capa: string; capaAlt: string; amostras: string[]; formato: string; nome: string; frase: string; de: string; preco: string; leva: string };
export type ProvaTokens = {
  exibir: boolean;
  exibir_nota: boolean;
  media_exibido: string;
  media_pct: number;
  votos: number;
  distribuicao: { estrelas: number; pct: number }[];
  leitores_exibido: string;
  depoimento?: { texto: string; quem: string; nota: number } | null;
};
/** Regras que variam por casa no A e o B espelha: `vencido` = a casa confere o prazo do bônus (fim/ate) no aparelho e
 *  manda os dois no corpo (c4-20k/93); casa sem essa regra nunca marca bônus vencido e não manda fim/ate.
 *  `prazoTexto` = a casa escreve o prazo do bônus («até sexta 16/10, 23:59», app/89). */
export type Regras = { vencido: boolean; prazoTexto: boolean };
type Props = {
  app: AppTokens;
  pk: string | undefined;
  avatares: string[];
  prova: ProvaTokens;
  /** As duas linhas de identidade do `<style>` do A: o @import das fontes e o `:root{...}` da casa. */
  tema: string;
  /** O `<a className="brand">` do nav do A, como está. */
  marca: ReactNode;
  /** O `<LpWidgets ... local="checkout" />` do A, como está. */
  widgets?: ReactNode;
  /** 2º bump (app/91): a Coleção da casa. Sem a prop, a casa não tem o cartão. */
  colecao?: ColecaoTokens;
  regras: Regras;
};

/* ------------------------------------------------------------ sorteio do braço (A × B) */

/** Sorteio do modelo, chamado pelo page.tsx no lugar do componente de hoje. null = ainda não decidiu (placeholder, nunca
 *  A piscando pra B). Grava o cookie `ck_modelo` (a rota carimba `metadata.ck_modelo` no A sem mexer no corpo dele) e
 *  manda `ck-modelo-a|b|x` 1 vez por jornada, depois dos efeitos do braço montado (o PageBeacon captura a origem antes). */
/* Braço sorteado desta carga, pro corpo da session do B. null = fora da leitura. */
let carimbo: Braco | null = null;

export function useModelo(slug: string): Modelo | null {
  const [modelo, setModelo] = useState<Modelo | null>(SPLIT_MODELO ? null : "A");
  const beacon = useRef<string | null>(null);
  useEffect(() => {
    if (!SPLIT_MODELO) {
      try {
        if (/(?:^|;\s*)ck_modelo=/.test(document.cookie)) document.cookie = `${CHAVE_MODELO}=; path=/; max-age=0`;
      } catch {
        /* sem cookie */
      }
      return;
    }
    let b: Braco = "a";
    let forcado = "";
    try {
      forcado = (new URLSearchParams(window.location.search).get("v") || "").toLowerCase();
    } catch {
      /* sem query */
    }
    if (forcado === "a" || forcado === "b" || forcado === "c") {
      b = forcado;
    } else if (largou()) {
      try {
        // A chave é uma só pros checkouts da casa (guia, app, Coleção, Estante): grava em minúscula e lê sem
        // distinguir caixa, pra pessoa ver o mesmo modelo em todos.
        const v = (localStorage.getItem(CHAVE_MODELO) || "").toLowerCase();
        if (v === "a" || v === "b" || v === "c") b = v;
        else {
          b = sorteia3();
          localStorage.setItem(CHAVE_MODELO, b);
        }
        beacon.current = `ck-modelo-${b}`;
      } catch {
        b = "a";
        beacon.current = "ck-modelo-x";
      }
    }
    bracoAtual = b;
    const m: Modelo = b === "a" ? "A" : "B";
    // Carimbo só com braço sorteado: forçado por `?v=`, antes da largada e localStorage falho ficam fora da leitura
    // (cookie apagado).
    carimbo = beacon.current && beacon.current !== "ck-modelo-x" ? b : null;
    try {
      document.cookie = carimbo
        ? `${CHAVE_MODELO}=${carimbo}; path=/; max-age=15552000; SameSite=Lax`
        : `${CHAVE_MODELO}=; path=/; max-age=0`;
    } catch {
      /* sem cookie: o A fica sem carimbo, o B manda no corpo */
    }
    setModelo(m);
  }, []);
  useEffect(() => {
    if (!modelo || !beacon.current) return;
    sendBeacon(slug, beacon.current);
    beacon.current = null;
  }, [modelo, slug]);
  return modelo;
}

/** Placeholder neutro enquanto o sorteio não decidiu: o fundo da casa e nada escrito. */
export function Aguardando({ tema }: { tema: string }) {
  return (
    <>
      <style>{`${tema}\nbody{background:var(--bg);margin:0}`}</style>
      <main aria-busy="true" style={{ minHeight: "100vh" }} />
    </>
  );
}

/* ------------------------------------------------------------ o mesmo que o A faz, byte a byte onde dá */

type CheckoutHandle = { mount: (sel: string) => void; destroy: () => void };
type StripeJs = {
  initEmbeddedCheckout: (opts: { fetchClientSecret: () => Promise<string> }) => Promise<CheckoutHandle>;
};
const janela = () => window as unknown as { Stripe?: (pk: string) => StripeJs };

const ROTULO_IR = "Finalizar o pedido";
const ABRINDO = "Abrindo a Stripe…";
/** Teto de espera da rota e do Stripe.js: passou dele, o erro aparece e o botão volta. */
const PRAZO_MS = 20000;
/** Altura reservada pro formulário embutido (CPF, Pix, cartão, boleto e Link) enquanto a Stripe pinta. */
const ALTURA_FORM = 760;

/* LEGIVEL: o valor em reais nunca quebra de linha entre o "R$" e o número */
const nb = (t: string) => t.replace(/R\$ (?=\d)/g, "R$ ");

/** R$ 97 quando é inteiro, R$ 145,50 quando tem centavo. */
function reais(centavos: number): string {
  const r = Math.floor(centavos / 100);
  const c = centavos % 100;
  const int = r.toLocaleString("pt-BR");
  return nb(c ? `R$ ${int},${String(c).padStart(2, "0")}` : `R$ ${int}`);
}

/* Jornada que o PageBeacon abriu na primeira página. Best-effort. */
function jornada() {
  try {
    return {
      journey: sessionStorage.getItem("vdn_journey") || "",
      src: sessionStorage.getItem("vdn_source") || "",
    };
  } catch {
    return {};
  }
}

/* EXP-072 (app-scriptorium/66): braço do destino do clique do banner, pra metadata da session. `?d=lp|ck`
   (revisão, viaja na query do 307 do middleware) manda; sem ele vale o cookie `app_dst`. Sem os dois, nada. */
function destino(): { dst?: "lp" | "ck" } {
  try {
    const d = (new URLSearchParams(window.location.search).get("d") || "").toLowerCase();
    if (d === "lp" || d === "ck") return { dst: d };
    const m = document.cookie.match(/(?:^|;\s*)app_dst=(lp|ck)(?:;|$)/);
    return m ? { dst: m[1] as "lp" | "ck" } : {};
  } catch {
    return {};
  }
}

/* c4-20k/93: o bônus da `oferta=bonus` pode vir com prazo. `fim=<dia>-<HHMM>` vale da segunda 00:00 até <dia>
   HH:MM:59 da mesma semana, relógio BRT (UTC-3 fixo). `ate=<epoch>` vale até o instante. */
function bonusNoPrazo(fim: unknown, ate: unknown, agoraMs: number): boolean {
  const f = /^(seg|ter|qua|qui|sex|sab|dom)-([01]\d|2[0-3])([0-5]\d)$/.exec(String(fim ?? "").trim());
  if (f) {
    const brt = new Date(agoraMs - 3 * 3600 * 1000);
    const hoje = (brt.getUTCDay() + 6) % 7; // segunda = 0, domingo = 6
    const dia = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"].indexOf(f[1]);
    const agoraS = brt.getUTCHours() * 3600 + brt.getUTCMinutes() * 60 + brt.getUTCSeconds();
    if (hoje > dia || (hoje === dia && agoraS > Number(f[2]) * 3600 + Number(f[3]) * 60 + 59)) return false;
  }
  let a = Number(String(ate ?? "").trim());
  if (a > 1e12) a = Math.floor(a / 1000); // epoch em ms, como o contador aceita
  return !(Number.isFinite(a) && a > 0 && agoraMs >= a * 1000);
}

/* c4-20k/93: o prazo do bônus viaja da URL pro corpo; a rota confere de novo com o relógio do servidor. */
function prazoDaUrl() {
  try {
    const q = new URLSearchParams(window.location.search);
    return { fim: (q.get("fim") || "").trim().slice(0, 16), ate: (q.get("ate") || "").trim().slice(0, 16) };
  } catch {
    return {};
  }
}

/* app/89: o fim do bônus em ms (o mais cedo entre `fim=<dia>-<HHMM>` e `ate=<epoch>`), ou null sem prazo legível. */
function fimDoBonus(fim: unknown, ate: unknown, agoraMs: number): number | null {
  let ms: number | null = null;
  const f = /^(seg|ter|qua|qui|sex|sab|dom)-([01]\d|2[0-3])([0-5]\d)$/.exec(String(fim ?? "").trim());
  if (f) {
    const brt = new Date(agoraMs - 3 * 3600 * 1000);
    const hoje = (brt.getUTCDay() + 6) % 7; // segunda = 0, domingo = 6
    const dia = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"].indexOf(f[1]);
    const zero = Date.UTC(brt.getUTCFullYear(), brt.getUTCMonth(), brt.getUTCDate()) + 3 * 3600 * 1000; // 00:00 BRT de hoje
    ms = zero + (dia - hoje) * 86400000 + (Number(f[2]) * 3600 + Number(f[3]) * 60 + 59) * 1000;
  }
  let a = Number(String(ate ?? "").trim());
  if (a > 1e12) a = Math.floor(a / 1000); // epoch em ms, como o contador aceita
  if (Number.isFinite(a) && a > 0) ms = ms === null ? a * 1000 : Math.min(ms, a * 1000);
  return ms;
}

/* app/89: «sexta 16/10, 23:59» no relógio de Brasília, qualquer que seja o fuso do aparelho. */
function prazoTexto(ms: number): string {
  const brt = new Date(ms - 3 * 3600 * 1000);
  const dia = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][brt.getUTCDay()];
  const p = (n: number) => String(n).padStart(2, "0");
  return `${dia} ${p(brt.getUTCDate())}/${p(brt.getUTCMonth() + 1)}, ${p(brt.getUTCHours())}:${p(brt.getUTCMinutes())}`;
}

/* c420/153: o desenho que a pessoa viu viaja na session como `checkout_variant`, nos mesmos degraus do A:
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

/* Stripe.js por script tag, uma vez por página: o aquecimento no ocioso e o clique esperam a mesma promessa. */
let stripeJs: Promise<StripeJs> | null = null;
function carregaStripe(pk: string): Promise<StripeJs> {
  if (stripeJs) return stripeJs;
  stripeJs = new Promise<StripeJs>((ok, falha) => {
    const pronto = () => {
      const S = janela().Stripe;
      return S ? ok(S(pk)) : falha(new Error("stripe.js vazio"));
    };
    if (janela().Stripe) return pronto();
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

/* ------------------------------------------------------------ o pedido */

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
  .ck-top{max-width:1416px}
  .ck-grade{max-width:1360px;grid-template-columns:minmax(0,1fr) 500px minmax(300px,360px);column-gap:40px}
  .ck-prod{grid-column:1;grid-row:1}
  .ck-extra{grid-column:1;grid-row:2}
  .ck-caixa{grid-column:2;grid-row:1/span 2}
  .ck-bonus{display:none}
  .ck-bumps-folha{display:none}
  .ck-lado{display:block;grid-column:3;grid-row:1/span 2}
  .ck-bumps-lado{gap:22px;padding-top:10px}
  .ck-bumps-k{font:500 13px/1.2 var(--mono);letter-spacing:.18em;text-transform:uppercase;color:var(--bright);text-align:center;margin:0 0 4px}
  .ck-bumps-lado .bumpcard{padding:16px 12px 12px;gap:7px}
  .ck-bumps-lado .ck-bponte{font-size:16px}
  .ck-bumps-lado .bnome{font-size:17px}
  .ck-bumps-lado .ck-bfrase{font-size:14px}
  .ck-bumps-lado .bbar{min-height:56px;font-size:15px}
  .ck-bumps-lado .ck-blinha{flex-direction:column;align-items:flex-start;gap:4px}
  .ck-par{--h:220px}
  /* o pedido fica à vista enquanto a pessoa rola os bumps da direita */
  .ck-caixa.fixa{position:sticky;top:16px}
  .ck-pg{padding-bottom:16px}
  .ck-barra{display:none}
}
/* tela baixa (notebook de 768 px): os bumps da direita apertam um degrau pra barra do 1º seguir na 1ª tela */
@media (min-width:1280px) and (max-height:779px){
  .ck-bumps-lado .bumpcard{padding:12px 12px 10px;gap:6px}
  .ck-bumps-lado .ck-palco{aspect-ratio:5/2}
  .ck-bumps-lado .ck-bponte{font-size:15px}
}
`;
const CSS_DUAS = `@media (min-width:1280px){
  .ck-top{max-width:1296px}
  .ck-grade{max-width:1240px;grid-template-columns:minmax(0,1fr) 540px;column-gap:80px}
  .ck-barra{right:max(28px,calc((100vw - 1240px) / 2));width:540px}
}
`;

export default function Pedido({ app, pk, avatares, prova, tema, marca, widgets, colecao, regras }: Props) {
  const acento = acentoDaCasa(tema);
  const duas = bracoAtual === "c";
  // ticket 35: a recuperação chega com ?oferta=bonus (o guia da ALQ de graça) ou ?oferta=metade (R$ 48,50);
  // ticket 41: o dono do ebook chega com ?oferta=dono&e=<email>; c4-20k/57: `dono27`; c4-20k/22: `leitor`.
  // A rota decide o preço: o B pergunta antes de montar o pedido (`so_oferta`) e a Stripe mostra no fim.
  const [oferta, setOferta] = useState("");
  const [email, setEmail] = useState("");
  // c4-20k/93: bônus com prazo vencido (relógio do aparelho primeiro, a rota decide por último)
  const [vencido, setVencido] = useState(false);
  // app/89: o prazo do bônus em texto («sexta 16/10, 23:59»); vazio = sem prazo legível ou vencido
  const [prazo, setPrazo] = useState("");
  // os valores em centavos que a rota devolveu pra esta oferta; null = ainda lendo (números escondidos)
  const [precos, setPrecos] = useState<{ app: number; bump: number; colecao: number } | null>(null);
  const [bump, setBump] = useState(false);
  const [col, setCol] = useState(false);
  const [fase, setFase] = useState<"pedido" | "abrindo" | "stripe">("pedido");
  const [erro, setErro] = useState<string | null>(null);
  const [montado, setMontado] = useState(false);
  // Barra fixa do total (até 1.279 px): aparece enquanto o botão do pedido está fora da tela.
  const [btnVisivel, setBtnVisivel] = useState(true);
  const [saida, setSaida] = useState(false);
  const saidaJa = useRef(false);
  const atual = useRef<CheckoutHandle | null>(null);
  const ocupado = useRef(false);
  const clique = useRef(0);
  const caixaRef = useRef<HTMLElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const temColecao = Boolean(colecao);
  const regraVencido = regras.vencido;
  const regraPrazo = regras.prazoTexto;

  // A oferta da URL (igual ao A) e o preço dela pela rota, sem criar session nenhuma.
  useEffect(() => {
    let o = "";
    let e = "";
    try {
      const q = new URLSearchParams(window.location.search);
      const v = q.get("oferta");
      if (v === "bonus" || v === "metade" || v === "dono" || v === "dono27" || v === "leitor") o = v;
      e = (q.get("e") || "").replace(/ /g, "+").trim();
      if (o === "bonus") {
        if (regraVencido) setVencido(!bonusNoPrazo(q.get("fim"), q.get("ate"), Date.now()));
        const fim = regraPrazo ? fimDoBonus(q.get("fim"), q.get("ate"), Date.now()) : null;
        if (fim !== null && fim > Date.now()) setPrazo(prazoTexto(fim));
      }
    } catch {
      /* sem query */
    }
    setOferta(o);
    setEmail(e);
    const corpo = { so_oferta: true, oferta: o, email: e, ...(regraVencido ? prazoDaUrl() : {}) };
    fetch("/api/app-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.valorApp === "number") setPrecos({ app: d.valorApp, bump: Number(d.valorBump) || 0, colecao: Number(d.valorColecao) || 0 });
        if (o === "bonus" && typeof d.oferta === "string") setVencido(d.oferta !== "bonus");
      })
      .catch(() => {
        /* sem número na tela: o «Finalizar» segue e a Stripe mostra o valor */
      });
  }, [regraVencido, regraPrazo]);

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
  }, [fase, precos]);

  // A Stripe monta depois que o contêiner aparece (efeito da fase), nunca num quadro solto. Beacon `app-ck-montou@<ms>`
  // (ms do clique até o formulário pintado, arredondado a 100) quando o iframe ganha altura.
  useEffect(() => {
    if (fase !== "stripe") return;
    const alvo = formRef.current;
    const emb = atual.current;
    if (!alvo || !emb) return;
    setMontado(false);
    emb.mount("#checkout-box");
    let vivo = true;
    let t = 0;
    const fim = Date.now() + 15000;
    const confere = () => {
      if (!vivo) return;
      const ifr = alvo.querySelector("iframe");
      const pintou = ifr ? ifr.getBoundingClientRect().height >= 200 : false;
      if (pintou || Date.now() > fim || !alvo.isConnected) {
        setMontado(true);
        if (clique.current) {
          sendBeacon(app.slug, `app-ck-montou@${Math.round((Date.now() - clique.current) / 100) * 100}`, { eventType: "converteu" });
          clique.current = 0;
        }
        return;
      }
      t = window.setTimeout(confere, 100);
    };
    t = window.setTimeout(confere, 100);
    // O pedido encolhe (bumps e botão saem): se o topo dele ficou acima da tela, ele volta pra vista.
    const cx = caixaRef.current;
    if (cx && (cx.getBoundingClientRect().top < 0 || window.matchMedia("(max-width: 1023px)").matches)) cx.scrollIntoView({ block: "start", behavior: suave() });
    alvo.focus({ preventScroll: true });
    return () => {
      vivo = false;
      window.clearTimeout(t);
    };
  }, [fase, app.slug]);

  // Primeiro toque no formulário da Stripe (EXP-072, app-scriptorium/66): beacon `app-ck-pagar`, 1 vez por jornada,
  // igual ao A. O formulário mora num iframe de outra origem, então o toque nunca chega aqui
  // como clique: o que a página enxerga é a janela perder o foco (blur) com o iframe de dentro do #checkout-box
  // como elemento ativo. Duas redes pro mesmo predicado: a conferência no próximo tick e a de 1 em 1 segundo.
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
      sendBeacon(app.slug, "app-ck-pagar", { eventType: "converteu" });
    };
    function onBlur() {
      confere();
      window.setTimeout(confere, 0);
    }
    window.addEventListener("blur", onBlur);
    relogio = window.setInterval(confere, 1000);
    return para;
  }, [app.slug]);

  // Saída do checkout (ticket 25, downsell): o gesto de sair sem pagar. Uma vez por sessão. Grava `app-checkout-exit`
  // ao abrir (o clique grava `app-checkout-exit-cta`); no toque, subida rápida de 320 px em até 350 ms depois de 60%.
  useEffect(() => {
    const abre = () => {
      if (saidaJa.current) return;
      try {
        if (sessionStorage.getItem("app_ck_exit")) return;
        sessionStorage.setItem("app_ck_exit", "1");
      } catch {
        /* modo privado: o guard fica só no ref */
      }
      saidaJa.current = true;
      setSaida(true);
      sendBeacon(app.slug, "app-checkout-exit");
    };
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) abre();
    };
    document.addEventListener("mouseleave", onLeave);
    const toque = "ontouchstart" in window || window.matchMedia("(pointer:coarse)").matches;
    let onScroll: (() => void) | undefined;
    if (toque) {
      let fundo = false, uy = window.scrollY, ry = uy, rt = 0;
      onScroll = () => {
        const y = window.scrollY, t = Date.now(), h = document.documentElement.scrollHeight - window.innerHeight;
        if (h > 0 && y / h >= 0.6) fundo = true;
        if (y < uy) {
          if (!rt) { rt = t; ry = uy; }
          if (fundo && ry - y >= 320 && t - rt <= 350) abre();
        } else rt = 0;
        uy = y;
      };
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    return () => {
      document.removeEventListener("mouseleave", onLeave);
      if (onScroll) window.removeEventListener("scroll", onScroll);
    };
  }, [app.slug]);

  const bonus = oferta === "bonus" && !vencido;
  const aberto = fase === "stripe";
  const travado = fase !== "pedido";
  const total = precos ? precos.app + (bump && !bonus ? precos.bump : 0) + (temColecao && col ? precos.colecao : 0) : 0;
  const depo = prova.depoimento;

  /** «Mudar o pedido»: desmonta a Stripe e devolve bumps, total e botão; o foco volta pro «Finalizar». */
  function mudaPedido() {
    atual.current?.destroy();
    atual.current = null;
    setMontado(false);
    setFase("pedido");
    window.setTimeout(() => {
      caixaRef.current?.scrollIntoView({ block: "nearest", behavior: suave() });
      btnRef.current?.focus({ preventScroll: true });
    }, 30);
  }

  async function abre(origem: "folha" | "barra") {
    if (!pk || fase !== "pedido" || ocupado.current) return;
    ocupado.current = true;
    setErro(null);
    setFase("abrindo");
    sendBeacon(app.slug, "app-ck-finalizar", { eventType: "converteu" });
    clique.current = Date.now();
    // Quem tocou na barra vê o «Abrindo a Stripe…» no botão do pedido.
    if (origem === "barra") btnRef.current?.scrollIntoView({ block: "center", behavior: suave() });
    // O mesmo corpo do A, mais o braço sorteado em `ck_modelo` (a rota grava em metadata.ck_modelo). `colecao` só na casa que tem o cartão.
    const corpo = {
      bump,
      ...(temColecao ? { colecao: col } : {}),
      oferta,
      email,
      ...(regraVencido ? prazoDaUrl() : {}),
      checkout_variant: desenho(),
      ...jornada(),
      ...destino(),
      ...(carimbo ? { ck_modelo: carimbo } : {}),
      ck_cor: acento,
    };
    try {
      // A session nasce só aqui, no toque; o Stripe.js já veio no aquecimento (ou chega junto).
      const sinal = typeof AbortSignal !== "undefined" && "timeout" in AbortSignal ? AbortSignal.timeout(PRAZO_MS) : undefined;
      const d = await fetch("/api/app-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
        signal: sinal,
      }).then((r) => r.json());
      if (!d.clientSecret) throw new Error(d.error || "sem clientSecret");
      if (oferta === "bonus" && typeof d.oferta === "string") setVencido(d.oferta !== "bonus");
      const sj = await carregaStripe(pk);
      atual.current = await sj.initEmbeddedCheckout({ fetchClientSecret: () => Promise.resolve(d.clientSecret as string) });
      setFase("stripe");
    } catch (e) {
      const x = e as Error;
      atual.current?.destroy();
      atual.current = null;
      clique.current = 0;
      setFase("pedido");
      setErro(x.name === "TimeoutError" || x.name === "AbortError" ? "a Stripe demorou a responder; tente de novo" : x.message || "stripe_unreachable");
      window.setTimeout(() => {
        btnRef.current?.scrollIntoView({ block: "center", behavior: suave() });
        btnRef.current?.focus({ preventScroll: true });
      }, 30);
    } finally {
      ocupado.current = false;
    }
  }

  /* Os cartões de bump (o guia irmão e, onde existe, a Coleção): dentro da folha até 1.279 px, na coluna da direita
     a partir de 1.280 px. Com `oferta=bonus` o guia entra de graça e o cartão fica marcado, sem barra. */
  const cartoes = (onde: "folha" | "lado") => {
    const idG = `bump-${onde}`;
    const idC = `bump-colecao-${onde}`;
    const b = app.bump;
    return (
      <section className={`ck-bumps ck-bumps-${onde}`} aria-label={bonus ? "Bônus incluído" : "Adicione ao pedido"}>
        {onde === "lado" && <p className="ck-bumps-k">{bonus && !temColecao ? "Bônus incluído" : "Adicione ao pedido"}</p>}
        <div className={`bumpcard${bump || bonus ? " on" : ""}${travado ? " trava" : ""}`}>
          <span className="ck-fita" aria-hidden="true" />
          {/* Na coluna da direita o título da coluna já diz «Adicione ao pedido»: o rótulo do cartão só repete na folha
              (e fica quando é o bônus, que é outro recado). */}
          {(onde === "folha" || bonus) && <span className="ck-btag">{bonus ? "Bônus incluído" : "Adicione ao pedido"}</span>}
          <p className="ck-bponte">{nb(b.ponte)}</p>
          <span className="ck-palco par" style={{ "--img": `url("${b.capa}")` } as React.CSSProperties}>
            <img className="ck-palco-img" src={b.capa} alt={b.capaAlt} width={600} height={800} loading="lazy" />
            <span className="ck-mais" aria-hidden="true">+</span>
            <span className="ck-pfone"><img src={b.tela} alt={b.telaAlt} width={390} height={844} loading="lazy" /></span>
          </span>
          <span className="ck-bformato">{b.formato}</span>
          <span className="ck-blinha">
            <span className="bnome" id={`${idG}-nome`}>{nb(b.titulo)}</span>
            <span className="bpreco" id={`${idG}-preco`}>{bonus ? <><s aria-hidden="true">{nb(b.preco)}</s><span className="ck-vh">de {b.preco} por </span> R$&nbsp;0</> : <><s aria-hidden="true">{nb(b.de)}</s><span className="ck-vh">de {b.de} por </span> {nb(b.preco)}</>}</span>
          </span>
          <span className="ck-bfrase">{nb(b.frase)}</span>
          {bonus ? (
            <span className="bbar bfixo"><span className="bx" aria-hidden="true">✓</span><span>Entra sem custo neste pedido{prazo ? `, até ${prazo}` : ""}</span></span>
          ) : (
            <label className="bbar" htmlFor={idG}>
              <input type="checkbox" id={idG} checked={bump} disabled={travado} onChange={(e) => setBump(e.target.checked)} aria-describedby={`${idG}-nome ${idG}-preco`} />
              <span className="bx" aria-hidden="true">{bump ? "✓" : ""}</span>
              <span>{bump ? "Adicionado ao pedido" : aberto ? "Pra levar junto, toque em «Mudar o pedido»" : "Levar os dois"}</span>
            </label>
          )}
        </div>
        {colecao && (
          <div className={`bumpcard bcol${col ? " on" : ""}${travado ? " trava" : ""}`}>
            <span className="ck-fita" aria-hidden="true" />
            {onde === "folha" && <span className="ck-btag">Adicione ao pedido</span>}
            <p className="ck-bponte">{nb(colecao.ponte)}</p>
            <span className="ck-palco pilha" style={{ "--img": `url("${colecao.capa}")` } as React.CSSProperties}>
              <img className="ck-palco-img" src={colecao.capa} alt={colecao.capaAlt} width={600} height={800} loading="lazy" />
              {colecao.amostras.map((p, i) => <img key={p} className={`ck-pg ck-pg${i + 1}`} src={p} alt="" width={600} height={800} loading="lazy" />)}
            </span>
            <span className="ck-bformato">{colecao.formato}</span>
            <span className="ck-blinha">
              <span className="bnome" id={`${idC}-nome`}>{nb(colecao.nome)}</span>
              <span className="bpreco" id={`${idC}-preco`}><s aria-hidden="true">{nb(colecao.de)}</s><span className="ck-vh">de {colecao.de} por </span> {nb(colecao.preco)}</span>
            </span>
            <span className="ck-bfrase">{nb(colecao.frase)}</span>
            <label className="bbar" htmlFor={idC}>
              <input type="checkbox" id={idC} checked={col} disabled={travado} onChange={(e) => setCol(e.target.checked)} aria-describedby={`${idC}-nome ${idC}-preco`} />
              <span className="bx" aria-hidden="true">{col ? "✓" : ""}</span>
              <span>{col ? "Adicionado ao pedido" : aberto ? "Pra levar junto, toque em «Mudar o pedido»" : colecao.leva}</span>
            </label>
          </div>
        )}
      </section>
    );
  };

  return (
    <>
      <PageBeacon slug={app.slug} step="app-checkout" source="app" />

      <header className="ck-top">
        {marca}
        <span className="ck-seg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
          Pedido seguro
        </span>
      </header>

      <main className={duas ? "ck-pg ck-duas" : "ck-pg"} data-build={BUILD} data-braco={bracoAtual}>
        <div className="ck-grade">
          <section className="ck-prod" aria-label={app.titulo}>
            <div className="ck-par">
              <img className="ck-pcapa" src={app.capa} alt={app.capaAlt} width={1800} height={2400} fetchPriority="high" />
              <span className="ck-mais" aria-hidden="true">+</span>
              <span className="ck-fone"><img src={app.fone} alt={app.foneAlt} width={780} height={1688} /></span>
            </div>
            <div className="ck-tit">
              <span className="ck-kick">{app.kicker}</span>
              <h1 className="ck-nome">{app.titulo}</h1>
              <p className="ck-sub">{app.leva}</p>
            </div>
          </section>

          <section className={`ck-caixa${aberto ? "" : " fixa"}${precos ? "" : " lendo"}`} aria-label="Seu pedido" aria-busy={fase === "abrindo"} ref={caixaRef}>
            <p className="ck-rot" role="heading" aria-level={2}>Seu pedido</p>
            {/* app/89: a linha do prazo do bônus (some a partir de 1.280 px, onde o cartão ao lado já diz «até») */}
            {bonus && prazo && (
              <p className="ck-bonus">Bônus incluído até <b>{prazo}</b>: {nb(app.bump.titulo)}{app.bump.news ? `, da news ${app.bump.news}` : ""}.</p>
            )}

            <div className="ck-linhas">
              <div className="ck-li"><span>{nb(app.titulo)}<small>{app.kicker}</small></span><b>{precos ? reais(precos.app) : " "}</b></div>
              {bonus && <div className="ck-li ck-li-b"><span>{nb(app.bump.titulo)}<small>Bônus, no app</small></span><b>R$&nbsp;0</b></div>}
              {!bonus && bump && <div className="ck-li ck-li-b"><span>{nb(app.bump.titulo)}<small>No app</small></span><b>{precos ? reais(precos.bump) : " "}</b></div>}
              {colecao && col && <div className="ck-li ck-li-b"><span>{nb(colecao.nome)}<small>{colecao.formato}</small></span><b>{precos ? reais(precos.colecao) : " "}</b></div>}
            </div>

            {!aberto && cartoes("folha")}

            <div className="ck-tot" aria-live="polite" aria-atomic="true" hidden={aberto}>
              <span>Total hoje</span>
              <div><b>{precos ? reais(total) : " "}</b><small>uma vez só</small></div>
            </div>

            {!aberto && (
              <div className="pv-cta">
                {pk ? (
                  <button ref={btnRef} className="pv-btn" type="button" onClick={() => abre("folha")} disabled={fase === "abrindo"}>
                    {fase === "abrindo" ? ABRINDO : ROTULO_IR}
                  </button>
                ) : (
                  <div className="ck-pend">
                    <p><b>Checkout em preparação.</b></p>
                    <p>O checkout abre aqui assim que as chaves da Stripe entrarem no ambiente. Nada é cobrado até lá.</p>
                  </div>
                )}
                <p className="ck-acel">Pix ou cartão · acesso no seu email na hora</p>
                {/* app/82: a linha «via-pc», só no computador (640 px ou mais, com mouse) */}
                <ViaPcLinha />
              </div>
            )}
            <p className="ck-vh" role="status">{fase === "abrindo" ? ABRINDO : ""}</p>
            {erro && (
              <div className="ck-pend ck-erro" role="alert">
                <p><b>O checkout não abriu.</b></p>
                <p>{erro}</p>
              </div>
            )}

            {aberto && (
              <button type="button" className="ck-mudar" onClick={mudaPedido}>Mudar o pedido</button>
            )}
            <div className={`ck-stripe${aberto && !montado ? " reserva" : ""}`} hidden={!aberto} role="region" aria-label="Formulário da Stripe">
              <div id="checkout-box" className="ck-form" ref={formRef} tabIndex={-1} />
              {/* Esqueleto por cima do contêiner enquanto o embedded checkout monta (0,7 a 1,7 s). */}
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

          <aside className="ck-lado">{cartoes("lado")}</aside>

          <div className="ck-extra">
            {/* reforço (regra do 54): nota no método Amazon + leitores da casa + um voto real. Some em casa sem lastro. */}
            {prova.exibir && prova.exibir_nota && (
              <section className="ck-prova" aria-label={`O que os leitores da ${app.news} dizem`}>
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

        {fase === "pedido" && pk && (
          <div className={`ck-barra${btnVisivel ? "" : " on"}${precos ? "" : " lendo"}`} inert={btnVisivel}>
            <div className="ck-barra-tot"><span>Total hoje</span><b>{precos ? reais(total) : " "}</b></div>
            <button type="button" className="ck-barra-btn" onClick={() => abre("barra")}>{ROTULO_IR}</button>
          </div>
        )}
      </main>

      {saida && (
        <div className="exitov" role="dialog" aria-modal="true" aria-label={app.downsell.titulo}>
          <div className="exitbox">
            <button className="exitx" aria-label="Fechar" onClick={() => setSaida(false)}>×</button>
            <p className="kicker">{app.downsell.kicker}</p>
            <h2>{app.downsell.titulo}</h2>
            <p className="exittexto">{nb(app.downsell.texto)}</p>
            <a
              className="exitcta"
              href={app.downsell.href}
              onClick={() => sendBeacon(app.slug, "app-checkout-exit-cta", { eventType: "converteu" })}
            >
              {nb(app.downsell.cta)}
            </a>
            <button className="exitfica" onClick={() => setSaida(false)}>Continuar com o app</button>
          </div>
        </div>
      )}

      <footer className="ck-foot">
        <p>{app.despedida}</p>
      </footer>

      {/* chat de dúvidas também no checkout (HC 19/09/26): só o chat, sem prova nem botão de compra */}
      {widgets}

      <style>{`${tema}
:root{--papel:#F7F1E6;--creme:#EFE4D3;--ink:#1C1416;--ink2:#4A3F42;--mut:#766A6E;--verde:#2F7D5B;--acc:color-mix(in srgb,var(--bright) 58%,#000);--marcado:color-mix(in srgb,var(--bright) 16%,#F7F1E6);--sombra:color-mix(in srgb,var(--bright) 55%,#000)}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--sans);background:var(--bg);color:var(--text);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{color:inherit;text-decoration:none}
img{display:block;max-width:100%}
.ck-vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.kicker{font-family:var(--mono);font-size:13px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--bright)}

/* topo: marca e «Pedido seguro» numa linha só */
.ck-top{display:flex;justify-content:space-between;align-items:center;gap:10px;max-width:592px;margin:0 auto;padding:12px 16px 4px}
.brand{display:flex;align-items:center;gap:9px;min-height:44px}
.brand img{width:26px;height:26px}
.wm{font-weight:700;font-size:17px;letter-spacing:-.02em;white-space:nowrap}
.wm .t{color:var(--bright)}.wm .s{color:#fff}
.ck-seg{display:inline-flex;align-items:center;gap:6px;font:600 13px/1 var(--sans);color:var(--text);white-space:nowrap}
.ck-seg svg{width:15px;height:15px;flex:none}

/* grade: no celular, produto, pedido, prova */
.ck-pg{padding:8px 16px 96px}
.ck-grade{display:grid;gap:18px;max-width:560px;margin:0 auto}
.ck-grade>*{min-width:0}
.ck-prod{display:flex;align-items:center;gap:16px;padding-inline:2px}
.ck-par{flex:none;position:relative;display:flex;align-items:center;justify-content:center;--h:84px}
.ck-pcapa{height:var(--h);width:auto;aspect-ratio:3/4;object-fit:cover;border-radius:3px 6px 6px 3px;box-shadow:0 10px 22px rgba(0,0,0,.6);transform:rotate(-4deg);z-index:1}
.ck-fone{display:block;height:calc(var(--h) * 1.06);aspect-ratio:390/844;padding:2%;border-radius:9.5% / 4.4%;background:#0b0b0b;box-shadow:0 12px 24px -10px rgba(0,0,0,.9),inset 0 0 0 1px #2a2a2a;margin-left:-8px;z-index:2}
.ck-fone img{width:100%;height:100%;object-fit:cover;object-position:top;border-radius:7.5% / 3.5%}
.ck-mais{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:20px;height:20px;border-radius:50%;background:#fff;color:#140408;font:700 14px/20px var(--serif);text-align:center;z-index:3;box-shadow:0 4px 12px rgba(0,0,0,.5)}
.ck-tit{display:flex;flex-direction:column;gap:3px;min-width:0}
.ck-kick{font:500 13px/1.3 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--bright)}
.ck-nome{font:italic 900 23px/1.12 var(--serif);color:#fff;letter-spacing:-.01em;text-wrap:balance}
.ck-sub{font-size:14px;line-height:1.4;color:var(--text);text-wrap:balance}

/* o pedido: folha de papel com contorno de tinta e sombra dura; por dentro, zero linha */
.ck-caixa{display:flex;flex-direction:column;gap:14px;background:var(--papel);color:var(--ink2);border:2px solid var(--ink);border-radius:22px;padding:20px 15px 22px;box-shadow:6px 6px 0 var(--sombra);scroll-margin-top:12px}
.ck-caixa>*{min-width:0}
.ck-rot{font:500 13px/1.2 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--acc)}
.ck-bonus{margin:-4px 0 0;padding:10px 12px;border-radius:12px;background:var(--marcado);font-size:14px;line-height:1.45;color:var(--ink2);text-wrap:pretty}
.ck-bonus b{color:var(--ink);font-weight:700}
.ck-caixa.lendo .ck-li b,.ck-caixa.lendo .ck-tot b,.ck-barra.lendo b{visibility:hidden}
.ck-linhas{display:flex;flex-direction:column;gap:8px}
.ck-li{display:flex;justify-content:space-between;align-items:baseline;gap:14px;font:600 16px/1.35 var(--sans);color:var(--ink)}
.ck-li span{display:flex;flex-direction:column;gap:1px;min-width:0;text-wrap:balance}
.ck-li small{font:500 13px/1.3 var(--sans);color:var(--mut)}
.ck-li b{flex:none;font:900 19px/1 var(--serif);color:var(--ink);font-variant-numeric:tabular-nums;white-space:nowrap}
.ck-li-b{font-size:15px}
.ck-li-b b{font-size:17px}

/* bumps: bloco creme colado com fita; marcado, vira o tom da casa */
.ck-bumps{display:flex;flex-direction:column;gap:18px}
.ck-bumps-folha{margin-top:6px}
.bumpcard{position:relative;display:flex;flex-direction:column;gap:8px;padding:18px 14px 14px;background:var(--creme);border-radius:18px;color:var(--ink2);transition:background-color .2s}
.ck-fita{position:absolute;left:50%;top:-10px;width:80px;height:20px;margin-left:-40px;background:color-mix(in srgb,var(--bright) 55%,transparent);transform:rotate(-3deg)}
.bumpcard:nth-child(even) .ck-fita{transform:rotate(2deg)}
.ck-btag{font:500 13px/1.2 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--acc)}
.ck-bponte{font:italic 700 17px/1.3 var(--serif);color:var(--ink);text-wrap:balance}
.ck-palco{position:relative;display:flex;align-items:center;justify-content:center;gap:8px;width:100%;aspect-ratio:2/1;border-radius:12px;overflow:hidden;isolation:isolate;background:#1a1012}
.ck-palco::before{content:"";position:absolute;inset:-24px;z-index:-1;background:var(--img) center/cover no-repeat;filter:blur(20px) brightness(.45) saturate(1.15)}
.ck-palco-img{display:block;height:84%;width:auto;aspect-ratio:3/4;object-fit:cover;border-radius:3px 6px 6px 3px;box-shadow:0 14px 30px rgba(0,0,0,.6)}
.ck-palco.par .ck-palco-img{height:76%;transform:rotate(-4deg);z-index:1}
.ck-pfone{display:block;height:82%;aspect-ratio:390/844;padding:2%;border-radius:9.5% / 4.4%;background:#0b0b0b;box-shadow:0 14px 30px -10px rgba(0,0,0,.9),inset 0 0 0 1px #2a2a2a;margin-left:-10px;z-index:2}
.ck-pfone img{width:100%;height:100%;object-fit:cover;object-position:top;border-radius:7.5% / 3.5%}
.ck-palco.par .ck-mais{width:28px;height:28px;font-size:19px;line-height:28px}
.ck-palco.pilha .ck-palco-img{height:84%}
.ck-palco .ck-pg{height:72%;width:auto;aspect-ratio:3/4;object-fit:cover;border-radius:3px;box-shadow:0 10px 24px rgba(0,0,0,.55);transform:rotate(3deg)}
.ck-palco .ck-pg2{transform:rotate(-3deg)}
.ck-bformato{font-size:13px;line-height:1.35;color:var(--mut)}
.ck-blinha{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:2px 12px}
.bnome{flex:1 1 auto;min-width:0;font:700 18px/1.2 var(--serif);color:var(--ink);text-wrap:balance}
.bpreco{flex:none;font:900 18px/1 var(--serif);color:var(--ink);font-variant-numeric:tabular-nums;white-space:nowrap}
.bpreco s{font:500 14px/1 var(--sans);color:var(--mut);margin-right:4px}
.ck-bfrase{font-size:15px;line-height:1.45;color:var(--ink2);text-wrap:pretty}
.bbar{position:relative;display:flex;align-items:center;gap:12px;min-height:56px;margin-top:4px;padding:7px 13px;background:var(--papel);border:2px solid var(--ink);border-radius:14px;font:700 16px/1.2 var(--sans);color:var(--ink);cursor:pointer;user-select:none}
.bbar input{position:absolute;opacity:0;width:1px;height:1px;margin:0}
.bx{flex:none;display:grid;place-items:center;width:28px;height:28px;border:2px solid var(--ink);border-radius:8px;background:#FFFDF8;font:900 17px/1 var(--sans);color:#fff;transition:background-color .15s}
.bbar input:focus-visible+.bx{outline:3px solid var(--acc);outline-offset:2px}
.bbar.bfixo{cursor:default;background:var(--marcado)}
.bbar.bfixo .bx{background:var(--verde)}
.bumpcard.on{background:var(--marcado)}
.bumpcard.trava .bbar:not(.bfixo){cursor:default;font-size:14px}
.bumpcard.trava:not(.on){opacity:.72}
.bumpcard.on .bx{background:var(--verde);animation:ck-salta .45s cubic-bezier(.3,1.6,.5,1)}
@keyframes ck-salta{0%{transform:scale(.5) rotate(-14deg)}60%{transform:scale(1.22) rotate(5deg)}100%{transform:none}}
@media (prefers-reduced-motion:reduce){.bumpcard.on .bx{animation:none}}

/* total, botão, apoio */
.ck-tot{display:flex;justify-content:space-between;align-items:baseline;gap:14px;margin-top:4px}
.ck-tot>span{font:700 17px/1.2 var(--sans);color:var(--ink2);white-space:nowrap}
.ck-tot>div{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.ck-tot[hidden]{display:none}
.ck-tot b{font:900 40px/1 var(--serif);color:var(--ink);letter-spacing:-.01em;font-variant-numeric:tabular-nums;min-width:3ch;text-align:right}
.ck-tot small{font:600 13px/1.2 var(--sans);color:var(--mut)}
.pv-cta{display:flex;flex-direction:column;gap:12px}
.pv-btn{display:flex;align-items:center;justify-content:center;width:100%;min-height:60px;padding:14px 22px;border:2px solid var(--ink);border-radius:18px;background:${acento};color:#FFF8EE;font:800 19px/1.1 var(--sans);letter-spacing:.01em;cursor:pointer;box-shadow:4px 4px 0 var(--ink);transition:transform .12s,box-shadow .12s,filter .15s}
.pv-btn:hover{filter:brightness(1.06);transform:translate(-1px,-1px);box-shadow:6px 6px 0 var(--ink)}
.pv-btn:active{transform:translate(3px,3px);box-shadow:1px 1px 0 var(--ink)}
.pv-btn:focus-visible{outline:3px solid var(--acc);outline-offset:4px}
.pv-btn[disabled]{opacity:.7;cursor:wait;transform:none;box-shadow:4px 4px 0 var(--ink)}
.ck-acel{text-align:center;font:600 14px/1.3 var(--sans);color:var(--mut)}
.ck-caixa .via-pc{margin:-2px 0 0;text-align:center;font-size:13px;line-height:1.45;color:var(--mut)}
.ck-pend{font-family:var(--sans);color:var(--ink2)}
.ck-pend p{font-size:15px;line-height:1.55;margin:0 0 .4rem}
.ck-pend b{color:var(--ink)}
.ck-erro{padding:10px 12px;border-radius:12px;background:#FBE9EC;color:#6E1F2E}
.ck-erro b{color:#6E1F2E}
.ck-mudar{align-self:flex-start;border:0;background:none;padding:6px 0;min-height:32px;color:var(--acc);font:700 15px var(--sans);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.ck-mudar:focus-visible{outline:3px solid var(--acc);outline-offset:2px}
.ck-stripe{position:relative;margin-inline:-6px;border-radius:16px;overflow:hidden;background:#fff}
.ck-stripe[hidden]{display:none}
.ck-stripe.reserva{min-height:${ALTURA_FORM}px}
.ck-form{background:#fff}
.ck-form:focus{outline:none}
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

/* celular: barra do total presa embaixo enquanto o botão da folha não aparece; o chat sobe pra não cobrir */
.ck-barra{position:fixed;left:16px;right:16px;bottom:10px;z-index:40;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 10px 10px 16px;background:var(--papel);border:2px solid var(--ink);border-radius:18px;box-shadow:4px 4px 0 var(--sombra);transform:translateY(140%);visibility:hidden;transition:transform .25s ease,visibility .25s}
.ck-barra.on{transform:none;visibility:visible}
.ck-barra-tot{display:flex;flex-direction:column;gap:1px;min-width:0}
.ck-barra-tot span{font:600 13px/1.2 var(--sans);color:var(--mut)}
.ck-barra-tot b{font:900 24px/1 var(--serif);color:var(--ink);font-variant-numeric:tabular-nums;white-space:nowrap}
.ck-barra-btn{flex:none;min-height:56px;padding:10px 18px;border:2px solid var(--ink);border-radius:14px;background:${acento};color:#FFF8EE;font:800 16px/1.1 var(--sans);cursor:pointer;box-shadow:3px 3px 0 var(--ink)}
.ck-barra-btn:focus-visible{outline:3px solid #fff;outline-offset:3px}
@media (prefers-reduced-motion:reduce){.ck-barra{transition:none}}
body:has(.ck-barra.on) .lpw-fab{bottom:94px}
body:has(.ck-barra.on) .lpw-balao{bottom:102px}

/* prova, direto no fundo da casa */
.ck-lado{display:none}
.ck-extra{display:flex;flex-direction:column;gap:24px;padding:4px 0 0}
.ck-prova{display:flex;flex-direction:column;gap:16px;padding:20px 18px;border-radius:18px;background:var(--bg-deep)}
.ck-media{display:flex;align-items:center;gap:14px}
.ck-media>b{font-family:var(--serif);font-size:54px;line-height:.95;color:#fff;font-variant-numeric:tabular-nums}
.ck-media>div{display:flex;flex-direction:column;gap:5px}
.ck-media small{font-size:15px;color:var(--text)}
.ck-stars{position:relative;display:inline-block;font-size:25px;line-height:1;letter-spacing:2px}
.ck-stars .st-b{color:color-mix(in srgb,var(--text) 22%,transparent)}
.ck-stars .st-f{position:absolute;left:0;top:0;width:var(--f,100%);overflow:hidden;white-space:nowrap;color:#E6B85C}
.ck-bars{display:flex;flex-direction:column;gap:8px}
.ck-bar{display:grid;grid-template-columns:38px 1fr 46px;align-items:center;gap:10px;font-size:15px;color:var(--text);font-variant-numeric:tabular-nums}
.ck-bar .tr{height:10px;border-radius:5px;background:color-mix(in srgb,var(--text) 12%,transparent);overflow:hidden}
.ck-bar .tr i{display:block;height:100%;background:#E6B85C;border-radius:5px}
.ck-bar .pc{text-align:right}
.ck-leit{display:flex;align-items:center;gap:12px;font-size:15px;color:var(--text)}
.ck-leit>span:last-child{display:flex;flex-direction:column;gap:4px;line-height:1.3}
.ck-leit b{color:#fff;font-size:24px;font-weight:800;line-height:1;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.ck-avs{display:inline-flex;flex:none}
.ck-avs img{width:32px;height:32px;border-radius:50%;border:2px solid var(--bg-deep);margin-left:-10px;background:#333}
.ck-avs img:first-child{margin-left:0}
.ck-depo{margin:0;text-align:left}
.ck-depo blockquote{font-family:var(--serif);font-style:italic;font-size:18px;line-height:1.4;color:#fff;quotes:"\\201C" "\\201D"}
.ck-depo blockquote::before{content:open-quote;color:var(--bright)}
.ck-depo blockquote::after{content:close-quote;color:var(--bright)}
.ck-depo figcaption{margin-top:8px;font-family:var(--mono);font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--text)}

/* rodapé */
.ck-foot{padding:2.5rem 1.5rem;text-align:center;border-top:1px solid var(--hair);background:var(--bg-deep)}
.ck-foot p{font-family:var(--serif);font-style:italic;font-size:1rem;color:var(--sage)}

/* saída do checkout (downsell do ticket 25), igual ao A */
.exitov{position:fixed;inset:0;z-index:90;background:rgba(10,8,9,.78);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px}
.exitbox{position:relative;max-width:440px;width:100%;background:var(--bg-deep);border:1px solid var(--hair-accent);border-radius:20px;padding:34px 22px 28px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.6)}
.exitbox .kicker{display:block;margin-bottom:.7rem}
.exitbox h2{font-family:var(--serif);font-style:italic;font-weight:900;font-size:27px;color:#fff;margin-bottom:14px;line-height:1.18;text-wrap:balance}
.exittexto{font-size:16px;color:var(--text);line-height:1.55;margin-bottom:22px;text-wrap:pretty}
.exitcta{display:block;padding:18px 14px;border-radius:999px;background:var(--bright);color:#140408;font-weight:800;font-size:17px;letter-spacing:0;text-wrap:balance;box-shadow:0 5px 0 color-mix(in srgb,var(--bright) 55%,#000);transition:transform .15s ease,box-shadow .15s ease,filter .16s ease}
.exitcta:hover{filter:brightness(1.08)}
.exitcta:active{transform:translateY(3px);box-shadow:0 2px 0 color-mix(in srgb,var(--bright) 55%,#000)}
.exitfica{margin-top:20px;background:none;border:0;color:var(--text);font-family:var(--sans);font-size:16px;cursor:pointer;text-decoration:underline;text-underline-offset:4px;padding:6px 8px}
.exitfica:hover{color:var(--text)}
.exitx{position:absolute;top:6px;right:10px;background:none;border:0;color:var(--text);font-size:30px;cursor:pointer;line-height:1;width:44px;height:44px}
.exitx:hover{color:#fff}

/* de 1.024 px: duas colunas (produto e prova à esquerda, o pedido com os bumps à direita), mesmo degrau do A */
@media (min-width:1024px){
  .ck-top{max-width:1136px;padding:16px 28px 6px}
  .brand img{width:32px;height:32px}
  .wm{font-size:20px}
  .ck-seg{font-size:15px}
  .ck-pg{padding:18px 28px 16px}
  .ck-grade{max-width:1080px;gap:0;grid-template-columns:minmax(0,1fr) 470px;grid-template-rows:auto 1fr;column-gap:64px;row-gap:30px;align-items:start}
  .ck-prod{grid-column:1;grid-row:1;flex-direction:column;align-items:center;text-align:center;gap:22px;padding:12px 0 0}
  .ck-par{--h:250px}
  .ck-fone{margin-left:-22px;box-shadow:0 22px 40px -14px rgba(0,0,0,.9),inset 0 0 0 2px #2a2a2a}
  .ck-pcapa{box-shadow:0 18px 40px rgba(0,0,0,.65);border-radius:4px 8px 8px 4px}
  .ck-mais{width:40px;height:40px;font-size:28px;line-height:40px}
  .ck-tit{align-items:center;gap:8px}
  .ck-kick{display:inline-block;border:1px solid var(--hair-accent);border-radius:99px;padding:7px 14px;background:rgba(0,0,0,.25)}
  .ck-nome{font-size:36px;line-height:1.08}
  .ck-sub{font-size:16px;max-width:32ch}
  .ck-caixa{grid-column:2;grid-row:1/span 2;padding:24px 26px 26px;box-shadow:8px 8px 0 var(--sombra)}
  .ck-extra{grid-column:1;grid-row:2;padding:0}
  .ck-stripe{margin-inline:0}
  .ck-barra{left:auto;right:max(28px,calc((100vw - 1080px) / 2));width:470px;bottom:14px}
}
/* de 1.280 px: três colunas, o que leva e a prova | o pedido e depois a Stripe | os bumps empilhados */
${duas ? CSS_DUAS : CSS_TRES}
      `}</style>
    </>
  );
}
