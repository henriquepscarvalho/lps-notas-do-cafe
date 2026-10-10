"use client";

/* ============================================================
 * PÁGINA /voto-positivo, MODELO CANÔNICO ÚNICO (rede Scriptorium)
 * AUTO-GERADO por _shared/voto-positivo/build.py
 * NÃO EDITAR À MÃO. Fonte = page.template.tsx + config.json.
 * Para re-skinar TODAS as news: editar este template ou o config
 * e rodar `python3 _shared/voto-positivo/build.py`.
 *
 * Fluxo (nota 5): caixa de comentário PRIMEIRO. Só depois de o leitor
 * ENVIAR a resposta aparecem a mensagem de agradecimento, o confete e o
 * botão de compartilhar no WhatsApp. A recompensa vem após o engajamento.
 *
 * Carimbo do compartilhar (gam/170): o botão grava o passo `voto-whatsapp` em
 * lp_page_views (apareceu quando surge, converteu no clique) e o link que o leitor
 * manda leva `?src=voto-whatsapp` (build.py), então o funil do amigo sai com a origem.
 *
 * Faixa do guia (c4-20k/72, posição C, variante D): abaixo da caixa, nos dois
 * estados, um bloco tingido com a capa, o título e a promessa do guia da casa
 * e um botão pequeno levando pra /ebook-premium?src=edicao-voto. Sem preço:
 * a caixa de comentário continua sendo a primeira ação. Casa sem guia:
 * CFG.oferta = null.
 *
 * Link pessoal (pdb/50): o botão de indicar troca o link da casa pelo link pessoal
 * do leitor (`?ref=` + 12 primeiros hex do sha256 do email do `s=`, a mesma regra da
 * /indique), senão quem indica por aqui não sobe degrau. Sem email válido, fica o link
 * da casa. CFG.indique (casa com pack de wallpapers) nomeia o prêmio do degrau 1.
 * ============================================================ */

import { useEffect, useState } from "react";
import PageBeacon, { sendBeacon } from "../PageBeacon";
import VoteBeacon, { submitVoteComment } from "../VoteBeacon";
import AssinaComo, { enviarAssinatura } from "../AssinaComo";
import { useEffect as useEfCam, useState as useStCam } from "react";

const CFG = {
  "slug": "notas-do-cafe",
  "brand": "Notas do Café",
  "logo": "/images/logo/simbolo.png",
  "logoW": 56,
  "logoH": 56,
  "kicker": "VOTO REGISTRADO",
  "headline": "Obrigado pelo seu",
  "highlight": "voto.",
  "paragraph": "Saber que a edição de hoje acertou na xícara é o que faz cada manhã valer a pena.",
  "tagline": "Bom café. Até amanhã.",
  "shareUrl": "https://api.whatsapp.com/send/?text=A%20Notas%20do%20Caf%C3%A9%20traz%20o%20gr%C3%A3o%2C%20o%20m%C3%A9todo%20e%20a%20curadoria%20pra%20sua%20x%C3%ADcara%20render%20mais.%20https%3A%2F%2Flp.notasdocafe.com.br%2Fcadastro%3Fsrc%3Dvoto-whatsapp",
  "emojis": [
    "☕",
    "🫘",
    "♨️",
    "📦",
    "✨"
  ],
  "theme": {
    "bg": "#2C1810",
    "text": "#D4C4AE",
    "accent": "#C8963E",
    "heading": "#F5EDE0",
    "btnBg": "#C8963E",
    "btnText": "#2C1810",
    "glow": "rgba(200,150,62,0.14)",
    "font": "var(--font-heading)"
  },
  "oferta": {
    "titulo": "Café de Balcão no Coador de Casa",
    "promessa": "A técnica completa sem máquina de R$ 2 mil",
    "capa": "https://ecmveymyzdqiehvtqxms.supabase.co/storage/v1/object/public/assets/rede/capas/notas-do-cafe.webp",
    "href": "/ebook-premium?src=edicao-voto"
  },
  "camiseta": {
    "href": "https://q.notasdocafe.com.br/camiseta",
    "img": "https://q.notasdocafe.com.br/camiseta-artes/notas-do-cafe/n2-escura.webp"
  },
  "indique": {
    "premio": "10 wallpapers da casa pro celular",
    "href": "https://q.notasdocafe.com.br/indique"
  },
  "e129": {
    "json": "https://ecmveymyzdqiehvtqxms.supabase.co/storage/v1/object/public/assets/news/notas-do-cafe/discover.json",
    "flag": "https://ecmveymyzdqiehvtqxms.supabase.co/storage/v1/object/public/assets/exp/e129.json",
    "sal": "e129-s1"
  }
};

