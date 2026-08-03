/**
 * Quiz · O Mapa da Xícara · Notas do Café
 * Réplica leva 2 do golden FI (ticket 15): entrada por reconhecimento,
 * cartões de ciência intercalados, eco das respostas, perfil determinístico
 * (mapa HORIZONTAL, como o golden MD), analyzing que torra a bandeja,
 * teaser com a variável travada.
 * Lastro auditado em 03/08/2026: ABIC e Instituto Axxus 2025 · Cotter,
 * Batali, Ristenpart & Guinard 2021 · Batali, Ristenpart & Guinard 2020 ·
 * Uman e colegas 2016 · Van Doorn, Wuillemin & Spence 2014.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "nc_xicara_result";
  const cfg = window.NC_CONFIG || {};

  function narrativePhase(pct) {
    if (pct < 0.2) return "Abrindo o mapa";
    if (pct < 0.4) return "Lendo a sua xícara";
    if (pct < 0.6) return "Onde o defeito se esconde";
    if (pct < 0.85) return "O gosto que você persegue";
    return "Fechando o diagnóstico";
  }

  /** @type {object[]} */
  const STEPS = [
    /*
      Entrada por reconhecimento: como o café sai da casa da pessoa hoje.
      O título orienta sem interrogar e sem julgar o método (página de
      destino de anúncio). Sem tela fria de idade, cortada no golden.
    */
    {
      id: "p1",
      type: "single",
      label: "Onde tudo começa",
      title: "Como sai o café da sua casa de manhã?",
      why: "Não há resposta certa. Só a que é a sua.",
      entry: true,
      options: [
        { id: "pano", text: "Coador de pano, como sempre foi" },
        { id: "papel", text: "Coador de papel, no suporte ou na elétrica" },
        { id: "capsula", text: "Cápsula, pela pressa da manhã" },
        { id: "balcao", text: "Quase sempre compro pronto, no balcão" },
      ],
    },
    {
      id: "p2",
      type: "single",
      label: "A xícara de hoje",
      title: "E a de hoje, como ela saiu?",
      why: "O defeito que você sente aponta a variável, sem paladar treinado.",
      options: [
        { id: "amarga", text: "Amarga, com aquele arranhado na garganta" },
        { id: "rala", text: "Rala e azeda, sem corpo nenhum" },
        { id: "sem_cheiro", text: "Quente e sem cheiro, café de rotina" },
        { id: "oscila", text: "Boa. Ontem nem tanto" },
      ],
    },
    {
      id: "p3",
      type: "single",
      label: "O alvo",
      title: "Se ela saísse do seu jeito, qual seria o gosto?",
      why: "A resposta nomeia a sua xícara no mapa.",
      options: [
        { id: "rapadura", text: "Doce de rapadura, corpo redondo, sem precisar de açúcar" },
        { id: "pomar", text: "Fruta e flor no cheiro, com brilho na boca" },
        { id: "cacau", text: "Cacau amargo, encorpado, café forte de verdade" },
        { id: "indefinido", text: "Não sei nomear. Só sei quando acerta" },
      ],
    },
    {
      id: "p4",
      type: "single",
      label: "A matéria",
      title: "Como o café entra na sua casa?",
      why: "O que entra no coador decide antes de qualquer ajuste.",
      options: [
        { id: "moido_super", text: "Moído, do supermercado" },
        { id: "moido_loja", text: "Moído na hora, na loja ou na torrefação" },
        { id: "grao_casa", text: "Grão inteiro, e eu moo em casa" },
        { id: "promocao", text: "O que estiver mais em conta na prateleira" },
      ],
    },

    // INFO 1 · absolvição (ABIC e Axxus 2025: 48% não sabem a diferença)
    {
      id: "info1",
      type: "info",
      eyebrow: "O que a pesquisa mostra",
      title: "A confusão está no rótulo, não no seu paladar.",
      body: "Uma pesquisa nacional perguntou a 4.032 consumidores se eles sabiam a diferença entre tradicional, extraforte, superior, gourmet e especial. Quase metade respondeu que não. A prateleira empurra cinco nomes e explica nenhum. Quem escolhe no escuro leva pra casa o que a embalagem decidiu.",
      proof: "ABIC e Instituto Axxus, setembro de 2025 · 4.032 consumidores de café: 48% não sabem a diferença entre os estilos, 33% sabem parcialmente, 19% sabem totalmente.",
      stat: "48%",
      cta: "Continuar",
    },

    {
      id: "p5",
      type: "single",
      label: "O rótulo",
      title: "O que você olha no pacote antes de pagar?",
      why: "Dois campos do rótulo decidem a coada. O resto é decoração.",
      options: [
        { id: "data", text: "A data de torra" },
        { id: "marca", text: "A marca de sempre" },
        { id: "preco", text: "O preço, e só" },
        { id: "torra_escura", text: "Torra escura, porque eu gosto de café forte" },
      ],
    },
    {
      id: "p6",
      type: "multi",
      label: "O que já tentou",
      title: "O que você já tentou pra melhorar a xícara?",
      why: "O que já falhou mostra o que falta: uma variável por vez, com teste.",
      hint: "Marque todas que se aplicam",
      options: [
        { id: "marca", text: "Trocar de marca" },
        { id: "mais_po", text: "Colocar mais pó" },
        { id: "maquina", text: "Comprar cafeteira melhor" },
        { id: "especial", text: "Comprar grão especial, mais caro" },
        { id: "video", text: "Ver vídeo de preparo" },
        { id: "nada", text: "Nada. Faço do mesmo jeito há anos" },
      ],
    },

    // INFO 2 · não existe xícara certa (Cotter 2021) + eco fiel às respostas
    {
      id: "info2",
      type: "info",
      eyebrow: "O gosto tem faixa",
      title: "Não existe xícara certa. Existe a sua.",
      bodyDynamic: "echo_p3_p6",
      body: "Cento e dezoito bebedores de café preto provaram cafés com força e extração diferentes, em sessões controladas. As preferências se espalharam por faixas largas, com grupos de gosto bem distintos entre si. Os autores concluíram que a xícara ideal da tabela oficial precisa ser revista. O seu gosto não é erro de calibragem.",
      proof: "Cotter, Batali, Ristenpart e Guinard, 2021 (Journal of Food Science) · 118 consumidores de café preto: preferências espalhadas por ampla faixa de força e extração, com segmentos distintos de consumidor.",
      stat: "118",
      cta: "Continuar",
    },

    {
      id: "p7",
      type: "single",
      label: "A dose",
      title: "Como você mede o pó?",
      why: "A dose é o que faz a xícara de amanhã sair igual à de hoje.",
      options: [
        { id: "olho", text: "Colher de sopa, no olho" },
        { id: "medidor", text: "O medidor que veio no pacote" },
        { id: "balanca", text: "Balança, sempre a mesma dose" },
        { id: "cor", text: "Vou pela cor da água que desce" },
      ],
    },
    {
      id: "p8",
      type: "single",
      label: "A água",
      title: "E a água, como ela chega no pó?",
      why: "O encontro da água com o pó é a família que você sente primeiro.",
      options: [
        { id: "fervendo", text: "Fervendo, direto da chaleira" },
        { id: "espero", text: "Espero baixar um pouco antes de despejar" },
        { id: "eletrica", text: "Da cafeteira elétrica, não controlo" },
        { id: "termometro", text: "Meço, tenho termômetro na bancada" },
      ],
    },

    // INFO 3 · a variável errada (Batali 2020)
    {
      id: "info3",
      type: "info",
      eyebrow: "A variável que leva a culpa",
      title: "Entre 87 e 93 graus, a temperatura não mudou o sabor.",
      body: "Um painel treinado provou 27 preparos e pontuou 31 atributos. Com a força e a extração mantidas iguais, mudar a água dentro dessa faixa não mexeu no perfil sensorial. O que mexeu foi a quantidade de café dissolvido, ou seja, quanto pó pra quanta água. Água fervendo, a cem graus, fica fora da faixa testada, e é o único ajuste de temperatura que o guia pede.",
      proof: "Batali, Ristenpart e Guinard, 2020 (Scientific Reports) · 12 painelistas treinados, 27 amostras, 31 atributos: sem impacto apreciável da temperatura de preparo entre 87 e 93 °C com força e extração fixas.",
      stat: "87 a 93 °C",
      cta: "Continuar",
    },

    {
      id: "p9",
      type: "multi",
      label: "O que se repete",
      title: "O que aparece na sua xícara com frequência?",
      why: "Cada defeito da lista aponta uma família diferente da coada.",
      hint: "Marque todas que se aplicam",
      options: [
        { id: "amargor", text: "Amargor que fica na garganta" },
        { id: "azedume", text: "Azedume de fruta verde" },
        { id: "pouco_cheiro", text: "Pouco cheiro, quase nenhum" },
        { id: "aguada", text: "Água escura, sem gosto de nada" },
        { id: "nunca_igual", text: "A segunda xícara nunca sai igual à primeira" },
        { id: "nenhuma", text: "Nenhuma dessas" },
      ],
    },

    // INFO 4 · quem manda na extração (Uman 2016)
    {
      id: "info4",
      type: "info",
      eyebrow: "Quem manda na extração",
      title: "O pó comanda. O grão que você tem já serve.",
      body: "Pesquisadores moeram quatro origens diferentes e mediram partícula por partícula. A origem quase não mudou a moagem. A temperatura do grão mudou muito: moído frio, o tamanho médio caiu até 31 por cento e a distribuição ficou mais parelha. Pó parelho extrai parelho, e a água para de escolher caminho fácil dentro do filtro.",
      proof: "Uman e colegas, 2016 (Scientific Reports) · quatro origens e quatro temperaturas de moagem: distribuição de partículas independente da origem e do processo, tamanho modal até 31% menor moendo frio.",
      stat: "31%",
      cta: "Continuar",
    },

    {
      id: "p10",
      type: "single",
      label: "O cheiro",
      title: "Qual cheiro faz você querer a xícara?",
      why: "O nariz decide boa parte do que a boca chama de sabor.",
      options: [
        { id: "rapadura", text: "Pão doce, caramelo, leite quente" },
        { id: "pomar", text: "Fruta madura, flor, casca de laranja" },
        { id: "cacau", text: "Chocolate amargo, torrada, castanha tostada" },
        { id: "indefinido", text: "O cheiro do café passando, sem nome" },
      ],
    },
    {
      id: "p11",
      type: "single",
      label: "O balcão",
      title: "Quanto sai por semana em café comprado fora?",
      why: "A conta do balcão é o retorno do ajuste, medido no seu mês.",
      options: [
        { id: "zero", text: "Nada. Tomo o de casa" },
        { id: "ate20", text: "Até uns 20 reais" },
        { id: "ate60", text: "Entre 20 e 60 reais" },
        { id: "mais60", text: "Mais de 60 reais" },
      ],
    },

    // INFO 5 · percepção é contexto (Van Doorn 2014)
    {
      id: "info5",
      type: "info",
      eyebrow: "A xícara entra na receita",
      title: "A mesma bebida muda de gosto conforme a caneca.",
      body: "Pesquisadores serviram o mesmo café em três canecas: branca, azul e transparente. Na branca, as pessoas avaliaram a bebida como mais intensa e menos doce. Nada mudou dentro da xícara, só em volta dela. Paladar é contexto, e a caneca que você pega no armário faz parte do preparo.",
      proof: "Van Doorn, Wuillemin e Spence, 2014 (Flavour) · o mesmo café servido em caneca branca foi avaliado como mais intenso e menos doce que em caneca transparente ou azul.",
      stat: "3 canecas",
      cta: "Continuar",
    },

    {
      id: "p12",
      type: "single",
      label: "A lembrança",
      title: "Qual xícara você lembra e queria repetir em casa?",
      why: "A xícara que ficou na memória é o alvo do seu ajuste.",
      options: [
        { id: "rapadura", text: "A do bule da casa da avó, doce e forte" },
        { id: "pomar", text: "A da cafeteria, que cheirava a fruta" },
        { id: "cacau", text: "A do balcão da padaria, curta e intensa" },
        { id: "indefinido", text: "Ainda não tomei uma que valesse a lembrança" },
      ],
    },
    {
      id: "p13",
      type: "single",
      label: "Alinhamento",
      title: "A xícara se decide em ajustes que cabem na sua bancada, sem máquina nova. Concorda?",
      why: "Oito variáveis, uma por vez, com a xícara provada no fim de cada uma.",
      options: [
        { id: "concordo", text: "Concordo" },
        { id: "faz_sentido", text: "Faz sentido" },
      ],
    },
    {
      id: "p14",
      type: "single",
      label: "Quando",
      title: "Quando você quer acertar a próxima coada?",
      why: "O ajuste da primeira variável cabe numa manhã, sem compra nenhuma.",
      options: [
        { id: "amanha", text: "Amanhã cedo" },
        { id: "semana", text: "Nesta semana" },
        { id: "mes", text: "Neste mês" },
        { id: "entender", text: "Primeiro quero entender o meu caso" },
      ],
    },
    {
      id: "p15",
      type: "name",
      label: "Personalizar",
      title: "Qual o seu primeiro nome?",
      why: "Somente para o diagnóstico. Nada de spam.",
    },
    { id: "analyzing", type: "analyzing" },
  ];

  const answers = {};
  let stepIndex = 0;
  let analyzingStarted = false;
  let quizStarted = false;
  let backGuardVisible = false;
  let backExitConfirmed = false;

  const el = {
    screen: document.getElementById("screen"),
    progress: document.getElementById("progress"),
    progressFill: document.getElementById("progress-fill"),
    progressLabel: document.getElementById("progress-label"),
    progressPhase: document.getElementById("progress-phase"),
  };

  function isQuestion(step) {
    return step && (step.type === "single" || step.type === "multi" || step.type === "name");
  }

  function questionStepsCount() {
    return STEPS.filter(isQuestion).length;
  }

  function currentQuestionNumber() {
    let n = 0;
    for (let i = 0; i <= stepIndex; i++) {
      if (isQuestion(STEPS[i])) n++;
    }
    return n;
  }

  function updateProgress() {
    const step = STEPS[stepIndex];
    const show = step.type !== "analyzing" && (quizStarted || stepIndex > 0 || answers.p1);
    el.progress.hidden = !show;
    if (!show) return;

    const total = questionStepsCount();
    const current = Math.max(1, currentQuestionNumber());
    const pct = Math.min(100, Math.round((current / total) * 100));
    el.progressFill.style.width = pct + "%";
    if (el.progressLabel) el.progressLabel.textContent = pct + "%";
    if (el.progressPhase) el.progressPhase.textContent = narrativePhase(current / total);
  }

  function track(eventName, params) {
    try {
      if (typeof window.fbq === "function") {
        window.fbq("trackCustom", eventName, params || {});
      }
    } catch (_) {
      /* pixel opcional */
    }
  }

  /* ── beacon do funil ───────────────────────────────────────────
     Espelho fiel do PageBeacon do Next: mesma tabela (lp_page_views), mesmas
     chaves de sessao (vdn_source, vdn_journey, vdn_internal). Como o quiz mora
     no mesmo dominio das LPs, a jornada aberta aqui segue viva na /vsl, no
     checkout e no obrigado, e o report do funil le a corrente inteira. */
  function genId() {
    try {
      if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    } catch (_) {
      /* crypto indisponivel */
    }
    return "j_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function isInternal() {
    try {
      const p = new URLSearchParams(location.search).get("internal");
      if (p === "1") localStorage.setItem("vdn_internal", "1");
      if (p === "0") localStorage.removeItem("vdn_internal");
      return localStorage.getItem("vdn_internal") === "1";
    } catch (_) {
      return false;
    }
  }

  function captureSource() {
    try {
      const src = new URLSearchParams(location.search).get("src");
      if (src && !sessionStorage.getItem("vdn_source")) {
        sessionStorage.setItem("vdn_source", src);
      }
      if (!sessionStorage.getItem("vdn_journey")) {
        sessionStorage.setItem("vdn_journey", genId());
      }
    } catch (_) {
      /* storage bloqueado: beacon ainda manda source=direct */
    }
  }

  function beacon(step, eventType) {
    const url = cfg.supabaseUrl;
    const key = cfg.supabaseAnonKey;
    if (!url || !key) return;
    const type = eventType || "apareceu";
    let journey = null;
    let source = "direct";
    try {
      const k = "lpv_" + cfg.beaconSlug + "_" + step + "_" + type;
      if (sessionStorage.getItem(k)) return; // 1x por jornada
      sessionStorage.setItem(k, "1");
      journey = sessionStorage.getItem("vdn_journey");
      source = sessionStorage.getItem("vdn_source") || "direct";
    } catch (_) {
      /* modo privado: sem dedupe, mas grava */
    }
    fetch(url + "/rest/v1/lp_page_views", {
      method: "POST",
      keepalive: true,
      headers: {
        apikey: key,
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        slug: cfg.beaconSlug,
        funnel_step: step,
        event_type: type,
        source: source,
        journey_id: journey,
        path: location.pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        is_internal: isInternal(),
      }),
    }).catch(function () {
      /* best-effort, nunca quebra o quiz */
    });
  }

  /**
   * Perfil sensorial. Mapa HORIZONTAL: três xícaras-alvo, nenhuma melhor que
   * a outra. Pontuam as três perguntas de gosto (alvo, cheiro, lembrança) e o
   * rótulo escolhido. Empate: Rapadura > Cacau > Pomar.
   */
  function computeProfile(a) {
    const score = { rapadura: 0, pomar: 0, cacau: 0 };
    ["p3", "p10", "p12"].forEach(function (q) {
      const v = a[q];
      if (v && Object.prototype.hasOwnProperty.call(score, v)) score[v] += 2;
    });
    if (a.p5 === "torra_escura") score.cacau += 1;
    if (a.p2 === "amarga") score.rapadura += 1; // quem sofre com amargor persegue doçura

    const ordem = ["rapadura", "cacau", "pomar"];
    let win = ordem[0];
    ordem.forEach(function (k) {
      if (score[k] > score[win]) win = k;
    });
    return { key: win, index: PROFILE_INDEX[win], score: score };
  }

  const PROFILE_INDEX = { rapadura: 1, pomar: 2, cacau: 3 };

  const PROFILE_META = {
    rapadura: {
      name: "Xícara de Rapadura",
      short: "Perfil 1",
      urgency: "Você persegue doçura, e a sua coada entrega amargor antes da hora.",
      message:
        "A sua xícara-alvo é doce de rapadura, com corpo redondo e sem precisar de açúcar pra ficar boa. O que atrapalha esse alvo quase sempre é a água arrancando o amargo antes de a doçura sair, com pó fino demais segurando a água no filtro. Doçura em café não se adiciona, se preserva.",
    },
    pomar: {
      name: "Xícara de Pomar",
      short: "Perfil 2",
      urgency: "Você persegue aroma, e aroma é a primeira coisa que o pó velho perde.",
      message:
        "A sua xícara-alvo tem cheiro de fruta e brilho na boca, o café que anuncia antes de descer. O aroma mora nos compostos que evaporam primeiro, então frescor e moagem mandam mais na sua xícara do que na dos outros perfis. A boa notícia é que as duas variáveis custam zero real.",
    },
    cacau: {
      name: "Xícara de Cacau",
      short: "Perfil 3",
      urgency: "Você persegue intensidade, e intensidade vem da proporção, não da torra.",
      message:
        "A sua xícara-alvo é encorpada, de cacau amargo, o café forte de verdade. O caminho comum pra chegar lá é torra escura, e torra escura entrega gosto de queima, não força. Força vem da proporção, de 1 pra 15 até 1 pra 17, com a moagem acompanhando.",
    },
  };

  /**
   * Família travada. As quatro famílias do guia, na ordem em que ele manda
   * consertar (defeito de família anterior mascara o diagnóstico da seguinte).
   * Empate: Matéria > Superfície > Contato > Constância.
   */
  function computeFamily(a) {
    const p6 = Array.isArray(a.p6) ? a.p6 : [];
    const p9 = Array.isArray(a.p9) ? a.p9 : [];
    const s = { materia: 0, superficie: 0, contato: 0, constancia: 0 };

    if (a.p4 === "moido_super") {
      s.materia += 2;
      s.superficie += 1;
    }
    if (a.p4 === "promocao") s.materia += 2;
    if (a.p4 === "moido_loja") s.materia += 1;
    if (a.p5 === "preco" || a.p5 === "marca") s.materia += 1;
    if (a.p5 === "torra_escura") s.materia += 2;
    if (p9.includes("pouco_cheiro")) s.materia += 2;

    if (p9.includes("amargor")) s.superficie += 1;
    if (p9.includes("aguada")) s.superficie += 2;
    if (a.p4 === "grao_casa") s.superficie += 1;

    if (a.p8 === "fervendo") s.contato += 2;
    if (a.p8 === "eletrica") s.contato += 1;
    if (p9.includes("azedume")) s.contato += 1;
    if (a.p2 === "amarga") s.contato += 1;

    if (a.p7 === "olho" || a.p7 === "cor") s.constancia += 2;
    if (a.p7 === "medidor") s.constancia += 1;
    if (p9.includes("nunca_igual")) s.constancia += 2;
    if (p6.includes("mais_po")) s.constancia += 1;
    if (a.p2 === "oscila") s.constancia += 1;

    const ordem = ["materia", "superficie", "contato", "constancia"];
    let win = ordem[0];
    ordem.forEach(function (k) {
      if (s[k] > s[win]) win = k;
    });
    return { key: win, score: s };
  }

  const FAMILY_META = {
    materia: {
      name: "Matéria",
      what: "o grão, a torra e a guarda do pacote",
      move: "Vire o pacote e leia dois campos: grau de torra e data de torra. Torra média e pacote recente resolvem sozinhos boa parte do que você sente na xícara.",
    },
    superficie: {
      name: "Superfície",
      what: "o tamanho do pó",
      move: "O pó da sua coada precisa de textura de areia grossa entre os dedos. Fino demais segura a água e arranca amargo; grosso demais deixa a água passar sem levar nada.",
    },
    contato: {
      name: "Contato",
      what: "o encontro da água com o pó",
      move: "Tire a chaleira do fogo e conte quarenta segundos com a tampa aberta antes de despejar. O ajuste não custa nada e tira o gosto de queima da xícara.",
    },
    constancia: {
      name: "Constância",
      what: "a dose que repete a xícara de amanhã",
      move: "Troque a colher pela mesma medida todo dia, e anote a proporção que acertou. Sem dose fixa, o acerto de hoje não volta amanhã.",
    },
  };

  function optionLabel(stepId, optionId) {
    const step = STEPS.find((s) => s.id === stepId);
    if (!step || !step.options) return null;
    const opt = step.options.find((o) => o.id === optionId);
    return opt ? opt.text : null;
  }

  function echoFromAnswers() {
    const bits = [];
    if (answers.p3) {
      const t = optionLabel("p3", answers.p3);
      if (t) bits.push(t);
    }
    const p6 = Array.isArray(answers.p6) ? answers.p6 : [];
    p6.forEach((id) => {
      const t = optionLabel("p6", id);
      if (t) bits.push(t);
    });
    return bits.slice(0, 4);
  }

  function saveResult() {
    const profile = computeProfile(answers);
    const family = computeFamily(answers);
    const meta = PROFILE_META[profile.key];
    const fam = FAMILY_META[family.key];
    const name = (answers.p15 || "").trim();
    const payload = {
      name,
      profile: profile.index,
      profileKey: profile.key,
      profileName: meta.name,
      profileMessage: meta.message,
      profileUrgency: meta.urgency,
      familyKey: family.key,
      familyName: fam.name,
      familyWhat: fam.what,
      familyMove: fam.move,
      answers: { ...answers },
      completedAt: new Date().toISOString(),
    };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_) {
      /* modo privado */
    }
    return payload;
  }

  function goTo(index) {
    stepIndex = index;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function next() {
    if (stepIndex < STEPS.length - 1) goTo(stepIndex + 1);
  }

  function shouldGuardBack() {
    return quizStarted || stepIndex > 0 || Object.keys(answers).length > 0;
  }

  function hideBackGuard() {
    const modal = document.getElementById("back-guard");
    if (modal) modal.hidden = true;
    backGuardVisible = false;
  }

  function showBackGuard() {
    let modal = document.getElementById("back-guard");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "back-guard";
      modal.className = "exit-guard";
      modal.hidden = true;
      modal.innerHTML = `
        <div class="exit-guard__panel" role="dialog" aria-modal="true" aria-labelledby="exit-guard-title">
          <p class="eyebrow">Você está quase no fim</p>
          <h2 id="exit-guard-title">Sair agora deixa a sua xícara sem nome e a variável travada sem apontar.</h2>
          <p>Termine o teste e veja o seu perfil antes da coada de amanhã.</p>
          <div class="exit-guard__actions">
            <button type="button" class="btn btn-primary" id="btn-stay-quiz">Continuar meu diagnóstico</button>
            <button type="button" class="btn btn-ghost" id="btn-leave-quiz">Sair mesmo assim</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      document.getElementById("btn-stay-quiz").addEventListener("click", () => {
        hideBackGuard();
        track("QuizBackStay");
      });
      document.getElementById("btn-leave-quiz").addEventListener("click", () => {
        backExitConfirmed = true;
        track("QuizBackLeave");
        window.history.back();
      });
    }
    backGuardVisible = true;
    modal.hidden = false;
    const stay = document.getElementById("btn-stay-quiz");
    if (stay) stay.focus({ preventScroll: true });
    track("QuizBackGuardView", { step: STEPS[stepIndex] ? STEPS[stepIndex].id : "" });
  }

  function initBackGuard() {
    try {
      window.history.replaceState({ quizGuardBase: true }, "");
      window.history.pushState({ quizGuard: true }, "");
    } catch (_) {
      return;
    }

    window.addEventListener("popstate", () => {
      if (backExitConfirmed || !shouldGuardBack()) return;
      try {
        window.history.pushState({ quizGuard: true }, "");
      } catch (_) {
        /* sem suporte */
      }
      if (!backGuardVisible) showBackGuard();
    });
  }

  /** Selo da casa: símbolo real da NC (mesmo padrão do golden FI). */
  function pathMark(size) {
    const s = size || 26;
    return `<img class="mark" src="/ebook-web/simbolo.png" width="${s}" height="${s}" alt="" aria-hidden="true" />`;
  }

  function whyLine(step) {
    if (!step.why) return "";
    return `<p class="why-line">${escapeHtml(step.why)}</p>`;
  }

  function renderInfo(step) {
    let echoHtml = "";
    if (step.bodyDynamic === "echo_p3_p6") {
      const bits = echoFromAnswers();
      if (bits.length) {
        echoHtml = `<p class="info-echo">Você marcou: <strong>${escapeHtml(bits.join(" · "))}</strong></p>`;
      }
    }

    el.screen.innerHTML = `
      <div class="card info-card">
        <p class="eyebrow">${escapeHtml(step.eyebrow || "")}</p>
        ${step.stat ? `<div class="stat">${escapeHtml(step.stat)}</div>` : ""}
        <h2 class="info-title">${escapeHtml(step.title)}</h2>
        ${echoHtml}
        <p class="info-body">${escapeHtml(step.body || "")}</p>
        ${step.proof ? `<p class="info-proof">${escapeHtml(step.proof)}</p>` : ""}
        <div class="actions">
          <button type="button" class="btn btn-primary" id="btn-info">${escapeHtml(step.cta || "Continuar")}</button>
        </div>
      </div>
    `;
    document.getElementById("btn-info").addEventListener("click", next);
  }

  function renderSingle(step) {
    const selected = answers[step.id];
    /*
      A entrada orienta antes de perguntar: quem chega do anúncio ainda não
      sabe o que é O Mapa da Xícara. O título declara, o vídeo aprofunda.
      Fala da xícara, nunca do gosto de quem lê.
    */
    el.screen.innerHTML = `
      ${step.entry ? `
        <div class="brand">
          ${pathMark(26)}
          <span><b>Notas do Café</b> · O Mapa da Xícara</span>
        </div>
        <header class="entry-head">
          <h1 class="entry-title">Toda xícara tem um alvo. <em>A sua tem nome.</em></h1>
          <p class="entry-kicker">Teste anônimo de 2 minutos. No fim você vê qual é a sua xícara, rapadura, pomar ou cacau, e qual variável da coada está no caminho dela.</p>
        </header>` : ""}
      <div class="card${step.entry ? " card--flush" : ""}">
        <p class="q-label">${escapeHtml(step.label || "")}</p>
        <h2 class="q-title">${escapeHtml(step.title)}</h2>
        ${whyLine(step)}
        <div class="options" role="radiogroup" aria-label="${escapeAttr(step.title)}">
          ${step.options
            .map(
              (o) => `
            <button type="button" class="opt ${selected === o.id ? "is-selected" : ""}" data-id="${escapeAttr(o.id)}" role="radio" aria-checked="${selected === o.id}">
              <span class="txt">${escapeHtml(o.text)}</span>
              <span class="mark" aria-hidden="true"></span>
            </button>`
            )
            .join("")}
        </div>
      </div>
      ${step.entry
          ? `<p class="micro micro-center entry-legal">Com base em pesquisa de consumo brasileira e em estudos publicados sobre preparo e percepção. Aqui ninguém julga o seu café.</p>`
          : ""}
    `;
    el.screen.querySelectorAll(".opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        answers[step.id] = btn.getAttribute("data-id");
        btn.classList.add("is-selected");
        if (step.entry && !quizStarted) {
          quizStarted = true;
          track("QuizStart", { first: answers[step.id] });
          beacon("quiz-start", "converteu");
        }
        setTimeout(next, 180);
      });
    });
  }

  function renderMulti(step) {
    const selected = new Set(Array.isArray(answers[step.id]) ? answers[step.id] : []);
    el.screen.innerHTML = `
      <div class="card">
        <p class="q-label">${escapeHtml(step.label || "")}</p>
        <h2 class="q-title">${escapeHtml(step.title)}</h2>
        ${whyLine(step)}
        ${step.hint ? `<p class="hint-line">${escapeHtml(step.hint)}</p>` : ""}
        <div class="options">
          ${step.options
            .map(
              (o) => `
            <button type="button" class="opt is-multi ${selected.has(o.id) ? "is-selected" : ""}" data-id="${escapeAttr(o.id)}" aria-pressed="${selected.has(o.id)}">
              <span class="txt">${escapeHtml(o.text)}</span>
              <span class="mark" aria-hidden="true"></span>
            </button>`
            )
            .join("")}
        </div>
        <div class="actions">
          <button type="button" class="btn btn-primary" id="btn-multi-next" ${selected.size === 0 ? "disabled" : ""}>Continuar</button>
        </div>
      </div>
    `;

    const nextBtn = document.getElementById("btn-multi-next");
    el.screen.querySelectorAll(".opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        // opções exclusivas: marcar uma delas limpa o resto, e vice-versa
        if (id === "nada" || id === "nenhuma") {
          selected.clear();
          selected.add(id);
        } else {
          selected.delete("nada");
          selected.delete("nenhuma");
          if (selected.has(id)) selected.delete(id);
          else selected.add(id);
        }
        answers[step.id] = Array.from(selected);
        renderMulti(step);
      });
    });
    nextBtn.addEventListener("click", () => {
      if (selected.size === 0) return;
      answers[step.id] = Array.from(selected);
      next();
    });
  }

  function renderName(step) {
    const value = answers.p15 || "";
    el.screen.innerHTML = `
      <div class="card">
        <p class="q-label">${escapeHtml(step.label || "")}</p>
        <h2 class="q-title">${escapeHtml(step.title)}</h2>
        ${whyLine(step)}
        <div class="field">
          <label for="name-input">Primeiro nome</label>
          <input id="name-input" type="text" autocomplete="given-name" maxlength="40" placeholder="Ex.: Rafael" value="${escapeAttr(value)}" />
        </div>
        <div class="actions">
          <button type="button" class="btn btn-primary" id="btn-name-next" ${value.trim().length >= 2 ? "" : "disabled"}>Ver a minha xícara</button>
        </div>
      </div>
    `;
    const input = document.getElementById("name-input");
    const btn = document.getElementById("btn-name-next");
    const sync = () => {
      answers.p15 = input.value;
      btn.disabled = input.value.trim().length < 2;
    };
    input.addEventListener("input", sync);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !btn.disabled) btn.click();
    });
    btn.addEventListener("click", () => {
      const v = input.value.trim();
      if (v.length < 2) return;
      answers.p15 = v;
      next();
    });
    setTimeout(() => input.focus(), 50);
  }

  function renderAnalyzing() {
    const result = saveResult();
    const name = result.name || "leitor";
    track("QuizComplete", { profile: result.profileKey, family: result.familyKey });
    beacon("quiz-fim");

    const beans = Array.from({ length: 16 }, (_, i) => `<i data-b="${i}"></i>`).join("");

    el.screen.innerHTML = `
      <div class="card analyzing">
        <div class="roast-tray" id="tray" aria-hidden="true">${beans}</div>
        <p class="tray-label" id="tray-label">Lendo as suas respostas</p>
        <h1 class="analyzing-title">Fechando a sua xícara, ${escapeHtml(name)}.</h1>

        <div class="build-bars" id="build-bars">
          <div class="build-row" data-i="0">
            <div class="build-meta"><span>O gosto que você persegue</span><span class="build-pct">0%</span></div>
            <div class="build-track"><i></i></div>
          </div>
          <div class="build-row" data-i="1">
            <div class="build-meta"><span>O defeito que se repete</span><span class="build-pct">0%</span></div>
            <div class="build-track"><i></i></div>
          </div>
          <div class="build-row" data-i="2">
            <div class="build-meta"><span>A família travada</span><span class="build-pct">0%</span></div>
            <div class="build-track"><i></i></div>
          </div>
          <div class="build-row" data-i="3">
            <div class="build-meta"><span>O primeiro ajuste da sua coada</span><span class="build-pct">0%</span></div>
            <div class="build-track"><i></i></div>
          </div>
        </div>

        <div class="ready-block" id="ready-block">
          <p class="profile-label">Sua xícara · ${escapeHtml(result.profileName.replace("Xícara de ", ""))}</p>
          <p class="profile-name">${escapeHtml(result.profileName)}</p>
          <p class="profile-urgency">${escapeHtml(result.profileUrgency)}</p>
          <p class="profile-msg">${escapeHtml(result.profileMessage)}</p>
          <p class="note-warn">Família travada: <b>${escapeHtml(result.familyName)}</b>, ${escapeHtml(result.familyWhat)}. No vídeo: por que a sua xícara sai assim e qual ajuste entra já na próxima coada.</p>
          <div class="actions">
            <a class="btn btn-primary" id="btn-vsl" href="/vsl?src=quiz">Quero ver o ajuste</a>
          </div>
        </div>
      </div>
    `;

    const trayLabels = [
      "Lendo as suas respostas",
      "Cruzando com as quatro famílias",
      "Achando a variável travada",
      "A xícara fechou",
    ];

    function litRow(row) {
      const beansEl = document.querySelectorAll("#tray i");
      for (let i = 0; i < beansEl.length; i++) {
        if (Math.floor(i / 4) <= row) beansEl[i].classList.add("on");
        if (row >= 3) beansEl[i].classList.add("gold");
      }
      const lab = document.getElementById("tray-label");
      if (lab) lab.textContent = trayLabels[Math.min(row, 3)];
    }

    if (analyzingStarted) {
      document.querySelectorAll(".build-row").forEach((row) => {
        row.classList.add("is-done");
        row.querySelector(".build-track i").style.width = "100%";
        row.querySelector(".build-pct").textContent = "100%";
      });
      litRow(3);
      document.getElementById("ready-block").classList.add("is-visible");
      return;
    }
    analyzingStarted = true;

    const rows = document.querySelectorAll(".build-row");
    const startAt = [400, 1100, 1900, 2700];
    const duration = 900;

    rows.forEach((row, i) => {
      const bar = row.querySelector(".build-track i");
      const pctEl = row.querySelector(".build-pct");
      setTimeout(() => {
        const from = performance.now();
        function tick(now) {
          const t = Math.min(1, (now - from) / duration);
          const ease = 1 - Math.pow(1 - t, 3);
          const v = Math.round(100 * ease);
          bar.style.width = v + "%";
          pctEl.textContent = v + "%";
          if (t < 1) requestAnimationFrame(tick);
          else {
            row.classList.add("is-done");
            litRow(i);
          }
        }
        requestAnimationFrame(tick);
      }, startAt[i]);
    });

    setTimeout(() => {
      litRow(3);
      document.getElementById("ready-block").classList.add("is-visible");
    }, 3800);
  }

  function render() {
    const step = STEPS[stepIndex];
    updateProgress();
    el.screen.className = "screen is-active";

    switch (step.type) {
      case "info":
        renderInfo(step);
        break;
      case "single":
        renderSingle(step);
        break;
      case "multi":
        renderMulti(step);
        break;
      case "name":
        renderName(step);
        break;
      case "analyzing":
        renderAnalyzing();
        break;
      default:
        el.screen.innerHTML = "<p>Erro de etapa.</p>";
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, "&#39;");
  }

  function initPixel() {
    const id = cfg.metaPixelId;
    if (!id) return;
    if (window.fbq) return;
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", id);
    window.fbq("track", "PageView");
  }

  initPixel();
  captureSource();
  beacon("quiz");
  initBackGuard();
  render();
})();
