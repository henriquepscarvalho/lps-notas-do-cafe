"use client";

import { useEffect, useState } from "react";
import PageBeacon, { sendBeacon } from "../PageBeacon";

/* ============================================================
   TOKENS DA NEWS (única parte que a fábrica troca por news)
   Fora deste bloco, a página é idêntica nas 30.
   Layout = V2 Objeto-produto (vencedora do burst 18/07, ticket 07.1).
   ============================================================ */
const EBOOK = {
  "slug": "notas-do-cafe",
  "kicker": "Café de Balcão no Coador de Casa · Guia Notas do Café",
  "titulo": "Café de Balcão no Coador de Casa",
  "sub": "As oito variáveis que fazem o coador de papel da sua cozinha repetir a xícara do balcão, sem a máquina de R$ 2 mil.",
  "ctaMicro": "Acesso imediato. Prove a diferença na segunda coada.",
  "capa": "/ebook-web/capa-notas-do-cafe.webp",
  "capaAlt": "Capa do guia Café de Balcão no Coador de Casa",
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
  "spreadsTitulo": "Páginas reais, ",
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
  "spine": {
    "kicker": "O caso que atravessa o guia",
    "texto": "Você coa junto com o Rafael: duas xícaras por dia, quase todas de balcão, e uma máquina de R$ 2 mil parada no carrinho de compras. Cada variável mostra onde a xícara dele saía errada antes de você procurar na sua, e no fim a ficha soma o que o balcão custava: R$ 2.664,60 no primeiro ano."
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
  "garantia": "Leu o guia e não encontrou nenhuma variável pra corrigir na sua coada? Responda o email da compra em até 7 dias e devolvemos os R$ 27.",
  "fecho": "Sem frescura.",
  "despedida": "Bom café. Até sábado.",
  "manchete": "O coador de papel da sua cozinha repete a xícara do balcão, sem a máquina de R$ 2 mil.",
  "subApoio": "As oito variáveis da coada, uma por uma, com o ajuste que muda a xícara já na próxima manhã.",
  "retorno": "Custa menos que um pacote de grão especial.",
  "autoridade": "Do time da news Notas do Café, no seu email todo dia às 8h08.",
  "fechoAncora": "R$ 27 pra tirar do coador o que a máquina cara promete. Pagamento único, sem assinatura.",
  "custoEspera": "Toda manhã sem o ajuste é a mesma xícara mediana de novo.",
  "garantiaNome": "Melhorou a coada ou devolve · 7 dias",
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
  "faq": [
    {
      "q": "Como recebo depois de pagar?",
      "a": "O pagamento confirma e o acesso abre na hora: a versão web pra ler no navegador e o PDF pra guardar. O link também chega no email da compra."
    },
    {
      "q": "Preciso de algum conhecimento antes?",
      "a": "Não. Cada passo mostra o que fazer, na ordem, sem pré-requisito."
    },
    {
      "q": "Quanto tempo leva?",
      "a": "3 minutos de diagnóstico, seguindo o passo a passo."
    },
    {
      "q": "É pagamento único ou assinatura?",
      "a": "Pagamento único de R$ 27, processado pela Stripe. Sem assinatura, sem mensalidade. O acesso é seu."
    },
    {
      "q": "E se não for pra mim?",
      "a": "Leu o guia e não encontrou nenhuma variável pra corrigir na sua coada? Responda o email da compra em até 7 dias e devolvemos os R$ 27."
    }
  ],
  "spreadsTituloEm": "não promessa",
  "spreadsSub": ""
};

const PRECO = "R$ 27";
const PRECO_DE = "R$ 47"; // âncora riscada; vazio = sem desconto, render V2 intacto
// CTAs com copy própria por seção + seta de avanço (HC 24/07); nav e hero sem preço
const CTA_AMOSTRA = "Abrir as outras 7 variáveis →";
const CTA_CAIXA = "Levar o kit completo →";
const CTA_FECHO = "Começar pela primeira variável →";
const CHECKOUT = "/ebook-premium/checkout";

function ctaClick() {
  sendBeacon(EBOOK.slug, "ebook-premium-cta", { eventType: "converteu" });
}

export default function EbookPremium() {
  const [amOpen, setAmOpen] = useState(false);
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
      <PageBeacon slug={EBOOK.slug} step="ebook-premium" source="ebook-premium" />
      <div className="grain" aria-hidden="true" />

      <nav>
        <div className="wrap nav-inner">
          <a href="/" className="brand" aria-label="Home">
            <img src="/ebook-web/simbolo.png" alt="" width={32} height={32} />
            <span className="wm"><span className="t">Notas</span><span className="s">{" do Café"}</span></span>
          </a>
          <a href={CHECKOUT} className="btn" onClick={ctaClick}>
            Quero o guia
          </a>
        </div>
      </nav>

      {/* Vitrine: o ebook como objeto central (V2, burst 18/07) */}
      <section className="vitrine">
        <div className="spot" aria-hidden="true" />
        <p className="reveal kicker">{EBOOK.kicker}</p>
        <h1 className={"reveal vt-title" + (EBOOK.manchete ? " vt-frase" : "")}><span className="peso">{EBOOK.manchete || EBOOK.titulo}</span></h1>
        <p className="reveal vt-sub">{EBOOK.subApoio || EBOOK.sub}</p>
        {/* ordem DOM = ordem de conversão (preço/CTA antes da capa em toda largura
            estreita; CTA na primeira dobra, decisão HC 20/07). No desktop ≥900px
            o grid manda a capa pra coluna direita (modelo dos ebooks de cadastro,
            HC 24/07). */}
        {/* V5 do burst 24/07: CTA primeiro, preço numa linha só abaixo do botão */}
        <div className="reveal vt-o-cta">
          {/* primeiro CTA da página leva a seta de avanço (HC 24/07) */}
          <a href={CHECKOUT} className="btn" style={{ padding: "15px 32px", fontSize: 17 }} onClick={ctaClick}>Quero o guia →</a>
          <p className="vt-preco-micro">{PRECO_DE && <><s>{PRECO_DE}</s> </>}<b>{PRECO}</b> · acesso imediato, corte no mesmo dia</p>
        </div>
        <div className="reveal palco vt-o-palco">
          <div className="obj">
            <div className="lombada" aria-hidden="true" />
            <img className="frente" src={EBOOK.capa} alt={EBOOK.capaAlt} loading="eager" />
            <div className="reflexo" aria-hidden="true"><img src={EBOOK.capa} alt="" /></div>
          </div>
        </div>
        <div className="reveal specs">
          {EBOOK.specs.map((s) => (
            <span key={s.l}><b>{s.n}</b> {s.l}</span>
          ))}
        </div>
      </section>

      {/* Spreads: páginas reais do miolo em página dupla */}
      <section className="spreads">
        <div className="head">
          <p className="reveal kicker" style={{ display: "block", marginBottom: ".9rem" }}>Por dentro do guia</p>
          <h2 className="reveal">{EBOOK.spreadsTitulo}<em>{EBOOK.spreadsTituloEm}</em></h2>
          {EBOOK.spreadsSub && <p className="reveal sp-sub">{EBOOK.spreadsSub}</p>}
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

      {/* Amostra: uma unidade real do miolo, aberta na íntegra (reciprocidade, ticket 17) */}
      {EBOOK.amostra.on && (
        <section className="amostra">
          <div className="head">
            <p className="reveal kicker" style={{ display: "block", marginBottom: ".9rem" }}>{EBOOK.amostra.kicker}</p>
            <h2 className="reveal">{EBOOK.amostra.titulo}</h2>
            <p className="reveal am-intro">{EBOOK.amostra.intro}</p>
          </div>
          {/* reveal fica no WRAPPER: o className do papel muda com o state, e o React
              reescrevendo o atributo apagava a classe `visible` posta pelo observer
              (que ja tinha dado unobserve), deixando o card em opacity 0 ao expandir. */}
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
            {/* aberta, a amostra termina em compra, nao em "fechar" (decisao HC 20/07) */}
            {amOpen ? (
              <a href={CHECKOUT} className="btn am-cta" onClick={ctaClick}>{CTA_AMOSTRA}</a>
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

      {/* Método editorial em 3 colunas + pull quote do spine */}
      <section className="metodo-v2">
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <p className="reveal kicker" style={{ display: "block", marginBottom: ".9rem" }}>{EBOOK.metodo.kicker}</p>
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
        <div className="reveal pull">
          <span className="kicker">{EBOOK.spine.kicker}</span>
          <blockquote>{EBOOK.spine.texto}</blockquote>
        </div>
      </section>

      {/* A caixa: o que vem com o guia */}
      <section className="caixa">
        <div className="inner">
          <img className="reveal mini" src={EBOOK.capa} alt="" aria-hidden="true" />
          <div>
            <p className="reveal kicker" style={{ display: "block", marginBottom: "1.6rem" }}>O que você leva por {PRECO}</p>
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
            {/* CTA na própria caixa + reforço do preço (HC 24/07) */}
            <div className="reveal caixa-cta">
              <a href={CHECKOUT} className="btn" onClick={ctaClick}>{CTA_CAIXA}</a>
              <p className="caixa-preco">{PRECO_DE && <>De <s>{PRECO_DE}</s> por </>}<b>{PRECO}</b> · acesso imediato</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ: objeções de compra, antes do CTA final */}
      <section className="faq">
        <h2 className="reveal">Perguntas frequentes</h2>
        <div className="faq-list">
          {EBOOK.faq.map((f) => (
            <details key={f.q} className="reveal fq">
              <summary>{f.q}<span className="chev" aria-hidden="true" /></summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Fecho: preço + garantia + CTA final */}
      <section className="fechosec">
        <div className="reveal" style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 className="fecho">{EBOOK.fecho}</h2>
          {EBOOK.fechoAncora && <p className="valor">{EBOOK.fechoAncora}</p>}
          <a href={CHECKOUT} className="btn" style={{ padding: "16px 34px", fontSize: 17 }} onClick={ctaClick}>{CTA_FECHO}</a>
          <p className="vt-preco-micro">{PRECO_DE && <><s>{PRECO_DE}</s> </>}<b>{PRECO}</b> · acesso imediato</p>
          {EBOOK.garantiaNome ? (
            <div className="gbox">
              <div className="gtit">{EBOOK.garantiaNome}</div>
              <p>{EBOOK.garantia}</p>
            </div>
          ) : (
            <p className="garantia">{EBOOK.garantia}</p>
          )}
        </div>
      </section>

      <footer style={{ padding: "3rem 1.5rem", textAlign: "center", borderTop: "1px solid var(--hair)", background: "var(--bg-deep)" }}>
        <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "1rem", color: "var(--sage)" }}>{EBOOK.despedida}</p>
      </footer>

      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
:root{--bg:#0F0E0D;--bg-deep:#120B06;--text:#CFCBC8;--text-dim:#8E8986;--sage:#94908E;--hair:rgba(207,203,200,.12);--hair-accent:rgba(225,114,35,.30);--bright:#E17223;--serif:"Playfair Display",Georgia,serif;--sans:"Inter",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,monospace}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--sans);background:var(--bg);color:var(--text);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
nav{position:sticky;top:0;z-index:50;background:rgba(15,14,13,.82);backdrop-filter:saturate(140%) blur(8px);-webkit-backdrop-filter:saturate(140%) blur(8px);border-bottom:1px solid var(--hair)}
a{color:inherit;text-decoration:none}
.wrap{width:100%;max-width:1140px;margin:0 auto;padding:0 28px}
.nav-inner{display:flex;align-items:center;justify-content:space-between;height:66px}
.brand{display:flex;align-items:center;gap:11px}
.brand img{width:32px;height:32px}
.wm{font-weight:700;font-size:20px;letter-spacing:-.02em}
.wm .t{color:var(--bright)}.wm .s{color:#fff}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:var(--sans);font-weight:600;font-size:15px;padding:12px 22px;border-radius:6px;border:0;cursor:pointer;background:var(--bright);color:#140B04;transition:transform .16s ease,background .16s ease;letter-spacing:-.01em;white-space:nowrap}
.btn:hover{background:#E5833D;transform:translateY(-1px)}
.kicker{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.24em;text-transform:uppercase;color:var(--bright)}

        .reveal{opacity:0;transform:translateY(26px);transition:opacity 1s cubic-bezier(.16,1,.3,1),transform 1s cubic-bezier(.16,1,.3,1)}
        .reveal.visible{opacity:1;transform:none}
        .grain{position:fixed;inset:0;z-index:60;pointer-events:none;opacity:.05;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.6'/%3E%3C/svg%3E")}

        .vitrine{position:relative;padding:5.5rem 1.5rem 6rem;text-align:center;overflow:hidden;background:radial-gradient(ellipse 900px 480px at 50% -8%,rgba(225,114,35,.14),transparent 64%),var(--bg)}
        .spot{position:absolute;left:50%;top:0;transform:translateX(-50%);width:760px;height:900px;background:radial-gradient(ellipse 300px 640px at 50% 30%,rgba(225,114,35,.13),transparent 70%);pointer-events:none}
        .vitrine .kicker{display:block;margin-bottom:1.6rem}
        .vt-title{font-family:var(--serif);font-style:italic;font-weight:900;font-size:clamp(3rem,8.4vw,6.4rem);line-height:.98;color:#fff;letter-spacing:-.025em;margin-bottom:1.1rem}
        .vt-title .peso{display:inline-block;animation:pesoIn 1.4s cubic-bezier(.16,1,.3,1) both}
        @keyframes pesoIn{from{opacity:0;letter-spacing:.04em;transform:translateY(10px)}to{opacity:1;letter-spacing:-.025em;transform:none}}
        .vt-sub{font-family:var(--serif);font-size:clamp(1.05rem,2vw,1.3rem);color:var(--text);line-height:1.65;max-width:560px;margin:0 auto 3.2rem}
        .palco{position:relative;display:flex;justify-content:center;perspective:1500px;margin:2.6rem 0 1rem}
        .obj{position:relative;transform-style:preserve-3d;animation:orbita 11s ease-in-out infinite;will-change:transform}
        @keyframes orbita{0%,100%{transform:rotateY(-14deg) rotateX(3deg)}50%{transform:rotateY(14deg) rotateX(1.5deg)}}
        .obj .frente{width:min(380px,72vw);border-radius:10px;box-shadow:0 42px 90px rgba(0,0,0,.62),0 0 120px rgba(225,114,35,.20)}
        .obj .lombada{position:absolute;top:1.4%;bottom:1.4%;left:-11px;width:11px;border-radius:4px 0 0 4px;background:linear-gradient(90deg,#100904,#342012);transform:rotateY(-74deg);transform-origin:right}
        .reflexo{position:absolute;top:calc(100% + 14px);left:0;right:0;height:130px;overflow:hidden;pointer-events:none;opacity:.16}
        .reflexo img{width:100%;transform:scaleY(-1);border-radius:10px;-webkit-mask-image:linear-gradient(rgba(0,0,0,.85),transparent 78%);mask-image:linear-gradient(rgba(0,0,0,.85),transparent 78%)}
        .vt-preco-micro{font-size:14px;color:var(--text-dim);margin-top:14px;font-variant-numeric:tabular-nums;text-wrap:balance}
        .vt-preco-micro s{opacity:.8;text-decoration-thickness:1.5px}
        .vt-preco-micro b{color:#fff;font-weight:600}
        .vt-frase{font-style:normal;font-size:clamp(1.85rem,4.8vw,3.3rem);line-height:1.16;max-width:820px;margin-inline:auto}
        .specs{display:flex;justify-content:center;gap:0;margin-top:3.2rem;font-family:var(--mono);font-size:13px;color:var(--text);flex-wrap:wrap}
        /* desktop: modelo dos ebooks de cadastro, texto à esquerda e capa à direita */
        @media(min-width:900px){
          .vitrine{display:grid;grid-template-columns:1.08fr .92fr;grid-template-areas:"kicker palco" "title palco" "sub palco" "cta palco" "specs specs";column-gap:56px;text-align:left;padding:4.5rem max(1.5rem,calc((100vw - 1120px)/2)) 5.5rem}
          .vitrine>.kicker{grid-area:kicker;margin-bottom:1.2rem}
          .vt-title{grid-area:title}
          .vt-frase{font-size:clamp(1.9rem,3.3vw,2.85rem);max-width:none;margin-inline:0}
          .vt-sub{grid-area:sub;margin:0 0 1.9rem;max-width:520px}
          .vt-o-cta{grid-area:cta;justify-self:start}
          .vt-o-palco{grid-area:palco;align-self:center;margin:0}
          .specs{grid-area:specs;margin-top:4.2rem}
        }
        .specs span{padding:0 22px;border-right:1px solid var(--hair);white-space:nowrap;line-height:2}
        .specs span:last-child{border-right:0}
        .specs b{color:var(--bright);font-weight:500}

        .spreads{padding:5.5rem 1.5rem 4.5rem;background:var(--bg-deep);border-top:1px solid var(--hair)}
        .spreads .head{max-width:1040px;margin:0 auto 3rem;text-align:center}
        .spreads h2,.metodo-v2 h2,.amostra h2{font-family:var(--serif);font-weight:700;font-size:clamp(1.7rem,3.4vw,2.5rem);color:#fff;letter-spacing:-.015em}
        .spreads h2 em{font-style:normal;color:var(--bright)}
        .sp-sub{font-size:15px;color:var(--text);margin-top:12px}
        .sp-grid{max-width:1040px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:26px}
        .sp{margin:0}
        .sp .ph{border-radius:12px;border:1px solid var(--hair);overflow:hidden;box-shadow:0 22px 55px rgba(0,0,0,.55);transition:transform .3s ease,box-shadow .3s ease}
        .sp .ph img{width:100%;aspect-ratio:900/1200;object-fit:cover;object-position:top}
        .sp:hover .ph{transform:translateY(-5px);box-shadow:0 30px 66px rgba(0,0,0,.62),0 0 46px var(--hair-accent)}
        .sp figcaption{margin-top:16px}
        .sp .tipo{font-family:var(--mono);font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--bright);display:block;margin-bottom:6px}
        .sp .cap{font-family:var(--serif);font-size:17px;color:#E8EDE9;line-height:1.5}

        .amostra{padding:5rem 1.5rem;background:var(--bg);border-top:1px solid var(--hair)}
        .amostra .head{max-width:820px;margin:0 auto 2.4rem;text-align:center}
        .am-intro{font-size:15px;color:var(--text);margin-top:12px;line-height:1.6}
        .am-paper{position:relative;max-width:820px;margin:0 auto;background:#F7F5ED;color:#20211C;border-radius:14px;padding:2.2rem clamp(1.4rem,4vw,3.2rem) 4.8rem;box-shadow:0 26px 60px rgba(0,0,0,.5);max-height:640px;overflow:hidden}
        .am-paper.aberta{max-height:none;padding-bottom:2.6rem}
        .am-pag{margin:0 0 2rem}
        .am-pag img{width:100%;display:block;border-radius:6px}
        .am-pag figcaption{font-family:var(--sans);font-size:12.5px;color:#5C5E54;padding-top:10px;line-height:1.5}
        .am-cta{margin:2.2rem auto 0;display:flex;width:fit-content;padding:15px 32px;font-size:16px}
        .am-miolo h3{font-family:var(--serif);font-size:21px;color:#14150F;margin:1.6em 0 .5em;line-height:1.3}
        .am-miolo h3:first-child{margin-top:0}
        .am-miolo p{font-size:15.5px;line-height:1.75;color:#33342C;margin:0 0 1em}
        .am-miolo{counter-reset:passo}
        .am-li{padding-left:2.1em;position:relative;counter-increment:passo}
        .am-li::before{content:counter(passo);position:absolute;left:0;top:2px;width:1.4em;height:1.4em;border-radius:50%;background:var(--on-light);color:#fff;font-family:var(--sans);font-size:11.5px;font-weight:700;display:flex;align-items:center;justify-content:center}
        .am-fade{position:absolute;left:0;right:0;bottom:0;height:160px;background:linear-gradient(rgba(247,245,237,0),#F7F5ED 76%)}
        .am-toggle{position:absolute;left:50%;transform:translateX(-50%);bottom:1.5rem;z-index:2;font-family:var(--sans);font-weight:600;font-size:14px;padding:10px 22px;border-radius:6px;border:1px solid #20211C;background:#F7F5ED;color:#20211C;cursor:pointer}
        .am-toggle:hover{background:#20211C;color:#F7F5ED}
        .metodo-v2{padding:6.5rem 1.5rem 5rem;background:var(--bg)}
        .met-grid{max-width:1040px;margin:2.6rem auto 0;display:grid;grid-template-columns:repeat(3,1fr);gap:38px}
        .met .num{font-family:var(--serif);font-style:italic;font-weight:900;font-size:52px;color:var(--bright);line-height:1;margin-bottom:14px}
        .met .nome{font-family:var(--serif);font-weight:700;font-size:21px;color:#fff;letter-spacing:-.01em;margin-bottom:8px}
        .met p{font-size:14.5px;color:var(--text);line-height:1.62}
        .pull{max-width:820px;margin:5rem auto 0;text-align:center}
        .pull blockquote{font-family:var(--serif);font-style:italic;font-size:clamp(1.25rem,2.6vw,1.7rem);color:var(--sage);line-height:1.6}
        .pull .kicker{display:block;margin-bottom:16px}

        .caixa{padding:5.5rem 1.5rem;background:var(--bg-deep);border-top:1px solid var(--hair)}
        .caixa .inner{max-width:1040px;margin:0 auto;display:grid;grid-template-columns:.85fr 1.15fr;gap:60px;align-items:center}
        .caixa .mini{width:min(260px,60vw);margin:0 auto;transform:rotateY(-10deg) rotate(1deg);border-radius:8px;box-shadow:0 26px 60px rgba(0,0,0,.55),0 0 70px rgba(225,114,35,.16)}
        .kitlist{border-top:1px solid var(--hair)}
        .kitem{display:grid;grid-template-columns:30px 1fr;gap:16px;padding:20px 0;border-bottom:1px solid var(--hair);align-items:baseline}
        .kitem .ck{color:var(--bright);font-weight:700;font-size:17px}
        .kitem .nome{font-family:var(--serif);font-weight:700;font-size:19px;color:#fff;margin-bottom:4px}
        .kitem p{font-size:14px;color:var(--text);line-height:1.6}
        .caixa-cta{margin-top:28px}
        .caixa-cta .btn{padding:14px 30px;font-size:16px}
        .caixa-preco{font-size:13.5px;color:var(--text-dim);margin-top:12px}
        .caixa-preco s{font-variant-numeric:tabular-nums}
        .caixa-preco b{color:#fff;font-weight:600;font-variant-numeric:tabular-nums}

        .faq{padding:5.5rem 1.5rem;background:var(--bg);border-top:1px solid var(--hair)}
        .faq h2{font-family:var(--serif);font-weight:700;font-size:clamp(1.7rem,3.4vw,2.5rem);color:#fff;letter-spacing:-.015em;text-align:center;margin-bottom:2.6rem}
        .faq-list{max-width:820px;margin:0 auto;display:grid;gap:14px}
        .fq{border:1px solid var(--hair);border-radius:14px;background:var(--bg-deep)}
        .fq summary{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 24px;cursor:pointer;font-weight:600;font-size:16px;color:#fff;list-style:none}
        .fq summary::-webkit-details-marker{display:none}
        .fq .chev{flex:none;width:30px;height:30px;border:1px solid var(--hair);border-radius:50%;position:relative;transition:transform .25s ease}
        .fq .chev::before{content:"";position:absolute;left:50%;top:50%;width:8px;height:8px;border-right:1.5px solid var(--text);border-bottom:1.5px solid var(--text);transform:translate(-50%,-68%) rotate(45deg)}
        .fq[open] .chev{transform:rotate(180deg)}
        .fq p{padding:0 24px 20px;font-size:14.5px;color:var(--text);line-height:1.65;max-width:640px}
        .fechosec{padding:6rem 1.5rem;text-align:center;position:relative;overflow:hidden;background:radial-gradient(ellipse 700px 380px at 50% 115%,rgba(225,114,35,.12),transparent 62%),var(--bg)}
        .fecho{font-family:var(--serif);font-style:italic;font-weight:900;font-size:clamp(2rem,4.6vw,3rem);color:#fff;letter-spacing:-.015em;margin-bottom:1rem}
        .fechosec .valor{font-size:1.05rem;color:var(--text);line-height:1.7;margin-bottom:2.2rem}
        .fechosec .valor b{color:#fff;font-weight:600}
        .garantia{font-size:13.5px;color:var(--text-dim);margin-top:18px;line-height:1.6;max-width:440px;margin-inline:auto}
        .gbox{margin:26px auto 0;max-width:440px;border:1px solid var(--hair);border-radius:12px;padding:18px 22px;background:var(--bg-deep)}
        .gbox .gtit{font-family:var(--serif);font-weight:700;font-size:17px;color:#fff;margin-bottom:6px}
        .gbox p{font-size:13.5px;color:var(--text-dim);line-height:1.6}

        @media(max-width:860px){
          .sp-grid{grid-template-columns:1fr;gap:36px;max-width:380px}
          .met-grid{grid-template-columns:1fr;gap:34px}
          .caixa .inner{grid-template-columns:1fr;gap:40px}
        }
        /* mobile: CTA na primeira dobra (HC 20/07); a ordem já vem do DOM,
           aqui só comprime tipografia e respiros. */
        @media(max-width:560px){
          .vitrine{padding:2.2rem 1.25rem 3.4rem}
          .vitrine .kicker{margin-bottom:1rem}
          .vt-sub{margin-bottom:1.2rem}
          .vt-o-palco{margin:2.4rem 0 .6rem}
          .specs{margin-top:2rem}
          .vt-title{font-size:2.35rem}
          .vt-frase{font-size:1.6rem;line-height:1.22}
          .vt-sub{font-size:15px;line-height:1.55}
          .vt-preco-micro{margin-top:12px;font-size:13px}
          .obj .frente{width:min(300px,64vw)}
        }
        @media(prefers-reduced-motion:reduce){
          .reveal{opacity:1;transform:none;transition:none}
          .obj{animation:none;transform:rotateY(-10deg) rotateX(2deg)}
          .vt-title .peso{animation:none}
        }
      `}</style>
    </>
  );
}
