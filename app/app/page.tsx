"use client";

import { useEffect, useState } from "react";
import PageBeacon, { sendBeacon } from "../PageBeacon";
import LpWidgets, { fichaDoApp } from "../LpWidgets";
import { BRACO, CSS, HTML, JS } from "./ouro";

/* LP do par EBOOK + APP da Notas do Café (app-scriptorium/13, rollout da ouro-ee aprovada pelo HC em 04/09/26).
   Markup, CSS e JS vêm de ./ouro.ts, emitidos pela fábrica rollout/lp-app/build_lp_app.py; a página só
   pendura beacon, ViewContent (value 97) e a vitrine (chat + prova social). Checkout: /app/checkout. */
const PRECO = "R$ 97";
const CTA_LABEL = "Quero o ebook + app →";
const CHECKOUT = "/app/checkout";
const DEPOIMENTOS: { x: string; who: string }[] = [
  {
    "x": "Estou aprendendo muito e as informações me tornam cada vez mais seguro para escolher um café de qualidade. Grato a todos.",
    "who": "voto de leitor(a) na edição diária"
  },
  {
    "x": "A quantidade de coisas novas sobre café que aprendi hoje. Muito bom o texto. Venho bebendo cafés \"apagados\" há tempos.",
    "who": "Marco · resposta por email"
  },
  {
    "x": "Além de aprender sobre mais uma região que produz café de qualidade, também aprendi detalhes de um método de extração para tirar o melhor desse café. Sensacional!",
    "who": "voto de leitor(a) na edição diária"
  }
];
const APP = {
  "slug": "notas-do-cafe",
  "nome": "Café de Balcão no Coador de Casa",
  "manchete": "O ebook que ensina a coar café de balcão no filtro de papel, com o app que fica ao lado do coador.",
  "sub": "Pra quem toma café todo dia e desconfia da própria xícara: leia, marque e teste uma variável por dia na coada da manhã. Seu pra sempre.",
  "specs": [
    {
      "n": "12",
      "l": "recursos"
    },
    {
      "n": "13",
      "l": "capítulos"
    },
    {
      "n": "8",
      "l": "dias de plano"
    },
    {
      "n": "offline",
      "l": "depois do primeiro acesso"
    }
  ],
  "features": {
    "itens": [
      {
        "nome": "Marca-texto",
        "desc": "Passa o dedo, o trecho fica dourado e cai na lista Destaques."
      },
      {
        "nome": "Destaques numa lista",
        "desc": "Tudo que você marcou, junto, pra reler antes de agir."
      },
      {
        "nome": "Cinco fundos + luz quente",
        "desc": "Pergaminho, Branco, Sépia, Verde, Ébano. E uma luz quente pra ler à noite."
      },
      {
        "nome": "Notas no material",
        "desc": "A nota fica junto do parágrafo, não num caderno à parte."
      },
      {
        "nome": "Fonte ajustável",
        "desc": "Fonte, tamanho, espaçamento e margem do seu jeito."
      },
      {
        "nome": "Plano de 8 dias",
        "desc": "Um variável por dia. Leu até o fim, o dia marca sozinho."
      },
      {
        "nome": "Retomar de onde parou",
        "desc": "Abre no capítulo em que você fechou e mostra quanto falta."
      },
      {
        "nome": "A peça pra imprimir",
        "desc": "As 8 variáveis da coada, em A4, pra levar junto."
      },
      {
        "nome": "Biblioteca",
        "desc": "Cada guia comprado entra na estante. Os outros da rede, a um toque."
      },
      {
        "nome": "Scripts prontos",
        "desc": "Quatro mensagens escritas, pra copiar e mandar."
      },
      {
        "nome": "Glossário com busca",
        "desc": "O vocabulário do guia traduzido, com filtro."
      },
      {
        "nome": "Instala e lê sem internet",
        "desc": "Depois do primeiro acesso, o ebook fica no aparelho."
      }
    ]
  },
  "faq": {
    "itens": [
      {
        "q": "É uma vez só?",
        "a": "Sim. R$ 97 uma vez só, pela Stripe. Sem mensalidade, sem renovação."
      },
      {
        "q": "Pix, cartão ou boleto?",
        "a": "Os três, pela Stripe. No pix e no cartão o acesso é imediato; no boleto, assim que o banco confirma."
      },
      {
        "q": "Como recebo depois de pagar?",
        "a": "O email do pedido traz o ebook em versão web e PDF, o link do app e o passo a passo de instalação."
      },
      {
        "q": "O que acontece logo depois de confirmar?",
        "a": "Você abre o email do pedido, lê o ebook na hora e instala o app em um toque. O plano de 8 dias começa no dia em que você lê o primeiro capítulo."
      },
      {
        "q": "Não tenho tempo.",
        "a": "O plano de 8 dias foi feito pra esse caso: uma variável por dia, capítulos de 4 a 6 minutos, testados na coada que você já faz de manhã. Atrasou, o plano espera."
      },
      {
        "q": "E se não funcionar pra mim?",
        "a": "Se você coa café em casa no filtro de papel, as oito variáveis servem. E se não servirem, sete dias de garantia pelo email do pedido."
      },
      {
        "q": "O que exatamente eu recebo?",
        "a": "O ebook em versão web e PDF, o app com marca-texto, notas, plano de 8 dias e leitura sem internet."
      },
      {
        "q": "Já tenho o ebook. Tem condição?",
        "a": "Tem. Quem já tem o ebook recebe a condição própria por email."
      },
      {
        "q": "Funciona no iPhone?",
        "a": "Sim. Abre no Safari, toca em Compartilhar e em Adicionar à Tela de Início. Vira um ícone como qualquer outro app. No Android: Chrome, menu, Instalar app."
      },
      {
        "q": "Funciona no computador?",
        "a": "Sim. O mesmo link abre no navegador do computador. Sem cadastro e sem senha: destaques, notas e plano ficam no aparelho em que você lê. Trocou de aparelho, abre o mesmo link e começa do capítulo onde parou."
      },
      {
        "q": "Preciso de internet?",
        "a": "Só no primeiro acesso. Depois o ebook fica no aparelho: texto, destaques, notas e plano abrem sem sinal."
      }
    ]
  },
  "garantia": "Não serviu, responde o email do pedido em até 7 dias e devolvemos os R$ 97.",
  "garantiaNome": "Garantia de 7 dias"
};

