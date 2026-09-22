"use client";

import { useEffect } from "react";
import PageBeacon, { sendBeacon } from "../PageBeacon";
import ExitIntent from "../ebook-premium/checkout/ExitIntent";
import LpWidgets, { fichaDoEbook } from "../LpWidgets";
import { CSS, HTML, JS } from "./lp";

/* ============================================================
   BRAÇO C DA LP DO GUIA (c4-20k/84, molde tokenizado das finais da EE do EXP-060)
   molde C, a promessa com o teste (a unidade 01 aberta pra fazer agora).
   A = /ebook-premium-d (controle), B = /ebook-premium-b, C = /ebook-premium-c.
   Gerado por _shared/scripts/build_lp_ebook_bc.py: NÃO editar à mão, regen com
   --news <dir> --molde c. Beacon: ebook-premium-c e ebook-premium-c-cta.
   ============================================================ */
const SLUG = "notas-do-cafe";
const STEP = "ebook-premium-c";
const CHECKOUT = "/ebook-premium/checkout";
const PRECO = "R$ 47";
const CTA_LABEL = "Quero o guia →";
// objeto {__html} ESTÁVEL: o React 19 re-seta o innerHTML quando a identidade muda
const CSS_PROP = { __html: CSS };
const HTML_PROP = { __html: HTML };
const EBOOK = {
  "kicker": "Café de Balcão no Coador de Casa · Guia Notas do Café",
  "titulo": "Café de Balcão no Coador de Casa",
  "manchete": "Amanhã cedo, você acha em 3 minutos a variável que amarga o seu café, antes de sair pro balcão.",
  "subApoio": "Pra quem ainda paga o balcão. Cada variável fecha em sim ou não. Abaixo, seis frases antes e depois, e a variável 1 pra fazer com o pacote na mão.",
  "specs": [
    {
      "n": "1",
      "l": "checklist da coada"
    },
    {
      "n": "8",
      "l": "variáveis da coada"
    },
    {
      "n": "3",
      "l": "minutos de diagnóstico"
    },
    {
      "n": "web +",
      "l": "PDF"
    }
  ],
  "kit": [
    {
      "nome": "O guia completo, web e PDF",
      "desc": "Link permanente pra ler no navegador, com a ficha que soma sozinha e botão de copiar nas falas prontas, e o PDF pra guardar e imprimir."
    },
    {
      "nome": "O checklist da coada",
      "desc": "As oito verificações numa página só, imprimível. Risca uma por uma enquanto a água esquenta."
    },
    {
      "nome": "A ficha da coada",
      "desc": "Digita a economia que achou em cada variável e vê o total do mês. A faixa típica já vem ao lado de cada linha."
    },
    {
      "nome": "As falas prontas",
      "desc": "As quatro frases que encerram o assunto na copa quando alguém diz que café bom só sai de máquina. Botão de copiar ao lado de cada uma."
    }
  ],
  "faq": {
    "itens": [
      {
        "q": "Pix, cartão ou boleto?",
        "a": "Os três, uma vez só, R$ 47, pela Stripe. No pix e no cartão o acesso abre na hora; no boleto, quando o banco confirma."
      },
      {
        "q": "Como recebo depois de confirmar?",
        "a": "O acesso abre na hora: a versão web pra ler no navegador e o PDF pra guardar. O link também chega no email do pedido."
      },
      {
        "q": "Quanto tempo leva?",
        "a": "Três minutos lendo a xícara antes de mexer em qualquer variável, e uma coada por variável depois. O guia inteiro se lê numa semana de manhãs, uma variável por capítulo, e a primeira diferença na boca costuma aparecer já na segunda coada."
      },
      {
        "q": "8 variáveis e 3 minutos: as contas batem?",
        "a": "Batem. Os 3 minutos são o diagnóstico da xícara: um pra provar, um pro rótulo, um pro relógio. Ele aponta por qual das 8 variáveis começar, e daí é uma variável por coada, na ordem em que a água encontra o café."
      },
      {
        "q": "Preciso de equipamento novo?",
        "a": "Nenhuma máquina. O guia usa o coador de papel que já está no armário, o relógio do celular e uma balança de cozinha pra pesar a dose. Sem moedor em casa, peça na torrefação pra moer na hora, na textura pra coador."
      },
      {
        "q": "E se não funcionar pra mim?",
        "a": "Funciona pra quem coa com coador de papel e ainda paga o café do balcão: grão de mercado ou de torrefação, chaleira comum, qualquer fogão. Se você leu o guia e não achou nenhuma variável pra corrigir na sua coada, responda o email do pedido em até 7 dias e devolvemos o valor inteiro."
      }
    ]
  },
  "garantia": "Leu o guia e não encontrou nenhuma variável pra corrigir na sua coada? Responda o email do pedido em até 7 dias e devolvemos tudo.",
  "garantiaNome": "Melhorou a coada ou devolve · 7 dias"
};
// tipado: casa com 0 selados gera [] e o TS strict reprova any[] implícito (TS7034, build da Vercel; c420/85)
const DEPOIMENTOS: { x: string; who: string }[] = [
  {
    "x": "Estou aprendendo muito e as informações me tornam cada vez mais seguro para escolher um café de qualidade. Grato a todos.",
    "who": "voto de leitor(a) na edição diária"
  },
  {
    "x": "Além de aprender sobre mais uma região que produz café de qualidade, também aprendi detalhes de um método de extração para tirar o melhor desse café. Sensacional!",
    "who": "voto de leitor(a) na edição diária"
  }
];

export default function EbookPremiumC() {
  useEffect(() => {
    document.documentElement.classList.add("js");
    try {
      new Function(JS)();
    } catch {
      /* o JS do molde é best-effort: a página fica legível sem ele */
    }
    const onCta = () => sendBeacon(SLUG, STEP + "-cta", { eventType: "converteu" });
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="' + CHECKOUT + '"]'));
    links.forEach((a) => a.addEventListener("click", onCta));
    return () => links.forEach((a) => a.removeEventListener("click", onCta));
  }, []);

  return (
    <>
      <PageBeacon slug={SLUG} step={STEP} source="ebook-premium" />

      {/* saída da LP (c4-20k/106): capítulo 1 na versão web, uma vez por sessão, só no gesto de sair */}
      <ExitIntent slug={SLUG} titulo={EBOOK.titulo} origem="lp" />
      <style dangerouslySetInnerHTML={CSS_PROP} />
      <div dangerouslySetInnerHTML={HTML_PROP} />
      <LpWidgets
        slug={SLUG}
        produto="ebook"
        checkout={CHECKOUT}
        cor="#AF5718"
        corTexto="#FDF7F2"
        cta={CTA_LABEL}
        ficha={fichaDoEbook(EBOOK, "Notas do Café", PRECO, CTA_LABEL)}
        depoimentos={DEPOIMENTOS}
      />
    </>
  );
}
