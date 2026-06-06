"use client";

import { useState, useEffect } from "react";

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
  idle: "Baixar grátis",
  sending: "Enviando...",
  success: "Pronto!",
  error: "Erro, tente de novo",
};

export default function EbookCapture() {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const groups: [string, number][] = [
      [".hero > div:first-child > *", 90],
      [".book-wrap", 0],
      [".sec-h", 0],
      [".inside .item", 65],
      [".forwho .q", 0],
      [".bridge", 0],
      [".final .wrap > *", 80],
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
        body: JSON.stringify({ email, automationId: AUTOMATION_ID }),
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

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
  .ebk{--bg:#2C1810;--bg2:#3D2517;--card:#241109;--hair:#4A3322;--cream:#F5EDE0;--muted:#C4A882;--faint:#8A7560;--gold:#C8963E;--gold-br:#D4A44A;--gold-dk:#3A2A10;
    background:var(--bg);color:var(--cream);font-family:var(--body),'DM Sans',sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
  .ebk *{box-sizing:border-box}
  .ebk .serif{font-family:var(--heading),'Eczar',Georgia,serif}
  .ebk .wrap{max-width:1080px;margin:0 auto;padding:0 24px}
  .ebk a{color:inherit}
  .ebk nav{display:flex;align-items:center;gap:12px;padding:24px;max-width:1080px;margin:0 auto}
  .ebk nav img{height:34px;width:auto}
  .ebk nav .nm{font-family:var(--heading),'Eczar',serif;font-size:23px;font-weight:700;letter-spacing:.01em}
  .ebk nav .nm span{color:var(--gold-br)}
  .ebk nav .badge{margin-left:auto;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--faint)}
  .ebk .hero{display:grid;grid-template-columns:1.15fr .85fr;gap:50px;align-items:center;padding:40px 0 76px;position:relative}
  .ebk .hero:before{content:'';position:absolute;top:-40px;left:-120px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(200,150,62,.10),transparent 70%);pointer-events:none}
  .ebk .hero>*{position:relative;z-index:1}
  .ebk .eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin-bottom:22px;padding-bottom:9px;border-bottom:1px solid var(--hair)}
  .ebk h1{font-family:var(--heading),'Eczar',serif;font-size:56px;line-height:1.05;font-weight:700;letter-spacing:-.01em;margin-bottom:20px}
  .ebk h1 em{font-style:italic;color:var(--gold-br)}
  .ebk .lead{font-size:18px;color:var(--muted);max-width:520px;margin-bottom:30px;line-height:1.7}
  .ebk .lead b{color:var(--cream);font-weight:600}
  .ebk .form{display:flex;gap:10px;max-width:480px;margin-bottom:14px}
  .ebk .form input{flex:1;background:var(--bg2);border:1px solid var(--hair);border-radius:11px;padding:16px 18px;color:var(--cream);font-size:15px;font-family:inherit}
  .ebk .form input::placeholder{color:var(--faint)}
  .ebk .form input:focus{outline:none;border-color:var(--gold);box-shadow:0 0 0 3px rgba(200,150,62,.18)}
  .ebk .btn{background:var(--gold);color:#1E100A;border:none;border-radius:11px;padding:16px 26px;font-size:15px;font-weight:700;font-family:inherit;cursor:pointer;white-space:nowrap;transition:.15s;box-shadow:0 6px 16px rgba(8,7,4,.5);position:relative;overflow:hidden;isolation:isolate}
  .ebk .btn:hover{background:var(--gold-br);transform:translateY(-1px);box-shadow:0 8px 22px rgba(200,150,62,.28)}
  .ebk .btn:disabled{opacity:.7;cursor:default}
  .ebk .trust{font-size:13px;color:var(--faint);display:flex;align-items:center;gap:7px}
  .ebk .trust b{color:var(--muted);font-weight:600}
  .ebk .book-wrap{display:flex;justify-content:center;perspective:1400px}
  .ebk .book{width:330px;transform:rotateY(-15deg) rotateX(3deg);transition:.5s;filter:drop-shadow(28px 34px 60px rgba(0,0,0,.6))}
  .ebk .book:hover{transform:rotateY(-6deg) rotateX(1deg)}
  .ebk .book img{width:100%;display:block}
  .ebk section{padding:64px 0;border-top:1px solid var(--hair)}
  .ebk .sec-h{text-align:center;margin-bottom:44px}
  .ebk .sec-k{font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold-br);font-weight:600;margin-bottom:12px}
  .ebk .sec-h h2{font-family:var(--heading),'Eczar',serif;font-size:42px;font-weight:700;letter-spacing:-.01em}
  .ebk .sec-h h2 em{font-style:italic;color:var(--gold-br)}
  .ebk .inside{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:880px;margin:0 auto}
  .ebk .item{background:var(--card);border:1px solid var(--hair);border-radius:14px;padding:26px 28px;transition:.2s}
  .ebk .item:hover{border-color:rgba(200,150,62,.4);transform:translateY(-4px)}
  .ebk .item .n{font-family:var(--heading),'Eczar',serif;font-size:40px;font-weight:700;color:rgba(200,150,62,.28);line-height:1;display:block;margin-bottom:10px}
  .ebk .item h3{font-family:var(--heading),'Eczar',serif;font-size:23px;font-weight:600;color:var(--cream);line-height:1.2;margin-bottom:8px}
  .ebk .item p{font-size:14.5px;color:var(--muted);line-height:1.55}
  .ebk .forwho{max-width:760px;margin:0 auto;text-align:center}
  .ebk .forwho .q{font-family:var(--heading),'Eczar',serif;font-size:31px;font-weight:500;font-style:italic;line-height:1.4;color:var(--cream)}
  .ebk .forwho .q b{color:var(--gold-br);font-style:normal;font-weight:600}
  .ebk .bridge{background:linear-gradient(135deg,var(--gold-dk),var(--bg2));border:1px solid rgba(200,150,62,.32);border-radius:20px;padding:48px;text-align:center;max-width:760px;margin:0 auto}
  .ebk .bridge .em-ic{font-size:32px;margin-bottom:14px}
  .ebk .bridge h3{font-family:var(--heading),'Eczar',serif;font-size:31px;font-weight:700;margin-bottom:6px}
  .ebk .bridge .sig{font-family:var(--heading),'Eczar',serif;font-style:italic;font-size:18px;color:var(--gold-br);margin-bottom:16px}
  .ebk .bridge p{font-size:16px;color:var(--muted);max-width:540px;margin:0 auto}
  .ebk .bridge .tag{display:inline-block;margin-top:18px;font-size:13px;color:var(--gold-br);font-weight:600;letter-spacing:.04em}
  .ebk .final{text-align:center}
  .ebk .final h2{font-family:var(--heading),'Eczar',serif;font-size:46px;font-weight:700;margin-bottom:16px;letter-spacing:-.01em}
  .ebk .final p{font-size:17px;color:var(--muted);margin-bottom:30px}
  .ebk .final .form{margin:0 auto 16px}
  .ebk .seal{display:flex;justify-content:center;gap:22px;flex-wrap:wrap;font-size:13px;color:var(--faint);margin-top:8px}
  .ebk .seal span{display:flex;align-items:center;gap:7px}
  .ebk footer{padding:36px 0 50px;text-align:center;border-top:1px solid var(--hair);color:var(--faint);font-size:13px}
  .ebk footer .fsig{font-family:var(--heading),'Eczar',serif;font-style:italic;font-size:16px;color:var(--muted);margin-top:6px}
  @media(max-width:820px){
    .ebk .hero{grid-template-columns:1fr;gap:36px;text-align:center;padding-bottom:40px}
    .ebk .hero .eyebrow{margin-left:auto;margin-right:auto}
    .ebk h1{font-size:40px} .ebk .lead{margin-left:auto;margin-right:auto}
    .ebk .form{margin-left:auto;margin-right:auto;flex-direction:column}
    .ebk .trust{justify-content:center}
    .ebk .book-wrap{order:-1} .ebk .book{width:240px;transform:rotateY(-9deg)}
    .ebk .inside{grid-template-columns:1fr}
    .ebk .final h2,.ebk .sec-h h2{font-size:32px}
  }
  @media (prefers-reduced-motion: no-preference){
    .ebk .hcm-rise{opacity:0;transform:translateY(24px);transition:opacity .7s cubic-bezier(.22,.61,.36,1),transform .7s cubic-bezier(.22,.61,.36,1)}
    .ebk .hcm-rise.hcm-in{opacity:1;transform:none}
    .ebk .btn:after{content:'';position:absolute;top:0;left:-130%;width:55%;height:100%;z-index:-1;background:linear-gradient(100deg,transparent,rgba(255,255,255,.30),transparent);transform:skewX(-18deg);animation:hcm-sheen 4.2s ease-in-out infinite;animation-delay:1.4s}
    @keyframes hcm-sheen{0%{left:-130%}16%{left:150%}100%{left:150%}}
  }
          `,
        }}
      />
      <div className="ebk">
        <nav>
          <img src="/images/simbolo.png" alt="Notas do Café" />
          <span className="nm">
            Notas do <span>Café</span>
          </span>
          <span className="badge">Newsletter de café · todo dia</span>
        </nav>
        <div className="wrap">
          <div className="hero">
            <div>
              <span className="eyebrow">☕ Guia gratuito · 7 métodos</span>
              <h1>
                Os métodos de café que ninguém avalia <em>sem frescura</em>.
              </h1>
              <p className="lead">
                <b>A Xícara Certa</b> reúne 7 métodos de preparo avaliados com o
                filtro editorial, sem snobismo, só o que vale a xícara. Pra ler
                num café, aplicar amanhã.
              </p>
              <form className="form" onSubmit={handleSubmit}>
                <input type="email" name="email" placeholder="Seu melhor e-mail" required />
                <button className="btn" type="submit" disabled={status === "sending" || status === "success"}>
                  {BUTTON_LABEL[status]}
                </button>
              </form>
              <p className="trust">
                🔒 <b>Grátis</b>, e chega no seu email em segundos.
              </p>
            </div>
            <div className="book-wrap">
              <div className="book">
                <img src="/images/mockup-ebook.png" alt="Guia A Xícara Certa" />
              </div>
            </div>
          </div>
        </div>
        <section>
          <div className="wrap">
            <div className="sec-h">
              <div className="sec-k">O que tem dentro</div>
              <h2>
                Sete métodos, um <em>veredicto</em> por método
              </h2>
            </div>
            <div className="inside">
              {CHAPTERS.map((ch, i) => (
                <div className="item" key={i}>
                  <span className="n">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{ch.title}</h3>
                  <p>{ch.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section>
          <div className="wrap forwho">
            <div className="sec-k">Pra quem é</div>
            <p className="q">
              Pra quem toma café todo dia e quer <b>saber o que está tomando</b>,
              sem precisar virar barista.
            </p>
          </div>
        </section>
        <section>
          <div className="wrap">
            <div className="bridge">
              <div className="em-ic">☕</div>
              <h3>O guia é só o começo</h3>
              <div className="sig">Da fazenda à xícara, sem frescura</div>
              <p>
                Junto com A Xícara Certa, você entra no Notas do Café: curadoria
                de café especial brasileiro, todo dia. Grão avaliado com
                critério, origem mapeada, veredicto direto.
              </p>
              <span className="tag">Todo dia · de graça · cancele quando quiser</span>
            </div>
          </div>
        </section>
        <section className="final">
          <div className="wrap">
            <h2>Tome o café certo hoje.</h2>
            <p>Os 7 métodos avaliados pra você acertar a xícara de uma vez.</p>
            <form className="form" onSubmit={handleSubmit}>
              <input type="email" name="email" placeholder="Seu melhor e-mail" required />
              <button className="btn" type="submit" disabled={status === "sending" || status === "success"}>
                {status === "idle" ? "Quero o guia grátis" : BUTTON_LABEL[status]}
              </button>
            </form>
            <div className="seal">
              <span>🎁 Grátis</span>
              <span>📩 Chega na hora</span>
              <span>✂️ Cancele quando quiser</span>
            </div>
          </div>
        </section>
        <footer>
          <div>Notas do Café · Da fazenda à xícara, sem frescura</div>
          <div className="fsig">© 2026 Notas do Café</div>
        </footer>
      </div>
    </>
  );
}
