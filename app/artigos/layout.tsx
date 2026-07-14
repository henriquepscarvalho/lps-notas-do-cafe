import Script from "next/script";

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

// Script AdSense só na área de artigos (as LPs de funil ficam sem).
export default function ArtigosLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {CLIENT && (
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      )}
      {children}
    </>
  );
}