type Oferta = { titulo: string; promessa: string; capa: string; href: string };
const OFERTA: Oferta | null = CFG.oferta;
type Indique = { premio: string; href: string };
const INDIQUE: Indique | null = (CFG as { indique?: Indique | null }).indique ?? null;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function PremioIndique({ t, email, delay }: { t: typeof CFG.theme; email: string; delay: string }) {
  if (!INDIQUE) return null;
  const q = new URLSearchParams({ src: "voto" });
  if (email) q.set("e", email);
  return (
    <p className="vp-pr" style={{ color: t.text, animation: `vpUp .7s ease-out ${delay} both` }}>
      Seu 1º amigo confirmado libera {INDIQUE.premio}.{" "}
      <a href={`${INDIQUE.href}?${q.toString()}`} style={{ color: t.heading }}>Ver meus prêmios</a>
    </p>
  );
}
/* Lista de espera da camiseta da casa (camiseta-da-casa/03, mecânica m1): card abaixo da faixa
 * do guia, nos dois estados. O link leva o email do voto (?s=) e a edição pra rota do app do
 * quiz, que grava só no envio do formulário. A peça ainda não existe: sem preço, sem prazo. */
type Camiseta = { href: string; img: string };
const CAMISETA: Camiseta | null = (CFG as { camiseta?: Camiseta | null }).camiseta ?? null;
function CamisetaCard({ t, delay }: { t: typeof CFG.theme; delay: string }) {
  const [href, setHref] = useStCam(CAMISETA ? `${CAMISETA.href}?src=voto` : "");
  useEfCam(() => {
    if (!CAMISETA) return;
    const p = new URLSearchParams(window.location.search);
    const q = new URLSearchParams({ src: "voto" });
    const s = (p.get("s") || "").trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) q.set("e", s);
    const ed = p.get("ed");
    if (ed && /^\d+$/.test(ed)) q.set("ed", ed);
    setHref(`${CAMISETA.href}?${q.toString()}`);
    sendBeacon(CFG.slug, "voto-camiseta");
  }, []);
  if (!CAMISETA) return null;
  return (
    <div className="vp-cm" style={{ borderColor: `${t.accent}33`, animation: `vpUp .9s ease-out ${delay} both` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={CAMISETA.img} alt="Camiseta da casa" width={72} height={72} />
      <div>
        <b style={{ fontFamily: t.font, color: t.heading }}>Qual dessas camisetas você usaria?</b>
        <small>Queremos criar uma comunidade forte e unida. Logo, escolha a arte e o tamanho da camiseta e entre na lista de espera. Se leitores suficientes pedirem, nós faremos essas camisetas.</small>
      </div>
      <a href={href} onClick={() => sendBeacon(CFG.slug, "voto-camiseta", { eventType: "converteu" })} className="vp-btn" style={{ background: "transparent", color: t.heading, border: `1px solid ${t.accent}66` }}>Ver as artes</a>
    </div>
  );
}

interface Piece { id: number; left: number; delay: number; duration: number; size: number; emoji: string; }
/* EXP-129 (pfa/118): pergunta de 1 toque no topo da página do voto 5, «Qual destes temas você quer ler
 * amanhã?», com 3 temas da urna aberta da casa (o discover.json do bloco Discover do email). O toque grava
 * em pauta_votes, a mesma tabela que a apuração da urna conta (1º voto por sub_hash), e a página mostra
 * quando o tema mais votado sai. Sorteio 50/50 fixo por leitor: braço = paridade dos 8 primeiros hex de
 * sha256(sal + ":" + chave), chave = 16 primeiros hex do sha256 do email do link do voto (`s=`, a mesma
 * normalização do VoteBeacon, igual ao edition_votes.sub_hash); sem email, semente do aparelho.
 * Sem urna aberta ninguém vê a pergunta (beacon `e129-fora`, nos dois braços).
 * Chave de rede: CFG.e129.flag ({"ligado": true}); ausente, ilegível ou false = página de hoje pra todo
 * mundo e nenhum beacon do teste. `?internal=1&e129=a|b` força o braço (prova; beacon sai interno).
 * Beacon em lp_page_views: variant e129-a|b; id = chave (16 hex) + tipo (e email, d aparelho) + aleatório;
 * journey_id = a jornada da sessão, a mesma dos atos de hoje. Leitor: leitores_pergunta_voto.py. */
type E129 = { json: string; flag: string; sal: string };
const E129C: E129 | null = (CFG as { e129?: E129 | null }).e129 ?? null;
type Tema = { p: string; titulo: string };
type Urna = { ed: number; temas: Tema[]; sai: { dia: string; ddmm: string } | null };
type Ident = { chave: string; tipo: "e" | "d"; hash: string | null; email: string };

async function hex256(s: string): Promise<string> {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
}

function rnd16(n: number): string {
  let s = "";
  while (s.length < n) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}

function interno129(): boolean {
  try {
    const p = new URLSearchParams(window.location.search).get("internal");
    if (p === "1") localStorage.setItem("vdn_internal", "1");
    return localStorage.getItem("vdn_internal") === "1";
  } catch {
    return false;
  }
}

/** Beacon do teste: mesmo corpo do sendBeacon, com o braço no variant e a chave do leitor no id. */
function beacon129(step: string, ev: "apareceu" | "converteu", braco: string, id: Ident): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return;
  const k = `lpv_${CFG.slug}_${step}_${ev}`;
  try {
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, "1");
  } catch {
    /* sessionStorage indisponível: segue e grava */
  }
  const h = id.chave + id.tipo + rnd16(15);
  let source = "direct";
  let journey: string | null = null;
  try {
    source = sessionStorage.getItem("vdn_source") || "direct";
    journey = sessionStorage.getItem("vdn_journey");
  } catch {}
  fetch(`${url}/rest/v1/lp_page_views`, {
    method: "POST",
    keepalive: true,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      id: `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`,
      slug: CFG.slug,
      funnel_step: step,
      event_type: ev,
      source,
      journey_id: journey,
      path: window.location.pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      variant: `e129-${braco}`,
      is_internal: interno129(),
    }),
  }).catch(() => {
    /* beacon best-effort, nunca quebra a página */
  });
}

