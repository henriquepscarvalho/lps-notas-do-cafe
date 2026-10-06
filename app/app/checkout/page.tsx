"use client";

import { useEffect, useRef, useState } from "react";
import PageBeacon, { sendBeacon } from "../../PageBeacon";
import LpWidgets from "../../LpWidgets";
import PROVA from "../../../checkout-prova.json";
import MANIFEST from "../../../proof-manifest.json";
import { ViaPcLinha } from "../ViaPc";

/* ============================================================
   TOKENS DO APP (ticket 10 do app-scriptorium; a fábrica troca por news)
   ============================================================ */
const APP = {
  slug: "notas-do-cafe",
  news: "Notas do Café",
  titulo: "Café de Balcão no Coador de Casa",
  // HC 12/09 (rodada 2 do 55): o chip diz o que a pessoa leva, não o nome do produto
  kicker: "Ebook + app",
  // a cena do hero da LP /app (HC 12/09, protótipo C): a capa do ebook e o celular com o app
  capa: "/ebook-web/capa-notas-do-cafe.webp",
  capaAlt: "Capa do ebook Café de Balcão no Coador de Casa",
  fone: "/ebook-web/capa-app-notas-do-cafe.webp",
  foneAlt: "O app Café de Balcão no Coador de Casa no celular",
  leva: "Você leva os dois: o ebook pra baixar e o app pra aplicar",
  // sem preço e sem sub (HC 12/09): o formulário da Stripe mostra o valor certo da session
  // Bump = o segundo guia, desbloqueado dentro do mesmo app (ticket 25): NC recebe BC.
  // HC 12/09 (protótipo C do 55): "irmão" não existe pro leitor; o card apresenta o produto
  // do zero (ponte, nome, de que news vem, o que ensina) e a capa grande na mesma cena do
  // cabeçalho. Ponte e frase vêm da fábrica (app-scriptorium/56): pontes.json + lp-tokens do par.
  bump: {
    titulo: "Brasa Pronta em 20 Minutos",
    news: "Brasa Certa",
    ponte: "Você está levando o guia de repetir o café do balcão em casa. Este é o de acender a brasa em 20 minutos.",
    frase: "Da news Brasa Certa: o protocolo de fogo que corta a espera do carvão de uma hora pra 20 minutos, do fósforo à primeira carne, sem equipamento novo.",
    formato: "Ebook + app, igual ao que você está levando",
    capa: "/ebook-web/capa-brasa-certa.webp",
    capaAlt: "Capa do guia Brasa Pronta em 20 Minutos, da Brasa Certa",
    tela: "/ebook-web/capa-app-brasa-certa.webp",
    telaAlt: "O guia Brasa Pronta em 20 Minutos aberto no app",
    preco: "R$ 48,50",
    de: "R$ 97",
  },
  // Saída do checkout (downsell do ticket 25, regra R2: só depois do gesto de sair)
  downsell: {
    kicker: "Antes de ir",
    titulo: "Prefere começar menor?",
    texto: "O mesmo guia em ebook: versão web + PDF, com as 8 variáveis da coada pra imprimir, por R$ 47.",
    cta: "Começar pelo ebook de R$ 47",
    href: "/ebook-premium?src=downsell-app-checkout",
  },
  despedida: "Sem frescura. Bom café. Notas do Café",
};

/* Checkout do app no golden do checkout do ebook (app-scriptorium/55, HC 12/09/26, molde
   c4-20k/54): cabeçalho imersivo na largura (arte da capa, chip, título e sub sem preço),
   reforço no método Amazon (nota com estrelas na proporção e barras por estrela, leitores
   com as carinhas do `proof-manifest.json`, um voto real), formulário da Stripe e o bump
   card F "Você leva os dois" (aqui o segundo é o guia da ALQ no app). Zero preço fora da
   ficha da Stripe: a linha "R$ 97, pagamento único" e a faixa "Pagamento seguro · Garantia"
   saíram. Nav só com a marca, centrada (quem quer voltar, volta sozinho). Tudo de
   `checkout-prova.json`, gravado no build por `prova_checkout.py` a partir do Pharos; a
   página nunca carrega número na mão. */
const AVATARES = (MANIFEST.avatares || []).slice(0, 5);

/* Splits do checkout do ebook (EXP-058 cabeçalho, EXP-059 posição do bump) DESLIGADOS
   aqui: a cobaia das fichas é o checkout do ebook das 97 casas; o app vende 2 por
   trimestre na EE e entraria só pra sujar a leitura. Todo mundo vê A + A. Ligar =
   trocar pra true e subir: o beacon `app-ck-split-hX-bY` carimba o braço na jornada
   (passo próprio, fora do regex de variante) e `checkout_variant` viaja na session. */
