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
  { slug: "catucai-vermelho-natural", name: "Catucaí Vermelho Natural", q: "catucai vermelho natural 250g cafe especial", edicao: "023" },
  { slug: "topazio-anaerobico-cerrado-mineiro", name: "Topázio Anaeróbico", regiao: "Cerrado Mineiro", q: "topazio fermentado anaerobico 250g cafe especial cerrado mineiro", edicao: "022" },
  { slug: "acaia-cereja-descascado-mantiqueira", name: "Acaiá Cereja Descascado", regiao: "Mantiqueira", q: "acaia mantiqueira cereja descascado 250g cafe especial", edicao: "021" },
  { slug: "icatu-amarelo-natural", name: "Icatu Amarelo Natural", q: "icatu amarelo natural 250g cafe especial", edicao: "020" },
  { slug: "bourbon-sul-de-minas", name: "Bourbon", regiao: "Sul de Minas", q: "bourbon sul de minas 250g cafe especial", edicao: "019" },
  { slug: "mundo-novo-natural-sul-de-minas", name: "Mundo Novo Natural", regiao: "Sul de Minas", q: "mundo novo natural 250g cafe especial sul de minas", edicao: "018" },
  { slug: "conilon-honey-espirito-santo", name: "Conilon Honey", regiao: "Espírito Santo", q: "conilon honey espirito santo 250g cafe especial robusta", edicao: "017" },
  { slug: "geisha-lavado-cerrado-mineiro", name: "Geisha Lavado", regiao: "Cerrado Mineiro", q: "geisha lavado cerrado mineiro 250g cafe especial", edicao: "015" },
  { slug: "catuai-vermelho-natural", name: "Catuaí Vermelho Natural", q: "catuai vermelho natural 250g cafe especial", edicao: "014" },
  { slug: "bourbon-amarelo-carmo-de-minas", name: "Bourbon Amarelo", regiao: "Carmo de Minas", q: "bourbon amarelo carmo de minas grao", edicao: "013" },
  { slug: "bourbon-amarelo-santa-ines", name: "Bourbon Amarelo", regiao: "Santa Inês", q: "bourbon amarelo santa ines 250g cafe especial", edicao: "013" },
  { slug: "kit-degustacao", name: "Kit Degustação", q: "cafe especial kit degustacao", edicao: "012" },
  { slug: "robusta-conilon", name: "Robusta Conilon", q: "cafe robusta conilon especial", edicao: "011" },
  { slug: "honey-process", name: "Honey Process", q: "cafe honey process especial", edicao: "010" },
  { slug: "chapada-diamantina-bahia", name: "Chapada Diamantina", regiao: "Bahia", q: "cafe chapada diamantina especial", edicao: "009" },
  { slug: "quenia-sl28", name: "Quênia SL28", q: "cafe quenia kenya especial", edicao: "008" },
  { slug: "pacamara", name: "Pacamara", q: "cafe especial pacamara", edicao: "007" },
  { slug: "mundo-novo", name: "Mundo Novo", q: "cafe especial mundo novo", edicao: "006" },
  { slug: "etiopia-yirgacheffe", name: "Etiópia Yirgacheffe", q: "cafe etiopia yirgacheffe especial", edicao: "005" },
  { slug: "bourbon-vermelho", name: "Bourbon Vermelho", q: "cafe especial bourbon vermelho", edicao: "004" },
  { slug: "catuai-vermelho", name: "Catuaí Vermelho", q: "cafe especial catuai vermelho", edicao: "003" },
  { slug: "geisha", name: "Geisha", q: "cafe especial geisha grao", edicao: "002" },
];