/** A escolha entra na urna da casa: mesma linha que a /voto-pauta grava, com o path desta página. */
function gravaPauta(ed: number, opt: string, id: Ident): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return;
  const at = id.email.indexOf("@");
  fetch(`${url}/rest/v1/pauta_votes`, {
    method: "POST",
    keepalive: true,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      id: crypto.randomUUID(),
      slug: CFG.slug,
      edition: ed,
      opt,
      sub_hash: id.hash,
      email_mask: at > 0 ? id.email[0] + "****@" + id.email.slice(at + 1) : null,
      path: window.location.pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      is_internal: interno129(),
    }),
  }).catch(() => {
    /* best-effort */
  });
}

type Oferta129 = { ed?: number; fecha_em?: string; sai?: { dia: string; ddmm: string } | null; pautas?: Record<string, { titulo?: string }> };

/** Oferta aberta que fecha primeiro, com 3 ou mais temas; 3 sorteados entre os da oferta, em ordem sorteada. */
function urnaAberta(d: unknown): Urna | null {
  const ofs = ((d as { ofertas?: Oferta129[] } | null)?.ofertas || []).filter((o) => {
    const f = o.fecha_em ? Date.parse(o.fecha_em) : NaN;
    return Number.isFinite(f) && f > Date.now() && Number.isInteger(o.ed);
  });
  ofs.sort((x, y) => Date.parse(x.fecha_em as string) - Date.parse(y.fecha_em as string));
  for (const o of ofs) {
    const ps = o.pautas || {};
    const temas = ["a", "b", "c", "d"].flatMap((p) => (ps[p] && ps[p].titulo ? [{ p, titulo: String(ps[p].titulo) }] : []));
    if (temas.length < 3) continue;
    for (let i = temas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [temas[i], temas[j]] = [temas[j], temas[i]];
    }
    return { ed: o.ed as number, temas: temas.slice(0, 3), sai: o.sai || null };
  }
  return null;
}

