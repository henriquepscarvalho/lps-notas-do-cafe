"use client";

import { useEffect, useRef, useState } from "react";
import PageBeacon, { sendBeacon } from "../PageBeacon";
import PROVA from "../../checkout-prova.json";
import MANIFEST from "../../proof-manifest.json";
// col/18: a ALQ tem proof-manifest só com avatares; o número de leitores é opcional no tipo (sem ele a linha some)
const NUM_EXIBIDO = (MANIFEST as { num_exibido?: string | null }).num_exibido;

/* ============================================================
   LP /colecao · página de vendas permanente da Coleção completa (colecao-rede, col/16, 28/09/26;
   a fábrica troca os tokens por casa). Molde do PAGINA-DE-VENDAS-CASA.md: hero (produto + ganho, capa,
   botão dentro da dobra do celular) → mecanismo do problema (a Caixa que Engole) → mecanismo da solução
   (o Volume em Ordem) → antes e depois (CTA no fim) → o que você leva (ficha, preço UMA vez) → o que vem
   no volume (lista + páginas reais) → três edições de exemplo (escolhidas pelo dado: colecao_exemplos.py)
   → leitores → perguntas → final (sem preço) → rodapé.
   Todo botão leva ao /colecao/checkout com src=lp-colecao; a origem da jornada (?src= do email) viaja
   no sessionStorage do PageBeacon e vira metadata.src da session na Stripe.
   Estado fechado da oferta (lista de espera, sexta 23:59) é o col/14, fora deste molde.
   ============================================================ */
// col/18: nome com artigo («A Origem das Palavras») contrai com a preposição: «da Origem», nunca «da A Origem»
const NOME = "Notas do Café";
const ART = /^(A|O|As|Os) /.exec(NOME);
const SEM_ART = ART ? NOME.slice(ART[0].length) : NOME;
const DA_NEWS = ART ? ({ A: "da", O: "do", As: "das", Os: "dos" } as Record<string, string>)[ART[1]] + " " + SEM_ART : "da " + NOME;
const A_NEWS = ART ? ART[1].toLowerCase() + " " + SEM_ART : "a " + NOME;

const COL = {
  slug: "notas-do-cafe",
  news: "Notas do Café",
  n: 115,
  desde: "abril de 2026",
  paginas: 739,
  meses: 6,
  capa: "https://ecmveymyzdqiehvtqxms.supabase.co/storage/v1/object/public/assets/scriptorium/colecao/notas-do-cafe-capa.png",
  capaAlt: `Capa da Coleção completa ${DA_NEWS}`,
  despedida: "Sem frescura. Bom café. Notas do Café",
};
/* LEGIVEL (col/32): passe de legibilidade */
/* LEGIVEL-CEL (col/44): botão na 1ª tela do celular, hero legível */
/* BONUS-SEC (col/51): aviso no topo, seção de bônus, prova ao lado da capa, acelerador sob o botão, garantia em mini seção */
const BUILD = "legivel-cel4-colecao-20260929-0037";
const CTA = "Quero as 115 edições";
const HREF = "/colecao/checkout?src=lp-colecao";
/* col/14 (HC 28/09/26): a OFERTA tem janela; o checkout não. Três estados, decididos pela data na página (tokens da
   fábrica, oferta.json), nunca na rota: «permanente» (sem janela ou antes dela: venda sem bônus), «oferta» (dentro da
   janela: os dois bônus e o prazo), «espera» (depois do fim: some a oferta e o bônus, entra a lista de espera por email;
   a resposta da casa devolve o link direto do checkout, que segue aberto). Reabrir = a data da rodada seguinte.
   ?estado=espera|oferta na URL força o estado pra conferência visual. */
const OFERTA = { abre: "2026-09-29T00:00:00-03:00", fecha: "2026-10-02T23:59:59-03:00", fechaTxt: "sexta 02/10, 23:59", par: "Brasa Certa", parN: "117" };
const PAR_CAPA = "https://ecmveymyzdqiehvtqxms.supabase.co/storage/v1/object/public/assets/scriptorium/colecao/brasa-certa-capa.png";   // col/51: capa da Coleção da news do bônus 1 (a mesma do bump do checkout)
const LEIA = "leia@notasdocafe.com.br";   // col/14: email_from_address da publicação (EE = hc@), lido pela fábrica, roteado pro worker
type Estado = "permanente" | "oferta" | "espera";

type Exemplo = { rotulo: string; seq: string; titulo: string; sub: string; dia: string; pagina: number; img: string; alt: string };
const EXEMPLOS: Exemplo[] = [
    {
      "rotulo": "A mais aberta do volume",
      "seq": "075",
      "titulo": "O Catuaí que virou lavado e natural no mesmo terreiro",
      "sub": "Um Catuaí Amarelo do Cerrado Mineiro colhido num dia só, metade despolpada e metade secada dentro da cereja, coadas lado a lado no V60.",
      "dia": "11 de agosto",
      "pagina": 411,
      "img": "/colecao/exemplo-1.webp",
      "alt": "Página 411 do volume: abertura da edição 075, O Catuaí que virou lavado e natural no mesmo terreiro"
    },
    {
      "rotulo": "A mais aberta de setembro",
      "seq": "104",
      "titulo": "A denominação de origem que amarra o café a 55 municípios",
      "sub": "Em 2013, o Cerrado Mineiro virou a primeira denominação de origem do café brasileiro, com faixa de altitude e 55 municípios no caderno de regras.",
      "dia": "11 de setembro",
      "pagina": 640,
      "img": "/colecao/exemplo-2.webp",
      "alt": "Página 640 do volume: abertura da edição 104, A denominação de origem que amarra o café a 55 municípios"
    },
    {
      "rotulo": "A mais clicada",
      "seq": "054",
      "titulo": "O Ouro Verde da caldeira de Poços de Caldas",
      "sub": "Um Ouro Verde de pequeno produtor plantado no solo vulcânico da antiga caldeira de Poços de Caldas, acima de 1.200 metros e secado ao sol em terreiro, preparado na V60 que realça a doçura, com xícara de rapadura e chocolate ao leite, vendido direto de quem separa na mão o lote da encosta da caldeira.",
      "dia": "20 de julho",
      "pagina": 265,
      "img": "/colecao/exemplo-3.webp",
      "alt": "Página 265 do volume: abertura da edição 054, O Ouro Verde da caldeira de Poços de Caldas"
    }
  ];

const AMOSTRA = [
  { src: "/colecao/amostra-2.webp", rot: "Cada edição inteira, com título e data", alt: "Primeira página de uma edição dentro do volume" },
  { src: "/colecao/amostra-1.webp", rot: "Sumário por mês: um toque, cai na edição", alt: "Página do sumário da Coleção completa, edições agrupadas por mês" },
  { src: "/colecao/amostra-3.webp", rot: "O texto como foi enviado, em página nova", alt: "Página do meio de uma edição, com o texto como foi enviado" },
];

const CENAS = [
  { t: "A rotina", d: "Você lê e deixa lá. A de hoje empurra a de ontem pra baixo." },
  { t: "O engano", d: "A busca devolve vinte resultados. A edição certa não está em nenhum." },
  { t: "O custo", d: "A releitura fica pra depois. Depois vira nunca." },
];

const Seta = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

// col/51: contagem do prazo dos bônus em componente próprio, pra página não redesenhar a cada segundo
function Contagem({ ate }: { ate: string }) {
  const [t, setT] = useState("");
  useEffect(() => {
    const fim = Date.parse(ate);
    if (Number.isNaN(fim)) return;
    const tic = () => {
      const s = Math.max(0, Math.floor((fim - Date.now()) / 1000));
      const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
      setT(s === 0 ? "" : d > 0 ? `${d}d ${h}h ${m}min` : h > 0 ? `${h}h ${m}min ${s % 60}s` : `${m}min ${s % 60}s`);
    };
    tic();
    const i = window.setInterval(tic, 1000);
    return () => window.clearInterval(i);
  }, [ate]);
  return t ? <span className="cont"><span className="cont-pre">termina em </span><b>{t}</b></span> : null;
}

