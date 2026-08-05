"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Player HTML5 próprio da VSL (réplica leva 2 do golden FI, ticket 15).
 * Sem controles nativos: o gate da oferta usa tempo REAL de play (currentTime),
 * então o seek fica bloqueado até `seekable` (a página libera após o reveal).
 * Autoplay mudo quando o browser deixa; overlay de unmute reinicia do zero
 * (quem ativa o som não perdeu nada).
 */
type Props = {
  src: string;
  poster: string;
  onTime?: (t: number) => void;
  /** Play deliberado (som ligado), 1x por sessão. Autoplay mudo não conta. */
  onPlay?: () => void;
  seekable?: boolean;
  /** Segundo em que o vídeo começa (autoplay E replay com som). A página usa
   *  pra pular a abertura que assume o quiz quando o leitor veio sem teste. */
  startAt?: number;
};

export default function VslPlayer({ src, poster, onTime, onPlay, seekable, startAt }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const played = useRef(false);
  const startRef = useRef(0);

  // o valor chega depois do mount (a página lê o contexto de quiz num effect),
  // então aplica no vídeo já em autoplay mudo enquanto ninguém deu play com som
  useEffect(() => {
    startRef.current = startAt || 0;
    const v = video.current;
    if (v && !played.current && startRef.current > 0 && v.currentTime < startRef.current) {
      v.currentTime = startRef.current;
    }
  }, [startAt]);
  const [phase, setPhase] = useState<"idle" | "muted" | "sound">("idle");
  const [paused, setPaused] = useState(false);
  const [pct, setPct] = useState(0);

  // tenta autoplay mudo; bloqueou = fica no poster com o play grande
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.muted = true;
    v.play()
      .then(() => setPhase("muted"))
      .catch(() => setPhase("idle"));
  }, []);

  function timeUpdate() {
    const v = video.current;
    if (!v) return;
    if (v.duration) setPct((v.currentTime / v.duration) * 100);
    onTime?.(v.currentTime);
  }

  function startWithSound() {
    const v = video.current;
    if (!v) return;
    v.currentTime = startRef.current;
    v.muted = false;
    v.play().catch(() => undefined);
    setPhase("sound");
    setPaused(false);
    if (!played.current) {
      played.current = true;
      onPlay?.();
    }
  }

  function togglePause() {
    const v = video.current;
    if (!v || phase !== "sound") return;
    if (v.paused) {
      v.play().catch(() => undefined);
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const v = video.current;
    if (!v || !seekable || !v.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - r.left) / r.width) * v.duration;
  }

  return (
    <div className="vsl-player">
      <video
        ref={video}
        src={src}
        poster={poster}
        preload="auto"
        playsInline
        onTimeUpdate={timeUpdate}
        onClick={togglePause}
        onEnded={() => setPaused(true)}
      />

      {phase !== "sound" && (
        <button type="button" className="cover" onClick={startWithSound}>
          {phase === "muted" ? (
            <>
              <span className="pulse-ring" aria-hidden="true" />
              <span className="big-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z" fill="currentColor" stroke="none"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9.5 9.5 0 0 1 0 13"/></svg>
              </span>
              <span className="cover-label">Toque para ouvir</span>
              <span className="cover-sub">O vídeo recomeça do início, com som</span>
            </>
          ) : (
            <>
              <span className="pulse-ring" aria-hidden="true" />
              <span className="big-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor"><path d="M8 5v14l11-7L8 5Z"/></svg>
              </span>
              <span className="cover-label">Ver a minha xícara</span>
            </>
          )}
        </button>
      )}

      {phase === "sound" && paused && (
        <button type="button" className="cover cover-thin" onClick={togglePause}>
          <span className="big-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor"><path d="M8 5v14l11-7L8 5Z"/></svg>
          </span>
          <span className="cover-label">Continuar</span>
        </button>
      )}

      <div
        className={"track" + (seekable ? " can-seek" : "")}
        onClick={seek}
        role={seekable ? "slider" : undefined}
        aria-label={seekable ? "Posição do vídeo" : undefined}
      >
        <i style={{ width: `${pct}%` }} />
      </div>

      <style jsx>{`
        .vsl-player {
          position: relative;
          border-radius: 14px;
          overflow: hidden;
          background: #000;
          border: 1px solid rgba(200, 150, 62, 0.18);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.5);
        }
        video {
          display: block;
          width: 100%;
          aspect-ratio: 16 / 9;
          cursor: pointer;
        }
        .cover {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          border: 0;
          cursor: pointer;
          color: #f5ede0;
          background: linear-gradient(180deg, rgba(44, 24, 16, 0.25), rgba(44, 24, 16, 0.68));
          font-family: inherit;
        }
        .cover-thin {
          background: rgba(44, 24, 16, 0.45);
        }
        .big-icon {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 84px;
          height: 84px;
          border-radius: 50%;
          background: #c8963e;
          color: #1e100a;
          box-shadow: 0 10px 34px rgba(200, 150, 62, 0.45);
        }
        .pulse-ring {
          position: absolute;
          width: 84px;
          height: 84px;
          border-radius: 50%;
          border: 1px solid rgba(212, 164, 74, 0.8);
          animation: vslpulse 2.2s ease-out infinite;
        }
        @keyframes vslpulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.85); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pulse-ring { animation: none; opacity: 0; }
        }
        .cover-label {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .cover-sub {
          font-size: 12.5px;
          color: rgba(245, 237, 224, 0.75);
          margin-top: -6px;
        }
        .track {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 4px;
          background: rgba(245, 237, 224, 0.14);
        }
        .track.can-seek {
          cursor: pointer;
          height: 7px;
        }
        .track i {
          display: block;
          height: 100%;
          background: #c8963e;
          transition: width 0.25s linear;
        }
      `}</style>
    </div>
  );
}