/** Quando o tema mais votado sai, sem prometer além do discover.json: «amanhã», «na terça» ou «nos próximos dias». */
function quando129(u: Urna, comData: boolean): string {
  const s = u.sai;
  if (!s) return "nos próximos dias";
  let amanha = "";
  try {
    amanha = new Date(Date.now() + 864e5).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" });
  } catch {}
  if (s.ddmm === amanha) return "amanhã";
  const art = s.dia === "sábado" || s.dia === "domingo" ? "no" : "na";
  return comData ? `${art} ${s.dia}, ${s.ddmm}` : `${art} ${s.dia}`;
}

function PerguntaTema() {
  const t = CFG.theme;
  const [urna, setUrna] = useState<Urna | null>(null);
  const [ident, setIdent] = useState<Ident | null>(null);
  const [escolha, setEscolha] = useState<string | null>(null);

  useEffect(() => {
    if (!E129C) return;
    let vivo = true;
    const busca = (u: string): Promise<unknown> =>
      Promise.race([
        fetch(u, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        new Promise((r) => window.setTimeout(() => r(null), 3000)),
      ]);
    (async () => {
      const q = new URLSearchParams(window.location.search);
      const email = (q.get("s") || "").trim().toLowerCase();
      let id: Ident;
      try {
        if (email.includes("@")) {
          const hash = await hex256(email);
          id = { chave: hash.slice(0, 16), tipo: "e", hash, email };
        } else {
          let sem = "";
          try {
            sem = localStorage.getItem("e129_seed") || "";
            if (!sem) {
              sem = rnd16(32);
              localStorage.setItem("e129_seed", sem);
            }
          } catch {
            sem = rnd16(32);
          }
          id = { chave: (await hex256("dev:" + sem)).slice(0, 16), tipo: "d", hash: null, email: "" };
        }
      } catch {
        return; /* sem crypto.subtle: fica a página de hoje, sem beacon do teste */
      }
      const forca = interno129() ? (q.get("e129") || "").toLowerCase() : "";
      const [flag, disc] = await Promise.all([busca(E129C.flag), busca(E129C.json)]);
      const ligado = !!flag && (flag as { ligado?: unknown }).ligado === true;
      if (!vivo || (!ligado && forca !== "a" && forca !== "b")) return;
      const braco = forca === "a" || forca === "b" ? forca : parseInt((await hex256(`${E129C.sal}:${id.chave}`)).slice(0, 8), 16) % 2 === 0 ? "a" : "b";
      const u = urnaAberta(disc);
      if (!vivo) return;
      beacon129(u ? "e129" : "e129-fora", "apareceu", braco, id);
      if (braco !== "b" || !u) return;
      beacon129("e129-tema", "apareceu", braco, id);
      let ja: string | null = null;
      try {
        ja = sessionStorage.getItem(`pauta_${CFG.slug}_${u.ed}`);
      } catch {}
      setIdent(id);
      setUrna(u);
      if (ja && u.temas.some((m) => m.p === ja)) setEscolha(ja);
    })();
    return () => {
      vivo = false;
    };
  }, []);

  function escolher(p: string) {
    if (escolha || !urna || !ident) return;
    setEscolha(p);
    try {
      sessionStorage.setItem(`pauta_${CFG.slug}_${urna.ed}`, p);
    } catch {}
    beacon129("e129-tema", "converteu", "b", ident);
    gravaPauta(urna.ed, p, ident);
  }

  if (!urna) return null;
  return (
    <div className="vp-tm" data-e129="b" style={{ borderColor: `${t.accent}55`, background: `${t.accent}0A`, animation: "vpUp .6s ease-out .05s both" }}>
      <p className="vp-tm-q" style={{ color: t.heading, fontFamily: t.font }}>Qual destes temas você quer ler {quando129(urna, false)}?</p>
      {urna.temas.map((m) => (
        <button
          key={m.p}
          type="button"
          className="vp-tm-op"
          onClick={() => escolher(m.p)}
          disabled={!!escolha}
          aria-pressed={escolha === m.p}
          style={escolha === m.p ? { background: t.btnBg, color: t.btnText, borderColor: t.btnBg } : { color: t.heading, borderColor: `${t.accent}55`, opacity: escolha ? 0.5 : 1 }}
        >
          {m.titulo}
        </button>
      ))}
      {escolha ? (
        <p className="vp-tm-ok" role="status" style={{ color: t.text }}>
          Anotado. O tema mais votado sai {quando129(urna, true)}.
        </p>
      ) : null}
    </div>
  );
}

export default function VotoPositivo() {
  const [confetti, setConfetti] = useState<Piece[]>([]);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [falhou, setFalhou] = useState(false);
  // caf/41: a pergunta-aberta que fecha a edição chega no link do voto (&q=, insert_voto)
  // e vira o título da caixa; sem q, a caixa fica como sempre.
  const [pergunta, setPergunta] = useState("");
  useEffect(() => {
    try {
      const v = new URLSearchParams(window.location.search).get("q") || "";
      setPergunta(v.trim().slice(0, 200));
    } catch {
      /* sem URL legível: caixa como sempre */
    }
  }, []);
  // pdb/50: link pessoal no WhatsApp; sem email ou sem crypto.subtle, o link da casa de sempre.
  const [shareUrl, setShareUrl] = useState(CFG.shareUrl);
  const [email, setEmail] = useState("");
  useEffect(() => {
    try {
      // `+` cru do email chega como espaço no URLSearchParams: volta pra `+` antes do hash.
      const s = (new URLSearchParams(window.location.search).get("s") || "").trim().replace(/ /g, "+").toLowerCase();
      if (!EMAIL_RE.test(s)) return;
      setEmail(s);
      if (!window.crypto?.subtle) return;
      window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)).then((b) => {
        const ref = Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 12);
        setShareUrl(CFG.shareUrl.replace(encodeURIComponent("?src=voto-whatsapp"), encodeURIComponent(`?ref=${ref}&src=voto-whatsapp`)));
      }).catch(() => { /* fica o link da casa */ });
    } catch {
      /* sem URL legível: link da casa */
    }
  }, []);

  function fireConfetti() {
    setConfetti(
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 3 + Math.random() * 3,
        size: 16 + Math.random() * 12,
        emoji: CFG.emojis[Math.floor(Math.random() * CFG.emojis.length)],
      }))
    );
  }

  async function handleSubmit() {
    if (sending || !comment.trim()) return;
    setSending(true);
    if (!(await submitVoteComment(CFG.slug, comment))) {
      setFalhou(true);
      setSending(false);
      return;
    }
    setFalhou(false);
    await enviarAssinatura(CFG.slug);
    setSent(true);
    sendBeacon(CFG.slug, "voto-whatsapp");
    setSending(false);
    fireConfetti();
  }

  const t = CFG.theme;

  /* Faixa do guia da casa (c4-20k/72, variante D). Mesma faixa nos dois estados. */
  const guia = (delay: string) =>
    OFERTA ? (
      <div className="vp-of" style={{ background: `${t.accent}0F`, borderColor: `${t.accent}33`, animation: `vpUp .9s ease-out ${delay} both` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={OFERTA.capa} alt={`Capa do guia ${OFERTA.titulo}`} width={56} height={78} />
        <div>
          <b style={{ fontFamily: t.font, color: t.heading }}>{OFERTA.titulo}</b>
          {OFERTA.promessa ? <small>{OFERTA.promessa}</small> : null}
        </div>
        <a href={OFERTA.href} className="vp-btn" style={{ background: t.btnBg, color: t.btnText }}>Conhecer o guia</a>
      </div>
    ) : null;

  return (
    <>
      <PageBeacon slug={CFG.slug} step="voto-positivo" />
      <VoteBeacon slug={CFG.slug} />

      <style>{`
        @keyframes vpFall { 0% { opacity:.6; transform:translateY(0) rotate(0) } 100% { opacity:0; transform:translateY(100vh) rotate(720deg) } }
        @keyframes vpUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .vp-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; font-weight:700; font-size:16px; padding:15px 28px; border-radius:10px; text-decoration:none; line-height:1; border:none; cursor:pointer; transition:transform .16s ease, opacity .16s ease }
        .vp-btn:hover { transform:translateY(-1px); opacity:.92 }
        .vp-btn:disabled { cursor:default; opacity:.45; transform:none }
        .vp-ta { width:100%; box-sizing:border-box; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:.9rem 1rem; font-family:var(--font-body, system-ui, sans-serif); font-size:.95rem; line-height:1.6; resize:vertical; outline:none; transition:border-color .18s ease }
        .vp-ta:focus { border-color:var(--vp-accent) }
        .vp-ta::placeholder { color:var(--vp-text); opacity:.5 }
        .vp-pr { font-size:.85rem; line-height:1.5; opacity:.85; max-width:420px; margin:.7rem auto 0; position:relative }
        .vp-pr a { text-decoration:underline; text-underline-offset:2px }
        .vp-of { display:grid; grid-template-columns:56px 1fr; gap:12px 14px; align-items:center; text-align:left; width:100%; max-width:480px; margin-top:1.75rem; padding:14px; border-radius:12px; border:1px solid; font-family:var(--font-body, system-ui, sans-serif); position:relative }
        .vp-of img { width:56px; height:auto; border-radius:3px; box-shadow:0 5px 14px rgba(0,0,0,.2) }
        .vp-of b { display:block; font-size:1.1rem; line-height:1.15; margin-bottom:4px }
        .vp-of small { display:block; font-size:.8rem; line-height:1.45; color:var(--vp-text) }
        .vp-of .vp-btn { grid-column:1 / -1; justify-self:start; width:auto; max-width:none; font-size:13.5px; padding:10px 14px }
        .vp-cm { display:grid; grid-template-columns:72px 1fr; gap:12px 14px; align-items:center; text-align:left; width:100%; max-width:480px; box-sizing:border-box; margin-top:1rem; padding:12px 14px; border-radius:12px; border:1px solid; font-family:var(--font-body, system-ui, sans-serif); position:relative }
        .vp-cm img { width:72px; height:72px; border-radius:8px; object-fit:cover }
        .vp-cm b { display:block; font-size:1rem; line-height:1.2; margin-bottom:4px }
        .vp-cm small { display:block; font-size:.8rem; line-height:1.45; color:var(--vp-text) }
        .vp-cm .vp-btn { grid-column:1 / -1; justify-self:start; width:auto; max-width:none; font-size:13.5px; padding:10px 14px }
        .vp-tm { width:100%; max-width:480px; box-sizing:border-box; margin:0 0 1.75rem; padding:16px 14px 14px; border-radius:12px; border:1px solid; text-align:left; font-family:var(--font-body, system-ui, sans-serif); position:relative }
        .vp-tm-q { font-size:1.2rem; font-weight:700; line-height:1.3; margin:0 0 6px }
        .vp-tm-op { display:block; width:100%; box-sizing:border-box; text-align:left; background:transparent; border:1px solid; border-radius:10px; padding:14px; font:inherit; font-size:1rem; font-weight:600; line-height:1.3; cursor:pointer; margin-top:8px; transition:background .16s ease, opacity .16s ease }
        .vp-tm-op:hover:not(:disabled) { background:rgba(127,127,127,.12) }
        .vp-tm-op:disabled { cursor:default }
        .vp-tm-ok { font-size:.95rem; line-height:1.5; margin:12px 0 0 }
        @media (max-width:480px){ .vp-btn{ width:100%; max-width:340px } }
      `}</style>

      {/* Confetti, emojis da marca, dispara só DEPOIS do envio */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50, overflow: "hidden" }}>
        {confetti.map((p) => (
          <span key={p.id} style={{ position: "absolute", top: -30, left: `${p.left}%`, fontSize: p.size, animation: `vpFall ${p.duration}s ease-in ${p.delay}s forwards`, opacity: 0 }}>{p.emoji}</span>
        ))}
      </div>

      <main
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2.5rem 1.5rem",
          textAlign: "center",
          position: "relative",
          background: t.bg,
          ["--vp-accent" as string]: t.accent,
          ["--vp-text" as string]: t.text,
        }}
      >
        {/* glow de acento atrás do conteúdo */}
        <div style={{ position: "absolute", top: "28%", left: "50%", transform: "translateX(-50%)", width: 480, height: 480, maxWidth: "92vw", background: `radial-gradient(circle, ${t.glow}, transparent 65%)`, pointerEvents: "none" }} />

        <a href="/" style={{ marginBottom: "1.75rem", animation: "vpUp .9s ease-out .3s both", position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={CFG.logo} alt={CFG.brand} width={CFG.logoW} height={CFG.logoH} style={{ height: "auto", maxWidth: "70vw" }} />
        </a>

        <p style={{ fontFamily: t.font, letterSpacing: ".22em", textTransform: "uppercase", fontSize: 12, fontWeight: 600, color: "var(--vp-accent)", marginBottom: "1rem", animation: "vpUp .9s ease-out .5s both", position: "relative" }}>{CFG.kicker}</p>

        <h1 style={{ fontFamily: t.font, fontWeight: 800, fontSize: "clamp(2rem, 5vw, 3.25rem)", lineHeight: 1.1, letterSpacing: "-.015em", color: t.heading, marginBottom: "1.25rem", maxWidth: 640, animation: "vpUp .9s ease-out .7s both", position: "relative" }}>
          {CFG.headline} <span style={{ color: "var(--vp-accent)" }}>{CFG.highlight}</span>
        </h1>
        <PerguntaTema />

        {!sent ? (
          /* ESTADO A, caixa de comentário primeiro */
          <>
            <p style={{ fontSize: "1.125rem", color: t.text, maxWidth: 480, lineHeight: 1.7, marginBottom: "1.75rem", animation: "vpUp .9s ease-out .9s both", position: "relative" }}>
              O que te fez dar nota máxima hoje? Lemos cada resposta, e o que muita gente elogia a casa mantém.
            </p>

            <div style={{ width: "100%", maxWidth: 480, animation: "vpUp .9s ease-out 1.1s both", position: "relative" }}>
              {pergunta ? (
                <p data-pergunta style={{ fontFamily: t.font, fontSize: "1.125rem", fontStyle: "italic", color: t.heading, margin: "0 0 .75rem", lineHeight: 1.4, textAlign: "left" }}>
                  {pergunta}
                </p>
              ) : null}
              <textarea
                className="vp-ta"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={pergunta ? "Sua resposta" : "O que mais te marcou nesta edição?"}
                rows={4}
                maxLength={2000}
                style={{ color: t.heading, marginBottom: "1rem" }}
              />
              <AssinaComo slug={CFG.slug} />
              <button
                className="vp-btn"
                onClick={handleSubmit}
                disabled={sending || !comment.trim()}
                style={{ background: t.btnBg, color: t.btnText }}
              >
                {sending ? "Enviando..." : falhou ? "Tentar de novo" : "Enviar resposta"}
              </button>
              {falhou ? (
                <p role="alert" data-voto-erro style={{ fontSize: ".9rem", lineHeight: 1.5, marginTop: ".85rem", opacity: 0.85 }}>
                  Sua resposta não chegou. Tente de novo; se falhar outra vez, responda o email da edição.
                </p>
              ) : null}
            </div>

            {guia("1.3s")}
            <CamisetaCard t={t} delay="1.35s" />
          </>
        ) : (
          /* ESTADO B, pós-envio: agradecimento + WhatsApp */
          <>
            <p style={{ fontSize: "1.125rem", color: t.text, maxWidth: 480, lineHeight: 1.7, marginBottom: "2.5rem", animation: "vpUp .7s ease-out .05s both", position: "relative" }}>{CFG.paragraph}</p>

            <a href={shareUrl} target="_blank" rel="noopener noreferrer" onClick={() => sendBeacon(CFG.slug, "voto-whatsapp", { eventType: "converteu" })} className="vp-btn" style={{ background: t.btnBg, color: t.btnText, animation: "vpUp .7s ease-out .25s both", position: "relative" }}>
              Indicar pra um amigo no WhatsApp
            </a>
            <PremioIndique t={t} email={email} delay=".3s" />

            {guia(".35s")}
            <CamisetaCard t={t} delay=".4s" />

            <p style={{ fontFamily: t.font, fontStyle: "italic", fontSize: "1rem", color: t.text, opacity: .7, marginTop: "3rem", animation: "vpUp .7s ease-out .45s both", position: "relative" }}>{CFG.tagline}</p>
          </>
        )}
      </main>
    </>
  );
}