export default function ColecaoLP() {
  const [cena, setCena] = useState(0);
  const [estado, setEstado] = useState<Estado>("permanente");

  // estado da oferta pela data (só no cliente, depois de montar: o servidor sempre entrega «permanente», sem hidratação divergente)
  useEffect(() => {
    const forca = new URLSearchParams(window.location.search).get("estado");
    if (forca === "espera" || forca === "oferta" || forca === "permanente") { setEstado(forca); return; }
    const abre = OFERTA.abre ? Date.parse(OFERTA.abre) : NaN;
    const fecha = OFERTA.fecha ? Date.parse(OFERTA.fecha) : NaN;
    if (Number.isNaN(fecha)) return;
    const agora = Date.now();
    if (agora > fecha) setEstado("espera");
    else if (Number.isNaN(abre) || agora >= abre) setEstado("oferta");
  }, []);
  const manual = useRef(false);
  const palco = useRef<HTMLDivElement>(null);
  const visivel = useRef(false);

  // cenas do mecanismo do problema: trocam sozinhas a cada 3,2 s enquanto o bloco está na tela;
  // o toque num botão de estação assume o controle (para o relógio).
  useEffect(() => {
    const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduz) return;
    const el = palco.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => (visivel.current = e.isIntersecting)), { threshold: 0.35 });
    io.observe(el);
    const t = window.setInterval(() => {
      if (manual.current || !visivel.current) return;
      setCena((c) => (c + 1) % CENAS.length);
    }, 3200);
    return () => {
      io.disconnect();
      window.clearInterval(t);
    };
  }, []);

  // elos dos mecanismos e o antes e depois entram quando aparecem na tela
  useEffect(() => {
    const alvos = document.querySelectorAll(".lpc .cadeia, .lpc .palco");
    const marca = (el: Element, on: boolean) => el.closest(".mec")?.classList.toggle("viu", on);
    if (!("IntersectionObserver" in window)) {
      alvos.forEach((m) => marca(m, true));
      return;
    }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) marca(e.target, true); }), { threshold: 0.05 });
    alvos.forEach((m) => io.observe(m));
    return () => io.disconnect();
  }, []);

  // col/28: guarda o id do assinante da beehiiv (?sid= do email) pro checkout mandar na session da Stripe.
  useEffect(() => {
    try {
      const q = (new URLSearchParams(window.location.search).get("sid") || "").toLowerCase();
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(q)) sessionStorage.setItem("vdn_sid", q);
    } catch {}
  }, []);

  const clique = () => sendBeacon(COL.slug, "colecao-lp-cta", { eventType: "converteu" });
  const [copiado, setCopiado] = useState(false);
  // col/14 (HC 28/09, opção A): lista de espera por formulário; a rota cria a inscrição na beehiiv e enrola na automação
  // 💎 [Espera], que manda o link direto do checkout. Um estado só pros formulários da página (hero, meio e final).
  const [espEmail, setEspEmail] = useState("");
  const [espSt, setEspSt] = useState<"idle" | "enviando" | "ok" | "erro">("idle");
  const enviarEspera = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = espEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || espSt === "enviando") return;
    setEspSt("enviando");
    try {
      const r = await fetch("/api/colecao-espera", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, src: "lp-colecao-espera" }) });
      if (!r.ok) throw new Error(String(r.status));
      setEspSt("ok");
      sendBeacon(COL.slug, "colecao-lp-espera", { eventType: "converteu" });
    } catch {
      setEspSt("erro");
    }
  };
  const copiar = () => {
    try { navigator.clipboard.writeText(LEIA).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2500); }); } catch {}
    sendBeacon(COL.slug, "colecao-lp-espera-copiar", { eventType: "converteu" });
  };
  const botao = (extra = "") =>
    estado === "espera" ? (
      espSt === "ok" ? (
        <p className="espera-ok" role="status"><b>Pronto.</b> O link do arquivo chega no seu email em instantes. Quando a próxima rodada abrir, você fica sabendo antes.</p>
      ) : (
        <form className={`espera-form${extra ? " " + extra : ""}`} onSubmit={enviarEspera} noValidate>
          <label className="sr-only" htmlFor="espera-email">Seu email</label>
          <input id="espera-email" type="email" inputMode="email" autoComplete="email" placeholder="seu@email.com" value={espEmail} onChange={(e) => setEspEmail(e.target.value)} required />
          <button type="submit" className="cta cta-espera" disabled={espSt === "enviando"}>
            {espSt === "enviando" ? "Enviando…" : <>Entrar na lista de espera <Seta /></>}
          </button>
        </form>
      )
    ) : (
      <a className={`cta${extra ? " " + extra : ""}`} href={HREF} onClick={clique}>
        {CTA} <Seta />
      </a>
    );
  // col/51 (HC 01/10/26): sob todo botão vai um acelerador (é fácil, chega rápido), nunca a garantia; a ficha de preço
  // mora no «o que você leva» e, na janela da oferta, fecha a seção de bônus
  const oferta = estado === "oferta" && !!OFERTA.fechaTxt;
  const raio = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6z" /></svg>;
  const reforco = estado === "espera" ? null : <p className="reforco">{raio}Pix ou cartão · PDF no seu email em minutos</p>;
  const ficha = (
    <div className="preco-linha">
      <div className="pedido">
        {botao()}
        {estado === "espera" ? null : <div className="preco"><b>R$ 97</b><span>uma vez só · pix, cartão ou boleto</span></div>}
      </div>
      {estado === "espera" ? null : <p className="reforco">{raio}No pix e no cartão, o PDF chega em minutos</p>}
    </div>
  );
  const depo = PROVA.exibir && PROVA.exibir_nota ? PROVA.depoimento : null;
  const ex0 = EXEMPLOS[0];
  const corta = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);
  const linhaInbox = corta(`${COL.news} · ${ex0 ? ex0.titulo : "a edição"}`, 40);

  return (
    <>
      <PageBeacon slug={COL.slug} step="colecao-lp" source="lp-colecao" />

      {oferta ? (
        <a className="aviso-topo" href="#bonus">
          <span><b>Dois bônus</b> até {OFERTA.fechaTxt}</span>
          <Contagem ate={OFERTA.fecha} />
        </a>
      ) : null}

      <nav>
        <div className="wrap nav-inner">
          <a href="/" className="brand" aria-label="Home">
            <img src="/ebook-web/simbolo.png" alt="" width={32} height={32} />
            <span className="wm"><span className="t">Notas</span><span className="s">{" do Café"}</span></span>
          </a>
          {estado === "espera"
            ? <a className="cta cta-mini cta-espera" href="#espera">Lista de espera</a>
            : <a className="cta cta-mini" href={HREF} onClick={clique}>{CTA}</a>}
        </div>
      </nav>

      <main className="lpc" data-build={BUILD}>
        <section className="hero">
          <div className="faixa hero-col">
            <h1 className="display h1">As {COL.n} edições {DA_NEWS} num PDF só, pra reler sem caçar email.</h1>
            <p className="sub">Pra quem lê a news e quer voltar a uma edição. Todas inteiras, em ordem, com sumário por mês.</p>
            <div className="hero-palco">
              <p className="hp-stat">
                {NUM_EXIBIDO ? <><b>{NUM_EXIBIDO}</b><span>leitores todo dia</span></> : <><b>{COL.paginas}</b><span>páginas num PDF</span></>}
                {PROVA.exibir && PROVA.exibir_nota ? <small>nota {PROVA.media_exibido} de 5 em {PROVA.votos} votos</small> : null}
              </p>
              <a className="capa-link" href={HREF} onClick={clique} aria-label={CTA}>
                <span className="hd-par hd-solo"><img className="hd-pcapa" src={COL.capa} alt={COL.capaAlt} width={900} height={1200} fetchPriority="high" /></span>
                {NUM_EXIBIDO ? <span className="selo"><b>{NUM_EXIBIDO}</b><span>leitores todo dia</span></span> : null}
              </a>
              <p className="hp-stat"><b>{COL.n}</b><span>edições publicadas</span></p>
            </div>
            <p className="capa-leg">Um arquivo só: {COL.paginas} páginas, de {COL.desde} até esta semana.</p>
            {estado === "espera" ? (
              <div className="aviso-espera" role="status">
                <b>A oferta desta rodada terminou na sexta, 23:59.</b>
                <span>A próxima você fica sabendo por email. Deixe o seu na lista de espera: a resposta chega com o caminho.</span>
              </div>
            ) : null}
            <div className="pedido" id="espera">{botao()}</div>
            {reforco}
            {estado === "espera" && espSt === "erro" ? (
              <p className="espera-alt" role="alert">
                Não deu agora. Escreva pra <b>{LEIA}</b> com o assunto «lista de espera do arquivo».{" "}
                <button type="button" className="copiar" onClick={copiar}>{copiado ? "Copiado" : "Copiar endereço"}</button>
              </p>
            ) : null}
          </div>
        </section>

        <section className="secao mec mec-prob" id="problema">
          <div className="faixa">
            <div className="cabeca">
              <h2 className="display h2">A sua releitura tem um nome: a <em className="nome-prob">Caixa que Engole</em>.</h2>
            </div>
            <p className="texto-mec">
              Toda leitora e todo leitor tem uma edição que quis reler e não achou. A busca devolve vinte resultados, a edição
              certa não está em nenhum, e a releitura fica pra depois.
            </p>
            <p className="texto-mec">
              A caixa de entrada guarda mal por desenho: ela empurra o de ontem pra baixo do de hoje. Em três semanas a edição
              está a duzentos emails de distância. Em três meses, apagada na limpeza de sábado.
            </p>

            <div className="palco" ref={palco} data-cena={cena} aria-label="Como a caixa de entrada engole a edição">
              <svg className="cena-svg" viewBox="0 0 360 224" role="img" aria-label={CENAS[cena].t + ": " + CENAS[cena].d}>
                <defs>
                  <clipPath id="cx-caixa"><rect x="18" y="14" width="324" height="196" rx="10" /></clipPath>
                </defs>
                <rect className="cx-fundo" x="18" y="14" width="324" height="196" rx="10" />
                {/* cena 1: a caixa de entrada; a edição (destacada) desce a cada email novo */}
                <g className="c c1" clipPath="url(#cx-caixa)">
                  <text className="cx-k" x="34" y="36">CAIXA DE ENTRADA</text>
                  <g className="cx-novos">
                    <g className="cx-row"><rect x="34" y="48" width="292" height="22" rx="4" /><text x="44" y="63">Promoção: só hoje</text></g>
                    <g className="cx-row"><rect x="34" y="76" width="292" height="22" rx="4" /><text x="44" y="91">Sua fatura chegou</text></g>
                    <g className="cx-row"><rect x="34" y="104" width="292" height="22" rx="4" /><text x="44" y="119">Reunião de amanhã</text></g>
                  </g>
                  <g className="cx-ed">
                    <rect x="34" y="48" width="292" height="22" rx="4" /><text x="44" y="63">{linhaInbox}</text>
                  </g>
                  <g className="cx-row cx-fixa"><rect x="34" y="160" width="292" height="22" rx="4" /><text x="44" y="175">Newsletter que você não abre</text></g>
                  <g className="cx-row cx-fixa"><rect x="34" y="188" width="292" height="22" rx="4" /><text x="44" y="203">Aviso do banco</text></g>
                  <text className="cx-leg" x="326" y="36" textAnchor="end">há 3 semanas</text>
                </g>
                {/* cena 2: a busca acha vinte e nenhuma é a certa */}
                <g className="c c2">
                  <rect className="cx-busca" x="34" y="30" width="292" height="30" rx="8" />
                  <circle className="cx-lupa" cx="52" cy="45" r="6" /><line className="cx-lupa" x1="56.5" y1="49.5" x2="61" y2="54" />
                  <text className="cx-busca-t" x="72" y="50">{ex0 ? ex0.titulo.split(" ").slice(0, 3).join(" ").toLowerCase() : "edição"}</text>
                  <g className="cx-res">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <g key={i} className="cx-row cx-r" style={{ "--i": i } as React.CSSProperties}>
                        <rect x="34" y={74 + i * 26} width="292" height="20" rx="4" />
                        <text x="44" y={88 + i * 26}>{["Re: sete pontos da reunião", "Versão final do contrato", "Caso resolvido: chamado 8812", "Sete dicas pra sua segunda", "Mesmo endereço, novo cartão"][i]}</text>
                        <text className="cx-x" x="318" y={88 + i * 26} textAnchor="end">×</text>
                      </g>
                    ))}
                  </g>
                  <text className="cx-alerta" x="180" y="214" textAnchor="middle">20 resultados. Nenhum é a edição.</text>
                </g>
                {/* cena 3: apagada na limpeza; a releitura vira nunca */}
                <g className="c c3">
                  <g className="cx-apagada">
                    <rect x="34" y="60" width="292" height="22" rx="4" /><text x="44" y="75">{linhaInbox}</text>
                    <line className="cx-risco" x1="40" y1="71" x2="320" y2="71" />
                  </g>
                  <text className="cx-alerta" x="180" y="108" textAnchor="middle">apagada na limpeza de sábado</text>
                  <g className="cx-cal">
                    <rect x="112" y="132" width="136" height="60" rx="8" />
                    <text className="cx-cal-t" x="180" y="154" textAnchor="middle">reler</text>
                    <text className="cx-cal-d" x="180" y="180" textAnchor="middle"><tspan className="dep">depois</tspan><tspan className="nun"> nunca</tspan></text>
                  </g>
                </g>
              </svg>
              <div className="estacoes" role="tablist" aria-label="Três passos">
                {CENAS.map((c, i) => (
                  <button
                    key={c.t}
                    type="button"
                    role="tab"
                    aria-selected={cena === i}
                    className="est"
                    onClick={() => {
                      manual.current = true;
                      setCena(i);
                    }}
                  >
                    <b>{c.t}</b>
                    <span>{c.d}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="secao mec mec-sol" id="solucao">
          <div className="faixa">
            <div className="cabeca">
              <h2 className="display h2">Pare de caçar. Abra o <em className="nome-sol">Volume em Ordem</em>: as {COL.n} edições num PDF só, no seu aparelho.</h2>
            </div>
            <p className="texto-mec">
              Cada edição entra inteira, como foi enviada, com título e data, em página nova. O sumário segue o calendário: um
              toque no mês, um toque no título, e você está na edição. Sem anúncio, sem enquete, sem rodapé.
            </p>
            <p className="texto-mec">
              O arquivo chega por email e fica no computador, no tablet ou impresso. A busca do email deixa de ser o caminho. O
              caminho vira o sumário.
            </p>
            <div className="cadeia" aria-label="Como o volume funciona">
              <div className="elo">
                <figure className="elo-fig"><img src={AMOSTRA[0].src} alt={AMOSTRA[0].alt} width={600} height={850} loading="lazy" /></figure>
                <small>O que vem pronto</small>
                <b>{COL.n} edições em ordem, cada uma inteira</b>
                <p>Título, data e o texto como foi enviado. Nada resumido, nada cortado.</p>
              </div>
              <span className="seta" aria-hidden="true"><Seta /></span>
              <div className="elo">
                <figure className="elo-fig"><img src={AMOSTRA[1].src} alt={AMOSTRA[1].alt} width={600} height={850} loading="lazy" /></figure>
                <small>A ação de duas linhas</small>
                <b>Abre o PDF. Toca no mês.</b>
                <p>O sumário lista o mês e o título de cada edição, com a página ao lado. Um toque e você está lá.</p>
              </div>
              <span className="seta" aria-hidden="true"><Seta /></span>
              <div className="elo">
                <figure className="elo-fig"><img src={AMOSTRA[2].src} alt={AMOSTRA[2].alt} width={600} height={850} loading="lazy" /></figure>
                <small>O que cresce sozinho</small>
                <b>A newsletter vira um livro que fica</b>
                <p>O arquivo é seu. Fica no aparelho, abre sem internet, imprime e aceita risco à mão.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="secao ad" id="antes-depois">
          <div className="faixa">
            <div className="cabeca">
              <h2 className="display h2">A mesma edição, na caixa de entrada e no volume.</h2>
            </div>
            <div className="ad-par">
              <div className="ad-box antes">
                <small>Antes · na caixa de entrada</small>
                <svg className="ad-svg" viewBox="0 0 300 150" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <rect key={i} className="ad-row" x="14" y={12 + i * 25} width="272" height="17" rx="4" />
                  ))}
                  <g className="ad-ed">
                    <rect x="14" y="116" width="272" height="23" rx="4" />
                    <text x="24" y="132">{corta(ex0 ? ex0.titulo : "a edição", 19)} · há 3 semanas</text>
                  </g>
                  <text className="ad-cont" x="278" y="25" textAnchor="end">+200 acima</text>
                </svg>
                <ul>
                  <li>Busca: vinte resultados, nenhum é a edição.</li>
                  <li>Três semanas depois, duzentos emails acima dela.</li>
                  <li>Limpeza de sábado: apagada.</li>
                </ul>
              </div>
              <div className="ad-box depois">
                <small>Depois · no volume</small>
                <figure className="ad-fig"><img src={AMOSTRA[1].src} alt="Página do sumário do volume, com as edições agrupadas por mês e a página de cada uma" width={600} height={850} loading="lazy" /></figure>
                <ul>
                  {ex0 ? <li>Sumário: {ex0.dia.split(" de ")[1]} · {ex0.seq} · página {ex0.pagina}.</li> : <li>Sumário por mês, com a página de cada edição.</li>}
                  <li>Título e data no alto de cada edição.</li>
                  <li>Arquivo no aparelho: abre sem internet.</li>
                </ul>
              </div>
            </div>
            <div className="pedido-mec">{botao()}</div>
            {reforco}
          </div>
        </section>

        <section className="secao" id="leva">
          <div className="faixa">
            <div className="cabeca">
              <h2 className="display h2">Você leva um arquivo só: as {COL.n} edições, do jeito que foram enviadas.</h2>
            </div>
            <a className="capa-link capa-leva" href={HREF} onClick={clique} aria-label={CTA}>
              <span className="hd-par hd-solo"><img className="hd-pcapa" src={COL.capa} alt={COL.capaAlt} width={900} height={1200} loading="lazy" /></span>
            </a>
            <p className="capa-leg">o volume em PDF</p>
            <ul className="pra-quem" aria-label="Pra quem é">
              <li>Pra quem lê a news e quer voltar a uma edição sem caçar.</li>
              <li>Pra quem entrou este ano e quer o que saiu antes de assinar.</li>
              <li>Pra quem guarda o que lê: no computador, no tablet ou impresso.</li>
            </ul>
            <div className="contadores" aria-label="Números do volume">
              <div><b>{COL.n}</b><span>edições inteiras</span></div>
              <div><b>{COL.paginas}</b><span>páginas num PDF</span></div>
              <div><b>{COL.meses}</b><span>meses de edições</span></div>
              <div><b>24 h</b><span>pra chegar no seu email</span></div>
            </div>
            {oferta ? null : ficha}
          </div>
        </section>

        {oferta ? (
          <section className="secao bonus-sec" id="bonus">
            <div className="faixa">
              <div className="cabeca">
                <p className="bonus-cont"><Contagem ate={OFERTA.fecha} /></p>
                <h2 className="display h2">Dois bônus pra quem confirma até {OFERTA.fechaTxt}.</h2>
              </div>
              <div className="bonus-cards">
                <article className="bonus-card">
                  <figure className="bonus-fig"><img src={PAR_CAPA} alt={`Capa da Coleção completa: ${OFERTA.par}`} width={900} height={1200} loading="lazy" /></figure>
                  <small>Bônus 1</small>
                  <h3 className="display h3">O volume da {OFERTA.par} pela metade</h3>
                  <p>As {OFERTA.parN} edições no mesmo pedido, com um toque no checkout.</p>
                </article>
                <article className="bonus-card">
                  <figure className="bonus-fig">
                    <svg className="bonus-cal" viewBox="0 0 240 158" role="img" aria-label="Doze meses: um PDF atualizado todo dia 1º">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <g key={i} className={i === 0 ? "on" : undefined}>
                          <rect x={8 + (i % 4) * 58} y={8 + Math.floor(i / 4) * 50} width="50" height="42" rx="6" />
                          <text x={33 + (i % 4) * 58} y={35 + Math.floor(i / 4) * 50} textAnchor="middle">{i + 1}</text>
                        </g>
                      ))}
                    </svg>
                  </figure>
                  <small>Bônus 2</small>
                  <h3 className="display h3">O seu volume atualizado por 12 meses</h3>
                  <p>Todo dia 1º, o PDF com as edições do mês anterior chega no seu email.</p>
                </article>
              </div>
              {ficha}
            </div>
          </section>
        ) : null}

        {estado === "espera" ? null : (
          <section className="gar-sec" aria-label="Garantia">
            <div className="faixa gar">
              <span className="gar-selo" aria-hidden="true"><b>7</b><span>dias</span></span>
              <p><b>Sete dias de garantia.</b> Não serviu, responde o email do pedido e devolvemos.</p>
            </div>
          </section>
        )}

        <section className="secao" id="dentro">
          <div className="faixa">
            <div className="cabeca">
              <h2 className="display h2">O que vem dentro do volume.</h2>
            </div>
            <div className="dentro">
              <ul className="lista-dentro">
                <li><b>As {COL.n} edições em ordem cronológica</b>, cada uma com título, data e o texto inteiro.</li>
                <li><b>Sumário por mês com link</b>: um toque e você cai na edição. O marcador do leitor de PDF faz o mesmo.</li>
                <li><b>Cada edição começa em página nova</b>, pra imprimir, riscar e guardar na estante.</li>
                <li><b>Sem anúncio, sem enquete, sem rodapé</b>: só o que vale reler.</li>
                <li><b>Um PDF só</b>, pra ler no computador, no tablet ou impresso, sem internet.</li>
                <li><b>Chega neste seu email</b> em até 24 horas depois da confirmação. O link é permanente.</li>
              </ul>
              <div className="am-row" aria-label="Páginas do volume">
                {AMOSTRA.map((p) => (
                  <figure key={p.src}>
                    <img src={p.src} alt={p.alt} width={600} height={850} loading="lazy" />
                    <figcaption>{p.rot}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </section>

        {EXEMPLOS.length === 3 && (
          <section className="secao" id="exemplos">
            <div className="faixa">
              <div className="cabeca">
                <h2 className="display h2">Três edições que estão lá dentro.</h2>
                <p className="intro">Escolhidas pelo que os leitores fizeram, não por gosto: a mais aberta do volume, a mais aberta do mês e a mais clicada.</p>
              </div>
              <div className="exemplos">
                {EXEMPLOS.map((e) => (
                  <article className="ex" key={e.seq}>
                    <a className="ex-fig" href={HREF} onClick={clique} aria-label={CTA}>
                      <img src={e.img} alt={e.alt} width={600} height={850} loading="lazy" />
                    </a>
                    <small className="ex-rot">{e.rotulo}</small>
                    <span className="ex-meta">Edição {e.seq} · {e.dia} · página {e.pagina}</span>
                    <h3 className="display h3">{e.titulo}</h3>
                    <p>{e.sub}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {PROVA.exibir && PROVA.exibir_nota && (
          <section className="secao" id="leitores">
            <div className="faixa">
              <div className="cabeca">
                <h2 className="display h2">Quem lê {A_NEWS} todo dia.</h2>
              </div>
              <div className="ck-prova" aria-label={`O que os leitores ${DA_NEWS} dizem`}>
                <div className="ck-media">
                  <b>{PROVA.media_exibido}</b>
                  <div>
                    <span className="ck-stars" style={{ "--f": `${PROVA.media_pct}%` } as React.CSSProperties} aria-label={`${PROVA.media_exibido} de 5`}>
                      <span className="st-b" aria-hidden="true">★★★★★</span><span className="st-f" aria-hidden="true">★★★★★</span>
                    </span>
                    <small>{PROVA.votos} votos de leitores nas edições</small>
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
                {NUM_EXIBIDO ? (
                  <div className="ck-leit"><span><b>{NUM_EXIBIDO}</b> leitores recebem a news, todo dia, desde {COL.desde}</span></div>
                ) : null}
                {depo && (
                  <figure className="ck-depo">
                    <blockquote>{depo.texto}</blockquote>
                    <figcaption>{depo.quem} · nota {depo.nota} de 5</figcaption>
                  </figure>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="secao" id="perguntas">
          <div className="faixa">
            <div className="cabeca">
              <h2 className="display h2">Perguntas de quem está na porta.</h2>
            </div>
            <div className="faq">
              <details><summary>Pix, cartão ou boleto?<Seta /></summary><p>Os três, pela Stripe. No pix e no cartão a confirmação é imediata; no boleto, assim que o banco confirma.</p></details>
              <details><summary>Como recebo depois de confirmar?<Seta /></summary><p>Confirmou, o PDF chega neste seu email em até 24 horas (no cartão e no pix, normalmente em minutos). O link é permanente e o arquivo é seu.</p></details>
              <details><summary>Pago uma vez ou todo mês?<Seta /></summary><p>Uma vez só, R$ 97, pela Stripe. Sem mensalidade e sem renovação.</p></details>
              <details><summary>As edições não ficam de graça no site?<Seta /></summary><p>Ficam, uma por página. A coleção é pra quem quer tudo reunido, em ordem e num lugar só, fora da caixa de entrada.</p></details>
              <details><summary>Já li tudo. Pra que a coleção?<Seta /></summary><p>Pra reler e pra consultar. A caixa de entrada guarda mal: a busca falha, o email some, a edição antiga fica a duzentos emails de distância. No PDF você abre no mês certo em dois toques.</p></details>
              <details><summary>Entrei este mês. Vale a pena?<Seta /></summary><p>É o caso mais comum: quem chegou depois leva tudo o que saiu antes de assinar, de {COL.desde} até esta semana.</p></details>
              <details><summary>Preciso de internet pra ler?<Seta /></summary><p>Só pra baixar. Depois o arquivo fica no computador ou no tablet e abre em qualquer lugar. Dá pra imprimir também.</p></details>
              <details><summary>E as edições que saírem depois?<Seta /></summary><p>O volume traz tudo até a semana em que você confirma. As edições novas seguem chegando por email, todo dia.</p></details>
              <details><summary>E se não for pra mim?<Seta /></summary><p>Se você lê a news e já quis voltar numa edição, o volume serve. E se não servir, sete dias de garantia: responde o email do pedido e devolvemos.</p></details>
            </div>
          </div>
        </section>

        <section className="secao" id="final">
          <div className="faixa">
            <div className="final-box">
              <h2 className="display h2">Leia a edição que você perdeu. E todas as outras.</h2>
              <p className="sub">As {COL.n} edições {DA_NEWS} num PDF só, em ordem, com sumário por mês. Seu pra sempre.</p>
              <a className="capa-link capa-final" href={HREF} onClick={clique} aria-label={CTA}>
                <span className="hd-par hd-solo"><img className="hd-pcapa" src={COL.capa} alt={COL.capaAlt} width={900} height={1200} loading="lazy" /></span>
              </a>
              <div className="pedido">{botao()}</div>
              {reforco}
              <p className="espera">A edição de amanhã sai no horário de sempre. As {COL.n} de antes cabem num arquivo.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="ck-foot">
        <p>{COL.despedida}</p>
        <span>Stripe · pix, cartão ou boleto · garantia de 7 dias</span>
      </footer>

      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap');
:root{--bg:#14110C;--bg-deep:#19170F;--text:#E9EAE3;--text-dim:#96917E;--sage:#96917E;--hair:rgba(233,234,227,.12);--hair-accent:rgba(226,120,44,.30);--bright:#E2782C;--serif:"Playfair Display",Georgia,serif;--sans:"Inter",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,monospace}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--sans);background:var(--bg);color:var(--text);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
nav{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--bg) 82%,transparent);backdrop-filter:saturate(140%) blur(8px);-webkit-backdrop-filter:saturate(140%) blur(8px);border-bottom:1px solid var(--hair)}
a{color:inherit;text-decoration:none}
img{max-width:100%;display:block;height:auto}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
ul{list-style:none}
.wrap{width:100%;max-width:1140px;margin:0 auto;padding:0 28px}
.nav-inner{display:flex;align-items:center;justify-content:space-between;height:66px;gap:12px}
.brand{display:flex;align-items:center;gap:11px;min-width:0}
.brand img{width:32px;height:32px}
.wm{font-weight:700;font-size:20px;letter-spacing:-.02em;white-space:nowrap}
.wm .t{color:var(--bright)}.wm .s{color:#fff}
@media (max-width:480px){.wm{display:none}}

        .lpc{position:relative;z-index:1}
        .lpc p,.lpc li{text-wrap:pretty}
        .faixa{width:min(1080px,100% - clamp(36px,7vw,96px));margin-inline:auto}
        .secao{padding-block:clamp(56px,8vw,104px)}
        .secao + .secao{border-top:1px solid var(--hair)}
        .display{font-family:var(--serif);font-style:italic;font-weight:900;letter-spacing:-.02em;color:#fff;text-wrap:balance}
        .h1{font-size:clamp(2rem,7.4vw,3.6rem);line-height:1.06;max-width:22ch;margin-inline:auto}
        .h2{font-size:clamp(1.75rem,3.4vw,2.7rem);line-height:1.08;max-width:24ch;margin-inline:auto}
        .h3{font-size:clamp(1.25rem,1.8vw,1.6rem);line-height:1.15;letter-spacing:-.012em}
        .cabeca{display:grid;gap:.6rem;justify-items:center;text-align:center;margin-bottom:clamp(28px,4vw,48px)}
        .intro{max-width:60ch;color:var(--text);font-size:1rem}
        .sub{margin-top:1rem;max-width:50ch;margin-inline:auto;font-size:clamp(1rem,1.15vw,1.12rem);color:var(--text);line-height:1.55}
        .cta{display:inline-flex;align-items:center;justify-content:center;gap:.55em;background:var(--bright);color:#140408;font-weight:800;font-size:1.125rem;line-height:1;padding:1.15em 1.6em;border-radius:999px;white-space:nowrap;box-shadow:0 5px 0 color-mix(in srgb,var(--bright) 55%,#000);transition:filter .16s ease,transform .15s ease,box-shadow .15s ease}
        .cta:hover{filter:brightness(1.08)}
        .cta:active{transform:translateY(3px);box-shadow:0 2px 0 color-mix(in srgb,var(--bright) 55%,#000)}
        .cta svg{width:1.05em;height:1.05em;stroke:currentColor;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
        .cta-mini{padding:.95em 1.15em;font-size:.95rem;box-shadow:none;font-weight:700}
        .cta-mini:active{transform:none;box-shadow:none}
        .pedido{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:1rem 1.4rem}
        .preco{display:grid;gap:.25rem;line-height:1.15;text-align:left}
        .preco b{font-family:var(--serif);font-weight:900;font-size:2.4rem;line-height:1;color:#fff;letter-spacing:-.01em}
        @media (max-width:560px){.preco{text-align:center;width:100%}}
        .preco span{font-size:.95rem;color:var(--text)}
        .garantia{font-size:.95rem;color:var(--text);max-width:60ch;margin-inline:auto}
        .prazo{margin-top:1rem;font-size:.95rem;color:var(--text);max-width:52ch;margin-inline:auto;line-height:1.45}
        .prazo b{color:var(--bright)}
        .aviso-espera{margin:1.1rem auto 0;max-width:52ch;display:grid;gap:.3rem;font-size:.95rem;line-height:1.45;text-align:center;color:var(--muted)}
        .aviso-espera b{color:var(--bright);font-size:1.05rem}
        .cta-espera{background:var(--sage);color:var(--bg);box-shadow:0 5px 0 color-mix(in srgb,var(--sage) 55%,#000)}
        .espera-form{display:flex;flex-wrap:wrap;gap:.55rem;justify-content:center;align-items:stretch;max-width:720px;margin:0 auto}
        .espera-form input{flex:1 1 240px;min-width:0;padding:.9rem 1.2rem;border-radius:999px;border:1px solid transparent;background:#fff;color:#141414;font:inherit;font-size:1rem}
        .espera-form input::placeholder{color:#6f6f6f}
        .espera-form input:focus{outline:2px solid var(--sage);outline-offset:2px}
        .espera-form .cta{flex:0 0 auto}
        .espera-form .cta:disabled{opacity:.7;cursor:progress}
        .espera-ok{max-width:52ch;margin:0 auto;padding:.9rem 1.1rem;border:1px solid color-mix(in srgb,var(--sage) 45%,transparent);border-radius:12px;background:color-mix(in srgb,var(--sage) 10%,transparent);font-size:1rem;line-height:1.5;text-align:left}
        .espera-ok b{color:var(--bright)}
        .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
        .espera-alt{max-width:52ch;margin:.7rem auto 0;font-size:.95rem;line-height:1.5;color:var(--muted);text-align:center;overflow-wrap:anywhere}
        .espera-alt b{color:var(--bright);font-weight:600}
        .copiar{display:inline-block;margin-left:.35rem;padding:.45rem .8rem;border:1px solid var(--hair-accent);border-radius:8px;background:transparent;color:var(--bright);font:inherit;font-size:.95rem;cursor:pointer}
        .bonus{max-width:640px;margin:clamp(24px,3vw,32px) auto 0;padding:1rem 1.2rem;border:1px solid var(--hair-accent);border-radius:14px;background:color-mix(in srgb,var(--bg-deep) 70%,transparent)}
        .bonus small{display:block;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:var(--sage);margin-bottom:.5rem;text-wrap:balance}
        .bonus ul{display:grid;gap:.45rem;font-size:1rem;line-height:1.45}
        .bonus b{color:var(--bright)}
        .garantia b{color:#fff}

        /* hero */
        .hero{padding-block:clamp(18px,3vw,48px) clamp(44px,6vw,88px)}
        .hero-col{display:grid;justify-items:center;text-align:center}
        .hero .sub{margin-top:.9rem}
        .capa-link{display:block;margin-top:clamp(18px,3vw,32px);-webkit-tap-highlight-color:transparent}
        .capa-link:focus-visible{outline:2px solid var(--bright);outline-offset:10px;border-radius:14px}
        .hd-par{display:flex;align-items:center;justify-content:center;position:relative;--h:200px}
        .hd-pcapa{height:var(--h);width:auto;aspect-ratio:3/4;object-fit:cover;border-radius:4px 8px 8px 4px;transform:rotate(-2deg);box-shadow:0 22px 48px rgba(0,0,0,.7),12px 12px 0 -4px rgba(255,255,255,.06),24px 24px 0 -8px rgba(255,255,255,.04)}
        .hero .hd-par{--h:clamp(200px,28vw,320px)}
        .capa-leg{margin-top:1.1rem;font-size:.95rem;color:var(--text);text-align:center}
        .hero .pedido{margin-top:1.1rem}
        .hero-col .pedido,.preco-linha .pedido,.final-box .pedido{justify-self:stretch}
        .espera-form{width:100%}
        .prova-hero{display:flex;justify-content:center;flex-wrap:wrap;gap:.35rem 1.1rem;margin-top:1rem;font-size:.95rem;color:var(--text)}
        .prova-hero b{color:#fff;font-weight:600}
        .prova-hero span+span::before{content:"·";margin-right:1.1rem;color:var(--hair-accent)}
        @media (max-width:480px){.prova-hero{flex-direction:column;gap:.25rem}.prova-hero span+span::before{content:none;margin:0}.hero .hd-par{--h:240px}}

        /* mecanismos */
        .mec .cabeca{margin-bottom:clamp(24px,3.5vw,40px)}
        .mec .h2{max-width:26ch}
        .nome-prob{font-style:inherit;color:#E0664F}
        .nome-sol{font-style:inherit;color:var(--bright)}
        .texto-mec{max-width:58ch;margin-inline:auto;text-align:center;color:var(--text);font-size:clamp(1rem,1.15vw,1.12rem);line-height:1.6}
        .texto-mec + .texto-mec{margin-top:1rem}
        .palco{max-width:640px;margin:clamp(24px,3.5vw,40px) auto 0}
        .cena-svg{width:100%;height:auto;display:block;font-family:var(--sans);font-size:13.5px}
        .cx-fundo{fill:var(--bg-deep);stroke:var(--hair);stroke-width:1}
        .cx-k{font-family:var(--mono);font-size:13.5px;letter-spacing:.14em;fill:var(--text-dim)}
        .cx-leg{font-size:13.5px;fill:var(--text);font-style:italic}
        .cx-row rect{fill:color-mix(in srgb,var(--text) 9%,transparent)}
        .cx-row text{fill:var(--text)}
        .cx-ed rect{fill:color-mix(in srgb,var(--bright) 22%,transparent);stroke:var(--bright);stroke-width:1}
        .cx-ed text{fill:#fff;font-weight:600}
        .c{opacity:0;visibility:hidden;transition:opacity .45s ease,visibility .45s}
        .palco[data-cena="0"] .c1,.palco[data-cena="1"] .c2,.palco[data-cena="2"] .c3{opacity:1;visibility:visible}
        .palco[data-cena="0"] .cx-ed{animation:cxDesce 3s cubic-bezier(.16,1,.3,1) .2s both}
        .palco[data-cena="0"] .cx-novos{animation:cxEntra 3s cubic-bezier(.16,1,.3,1) .2s both}
        @keyframes cxDesce{from{transform:translateY(0)}to{transform:translateY(84px)}}
        @keyframes cxEntra{from{transform:translateY(-92px);opacity:0}30%{opacity:1}to{transform:translateY(0);opacity:1}}
        .cx-busca{fill:color-mix(in srgb,var(--text) 8%,transparent);stroke:var(--hair-accent);stroke-width:1}
        .cx-lupa{stroke:var(--text-dim);fill:none;stroke-width:1.6;stroke-linecap:round}
        .cx-busca-t{fill:#fff;font-size:13.5px}
        .cx-r{opacity:0}
        .palco[data-cena="1"] .cx-r{animation:cxPop .35s ease both;animation-delay:calc(.25s + var(--i) * .22s)}
        @keyframes cxPop{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
        .cx-x{fill:#E0664F;font-size:15px;font-weight:700}
        .cx-alerta{fill:#E0664F;font-size:13.5px;font-weight:600}
        .cx-apagada rect{fill:color-mix(in srgb,var(--text) 6%,transparent)}
        .cx-apagada text{fill:var(--text)}
        .cx-risco{stroke:#E0664F;stroke-width:2;stroke-dasharray:300;stroke-dashoffset:300}
        .palco[data-cena="2"] .cx-risco{animation:cxRisco .7s ease .3s forwards}
        @keyframes cxRisco{to{stroke-dashoffset:0}}
        .cx-cal rect{fill:color-mix(in srgb,var(--text) 6%,transparent);stroke:var(--hair);stroke-width:1}
        .cx-cal-t{font-family:var(--mono);font-size:13.5px;letter-spacing:.14em;fill:var(--text);text-transform:uppercase}
        .cx-cal-d{font-size:17px;font-weight:700}
        .cx-cal-d .dep{fill:var(--text-dim)}
        .cx-cal-d .nun{fill:#E0664F}
        .palco[data-cena="2"] .cx-cal-d .dep{animation:cxSome 1.2s ease 1.2s forwards}
        .palco[data-cena="2"] .cx-cal-d .nun{opacity:0;animation:cxVem .5s ease 1.6s forwards}
        @keyframes cxSome{to{text-decoration:line-through;opacity:.45}}
        @keyframes cxVem{to{opacity:1}}
        .estacoes{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
        .est{display:grid;gap:.2rem;text-align:left;padding:.8rem .9rem;border:1px solid var(--hair);border-radius:12px;background:var(--bg-deep);color:var(--text-dim);transition:border-color .25s,color .25s}
        .est b{font-size:1rem;color:var(--text)}
        .est span{font-size:.95rem;line-height:1.35}
        .est[aria-selected="true"]{border-color:var(--bright);color:var(--text)}
        .est[aria-selected="true"] b{color:#fff}
        @media (max-width:640px){.estacoes{grid-template-columns:1fr}.est{grid-template-columns:auto 1fr;gap:.2rem .7rem;align-items:baseline;padding:.65rem .8rem}.est span{grid-column:2}}
        .cadeia{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:12px;align-items:stretch;max-width:980px;margin:clamp(28px,4vw,44px) auto 0}
        .elo{background:var(--bg-deep);border:1px solid var(--hair);border-radius:16px;padding:16px 16px 20px;display:grid;gap:.4rem;align-content:start;text-align:left}
        .elo small{font-family:var(--mono);font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--bright)}
        .elo b{font-family:var(--serif);font-weight:700;font-size:1.2rem;line-height:1.25;color:#fff}
        .elo p{font-size:1rem;line-height:1.5;color:var(--text)}
        .elo-fig{margin:0 0 .5rem;aspect-ratio:600/420;overflow:hidden;border-radius:6px;background:#fff;box-shadow:0 10px 24px rgba(0,0,0,.5)}
        .elo-fig img{width:100%;height:auto}
        .seta{display:grid;place-items:center;color:var(--text-dim)}
        .seta svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
        @media (max-width:767px){.cadeia{grid-template-columns:1fr;gap:8px}.seta{transform:rotate(90deg);height:26px}}
        @media (prefers-reduced-motion:no-preference){.elo{opacity:0;transform:translateY(10px);transition:opacity .5s ease,transform .5s ease}.elo:nth-child(3){transition-delay:.12s}.elo:nth-child(5){transition-delay:.24s}.mec.viu .elo{opacity:1;transform:none}}

        /* antes e depois */
        .ad-par{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:980px;margin:0 auto;align-items:start}
        .ad-box{background:var(--bg-deep);border:1px solid var(--hair);border-radius:18px;padding:20px 22px;display:grid;gap:.9rem;align-content:start}
        .ad-box small{font-family:var(--mono);font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim)}
        .ad-box.antes small{color:#E0664F}
        .ad-box.depois small{color:var(--bright)}
        .ad-box.depois{border-color:color-mix(in srgb,var(--bright) 45%,var(--hair))}
        .ad-box ul{display:grid;gap:.45rem;font-size:1rem;color:var(--text);line-height:1.45}
        .ad-box ul li{padding-left:1.1em;position:relative}
        .ad-box ul li::before{content:"";position:absolute;left:0;top:.62em;width:6px;height:6px;border-radius:50%;background:var(--text-dim)}
        .ad-box.antes ul li::before{background:#E0664F}
        .ad-box.depois ul li::before{background:var(--bright)}
        .ad-svg{width:100%;height:auto;display:block;font-family:var(--sans);font-size:13px;background:color-mix(in srgb,var(--text) 4%,transparent);border-radius:8px}
        .ad-row{fill:color-mix(in srgb,var(--text) 9%,transparent)}
        .ad-ed rect{fill:color-mix(in srgb,#E0664F 22%,transparent);stroke:#E0664F;stroke-width:1}
        .ad-ed text{fill:#fff;font-weight:600;font-size:13px}
        .ad-cont{fill:#E0664F;font-size:13px;font-weight:600}
        .ad-fig{margin:0;aspect-ratio:600/460;overflow:hidden;border-radius:8px;background:#fff;box-shadow:0 10px 24px rgba(0,0,0,.5)}
        .ad-fig img{width:100%;height:auto}
        .pedido-mec{display:flex;justify-content:center;margin-top:clamp(26px,4vw,40px)}
        @media (max-width:767px){.ad-par{grid-template-columns:1fr}}

        /* o que você leva */
        .capa-leva{margin-top:0}
        .capa-leva .hd-par{--h:clamp(250px,28vw,320px)}
        .pra-quem{max-width:520px;margin:clamp(24px,3vw,32px) auto 0;display:grid;gap:.5rem;font-size:1rem;color:var(--text)}
        .pra-quem li{padding-left:1.2em;position:relative}
        .pra-quem li::before{content:"";position:absolute;left:0;top:.6em;width:7px;height:7px;border-radius:50%;background:var(--bright)}
        .contadores{display:grid;grid-template-columns:repeat(2,1fr);border-top:1px solid var(--hair);border-bottom:1px solid var(--hair);margin-top:clamp(32px,5vw,56px);max-width:900px;margin-inline:auto}
        @media (min-width:640px){.contadores{grid-template-columns:repeat(4,1fr)}}
        .contadores div{padding:1.2rem 1rem 1.2rem 0;display:grid;gap:.15rem}
        .contadores div + div{border-left:1px solid var(--hair);padding-left:1.2rem}
        @media (max-width:639px){.contadores div:nth-child(3){border-left:0;padding-left:0}.contadores div:nth-child(-n+2){border-bottom:1px solid var(--hair)}}
        .contadores b{font-family:var(--serif);font-weight:900;font-size:clamp(2rem,3vw,2.6rem);line-height:1;color:#fff;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
        .contadores span{font-size:.95rem;color:var(--text)}
        .preco-linha{display:grid;justify-items:center;text-align:center;gap:1rem;padding-top:clamp(28px,4vw,40px)}

        /* dentro do volume */
        .dentro{display:grid;gap:clamp(24px,4vw,48px);align-items:center;max-width:980px;margin-inline:auto}
        @media (min-width:860px){.dentro{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}
        .lista-dentro{display:grid;gap:.75rem;font-size:1rem;color:var(--text);line-height:1.5}
        .lista-dentro li{padding-left:1.3em;position:relative}
        .lista-dentro li::before{content:"";position:absolute;left:0;top:.55em;width:8px;height:8px;border-radius:50%;background:var(--bright)}
        .lista-dentro b{color:#fff;font-weight:600}
        .am-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;text-align:center}
        .am-row figure{margin:0}
        .am-row img{display:block;width:100%;height:auto;aspect-ratio:600/850;border-radius:3px;background:#fff;box-shadow:0 12px 28px rgba(0,0,0,.55)}
        .am-row figcaption{font-size:14px;color:var(--text);margin-top:9px;line-height:1.3;text-wrap:balance}
        @media (max-width:639px){.am-row{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;margin-inline:-18px;padding:4px 18px 16px;scrollbar-width:none}.am-row::-webkit-scrollbar{display:none}.am-row figure{flex:0 0 62%;scroll-snap-align:center}}

        /* três edições de exemplo */
        .exemplos{display:grid;gap:clamp(14px,2vw,22px);max-width:1080px;margin-inline:auto}
        @media (min-width:760px){.exemplos{grid-template-columns:repeat(3,1fr)}}
        .ex{background:var(--bg-deep);border:1px solid var(--hair);border-radius:16px;padding:16px 16px 20px;display:grid;gap:.35rem;align-content:start}
        .ex-fig{display:block;margin:0 0 .6rem;aspect-ratio:600/560;overflow:hidden;border-radius:6px;background:#fff;box-shadow:0 12px 28px rgba(0,0,0,.55)}
        .ex-fig img{width:100%;height:auto}
        .ex-rot{font-family:var(--mono);font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--bright)}
        .ex-meta{font-size:.95rem;color:var(--text)}
        .ex .h3{margin-top:.15rem}
        .ex p{font-size:1rem;line-height:1.5;color:var(--text)}

        /* leitores (mesmo bloco do checkout) */
        .ck-prova{max-width:640px;margin-inline:auto;padding:20px 18px;border:1px solid var(--hair);border-radius:16px;background:var(--bg-deep);display:flex;flex-direction:column;gap:16px}
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
        .ck-leit{font-size:16px;color:var(--text);line-height:1.35}
        .ck-leit b{color:#fff;display:block;font-size:26px;font-weight:800;line-height:1;letter-spacing:-.01em;font-variant-numeric:tabular-nums;margin-bottom:4px}
        .ck-depo{margin:0;text-align:left}
        .ck-depo blockquote{font-family:var(--serif);font-style:italic;font-size:18px;line-height:1.4;color:#fff;quotes:"\\201C" "\\201D"}
        .ck-depo blockquote::before{content:open-quote;color:var(--bright)}
        .ck-depo blockquote::after{content:close-quote;color:var(--bright)}
        .ck-depo figcaption{margin-top:8px;font-family:var(--mono);font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--text)}

        /* perguntas */
        .faq{max-width:720px;margin-inline:auto;border-top:1px solid var(--hair)}
        .faq details{border-bottom:1px solid var(--hair)}
        .faq summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1.05rem 0;font-weight:600;color:#fff;font-size:1.06rem}
        .faq summary::-webkit-details-marker{display:none}
        .faq summary svg{width:20px;height:20px;flex:none;stroke:var(--text-dim);stroke-width:2;stroke-linecap:round;stroke-linejoin:round;fill:none;transition:transform .35s ease}
        .faq details[open] summary svg{transform:rotate(90deg)}
        .faq details p{padding:0 0 1.15rem;color:var(--text);max-width:62ch;font-size:1rem;line-height:1.55}

        /* final */
        .final-box{background:var(--bg-deep);border:1px solid var(--hair);border-radius:22px;padding:clamp(32px,5vw,64px) clamp(22px,4vw,56px);display:grid;justify-items:center;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.5)}
        .final-box .h2{max-width:min(92vw,620px);margin:0 auto}
        .final-box .sub{margin:1rem auto 0}
        .capa-final .hd-par{--h:clamp(230px,26vw,300px)}
        .final-box .pedido{margin-top:clamp(24px,3vw,36px)}
        .final-box .garantia{margin-top:1.1rem;font-size:.95rem}
        .espera{margin-top:1.3rem;font-style:italic;font-size:.98rem;color:var(--text);max-width:46ch;line-height:1.45}

        .ck-foot{padding:2.5rem 1.5rem;text-align:center;border-top:1px solid var(--hair);background:var(--bg-deep);display:grid;gap:.5rem;position:relative;z-index:1}
        .ck-foot p{font-family:var(--serif);font-style:italic;font-size:1rem;color:var(--sage)}
        .ck-foot span{font-size:.95rem;color:var(--text)}

        @media (prefers-reduced-motion:reduce){
          html{scroll-behavior:auto}
          .lpc *,.lpc *::before,.lpc *::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important}
          .cx-r{opacity:1}.cx-risco{stroke-dashoffset:0}.cx-cal-d .nun{opacity:1}
        }
        /* celular (col/44, HC 29/09/26): botão de compra dentro da 1ª tela. Título, sub curto, capa, botão; prazo e legenda depois. */
        @media (max-width:639px){
          .hero{min-height:auto;align-items:flex-start}
          section.hero .hero-col .h1{font-size:clamp(1.9rem,7.4vw,3.6rem);line-height:1.06}
          .hero-col>.h1{order:1}.hero-col>.sub{order:2}.hero-col>.capa-link{order:3}.hero-col>.aviso-espera{order:4}
          .hero-col>.pedido{order:5}.hero-col>.prazo{order:6}.hero-col>.capa-leg{order:7}.hero-col>.prova-hero{order:8}
          .hero .hd-par{--h:200px}
          .hero .capa-link{margin-top:18px}
          .hero .pedido{margin-top:16px}
          .hero .prazo{margin-top:14px}
          .hero .capa-leg{margin-top:14px}
        }
        /* CSS global da casa (AD) pintava título e sub do hero na cor do tema claro: cor com seletor acima de qualquer global */
        section.hero .hero-col .h1{color:#fff}
        section.hero .hero-col :is(.sub,.capa-leg,.prazo,.prova-hero){color:var(--text)}
        /* bônus (col/51, HC 01/10/26): aviso no topo com o prazo, seção própria de bônus, prova ao lado da capa (selo no celular),
           acelerador sob o botão, garantia em mini seção */
        .aviso-topo{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:.15rem .8rem;padding:.6rem 1rem;background:color-mix(in srgb,var(--bright) 16%,var(--bg-deep));border-bottom:1px solid var(--hair-accent);font-size:.95rem;line-height:1.3;color:var(--text);text-align:center}
        .aviso-topo b{color:var(--bright)}
        .cont{font-family:var(--mono);font-size:13px;color:var(--text);white-space:nowrap}
        .cont b,.aviso-topo .cont b{color:#fff;font-weight:500;font-variant-numeric:tabular-nums}
        .hero-palco{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:clamp(20px,4vw,56px);width:100%;max-width:880px;margin-top:clamp(18px,3vw,32px)}
        .hero .hero-palco .capa-link{margin-top:0;position:relative}
        .hp-stat{display:grid;gap:.35rem;justify-items:center;text-align:center}
        .hp-stat b,section.hero .hero-col .hp-stat b{font-family:var(--serif);font-style:italic;font-weight:900;font-size:clamp(2rem,4.2vw,3.2rem);line-height:1;color:#fff;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
        .hp-stat span,section.hero .hero-col .hp-stat span{font-family:var(--mono);font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--text);text-wrap:balance}
        .hp-stat small{font-size:.95rem;color:var(--text);margin-top:.2rem}
        .selo{display:none}
        .reforco,section.hero .hero-col .reforco{margin-top:.9rem;font-size:.95rem;line-height:1.35;color:var(--text);text-align:center;text-wrap:balance}
        .reforco svg{display:inline-block;width:1em;height:1em;margin-right:.4em;vertical-align:-.14em;fill:currentColor}
        .pedido-mec + .reforco{margin-top:1rem}
        .preco-linha .reforco,.final-box .reforco{margin-top:0}
        .final-box .reforco{margin-top:1.1rem}
        #bonus{scroll-margin-top:78px}
        .bonus-sec{background:color-mix(in srgb,var(--bright) 6%,var(--bg))}
        .bonus-cont{min-height:1.2rem}
        .bonus-cont .cont{display:inline-block;padding:.45rem .95rem;border:1px solid var(--hair-accent);border-radius:999px;letter-spacing:.1em;text-transform:uppercase}
        .bonus-cont .cont b{letter-spacing:.02em;text-transform:none}
        .bonus-cards{display:grid;gap:clamp(14px,2vw,22px);max-width:820px;margin-inline:auto}
        @media (min-width:700px){.bonus-cards{grid-template-columns:1fr 1fr}}
        .bonus-card{background:var(--bg-deep);border:1px solid var(--hair-accent);border-radius:16px;padding:22px 20px 24px;display:grid;gap:.45rem;align-content:start;justify-items:center;text-align:center}
        .bonus-fig{margin:0 0 .7rem;height:190px;width:100%;display:grid;place-items:center}
        .bonus-fig img{height:172px;width:auto;aspect-ratio:3/4;object-fit:cover;border-radius:4px 8px 8px 4px;transform:rotate(-2deg);box-shadow:0 16px 36px rgba(0,0,0,.6)}
        .bonus-cal{width:min(100%,250px);height:auto;font-family:var(--sans);font-size:16px;font-weight:600}
        .bonus-cal rect{fill:color-mix(in srgb,var(--text) 6%,transparent);stroke:var(--hair-accent);stroke-width:1}
        .bonus-cal text{fill:var(--text)}
        .bonus-cal .on rect{fill:var(--bright);stroke:var(--bright)}
        .bonus-cal .on text{fill:#140408}
        .bonus-card small{font-family:var(--mono);font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--bright)}
        .bonus-card p{font-size:1rem;line-height:1.5;color:var(--text);max-width:34ch}
        .gar-sec{padding-block:clamp(28px,4vw,44px);border-top:1px solid var(--hair)}
        .gar-sec + .secao{border-top:1px solid var(--hair)}
        .gar{display:flex;align-items:center;justify-content:center;gap:1rem;max-width:560px}
        .gar-selo{flex:none;width:64px;height:64px;border-radius:50%;border:1.5px solid var(--hair-accent);display:grid;place-content:center;justify-items:center;line-height:1;gap:2px}
        .gar-selo b{font-family:var(--serif);font-weight:900;font-size:1.6rem;color:#fff}
        .gar-selo span{font-family:var(--mono);font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--text)}
        .gar p{font-size:1rem;line-height:1.45;color:var(--text);text-align:left}
        .gar p b{color:#fff}
        @media (max-width:639px){
          .hero-col>.hero-palco{order:3}.hero-col>.reforco{order:6}.hero-col>.espera-alt{order:6}
          .hero-palco{display:flex;justify-content:center;margin-top:18px}
          .hp-stat{display:none}
          .selo{display:grid;place-content:center;justify-items:center;gap:3px;position:absolute;right:-40px;bottom:-6px;width:96px;height:96px;border-radius:50%;background:color-mix(in srgb,var(--bright) 82%,#000);color:#fff;text-align:center;line-height:1;transform:rotate(6deg);box-shadow:0 10px 24px rgba(0,0,0,.55)}
          .selo b{font-family:var(--serif);font-style:italic;font-weight:900;font-size:1.3rem;letter-spacing:-.01em}
          .selo span{font-family:var(--mono);font-size:13px;letter-spacing:.02em;text-transform:uppercase;max-width:9.5ch;line-height:1.1}
          .hero .hero-palco .hd-par{--h:186px}
          .hero .reforco{margin-top:12px;font-size:.9rem;white-space:nowrap}
          .final-box .reforco{font-size:13px;white-space:nowrap}
          .aviso-topo{font-size:.9rem;padding:.42rem .75rem}
        }
        @media (max-width:480px){.aviso-topo .cont-pre{display:none}}
      `}</style>
    </>
  );
}
