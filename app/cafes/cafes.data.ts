// SOT dos grãos recomendados nas edições do Notas do Café.
// Sem link de produto fixo: estoque de microlote é instável (foi por isso que grão ficou
// fora do /produtos). Cada card abre uma BUSCA por perfil no Mercado Livre, sempre as
// ofertas vivas no estoque, nunca um link quebrado. Espelha o padrão do /produtos.
//
// ÚNICO ponto de controle do link de compra de café: as edições mandam o leitor pra
// /cafes#<slug>, NUNCA direto pro varejista. Se um link quebrar, conserta-se 1 página,
// não N emails. Edição nova que recomenda café: adicionar o grão aqui (com edicao=NNN)
// e rodar _shared/scripts/fix_cafe_links.py no HTML.

export interface Cafe {
  slug: string;
  name: string;
  regiao?: string;
  q: string; // query de busca (perfil do grão)
  edicao: string;
}

const stripAccents = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const RETAILER = {
  label: "Mercado Livre",
  search: (q: string) =>
    `https://lista.mercadolivre.com.br/${stripAccents(q)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}`,
};

// Mais recentes primeiro.
export const CAFES: Cafe[] = [
  // Edições 040 a 114 (fnx/333): o slug é o da edição, que é a âncora que o email já manda.
  // O catálogo tinha parado na 039 e 75 links de compra caíam no topo da página.
  { slug: "arara-carmo-de-minas-sul-de-minas-natural-terreiro-suspenso-torra-media-v60-93-graus-proporcao-1-13-1-16-1-18-250g", name: "Arara de Carmo de Minas", regiao: "Mantiqueira de Minas", q: "arara de carmo de minas mantiqueira de minas 250g cafe especial", edicao: "114" },
  { slug: "vietna-robusta-planalto-central-dak-lak-doi-moi-1986-canefora-buon-ma-thuot-natural-phin-96-graus-250g", name: "Robusta de Buôn Ma Thuột", q: "robusta de buon ma thuot 250g cafe especial", edicao: "113" },
  { slug: "cerrado-mineiro-denominacao-de-origem-inpi-2013-55-municipios-catuai-amarelo-patrocinio-natural-prensa-francesa-93-graus-250g", name: "Catuaí Amarelo de Patrocínio", regiao: "Cerrado Mineiro", q: "catuai amarelo de patrocinio cerrado mineiro 250g cafe especial", edicao: "112" },
  { slug: "cooxupe-guaxupe-1932-cooperativa-sul-de-minas-cerrado-mundo-novo-cereja-descascado-v60-94-graus-250g", name: "Mundo Novo de Guaxupé", regiao: "Sul de Minas", q: "mundo novo de guaxupe sul de minas 250g cafe especial", edicao: "111" },
  { slug: "fim-das-quotas-1989-acordo-internacional-do-cafe-organizacao-internacional-do-cafe-catuai-amarelo-cerrado-mineiro-patrocinio-prensa-francesa-93-graus-250g", name: "Catuaí Amarelo de Patrocínio", regiao: "Cerrado Mineiro", q: "catuai amarelo de patrocinio cerrado mineiro 250g cafe especial", edicao: "110" },
  { slug: "queima-do-cafe-1931-1944-78-milhoes-de-sacas-departamento-nacional-do-cafe-bourbon-vermelho-alta-mogiana-franca-coador-de-pano-94-graus-250g", name: "Bourbon Vermelho de Franca", regiao: "Alta Mogiana paulista", q: "bourbon vermelho de franca alta mogiana paulista 250g cafe especial", edicao: "109" },
  { slug: "bourbon-amarelo-carmo-de-minas-mantiqueira-primeiro-crack-196-graus-fase-de-desenvolvimento-segundo-estalo-224-graus-v60-92-graus-250g", name: "Bourbon Amarelo de Carmo de Minas", regiao: "Serra da Mantiqueira", q: "bourbon amarelo de carmo de minas serra da mantiqueira 250g cafe especial", edicao: "108" },
  { slug: "obata-iac-1669-20-piata-chapada-diamantina-ferrugem-hemileia-vastatrix-1970-bahia-chemex-94-graus-250g", name: "Obatã IAC 1669-20 de Piatã", regiao: "Chapada Diamantina", q: "obata iac 1669-20 de piata chapada diamantina 250g cafe especial", edicao: "107" },
  { slug: "mundo-novo-garca-alta-paulista-broca-do-cafe-hypothenemus-hampei-prorops-nasuta-uganda-1929-v60-92-graus-250g", name: "Mundo Novo IAC 379-19 de Garça", regiao: "Alta Paulista", q: "mundo novo iac 379-19 de garca alta paulista 250g cafe especial", edicao: "106" },
  { slug: "catuai-amarelo-piumhi-tipo-6-defeitos-pva-300-gramas-tabela-oficial-brasileira-coado-papel-90-graus-250g", name: "Catuaí Amarelo IAC 62 de Piumhi", q: "catuai amarelo iac 62 de piumhi 250g cafe especial", edicao: "105" },
  { slug: "mundo-novo-alem-paraiba-riado-terreiro-de-terra-escala-de-bebida-cezve-turco-92-graus-250g", name: "Mundo Novo de Além Paraíba", q: "mundo novo de alem paraiba 250g cafe especial", edicao: "104" },
  { slug: "catuai-vermelho-carmo-da-cachoeira-grao-concha-catacao-manual-aeropress-88-graus-250g", name: "Catuaí Vermelho de Carmo da Cachoeira", q: "catuai vermelho de carmo da cachoeira 250g cafe especial", edicao: "103" },
  { slug: "bourbon-amarelo-carmo-de-minas-cup-of-excellence-cereja-descascado-chemex-94-graus-250g", name: "Bourbon Amarelo da Mantiqueira de Minas", q: "bourbon amarelo da mantiqueira de minas 250g cafe especial", edicao: "102" },
  { slug: "mundo-novo-alta-mogiana-terra-roxa-basalto-ribeirao-preto-natural-v60-92-graus-250g", name: "Mundo Novo da Alta Mogiana", q: "mundo novo da alta mogiana 250g cafe especial", edicao: "101" },
  { slug: "cascara-catuai-vermelho-carmo-de-minas-mantiqueira-casca-seca-de-cereja-infusao-novel-food-2022-250ml", name: "Cascara de Catuaí Vermelho da Mantiqueira de Minas", q: "cascara de catuai vermelho da mantiqueira de minas 250g cafe especial", edicao: "100" },
  { slug: "conilon-rondonia-solubilizado-norte-do-parana-londrina-bateria-de-extracao-liofilizado-atomizado-200ml", name: "Conilon de Rondônia", q: "conilon de rondonia 250g cafe especial", edicao: "099" },
  { slug: "catuai-vermelho-patrocinio-cerrado-mineiro-selo-de-pureza-abic-1989-torrado-e-moido-pqc-melitta-102", name: "Catuaí Vermelho de Patrocínio", q: "catuai vermelho de patrocinio 250g cafe especial", edicao: "098" },
  { slug: "mundo-novo-carmo-de-minas-sul-de-minas-recepa-esqueletamento-lavoura-velha-cereja-descascado-chemex", name: "Mundo Novo de lavoura recepada em Carmo de Minas", q: "mundo novo de lavoura recepada em carmo de minas 250g cafe especial", edicao: "097" },
  { slug: "catuai-amarelo-cerrado-patrocinio-colheita-mecanizada-derricadeira-vibracao-haste-separacao-v60", name: "Catuaí Amarelo do chapadão de Patrocínio", q: "catuai amarelo do chapadao de patrocinio 250g cafe especial", edicao: "096" },
  { slug: "bourbon-ruanda-huye-defeito-batata-percevejo-antestia-pirazina-ipmp-chemex", name: "Bourbon vermelho das colinas de Huye", q: "bourbon vermelho das colinas de huye 250g cafe especial", edicao: "095" },
  { slug: "coffea-stenophylla-serra-leoa-cereja-preta-reencontro-2018-prova-as-cegas-2021-v60", name: "Coffea stenophylla de Serra Leoa", q: "coffea stenophylla de serra leoa 250g cafe especial", edicao: "094" },
  { slug: "monsooned-malabar-aa-costa-oeste-india-mangalore-armazem-aberto-mocao-moka", name: "Monsooned Malabar AA da costa oeste da Índia", q: "monsooned malabar aa da costa oeste da india 250g cafe especial", edicao: "093" },
  { slug: "oeiras-mg-6851-natural-espera-feliz-matas-de-minas-talhao-pequeno-tres-geracoes-hario-switch", name: "Oeiras MG 6851 de talhão pequeno em Espera Feliz", q: "oeiras mg 6851 de talhao pequeno em espera feliz 250g cafe especial", edicao: "092" },
  { slug: "siriema-vc4-natural-divisa-nova-sul-de-minas-sitio-familiar-tres-irmaos-prensa-francesa", name: "Siriema VC4 de sítio familiar em Divisa Nova", q: "siriema vc4 de sitio familiar em divisa nova 250g cafe especial", edicao: "091" },
  { slug: "bourbon-amarelo-natural-guaxupe-sul-de-minas-sitio-familiar-mesa-de-xicaras-chemex", name: "Bourbon Amarelo de sítio familiar em Guaxupé", q: "bourbon amarelo de sitio familiar em guaxupe 250g cafe especial", edicao: "090" },
  { slug: "catuai-vermelho-enxertado-conilon-apoata-brejetuba-montanhas-espirito-santo-clever", name: "Catuaí Vermelho de sítio familiar em Brejetuba", q: "catuai vermelho de sitio familiar em brejetuba 250g cafe especial", edicao: "089" },
  { slug: "sacramento-mg1-ponto-passa-alto-paranaiba-cerrado-mineiro-kalita-wave", name: "Sacramento MG1 em ponto passa de pequeno produtor do Alto Paranaíba", regiao: "Minas Gerais", q: "sacramento mg1 em ponto passa de pequeno produtor do alto paranaiba minas gerais 250g cafe especial", edicao: "088" },
  { slug: "arara-natural-talhao-de-morro-carmo-da-cachoeira-sul-de-minas-kalita-wave", name: "Arara natural de talhão de morro em Carmo da Cachoeira", regiao: "Minas Gerais", q: "arara natural de talhao de morro em carmo da cachoeira minas gerais 250g cafe especial", edicao: "087" },
  { slug: "catuai-vermelho-peneira-14-tres-coracoes-sul-de-minas-terreiro-v60", name: "Catuaí Vermelho de peneira 14 de sítio familiar em Três Corações", regiao: "Minas Gerais", q: "catuai vermelho de peneira 14 de sitio familiar em tres coracoes minas gerais 250g cafe especial", edicao: "086" },
  { slug: "obata-amarelo-garca-alta-paulista-natural-terreiro-moka", name: "Obatã Amarelo natural de sítio familiar em Garça", q: "obata amarelo natural de sitio familiar em garca 250g cafe especial", edicao: "085" },
  { slug: "araponga-mg1-caratinga-matas-de-minas-natural-terreiro-aeropress", name: "Araponga MG1 de sítio familiar colhido a 900 metros em Caratinga", q: "araponga mg1 de sitio familiar colhido a 900 metros em caratinga 250g cafe especial", edicao: "084" },
  { slug: "asa-branca-cerrado-distrito-federal-natural-terreiro-cafeteira-eletrica", name: "Asa Branca de lavoura familiar colhido a 1.100 metros no cerrado", q: "asa branca de lavoura familiar colhido a 1.100 metros no cerrado 250g cafe especial", edicao: "083" },
  { slug: "typica-remanescente-70-anos-sul-de-minas-cereja-descascado-melitta-103", name: "Typica remanescente colhido num talhão de meio hectare no Sul de Minas", q: "typica remanescente colhido num talhao de meio hectare no sul de minas 250g cafe especial", edicao: "082" },
  { slug: "catuai-amarelo-cerrado-mineiro-lavado-natural-mesmo-lote-v60", name: "Catuaí Amarelo cultivado no Cerrado Mineiro", q: "catuai amarelo cultivado no cerrado mineiro 250g cafe especial", edicao: "081" },
  { slug: "castillo-lavado-narino-canion-juanambu-marquesina-hario-switch", name: "Castillo lavado cultivado nas encostas do cânion do Juanambú", q: "castillo lavado cultivado nas encostas do canion do juanambu 250g cafe especial", edicao: "080" },
  { slug: "bourbon-vermelho-triunfo-pernambuco-brejo-de-altitude-hario-switch", name: "Bourbon Vermelho cultivado em Triunfo", q: "bourbon vermelho cultivado em triunfo 250g cafe especial", edicao: "079" },
  { slug: "sidra-equatoriano-patrocinio-cerrado-mineiro-sifao-de-vidro", name: "Sidra cultivado em Patrocínio", q: "sidra cultivado em patrocinio 250g cafe especial", edicao: "078" },
  { slug: "eugenioides-brasileiro-especie-mae-do-arabica-hario-switch", name: "Coffea eugenioides cultivado no Brasil a partir de mudas trazidas", q: "coffea eugenioides cultivado no brasil a partir de mudas trazidas 250g cafe especial", edicao: "077" },
  { slug: "natural-cerrado-mineiro-filtro-papel-pano-metal", name: "Natural do Cerrado Mineiro", q: "natural do cerrado mineiro 250g cafe especial", edicao: "076" },
  { slug: "catuai-amarelo-agua-mineral-residuo-seco-calcio", name: "Catuaí Amarelo do Sul de Minas", q: "catuai amarelo do sul de minas 250g cafe especial", edicao: "075" },
  { slug: "catuai-data-de-torra-janela-de-pico", name: "Catuaí do Sul de Minas", q: "catuai do sul de minas 250g cafe especial", edicao: "074" },
  { slug: "catuai-amarelo-regua-da-moagem", name: "Catuaí Amarelo do Sul de Minas", q: "catuai amarelo do sul de minas 250g cafe especial", edicao: "073" },
  { slug: "icatu-tres-pontas-torra-media-escura", name: "Icatu Vermelho de Três Pontas", regiao: "Sul de Minas", q: "icatu vermelho de tres pontas sul de minas 250g cafe especial", edicao: "072" },
  { slug: "rubi-mg1-alta-mogiana-barril-carvalho", name: "Rubi MG1 da Alta Mogiana paulista", q: "rubi mg1 da alta mogiana paulista 250g cafe especial", edicao: "071" },
  { slug: "iapar-59-norte-pioneiro-parana", name: "IAPAR 59 do Norte Pioneiro do Paraná", q: "iapar 59 do norte pioneiro do parana 250g cafe especial", edicao: "070" },
  { slug: "catuai-koji-caconde", name: "Catuaí Amarelo de Caconde (SP)", q: "catuai amarelo de caconde 250g cafe especial", edicao: "069" },
  { slug: "wush-wush-mantiqueira", name: "Wush Wush de lavoura pequena da Serra da Mantiqueira (MG)", q: "wush wush de lavoura pequena da serra da mantiqueira 250g cafe especial", edicao: "068" },
  { slug: "java-serra-da-mantiqueira", name: "Java de lavoura de altitude da Serra da Mantiqueira (MG)", q: "java de lavoura de altitude da serra da mantiqueira 250g cafe especial", edicao: "067" },
  { slug: "mgs-ametista-manhuacu", name: "MGS Ametista natural de Manhuaçu (MG)", q: "mgs ametista natural de manhuacu 250g cafe especial", edicao: "066" },
  { slug: "pau-brasil-mg1-serra-da-canastra", name: "Pau-Brasil MG1 natural da Serra da Canastra (MG)", q: "pau-brasil mg1 natural da serra da canastra 250g cafe especial", edicao: "065" },
  { slug: "sabia-398-campo-das-vertentes", name: "Sabiá 398 natural do Campo das Vertentes (MG)", q: "sabia 398 natural do campo das vertentes 250g cafe especial", edicao: "064" },
  { slug: "robusta-agroflorestal-apui", name: "Robusta agroflorestal de Apuí (AM)", q: "robusta agroflorestal de apui 250g cafe especial", edicao: "063" },
  { slug: "hibrido-de-timor-serra-do-brigadeiro", name: "Híbrido de Timor natural da Serra do Brigadeiro (MG)", q: "hibrido de timor natural da serra do brigadeiro 250g cafe especial", edicao: "062" },
  { slug: "acaua-oeste-da-bahia", name: "Acauã natural do oeste da Bahia (BA)", q: "acaua natural do oeste da bahia 250g cafe especial", edicao: "061" },
  { slug: "tupi-cerrado-baiano", name: "Tupi do Cerrado Baiano (oeste da BA)", q: "tupi do cerrado baiano 250g cafe especial", edicao: "060" },
  { slug: "ouro-verde-pocos-de-caldas", name: "Ouro Verde da caldeira vulcânica de Poços de Caldas (Sul de MG)", q: "ouro verde da caldeira vulcanica de pocos de caldas 250g cafe especial", edicao: "059" },
  { slug: "mundo-novo-serra-fluminense", name: "Mundo Novo da Serra Fluminense (RJ)", q: "mundo novo da serra fluminense 250g cafe especial", edicao: "058" },
  { slug: "rubi-mg1-sul-de-minas", name: "Rubi MG1 do Sul de Minas", q: "rubi mg1 do sul de minas 250g cafe especial", edicao: "057" },
  { slug: "grao-moca-espirito-santo-pinhal", name: "Grão moca (peaberry) de Espírito Santo do Pinhal", q: "grao moca de espirito santo do pinhal 250g cafe especial", edicao: "056" },
  { slug: "caturra-vermelho-mantiqueira-encosta", name: "Caturra Vermelho da Serra da Mantiqueira", q: "caturra vermelho da serra da mantiqueira 250g cafe especial", edicao: "055" },
  { slug: "catuai-vermelho-piata-terreiro-suspenso", name: "Catuaí Vermelho da Chapada Diamantina baiana", q: "catuai vermelho da chapada diamantina baiana 250g cafe especial", edicao: "054" },
  { slug: "catucai-amarelo-poco-fundo", name: "Catucaí Amarelo de lavoura familiar em Poço Fundo", regiao: "Sul de Minas", q: "catucai amarelo de lavoura familiar em poco fundo sul de minas 250g cafe especial", edicao: "053" },
  { slug: "catigua-mg2-serra-do-salitre", name: "Catiguá MG2 da Serra do Salitre", q: "catigua mg2 da serra do salitre 250g cafe especial", edicao: "052" },
  { slug: "aramosa-chapadoes-goias", name: "Aramosa dos Chapadões de Goiás", q: "aramosa dos chapadoes de goias 250g cafe especial", edicao: "051" },
  { slug: "catuai-vermelho-alto-jequitiba", name: "Catuaí Vermelho de sítio familiar no Alto Jequitibá", q: "catuai vermelho de sitio familiar no alto jequitiba 250g cafe especial", edicao: "050" },
  { slug: "conilon-encapuzado-espirito-santo", name: "Conilon fino de fazenda familiar capixaba", q: "conilon fino de fazenda familiar capixaba 250g cafe especial", edicao: "049" },
  { slug: "catuai-alta-mogiana-franca", name: "Catuaí Vermelho de fazenda familiar na Alta Mogiana paulista", q: "catuai vermelho de fazenda familiar na alta mogiana paulista 250g cafe especial", edicao: "048" },
  { slug: "catuai-do-caparao-cooperativa", name: "Catuaí Vermelho de sítio pequeno no Caparaó capixaba", q: "catuai vermelho de sitio pequeno no caparao capixaba 250g cafe especial", edicao: "047" },
  { slug: "catuai-de-quintal-zona-da-mata", name: "Catuaí Vermelho de sítio familiar na Zona da Mata Mineira", q: "catuai vermelho de sitio familiar na zona da mata mineira 250g cafe especial", edicao: "046" },
  { slug: "cafe-de-piata-chapada", name: "Arábica de altitude de Piatã", regiao: "Chapada Diamantina (BA)", q: "arabica de altitude de piata chapada diamantina (ba) 250g cafe especial", edicao: "045" },
  { slug: "cafe-sombra-de-baturite", name: "Arábica centenário sombreado", q: "arabica centenario sombreado 250g cafe especial", edicao: "044" },
  { slug: "caturra-do-caparao", name: "Caturra de altitude (mutação anã do Bourbon)", q: "caturra de altitude 250g cafe especial", edicao: "043" },
  { slug: "cafe-do-jacu-pedra-azul", name: "Café do Jacu (fermentação natural pela ave)", q: "cafe do jacu 250g cafe especial", edicao: "042" },
  { slug: "robusta-amazonico-matas-de-rondonia", name: "Robusta Amazônico (canéfora clonal)", q: "robusta amazonico 250g cafe especial", edicao: "041" },
  { slug: "pacamara-norte-pioneiro-parana", name: "Pacamara (híbrido Pacas x Maragogipe)", q: "pacamara 250g cafe especial", edicao: "040" },
  { slug: "acaia-descascado-chapada-de-minas", name: "Acaiá Descascado", regiao: "Chapada de Minas", q: "acaia descascado cereja descascada chapada de minas 250g cafe especial", edicao: "039" },
  { slug: "catuai-maceracao-carbonica-alta-mogiana", name: "Catuaí Maceração Carbônica", regiao: "Alta Mogiana", q: "catuai vermelho maceracao carbonica alta mogiana 250g cafe especial", edicao: "038" },
  { slug: "laurina-bourbon-pointu", name: "Laurina (Bourbon Pointu)", q: "cafe laurina bourbon pointu especial 250g", edicao: "037" },
  { slug: "maragogipe-norte-pioneiro-do-parana", name: "Maragogipe", regiao: "Norte Pioneiro do Paraná", q: "cafe maragogipe norte pioneiro parana 250g cafe especial", edicao: "036" },
  { slug: "mundo-novo-bourbon-natural-sul-de-minas", name: "Mundo Novo + Bourbon Natural", regiao: "Sul de Minas", q: "mundo novo bourbon natural sul de minas 250g cafe especial", edicao: "035" },
  { slug: "arara-cerrado-mineiro", name: "Arara", regiao: "Cerrado Mineiro", q: "arara cerrado mineiro 250g cafe especial", edicao: "034" },
  { slug: "bourbon-mantiqueira", name: "Bourbon", regiao: "Mantiqueira", q: "bourbon mantiqueira 250g cafe especial", edicao: "033" },
  { slug: "catuai-amarelo-honey-bahia", name: "Catuaí Amarelo Honey", regiao: "Bahia", q: "catuai amarelo honey bahia 250g cafe especial", edicao: "032" },
  { slug: "sl28-microlote-brasil", name: "SL28 Microlote", regiao: "Brasil", q: "sl28 brasil cafe especial 250g microlote", edicao: "031" },
  { slug: "mundo-novo-cerrado-mineiro", name: "Mundo Novo", regiao: "Cerrado Mineiro", q: "mundo novo cerrado mineiro 250g cafe especial", edicao: "030" },
  { slug: "bourbon-rosa-alta-mogiana", name: "Bourbon Rosa", regiao: "Alta Mogiana", q: "bourbon rosa alta mogiana 250g cafe especial", edicao: "029" },
  { slug: "catuai-vermelho-mantiqueira", name: "Catuaí Vermelho", regiao: "Mantiqueira", q: "catuai vermelho mantiqueira 250g cafe especial", edicao: "028" },
  { slug: "paraiso-h419-carmo-de-minas", name: "Paraíso H419", regiao: "Carmo de Minas", q: "paraiso h419 pulped natural carmo de minas 250g cafe especial", edicao: "027" },
  { slug: "yellow-catucai-natural-espirito-santo", name: "Yellow Catucaí Natural", regiao: "Espírito Santo", q: "yellow catucai espirito santo natural 250g cafe especial", edicao: "026" },
  { slug: "obata-vermelho-lavado-sul-de-minas", name: "Obatã Vermelho Lavado", regiao: "Sul de Minas", q: "obata vermelho sul de minas 250g cafe especial lavado", edicao: "025" },
  { slug: "bourbon-amarelo-cerrado", name: "Bourbon Amarelo", regiao: "Cerrado", q: "bourbon amarelo cerrado 250g cafe especial", edicao: "024" },
  { slug: "catucai-vermelho-natural", name: "Catucaí Vermelho Natural", regiao: "Matas de Minas", q: "catucai vermelho natural matas de minas mg 250g cafe especial", edicao: "023" },
  { slug: "topazio-anaerobico-cerrado-mineiro", name: "Topázio Anaeróbico", regiao: "Cerrado Mineiro", q: "topazio fermentado anaerobico 250g cafe especial cerrado mineiro", edicao: "022" },
  { slug: "acaia-cereja-descascado-mantiqueira", name: "Acaiá Cereja Descascado", regiao: "Mantiqueira", q: "acaia mantiqueira cereja descascado 250g cafe especial", edicao: "021" },
  { slug: "icatu-amarelo-natural", name: "Icatu Amarelo Natural", regiao: "Mococa (SP)", q: "icatu amarelo natural mococa sao paulo 250g cafe especial", edicao: "020" },
  { slug: "bourbon-sul-de-minas", name: "Bourbon", regiao: "Sul de Minas", q: "bourbon sul de minas 250g cafe especial", edicao: "019" },
  { slug: "mundo-novo-natural-sul-de-minas", name: "Mundo Novo Natural", regiao: "Sul de Minas", q: "mundo novo natural 250g cafe especial sul de minas", edicao: "018" },
  { slug: "conilon-honey-espirito-santo", name: "Conilon Honey", regiao: "Espírito Santo", q: "conilon honey espirito santo 250g cafe especial robusta", edicao: "017" },
  { slug: "geisha-lavado-cerrado-mineiro", name: "Geisha Lavado", regiao: "Cerrado Mineiro", q: "geisha lavado cerrado mineiro 250g cafe especial", edicao: "015" },
  { slug: "catuai-vermelho-natural", name: "Catuaí Vermelho Natural", regiao: "Chapada Diamantina", q: "catuai vermelho natural chapada diamantina bahia 250g cafe especial", edicao: "014" },
  { slug: "bourbon-amarelo-carmo-de-minas", name: "Bourbon Amarelo", regiao: "Carmo de Minas", q: "bourbon amarelo carmo de minas grao", edicao: "013" },
  { slug: "bourbon-amarelo-santa-ines", name: "Bourbon Amarelo", regiao: "Santa Inês", q: "bourbon amarelo santa ines 250g cafe especial", edicao: "013" },
  { slug: "kit-degustacao", name: "Kit Degustação", q: "cafe especial kit degustacao", edicao: "012" },
  { slug: "robusta-conilon", name: "Robusta Conilon", regiao: "Espírito Santo", q: "fine robusta conilon espirito santo 250g cafe especial", edicao: "011" },
  { slug: "honey-process", name: "Honey Process", regiao: "Costa Rica", q: "cafe honey process costa rica especial", edicao: "010" },
  { slug: "chapada-diamantina-bahia", name: "Chapada Diamantina", regiao: "Bahia", q: "cafe chapada diamantina natural especial", edicao: "009" },
  { slug: "quenia-sl28", name: "Quênia SL28", q: "cafe quenia kenya especial", edicao: "008" },
  { slug: "pacamara", name: "Pacamara", q: "cafe especial pacamara", edicao: "007" },
  { slug: "mundo-novo", name: "Mundo Novo", regiao: "Mogiana (SP)", q: "mundo novo mogiana sao paulo 250g cafe especial", edicao: "006" },
  { slug: "etiopia-yirgacheffe", name: "Etiópia Yirgacheffe", q: "cafe etiopia yirgacheffe especial", edicao: "005" },
  { slug: "bourbon-vermelho", name: "Bourbon Vermelho", regiao: "Sul de Minas", q: "bourbon vermelho sul de minas 250g cafe especial", edicao: "004" },
  { slug: "catuai-vermelho", name: "Catuaí Vermelho", regiao: "Cerrado Mineiro", q: "catuai vermelho cerrado mineiro natural 250g cafe especial", edicao: "003" },
  { slug: "geisha", name: "Geisha", regiao: "Panamá", q: "geisha panama la esmeralda boquete cafe especial", edicao: "002" },
];