const SPLIT = { cabecalho: false, bump: false };
let sorteioOk = true;
type Braco = "A" | "B";
function sorteia(chave: "app_ck_h" | "app_ck_b", ligado: boolean): Braco {
  if (!ligado) return "A";
  try {
    const v = localStorage.getItem(chave);
    if (v === "A" || v === "B") return v;
    const b: Braco = Math.random() < 0.5 ? "A" : "B";
    localStorage.setItem(chave, b);
    return b;
  } catch {
    sorteioOk = false;
    return "A";
  }
}

// Publishable key da conta News Makers (o app cobra pela NM, ticket app/14).
const PK = process.env.NEXT_PUBLIC_STRIPE_PK_NM;

type CheckoutHandle = { mount: (sel: string) => void; destroy: () => void };
type StripeJs = {
  initEmbeddedCheckout: (opts: { fetchClientSecret: () => Promise<string> }) => Promise<CheckoutHandle>;
};
declare global {
  interface Window {
    Stripe?: (pk: string) => StripeJs;
  }
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

/* c4-20k/93 (HC 15/09/26, EXP de cadência da Monetização): o bônus da `oferta=bonus` pode vir com
   prazo. `fim=<dia>-<HHMM>` é a gramática do contador do email: vale da segunda 00:00 até <dia>
   HH:MM:59 da mesma semana, relógio BRT (UTC-3 fixo). `ate=<epoch>` vale até o instante. Com os
   dois, os dois valem; sem nenhum, ou ilegível, sem prazo (a recuperação do app segue igual). */
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

/* LEGIVEL: o valor em reais nunca quebra de linha entre o "R$" e o número */
const nb = (t: string) => t.replace(/R\$ (?=\d)/g, "R$\u00a0");

/* c420/153 (HC 02/10/26): o desenho que a pessoa viu viaja na session como `checkout_variant`:
   "cel" (até 639 px), "1col" (640 a 1.023), "2col" (1.024 a 1.279) e "3col" (1.280 px ou mais).
   É por ele que a leitura de D+28 separa a receita por checkout das 3 colunas. */
function desenho(): "cel" | "1col" | "2col" | "3col" {
  try {
    const m = (q: string) => window.matchMedia(q).matches;
    return m("(max-width: 639px)") ? "cel" : m("(min-width: 1280px)") ? "3col" : m("(min-width: 1024px)") ? "2col" : "1col";
  } catch {
    return "2col";
  }
}

/* app/89: o fim do bônus em ms (o mais cedo entre `fim=<dia>-<HHMM>` e `ate=<epoch>`), ou null sem
   prazo legível. Mesma gramática e relógio do bonusNoPrazo (c4-20k/93): BRT, UTC-3 fixo. */
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

export default function AppCheckout() {
  const [bump, setBump] = useState(false);
  // ticket 35: a recuperação chega com ?oferta=bonus (o guia da ALQ de graça) ou ?oferta=metade (R$ 48,50);
  // ticket 41: o dono do ebook chega com ?oferta=dono&e=<email> (R$ 48,50, posse conferida na rota);
  // c4-20k/57: `dono27` = a janela de 48 h do D+3 (R$ 47); ticket c4-20k/22: `leitor` (R$ 48,50, sem email).
  // A rota decide o preço e a Stripe mostra; o cabeçalho não repete valor nenhum.
  const [oferta, setOferta] = useState("");
  // app/89: o prazo do bônus em texto («sexta 16/10, 23:59»); vazio = sem prazo legível ou vencido
  const [prazo, setPrazo] = useState("");
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get("oferta") !== "bonus") return;
      const fim = fimDoBonus(q.get("fim"), q.get("ate"), Date.now());
      if (fim !== null && fim > Date.now()) setPrazo(prazoTexto(fim));
    } catch {
      /* sem query */
    }
  }, []);
  const [email, setEmail] = useState("");
  // c4-20k/93: bônus com prazo vencido (relógio do aparelho primeiro, a rota decide por último)
  const [vencido, setVencido] = useState(false);
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const o = q.get("oferta");
      if (o === "bonus" || o === "metade" || o === "dono" || o === "dono27" || o === "leitor") setOferta(o);
      if (o === "bonus") setVencido(!bonusNoPrazo(q.get("fim"), q.get("ate"), Date.now()));
      setEmail((q.get("e") || "").replace(/ /g, "+").trim());
    } catch {
      /* sem query */
    }
  }, []);
  const [braco, setBraco] = useState<Braco | null>(null); // null até o sorteio: sem piscar de um braço pro outro
  const [pos, setPos] = useState<Braco>("A"); // A = bump depois do formulário, B = antes
  // app/75 (HC 23/09, molde do c4-20k/127): abaixo de 640 px a ordem é fixa (tira, formulário, bump,
  // cena, nota), sem sorteio (A + A); checkout_variant "cel" carimba a session.
  const [celular, setCelular] = useState(false);
  useEffect(() => {
    const cel = window.matchMedia("(max-width: 639px)").matches;
    setCelular(cel);
    const h: Braco = cel ? "A" : sorteia("app_ck_h", SPLIT.cabecalho);
    const b: Braco = cel ? "A" : sorteia("app_ck_b", SPLIT.bump);
    setBraco(h);
    setPos(b);
    if (SPLIT.cabecalho || SPLIT.bump) sendBeacon(APP.slug, cel ? "app-ck-split-cel" : sorteioOk ? `app-ck-split-h${h}-b${b}` : "app-ck-split-x");
  }, []);
  const [stripeOk, setStripeOk] = useState(false);
  const [montado, setMontado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [saida, setSaida] = useState(false);
  const saidaJa = useRef(false);

  // stripe.js por script tag (zero dependência npm, igual nos 30 repos)
  useEffect(() => {
    if (!PK) return;
    if (window.Stripe) {
      setStripeOk(true);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://js.stripe.com/v3/";
    s.onload = () => setStripeOk(true);
    s.onerror = () => setErro("stripe.js não carregou");
    document.head.appendChild(s);
  }, []);

  // monta (e remonta quando o bump muda: session nova com line_items[1])
  useEffect(() => {
    if (!stripeOk || !PK || !window.Stripe || !braco) return;
    let handle: CheckoutHandle | null = null;
    let vivo = true;
    setErro(null);
    setMontado(false); // trocar o bump remonta a session: o esqueleto volta junto
    window
      .Stripe(PK)
      .initEmbeddedCheckout({
        fetchClientSecret: () =>
          fetch("/api/app-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bump,
              oferta,
              email,
              ...prazoDaUrl(),
              // sem split, o carimbo é o desenho da tela ("cel", "1col", "2col", "3col"); "hA-bB" etc. se as chaves ligarem
              checkout_variant: celular ? "cel" : SPLIT.cabecalho || SPLIT.bump ? `h${braco}-b${pos}` : desenho(),
              ...jornada(),
              ...destino(),
            }),
          })
            .then((r) => r.json())
            .then((d) => {
              if (!d.clientSecret) throw new Error(d.error || "sem clientSecret");
              if (oferta === "bonus" && typeof d.oferta === "string") setVencido(d.oferta !== "bonus");
              return d.clientSecret;
            }),
      })
      .then((c) => {
        if (!vivo) {
          c.destroy();
          return;
        }
        handle = c;
        c.mount("#checkout-box");
        setMontado(true);
      })
      .catch((e: Error) => setErro(e.message));
    return () => {
      vivo = false;
      handle?.destroy();
    };
  }, [stripeOk, bump, oferta, email, braco]);

  // Início de pagamento (EXP-072, app-scriptorium/66): beacon `app-ck-pagar`, 1 vez por jornada, no primeiro
  // toque no formulário da Stripe. O formulário mora num iframe de outra origem, então o toque nunca chega aqui
  // como clique: o que a página enxerga é a janela perder o foco (blur) com o iframe de dentro do #checkout-box
  // como elemento ativo. Trocar de aba, abrir o chat ou tocar fora do formulário não conta, porque aí o elemento
  // ativo é outro (os iframes de controle e de modal da Stripe ficam fora do #checkout-box). Duas redes pro mesmo
  // predicado: a conferência no próximo tick cobre o motor que só atualiza o activeElement depois do blur, e a
  // de 1 em 1 segundo cobre o que não entrega o blur da janela (webview que ainda não tinha o foco da página).
  // Dedupe: a chave de sessão do sendBeacon (mesma vida do journey_id) + o ref, pra aba sem sessionStorage.
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
      sendBeacon(APP.slug, "app-ck-pagar", { eventType: "converteu" });
    };
    function onBlur() {
      confere();
      window.setTimeout(confere, 0);
    }
    window.addEventListener("blur", onBlur);
    relogio = window.setInterval(confere, 1000);
    return para;
  }, []);

  // Saída do checkout (ticket 25, ponto 3 do downsell): abriu o embedded e fez o
  // gesto de sair sem pagar. Uma vez por sessão; o corpo da página não cita o ebook.
  // c4-20k/141: o card abria no desktop sem deixar rastro e nunca abria no toque (65% das
  // jornadas). Agora grava `app-checkout-exit` ao abrir (o clique grava `app-checkout-exit-cta`)
  // e o toque usa o gesto do ExitIntent do checkout do ebook (subida rápida de 320 px em até
  // 350 ms depois de 60% da página), pra leitura do c4-20k/42 comparar os dois cards.
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
      sendBeacon(APP.slug, "app-checkout-exit");
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
  }, []);

  const configurado = Boolean(PK);
  const depo = PROVA.depoimento;
  const bonus = oferta === "bonus" && !vencido;

  /* Card do bump (C do protótipo de 12/09): a ponte, a cena com a capa grande e o celular,
     o nome do guia, de que news vem e o que ensina, preço e a barra de marcar. Com
     `oferta=bonus` o guia entra de graça (a rota manda o bump na metadata sem line item)
     e o card fica marcado sem barra. Posição por `pos`: A depois do formulário, B antes. */
  const bumpCard = (
    <section className={`bumpcard${bump || bonus ? " on" : ""}${pos === "B" ? " antes" : ""}`} aria-label={bonus ? "Bônus incluído" : "Adicione ao pedido"}>
      <span className="btag">{bonus ? "Bônus incluído" : "Adicione ao pedido"}</span>
      <p className="bponte">{nb(APP.bump.ponte)}</p>
      <div className="hd-par b-par">
        <img className="hd-pcapa" src={APP.bump.capa} alt={APP.bump.capaAlt} width={1800} height={2400} loading="lazy" />
        <span className="hd-mais" aria-hidden="true">+</span>
        <span className="hd-fone"><img src={APP.bump.tela} alt={APP.bump.telaAlt} width={780} height={1688} loading="lazy" /></span>
      </div>
      <span className="bformato">{APP.bump.formato}</span>
      <span className="bnome">{nb(APP.bump.titulo)}</span>
      <span className="bfrase">{nb(APP.bump.frase)}</span>
      <span className="bpreco">{bonus ? <><s>{APP.bump.preco}</s> R$ 0</> : <><s>{APP.bump.de}</s> {APP.bump.preco}</>}</span>
      {bonus ? (
        <span className="bbar bfixo"><span className="bx" aria-hidden="true">✓</span><span>Entra sem custo neste pedido{prazo ? `, até ${prazo}` : ""}</span></span>
      ) : (
        <label htmlFor="bump" className="bbar">
          <input id="bump" type="checkbox" checked={bump} onChange={(e) => setBump(e.target.checked)} />
          <span className="bx" aria-hidden="true">{bump ? "✓" : ""}</span>
          <span>Levar os dois</span>
        </label>
      )}
    </section>
  );

  return (
    <>
      <PageBeacon slug={APP.slug} step="app-checkout" source="app" />

      <nav>
        <div className="wrap nav-inner">
          <a href="/" className="brand" aria-label="Home">
            <img src="/ebook-web/simbolo.png" alt="" width={32} height={32} />
            <span className="wm"><span className="t">Notas</span><span className="s">{" do Café"}</span></span>
          </a>
          {/* HC 11/09 (regra do 54): sem "voltar pro app"; quem quer voltar, volta sozinho */}
        </div>
      </nav>

      <main className="ck-page" data-legivel="1">{/* LEGIVEL (col/32) */}
        {/* app/75: no celular a tira (capa, chip, título e a nota numa linha) abre a página e o formulário
            da Stripe vem logo abaixo, dentro da 1ª tela; acima de 640 px a tira some. */}
        <div className="ck-tira">
          <span className="ck-tira-capa"><span className="ck-lomb" aria-hidden="true" /><img src={APP.capa} alt={APP.capaAlt} width={44} height={59} /></span>
          <div className="ck-tira-in">
            <span className="ck-tira-kick">{APP.kicker}</span>
            <span className="ck-tira-tit">{APP.titulo}</span>
            {PROVA.exibir && PROVA.exibir_nota && (
              <span className="ck-tira-nota"><b>{PROVA.media_exibido}</b><span className="ck-stars" style={{ "--f": `${PROVA.media_pct}%` } as React.CSSProperties} aria-label={`${PROVA.media_exibido} de 5`}><span className="st-b" aria-hidden="true">★★★★★</span><span className="st-f" aria-hidden="true">★★★★★</span></span><span>{PROVA.votos} votos</span></span>
            )}
          </div>
        </div>
        <div className="ck-lado">
        {/* cabeçalho: A = a cena da LP (par ebook + app, chip "Ebook + app", título; HC 12/09, protótipo C);
            B = capa ao lado (só quando o split ligar) */}
        {braco === "B" ? (
          <header className="hd hd-split">
            <span className="hd-capa">
              <span className="ck-lomb" aria-hidden="true" />
              <img src="/ebook-web/capa-notas-do-cafe.webp" alt={APP.capaAlt} />
            </span>
            <div className="hd-in">
              <span className="hd-chip">{APP.kicker}</span>
              <h1 className="hd-h1">{APP.titulo}</h1>
            </div>
          </header>
        ) : (
          <header className={`hd hd-cena${braco ? "" : " hd-sorteando"}`}>
            <div className="hd-par">
              <img className="hd-pcapa" src={APP.capa} alt={APP.capaAlt} width={1800} height={2400} />
              <span className="hd-mais" aria-hidden="true">+</span>
              <span className="hd-fone"><img src={APP.fone} alt={APP.foneAlt} width={780} height={1688} /></span>
            </div>
            <p className="hd-leva">{APP.leva}</p>
            <span className="hd-chip">{APP.kicker}</span>
            <h1 className="hd-h1">{APP.titulo}</h1>
          </header>
        )}

        {/* reforço antes do formulário (regra do 54): nota no método Amazon + leitores da casa +
            um voto real. Some inteiro em casa sem lastro (piso: 1.000 leitores, 50 votos). */}
        {PROVA.exibir && PROVA.exibir_nota && (
          <section className="ck-prova" aria-label={`O que os leitores da ${APP.news} dizem`}>
            <div className="ck-media">
              <b>{PROVA.media_exibido}</b>
              <div>
                <span className="ck-stars" style={{ "--f": `${PROVA.media_pct}%` } as React.CSSProperties} aria-label={`${PROVA.media_exibido} de 5`}>
                  <span className="st-b" aria-hidden="true">★★★★★</span><span className="st-f" aria-hidden="true">★★★★★</span>
                </span>
                <small>{PROVA.votos} votos de leitores</small>
              </div>
            </div>
            <div className="ck-bars" aria-hidden="true">
              {PROVA.distribuicao.map((d) => (
                <div className="ck-bar" key={d.estrelas}>
                  <span>{d.estrelas} ★</span>
                  <span className="tr"><i style={{ width: `${d.pct}%` }} /></span>
                  <span className="pc">{d.pct}%</span>
                </div>
              ))}
            </div>
            <div className="ck-leit">
              {AVATARES.length > 0 && (
                <span className="ck-avs" aria-hidden="true">
                  {AVATARES.map((f) => <img key={f} src={`/images/leitores/${f}`} alt="" width={26} height={26} loading="lazy" />)}
                </span>
              )}
              <span><b>{PROVA.leitores_exibido}</b> leitores recebem a news</span>
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
        <div className="ck-pg">
        {pos === "B" && bumpCard}

        {/* app/82: linha só no computador acima do formulário */}
        <ViaPcLinha />
        {/* app/89: a linha do prazo acima do formulário (no celular, logo abaixo da tira, na 1ª tela);
            o card do bônus segue abaixo com a cena e o que o guia ensina */}
        {bonus && prazo && (
          <p className="ck-bonus">Bônus incluído até <b>{prazo}</b>: {APP.bump.titulo}, da news {APP.bump.news}.</p>
        )}
        <div className={`ck-box${configurado && !montado && !erro ? " carregando" : ""}`}>
          {configurado ? (
            <>
              <div id="checkout-box" />
              {/* Esqueleto por cima do container enquanto o embedded checkout monta:
                  sem ele a caixa branca fica vazia até a Stripe pintar (0,7 a 1,7 s). */}
              {!montado && !erro && (
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
            </>
          ) : (
            <div className="ck-pend">
              <p><b>Checkout em preparação.</b></p>
              <p>O checkout abre aqui assim que as chaves da Stripe entrarem no ambiente. Nada é cobrado até lá.</p>
            </div>
          )}
          {erro && <div className="ck-pend"><p><b>O checkout não abriu.</b></p><p>{erro}</p></div>}
        </div>

        {pos === "A" && bumpCard}
        </div>
      </main>

      {saida && (
        <div className="exitov" role="dialog" aria-modal="true" aria-label={APP.downsell.titulo}>
          <div className="exitbox">
            <button className="exitx" aria-label="Fechar" onClick={() => setSaida(false)}>×</button>
            <p className="kicker">{APP.downsell.kicker}</p>
            <h2>{APP.downsell.titulo}</h2>
            <p className="exittexto">{nb(APP.downsell.texto)}</p>
            <a
              className="exitcta"
              href={APP.downsell.href}
              onClick={() => sendBeacon(APP.slug, "app-checkout-exit-cta", { eventType: "converteu" })}
            >
              {nb(APP.downsell.cta)}
            </a>
            <button className="exitfica" onClick={() => setSaida(false)}>Continuar com o app</button>
          </div>
        </div>
      )}

      <footer className="ck-foot">
        <p>{APP.despedida}</p>
      </footer>

      {/* chat de dúvidas também no checkout (HC 19/09/26): só o chat, sem prova nem botão de compra */}
      <LpWidgets slug={APP.slug} produto="app" local="checkout" cor="#E0701F" corTexto="#FFF7F2" />

      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
:root{--bg:#14110C;--bg-deep:#19170F;--text:#E9EAE3;--text-dim:#96917E;--sage:#96917E;--hair:rgba(233,234,227,.12);--hair-accent:rgba(226,120,44,.30);--bright:#E2782C;--serif:"Playfair Display",Georgia,serif;--sans:"Inter",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,monospace}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--sans);background:var(--bg);color:var(--text);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
nav{position:sticky;top:0;z-index:50;background:rgba(15,13,14,.82);backdrop-filter:saturate(140%) blur(8px);-webkit-backdrop-filter:saturate(140%) blur(8px);border-bottom:1px solid var(--hair)}
a{color:inherit;text-decoration:none}
.wrap{width:100%;max-width:1140px;margin:0 auto;padding:0 28px}
.nav-inner{display:flex;align-items:center;justify-content:center;height:66px} /* marca centrada, sem link de voltar */
.brand{display:flex;align-items:center;gap:11px}
.brand img{width:32px;height:32px}
.wm{font-weight:700;font-size:20px;letter-spacing:-.02em}
.wm .t{color:var(--bright)}.wm .s{color:#fff}
.kicker{font-family:var(--mono);font-size:13px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--bright)}

        .ck-page{max-width:560px;margin:0 auto;padding:0 1.25rem 4rem}
        .ck-lado,.ck-pg{display:contents}
        .ck-lomb{position:absolute;top:2%;bottom:2%;left:-5px;width:6px;border-radius:4px 0 0 4px;background:linear-gradient(90deg,rgba(0,0,0,.85),rgba(255,255,255,.10))}
        /* cabeçalho: dois braços (A = imersivo, arte da capa sangrada; B = capa à esquerda) */
        .hd{margin:0 0 18px}
        .hd-chip{display:inline-block;font-family:var(--mono);font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:var(--bright);border:1px solid var(--hair-accent);border-radius:99px;padding:7px 14px;background:rgba(15,13,14,.45);margin-bottom:14px;font-weight:500}
        .hd-h1{font-family:var(--serif);font-style:italic;font-weight:900;font-size:clamp(2.15rem,9.4vw,3rem);line-height:1.08;color:#fff;letter-spacing:-.02em;margin:0 0 10px;text-wrap:balance}
        .hd-cena{display:flex;flex-direction:column;align-items:center;text-align:center;padding:22px 0 4px}
        .hd-sorteando{visibility:hidden} /* antes do sorteio: sem piscar de um braço pro outro */
        .hd-par{display:flex;align-items:center;justify-content:center;position:relative;--h:220px}
        .hd-pcapa{height:var(--h);width:auto;aspect-ratio:3/4;object-fit:cover;border-radius:4px 8px 8px 4px;box-shadow:0 18px 40px rgba(0,0,0,.65);transform:rotate(-4deg);z-index:1}
        .hd-fone{display:block;height:calc(var(--h) * 1.06);aspect-ratio:390/844;padding:2%;border-radius:9.5% / 4.4%;background:#0b0b0b;box-shadow:0 22px 40px -14px rgba(0,0,0,.9),inset 0 0 0 2px #2a2a2a;margin-left:-22px;z-index:2}
        .hd-fone img{display:block;width:100%;height:100%;object-fit:cover;object-position:top;border-radius:7.5% / 3.5%}
        .hd-mais{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:40px;height:40px;border-radius:50%;background:#fff;color:#140408;font-family:var(--serif);font-size:28px;line-height:40px;text-align:center;z-index:3;box-shadow:0 6px 18px rgba(0,0,0,.5)}
        .hd-leva{font-size:16px;color:var(--text);margin:20px 0 16px;max-width:32ch;line-height:1.5;text-wrap:balance}
        .hd-split{display:grid;grid-template-columns:132px 1fr;gap:20px;align-items:center;padding:22px 0 6px}
        .hd-capa{position:relative;display:block;width:132px}
        .hd-capa img{display:block;width:100%;height:auto;border-radius:6px;box-shadow:0 18px 40px rgba(0,0,0,.6),0 0 50px rgba(200,125,146,.14)}
        .hd-split .hd-h1{font-size:clamp(1.9rem,7.6vw,2.4rem)}
        .hd-split .hd-chip{font-size:13px;letter-spacing:.08em;padding:6px 12px;white-space:nowrap}
        .ck-box{position:relative;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.5),0 0 60px rgba(200,125,146,.10);min-height:120px}
        .ck-box.carregando{min-height:400px}
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
        .ck-pend{padding:2.2rem 1.6rem;font-family:var(--sans,inherit);color:#26302B}
        .ck-pend p{font-size:16px;line-height:1.6;margin:0 0 .5rem}
        .ck-pend b{color:#0D0F0E}
        .bumpcard{margin-top:18px;padding:24px 20px;border:1px solid var(--hair);border-radius:16px;background:var(--bg-deep);text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px;transition:border-color .2s ease,background .2s ease}
        .bumpcard.antes{margin:0 0 16px}
        .bumpcard.on{border-color:var(--bright);background:rgba(200,125,146,.07)}
        .bumpcard input{position:absolute;opacity:0;width:0;height:0}
        .btag{font-family:var(--mono);font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:var(--bright);font-weight:500}
        .bponte{font-family:var(--serif);font-style:italic;font-size:21px;line-height:1.28;color:#fff;margin:10px 0 18px;max-width:25ch;text-wrap:balance}
        .b-par{--h:230px}
        .b-par .hd-fone{height:calc(var(--h) * .92);margin-left:-8px}
        .b-par .hd-mais{width:36px;height:36px;font-size:25px;line-height:36px}
        .bformato{font-size:15px;color:var(--text);margin:20px 0 2px;max-width:30ch;text-wrap:balance}
        .bfrase{display:block;font-size:16px;color:var(--text);line-height:1.5;margin:0 0 14px;max-width:32ch;text-wrap:pretty}
        .bnome{display:block;font-family:var(--serif);font-weight:700;font-size:22px;color:#fff;margin:8px 0 6px;line-height:1.2;text-wrap:balance}
        .bpreco{display:flex;font-size:34px;font-weight:800;color:#fff;align-items:baseline;justify-content:center;gap:10px;line-height:1;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
        .bpreco s{color:var(--text-dim);font-weight:500;font-size:19px;margin:0;letter-spacing:0}
        .bbar{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;margin-top:18px;padding:14px 20px;border:0;border-radius:999px;color:#140408;font-weight:800;font-size:18px;cursor:pointer;min-height:60px;background:var(--bright);letter-spacing:.01em;user-select:none;box-shadow:0 5px 0 color-mix(in srgb,var(--bright) 55%,#000);transition:transform .15s ease,box-shadow .15s ease,filter .15s ease}
        .bbar.bfixo{cursor:default;background:transparent;color:#fff;box-shadow:none;border:1.5px solid var(--bright)}
        .bumpcard.on .bbar.bfixo{background:transparent;transform:none;box-shadow:none}
        .bbar.bfixo:hover{filter:none}
        .bbar.bfixo .bx{background:var(--bright);border-color:var(--bright);color:#140408}
        .bumpcard.on .bbar{background:var(--bright);transform:translateY(3px);box-shadow:0 2px 0 color-mix(in srgb,var(--bright) 55%,#000)}
        .bbar:hover{filter:brightness(1.06)}
        .bbar:active{transform:translateY(3px);box-shadow:0 2px 0 color-mix(in srgb,var(--bright) 55%,#000)}
        .bbar:has(input:focus-visible){outline:3px solid #fff;outline-offset:4px}
        .bx{width:28px;height:28px;border-radius:8px;border:2px solid #140408;display:inline-flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#fff;flex:none;transition:background .2s ease;background:#fff}
        .bumpcard.on .bx{background:#140408}
        /* reforço: nota (método Amazon), leitores, voto */
        .ck-prova{margin:0 0 16px;padding:20px 18px;border:1px solid var(--hair);border-radius:16px;background:var(--bg-deep);display:flex;flex-direction:column;gap:16px}
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
        /* tira e ordem do celular (app/75, molde do c4-20k/127): formulário na 1ª tela; desktop segue como está */
        .ck-tira{display:none}
        .ck-bonus{margin:6px 0 14px;padding:11px 14px;border:1px solid var(--hair-accent);border-radius:10px;background:color-mix(in srgb,var(--bright) 12%,transparent);font-size:15px;line-height:1.45;color:var(--text);text-wrap:pretty}
        .ck-bonus b{color:#fff;font-weight:700}
        @media (max-width:639px){
          .ck-page{display:flex;flex-direction:column}
          .ck-tira{display:grid;grid-template-columns:56px 1fr;gap:14px;align-items:center;padding:10px 0 12px;order:1}
          .ck-tira-capa{position:relative;display:block;width:56px}
          .ck-tira-capa img{display:block;width:100%;height:auto;border-radius:4px;box-shadow:0 10px 22px rgba(0,0,0,.6)}
          .ck-tira-in{min-width:0}
          .ck-tira-kick{display:block;font-family:var(--mono);font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--bright);line-height:1.3;font-weight:500}
          .ck-tira-tit{display:block;font-family:var(--serif);font-style:italic;font-weight:900;font-size:22px;line-height:1.12;color:#fff;letter-spacing:-.01em;margin:3px 0 4px;text-wrap:balance}
          .ck-tira-nota{display:flex;align-items:center;gap:7px;font-size:14px;color:var(--text);line-height:1}
          .ck-tira-nota b{color:#fff;font-family:var(--serif);font-size:17px}
          .ck-tira-nota .ck-stars{font-size:16px;letter-spacing:.5px}
          .ck-box{order:2}
          .ck-bonus{order:1;margin:2px 0 12px}
          .bumpcard{order:3;margin:18px 0 0}
          .bumpcard.antes{margin:18px 0 0}
          .hd{order:4;margin:20px 0 0}
          .hd-cena{padding:6px 0 4px}
          .ck-prova{order:5;margin:20px 0 0}
          .ck-leit{gap:10px;font-size:15px}
          .ck-avs img{margin-left:-12px}
        }
        /* computador: a largura que sobra vira lateral. Produto e prova à esquerda, formulário e bump à direita,
           formulário dentro da 1ª tela. Entre 640 e 1023 px a página segue em coluna única, como antes. */
        @media (min-width:1024px){
          .ck-page{max-width:1180px;display:grid;grid-template-columns:minmax(0,1fr) 520px;column-gap:64px;align-items:start;padding:36px 28px 5rem}
          .ck-lado,.ck-pg{display:block;min-width:0}
          .ck-lado{grid-column:1;grid-row:1}
          .ck-pg{grid-column:2;grid-row:1}
          .hd{margin:0 0 26px}
          .ck-prova{margin:0}
          .bumpcard.antes{margin:0 0 18px}
          .hd-cena{padding-top:0}
          .hd-par{--h:280px}
        }
        /* c420/153 (HC 02/10/26): a partir de 1.280 px, três colunas numa visão só: produto e prova | formulário | bump.
           Entre 1.024 e 1.279 px seguem as duas colunas; abaixo de 640 px, a ordem do celular (app/75). A linha «via-pc»
           fica sobre o formulário, na coluna do meio; o bump encolhe pra barra caber na 1ª tela (texto nunca abaixo de 13 px). */
        @media (min-width:1280px){
          .ck-page{max-width:1360px;grid-template-columns:minmax(300px,1.1fr) minmax(440px,1.5fr) minmax(300px,1.1fr);grid-template-rows:auto 1fr;column-gap:36px}
          .ck-pg{display:contents}
          .ck-lado{grid-row:1 / span 2}
          .ck-page .via-pc{grid-column:2;grid-row:1}
          .ck-box{grid-column:2;grid-row:2}
          .ck-bonus{display:none}
          .bumpcard,.bumpcard.antes{grid-column:3;grid-row:1 / span 2;margin:0;padding:18px 16px}
          .hd-h1{font-size:2.3rem}
          .hd-par{--h:230px}
          .hd-leva{margin:16px 0 12px}
          .bponte{font-size:18px;margin:8px 0 12px}
          .b-par{--h:150px}
          .bformato{font-size:14px;margin:12px 0 0}
          .bnome{font-size:20px;margin:6px 0 4px}
          .bfrase{font-size:15px;line-height:1.45;margin:0 0 10px}
          .bpreco{font-size:30px}
          .bpreco s{font-size:17px}
          .bbar{margin-top:14px}
        }
        /* tela baixa (notebook de 768 px): o bump aperta mais um degrau pra barra seguir na 1ª tela */
        @media (min-width:1280px) and (max-height:779px){
          .bumpcard,.bumpcard.antes{padding:14px 16px}
          .bponte{font-size:17px;margin:6px 0 8px}
          .b-par{--h:110px}
          .bformato{margin:8px 0 0}
          .bfrase{margin:0 0 6px}
          .bbar{margin-top:12px}
        }
        .ck-foot{padding:2.5rem 1.5rem;text-align:center;border-top:1px solid var(--hair);background:var(--bg-deep)}
        .ck-foot p{font-family:var(--serif);font-style:italic;font-size:1rem;color:var(--sage)}

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
      `}</style>
    </>
  );
}