function ctaClick() {
  sendBeacon(APP.slug, "app-lp-cta", { eventType: "converteu" });
}

// c4-20k/103: oferta que chega por link (molde da LP da EE, c4-20k/57 e 93; regra HC 08/09: campanha manda
// pra LP, a LP repassa a query pro checkout). Só as chaves da oferta seguem; quem decide preço e prazo é
// o /app/checkout com a rota. Censo de 16/09: os links sem prazo da campanha do c4-20k/37 (email de 08 a
// 11/09) e do WhatsApp (09 e 10/09) seguem recebendo clique depois da janela, e repassar daria o bônus e a
// metade pra sempre. Seguem só dono e dono27 (a rota confere posse e janela no banco) e bonus com prazo
// legível (fim=<dia>-<HHMM> ou ate=<epoch>, que a rota confere de novo). metade e leitor não têm prazo na
// rota: param aqui, como antes. O resto: CTAs em /app/checkout limpo.
const PRAZO_FIM = /^(seg|ter|qua|qui|sex|sab|dom)-([01]\d|2[0-3])([0-5]\d)$/;
function leOferta(search: string): string {
  const q = new URLSearchParams(search);
  const o = (q.get("oferta") || "").trim();
  const comPrazo = PRAZO_FIM.test((q.get("fim") || "").trim()) || Number((q.get("ate") || "").trim()) > 0;
  if (!(o === "dono" || o === "dono27" || (o === "bonus" && comPrazo))) return "";
  const keep = new URLSearchParams();
  for (const k of ["oferta", "e", "ate", "fim", "src"]) {
    const v = (q.get(k) || "").trim().slice(0, 200);
    if (v) keep.set(k, v);
  }
  return "?" + keep.toString();
}

// Vitrine (chat + prova social) com o checkout da oferta. Componente próprio, como a faixa do D+3: o estado
// dele não re-renderiza a LP (o innerHTML do golden fica). Efeito de filho roda antes do da LP, então os
// CTAs do golden já levam a query quando o JS do golden liga e o beacon de clique pendura.
function Vitrine() {
  const [qs, setQs] = useState("");
  useEffect(() => {
    try {
      const o = leOferta(window.location.search);
      if (!o) return;
      document
        .querySelectorAll<HTMLAnchorElement>('a[href="' + CHECKOUT + '"]')
        .forEach((a) => a.setAttribute("href", CHECKOUT + o));
      setQs(o);
    } catch {
      /* sem query */
    }
  }, []);
  return (
    <LpWidgets
      slug={APP.slug}
      produto="app"
      checkout={CHECKOUT + qs}
      cor="#E0701F"
      corTexto="#FFF7F2"
      cta={CTA_LABEL}
      ficha={fichaDoApp(APP, "Notas do Café", PRECO, CTA_LABEL)}
      depoimentos={DEPOIMENTOS}
    />
  );
}

