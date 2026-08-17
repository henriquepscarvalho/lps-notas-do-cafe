/**
 * validate-email — higiene de email no opt-in das LPs do Scriptorium.
 * Fonte unica (copiar pra app/lib/ de cada LP, ou importar se houver pacote).
 *
 * Server-side (Node runtime, usa dns). Chamar dentro de app/api/subscribe/route.ts
 * ANTES do POST pro Beehiiv. Tres camadas:
 *   1. sintaxe + descartavel/teste  -> rejeita (hard)
 *   2. typo de provedor conhecido    -> devolve suggestion (cliente confirma "voce quis dizer")
 *   3. MX do dominio (fail-OPEN)     -> rejeita so se o dominio comprovadamente nao tem MX
 *
 * Fail-open e regra: erro/timeout de DNS NAO bloqueia cadastro (nunca perder lead
 * por hiccup de rede). So rejeita em NXDOMAIN / zero MX confirmado.
 *
 * Nota de contexto (jun/2026): o fluxo de cadastro faceless ja entrega ~99,7% de
 * email valido. Isto e SEGURO contra regressao, nao correcao de um problema atual.
 */
import { promises as dns } from 'dns';

const DISPOSABLE = new Set([
  'test.com', 'example.com', 'teste.com', 'mailinator.com', 'tempmail.com',
  '10minutemail.com', 'guerrillamail.com', 'yopmail.com', 'trashmail.com',
  'getnada.com', 'sharklasers.com', 'gufum.com',
]);

// provedores populares para sugestao de typo (mailcheck levenshtein)
const POPULAR = [
  'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.com.br',
  'icloud.com', 'live.com', 'bol.com.br', 'uol.com.br', 'terra.com.br',
  'hotmail.com.br', 'outlook.com.br',
];
const POPULAR_BYLEN = [...POPULAR].sort((a, b) => b.length - a.length);
const VALID = new Set([...POPULAR, 'proton.me', 'protonmail.com', 'globo.com', 'ig.com.br', 'aol.com']);
const BAD_TLD = /\.(con|cm|vom|comm|ocm|cpm|xom|cim|co|om)$/;

function lev(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 99;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Sugere o dominio correto pra um typo, ou null. Espelha audit.typo_check do list-cleanup. */
export function suggestDomain(domain: string): string | null {
  const dom = domain.toLowerCase();
  if (VALID.has(dom)) return null;
  if (BAD_TLD.test(dom)) return dom.replace(BAD_TLD, '.com');
  for (const c of POPULAR_BYLEN) if (dom.startsWith(c) && dom.length > c.length) return c;
  let best: string | null = null, bd = 99;
  for (const c of POPULAR) { const d = lev(dom, c); if (d < bd) { bd = d; best = c; } }
  return best && bd <= (dom.length < 6 ? 1 : 2) ? best : null;
}

export interface EmailVerdict {
  ok: boolean;
  /** 'syntax' | 'disposable' | 'no_mx' | 'typo' | 'ok' */
  reason: string;
  /** email sugerido quando reason='typo' (cliente confirma) */
  suggestion?: string;
}

export async function validateEmail(raw: string): Promise<EmailVerdict> {
  const email = (raw || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, reason: 'syntax' };
  const [local, domain] = email.split('@');

  if (DISPOSABLE.has(domain)) return { ok: false, reason: 'disposable' };

  const sug = suggestDomain(domain);
  if (sug) return { ok: false, reason: 'typo', suggestion: `${local}@${sug}` };

  // MX check, fail-OPEN: so rejeita se o dominio comprovadamente nao recebe email
  try {
    const mx = await dns.resolveMx(domain);
    if (!mx || mx.length === 0) return { ok: false, reason: 'no_mx' };
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    // NXDOMAIN / ENOTFOUND = dominio nao existe -> rejeita. Outros (timeout, SERVFAIL) = fail-open.
    if (code === 'ENOTFOUND' || code === 'NXDOMAIN') return { ok: false, reason: 'no_mx' };
    return { ok: true, reason: 'ok' }; // fail-open: nunca perder lead por hiccup de DNS
  }
  return { ok: true, reason: 'ok' };
}
