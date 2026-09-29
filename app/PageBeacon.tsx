"use client";

import { useEffect } from "react";

// variant lido inline do localStorage (sem acoplar no lib/exp014, que nem toda LP tem)
function getVariant(): string | null {
  try {
    // LP do app (flb/20): nas rotas /app o braço é o do vídeo no bloco de recursos (cookie `lp_app` do
    // middleware; `?v=a|b` força a revisão na /app). Série `app-a`/`app-b`, separada das letras do lp_eb.
    const p = window.location.pathname;
    if (p === "/app" || p.startsWith("/app/")) {
      // EXP-072 (app-scriptorium/66): destino do clique do banner. Quem caiu no braço checkout (cookie `app_dst=ck`
      // do middleware; `?d=ck|lp` força a revisão e viaja na query do 307) sai carimbado `app-k` em toda rota /app,
      // inclusive se voltar pra LP: o EXP-071 lê só `app-a|app-b`, então essa jornada fica fora dele.
      const q = new URLSearchParams(window.location.search);
      const d = (q.get("d") || "").toLowerCase();
      if (d === "ck" || (d !== "lp" && /(?:^|;\s*)app_dst=ck(?:;|$)/.test(document.cookie))) return "app-k";
      const f = p === "/app" ? (new URLSearchParams(window.location.search).get("v") || "").toLowerCase() : "";
      if (f === "a" || f === "b") return "app-" + f;
      const a = document.cookie.match(/(?:^|;\s*)lp_app=([ab])(?:;|$)/);
      return a ? "app-" + a[1] : null;
    }
    const m = document.cookie.match(/(?:^|;\s*)lp_eb=([ABC])(?:;|$)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/** Acesso interno (HC/QA): ?internal=1 grava flag permanente no device (vdn_internal);
 *  ?internal=0 remove. Beacon manda is_internal=true e o report sempre ignora. */
export function isInternalAccess(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const p = new URLSearchParams(window.location.search).get("internal");
    if (p === "1") localStorage.setItem("vdn_internal", "1");
    if (p === "0") localStorage.removeItem("vdn_internal");
    return localStorage.getItem("vdn_internal") === "1";
  } catch {
    return false;
  }
}

/**
 * Pageview/funil beacon → Supabase (tabela public.lp_page_views).
 * anon key é pública; RLS na tabela só permite INSERT (sem leitura pública).
 *
 * Modelo multi-entrada (jun/2026):
 *   - source     → de qual porta a pessoa veio (cadastro/ebook/quiz/video/direct).
 *                  A 1ª página captura `?src=` (ou um default por porta) em
 *                  sessionStorage `vdn_source`; TODO beacon ecoa.
 *   - journey_id → id aleatório por pessoa (sessionStorage `vdn_journey`), pra
 *                  contar jornadas únicas e seguir o caminho real.
 *   - event_type → "apareceu" (a etapa entrou na tela) vs "converteu" (clicou o
 *                  CTA). A razão converteu/apareceu por etapa aponta onde trava.
 *
 * Uso declarativo (pageview de uma rota):
 *   <PageBeacon slug="brasa-certa" step="topo" source="cadastro" />
 *
 * Uso imperativo (passo de wizard, no clique do CTA):
 *   sendBeacon("brasa-certa", "email", { eventType: "converteu" });
 *
 * Requer NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local
 * e nas env vars da Vercel (Production + Preview).
 */

function genId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* crypto indisponível — cai no fallback abaixo */
  }
  return "j_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Captura a porta de entrada (1x por jornada) e garante o journey_id. */
export function captureSource(defaultSource?: string): void {
  if (typeof window === "undefined") return;
  try {
    isInternalAccess(); // grava o flag interno cedo, se ?internal= estiver na URL
    // c4-20k/17: "ad:" so' nasce de trafego do Meta. Antes, o utm_content de qualquer
    // email virava anuncio (a campanha do app entrou no Rio como ad:a4) e a visita de
    // email era contada como midia paga. ?src= segue sendo o carimbo canonico e o utm
    // do beehiiv sem src vira email-<utm_campaign>.
    const q = new URLSearchParams(window.location.search);
    const uSrc = (q.get("utm_source") || "").trim().toLowerCase();
    const uCont = (q.get("utm_content") || "").trim().slice(0, 56);
    const uCamp = (q.get("utm_campaign") || "").trim().slice(0, 56);
    const ehMeta = ["facebook", "instagram", "meta", "fb", "ig"].indexOf(uSrc) >= 0;
    // gam/170: link de indicação (?ref=) sem src entra com a origem "indicacao"
    const param =
      ehMeta && uCont
        ? "ad:" + uCont
        : q.get("src") || (q.get("ref") ? "indicacao" : "") || (uSrc === "beehiiv" && uCamp ? "email-" + uCamp : uCamp);
    const src = (param || "").trim().slice(0, 60);
    if (src && !sessionStorage.getItem("vdn_source")) {
      sessionStorage.setItem("vdn_source", src);
    } else if (defaultSource && !sessionStorage.getItem("vdn_source")) {
      sessionStorage.setItem("vdn_source", defaultSource);
    }
    // onda mensal (c4-20k/11): ?oferta=metade&ate=<epoch> do o3 viaja até o checkout
    const oferta = (q.get("oferta") || "").trim().slice(0, 20);
    if (oferta && !sessionStorage.getItem("vdn_oferta")) {
      sessionStorage.setItem("vdn_oferta", oferta);
      sessionStorage.setItem("vdn_ate", (q.get("ate") || "").trim().slice(0, 12));
    }
    // `?j=` (passo do guia no wizard): aba nova aberta com noopener não herda o
    // sessionStorage, então a jornada viaja no link. Só adota quando a aba ainda não
    // tem jornada própria, e nunca sobrescreve a de quem já está navegando.
    const jp = (new URLSearchParams(window.location.search).get("j") || "").trim().slice(0, 60);
    if (!sessionStorage.getItem("vdn_journey")) {
      sessionStorage.setItem("vdn_journey", jp || genId());
    }
  } catch {
    /* storage bloqueado — beacon ainda manda source=direct */
  }
}

function getSource(): string {
  try {
    return sessionStorage.getItem("vdn_source") || "direct";
  } catch {
    return "direct";
  }
}

function getJourney(): string | null {
  try {
    let j = sessionStorage.getItem("vdn_journey");
    if (!j) {
      j = genId();
      sessionStorage.setItem("vdn_journey", j);
    }
    return j;
  } catch {
    return null;
  }
}

type BeaconOpts = { eventType?: "apareceu" | "converteu"; dedupe?: boolean };

/**
 * Dispara um evento de funil. Idempotente por (slug, step, eventType) na sessão
 * (passe `dedupe:false` pra forçar). Best-effort: nunca quebra a página.
 */
export function sendBeacon(slug: string, step: string, opts: BeaconOpts = {}): void {
  if (typeof window === "undefined") return;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return;

  const eventType = opts.eventType || "apareceu";
  const dedupe = opts.dedupe !== false;
  const k = `lpv_${slug}_${step}_${eventType}`;
  if (dedupe) {
    try {
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, "1");
    } catch {
      /* sessionStorage indisponível (modo privado) — segue e grava */
    }
  }

  fetch(`${url}/rest/v1/lp_page_views`, {
    method: "POST",
    keepalive: true,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      slug,
      funnel_step: step,
      event_type: eventType,
      source: getSource(),
      journey_id: getJourney(),
      path: window.location.pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      variant: getVariant(),
      is_internal: isInternalAccess(),
    }),
  }).catch(() => {
    /* beacon best-effort, nunca quebra a página */
  });
}

