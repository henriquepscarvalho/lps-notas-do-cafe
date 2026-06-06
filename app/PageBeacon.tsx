"use client";

import { useEffect } from "react";

/**
 * Pageview beacon → Supabase (tabela public.lp_page_views).
 * Dispara 1x por load (idempotente por sessionStorage chave slug+step).
 * anon key é pública; RLS na tabela só permite INSERT (sem leitura pública).
 *
 * Uso:
 *   <PageBeacon slug="techshot" step="topo" />            // app/page.tsx
 *   <PageBeacon slug="techshot" step="confirmado" />      // app/cadastro-confirmado/page.tsx
 *
 * Requer NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local
 * e nas env vars da Vercel (Production + Preview).
 */
export default function PageBeacon({ slug, step }: { slug: string; step: string }) {
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;

    const k = `lpv_${slug}_${step}`;
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
        funnel_step: step,
        path: window.location.pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
      }),
    }).catch(() => {
      /* beacon best-effort, nunca quebra a página */
    });
  }, [slug, step]);

  return null;
}
