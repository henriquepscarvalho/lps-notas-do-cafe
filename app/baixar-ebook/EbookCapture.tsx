"use client";

import { useState, useEffect } from "react";
import { captureUtm, getUtm } from "../lib/utm";

const AUTOMATION_ID = "aut_e7997773-c01a-46ec-b616-a3a08ea4e3cf";

const CHAPTERS = [
  {
    title: "Espresso",
    desc: "O concentrado que define a cultura do café. 30ml que revelam tudo sobre a qualidade do grão.",
  },
  {
    title: "V60",
    desc: "A filtração que revela o grão sem piedade. O método mais honesto do café especial.",
  },
  {
    title: "French Press",
    desc: "Imersão total, corpo cheio, debate eterno. O método mais democrático do café.",
  },
  {
    title: "AeroPress",
    desc: "Versatilidade máxima em 2 minutos. Faz espresso, cold brew e filtrado. O melhor custo-benefício.",
  },
  {
    title: "Chemex",
    desc: "Beleza de laboratório, clareza na xícara. O filtro grosso produz o café mais limpo que existe.",
  },
  {
    title: "Cold Brew",
    desc: "Extração fria, 12 horas, resultado que divide opiniões. Naturalmente adocicado e concentrado.",
  },
];

type Status = "idle" | "sending" | "success" | "error";

const BUTTON_LABEL: Record<Status, string> = {
  idle: "Quero baixar grátis ↓",
  sending: "Enviando...",
  success: "Pronto!",
  error: "Erro, tente de novo",
};

