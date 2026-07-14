"use client";

import { useEffect } from "react";

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const PREVIEW = process.env.NEXT_PUBLIC_ADS_PREVIEW === "1";

// Bloco AdSense responsivo. Sem NEXT_PUBLIC_ADSENSE_CLIENT não renderiza nada
// em produção (site funciona normal enquanto a conta AdSense não sai);
// NEXT_PUBLIC_ADS_PREVIEW=1 mostra um placeholder pra validação visual local.
export default function AdSlot({ slot }: { slot?: string }) {
  useEffect(() => {
    if (!CLIENT) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch {}
  }, []);

  if (!CLIENT) {
    if (!PREVIEW) return null;
    return (
      <div
        aria-hidden
        style={{
          margin: "2rem 0",
          padding: "2.4rem 1rem",
          border: "1px dashed rgba(200, 150, 62, 0.3)",
          borderRadius: 8,
          textAlign: "center",
          color: "#9E8E7A",
          fontFamily: "var(--font-body)",
          fontSize: "0.7rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        Anúncio
      </div>
    );
  }

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block", margin: "2rem 0" }}
      data-ad-client={CLIENT}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
