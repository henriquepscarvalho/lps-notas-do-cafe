"use client";

import Script from "next/script";

/**
 * Microsoft Clarity: heatmap + scroll + session replay.
 * ID é público (vai na tag client-side). Masking de inputs = config do projeto
 * no painel Clarity (Settings -> Masking -> Strict). afterInteractive não bloqueia o LCP.
 * NUNCA usar id="clarity" no <Script> (colide com a lib interna).
 */
export default function Clarity({ projectId }: { projectId?: string }) {
  const id = projectId || process.env.NEXT_PUBLIC_CLARITY_ID;
  if (!id) return null;
  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${id}");`}
    </Script>
  );
}
