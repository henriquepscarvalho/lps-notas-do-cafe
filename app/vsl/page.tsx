import type { Metadata } from "next";
import VslClient from "./VslClient";

// Meio de funil (chegada pelo quiz): fora do índice.
export const metadata: Metadata = {
  title: "A sua xícara · Notas do Café",
  robots: { index: false, follow: false },
};

export default function VslPage() {
  return <VslClient />;
}
