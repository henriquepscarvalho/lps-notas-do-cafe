"use client";

import { useEffect } from "react";
import { getExp014Variant } from "./lib/exp014";

/**
 * Pageview beacon → Supabase (tabela public.lp_page_views).
 * Dispara 1x por load (idempotente por sessionStorage chave slug+step).
 * anon key é pública; RLS na tabela só permite INSERT (sem leitura pública).
 *
 * Funil de cadastro: o /cadastro e o form embutido gravam um token de jornada
 * (`vdn_funnel`) no sessionStorage ANTES de redirecionar pra /pesquisa. Os steps
 * `pesquisa` e `confirmado` só contam como in-funnel se esse token estiver
 * presente e recente. Sem ele (entrada pelo ebook, email, PDF ou link direto) o
 * evento vira `${step}-direct`, mantendo a conversão visita→lead honesta (valores
 * únicos: cada etapa do funil vira subconjunto da anterior).
 *
 * Uso:
 *   <PageBeacon slug="techshot" step="topo" />            // app/page.tsx
 *   <PageBeacon slug="techshot" step="confirmado" />      // app/cadastro-confirmado/page.tsx
 *
 * Requer NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local
 * e nas env vars da Vercel (Production + Preview).
 */
const FUNNEL_TTL_MS = 30 * 60 * 1000; // janela da jornada cadastro → pesquisa → confirmado

export default function PageBeacon({ slug, step }: { slug: string; step: string }) {
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;

    // Steps do funil de cadastro: separa in-funnel de entrada lateral (ebook/email/direto).
    let effectiveStep = step;
    if (step === "pesquisa" || step === "confirmado") {
      let inFunnel = false;
      try {
        const t = Number(sessionStorage.getItem("vdn_funnel") || 0);
        inFunnel = t > 0 && Date.now() - t < FUNNEL_TTL_MS;
      } catch {
        /* sessionStorage indisponível — trata como entrada direta */
      }
      if (!inFunnel) effectiveStep = `${step}-direct`;
    }

    const k = `lpv_${slug}_${effectiveStep}`;
    try {
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, "1");
    } catch {
      /* sessionStorage indisponível (modo privado etc.) — segue e grava */
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
        funnel_step: effectiveStep,
        path: window.location.pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        variant: getExp014Variant(),
      }),
    }).catch(() => {
      /* beacon best-effort, nunca quebra a página */
    });
  }, [slug, step]);

  return null;
}
