import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notas do Café · Ebook + app",
  description:
    "O ebook Café de Balcão no Coador de Casa e o app que fica ao lado do coador. R$ 97, uma vez só.",
};

export default function AppLpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
