import type { Metadata } from "next";
import { Eczar, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { TrackingPixels } from "./components/tracking-pixels";
import Clarity from "./Clarity";

const heading = Eczar({
  variable: "--heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const body = Plus_Jakarta_Sans({
  variable: "--body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Notas do Café | Você toma café todo dia. Mas sabe o que está tomando?",
  description:
    "Curadoria diária de café especial brasileiro. Grão, preparo, origem, equipamento. Todo dia, 08:08, no seu email.",
  openGraph: {
    title: "Notas do Café",
    description:
      "Curadoria diária de café especial brasileiro. Sem frescura, com origem.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/images/simbolo.webp",
    apple: "/images/simbolo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`dark ${heading.variable} ${body.variable} scroll-smooth`}
    >
      <body>
        {children}
        <TrackingPixels />
        <Clarity projectId="xa1rux43pd" />
      </body>
    </html>
  );
}
