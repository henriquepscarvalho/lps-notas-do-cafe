export const dynamic = 'force-static';

const HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Media Kit · Notas do Café</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Eczar:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#2C1810;--card:#1E100A;--line:rgba(200, 150, 62, 0.12);
    --text:#F5EDE0;--muted:#9B8D82;--faint:#69584F;
    --accent:#E68C4C;--accent-deep:#8B4513;--accent2:#C8963E;--btn-fg:#15110A;
    --track:color-mix(in srgb,var(--text) 9%,transparent);
    --head:'Eczar', Georgia, serif;--label:'Eczar', Georgia, serif;--body:'Plus Jakarta Sans', system-ui, sans-serif;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth}
  body{background:var(--bg);color:var(--text);font-family:var(--body);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
  .wrap{max-width:1060px;margin:0 auto;padding:0 28px}
  a{color:inherit;text-decoration:none}

  .topbar{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--bg) 84%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
  .topbar .wrap{display:flex;align-items:center;justify-content:space-between;height:66px}
  .brand{display:flex;align-items:center;gap:13px}
  .brand img{width:38px;height:38px;border-radius:50%;object-fit:contain;background:color-mix(in srgb,var(--accent) 12%,var(--card));border:1px solid var(--line)}
  .brand .name{font-family:var(--label);font-weight:600;letter-spacing:.14em;font-size:13.5px;text-transform:uppercase}
  .topbar .kit{font-family:var(--label);font-size:11px;letter-spacing:.32em;color:var(--accent);text-transform:uppercase}

  .hero{position:relative;padding:78px 0 58px;text-align:center;overflow:hidden}
  .hero::before{content:"";position:absolute;inset:0;z-index:0;background:radial-gradient(640px 360px at 50% -10%,color-mix(in srgb,var(--accent) 22%,transparent),transparent 70%)}
  .hero .wrap{position:relative;z-index:1}
  .hero .seal{width:96px;height:96px;border-radius:50%;margin:0 auto 28px;display:block;object-fit:contain;background:color-mix(in srgb,var(--accent) 12%,var(--card));box-shadow:0 0 0 1px var(--line),0 14px 40px rgba(0,0,0,.4)}
  .kicker{font-family:var(--label);font-size:12px;letter-spacing:.36em;color:var(--accent);text-transform:uppercase;margin-bottom:22px}
  .hero h1{font-family:var(--head);font-weight:700;line-height:1.14;font-size:clamp(28px,4.6vw,48px);letter-spacing:.01em;margin-bottom:20px}
  .hero .sub{font-family:var(--head);font-style:italic;font-weight:500;font-size:clamp(17px,2.4vw,23px);color:var(--muted);max-width:620px;margin:0 auto}

  section{padding:54px 0;border-top:1px solid var(--line)}
  .sec-tag{font-family:var(--label);font-size:11px;letter-spacing:.3em;color:var(--accent);text-transform:uppercase;margin-bottom:12px}
  .sec-title{font-family:var(--head);font-weight:700;font-size:clamp(24px,3.4vw,34px);line-height:1.18;margin-bottom:12px}
  .sec-intro{color:var(--muted);max-width:660px;font-size:15.5px}

  .stats{display:grid;grid-template-columns:repeat(6,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:16px;overflow:hidden}
  .stat{background:var(--card);padding:26px 18px;text-align:center}
  .stat .v{font-family:var(--label);font-weight:700;font-size:clamp(24px,3.2vw,34px);line-height:1;color:var(--accent)}
  .stat .l{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--text);margin-top:11px}
  .stat .n{font-size:11.5px;color:var(--muted);margin-top:5px}

  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;margin-top:30px}
  .chart{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:26px 24px}
  .chart .ct{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:20px}
  .funnel{display:flex;flex-direction:column;gap:14px}
  .frow{display:flex;align-items:stretch;gap:12px}
  .frow .ic{width:38px;flex:none;display:grid;place-items:center;color:var(--accent);border:1px solid var(--line);border-radius:10px}
  .frow .fbar{background:linear-gradient(90deg,color-mix(in srgb,var(--accent) 26%,transparent),color-mix(in srgb,var(--accent) 9%,transparent));border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:10px;padding:14px 18px;display:flex;flex-direction:column;justify-content:center;min-width:0}
  .frow .fv{font-family:var(--label);font-weight:700;font-size:26px;line-height:1;color:var(--accent)}
  .frow .fl{font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin-top:6px}
  .fnote{font-size:12.5px;color:var(--faint);padding-left:50px;margin-top:2px}
  .leadcards{display:flex;flex-direction:column;gap:14px}
  .lc{display:flex;gap:14px;align-items:flex-start}
  .lc .ic{width:36px;height:36px;flex:none;border:1px solid var(--line);border-radius:10px;display:grid;place-items:center;color:var(--accent)}
  .lc h4{font-family:var(--head);font-weight:600;font-size:16.5px;margin-bottom:2px}
  .lc p{color:var(--muted);font-size:14px}

  .incgrid{display:grid;grid-template-columns:1.15fr .85fr;gap:40px;align-items:center;margin-top:30px}
  .bars .bar{display:grid;grid-template-columns:130px 1fr 46px;align-items:center;gap:14px;margin-bottom:14px}
  .bars .bar:last-child{margin-bottom:0}
  .bars .k{font-size:13.5px;color:var(--text)}
  .bars .track{height:12px;background:var(--track);border-radius:99px;overflow:hidden}
  .bars .fill{height:100%;border-radius:99px;background:color-mix(in srgb,var(--muted) 55%,transparent)}
  .bars .fill.prem{background:linear-gradient(90deg,var(--accent-deep),var(--accent))}
  .bars .p{font-size:13px;color:var(--muted);text-align:right;font-variant-numeric:tabular-nums}
  .callout{background:var(--card);border:1px solid var(--accent);border-radius:16px;padding:30px 28px;text-align:center}
  .callout .big{font-family:var(--label);font-weight:700;font-size:clamp(40px,6vw,58px);line-height:1;color:var(--accent)}
  .callout .cl{font-family:var(--head);font-size:17px;margin-top:12px;color:var(--text)}
  .callout .cn{font-size:12.5px;color:var(--muted);margin-top:8px}

  .why{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:30px}
  .wcard{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:26px 22px}
  .wcard .ic{color:var(--accent);margin-bottom:14px}
  .wcard h4{font-family:var(--head);font-weight:600;font-size:17px;margin-bottom:7px}
  .wcard p{color:var(--muted);font-size:14px}

  .formats{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:30px}
  .fcard{position:relative;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:28px 24px;display:flex;flex-direction:column}
  .fcard::before{content:"";position:absolute;left:24px;right:24px;top:0;height:2px;background:linear-gradient(90deg,var(--accent-deep),var(--accent),var(--accent-deep))}
  .fcard .ft{font-family:var(--label);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin-bottom:10px}
  .fcard h4{font-family:var(--head);font-weight:700;font-size:20px;margin-bottom:11px}
  .fcard p{color:var(--muted);font-size:14px;margin-bottom:17px}
  .fcard ul{list-style:none;display:flex;flex-direction:column;gap:9px;margin-top:auto}
  .fcard li{font-size:13.5px;color:var(--text);padding-left:19px;position:relative}
  .fcard li::before{content:"";position:absolute;left:0;top:8px;width:6px;height:6px;border-radius:99px;background:var(--accent)}
  .price{margin-top:18px;padding-top:15px;border-top:1px solid var(--line);font-size:13px;color:var(--muted)}
  .price b{color:var(--text);font-weight:600}

  .steps{display:grid;grid-template-columns:repeat(3,1fr);margin-top:30px;border:1px solid var(--line);border-radius:16px;overflow:hidden}
  .step{padding:28px 24px;border-right:1px solid var(--line)}
  .step:last-child{border-right:none}
  .step .n{font-family:var(--label);font-size:28px;color:var(--accent-deep);margin-bottom:10px}
  .step h4{font-family:var(--head);font-weight:600;font-size:16.5px;margin-bottom:5px}
  .step p{color:var(--muted);font-size:13.5px}

  .cta{text-align:center;background:radial-gradient(560px 300px at 50% 130%,color-mix(in srgb,var(--accent) 16%,transparent),transparent 70%)}
  .cta h2{font-family:var(--head);font-weight:700;font-size:clamp(26px,4.2vw,42px);margin-bottom:14px}
  .cta p{color:var(--muted);max-width:520px;margin:0 auto 30px;font-size:16.5px}
  .btn{display:inline-block;font-family:var(--body);font-weight:600;font-size:15px;color:var(--btn-fg);background:linear-gradient(180deg,var(--accent),var(--accent-deep));padding:16px 40px;border-radius:99px;box-shadow:0 8px 28px color-mix(in srgb,var(--accent) 24%,transparent)}
  .cta .mail{display:block;margin-top:20px;font-size:14px;color:var(--muted)}
  .cta .mail b{color:var(--accent);font-weight:600}

  footer{border-top:1px solid var(--line);padding:34px 0 50px}
  footer .wrap{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px}
  footer .net{font-size:12px;color:var(--faint);max-width:600px}
  footer .net b{color:var(--muted)}
  footer .dom{font-family:var(--label);font-size:12px;letter-spacing:.16em;color:var(--accent);text-transform:uppercase}
  .src{font-size:11.5px;color:var(--faint);margin-top:18px}

  @media (max-width:860px){
    .stats{grid-template-columns:repeat(2,1fr)}
    .grid2,.incgrid{grid-template-columns:1fr;gap:30px}
    .why,.formats{grid-template-columns:1fr}
    .steps{grid-template-columns:1fr}
    .step{border-right:none;border-bottom:1px solid var(--line)}.step:last-child{border-bottom:none}
  }
