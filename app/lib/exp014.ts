"use client";

/**
 * EXP-014 — A/B fundo do campo de email (Probatorium).
 * Controle (A): campo translúcido atual. Variante B: campo branco sólido,
 * texto e ícone escuros (maior contraste / affordance de "digite aqui").
 *
 * Split 50/50 client-side, persistente por visitante (localStorage `vdn_exp014`),
 * cacheado em módulo pra (a) sobreviver a localStorage indisponível (modo privado)
 * e (b) garantir que PageBeacon (carimbo) e CadastroLP (render) leiam o MESMO
 * valor no mesmo load — carimbo = variante realmente renderizada (gate de integridade).
 *
 * Decisão client-side de propósito: nunca no SSG cacheado, senão serve 1 variante só.
 *
 * ARQUIVO GERADO — fonte canônica em _shared/experiments/exp014/exp014.ts.
 * Não editar por LP; editar a fonte e rodar rollout.py.
 */

type Variant = "A" | "B";
const KEY = "vdn_exp014";
let cached: Variant | null = null;

export function getExp014Variant(): Variant {
  if (cached) return cached;
  let v: Variant | null = null;
  try {
    const s = localStorage.getItem(KEY);
    if (s === "A" || s === "B") v = s;
  } catch {
    /* localStorage indisponível — sorteia em memória, cacheado abaixo */
  }
  if (!v) {
    v = Math.random() < 0.5 ? "A" : "B";
    try {
      localStorage.setItem(KEY, v);
    } catch {
      /* sem persistência — o cache de módulo mantém consistência neste load */
    }
  }
  cached = v;
  return v;
}

const B_CSS =
  "html.exp014-b .lpc-input,html.exp014-b .nmk .input{background:#ffffff!important;color:#1a1a1a!important;border-color:rgba(0,0,0,.18)!important}" +
  "html.exp014-b .lpc-input::placeholder,html.exp014-b .nmk .input::placeholder{color:#8a8a8a!important;opacity:1}" +
  "html.exp014-b .lpc-input:focus,html.exp014-b .nmk .input:focus{border-color:#1a1a1a!important}" +
  "html.exp014-b .lpc-field svg,html.exp014-b .nmk .field svg{color:#3a322a!important}";

/**
 * Aplica a variante (idempotente). Só a B muda algo: injeta o CSS e marca <html>.
 * Retorna a variante REALMENTE renderizada.
 */
export function applyExp014(): Variant {
  const v = getExp014Variant();
  if (
    v === "B" &&
    typeof document !== "undefined" &&
    !document.getElementById("exp014-style")
  ) {
    const st = document.createElement("style");
    st.id = "exp014-style";
    st.textContent = B_CSS;
    document.head.appendChild(st);
    document.documentElement.classList.add("exp014-b");
  }
  return v;
}
