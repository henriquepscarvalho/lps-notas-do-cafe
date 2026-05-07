import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Abra a edição — Notas do Café",
  description: "A edição de hoje já chegou no seu email. Abra agora.",
};

const DOMAIN = "notasdocafe.com.br";
const SENDER = `leia@${DOMAIN}`;

const webmails = [
  {
    label: "Abrir no Gmail",
    href: `https://mail.google.com/mail/u/0/?utm_source=${DOMAIN}&utm_medium=referral#search/from%3A${encodeURIComponent(SENDER)}`,
  },
  {
    label: "Abrir no Hotmail",
    href: `https://outlook.live.com/mail/0/search?q=from%3A${encodeURIComponent(SENDER)}&utm_source=${DOMAIN}&utm_medium=referral`,
  },
  {
    label: "Abrir no Yahoo",
    href: `https://mail.yahoo.com/d/search/keyword=from%3A${encodeURIComponent(SENDER)}?utm_source=${DOMAIN}&utm_medium=referral`,
  },
];

export default function AbrirEmail() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem 1.5rem",
        textAlign: "center",
        background: "var(--bg, #ffffff)",
      }}
    >
      <Image
        src="/images/logo/simbolo.png"
        alt="Notas do Café"
        width={64}
        height={64}
        style={{ marginBottom: "2rem" }}
      />

      <p
        style={{
          fontFamily: "var(--font-body, var(--body, system-ui, sans-serif))",
          fontSize: "0.7rem",
          fontWeight: 600,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--primary, var(--accent, #1a1a1a))",
          marginBottom: "1rem",
        }}
      >
        Edição publicada
      </p>

      <h1
        style={{
          fontFamily: "var(--font-heading, var(--heading, Georgia, serif))",
          fontSize: "clamp(2rem, 5vw, 3rem)",
          fontWeight: 700,
          lineHeight: 1.15,
          color: "var(--text, var(--text-1, #0a0a0a))",
          marginBottom: "1.25rem",
          maxWidth: "520px",
        }}
      >
        Abra a edição no seu email.
      </h1>

      <div
        style={{
          width: "40px",
          height: "1px",
          background: "var(--primary, var(--accent, #1a1a1a))",
          margin: "0 auto 1.25rem",
        }}
      />

      <p
        style={{
          fontSize: "1.0625rem",
          color: "var(--muted, var(--text-2, #5a5a5a))",
          maxWidth: "440px",
          lineHeight: 1.75,
          marginBottom: "2.5rem",
        }}
      >
        A edição já chegou. Escolha seu provedor para ir direto.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          width: "100%",
          maxWidth: "360px",
        }}
      >
        {webmails.map((wm) => (
          <a
            key={wm.label}
            href={wm.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "var(--font-body, var(--body, system-ui, sans-serif))",
              fontSize: "0.875rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--bg, #ffffff)",
              background: "var(--primary, var(--accent, #1a1a1a))",
              border: "1px solid var(--primary, var(--accent, #1a1a1a))",
              padding: "1rem 1.5rem",
              borderRadius: "4px",
              textDecoration: "none",
            }}
          >
            {wm.label}
          </a>
        ))}
      </div>

      <p
        style={{
          fontFamily: "var(--font-heading, var(--heading, Georgia, serif))",
          fontStyle: "italic",
          fontSize: "1rem",
          color: "var(--muted, var(--text-2, #5a5a5a))",
          marginTop: "3rem",
        }}
      >
        O café guarda um mundo no aroma.
      </p>
    </main>
  );
}