// c4-20k/58: o D+3 da Escada chega com ?oferta=dono27&e=<email>&ate=<epoch>&src=poscompra-d3.
// A faixa mostra o valor e o prazo; quem decide se ainda vale é a rota do checkout, pela linha do
// banco. Componente próprio: o estado dele não re-renderiza a LP (o innerHTML do golden fica).
function FaixaDono() {
  const [faixa, setFaixa] = useState<{ valor: string; prazo: string; qs: string } | null>(null);
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const o = q.get("oferta");
      if (o !== "dono27" && o !== "dono") return;
      const ate = Number(q.get("ate"));
      const qs = window.location.search;
      if (o === "dono" || (ate > 0 && ate * 1000 <= Date.now())) {
        setFaixa({ valor: "R$ 48,50", prazo: "a metade, porque o ebook já é seu", qs });
      } else if (ate > 0) {
        const fim = new Date(ate * 1000).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
        setFaixa({ valor: "R$ 27", prazo: `o valor do ebook, até ${fim}`, qs });
      } else {
        setFaixa({ valor: "R$ 27", prazo: "o valor do ebook, dentro das 48 horas do seu email", qs });
      }
    } catch {
      /* sem query */
    }
  }, []);
  if (!faixa) return null;
  return (
    <>
      <style>{`.lp-faixa{position:sticky;top:0;z-index:60;background:#E0701F;color:#FFF7F2;font:15px/1.4 system-ui,-apple-system,sans-serif;padding:10px 16px;text-align:center}.lp-faixa b{font-weight:800}.lp-faixa a{color:inherit;text-decoration:underline;margin-left:8px;white-space:nowrap}`}</style>
      <div className="lp-faixa">
        Você já tem o ebook: o app dele sai por <b>{faixa.valor}</b>, {faixa.prazo}.
        <a href={CHECKOUT + faixa.qs} onClick={ctaClick}>Quero o app →</a>
      </div>
    </>
  );
}

export default function AppLp() {
  useEffect(() => {
    try {
      new Function(JS)();
    } catch (e) {
      console.error("[app-lp] golden js:", e);
    }
    // o href pode já levar a query da oferta (Vitrine, c4-20k/103)
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="' + CHECKOUT + '"]'));
    links.forEach((a) => a.addEventListener("click", ctaClick));
    // exit-intent do golden (c4-20k/19): o modal dispara CustomEvents, a ponte grava os beacons
    const exitViu = () => sendBeacon(APP.slug, "app-lp-exit");
    const exitCta = () => sendBeacon(APP.slug, "app-lp-exit-cta", { eventType: "converteu" });
    document.addEventListener("app-lp-exit", exitViu);
    document.addEventListener("app-lp-exit-cta", exitCta);
    return () => {
      links.forEach((a) => a.removeEventListener("click", ctaClick));
      document.removeEventListener("app-lp-exit", exitViu);
      document.removeEventListener("app-lp-exit-cta", exitCta);
    };
  }, []);

  // ViewContent do app (value 97): o PageBeacon só dispara o do ebook nos steps ebook-premium*.
  useEffect(() => {
    let tries = 0;
    const fire = () => {
      try {
        const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
        if (typeof fbq === "function") {
          fbq("track", "ViewContent", { content_name: "App " + APP.nome, value: 97, currency: "BRL" });
          return;
        }
      } catch {
        /* pixel opcional */
      }
      if (tries++ < 20) setTimeout(fire, 250);
    };
    fire();
  }, []);

  return (
    <>
      <PageBeacon slug={APP.slug} step="app-lp" source="app" />
      <FaixaDono />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div dangerouslySetInnerHTML={{ __html: HTML }} />
      {/* flb/20: marca o braço do vídeo (cookie lp_app do middleware) no bloco de recursos antes da pintura */}
      <script dangerouslySetInnerHTML={{ __html: BRACO }} />
      <Vitrine />
    </>
  );
}
