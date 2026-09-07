import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects(){return [
    // /teste: URL do leitor pro funil de venda (a copy fala "teste"; "quiz" fica interno).
    // 307 nao gruda em cache e preserva a query (?src= do anuncio). Lexico selado HC 03/08.
    {source:"/teste",destination:"/quiz",permanent:false},
      // Inversao do apex (ticket 78): o beehiiv sai da raiz e passa a morar em
      // edicoes.notasdocafe.com.br. As edicoes indexadas em /p/ e os links de todo email ja
      // enviado seguem apontando pra raiz, entao a raiz devolve permanente pro host
      // novo. Entra sem risco agora: enquanto o apex for beehiiv este app nao ve
      // essas rotas, e no instante da virada o redirect ja esta no ar.
      { source: "/p/:slug*", destination: "https://edicoes.notasdocafe.com.br/p/:slug*", permanent: true },
      { source: "/subscribe", destination: "https://edicoes.notasdocafe.com.br/subscribe", permanent: true },
      { source: "/upgrade", destination: "https://edicoes.notasdocafe.com.br/upgrade", permanent: true },
  ];},
  async rewrites(){return [
    {source:"/ebook-premium-versao-web",destination:"/ebook-web/ebook-premium-versao-web.html"},
    {source:"/quiz",destination:"/quiz/index.html"},
  ];},
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;