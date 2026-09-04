"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

/* Link tokenizado da entrega do app (app-scriptorium/13): o guia mora no app unificado, então
   /app/<token> só leva o leitor até lá. Redirect no cliente de propósito: o lp-router segue redirect
   de origem por dentro e serviria o app debaixo desta URL, com assets e service worker quebrados. */
const TOKENS: Record<string, string> = {
  "d25d111a": "https://app-scriptorium.vercel.app/g/NC-d25d111a",
};

export default function AppToken() {
  const params = useParams<{ token: string }>();
  const destino = TOKENS[params?.token ?? ""];
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    if (destino) window.location.replace(destino);
    setPronto(true);
  }, [destino]);
  return (
    <main style={{ fontFamily: "Inter, system-ui, sans-serif", padding: "48px 24px", maxWidth: 520, margin: "0 auto", color: "#211C16" }}>
      {destino ? (
        <>
          <p style={{ fontSize: 18, fontWeight: 600 }}>Abrindo o seu app…</p>
          <p style={{ marginTop: 12 }}>
            Se a tela não trocar sozinha, <a href={destino} style={{ color: "#A16207", textDecoration: "underline" }}>toque aqui pra abrir o app</a>.
          </p>
        </>
      ) : (
        pronto && <p style={{ fontSize: 18, fontWeight: 600 }}>Link do app não reconhecido. Responda o email da compra que a gente resolve.</p>
      )}
    </main>
  );
}
