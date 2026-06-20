"use client";

import { useEffect, useState, type CSSProperties } from "react";
import PageBeacon from "../PageBeacon";

/* Pagina cadastro-confirmado: PADRAO OURO da rede (gerado, nao editar a mao).
   Fonte: _shared (gen_confirmado_pages.py). Reskin por marca: cor + fonte + logo. */

const C = {
  bg: "#2C1810", card: "#1E100A", accent: "#C8963E",
  accentText: "#2C1810", text: "#F5EDE0", muted: "#9E8E7A", border: "rgba(200, 150, 62, 0.12)",
};
const FH = "\"Eczar\", Georgia, serif";
const FB = "\"Plus Jakarta Sans\", -apple-system, system-ui, sans-serif";
const FONTS_HREF = "https://fonts.googleapis.com/css2?family=Eczar:ital,wght@0,400;0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";
const LOGO = "/images/logo/simbolo.png";
const ENC = "leia%40notasdocafe.com.br";
const WHATS = "https://sndflw.com/i/3bRJTg1vXSQL9pyKp5nE";
const HORA = "08:08";
const SLUG = "notas-do-cafe";

export default function CadastroConfirmado() {
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    try { if (sessionStorage.getItem("vdn_pesquisa") === "filled") setFilled(true); } catch {}
  }, []);
  const total = filled ? 2 : 3;
  const gmail = `https://mail.google.com/mail/u/0/#search/from%3A${ENC}`;
  const hotmail = `https://outlook.live.com/mail/0/search?q=from%3A${ENC}`;
  const yahoo = `https://mail.yahoo.com/d/search/keyword=from%3A${ENC}`;

  const card: CSSProperties = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 20px 22px" };
  const lab: CSSProperties = { fontFamily: FB, fontSize: 10.5, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.accent, marginBottom: 9 };
  const h3: CSSProperties = { fontFamily: FH, fontWeight: 700, fontSize: 18.5, lineHeight: 1.2, color: C.text, margin: "0 0 7px" };
  const desc: CSSProperties = { fontSize: 14, lineHeight: 1.6, color: C.muted, margin: "0 0 16px" };
  const btnPrimary: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", textDecoration: "none", fontFamily: FB, fontWeight: 700, borderRadius: 9, background: C.accent, color: C.accentText, fontSize: 15, padding: "14px 18px", border: `1px solid ${C.accent}`, width: "100%" };
  const btnGhost: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", textDecoration: "none", fontFamily: FB, fontWeight: 600, borderRadius: 9, background: "transparent", color: C.text, fontSize: 13.5, padding: "12px 10px", border: `1px solid ${C.border}` };

  return (
    <>
      <link rel="stylesheet" href={FONTS_HREF} />
      <PageBeacon slug={SLUG} step="confirmado" />
      <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "54px 22px 60px", textAlign: "center", background: C.bg, color: C.text, fontFamily: FB }}>
        <div style={{ width: "100%", maxWidth: 432 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} alt="Notas do Café" width={78} height={78} style={{ display: "block", margin: "0 auto 24px", width: 78, height: 78, objectFit: "contain" }} />
          <p style={{ fontFamily: FB, fontSize: 11.5, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: C.accent, margin: "0 0 14px" }}>Cadastro confirmado</p>
          <h1 style={{ fontFamily: FH, fontWeight: 700, fontSize: "clamp(28px,8vw,38px)", lineHeight: 1.1, color: C.text, letterSpacing: "-.01em", margin: "0 0 18px" }}>
            Bem-vindo à <em style={{ color: C.accent, fontStyle: "italic" }}>Notas do Café</em>
          </h1>
          <div style={{ width: 42, height: 2, background: C.accent, borderRadius: 2, margin: "0 auto 18px", opacity: .85 }} />
          <p style={{ fontSize: 16, lineHeight: 1.62, color: C.muted, maxWidth: 380, margin: "0 auto 34px" }}>
            A primeira edição chega em breve, às {HORA}. Enquanto isso, complete {total === 2 ? "as 2 missões" : "as 3 missões"} abaixo.
          </p>
          <ol style={{ listStyle: "none", display: "grid", gap: 14, textAlign: "left", padding: 0, margin: 0 }}>
            <li style={card}>
              <div style={lab}>Missão 1</div>
              <h3 style={h3}>Confirme seu email</h3>
              <p style={desc}>Procure o email de confirmação na sua caixa de entrada e clique no link. Sem isso, as edições não chegam.</p>
              <a href={gmail} target="_blank" rel="noopener noreferrer" style={btnPrimary}>Abrir Gmail</a>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginTop: 9 }}>
                <a href={hotmail} target="_blank" rel="noopener noreferrer" style={btnGhost}>Hotmail</a>
                <a href={yahoo} target="_blank" rel="noopener noreferrer" style={btnGhost}>Yahoo</a>
              </div>
            </li>
            <li style={card}>
              <div style={lab}>Missão 2</div>
              <h3 style={h3}>Entre no grupo do WhatsApp</h3>
              <p style={desc}>Receba um aviso antes de cada edição. Sem spam, sem conversa. Leva 10 segundos.</p>
              <a href={WHATS} target="_blank" rel="noopener noreferrer" style={btnPrimary}>Entrar no grupo →</a>
            </li>
            {!filled && (
            <li style={card}>
              <div style={lab}>Missão 3</div>
              <h3 style={h3}>Responda a pesquisa</h3>
              <p style={desc}>Conta rápido quem é você pra cada edição chegar mais afiada pro seu perfil. Leva 1 minuto.</p>
              <a href="/pesquisa" style={btnPrimary}>Responder pesquisa →</a>
            </li>
            )}
          </ol>
        </div>
      </main>
    </>
  );
}
