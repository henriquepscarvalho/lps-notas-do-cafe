import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects(){return [
    // /teste: URL do leitor pro funil de venda (a copy fala "teste"; "quiz" fica interno).
    // 307 nao gruda em cache e preserva a query (?src= do anuncio). Lexico selado HC 03/08.
    {source:"/teste",destination:"/quiz",permanent:false},
  ];},
  async rewrites(){return [
    {source:"/ebook-premium-versao-web",destination:"/ebook-web/ebook-premium-versao-web.html"},
    {source:"/quiz",destination:"/quiz/index.html"},
  ];},
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
