"use client";

import { useEffect, useState } from "react";

interface ConfettiPiece {
  id: number;
  color: string;
  left: number;
  delay: number;
  duration: number;
  width: number;
  height: number;
  rotation: number;
}

export default function EbookConfirmado() {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [visibleMissions, setVisibleMissions] = useState<boolean[]>([false, false, false]);

  useEffect(() => {
    const colors = ["#8B4513", "#C8963E", "#D2691E"];
    setConfetti(
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        left: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 3 + Math.random() * 3,
        width: 4 + Math.random() * 4,
        height: 8 + Math.random() * 8,
        rotation: Math.random() * 360,
      }))
    );

    const timers = [
      setTimeout(() => setVisibleMissions((v) => [true, v[1], v[2]]), 600),
      setTimeout(() => setVisibleMissions((v) => [v[0], true, v[2]]), 1000),
      setTimeout(() => setVisibleMissions((v) => [v[0], v[1], true]), 1400),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  const missions = [
    {
      title: "Confirme seu email",
      description:
        "Procure o email de confirmação na sua caixa de entrada. O guia A Xícara Certa será enviado logo em seguida.",
      links: [
        {
          label: "Abrir Gmail",
          href: "https://mail.google.com/mail/u/0/?utm_source=notasdocafe.com.br&utm_medium=referral#search/from%3Aleia%40notasdocafe.com.br",
        },
        {
          label: "Abrir Hotmail",
          href: "https://outlook.live.com/mail/0/search?q=from%3Aleia%40notasdocafe.com.br&utm_source=notasdocafe.com.br&utm_medium=referral",
        },
        {
          label: "Abrir Yahoo",
          href: "https://mail.yahoo.com/d/search/keyword=from%3Aleia%40notasdocafe.com.br?utm_source=notasdocafe.com.br&utm_medium=referral",
        },
      ],
    },
    {
      title: "Entre no grupo do WhatsApp",
      description:
        "Receba um aviso antes de cada edição. Sem spam, sem conversa.",
      links: [
        {
          label: "Entrar no WhatsApp",
          href: "https://sndflw.com/i/JhnzyvV5ALSzaITdywzN",
        },
      ],
    },
    {
      title: "Responda a pesquisa",
      description:
        "3 minutos pra contar como você toma café. Assim cada edição chega mais próxima da sua xícara.",
      links: [
        {
          label: "Responder pesquisa",
          href: "https://lp.notasdocafe.com.br/pesquisa",
        },
      ],
    },
  ];

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0% { opacity: 0.6; transform: translateY(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(110vh) rotate(540deg); }
        }
        @keyframes badgePop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Confetti */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50, overflow: "hidden" }}>
        {confetti.map((p) => (
          <span
            key={p.id}
            style={{
              position: "absolute",
              top: "-20px",
              left: `${p.left}%`,
              width: `${p.width}px`,
              height: `${p.height}px`,
              background: p.color,
              borderRadius: "1px",
              transform: `rotate(${p.rotation}deg)`,
              animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
              opacity: 0,
            }}
          />
        ))}
      </div>

      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem 1.5rem",
          textAlign: "center",
          background: "var(--bg)",
        }}
      >
        <img
          src="/images/logo/simbolo.png"
          alt="Notas do Café"
          width={64}
          height={64}
          style={{
            marginBottom: "2rem",
            animation: "badgePop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.3s both",
          }}
        />

        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: "1rem",
            animation: "fadeUp 0.9s ease-out 0.5s both",
          }}
        >
          Guia a caminho
        </p>

        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 700,
            lineHeight: 1.15,
            color: "var(--text)",
            marginBottom: "1.25rem",
            animation: "fadeUp 0.9s ease-out 0.7s both",
          }}
        >
          A Xícara Certa está <em style={{ fontStyle: "italic", color: "var(--accent)" }}>no forno</em>
        </h1>

        <div
          style={{
            width: "40px",
            height: "1px",
            background: "var(--accent)",
            margin: "0 auto 1.25rem",
            animation: "fadeUp 0.9s ease-out 0.8s both",
          }}
        />

        <p
          style={{
            fontSize: "1.0625rem",
            color: "var(--text-secondary)",
            maxWidth: "480px",
            lineHeight: 1.75,
            marginBottom: "3rem",
            animation: "fadeUp 0.9s ease-out 0.9s both",
          }}
        >
          O guia em PDF será enviado para o seu email em instantes.
          Enquanto isso, complete as 3 missões abaixo.
        </p>

        {/* Missions */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            maxWidth: "580px",
            width: "100%",
          }}
        >
          {missions.map((mission, i) => (
            <div
              key={i}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "1.5rem 1.5rem 1.5rem 1.75rem",
                textAlign: "left",
                opacity: visibleMissions[i] ? 1 : 0,
                transform: visibleMissions[i] ? "translateY(0)" : "translateY(20px)",
                transition: "opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--accent)",
                  marginBottom: "0.4rem",
                }}
              >
                Missão {i + 1}
              </p>
              <h3
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: "0.5rem",
                }}
              >
                {mission.title}
              </h3>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.65,
                  marginBottom: "1rem",
                }}
              >
                {mission.description}
              </p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {mission.links.map((link, j) => (
                  <a
                    key={j}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "var(--bg)",
                      background: "var(--accent)",
                      border: "1px solid var(--accent)",
                      padding: "0.55rem 1.1rem",
                      borderRadius: "4px",
                      textDecoration: "none",
                      transition: "background 0.3s",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#D4A44A")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p
          style={{
            fontFamily: "var(--font-heading)",
            fontStyle: "italic",
            fontSize: "1rem",
            color: "var(--text-muted)",
            marginTop: "3rem",
            animation: "fadeUp 0.9s ease-out 1.8s both",
          }}
        >
          Bom café. Até sábado.
        </p>
      </main>
    </>
  );
}
