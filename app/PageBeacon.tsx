"use client";

import { useEffect } from "react";

// variant lido inline do localStorage (sem acoplar no lib/exp014, que nem toda LP tem)
function getVariant(): string | null {
  try {
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
    // ?src= é o carimbo canônico; utm_campaign é o fallback pros emails que já saem
    // carimbados pelo funil (ex.: monetizacao-s1-abre nos 12 da Monetização), que antes
    // caíam no beacon como visita anônima.
    const q = new URLSearchParams(window.location.search);
    const utm = (q.get("utm_content") || "").trim().slice(0, 56);
    // anúncio identificado vence o carimbo genérico (regra M03 da VSL): sem o "ad:",
    // a visita paga entra no funil com o src da sequência de email que virou anúncio
    const param = utm ? "ad:" + utm : q.get("src") || q.get("utm_campaign");
    const src = (param || "").trim().slice(0, 60);
    if (src && !sessionStorage.getItem("vdn_source")) {
      sessionStorage.setItem("vdn_source", src);
    } else if (defaultSource && !sessionStorage.getItem("vdn_source")) {
      sessionStorage.setItem("vdn_source", defaultSource);
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