</style>
</head>
<body>

<div class="topbar"><div class="wrap">
  <div class="brand"><img src="data:image/webp;base64,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" alt="Notas do Café"><span class="name">Notas do Café</span></div>
  <span class="kit">Media Kit</span>
</div></div>

<header class="hero"><div class="wrap">
  <img class="seal" src="data:image/webp;base64,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" alt="Notas do Café">
  <div class="kicker">Newsletter diária · PT-BR</div>
  <h1>1.374 leitores que buscam a xícara perfeita</h1>
  <p class="sub">Da fazenda à xícara: tudo sobre café especial.</p>
</div></header>

<section><div class="wrap">
  <div class="stats"><div class="stat"><div class="v">1.374</div><div class="l">Leitores ativos</div><div class="n">base verificada</div></div><div class="stat"><div class="v">~4.282</div><div class="l">Impressões / mês</div><div class="n">aberturas de e-mail</div></div><div class="stat"><div class="v">~292</div><div class="l">Cliques / mês</div><div class="n">em links</div></div><div class="stat"><div class="v">~17</div><div class="l">Edições / mês</div><div class="n">últimos 30 dias</div></div><div class="stat"><div class="v">24,3%</div><div class="l">Taxa de abertura</div><div class="n">média mensal</div></div><div class="stat"><div class="v">41%</div><div class="l">Renda R$5k+</div><div class="n">perfil de inscrição</div></div></div>
