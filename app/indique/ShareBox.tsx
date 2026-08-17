"use client";

import { useState } from "react";

// Link pessoal + copiar + WhatsApp. Client só pelo clipboard; o link chega pronto
// do server (o código nunca é derivado no browser).
export default function ShareBox({ link, nome }: { link: string; nome: string }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard bloqueado: o leitor ainda seleciona o texto do input
    }
  };

  const texto = `Leio a ${nome} todo dia e vale muito. Cadastro grátis: ${link}`;
  const wa = `https://api.whatsapp.com/send/?text=${encodeURIComponent(texto)}`;

  return (
    <div className="idq-share">
      <style>{`
        .idq-share{background:#151517;border:1px solid rgba(255,255,255,.10);
          border-radius:14px;padding:20px}
        .idq-share label{display:block;font-family:system-ui,sans-serif;font-size:12px;
          letter-spacing:.14em;text-transform:uppercase;color:#8D8B89;margin-bottom:10px}
        .idq-share input{width:100%;background:#0E0E0F;color:#D3D1CF;
          border:1px solid rgba(255,255,255,.16);border-radius:8px;padding:12px 14px;
          font-family:ui-monospace,monospace;font-size:13px;margin-bottom:12px}
        .idq-share .row{display:flex;gap:10px;flex-wrap:wrap}
        .idq-share button,.idq-share a{flex:1;min-width:140px;text-align:center;
          font-family:system-ui,sans-serif;font-size:14px;font-weight:600;
          padding:12px 16px;border-radius:8px;cursor:pointer;text-decoration:none;
          border:1px solid transparent}
        .idq-share button{background:#AA7853;color:#0E0E0F}
        .idq-share a{background:transparent;color:#D3D1CF;
          border-color:rgba(255,255,255,.22)}
      `}</style>
      <label>Seu link pessoal</label>
      <input readOnly value={link} onFocus={(ev) => ev.target.select()} />
      <div className="row">
        <button onClick={copiar}>{copiado ? "Copiado ✓" : "Copiar link"}</button>
        <a href={wa} target="_blank" rel="noopener noreferrer">
          Compartilhar no WhatsApp
        </a>
      </div>
    </div>
  );
}
