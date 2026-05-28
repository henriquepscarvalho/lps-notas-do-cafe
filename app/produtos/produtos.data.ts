// SOT humano: 3-conexao/links-afiliados.md (espelhado aqui à mão).
// Sem link afiliado — a página monta uma busca na Amazon pelo nome (nunca quebra).
// Só equipamentos: grãos especiais não entram (estoque instável), conforme o SOT.

export interface Produto {
  slug: string;
  name: string;
  q?: string; // override da query de busca (default: name)
  section: string;
  edicao: string;
}

export const RETAILER = {
  label: "Amazon",
  search: (q: string) => `https://www.amazon.com.br/s?k=${encodeURIComponent(q)}`,
};

const EQUIP = "Equipamentos";

export const PRODUTOS: Produto[] = [
  { slug: "v60-hario-kit", name: "Kit V60 Hario", q: "kit V60 Hario coador café", section: EQUIP, edicao: "001" },
  { slug: "moedor-timemore-c2", name: "Moedor Manual Timemore C2", q: "moedor manual Timemore C2", section: EQUIP, edicao: "001, 004, 006, 007" },
  { slug: "balanca-timemore", name: "Balança Timemore", q: "balança café Timemore", section: EQUIP, edicao: "001" },
  { slug: "chaleira-hario-buono", name: "Chaleira Hario Buono", q: "chaleira Hario Buono pescoço de ganso", section: EQUIP, edicao: "001, 002" },
  { slug: "prensa-francesa-bodum", name: "Prensa Francesa Bodum Chambord 1L", section: EQUIP, edicao: "003" },
  { slug: "aeropress-go", name: "AeroPress Go Portátil", section: EQUIP, edicao: "012" },
  { slug: "bialetti-moka", name: "Bialetti Moka Express 6 Xícaras", section: EQUIP, edicao: "006" },
  { slug: "wdt-tool", name: "WDT Tool Agulha Espresso", q: "WDT tool distribuidor espresso", section: EQUIP, edicao: "011" },
  { slug: "clever-dripper", name: "Clever Dripper 300ml", q: "Clever Dripper coador café", section: EQUIP, edicao: "005" },
  { slug: "caneca-termica", name: "Caneca Térmica Inox 350ml", section: EQUIP, edicao: "006" },
  { slug: "aeropress-original", name: "AeroPress Original", section: EQUIP, edicao: "004" },
  { slug: "balanca-cozinha", name: "Balança Digital de Cozinha", q: "balança digital cozinha 0,1g", section: EQUIP, edicao: "003" },
  { slug: "chemex", name: "Chemex Pour-over", q: "Chemex coador café", section: EQUIP, edicao: "002" },
  { slug: "timemore-black-mirror", name: "Balança Timemore Black Mirror", section: EQUIP, edicao: "002" },
  { slug: "baratza-encore", name: "Moedor Baratza Encore", section: EQUIP, edicao: "003" },
  { slug: "hario-mizudashi", name: "Hario Mizudashi Cold Brew", section: EQUIP, edicao: "007" },
  { slug: "hario-technica-sifao", name: "Sifão Hario Technica", q: "sifão café Hario Technica", section: EQUIP, edicao: "009" },
  { slug: "flair-espresso", name: "Flair Espresso", q: "Flair espresso manual", section: EQUIP, edicao: "011" },
  { slug: "acaia-lunar", name: "Balança Acaia Lunar", section: EQUIP, edicao: "008" },
  { slug: "kalita-wave-185", name: "Kalita Wave 185", q: "Kalita Wave 185 coador", section: EQUIP, edicao: "008" },
  { slug: "kalita-server", name: "Kalita Server", q: "Kalita server jarra café", section: EQUIP, edicao: "008" },
  { slug: "tamper-58", name: "Tamper 58mm", q: "tamper 58mm espresso", section: EQUIP, edicao: "011" },
  { slug: "colher-cupping", name: "Colher de Cupping SCA", q: "colher cupping café", section: EQUIP, edicao: "009" },
  { slug: "termometro-digital", name: "Termômetro Digital", q: "termômetro digital café", section: EQUIP, edicao: "010" },
  { slug: "jarra-termica", name: "Jarra Térmica", q: "jarra térmica café", section: EQUIP, edicao: "005" },
  { slug: "hario-v60-server", name: "Hario V60 Server", q: "Hario V60 server jarra", section: EQUIP, edicao: "007" },
  { slug: "timer-digital", name: "Timer Digital", q: "timer digital cozinha", section: EQUIP, edicao: "004" },
  { slug: "filtros-melitta", name: "Filtros de Papel Melitta", q: "filtro papel Melitta 102", section: EQUIP, edicao: "005" },
  { slug: "filtros-pano", name: "Filtros de Pano", q: "filtro pano café coador", section: EQUIP, edicao: "010" },
  { slug: "nel-drip", name: "Nel Drip", q: "nel drip flanela café", section: EQUIP, edicao: "010" },
  { slug: "tigelas-cupping", name: "Tigelas de Cupping", q: "tigela cupping café", section: EQUIP, edicao: "009" },
  { slug: "estojo-viagem", name: "Estojo de Viagem", q: "kit café viagem portátil", section: EQUIP, edicao: "012" },
];
