"use client";

import { useEffect } from "react";
import PageBeacon, { sendBeacon } from "../PageBeacon";
import LpWidgets, { fichaDoApp } from "../LpWidgets";
import { CSS, HTML, JS } from "./ouro";

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

export default function AppLp() {
  useEffect(() => {
    try {
      new Function(JS)();
    } catch (e) {
      console.error("[app-lp] golden js:", e);
    }
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href="' + CHECKOUT + '"]'));
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
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div dangerouslySetInnerHTML={{ __html: HTML }} />
      <LpWidgets
        slug={APP.slug}
        produto="app"
        checkout={CHECKOUT}
        cor="#E0701F"
        corTexto="#FFF7F2"
        cta={CTA_LABEL}
        ficha={fichaDoApp(APP, "Notas do Café", PRECO, CTA_LABEL)}
        depoimentos={DEPOIMENTOS}
      />
    </>
  );
}
