import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notas do Café · Coleção completa",
  description: "Todas as 115 edições da Notas do Café num PDF só, inteiras e em ordem, com sumário por mês. R$ 97, uma vez só.",
};

export default function ColecaoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
