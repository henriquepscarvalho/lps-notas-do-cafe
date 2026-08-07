import type { MetadataRoute } from "next";

// Depois da inversao do apex (ticket 78) o robots.txt da raiz sai daqui, e nao mais
// do beehiiv. Sem ele a raiz responderia 404 no arquivo que o crawler pede primeiro.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://notasdocafe.com.br/sitemap.xml",
  };
}
