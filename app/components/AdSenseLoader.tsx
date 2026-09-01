"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

/* Loader do AdSense (verificação de propriedade site-wide), MENOS no funil de
   venda do ebook: lá não existe AdSlot, o request voltava 403 em toda pageview
   (critique 01/09) e é JS de terceiro no caminho do checkout. A aprovação
   AdSense segue site-wide pelo resto das rotas. */
const BLOQUEADAS = ["/ebook-premium"];

export function AdSenseLoader() {
  const pathname = usePathname() || "";
  if (BLOQUEADAS.some((p) => pathname.startsWith(p))) return null;
  return (
    <Script
      id="adsense-loader"
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9899991510788633"
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
