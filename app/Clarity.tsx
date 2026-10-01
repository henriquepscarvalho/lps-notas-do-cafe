"use client";

import Script from "next/script";

/**
 * Microsoft Clarity — heatmap + scroll + session replay por LP.
 * Lê NEXT_PUBLIC_CLARITY_ID (1 projeto Clarity por newsletter). INERTE sem o ID
 * (não renderiza nada), então pode subir antes de existir o projeto.
 *
 * - strategy "afterInteractive": não bloqueia o LCP da LP.
 * - id="ms-clarity" no <Script> (NUNCA "clarity": colide com a lib interna).
 * - Masking de inputs (não gravar email do lead no replay) = config do PROJETO
 *   no painel Clarity (Settings -> Masking -> "Mask all"), feito 1x por projeto.
 * - Device interno (gua/11, 01/10/26): com `?internal=1` na URL ou `vdn_internal=1` no
 *   localStorage (a mesma flag do PageBeacon) a tag não sobe. Prova do agente e
 *   conferência do HC saem da base do Clarity (fnx/699: 7 de 10 sessões com clique morto
 *   da EE eram o Mac interno). `?internal=0` limpa a flag e a tag volta. O stub
 *   `window.clarity` existe nos dois casos, então chamada de evento nunca quebra.
 *
 * Uso: <Clarity projectId="xxxxxxxxxx" /> no app/layout.tsx (ID é público, vai na tag).
 * Ou <Clarity /> lendo NEXT_PUBLIC_CLARITY_ID da Vercel (1 por projeto) no rollout em lote.
 */
export default function Clarity({ projectId }: { projectId?: string }) {
  const id = projectId || process.env.NEXT_PUBLIC_CLARITY_ID;
  if (!id) return null;
  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};try{var f=/[?&]internal=([01])(?:&|$)/.exec(l.location.search);if(f&&f[1]==="1")c.localStorage.setItem("vdn_internal","1");if(f&&f[1]==="0")c.localStorage.removeItem("vdn_internal");if(c.localStorage.getItem("vdn_internal")==="1")return}catch(e){if(/[?&]internal=1(?:&|$)/.test(l.location.search))return}t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${id}");`}
    </Script>
  );
}
