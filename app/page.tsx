import type { Metadata } from "next";

// A raiz deixa de ser porta de captura (ticket 78). Com o apex saindo do beehiiv e
// passando a servir este app, `/` vira a primeira pagina que o AdSense le, e uma
// pagina de cadastro sozinha na raiz reprova por conta propria. O indice dos artigos
// ja existe, ja abre com a marca e ja lista o acervo, entao a raiz abre nele. A
// captura segue viva em /cadastro, que e por onde o trafego pago continua entrando.
// Titulo e descricao vem do layout, que ja carrega a marca.
export { default } from "./artigos/page";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};
