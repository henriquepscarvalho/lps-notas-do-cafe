"use client";

import { useEffect, useState } from "react";
import PageBeacon, { sendBeacon } from "../PageBeacon";
import LpWidgets, { fichaDoEbook } from "../LpWidgets";

/* ============================================================
   VARIANTE D · molde selado no golden ALQ/EE (HC 11/08/2026), vencedora do
   EXP-036 (31/08/2026). Gerada pela fábrica _shared/scripts/build_lp_ebook_d.py
   a partir do template templates/lp-ebook-d.page.tsx: NÃO editar à mão,
   regen com --news <dir>. Bloco EBOOK, nav e tokens de cor são da própria news;
   fora deles a página é idêntica na rede.
   ============================================================ */
type Quote = { x: string; who: string; stars: boolean };
const EBOOK = {
  "slug": "notas-do-cafe",
  "capa": "/ebook-web/capa-notas-do-cafe.webp",
  "capaAlt": "Capa do guia Café de Balcão no Coador de Casa",
  "ctaMicro": "Acesso imediato. Prove a diferença na segunda coada.",
  "manchete": "Depois desse guia, o coador da cozinha vira xícara de balcão que você faz sozinho.",
  "subApoio": "O mesmo controle que o barista tem na máquina, traduzido pro papel e a água quente da sua manhã: R$ 27, uma vez só.",
  "prova": {
    "leitores": "2,4 mil",
    "barra": "Do time da news Notas do Café · 2,4 mil leitores todo dia às 8h08",
    "curta": "2,4 mil leitores todo dia às 8h08"
  },
  "blurbs": [{"x": "A quantidade de coisas novas sobre café que aprendi hoje. Muito bom o texto. Venho bebendo cafés \"apagados\" há tempos.", "who": "Marco · resposta por email", "stars": true}, {"x": "Estou aprendendo muito e as informações me tornam cada vez mais seguro para escolher um café de qualidade. Grato a todos.", "who": "voto de leitor(a) na edição diária", "stars": true}] as Quote[],
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
  "sumario": {
    "kicker": "O mapa completo",
    "titulo": "As 19 seções do guia, nomeadas",
    "intro": "Nenhum capítulo escondido atrás de promessa. O índice inteiro, na ordem em que você lê.",
    "colunas": [
      {
        "nome": "Antes de começar",
        "num": false,
        "itens": [
          "O coador que já está na sua cozinha",
          "Como ler a sua xícara em 3 minutos",
          "As quatro famílias da coada",
          "A xícara do Rafael, antes"
        ]
      },
      {
        "nome": "As oito variáveis",
        "num": true,
        "itens": [
          "O grão e a torra",
          "A moagem",
          "A proporção",
          "A água e a temperatura",
          "O pré-molho",
          "A técnica de despejo",
          "O tempo total",
          "A limpeza e o armazenamento"
        ]
      },
      {
        "nome": "O fecho",
        "num": false,
        "itens": [
          "A ficha da coada",
          "O caso, depois",
          "As falas prontas",
          "Quando a xícara não colabora",
          "A manutenção",
          "Glossário",
          "O fecho"
        ]
      }
    ]
  },
  "spreadsTitulo": "Páginas reais, não promessa",
  "paginas": [
    {
      "src": "/ebook-web/lp-pag-1.webp",
      "tipo": "Infográfico",
      "cap": "A premissa: o que separa sua xícara do balcão são oito variáveis, nunca a máquina"
    },
    {
      "src": "/ebook-web/lp-pag-2.webp",
      "tipo": "O mapa",
      "cap": "As quatro famílias que decidem a coada: matéria, superfície, contato e constância"
    },
    {
      "src": "/ebook-web/lp-pag-3.webp",
      "tipo": "O caso",
      "cap": "A xícara do Rafael, antes: a máquina de R$ 2 mil no carrinho e o balcão duas vezes por dia"
    },
    {
      "src": "/ebook-web/lp-pag-4.webp",
      "tipo": "Abertura de variável",
      "cap": "Cada variável abre em cena, com o defeito nomeado"
    },
    {
      "src": "/ebook-web/lp-pag-5.webp",
      "tipo": "Passo a passo",
      "cap": "O movimento em três passos: areia grossa, cronômetro e um clique por coada"
    },
    {
      "src": "/ebook-web/lp-pag-6.webp",
      "tipo": "Calculadora",
      "cap": "A ficha da coada: preenche a economia de cada variável e a soma fecha sozinha"
    },
    {
      "src": "/ebook-web/lp-pag-7.webp",
      "tipo": "Falas prontas",
      "cap": "O que a copa diz do café de casa, e o que você responde"
    },
    {
      "src": "/ebook-web/lp-pag-8.webp",
      "tipo": "O fecho",
      "cap": "O placar do livro: R$ 2.664,60 de volta no primeiro ano, sem equipamento novo na bancada"
    }
  ],
  "amostra": {
    "on": true,
    "kicker": "Leia antes de pagar",
    "titulo": "A primeira variável, aberta na íntegra",
    "intro": "Uma das oito variáveis da coada, exatamente como aparece no miolo. As outras sete vêm com o guia.",
    "cta": "Ler a variável inteira",
    "img": "/ebook-web/lp-pag-1.webp",
    "imgCap": "A premissa: o que separa sua xícara do balcão são oito variáveis, nunca a máquina",
    "blocos": [
      {
        "t": "h3",
        "x": "O grão e a torra decidem antes do coador"
      },
      {
        "t": "p",
        "x": "Nenhuma técnica das outras sete variáveis corrige matéria errada. O grão que você comprou e o ponto de torra dele já definiram o teto da sua xícara, semanas antes de a água encostar no pó."
      },
      {
        "t": "p",
        "x": "Café perde aroma pelo contato com o ar. Em grão inteiro a perda é lenta, porque só a superfície externa fica exposta. Moído, a área exposta multiplica, e o aroma vai embora poucos dias depois de o pacote ser aberto. O pó da semana passada não estragou: emudeceu."
      },
      {
        "t": "p",
        "x": "A torra escura carrega outro defeito, e ele não sai com técnica. Passado o ponto, o açúcar do grão queima e vira amargor seco. A água na temperatura certa apenas extrai o que já existe ali dentro. Torra média é a faixa que mais perdoa erro de execução no coador."
      },
      {
        "t": "h3",
        "x": "Por que a prateleira empurra o moído"
      },
      {
        "t": "p",
        "x": "Não é maldade do mercado, é logística. O pó em pacote selado tem validade longa impressa na embalagem, gira rápido e dispensa moedor na casa de quem compra. A torra escura aguenta mais tempo de gôndola e agrada o paladar acostumado ao café de bar. O supermercado otimiza giro e prazo. A sua xícara não entra na conta."
      },
      {
        "t": "p",
        "x": "A saída é ler o pacote pelos dois campos que decidem a coada, a data de torra e o grau de torra , e comprar em grão inteiro."
      },
      {
        "t": "h3",
        "x": "Onde o defeito se esconde"
      },
      {
        "t": "p",
        "x": "O defeito da variável 01 não nasce no coador. Nasce na gôndola, semanas antes, e o rótulo entrega tudo em dois campos que quase ninguém procura."
      },
      {
        "t": "p",
        "x": "Vire o pacote antes de pôr no carrinho e leia de trás para a frente."
      },
      {
        "t": "li",
        "x": "Procure a data de torra . Validade fala de segurança do alimento; data de torra fala de aroma. Grão com mais de dois meses fora do torrador não responde a técnica nenhuma."
      },
      {
        "t": "li",
        "x": "Confira o grau de torra e mire na torra média : já perdeu a acidez verde, ainda não ganhou gosto de queima."
      },
      {
        "t": "li",
        "x": "Cheque se é grão inteiro ou moído . O moído perde aroma poucos dias depois de aberto, e despejo nenhum devolve o que evaporou."
      },
      {
        "t": "li",
        "x": "Calcule o pacote pelo consumo. A 15 gramas por xícara , 250 gramas rendem perto de 16. Leve o que acaba em até um mês."
      },
      {
        "t": "h3",
        "x": "O movimento"
      },
      {
        "t": "li",
        "x": "Escolha onde comprar pelo rótulo, não pela marca: serve qualquer torrefação ou mercado que imprima a data de torra no pacote."
      },
      {
        "t": "li",
        "x": "Na gôndola, compre grão inteiro de torra média com data de torra impressa no pacote . Os três campos juntos, nunca dois de três."
      },
      {
        "t": "li",
        "x": "Dimensione o pacote pelo consumo: duas xícaras por dia a 15 gramas pedem perto de 250 gramas a cada oito ou nove dias."
      },
      {
        "t": "li",
        "x": "Anote no pacote o dia em que abriu. Passou do mês, o aroma caiu, e a próxima compra vem menor."
      },
      {
        "t": "p",
        "x": "A troca leva uma compra para acontecer e não custa equipamento nenhum na bancada. O que muda é o campo que você lê no rótulo e o tamanho do pacote que você leva para casa. A xícara responde já na primeira coada do pacote novo."
      },
      {
        "t": "p",
        "x": "Rafael comprava café já moído, em pacote de supermercado sem data de torra. Fazia a jarra no fim de semana e descartava quase um terço dela, porque saía com gosto de queimado e ninguém terminava."
      },
      {
        "t": "p",
        "x": "Passou a comprar grão inteiro de torra média, com a data impressa no rótulo e em pacote que acaba dentro do mês. Parou de jogar café fora e trocou 72 cafés de balcão por xícaras de casa no primeiro ano."
      },
      {
        "t": "p",
        "x": "Cada xícara que sai do coador em vez do balcão devolve a diferença entre a faixa de R$ 7,00 a R$ 12,00 e o custo do seu pacote dividido pelas xícaras que ele rende, perto de R$ 2,90 . Some o café que você para de descartar."
      },
      {
        "t": "h3",
        "x": "A resposta pronta"
      },
      {
        "t": "p",
        "x": "Cinco respostas para as objeções que a variável 01 encontra."
      },
      {
        "t": "p",
        "x": "A diferença por xícara é a conta do livro inteiro. A de casa sai do pacote dividido pelas xícaras que rende."
      }
    ]
  },
  "metodo": {
    "kicker": "O método Medir, Ajustar, Provar",
    "titulo": "Cada variável em 3 tempos",
    "passos": [
      {
        "nome": "Onde o defeito se esconde",
        "desc": "O sintoma na xícara e o teste que aponta a variável: o rótulo, o tato entre os dedos ou o cronômetro."
      },
      {
        "nome": "O movimento",
        "desc": "O passo a passo pra corrigir: o que pesar, o que cronometrar e o clique que abre ou fecha a moagem."
      },
      {
        "nome": "A resposta pronta",
        "desc": "Quando a copa duvida do café de casa, a fala exata pra responder. Copiável na versão web."
      }
    ]
  },
  "depoimentos": {
    "on": true,
    "kicker": "Da caixa de entrada da news",
    "titulo": "Quem lê, responde",
    "intro": "Voto real deixado por leitor(a) na edição diária da news. O guia sai da mesma pena."
 ,
    "pull": {"x": "Além de aprender sobre mais uma região que produz café de qualidade, também aprendi detalhes de um método de extração para tirar o melhor desse café. Sensacional!", "who": "voto de leitor(a) na edição diária", "stars": true} as Quote | null
  },
  "kit": [
    {
      "nome": "O guia completo, web + PDF",
      "desc": "Link permanente pra ler no navegador, com a ficha que soma sozinha e botões de copiar, e o PDF pra guardar e imprimir."
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
      "nome": "Falas prontas",
      "desc": "As quatro frases que encerram o assunto na copa, com botão de copiar ao lado de cada uma."
    }
  ],
  "faq": {
    "kicker": "Perguntas diretas",
    "titulo": "O que você quer saber antes de pagar",
    "itens": [
      {
        "q": "Como recebo o guia?",
        "a": "O pagamento confirma e o acesso abre na hora: a versão web pra ler no navegador e o PDF pra guardar. O link também chega no email da compra."
      },
      {
        "q": "Preciso de balança e termômetro?",
        "a": "Ajudam, mas o guia dá o caminho sem: medidas caseiras calibradas, água fora da fervura por tempo e a dose por colher com correção."
      },
      {
        "q": "Funciona com café de mercado?",
        "a": "Melhora qualquer pó: as oito variáveis agem antes da qualidade do grão. Com café melhor, o teto sobe junto."
      },
      {
        "q": "Quanto tempo pra diagnosticar?",
        "a": "Três minutos com a ficha da coada: você marca o que descreve a sua xícara e o guia aponta a variável que corrige primeiro."
      },
      {
        "q": "É assinatura?",
        "a": "Não. Pagamento único de R$ 27, processado pela Stripe. O guia e o kit são seus."
      },
      {
        "q": "E se a minha coada já estiver no ponto?",
        "a": "Vale a garantia: responda o email da compra em até 7 dias e devolvemos os R$ 27."
      }
    ]
  },
  "garantia": "Leu o guia e não encontrou nenhuma variável pra corrigir na sua coada? Responda o email da compra em até 7 dias e devolvemos os R$ 27.",
  "garantiaNome": "Melhorou a coada ou devolve · 7 dias",
  "fecho": "Sem frescura.",
  "fechoAncora": "R$ 27 pra tirar do coador o que a máquina cara promete. Pagamento único, sem assinatura.",
  "custoEspera": "Toda manhã sem o ajuste é a mesma xícara mediana de novo.",
  "despedida": "Bom café. Até sábado.",
  "kicker": "Café de Balcão no Coador de Casa · Guia Notas do Café",
  "titulo": "Café de Balcão no Coador de Casa"
};