</div></section>

<section><div class="wrap">
  <div class="sec-tag">I · Alcance mensal</div>
  <h2 class="sec-title">O que sua marca alcança em um mês.</h2>
  <p class="sec-intro">Cerca de 17 edições no último mês. Não é alcance vazio: a audiência abre, lê e clica.</p>
  <div class="grid2">
    <div class="chart">
      <div class="ct">Funil de um mês · 17 edições</div>
      <div class="funnel">
        <div class="frow"><div class="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8h20"/></svg></div><div class="fbar" style="width:100%"><span class="fv">~4.282</span><span class="fl">Impressões (aberturas)</span></div></div>
        <div class="frow"><div class="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div><div class="fbar" style="width:62%"><span class="fv">~292</span><span class="fl">Cliques em links</span></div></div>
        <div class="fnote">1 patrocínio principal por edição, sem dividir a atenção com outras marcas.</div>
      </div>
    </div>
    <div class="leadcards">
      <div class="lc"><div class="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div><div><h4>Lê para agir</h4><p>~4.282 aberturas por mês de gente que abre buscando o próximo passo, não distração.</p></div></div>
      <div class="lc"><div class="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg></div><div><h4>Toque diário</h4><p>Uma edição por dia na caixa de entrada: presença recorrente, não um post que some no feed.</p></div></div>
      <div class="lc"><div class="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div><div><h4>Audiência que age</h4><p>Cerca de ~292 cliques por mês nos links das edições.</p></div></div>
    </div>
  </div>
</div></section>

<section><div class="wrap">
  <div class="sec-tag">II · Quem clica é lead de qualidade</div>
  <h2 class="sec-title">Audiência com poder de compra.</h2>
  <p class="sec-intro">41% dos leitores ganham R$5.000 ou mais por mês. Gente que investe em ferramentas, cursos e serviços do setor.</p>
  <div class="incgrid">
    <div class="bars"><div class="bar"><span class="k">R$ 10 mil ou mais</span><span class="track"><span class="fill prem" style="width:5%"></span></span><span class="p">2%</span></div><div class="bar"><span class="k">R$ 5 mil a 10 mil</span><span class="track"><span class="fill prem" style="width:100%"></span></span><span class="p">39%</span></div><div class="bar"><span class="k">R$ 2 mil a 5 mil</span><span class="track"><span class="fill" style="width:64%"></span></span><span class="p">25%</span></div><div class="bar"><span class="k">Até R$ 2 mil</span><span class="track"><span class="fill" style="width:87%"></span></span><span class="p">34%</span></div></div>
    <div class="callout"><div class="big">41%</div><div class="cl">ganham R$ 5 mil ou mais por mês</div><div class="cn">e 2% passam de R$ 10 mil</div></div>
  </div>
