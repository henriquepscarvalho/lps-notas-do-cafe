import type { Metadata } from "next";
import OnboardingWizard from "../OnboardingWizard";

export const metadata: Metadata = {
  title: "Material enviado · Notas do Café",
  description: "Seu material está a caminho. Confira seu email.",
};

/* Onboarding pos-ebook: MESMO wizard universal, contexto ebook + source=ebook. */
export default function BaixarEbookConfirmadoPage() {
  return <OnboardingWizard context="ebook" defaultSource="ebook" />;
}
