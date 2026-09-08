"use client";

import { useEffect, useRef, useState } from "react";
import { sendBeacon } from "../../PageBeacon";

/* Saída do checkout do ebook (c4-20k/40, destino B do 39; rollout 41): quem faz o gesto de sair sem
   pagar recebe o capítulo 1 na versão web, sem cadastro. Uma vez por sessão, só depois do
   gesto de sair (regra R2 do app/25). Desktop = mouse cruza o topo; toque = subida rápida
   depois de 60% da página (raro no checkout curto, aceito). Molde do ExitIntent do checkout
   do curso VDN, na pele da casa (tokens do <style> do checkout).
   Beacons: ebook-checkout-exit (abriu), ebook-checkout-exit-cta (clicou) e
   ebook-checkout-volta-cap1 (voltou da página do capítulo 1). A volta se mede por beacon
   porque o src da jornada é first-touch: ?src=cap1-volta só grava em sessão nova. */
const HREF = "/ebook-premium-capitulo-1?src=ck-ebook-exit";

export default function ExitIntent({ slug, titulo }: { slug: string; titulo: string }) {
  const [aberta, setAberta] = useState(false);
  const ja = useRef(false);
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("src") === "cap1-volta") {
        sendBeacon(slug, "ebook-checkout-volta-cap1");
      }
    } catch {
      /* sem URLSearchParams: segue sem o beacon da volta */
    }
    const abre = () => {
      if (ja.current) return;
      try {
        if (sessionStorage.getItem("ebook_ck_exit")) return;
        sessionStorage.setItem("ebook_ck_exit", "1");
      } catch {
        /* modo privado: o guard fica só no ref */
      }
      ja.current = true;
      setAberta(true);
      sendBeacon(slug, "ebook-checkout-exit");
    };
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) abre();
    };
    document.addEventListener("mouseleave", onLeave);
    const toque = "ontouchstart" in window || window.matchMedia("(pointer:coarse)").matches;
    let onScroll: (() => void) | undefined;
    if (toque) {
      let fundo = false, uy = window.scrollY, ry = uy, rt = 0;
      onScroll = () => {
        const y = window.scrollY, t = Date.now(), h = document.documentElement.scrollHeight - window.innerHeight;
        if (h > 0 && y / h >= 0.6) fundo = true;
        if (y < uy) {
          if (!rt) { rt = t; ry = uy; }
          if (fundo && ry - y >= 320 && t - rt <= 350) abre();
        } else rt = 0;
        uy = y;
      };
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    return () => {
      document.removeEventListener("mouseleave", onLeave);
      if (onScroll) window.removeEventListener("scroll", onScroll);
    };
  }, [slug]);

  useEffect(() => {
    if (!aberta) return;
    caixa.current?.focus();
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberta(false);
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [aberta]);

  if (!aberta) return null;
  return (
    <div
      className="saida aberta"
      role="dialog"
      aria-modal="true"
      aria-labelledby="saida-titulo"
      onClick={(e) => {
        if (e.target === e.currentTarget) setAberta(false);
      }}
    >
      <div className="saida-box" ref={caixa} tabIndex={-1}>
        <button type="button" className="saida-x" aria-label="Fechar" onClick={() => setAberta(false)}>×</button>
        <p className="saida-kicker">Antes de sair</p>
        <h2 id="saida-titulo">Leia o capítulo 1 antes de decidir.</h2>
        <p className="saida-texto">
          O primeiro capítulo de <em>{titulo}</em>, inteiro, na versão web. Sem cadastro.
        </p>
        <a
          className="saida-cta"
          href={HREF}
          onClick={() => sendBeacon(slug, "ebook-checkout-exit-cta", { eventType: "converteu" })}
        >
          Ler o capítulo 1 →
        </a>
        <button type="button" className="saida-fechar" onClick={() => setAberta(false)}>
          Continuar aqui
        </button>
      </div>
      <style>{`
        .saida{position:fixed;inset:0;z-index:9999;background:rgba(6,4,5,.82);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:24px}
        .saida-box{position:relative;width:100%;max-width:420px;background:var(--bg-deep,#120609);border:1px solid var(--hair-accent,rgba(200,125,146,.3));border-radius:20px;padding:32px 24px;text-align:center;outline:none;box-shadow:0 30px 70px rgba(0,0,0,.6)}
        .saida-x{position:absolute;top:8px;right:16px;background:none;border:0;color:var(--text-dim,#8E8688);font-size:24px;line-height:1;cursor:pointer}
        .saida-kicker{font-family:var(--mono,ui-monospace,monospace);font-size:11px;font-weight:500;letter-spacing:.24em;text-transform:uppercase;color:var(--bright,#C87D92);margin:0 0 12px}
        .saida-box h2{font-family:var(--serif,Georgia,serif);font-style:italic;font-weight:900;font-size:24px;line-height:1.2;color:#fff;margin:0 0 12px;letter-spacing:-.01em}
        .saida-texto{font-size:14px;line-height:1.6;color:var(--text,#CFC8CA);margin:0 0 24px}
        .saida-texto em{color:#fff}
        .saida-cta{display:block;width:100%;box-sizing:border-box;padding:16px 24px;border-radius:999px;background:var(--bright,#C87D92);color:var(--bg-deep,#140408);font-weight:700;font-size:17px;text-decoration:none;transition:background .16s ease}
        .saida-cta:hover{filter:brightness(1.08)}
        .saida-fechar{margin-top:16px;background:none;border:0;color:var(--text-dim,#8E8688);font-family:var(--sans,inherit);font-size:14px;cursor:pointer;text-decoration:underline;text-underline-offset:4px}
        @media (max-width:480px){.saida{align-items:flex-end;padding:0}.saida-box{max-width:none;border-radius:20px 20px 0 0;padding:28px 20px calc(24px + env(safe-area-inset-bottom))}}
      `}</style>
    </div>
  );
}
