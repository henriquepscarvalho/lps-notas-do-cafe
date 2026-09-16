import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Café de Balcão no Coador de Casa · o guia da Notas do Café",
  description: "Você troca de marca e o amargo continua. O guia põe 8 variáveis entre o pacote e a xícara. O guia da news Notas do Café: 8 variáveis, versão web e PDF.",
};

export default function EbookPremiumBLayout({ children }: { children: React.ReactNode }) {
  return children;
}
