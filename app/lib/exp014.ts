"use client";

/**
 * EXP-014/EXP-012 — campo de email branco sólido (Probatorium), ADOTADO.
 *
 * Decisão HC 10/07/26: variante B (branco sólido) adotada sem significância
 * (aposta bayesiana: P(B>A)=85%, +2,2pp por jornada em 23 dias; detectar +1pp
 * levaria ~2 anos no volume real). Sorteio removido: todo visitante vê B.
 * O carimbo `variant: "B"` no PageBeacon fica: documenta a adoção na série
 * do lp_page_views (antes de 10/07 = A/B misto, depois = só B).
 *
 * ARQUIVO GERADO — fonte canônica em _shared/experiments/exp014/exp014.ts.
 * Não editar por LP; editar a fonte e rodar rollout.py.
 */

type Variant = "A" | "B";
const KEY = "vdn_exp014";

export function getExp014Variant(): Variant {
  return "B";
}

const B_CSS =
  "html.exp014-b .lpc-input,html.exp014-b .nmk .input,html.exp014-b .ebk .ebk-form input{background:#ffffff!important;color:#1a1a1a!important;border-color:rgba(0,0,0,.18)!important}" +
  "html.exp014-b .lpc-input::placeholder,html.exp014-b .nmk .input::placeholder,html.exp014-b .ebk .ebk-form input::placeholder{color:#8a8a8a!important;opacity:1}" +
  "html.exp014-b .lpc-input:focus,html.exp014-b .nmk .input:focus,html.exp014-b .ebk .ebk-form input:focus{border-color:#1a1a1a!important}" +
  "html.exp014-b .lpc-field svg,html.exp014-b .nmk .field svg,html.exp014-b .ebk .ebk-mail{color:#3a322a!important}";

/**
 * Aplica o campo branco (idempotente): injeta o CSS e marca <html>.
 * Mantém a assinatura antiga (retorna a variante renderizada, sempre "B").
 */
export function applyExp014(): Variant {
  try {
    // sobrescreve sorteio antigo: PageBeacon le esta chave inline e carimba
    // a variante REALMENTE vista (todo mundo ve B desde 10/07)
    localStorage.setItem(KEY, "B");
  } catch {
    /* sem persistência, sem problema: visual não depende da chave */
  }
  if (typeof document !== "undefined" && !document.getElementById("exp014-style")) {
    const st = document.createElement("style");
    st.id = "exp014-style";
    st.textContent = B_CSS;
    document.head.appendChild(st);
    document.documentElement.classList.add("exp014-b");
  }
  return "B";
}
