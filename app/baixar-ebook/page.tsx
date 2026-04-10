import type { Metadata } from "next";
import EbookCapture from "./EbookCapture";

export const metadata: Metadata = {
  title: "A Xícara Certa — Notas do Café",
  description:
    "Guia gratuito: 7 métodos de preparo de café avaliados com score padronizado. Descubra qual vale a xícara antes de comprar equipamento.",
};

export default function BaixarEbook() {
  return <EbookCapture />;
}