</div></section>

<section><div class="wrap">
  <div class="sec-tag">III · Quem lê</div>
  <h2 class="sec-title">Quem compra café e equipamento.</h2>
  <p class="sec-intro">Apaixonados por café especial que gastam com grãos, métodos e máquinas. Público recorrente e fiel ao ritual diário.</p>
  <div class="why"><div class="wcard"><div class="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></div><h4>Baristas caseiros</h4><p>Investem em grãos especiais, moedores e métodos.</p></div><div class="wcard"><div class="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 9h.01M9 13h.01M9 17h.01"/></svg></div><h4>Apreciadores de café especial</h4><p>Compram assinaturas e equipamento premium.</p></div><div class="wcard"><div class="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></div><h4>Ritual diário</h4><p>Abrem todo dia, alta recorrência.</p></div></div>
</div></section>

<section><div class="wrap">
  <div class="sec-tag">IV · Formatos</div>
  <h2 class="sec-title">Três maneiras de aparecer.</h2>
  <div class="formats">
    <div class="fcard"><div class="ft">Destaque</div><h4>Patrocínio Principal</h4><p>Bloco em destaque no topo da edição, na voz da newsletter.</p><ul><li>Até 75 palavras + link</li><li>Logo ou imagem da marca</li><li>Exclusivo: 1 por edição</li></ul><div class="price"><b>Sob consulta</b> · por edição</div></div>
    <div class="fcard"><div class="ft">Nativo</div><h4>Menção Classificada</h4><p>Citação curta no rodapé editorial, leve e recorrente.</p><ul><li>Até 30 palavras + link</li><li>Tom editorial, não banner</li><li>Ideal para presença contínua</li></ul><div class="price"><b>Sob consulta</b> · por edição</div></div>
    <div class="fcard"><div class="ft">Pacote</div><h4>Série / Takeover</h4><p>Presença recorrente ao longo de uma semana inteira.</p><ul><li>5 a 7 edições seguidas</li><li>Patrocínio principal em todas</li><li>Relatório consolidado</li></ul><div class="price"><b>Sob consulta</b> · pacote semanal</div></div>
  </div>
</div></section>

<section><div class="wrap">
  <div class="sec-tag">V · Como funciona</div>
  <h2 class="sec-title">Do briefing ao relatório, em três passos.</h2>
  <div class="steps">
    <div class="step"><div class="n">1</div><h4>Reserva</h4><p>Você escolhe o formato e a data. Confirmamos o slot disponível.</p></div>
    <div class="step"><div class="n">2</div><h4>Aprovação</h4><p>Adaptamos a copy à voz editorial e você aprova antes de ir ao ar.</p></div>
    <div class="step"><div class="n">3</div><h4>No ar + relatório</h4><p>O anúncio sai na edição e você recebe os números de cliques.</p></div>
  </div>
</div></section>

<section class="cta"><div class="wrap">
  <h2>Quer aparecer para<br>essa audiência?</h2>
  <p>Reserve um slot ou peça os valores. Respondemos rápido, com a disponibilidade real do calendário.</p>
  <a class="btn" href="mailto:parcerias@notasdocafe.com.br?subject=Patroc%C3%ADnio%20Notas do Café">Reservar um slot</a>
  <span class="mail">ou escreva para <b>parcerias@notasdocafe.com.br</b></span>
</div></section>

<footer><div class="wrap">
  <div class="net"><b>Notas do Café</b> faz parte do Scriptorium, rede de newsletters com mais de 31 mil leitores somados em dezenas de nichos. Quer um pacote de rede? Fale com a gente.</div>
  <div class="dom">notasdocafe.com.br</div>
</div></footer>
<div class="wrap"><p class="src">Fontes: subscribers e métricas de e-mail via beehiiv (Pharos), soma dos últimos 30 dias, junho/2026. Perfil de renda via pesquisa de inscrição (amostra: 134 respostas). Valores arredondados.</p></div>

</body>
</html>
`;

export function GET() {
  return new Response(HTML, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
