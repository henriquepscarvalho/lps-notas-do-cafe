import type { MetadataRoute } from "next";
import { ARTIGOS } from "./lib/artigos";

const BASE = "https://notasdocafe.com.br";

// O sitemap da raiz vinha do beehiiv e listava as edicoes em /p/. Depois da inversao
// do apex (ticket 78) essas edicoes passam a morar em edicoes.notasdocafe.com.br, com sitemap
// proprio de la, e a raiz publica o que ela mesma serve: os artigos e as paginas
// institucionais. As paginas de funil (cadastro, ebook, quiz, vsl) ficam de fora de
// proposito, porque nao sao conteudo de leitura.
const FIXAS = ["", "/artigos", "/sobre", "/comece-aqui", "/biblioteca", "/contato", "/media-kit", "/privacidade"];

export default function sitemap(): MetadataRoute.Sitemap {
  const artigos = ARTIGOS.map((a) => ({
    url: `${BASE}/artigos/${a.slug}`,
    lastModified: new Date(a.dataPublicacao),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const fixas = FIXAS.map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.5,
  }));

  return [...fixas, ...artigos];
}
