import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Café de Balcão no Coador de Casa · o guia da Notas do Café",
  description: "Amanhã cedo, você acha em 3 minutos a variável que amarga o seu café, antes de sair pro balcão. O guia da news Notas do Café: 8 variáveis, versão web e PDF.",
};

export default function EbookPremiumCLayout({ children }: { children: React.ReactNode }) {
  return children;
}
