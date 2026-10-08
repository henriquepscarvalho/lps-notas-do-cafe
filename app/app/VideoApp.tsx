"use client";

import { useEffect } from "react";
import { sendBeacon } from "../PageBeacon";

/* vex/08 (01/10/26): vídeo explainer do par ebook + app no hero da LP /app. 2º botão «Assista ao vídeo
   explicativo» ao lado do botão principal + lightbox que fecha sozinho no fim (molde do vex/04). O botão
   principal não muda de lugar: o pai dele só ganha quebra de linha quando ainda não tem. Marcações no
   lp_page_views: app-lp-video-play (1º play) e app-lp-video-90 (90% assistido), uma por sessão.
   Fonte única: _shared/scripts/templates/VideoApp.tsx, publicada por _shared/scripts/rollout_video_app.py. */
const CSS_VX = `
.vx-play{display:inline-flex;align-items:center;gap:10px;margin:0;padding:0 22px 0 14px;border:1px solid var(--acento-texto,var(--acento));background:transparent;cursor:pointer;color:var(--texto-forte);font:inherit;border-radius:999px;-webkit-tap-highlight-color:transparent}
.vx-play:focus-visible{outline:2px solid var(--acento);outline-offset:3px}
.vx-play-ic{flex:0 0 auto;width:30px;height:30px;border-radius:50%;background:var(--acento);color:var(--sobre-acento);display:flex;align-items:center;justify-content:center}
.vx-play-ic svg{width:12px;height:12px;margin-left:2px;display:block}
.vx-play-tx b{font-weight:700;font-size:15px;white-space:nowrap}
.vx-lb{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:24px}
.vx-lb[hidden]{display:none}
.vx-lb-bg{position:absolute;inset:0;background:rgba(6,6,8,.86);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.vx-lb-box{position:relative;width:min(960px,100%);aspect-ratio:16/9;background:#000;border-radius:14px;box-shadow:0 40px 80px -30px rgba(0,0,0,.8)}
.vx-lb-box video{width:100%;height:100%;display:block;background:#000;border-radius:14px}
.vx-lb-x{position:absolute;top:-52px;right:0;width:44px;height:44px;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-size:26px;line-height:44px;text-align:center;padding:0;cursor:pointer}
@media (max-width:700px){.vx-lb{padding:12px}}
`;

export default function VideoApp({ slug, video, poster }: { slug: string; video: string; poster: string }) {
  useEffect(() => {
    const cta = document.querySelector<HTMLAnchorElement>(".lp-hero a.cta, .hero a.cta");
    const pai = cta ? cta.parentElement : null;
    if (!cta || !pai) return;

    const st = document.createElement("style");
    st.textContent = CSS_VX;
    document.head.appendChild(st);

    // o pai do botão principal: só o que falta pra pílula caber ao lado (ou embaixo, no celular)
    const antes = { wrap: pai.style.flexWrap, gap: pai.style.gap };
    const cs = getComputedStyle(pai);
    const flex = cs.display.indexOf("flex") >= 0;
    if (flex && cs.flexWrap === "nowrap") pai.style.flexWrap = "wrap";
    if (flex && !(parseFloat(cs.columnGap) >= 8)) pai.style.gap = "12px";

    const b = document.createElement("button");
    b.type = "button";
    b.className = "vx-play";
    b.setAttribute("aria-haspopup", "dialog");
    b.innerHTML =
      '<span class="vx-play-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></span>' +
      '<span class="vx-play-tx"><b>Assista ao vídeo explicativo</b></span>';
    if (!flex) b.style.marginLeft = "12px";
    const altura = () => {
      b.style.height = cta.offsetHeight + "px";
    };
    altura();
    cta.insertAdjacentElement("afterend", b);
    // vex/12 (07/10/26): o botão nasce aqui, depois da 1ª pintura, e a animação dele (mPousa, .lp-hero.m-on)
    // partiria do relógio da hidratação, 0,7 a 0,9 s atrás do resto do hero. Entra no relógio do título:
    // a sequência chega inteira no tempo da cópia aceita; hidratação tardia mostra o botão já pousado.
    // vex/13 (08/10/26): a EE ainda chama a section de .hero, então o seletor aceita os dois nomes.
    try {
      const h1 = document.querySelector(".lp-hero.m-on h1, .hero.m-on h1");
      const ref = h1 ? h1.getAnimations()[0] : undefined;
      if (ref && ref.startTime !== null) b.getAnimations().forEach((a) => { a.startTime = ref.startTime; });
    } catch {
      /* sem animação */
    }

    const lb = document.createElement("div");
    lb.className = "vx-lb";
    lb.hidden = true;
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Vídeo explicativo");
    lb.innerHTML =
      '<div class="vx-lb-bg"></div><div class="vx-lb-box"><button type="button" class="vx-lb-x" aria-label="Fechar">×</button>' +
      '<video controls playsinline preload="none"></video></div>';
    const v = lb.querySelector("video") as HTMLVideoElement;
    v.poster = poster;
    document.body.appendChild(lb);

    let fim: number | undefined;
    let rolagem = "";
    const fecha = () => {
      if (lb.hidden) return;
      window.clearTimeout(fim);
      v.pause();
      lb.hidden = true;
      document.documentElement.style.overflow = rolagem;
      b.focus();
    };
    const abre = () => {
      if (!v.getAttribute("src")) v.src = video;
      if (v.ended) v.currentTime = 0;
      rolagem = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      lb.hidden = false;
      v.play().catch(() => {
        /* autoplay barrado: o leitor dá o play nos controles */
      });
    };
    const tocou = () => sendBeacon(slug, "app-lp-video-play");
    const andou = () => {
      if (v.duration > 0 && v.currentTime / v.duration >= 0.9) sendBeacon(slug, "app-lp-video-90");
    };
    const acabou = () => {
      fim = window.setTimeout(fecha, 500);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") fecha();
    };
    const bg = lb.querySelector(".vx-lb-bg") as HTMLElement;
    const x = lb.querySelector(".vx-lb-x") as HTMLElement;

    b.addEventListener("click", abre);
    bg.addEventListener("click", fecha);
    x.addEventListener("click", fecha);
    v.addEventListener("play", tocou);
    v.addEventListener("timeupdate", andou);
    v.addEventListener("ended", acabou);
    document.addEventListener("keydown", tecla);
    window.addEventListener("resize", altura);

    return () => {
      window.clearTimeout(fim);
      document.removeEventListener("keydown", tecla);
      window.removeEventListener("resize", altura);
      if (!lb.hidden) document.documentElement.style.overflow = rolagem;
      v.pause();
      b.remove();
      lb.remove();
      st.remove();
      pai.style.flexWrap = antes.wrap;
      pai.style.gap = antes.gap;
    };
  }, [slug, video, poster]);

  // marcador lido no ar pelo censo do rollout (vem no HTML do servidor)
  return <span id="vx-app" data-vx="vex08-v1" hidden />;
}