/**
 * Posição do botão de compra na página (lpca/29, 28/09/26). O clique no CTA segue gravando o
 * MESMO passo de sempre (`app-lp-cta`, `ebook-premium-d-cta`...), que a RPC do c2, o Pharos e o
 * funil_gaps.py leem por nome exato. A posição sai num SEGUNDO beacon, no passo `<passo>@<pos>`
 * (ex.: `app-lp-cta@ficha`): nenhum leitor lista esse nome, o normStep do c2 só corta `-[a-z]$`,
 * e a coluna `variant` fica só com o braço do teste. Dedupe por posição na sessão: cada botão
 * diferente que a pessoa clicou aparece uma vez.
 *
 * Ordem da leitura: `data-pos` explícito > chat da vitrine > barra fixa/grudada (nav sticky,
 * faixa de oferta, barra de compra do celular) > hero > ficha (o que você leva + preço) >
 * final > meio.
 */
export const CTA_POS = ["hero", "meio", "ficha", "final", "barra", "chat"] as const;
export type CtaPos = (typeof CTA_POS)[number];

export function posDoCta(alvo: EventTarget | null | undefined): CtaPos {
  try {
    const el = alvo instanceof Element ? alvo : null;
    if (!el) return "meio";
    const d = el.closest("[data-pos]")?.getAttribute("data-pos") as CtaPos | null | undefined;
    if (d && (CTA_POS as readonly string[]).includes(d)) return d;
    if (el.closest(".lpw")) return "chat";
    for (let n: Element | null = el; n && n !== document.body; n = n.parentElement) {
      const p = getComputedStyle(n).position;
      if (p === "fixed" || p === "sticky") return "barra";
    }
    if (el.closest(".hero, #hero, .lp-hero")) return "hero";
    if (el.closest("#leva, #ficha, .ficha, section.caixa")) return "ficha";
    if (el.closest("#final, .fechosec")) return "final";
    return "meio";
  } catch {
    return "meio";
  }
}

/** Beacon da posição, sempre ao lado do beacon do CTA (nunca no lugar dele). */
export function sendCtaPos(slug: string, step: string, alvo: EventTarget | null | undefined): void {
  sendBeacon(slug, `${step}@${posDoCta(alvo)}`, { eventType: "converteu" });
}

export default function PageBeacon({
  slug,
  step,
  source,
  eventType,
}: {
  slug: string;
  step: string;
  source?: string;
  eventType?: "apareceu" | "converteu";
}) {
  useEffect(() => {
    captureSource(source);
    sendBeacon(slug, step, { eventType: eventType || "apareceu" });
  }, [slug, step, source, eventType]);

  // funil-pixel (build-ebooks-premium 35/36): ViewContent na LP de venda e
  // InitiateCheckout no checkout, mesmo contrato do lp-router. Espera o fbq do
  // snippet afterInteractive, igual ao Purchase da /obrigado. Sem guard de
  // storage: revisita e sinal legitimo de intencao.
  useEffect(() => {
    const ev =
      !step.startsWith("ebook-premium") ? null
      : step.endsWith("-checkout") ? "InitiateCheckout"
      : /-(obrigado|cta)$/.test(step) ? null
      : "ViewContent";
    if (!ev) return;
    let tries = 0;
    const fire = () => {
      try {
        const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
        if (typeof fbq === "function") {
          fbq("track", ev, { content_name: `Ebook Premium ${slug}`, value: 27, currency: "BRL" });
          return;
        }
      } catch {
        /* pixel opcional */
      }
      if (tries++ < 20) setTimeout(fire, 250);
    };
    fire();
  }, [slug, step]);

  return null;
}