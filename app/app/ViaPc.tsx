"use client";

import { useEffect } from "react";

/* app/82 (02/10/26, ⭐ aprovada pelo HC): no computador a /app teve 133 checkouts e 0 venda em 30 dias.
   Linha discreta sob cada botão de pedido da LP /app e acima do formulário do /app/checkout, só no
   computador (640 px ou mais, com mouse): diz como o app chega no celular. No celular não aparece.
   Fonte única: _shared/scripts/templates/ViaPc.tsx, publicada por _shared/scripts/rollout_via_pc_app.py.
   Marcador do censo: data-lc="app82-v1" (vem no HTML do servidor). Leitura em 30 dias: app/82. */
export const VIA_PC = "O link do app chega no seu email: abra no celular e ele vira ícone em um toque.";
const MARCA = "app82-v1";
const CSS_VP = `.via-pc{display:none;margin:.65rem 0 0;font-size:.92rem;line-height:1.45;color:var(--apagado,var(--text-dim,currentColor));text-wrap:balance}
@media (min-width:640px) and (hover:hover){.via-pc{display:block}}`;

// Roda inline logo depois do HTML do ouro (antes da pintura) e de novo no efeito (navegação no cliente).
// Idempotente: o pai do botão que já tem a linha logo depois fica como está. A linha herda o `order` do pai
// (no bloco final o .pedido tem order:3 e a linha subiria acima do botão). Fora: botão da barra (cta-mini),
// o do aviso de saída (saida-cta, vai pro ebook) e qualquer botão dentro de diálogo.
const POE = `(function(){try{var t=${JSON.stringify(VIA_PC)};document.querySelectorAll('a.cta[href^="/app/checkout"]').forEach(function(a){if(a.classList.contains('cta-mini')||a.classList.contains('saida-cta')||a.closest('nav,header,[role=dialog],.saida'))return;var c=a.parentElement;if(!c)return;var n=c.nextElementSibling;if(n&&n.classList&&n.classList.contains('via-pc'))return;var p=document.createElement('p');p.className='via-pc';p.setAttribute('data-lc','${MARCA}');p.textContent=t;var s=getComputedStyle(c);if(/center/.test(s.justifyContent)||s.textAlign==='center')p.style.textAlign='center';if(s.order&&s.order!=='0')p.style.order=s.order;c.insertAdjacentElement('afterend',p)})}catch(e){}})();`;

/** LP /app: vai logo depois do <div> do HTML do ouro. */
export default function ViaPc() {
  useEffect(() => {
    try {
      new Function(POE)();
    } catch {
      /* sem linha */
    }
  }, []);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS_VP }} />
      <script data-lc={MARCA} dangerouslySetInnerHTML={{ __html: POE }} />
    </>
  );
}

/** /app/checkout: vai logo acima da caixa do formulário. */
export function ViaPcLinha() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS_VP + ".ck-page .via-pc{margin:0 0 .8rem;text-align:center}" }} />
      <p className="via-pc" data-lc={MARCA}>{VIA_PC}</p>
    </>
  );
}
