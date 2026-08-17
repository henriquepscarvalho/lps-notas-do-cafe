// Captura de origem de lead no client (contrato UTM).
// 1. captureUtm() roda no page load: lê utm_* + fbclid/gclid da URL e persiste
//    em localStorage (último touch com sinal vence; touch vazio nunca apaga).
// 2. getUtm() devolve o payload pro body do POST /api/subscribe.
// O server prioriza body.utm > Referer > click-id > "direct" honesto.

export type UtmPayload = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  fbclid?: string;
  gclid?: string;
  referrer?: string;
  landing?: string;
  ref?: string;
};

const KEY = "vdn_utm";
// ref de indicação (?ref=<sub_hash[:12]>): chave PRÓPRIA, fora do objeto vdn_utm,
// porque um touch posterior com utm_* mas sem ref substituiria o objeto e apagaria
// a atribuição da indicação. Mesmo contrato de TTL e last-touch do vdn_utm.
const REF_KEY = "vdn_ref";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

const pick = (p: URLSearchParams, k: string): string | undefined => {
  const v = p.get(k);
  return v && v.trim() ? v.trim().slice(0, 200) : undefined;
};

export function captureUtm(): void {
  if (typeof window === "undefined") return;
  try {
    const p = new URLSearchParams(window.location.search);
    const ref = pick(p, "ref");
    if (ref && /^[0-9a-f]{8,16}$/i.test(ref)) {
      localStorage.setItem(REF_KEY, JSON.stringify({ code: ref.toLowerCase(), ts: Date.now() }));
    }
    const fresh: UtmPayload = {
      source: pick(p, "utm_source"),
      medium: pick(p, "utm_medium"),
      campaign: pick(p, "utm_campaign"),
      content: pick(p, "utm_content"),
      term: pick(p, "utm_term"),
      fbclid: pick(p, "fbclid"),
      gclid: pick(p, "gclid"),
    };
    if (!Object.values(fresh).some(Boolean)) return;
    const data = {
      ...fresh,
      referrer: document.referrer || undefined,
      landing: window.location.pathname,
      ts: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage bloqueado: o server ainda cai pro Referer/direct */
  }
}

export function getUtm(): UtmPayload {
  let stored: (UtmPayload & { ts?: number }) | null = null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) stored = JSON.parse(raw) as UtmPayload & { ts?: number };
    if (stored?.ts && Date.now() - stored.ts > TTL_MS) stored = null;
  } catch {
    stored = null;
  }
  const out: UtmPayload = stored ? { ...stored } : {};
  delete (out as Record<string, unknown>).ts;
  try {
    if (!out.referrer && typeof document !== "undefined" && document.referrer) {
      out.referrer = document.referrer;
    }
  } catch {}
  try {
    const raw = localStorage.getItem(REF_KEY);
    if (raw) {
      const r = JSON.parse(raw) as { code?: string; ts?: number };
      if (r?.code && (!r.ts || Date.now() - r.ts <= TTL_MS)) out.ref = r.code;
    }
  } catch {
    /* storage bloqueado: cadastro segue sem atribuição de indicação */
  }
  return out;
}
