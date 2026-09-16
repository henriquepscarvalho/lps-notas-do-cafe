"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
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

/* Na LP do ebook (c4-20k/106) o mesmo modal entra com origem="lp": href, beacons e chave de sessão
   próprios. A chave do checkout segue ebook_ck_exit de propósito: quem viu o modal na LP e chegou ao
   checkout ainda pode ver o dele, e a leitura do 42 não perde denominador. */
const ORIGEM = {
  ck: { href: HREF, chave: "ebook_ck_exit", viu: "ebook-checkout-exit", cta: "ebook-checkout-exit-cta", lp: false },
  lp: { href: "/ebook-premium-capitulo-1?src=lp-ebook-exit", chave: "ebook_lp_exit", viu: "ebook-lp-exit", cta: "ebook-lp-exit-cta", lp: true },
} as const;

type Cor = number[];

/* Pele da LP: o que a página pinta atrás do leitor (fundo da seção no meio da tela, tinta do texto,
   botão que leva ao checkout), com os tokens do :root só de reserva e contraste garantido. Nunca os
   tokens do checkout: o globals.css da casa é escuro e os braços B e C do split do 62 são papel claro. */
function peleDaLp(): CSSProperties {
  const sonda = document.createElement("i");
  document.body.appendChild(sonda);
  const rgb = (c: string | null | undefined): Cor | null => {
    if (!c) return null;
    sonda.style.color = "";
    sonda.style.color = c.trim();
    if (!sonda.style.color) return null;
    const m = getComputedStyle(sonda).color.match(/[\d.]+/g);
    return m && m.length >= 3 && (m.length < 4 || Number(m[3]) >= 0.9) ? m.slice(0, 3).map(Number) : null;
  };
  const lum = (c: Cor) => {
    const [r, g, b] = c.map((x) => (x / 255 <= 0.03928 ? x / 255 / 12.92 : ((x / 255 + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contraste = (a: Cor, b: Cor) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  const mistura = (a: Cor, b: Cor, p: number) => a.map((x, i) => Math.round(x * p + b[i] * (1 - p)));
  const css = (c: Cor) => `rgb(${c.join(",")})`;
  const raiz = getComputedStyle(document.documentElement);
  const token = (...nomes: string[]) => nomes.map((n) => rgb(raiz.getPropertyValue(n))).find(Boolean) || null;
  const fonte = (...nomes: string[]) => nomes.map((n) => raiz.getPropertyValue(n).trim()).find(Boolean) || "";

  let fundo: Cor | null = null;
  for (let el = document.elementFromPoint(innerWidth / 2, innerHeight / 2); el && !fundo; el = el.parentElement) {
    if (el.getBoundingClientRect().width >= innerWidth * 0.6) fundo = rgb(getComputedStyle(el).backgroundColor);
  }
  fundo = fundo || rgb(getComputedStyle(document.body).backgroundColor) || token("--bg", "--fundo", "--papel", "--paper") || [255, 255, 255];
  const base = fundo;
  const claro = lum(base) > 0.4;
  const legivel = (c: Cor | null, min: number) => (c && contraste(c, base) >= min ? c : null);
  const h1 = document.querySelector("h1");
  const tinta = legivel(rgb(getComputedStyle(document.body).color), 4.5) || legivel(token("--text", "--tinta", "--ink"), 4.5) || (claro ? [34, 30, 28] : [232, 228, 224]);
  const titulo = legivel(h1 ? rgb(getComputedStyle(h1).color) : null, 4.5) || tinta;

  let acento: Cor | null = null, sobre: Cor | null = null;
  for (const a of Array.from(document.querySelectorAll<HTMLElement>('a[href*="checkout"]'))) {
    const s = getComputedStyle(a), bg = rgb(s.backgroundColor), fg = rgb(s.color);
    if (bg && fg && contraste(bg, fg) >= 3 && contraste(bg, base) >= 1.3) { acento = bg; sobre = fg; break; }
  }
  if (!acento) {
    acento = legivel(token("--acc", "--bright", "--vinho", "--terra"), 1.3) || tinta;
    const btn = token("--btn-text", "--sobre-vinho");
    sobre = btn && contraste(btn, acento) >= 3 ? btn : contraste(acento, [255, 255, 255]) >= contraste(acento, [17, 17, 17]) ? [255, 255, 255] : [17, 17, 17];
  }
  sonda.remove();
  return {
    "--sx-bg": css(base), "--sx-ink": css(tinta), "--sx-head": css(titulo), "--sx-dim": css(mistura(tinta, base, 0.72)),
    "--sx-acc": css(acento), "--sx-acc-ink": css(sobre || [255, 255, 255]), "--sx-kick": css(legivel(acento, 3) || tinta),
    "--sx-hair": css(mistura(acento, base, 0.35)),
    "--sx-serif": (h1 && getComputedStyle(h1).fontFamily) || fonte("--serif", "--display") || "Georgia,serif",
    "--sx-mono": fonte("--mono") || "ui-monospace,monospace", "--sx-sans": getComputedStyle(document.body).fontFamily || "system-ui,sans-serif",
  } as CSSProperties;
}

export default function ExitIntent({ slug, titulo, origem = "ck" }: { slug: string; titulo: string; origem?: "ck" | "lp" }) {
  const o = ORIGEM[origem];
  const [aberta, setAberta] = useState(false);
  const [pele, setPele] = useState<CSSProperties | undefined>(undefined);
  const ja = useRef(false);
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (!o.lp && new URLSearchParams(window.location.search).get("src") === "cap1-volta") {
        sendBeacon(slug, "ebook-checkout-volta-cap1");
      }
    } catch {
      /* sem URLSearchParams: segue sem o beacon da volta */
    }
    const abre = () => {
      if (ja.current) return;
      try {
        if (sessionStorage.getItem(o.chave)) return;
        sessionStorage.setItem(o.chave, "1");
      } catch {
        /* modo privado: o guard fica só no ref */
      }
      ja.current = true;
      if (o.lp) {
        try {
          setPele(peleDaLp());
        } catch {
          /* sem computed style: o modal abre na pele padrão */
        }
      }
      setAberta(true);
      sendBeacon(slug, o.viu);
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
  }, [slug, o]);

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
      className={pele ? "saida aberta saida-lp" : "saida aberta"}
      style={pele}
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
          href={o.href}
          onClick={() => sendBeacon(slug, o.cta, { eventType: "converteu" })}
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
        .saida-lp .saida-box{background:var(--sx-bg);border-color:var(--sx-hair);box-shadow:0 30px 70px rgba(0,0,0,.4)}
        .saida-lp .saida-x,.saida-lp .saida-fechar{color:var(--sx-dim);font-family:var(--sx-sans)}
        .saida-lp .saida-kicker{color:var(--sx-kick);font-family:var(--sx-mono)}
        .saida-lp .saida-box h2{color:var(--sx-head);font-family:var(--sx-serif)}
        .saida-lp .saida-texto{color:var(--sx-ink);font-family:var(--sx-sans)}
        .saida-lp .saida-texto em{color:var(--sx-head)}
        .saida-lp .saida-cta{background:var(--sx-acc);color:var(--sx-acc-ink);font-family:var(--sx-sans)}
        .saida-lp .saida-cta:hover{background:var(--sx-acc);filter:brightness(1.08)}
      `}</style>
    </div>
  );
}