function MailIcon() {
  return (
    <svg className="ebk-mail" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function EbookCapture() {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    captureUtm();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const groups: [string, number][] = [
      [".ebk-hero > div:first-child > *", 90],
      [".ebk-bookw", 0],
      [".ebk-sech", 0],
      [".ebk-inside .ebk-item", 65],
      [".ebk-forwho .ebk-q", 0],
      [".ebk-bridge", 0],
      [".ebk-final .ebk-wrap > *", 80],
    ];
    groups.forEach(([sel, step]) => {
      document.querySelectorAll<HTMLElement>(sel).forEach((el, i) => {
        el.classList.add("hcm-rise");
        el.style.transitionDelay = `${i * step}ms`;
      });
    });
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("hcm-in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".hcm-rise").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email") as string;
    if (!email) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, automationId: AUTOMATION_ID, utm: getUtm() }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setTimeout(() => {
        window.location.href = "/baixar-ebook-confirmado";
      }, 1500);
    } catch {
      setStatus("error");
    }
  }

  const disabled = status === "sending" || status === "success";

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
  .ebk{--bg:#2C1810;--bg2:#3D2517;--card:#241109;--hair:#4A3322;--cream:#F5EDE0;--muted:#C4A882;--faint:#8A7560;--gold:#C8963E;--gold-br:#D4A44A;--gold-dk:#3A2A10;
    background:var(--bg);color:var(--cream);font-family:var(--body),'DM Sans',sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden;min-height:100vh}
  .ebk *{box-sizing:border-box}
  .ebk .ebk-wrap{max-width:1080px;margin:0 auto;padding:0 24px}
  .ebk a{color:inherit}
  .ebk .ebk-nav{display:flex;align-items:center;gap:12px;padding:24px;max-width:1080px;margin:0 auto;background:transparent;min-height:0;position:relative;top:auto;justify-content:flex-start}
  .ebk .ebk-nav img{height:34px;width:auto}
  .ebk .ebk-nm{font-family:var(--heading),'Eczar',Georgia,serif;font-size:23px;font-weight:700;letter-spacing:.01em;color:var(--cream);-webkit-text-fill-color:var(--cream)}
  .ebk .ebk-nm span{color:var(--gold-br);-webkit-text-fill-color:var(--gold-br)}
  .ebk .ebk-badge{margin-left:auto;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--faint)}
  .ebk .ebk-hero{display:grid;grid-template-columns:1.15fr .85fr;gap:50px;align-items:center;padding:40px 0 76px;position:relative;min-height:0;background:transparent}
  .ebk .ebk-hero:before{content:'';position:absolute;top:-40px;left:-120px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(200,150,62,.10),transparent 70%);pointer-events:none}
  .ebk .ebk-hero>*{position:relative;z-index:1}
  .ebk .ebk-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin-bottom:22px;padding-bottom:9px;border-bottom:1px solid var(--hair)}
  .ebk h1{font-family:var(--heading),'Eczar',Georgia,serif;font-size:56px;line-height:1.05;font-weight:700;letter-spacing:-.01em;margin-bottom:20px;color:var(--cream);-webkit-text-fill-color:var(--cream);background:none}
  .ebk h1 em{font-style:italic;color:var(--gold-br);-webkit-text-fill-color:var(--gold-br)}
  .ebk .ebk-lead{font-size:18px;color:var(--muted);max-width:520px;margin-bottom:30px;line-height:1.7}
  .ebk .ebk-lead b{color:var(--cream);font-weight:600}
  .ebk .ebk-form{display:flex;gap:10px;max-width:480px;margin-bottom:14px}
  .ebk .ebk-field{position:relative;flex:1;display:flex}
  .ebk .ebk-mail{position:absolute;left:15px;top:50%;transform:translateY(-50%);width:19px;height:19px;color:var(--faint);pointer-events:none}
  .ebk .ebk-form input{flex:1;width:100%;background:var(--bg2);border:1px solid var(--hair);border-radius:11px;padding:16px 18px 16px 44px;color:var(--cream);font-size:15px;font-family:inherit}
  .ebk .ebk-form input::placeholder{color:var(--faint)}
  .ebk .ebk-form input:focus{outline:none;border-color:var(--gold);box-shadow:0 0 0 3px rgba(200,150,62,.18)}
  .ebk .ebk-form input:focus + .ebk-mail,.ebk .ebk-field:focus-within .ebk-mail{color:var(--gold)}
  .ebk .ebk-btn{background:var(--gold);color:#1E100A;border:none;border-radius:11px;padding:16px 26px;font-size:15px;font-weight:700;font-family:inherit;cursor:pointer;white-space:nowrap;transition:.15s;box-shadow:0 6px 16px rgba(8,7,4,.5);position:relative;overflow:hidden;isolation:isolate}
  .ebk .ebk-btn:hover{background:var(--gold-br);transform:translateY(-1px);box-shadow:0 8px 22px rgba(200,150,62,.28)}
  .ebk .ebk-btn:disabled{opacity:.7;cursor:default}
  .ebk .ebk-trust{font-size:13px;color:var(--faint);display:flex;align-items:center;gap:7px;flex-wrap:wrap}
  .ebk .ebk-trust b{color:var(--muted);font-weight:600}
  .ebk .ebk-bookw{display:flex;justify-content:center;perspective:1400px}
  .ebk .ebk-book{width:330px;transform:rotateY(-15deg) rotateX(3deg);transition:.5s;filter:drop-shadow(28px 34px 60px rgba(0,0,0,.6))}
  .ebk .ebk-book:hover{transform:rotateY(-6deg) rotateX(1deg)}
  .ebk .ebk-book img{width:100%;display:block}
  .ebk .ebk-sec{padding:64px 0;border-top:1px solid var(--hair)}
  .ebk .ebk-sech{text-align:center;margin-bottom:44px}
  .ebk .ebk-seck{font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold-br);font-weight:600;margin-bottom:12px}
  .ebk .ebk-sech h2{font-family:var(--heading),'Eczar',Georgia,serif;font-size:42px;font-weight:700;letter-spacing:-.01em;color:var(--cream);-webkit-text-fill-color:var(--cream);background:none}
  .ebk .ebk-sech h2 em{font-style:italic;color:var(--gold-br);-webkit-text-fill-color:var(--gold-br)}
  .ebk .ebk-inside{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:880px;margin:0 auto}
  .ebk .ebk-item{background:var(--card);border:1px solid var(--hair);border-radius:14px;padding:26px 28px;transition:.2s}
  .ebk .ebk-item:hover{border-color:rgba(200,150,62,.4);transform:translateY(-4px)}
  .ebk .ebk-n{font-family:var(--heading),'Eczar',Georgia,serif;font-size:40px;font-weight:700;color:rgba(200,150,62,.28);-webkit-text-fill-color:rgba(200,150,62,.28);line-height:1;display:block;margin-bottom:10px}
  .ebk .ebk-item h3{font-family:var(--heading),'Eczar',Georgia,serif;font-size:23px;font-weight:600;color:var(--cream);-webkit-text-fill-color:var(--cream);background:none;line-height:1.2;margin-bottom:8px}
  .ebk .ebk-item p{font-size:14.5px;color:var(--muted);line-height:1.55}
  .ebk .ebk-forwho{max-width:760px;margin:0 auto;text-align:center}
  .ebk .ebk-q{font-family:var(--heading),'Eczar',Georgia,serif;font-size:31px;font-weight:500;font-style:italic;line-height:1.4;color:var(--cream);-webkit-text-fill-color:var(--cream)}
  .ebk .ebk-q b{color:var(--gold-br);-webkit-text-fill-color:var(--gold-br);font-style:normal;font-weight:600}
  .ebk .ebk-bridge{background:linear-gradient(135deg,var(--gold-dk),var(--bg2));border:1px solid rgba(200,150,62,.32);border-radius:20px;padding:48px;text-align:center;max-width:760px;margin:0 auto}
  .ebk .ebk-emic{font-size:32px;margin-bottom:14px}
  .ebk .ebk-bridge h3{font-family:var(--heading),'Eczar',Georgia,serif;font-size:31px;font-weight:700;margin-bottom:6px;color:var(--cream);-webkit-text-fill-color:var(--cream);background:none}
  .ebk .ebk-sig{font-family:var(--heading),'Eczar',Georgia,serif;font-style:italic;font-size:18px;color:var(--gold-br);-webkit-text-fill-color:var(--gold-br);margin-bottom:16px}
  .ebk .ebk-bridge p{font-size:16px;color:var(--muted);max-width:540px;margin:0 auto}
  .ebk .ebk-tag{display:inline-block;margin-top:18px;font-size:13px;color:var(--gold-br);font-weight:600;letter-spacing:.04em}
  .ebk .ebk-final{text-align:center}
  .ebk .ebk-final h2{font-family:var(--heading),'Eczar',Georgia,serif;font-size:46px;font-weight:700;margin-bottom:16px;letter-spacing:-.01em;color:var(--cream);-webkit-text-fill-color:var(--cream);background:none}
  .ebk .ebk-final p{font-size:17px;color:var(--muted);margin-bottom:30px}
  .ebk .ebk-final .ebk-form{margin:0 auto 16px}
  .ebk .ebk-seal{display:flex;justify-content:center;gap:22px;flex-wrap:wrap;font-size:13px;color:var(--faint);margin-top:8px}
  .ebk .ebk-seal span{display:flex;align-items:center;gap:7px}
  .ebk .ebk-foot{padding:36px 0 50px;text-align:center;border-top:1px solid var(--hair);color:var(--faint);font-size:13px}
  .ebk .ebk-fsig{font-family:var(--heading),'Eczar',Georgia,serif;font-style:italic;font-size:16px;color:var(--muted);margin-top:6px}
  @media(max-width:820px){
    .ebk .ebk-nav{padding:16px 18px}
    .ebk .ebk-badge{display:none}
    .ebk .ebk-hero{grid-template-columns:1fr;gap:0;text-align:center;padding:8px 0 40px}
    .ebk .ebk-hero>div:first-child{display:flex;flex-direction:column;align-items:center}
    .ebk .ebk-eyebrow{display:none}
    .ebk h1{font-size:27px;line-height:1.12;order:1;margin-bottom:18px}
    .ebk .ebk-form{margin-left:auto;margin-right:auto;flex-direction:column;order:2;max-width:340px;width:100%}
    .ebk .ebk-trust{justify-content:center;order:3}
    .ebk .ebk-lead{margin:22px auto 0;order:4;font-size:15px;max-width:340px}
    .ebk .ebk-bookw{order:-1;margin-bottom:16px} .ebk .ebk-book{width:128px;transform:rotateY(-7deg)}
    .ebk .ebk-inside{grid-template-columns:1fr}
    .ebk .ebk-final h2,.ebk .ebk-sech h2{font-size:30px}
  }
  @media (prefers-reduced-motion: no-preference){
    .ebk .hcm-rise{opacity:0;transform:translateY(24px);transition:opacity .7s cubic-bezier(.22,.61,.36,1),transform .7s cubic-bezier(.22,.61,.36,1)}
    .ebk .hcm-rise.hcm-in{opacity:1;transform:none}
    .ebk .ebk-btn:after{content:'';position:absolute;top:0;left:-130%;width:55%;height:100%;z-index:-1;background:linear-gradient(100deg,transparent,rgba(255,255,255,.30),transparent);transform:skewX(-18deg);animation:hcm-sheen 4.2s ease-in-out infinite;animation-delay:1.4s}
    @keyframes hcm-sheen{0%{left:-130%}16%{left:150%}100%{left:150%}}
  }
          `,
        }}
      />
      <div className="ebk">
        <nav className="ebk-nav">
          <img src="/images/simbolo.png" alt="Notas do Café" />
          <span className="ebk-nm">
            Notas do <span>Café</span>
          </span>
          <span className="ebk-badge">Newsletter de café · todo dia</span>
        </nav>
        <div className="ebk-wrap">
          <div className="ebk-hero">
            <div>
              <span className="ebk-eyebrow">☕ Guia gratuito · 7 métodos</span>
              <h1>7 métodos passados pelo <em>filtro editorial</em> da Notas do Café.</h1>
              <p className="ebk-lead">7 métodos, cada um com <b>nota, ponto de moagem e tempo de extração</b>. Sem snobismo, só o que vale a xícara. Pra ler num café.</p>
              <form className="ebk-form" onSubmit={handleSubmit}>
                <span className="ebk-field">
                  <MailIcon />
                  <input type="email" name="email" placeholder="seu@email.com" required />
                </span>
                <button className="ebk-btn" type="submit" disabled={disabled}>
                  {BUTTON_LABEL[status]}
                </button>
              </form>
              <p className="ebk-trust">
                🔒 <b>Grátis</b> e chega no seu email em segundos.
              </p>
            </div>
            <div className="ebk-bookw">
              <div className="ebk-book">
                <img src="/images/mockup-ebook.png" alt="Guia A Xícara Certa" />
              </div>
            </div>
          </div>
        </div>
        <section className="ebk-sec">
          <div className="ebk-wrap">
            <div className="ebk-sech">
              <div className="ebk-seck">O que tem dentro</div>
              <h2>
                Sete métodos, um <em>veredicto</em> por método
              </h2>
            </div>
            <div className="ebk-inside">
              {CHAPTERS.map((ch, i) => (
                <div className="ebk-item" key={i}>
                  <span className="ebk-n">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{ch.title}</h3>
                  <p>{ch.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="ebk-sec">
          <div className="ebk-wrap ebk-forwho">
            <div className="ebk-seck">Pra quem é</div>
            <p className="ebk-q">
              Pra quem toma café todo dia e quer <b>saber o que está tomando</b>,
              sem precisar virar barista.
            </p>
          </div>
        </section>
        <section className="ebk-sec">
          <div className="ebk-wrap">
            <div className="ebk-bridge">
              <div className="ebk-emic">☕</div>
              <h3>O guia é só o começo</h3>
              <div className="ebk-sig">Da fazenda à xícara, sem frescura</div>
              <p>
                Junto com A Xícara Certa, você entra no Notas do Café: curadoria
                de café especial brasileiro, todo dia. Grão avaliado com
                critério, origem mapeada, veredicto direto.
              </p>
              <span className="ebk-tag">Todo dia · de graça · cancele quando quiser</span>
            </div>
          </div>
        </section>
        <section className="ebk-sec ebk-final">
          <div className="ebk-wrap">
            <h2>Tome o café certo hoje.</h2>
            <p>Os 7 métodos avaliados pra você acertar a xícara de uma vez.</p>
            <form className="ebk-form" onSubmit={handleSubmit}>
              <span className="ebk-field">
                <MailIcon />
                <input type="email" name="email" placeholder="seu@email.com" required />
              </span>
              <button className="ebk-btn" type="submit" disabled={disabled}>
                {status === "idle" ? "Quero baixar grátis ↓" : BUTTON_LABEL[status]}
              </button>
            </form>
            <div className="ebk-seal">
              <span>🎁 Grátis</span>
              <span>📩 Chega na hora</span>
              <span>✂️ Cancele quando quiser</span>
            </div>
          </div>
        </section>
        <footer className="ebk-foot">
          <div>Notas do Café · Da fazenda à xícara, sem frescura</div>
          <div className="ebk-fsig">© 2026 Notas do Café</div>
        </footer>
      </div>
    </>
  );
}