const PRECO = "R$ 27";
// riscado R$ 47 removido (critique 01/09): âncora sem base declarada; a página
// vende R$ 27 seco. Voltar só com condição real (preço de tabela + prazo).
// botão nunca carrega preço (HC 11/08): seta pra direita, preço reforça AO REDOR
const CTA_LABEL = "Quero o guia →";
const CHECKOUT = "/ebook-premium/checkout";

function ctaClick() {
  sendBeacon(EBOOK.slug, "ebook-premium-d-cta", { eventType: "converteu" });
}

function Stars() {
  return <span className="stars" aria-label="voto ótima, nota máxima">★★★★★</span>;
}

export default function EbookPremiumD() {
  const [amOpen, setAmOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  // sticky de compra mobile (critique 01/09): o miolo tem ~5 mil px sem botão de
  // compra no fluxo; a barra aparece quando o CTA do herói sai pra cima e morre
  // no desktop pelo CSS
  const [sticky, setSticky] = useState(false);
  useEffect(() => {
    const el = document.querySelector(".hero-cta");
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setSticky(!e.isIntersecting && e.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const jump = new URLSearchParams(location.search).get("jump");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // contrato de verificação da fábrica: ?jump aterrissa pré-rolado com tudo visível
    if (reduce || jump !== null) {
      els.forEach((el) => el.classList.add("visible"));
      if (jump !== null) window.scrollTo(0, +jump || 0);
      (window as unknown as { __ready: boolean }).__ready = true;
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => obs.observe(el));
    (window as unknown as { __ready: boolean }).__ready = true;
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <PageBeacon slug={EBOOK.slug} step="ebook-premium-d" source="ebook-premium" />
      {/* .lpd: toda regra da D vive sob este wrapper, acima do globals.css da casa */}
      <div className="lpd">
      <div className="grain" aria-hidden="true" />

      {/* micro-barra de prova (m1): mono, SEMPRE 1 linha; mobile usa a curta */}
      <div className="provabar">
        <span className="pb-full">{EBOOK.prova.barra}</span>
        <span className="pb-curto">{EBOOK.prova.curta}</span>
      </div>

      <nav>
        <div className="wrap nav-inner">
          <a href="/" className="brand" aria-label="Home">
            <img src="/ebook-web/simbolo.png" alt="" width={32} height={32} />
            <span className="wm"><span className="t">Notas</span><span className="s">{" do Café"}</span></span>
          </a>
          <a href={CHECKOUT} className="btn" onClick={ctaClick}>
            <span className="nav-cta-full">{CTA_LABEL}</span>
            <span className="nav-cta-curto">O guia →</span>
          </a>
        </div>
      </nav>

      {/* Hero D: manchete + sub + CTA na PRIMEIRA DOBRA de qualquer aparelho
          (regra dura HC 11/08), capa com depoimentos laterais na sequência. */}
      <header className="hero">
        <h1 className="reveal manchete">{EBOOK.manchete}</h1>
        <p className="reveal hero-sub">{EBOOK.subApoio}</p>

        {/* tríptico só com 2+ depoimentos selados; sem eles a capa fica sozinha
            (placeholder proibido, regra do ticket 26) */}
        <div className={"reveal triptico" + (EBOOK.blurbs.length >= 2 ? "" : " solo")}>
          {EBOOK.blurbs.length >= 2 && (
            <figure className="blurb b-left">
              {EBOOK.blurbs[0].stars && <Stars />}
              <blockquote>&ldquo;{EBOOK.blurbs[0].x}&rdquo;</blockquote>
              <figcaption>{EBOOK.blurbs[0].who}</figcaption>
            </figure>
          )}

          <div className="palco">
            {/* capa e sticker clicáveis (HC 11/08): clique morto em capa de produto
                manda pro checkout, nunca pra lugar nenhum */}
            <a className="obj" href={CHECKOUT} onClick={ctaClick} aria-label="Quero o guia: abrir o checkout">
              <div className="lombada" aria-hidden="true" />
              <img className="frente" src={EBOOK.capa} alt={EBOOK.capaAlt} loading="eager" />
              {EBOOK.prova.leitores ? (
                <div className="sticker">
                  <b>{EBOOK.prova.leitores}</b>
                  <span>leitores</span>
                  <span>todo dia</span>
                </div>
              ) : null}
            </a>
          </div>

          {EBOOK.blurbs.length >= 2 && (
            <figure className="blurb b-right">
              {EBOOK.blurbs[1].stars && <Stars />}
              <blockquote>&ldquo;{EBOOK.blurbs[1].x}&rdquo;</blockquote>
              <figcaption>{EBOOK.blurbs[1].who}</figcaption>
            </figure>
          )}
        </div>

        {/* CTA depois da capa: botão herói + reforço abaixo (desconto + acesso) */}
        <div className="reveal hero-cta">
          <a href={CHECKOUT} className="btn btn-hero" onClick={ctaClick}>{CTA_LABEL}</a>
          <div className="hero-preco">
            <span className="por">{PRECO}</span>
            <span className="uni">pagamento único · pix ou cartão</span>
          </div>
          <p className="hero-micro">{EBOOK.ctaMicro}</p>
        </div>
      </header>

      <div className="specs-strip">
        {EBOOK.specs.map((s) => (
          <span key={s.l}><b>{s.n}</b> {s.l}</span>
        ))}
      </div>

      {/* Sumário completo (m3): índice inteiro exposto */}
      <section className="sumario">
        <div className="head">
          <p className="reveal kicker">{EBOOK.sumario.kicker}</p>
          <h2 className="reveal">{EBOOK.sumario.titulo}</h2>
          <p className="reveal sec-intro">{EBOOK.sumario.intro}</p>
        </div>
        <div className="sum-grid">
          {EBOOK.sumario.colunas.map((c) => (
            <div key={c.nome} className="reveal sum-col">
              <div className="sum-nome">{c.nome}</div>
              <ul>
                {c.itens.map((it, i) => (
                  <li key={it}>
                    {c.num && <span className="sum-num">{String(i + 1).padStart(2, "0")}</span>}
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Faixa de compra full-bleed: botão herói sem preço, reforços ABAIXO */}
      <section className="faixa">
        <div className="faixa-inner">
          <a href={CHECKOUT} className="btn btn-faixa" onClick={ctaClick}>{CTA_LABEL}</a>
          <div className="faixa-preco">
            <span className="por">{PRECO}</span>
            <span className="uni">pagamento único · pix ou cartão</span>
          </div>
          <p className="faixa-micro">{EBOOK.ctaMicro}</p>
          <div className="faixa-gar">{EBOOK.garantiaNome}</div>
        </div>
      </section>

      {/* Spreads: páginas reais do miolo */}
      <section className="spreads">
        <div className="head">
          <p className="reveal kicker">Por dentro do guia</p>
          <h2 className="reveal">{EBOOK.spreadsTitulo}</h2>
        </div>
        <div className="sp-grid">
          {EBOOK.paginas.map((p) => (
            <figure key={p.src} className="reveal sp">
              <div className="ph"><img src={p.src} alt={`${p.tipo}: ${p.cap}`} loading="lazy" /></div>
              <figcaption>
                <span className="tipo">{p.tipo}</span>
                <div className="cap">{p.cap}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Amostra: um teste real aberto na íntegra */}
      {EBOOK.amostra.on && (
        <section className="amostra">
          <div className="head">
            <p className="reveal kicker">{EBOOK.amostra.kicker}</p>
            <h2 className="reveal">{EBOOK.amostra.titulo}</h2>
            <p className="reveal sec-intro">{EBOOK.amostra.intro}</p>
          </div>
          <div className="reveal">
            <div className={"am-paper" + (amOpen ? " aberta" : "")}>
              {EBOOK.amostra.img && (
                <figure className="am-pag">
                  <img src={EBOOK.amostra.img} alt={EBOOK.amostra.imgCap} loading="lazy" />
                  {EBOOK.amostra.imgCap && <figcaption>{EBOOK.amostra.imgCap}</figcaption>}
                </figure>
              )}
              <div className="am-miolo">
                {EBOOK.amostra.blocos.map((b: { t?: string; x?: string }, i: number) =>
                  b.t === "h3" ? <h3 key={i}>{b.x}</h3>
                  : b.t === "li" ? <p key={i} className="am-li">{b.x}</p>
                  : <p key={i}>{b.x}</p>
                )}
              </div>
              {amOpen ? (
                <>
                  <a href={CHECKOUT} className="btn am-cta" onClick={ctaClick}>{CTA_LABEL}</a>
                  <button
                    className="am-toggle am-fechar"
                    onClick={() => {
                      setAmOpen(false);
                      document.querySelector(".amostra")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    Recolher a amostra ↑
                  </button>
                </>
              ) : (
                <>
                  <div className="am-fade" aria-hidden="true" />
                  <button className="am-toggle" onClick={() => setAmOpen(true)}>
                    {EBOOK.amostra.cta || "Ler a amostra inteira"}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Método em 3 colunas */}
      <section className="metodo">
        <div className="head">
          <p className="reveal kicker">{EBOOK.metodo.kicker}</p>
          <h2 className="reveal">{EBOOK.metodo.titulo}</h2>
        </div>
        <div className="met-grid">
          {EBOOK.metodo.passos.map((p, i) => (
            <div key={p.nome} className="reveal met">
              <div className="num">{i + 1}</div>
              <div className="nome">{p.nome}</div>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Depoimento real da caixa da news: só com o 3º selado (pull-quote) */}
      {EBOOK.depoimentos.on && EBOOK.depoimentos.pull && (
        <section className="depos">
          <div className="head">
            <p className="reveal kicker">{EBOOK.depoimentos.kicker}</p>
            <h2 className="reveal">{EBOOK.depoimentos.titulo}</h2>
            <p className="reveal sec-intro">{EBOOK.depoimentos.intro}</p>
          </div>
          <figure className="reveal dep-pull">
            {EBOOK.depoimentos.pull.stars && <Stars />}
            <blockquote>&ldquo;{EBOOK.depoimentos.pull.x}&rdquo;</blockquote>
            <figcaption>{EBOOK.depoimentos.pull.who}</figcaption>
          </figure>
        </section>
      )}

      {/* A caixa: o que vem com o guia */}
      <section className="caixa">
        <div className="inner">
          {/* coluna esquerda = capa + CTA + preço (pricing completo na seção) */}
          <div className="reveal caixa-left">
            <a className="mini-link" href={CHECKOUT} onClick={ctaClick} aria-label="Quero o guia: abrir o checkout">
              <img className="mini" src={EBOOK.capa} alt="" />
            </a>
            <a href={CHECKOUT} className="btn btn-caixa" onClick={ctaClick}>{CTA_LABEL}</a>
            <div className="hero-preco">
              <span className="por">{PRECO}</span>
              <span className="uni">pagamento único · pix ou cartão</span>
            </div>
          </div>
          <div>
            <p className="reveal kicker caixa-k">O que você leva por {PRECO}</p>
            <div className="kitlist">
              {EBOOK.kit.map((f) => (
                <div key={f.nome} className="reveal kitem">
                  <span className="ck">✓</span>
                  <div>
                    <div className="nome">{f.nome}</div>
                    <p>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ (m4) */}
      <section className="faqsec">
        <div className="head">
          <p className="reveal kicker">{EBOOK.faq.kicker}</p>
          <h2 className="reveal">{EBOOK.faq.titulo}</h2>
        </div>
        <div className="reveal faq-list">
          {EBOOK.faq.itens.map((f, i) => (
            <div key={f.q} className={"faq-item" + (faqOpen === i ? " aberta" : "")}>
              <button className="faq-q" onClick={() => setFaqOpen(faqOpen === i ? null : i)} aria-expanded={faqOpen === i}>
                {f.q}
                <span className="faq-mais" aria-hidden="true">{faqOpen === i ? "×" : "+"}</span>
              </button>
              {faqOpen === i && <p className="faq-a">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Fecho */}
      <section className="fechosec">
        <div className="reveal fecho-inner">
          <h2 className="fecho">{EBOOK.fecho}</h2>
          <p className="valor">{EBOOK.fechoAncora}</p>
          <a href={CHECKOUT} className="btn btn-fecho" onClick={ctaClick}>{CTA_LABEL}</a>
          <p className="espera">{EBOOK.custoEspera}</p>
          <div className="gbox">
            <div className="gtit">{EBOOK.garantiaNome}</div>
            <p>{EBOOK.garantia}</p>
          </div>
        </div>
      </section>

      <footer>
        <p>{EBOOK.despedida}</p>
        <p className="foot-links">
          <a href="/privacidade">Política de Privacidade</a> · <a href="/contato">Contato</a>
        </p>
      </footer>

      {/* sticky de compra mobile: só depois que o CTA do herói some pra cima */}
      <div className={"dsticky" + (sticky ? " show" : "")} aria-hidden={!sticky}>
        <div className="ds-preco">
          <span className="por">{PRECO}</span>
          <span className="uni">pagamento único</span>
        </div>
        <a href={CHECKOUT} className="btn ds-btn" onClick={ctaClick} tabIndex={sticky ? 0 : -1}>{CTA_LABEL}</a>
      </div>

      {/* vitrine (02/09/26): chat de dúvidas no canto direito + prova social no esquerdo;
          molde em templates/LpWidgets.tsx, copiado pela fábrica pra app/LpWidgets.tsx */}
      <LpWidgets
        slug={EBOOK.slug}
        produto="ebook"
        cor="var(--acc)"
        corTexto="var(--btn-text)"
        cta={CTA_LABEL}
        ficha={fichaDoEbook(EBOOK, "Notas do Café", PRECO, CTA_LABEL)}
        depoimentos={[...EBOOK.blurbs, ...(EBOOK.depoimentos.pull ? [EBOOK.depoimentos.pull] : [])]}
      />
      </div>

      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
:root{--bg:#0F0E0D;--bg-deep:#120B06;--text:#CFCBC8;--text-dim:#8E8986;--sage:#94908E;--hair:rgba(207,203,200,.12);--hair-accent:rgba(225,114,35,.30);--bright:#E17223;--serif:"Playfair Display",Georgia,serif;--sans:"Inter",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,monospace}
:root{--dim:var(--text-dim);--acc:var(--bright);--acc-text:var(--bright);--acc-hover:#E48039;--acc-deep:#8C4716;--acc-tint:#FAEADE;--btn-text:#140B04;--acc-rgb:225,114,35;--bg-rgb:15,14,13}
*{margin:0;padding:0;box-sizing:border-box}
/* blindagem contra o globals.css da casa (a LP de cadastro usa .hero, .btn, .kicker, .faq-*):
   toda regra da D vive sob .lpd, e o que colide volta ao neutro ANTES das regras da D
   (censo 31/08 nos 99 apps: .hero em 87, 9 delas com display:flex e min-height) */
.lpd .hero{display:block;min-height:0;max-width:none;width:auto;height:auto;margin:0;border:0;overflow:visible;transition:none;animation:none;transform:none;will-change:auto;z-index:auto;inset:auto;text-shadow:none;pointer-events:auto;font:inherit;color:inherit;align-items:normal;justify-content:normal;flex-direction:row}
.lpd .btn{width:auto;height:auto;transform:none;box-shadow:none;text-transform:none}
.lpd .kicker{display:block;margin:0}
.lpd .brand{width:auto;height:auto}
.lpd .faq-item{padding:0;margin:0;border:0;border-radius:0;background:none;overflow:visible;transform:none;max-height:none}
.lpd .faq-q{margin:0;transition:none;transform:none}
.lpd .faq-a{overflow:visible;transition:none;max-height:none;margin:0}
.lpd .faq-list{border:0;display:block}
.lpd .hero-sub{min-height:0;font-weight:400;animation:none}
.lpd .hero-micro{display:block;margin:0}
.lpd .num{display:block}
.lpd .stars{margin:0}
.lpd nav{display:block;padding:0;left:auto;right:auto}
.lpd footer{transition:none}
html{scroll-behavior:smooth}
/* identidade da rota: o grid e o grain do globals da casa saem (a D tem o próprio
   grain) e o foco de teclado usa o acento da news, não o da LP de cadastro */
body::before,body::after{content:none}
.lpd *:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
body{font-family:var(--sans);background:var(--bg);color:var(--text);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
.lpd a{color:inherit;text-decoration:none}
.lpd .wrap{width:100%;max-width:1140px;margin:0 auto;padding:0 28px}
.lpd .kicker{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.24em;text-transform:uppercase;color:var(--acc-text)}
.lpd .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:var(--sans);font-weight:600;font-size:15px;padding:12px 22px;border-radius:6px;border:0;cursor:pointer;background:var(--acc);color:var(--btn-text);transition:transform .16s ease,background .16s ease;letter-spacing:-.01em;white-space:nowrap}
.lpd .btn:hover{background:var(--acc-hover);transform:translateY(-1px)}
.lpd .stars{color:var(--acc-text);font-size:15px;letter-spacing:.16em;display:block}
.lpd .grain{position:fixed;inset:0;z-index:60;pointer-events:none;opacity:.05;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.6'/%3E%3C/svg%3E")}

.lpd .provabar{font-family:var(--mono);font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:var(--dim);text-align:center;padding:9px 14px;border-bottom:1px solid var(--hair);background:var(--bg-deep);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lpd .pb-curto{display:none}
.lpd nav{position:sticky;top:0;z-index:50;background:rgba(var(--bg-rgb),.82);backdrop-filter:saturate(140%) blur(8px);-webkit-backdrop-filter:saturate(140%) blur(8px);border-bottom:1px solid var(--hair)}
.lpd .nav-inner{display:flex;align-items:center;justify-content:space-between;height:64px}
.lpd .brand{display:flex;align-items:center;gap:11px}
.lpd .brand img{width:32px;height:32px}
.lpd .wm{font-weight:700;font-size:20px;letter-spacing:-.02em;font-family:var(--serif)}
.lpd .wm .t{color:var(--acc-text)}.lpd .wm .s{color:#fff}
.lpd .nav-cta-curto{display:none}
/* wordmark longo encolhe no mobile pra nao quebrar o nav em 2 linhas */
@media(max-width:560px){.lpd .nav-cta-full{display:none}.lpd .nav-cta-curto{display:inline}.lpd .wm{font-size:16px}.lpd .brand img{width:26px;height:26px}}

.lpd .reveal{opacity:0;transform:translateY(26px);transition:opacity 1s cubic-bezier(.16,1,.3,1),transform 1s cubic-bezier(.16,1,.3,1);animation:revealauto .9s cubic-bezier(.16,1,.3,1) 2.2s forwards}
.lpd .reveal.visible{opacity:1;transform:none;animation:none}
/* rede de segurança: se o JS não hidratar, o keyframe revela tudo aos 2.2s */
@keyframes revealauto{to{opacity:1;transform:none}}

.lpd .hero{position:relative;padding:2rem 1.5rem 2.8rem;text-align:center;background:radial-gradient(ellipse 900px 480px at 50% -8%,rgba(var(--acc-rgb),.16),transparent 64%),var(--bg)}
/* CTA na primeira dobra (regra dura): manchete compacta + cluster de compra
   logo sob o sub; capa e depoimentos vêm depois */
.lpd .hero-cta{display:flex;flex-direction:column;align-items:center;gap:9px;margin-top:1.5rem}
.lpd .btn-hero{padding:16px 40px;font-size:17.5px}
.lpd .hero-preco{display:flex;align-items:baseline;gap:10px;color:#fff}
.lpd .hero-preco .por{font-family:var(--serif);font-weight:900;font-size:23px;font-variant-numeric:tabular-nums}
.lpd .hero-preco .uni{font-size:12.5px;color:var(--dim)}
.lpd .hero-micro{font-size:12.5px;color:var(--dim)}
.lpd .triptico{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:34px;max-width:1080px;margin:0 auto}
.lpd .blurb{max-width:250px;text-align:center}
.lpd .b-left{justify-self:end}
.lpd .b-right{justify-self:start}
.lpd .triptico.solo{grid-template-columns:auto;justify-content:center}
.lpd .blurb .stars{margin-bottom:10px}
.lpd .blurb blockquote{font-family:var(--serif);font-style:italic;font-size:16.5px;line-height:1.5;color:#EDE8EA}
.lpd .blurb figcaption{font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);margin-top:10px}
.lpd .palco{position:relative;perspective:1500px}
.lpd .obj{position:relative;display:block;transform-style:preserve-3d;transform:rotateY(-9deg) rotateX(2deg);cursor:pointer;transition:transform .25s ease}
.lpd .obj:hover{transform:rotateY(-6deg) rotateX(1.5deg) translateY(-3px)}
/* capa comprimida: a altura da capa decide se o botão fecha na primeira dobra */
.lpd .obj .frente{width:min(280px,60vw);border-radius:10px;display:block;box-shadow:0 34px 70px rgba(0,0,0,.62),0 0 120px rgba(var(--acc-rgb),.22)}
.lpd .obj .lombada{position:absolute;top:1.4%;bottom:1.4%;left:-11px;width:11px;border-radius:4px 0 0 4px;background:linear-gradient(90deg,var(--bg-deep),var(--acc-deep));transform:rotateY(-74deg);transform-origin:right}
.lpd .sticker{position:absolute;right:-34px;bottom:26px;width:118px;height:118px;border-radius:50%;background:var(--acc);color:var(--btn-text);display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.12;transform:rotate(8deg);box-shadow:0 10px 26px rgba(0,0,0,.5);border:2px solid rgba(255,255,255,.3)}
.lpd .sticker b{font-family:var(--serif);font-weight:900;font-size:25px;letter-spacing:-.02em}
.lpd .sticker span{font-family:var(--mono);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase}
.lpd .manchete{font-family:var(--serif);font-weight:900;font-size:clamp(1.8rem,3.9vw,2.6rem);line-height:1.14;color:#fff;letter-spacing:-.02em;max-width:820px;margin:0 auto .9rem}
.lpd .hero-sub{font-family:var(--serif);font-size:clamp(1rem,1.8vw,1.15rem);color:var(--text);line-height:1.55;max-width:580px;margin:0 auto 1.4rem}

.lpd .faixa{background:var(--acc-deep);border-top:1px solid rgba(0,0,0,.3);border-bottom:1px solid rgba(0,0,0,.3)}
.lpd .faixa-inner{max-width:1080px;margin:0 auto;display:flex;flex-direction:column;align-items:center;gap:10px;padding:2rem 1.5rem;text-align:center}
/* dentro da faixa no acento profundo o botão inverte pro claro pra continuar herói */
.lpd .faixa .btn{background:var(--acc-tint);color:var(--acc-deep)}
.lpd .faixa .btn:hover{background:#FFFFFF}
.lpd .btn-faixa{padding:16px 40px;font-size:17.5px}
.lpd .faixa-preco{display:flex;align-items:baseline;gap:10px;color:var(--acc-tint)}
.lpd .faixa-preco .por{font-family:var(--serif);font-weight:900;font-size:26px;font-variant-numeric:tabular-nums}
.lpd .faixa-preco .uni{font-size:13px}
.lpd .faixa-micro{font-size:12.5px;color:var(--acc-tint)}
.lpd .faixa-gar{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--acc-tint);border:1px solid rgba(255,255,255,.45);border-radius:20px;padding:7px 14px;white-space:nowrap;margin-top:4px;max-width:100%;overflow:hidden;text-overflow:ellipsis}

.lpd .specs-strip{display:flex;justify-content:center;gap:0;padding:1.5rem 1rem;font-family:var(--mono);font-size:13px;color:var(--text);flex-wrap:wrap;background:var(--bg)}
.lpd .specs-strip span{padding:0 22px;border-right:1px solid var(--hair);white-space:nowrap;line-height:2;max-width:100%;overflow:hidden;text-overflow:ellipsis}
.lpd .specs-strip span:last-child{border-right:0}
.lpd .specs-strip b{color:var(--acc-text);font-weight:500}

.lpd section .head{max-width:1040px;margin:0 auto 2.6rem;text-align:left}
.lpd section .head .kicker{display:block;margin-bottom:.9rem}
.lpd h2{font-family:var(--serif);font-weight:700;font-size:clamp(1.7rem,3.4vw,2.4rem);color:#fff;letter-spacing:-.015em}
.lpd .sec-intro{font-size:15px;color:var(--text);margin-top:12px;line-height:1.6;max-width:640px}

.lpd .sumario{padding:4.6rem 1.5rem;background:var(--bg-deep);border-top:1px solid var(--hair)}
.lpd .sum-grid{max-width:1040px;margin:0 auto;display:grid;grid-template-columns:1fr 1.35fr 1fr;gap:38px;align-items:start}
.lpd .sum-col{border-top:2px solid rgba(207,200,202,.45);padding-top:18px}
.lpd .sum-nome{font-family:var(--serif);font-weight:700;font-size:19px;color:#fff;margin-bottom:14px}
.lpd .sum-col ul{list-style:none}
.lpd .sum-col li{font-size:14.5px;color:var(--text);padding:8px 0;border-bottom:1px solid var(--hair);line-height:1.45;display:flex;gap:12px;align-items:baseline}
.lpd .sum-num{font-family:var(--mono);font-size:12px;color:var(--acc-text);font-weight:500}

.lpd .spreads{padding:4.6rem 1.5rem 3rem;background:var(--bg)}
.lpd .sp-grid{max-width:1040px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:56px 44px}
.lpd .sp{margin:0}
.lpd .sp:nth-child(even){transform:translateY(44px)}
.lpd .sp.reveal{transform:translateY(26px)}
.lpd .sp.reveal.visible{transform:none}
.lpd .sp.reveal.visible:nth-child(even){transform:translateY(44px)}
.lpd .sp .ph{border-radius:12px;border:1px solid var(--hair);overflow:hidden;box-shadow:0 22px 55px rgba(0,0,0,.55);transition:transform .3s ease,box-shadow .3s ease}
.lpd .sp .ph img{width:100%;aspect-ratio:900/1200;object-fit:cover;object-position:top;display:block}
.lpd .sp:hover .ph{transform:translateY(-5px);box-shadow:0 30px 66px rgba(0,0,0,.62),0 0 46px rgba(var(--acc-rgb),.32)}
.lpd .sp figcaption{margin-top:16px;max-width:400px}
.lpd .sp .tipo{font-family:var(--mono);font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--acc-text);display:block;margin-bottom:6px}
.lpd .sp .cap{font-family:var(--serif);font-size:17px;color:#E8E2E4;line-height:1.5}

.lpd .amostra{padding:4.6rem 1.5rem;background:var(--bg-deep);border-top:1px solid var(--hair)}
.lpd .amostra .head{max-width:820px}
.lpd .am-paper{position:relative;max-width:820px;margin:0 auto;background:#F7F5ED;color:#20211C;border-radius:14px;padding:2.2rem clamp(1.4rem,4vw,3.2rem) 4.8rem;box-shadow:0 26px 60px rgba(0,0,0,.5);max-height:640px;overflow:hidden}
.lpd .am-paper.aberta{max-height:none;padding-bottom:2.6rem}
.lpd .am-pag{margin:0 0 2rem}
.lpd .am-pag img{width:100%;display:block;border-radius:6px}
.lpd .am-pag figcaption{font-family:var(--sans);font-size:12.5px;color:#5C5E54;padding-top:10px;line-height:1.5}
.lpd .am-cta{margin:2.2rem auto 0;display:flex;width:fit-content;padding:15px 32px;font-size:16px}
.lpd .am-miolo h3{font-family:var(--serif);font-size:21px;color:#14150F;margin:1.6em 0 .5em;line-height:1.3}
.lpd .am-miolo h3:first-child{margin-top:0}
.lpd .am-miolo p{font-size:15.5px;line-height:1.75;color:#33342C;margin:0 0 1em}
.lpd .am-li{padding-left:1.1em;position:relative}
.lpd .am-li::before{content:"•";position:absolute;left:0;color:#14150F}
.lpd .am-fade{position:absolute;left:0;right:0;bottom:0;height:160px;background:linear-gradient(rgba(247,245,237,0),#F7F5ED 76%)}
.lpd .am-toggle{position:absolute;left:50%;transform:translateX(-50%);bottom:1.5rem;z-index:2;font-family:var(--sans);font-weight:600;font-size:14px;padding:10px 22px;border-radius:6px;border:1px solid #20211C;background:#F7F5ED;color:#20211C;cursor:pointer}
.lpd .am-toggle:hover{background:#20211C;color:#F7F5ED}
/* recolher da amostra aberta: mesmo desenho do toggle, mas no fluxo */
.lpd .am-fechar{position:static;transform:none;display:block;margin:14px auto 0}

.lpd .metodo{padding:5rem 1.5rem 4rem;background:var(--bg)}
.lpd .met-grid{max-width:1040px;margin:2.4rem auto 0;display:grid;grid-template-columns:repeat(3,1fr);gap:38px}
.lpd .met .num{font-family:var(--serif);font-style:italic;font-weight:900;font-size:52px;color:var(--acc-text);line-height:1;margin-bottom:14px}
.lpd .met .nome{font-family:var(--serif);font-weight:700;font-size:21px;color:#fff;letter-spacing:-.01em;margin-bottom:8px}
.lpd .met p{font-size:14.5px;color:var(--text);line-height:1.62}
.lpd .depos{padding:4.6rem 1.5rem;background:var(--bg-deep);border-top:1px solid var(--hair)}
.lpd .dep-pull{max-width:760px;margin:0 auto;text-align:center}
.lpd .dep-pull .stars{margin-bottom:16px}
.lpd .dep-pull blockquote{font-family:var(--serif);font-style:italic;font-size:clamp(1.3rem,2.8vw,1.8rem);line-height:1.55;color:#EDE8EA}
.lpd .dep-pull figcaption{font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);margin-top:16px}

.lpd .caixa{padding:4.6rem 1.5rem;background:var(--bg);border-top:1px solid var(--hair)}
.lpd .caixa .inner{max-width:1040px;margin:0 auto;display:grid;grid-template-columns:.85fr 1.15fr;gap:60px;align-items:center}
.lpd .caixa-left{display:flex;flex-direction:column;align-items:center;gap:16px}
.lpd .mini-link{display:block;width:fit-content;margin:0 auto;cursor:pointer}
.lpd .caixa .mini{display:block;width:min(240px,56vw);transform:rotateY(-10deg) rotate(1deg);border-radius:8px;box-shadow:0 26px 60px rgba(0,0,0,.55),0 0 70px rgba(var(--acc-rgb),.18);transition:transform .25s ease}
.lpd .mini-link:hover .mini{transform:rotateY(-7deg) rotate(.5deg) translateY(-3px)}
.lpd .btn-caixa{padding:14px 34px;font-size:16px;margin-top:6px}
.lpd .caixa-k{display:block;margin-bottom:1.6rem}
/* 4 itens uniformes: mesma altura, coluna casa com capa + botão */
.lpd .kitlist{border-top:1px solid var(--hair);display:grid;grid-auto-rows:1fr}
.lpd .kitem{display:grid;grid-template-columns:30px 1fr;gap:16px;padding:18px 0;border-bottom:1px solid var(--hair);align-items:center}
.lpd .kitem .ck{color:var(--acc-text);font-weight:700;font-size:17px}
.lpd .kitem .nome{font-family:var(--serif);font-weight:700;font-size:19px;color:#fff;margin-bottom:4px}
.lpd .kitem p{font-size:14px;color:var(--text);line-height:1.6}

.lpd .faqsec{padding:4.6rem 1.5rem;background:var(--bg-deep);border-top:1px solid var(--hair)}
.lpd .faq-list{max-width:760px;margin:0 auto}
.lpd .faq-item{border-bottom:1px solid var(--hair)}
.lpd .faq-q{width:100%;display:flex;align-items:center;justify-content:space-between;gap:18px;text-align:left;background:none;border:0;cursor:pointer;font-family:var(--serif);font-weight:700;font-size:17.5px;color:#fff;padding:18px 2px}
.lpd .faq-mais{font-family:var(--mono);font-size:18px;color:var(--acc-text)}
.lpd .faq-a{font-size:15px;color:var(--text);line-height:1.7;padding:0 2px 20px;max-width:640px}

.lpd .fechosec{padding:5rem 1.5rem;text-align:center;background:radial-gradient(ellipse 700px 380px at 50% 115%,rgba(var(--acc-rgb),.14),transparent 62%),var(--bg)}
.lpd .fecho-inner{max-width:560px;margin:0 auto}
.lpd .fecho{font-family:var(--serif);font-style:italic;font-weight:900;font-size:clamp(2rem,4.6vw,3rem);color:#fff;letter-spacing:-.015em;margin-bottom:1rem}
.lpd .fechosec .valor{font-size:1.05rem;color:var(--text);line-height:1.7;margin-bottom:2.2rem}
.lpd .btn-fecho{padding:16px 34px;font-size:17px}
.lpd .espera{font-size:14.5px;color:var(--text);margin-top:22px;line-height:1.6;max-width:440px;margin-inline:auto}
.lpd .gbox{margin:26px auto 0;max-width:440px;border:1px solid var(--hair);border-radius:12px;padding:18px 22px;background:var(--bg-deep);text-align:left}
.lpd .gbox .gtit{font-family:var(--serif);font-weight:700;font-size:17px;color:#fff;margin-bottom:6px}
.lpd .gbox p{font-size:13.5px;color:var(--dim);line-height:1.6}

.lpd footer{padding:3rem 1.5rem;text-align:center;border-top:1px solid var(--hair);background:var(--bg-deep)}
.lpd footer p{font-family:var(--serif);font-style:italic;font-size:1rem;color:var(--sage)}
.lpd .foot-links{font-family:var(--sans);font-style:normal;font-size:12px;color:var(--dim);margin-top:10px}
.lpd .foot-links a{text-decoration:underline;text-underline-offset:3px}

/* sticky de compra mobile */
.lpd .dsticky{position:fixed;left:0;right:0;bottom:0;z-index:55;display:none;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px calc(10px + env(safe-area-inset-bottom));background:rgba(var(--bg-rgb),.94);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-top:1px solid var(--hair);transform:translateY(100%);transition:transform .25s ease}
.lpd .dsticky.show{transform:none}
.lpd .ds-preco{display:flex;align-items:baseline;gap:8px;color:var(--text)}
.lpd .ds-preco .por{font-family:var(--serif);font-weight:900;font-size:20px;font-variant-numeric:tabular-nums}
.lpd .ds-preco .uni{font-size:11px;color:var(--dim)}
.lpd .ds-btn{padding:12px 20px;font-size:15px}

@media(max-width:960px){
  .lpd .triptico{grid-template-columns:1fr auto 1fr;gap:22px}
  .lpd .blurb{max-width:190px}
  .lpd .blurb blockquote{font-size:14.5px}
}
@media(max-width:840px){
  .lpd .obj .frente{width:min(300px,44vw)}
  .lpd .blurb{max-width:170px}
  .lpd .sticker{width:100px;height:100px;right:-22px}
  .lpd .sticker b{font-size:21px}
}
@media(max-width:860px){
  .lpd .sp-grid{grid-template-columns:1fr;gap:44px}
  .lpd .sp:nth-child(even), .lpd .sp.reveal.visible:nth-child(even){transform:none}
  .lpd .met-grid{grid-template-columns:1fr;gap:34px}
  .lpd .caixa .inner{grid-template-columns:1fr;gap:40px}
  .lpd .sum-grid{grid-template-columns:1fr;gap:30px}
}
@media(max-width:760px){
  /* mobile: manchete + sub + capa + CTA + reforço, tudo na dobra; blurbs saem
     do hero (depoimento mobile mora na seção Quem lê, responde) */
  .lpd .hero{padding:1.7rem 1.25rem 2.4rem}
  .lpd .triptico{display:flex;flex-direction:column;gap:0;margin-bottom:0}
  .lpd .b-left, .lpd .b-right{display:none}
  .lpd .palco{order:1}
  .lpd .hero-cta{margin-top:1.2rem}
  .lpd .obj{transform:rotateY(-7deg) rotateX(1.5deg)}
  .lpd .obj .frente{width:min(190px,50vw)}
  .lpd .sticker{right:-14px;bottom:10px;width:82px;height:82px}
  .lpd .sticker b{font-size:16px}
  .lpd .sticker span{font-size:8.5px}
  .lpd .manchete{font-size:1.6rem;line-height:1.2}
  .lpd .hero-sub{font-size:14.5px;line-height:1.5;margin-bottom:1rem}
  .lpd .faixa-inner{gap:12px;padding:1.6rem 1.25rem}
  .lpd .provabar{font-size:9.5px;letter-spacing:.09em}
  .lpd .pb-full{display:none}
  .lpd .pb-curto{display:inline}
  .lpd .specs-strip{padding:1.2rem .5rem}
  .lpd .specs-strip span{padding:0 14px}
  .lpd .dsticky{display:flex}
}
@media(max-width:380px){
  /* aparelho estreito (Fold 344): botão encolhe pra fechar em 1 linha */
  .lpd .btn{padding:12px 18px;font-size:14.5px}
  .lpd .btn-hero,.lpd .btn-faixa{padding:14px 24px;font-size:16px}
  .lpd .obj .frente{width:min(190px,52vw)}
  .lpd .sticker{width:84px;height:84px;right:-10px}
  .lpd .sticker b{font-size:16px}
  .lpd .manchete{font-size:1.5rem}
}
@media(prefers-reduced-motion:reduce){
  .lpd .reveal{opacity:1;transform:none;transition:none}
}
      `}</style>
    </>
  );
}
