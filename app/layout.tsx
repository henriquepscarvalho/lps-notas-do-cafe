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
  // Sem base o canonical sai relativo e o OG sai sem host. Depois da inversao do apex
  // (ticket 78) a raiz e o endereco canonico, e o lp. serve o mesmo app: declarar a
  // base aqui faz as duas superficies consolidarem no mesmo lugar.
  metadataBase: new URL("https://notasdocafe.com.br"),
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
      <head>
        {/* Verificacao de propriedade AdSense: site-wide, igual ao Crime Aberto. */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9899991510788633"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {children}
        <TrackingPixels />
        <Clarity projectId="xa1rux43pd" />
      </body>
    </html>
  );
}
