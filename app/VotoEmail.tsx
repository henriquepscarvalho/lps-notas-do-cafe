"use client";

/* ============================================================
 * CARTÃO «SEU VOTO CHEGOU SEM O SEU NOME» DAS PÁGINAS DE VOTO (exo-scriptorium/201, hipótese c1)
 * AUTO-GERADO pelo build das páginas de voto. NÃO EDITAR À MÃO.
 * Fonte = _shared/voto-positivo/VotoEmail.template.tsx (copiado como app/VotoEmail.tsx).
 *
 * Quem vota pela edição na web chega com o link sem o email (s={{email}} cru). Desde o frm/09
 * (28/09) o VoteBeacon só grava esse voto no gesto («Confirmar nota» ou envio do comentário), sem
 * sub_hash, e avisa a página com o evento «voto-gravado». O cartão espera esse voto existir e só
 * então aparece. Teste de 2 braços, só nesse voto:
 *   A = a página de hoje, sem cartão;  B = cartão com 1 campo de email opcional.
 * Sorteio 50/50 fixo por aparelho: paridade dos 8 primeiros hex de sha256(sal + ":" + aparelho),
 * aparelho = 16 hex de sha256("dev:" + semente aleatória do localStorage). Nenhum email no sorteio.
 * O braço vai pro banco pela RPC voto_web_braco (tabela voto_web_email, 1 linha por voto web) e pro
 * funil pelo beacon `e201-a` ou `e201-b` em lp_page_views (apareceu; converteu no envio do B), na
 * mesma jornada do clique no guia e na camiseta: é o que a guarda de receita lê por braço.
 * No B, o email digitado vira sha256 NO NAVEGADOR e só o hash segue pra RPC voto_web_email, que
 * casa com assinante ativo da casa: casou, o voto ganha o sub_hash; não casou, nada do email fica.
 * A resposta é a mesma nos dois casos: a página nunca diz se o email é assinante.
 * Chave de rede: cfg.flag ({"ligado": true, "casas": [...]}); ausente, ilegível, false ou casa fora da
 * lista = página de hoje pra todo mundo e nenhuma chamada do teste. `?internal=1&e201=a|b` força o
 * braço (prova). Liga e desliga: _shared/scripts/exo201_rollout.py (largada de 02/11 com trava de data).
 * ============================================================ */

import { useEffect, useId, useState } from "react";
import type { CSSProperties } from "react";
import { sendBeacon } from "./PageBeacon";

type Tema = { accent: string; heading: string; text: string; btnBg: string; btnText: string; font: string };
export type VotoEmailCfg = { flag: string; sal: string; titulo: string; texto: string; nota: string; okTitulo: string; ok: string };
type Estado = "aberto" | "enviando" | "feito" | "erro";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/* A /voto-positivo troca o bloco da caixa pelo «Recebido» e o cartão remonta: o que o leitor digitou
 * e o estado ficam aqui, fora do componente, e o braço é registrado 1 vez por voto. */
const mem: { email: string; estado: Estado; registrado: string | null } = { email: "", estado: "aberto", registrado: null };

async function hex256(s: string): Promise<string> {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
}

function rnd(n: number): string {
  let s = "";
  while (s.length < n) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}

const espera = (ms: number) => new Promise<null>((ok) => window.setTimeout(() => ok(null), ms));
const EVENTO = "voto-gravado"; // o VoteBeacon dispara depois do POST do voto que deu certo

function interno(): boolean {
  try {
    if (new URLSearchParams(window.location.search).get("internal") === "1") localStorage.setItem("vdn_internal", "1");
    return localStorage.getItem("vdn_internal") === "1";
  } catch {
    return false;
  }
}

/** Mesma leitura do VoteBeacon: sem nota e edição válidas não há voto gravado e o cartão não aparece. */
function lerVoto(): { ed: number; email: string } | null {
  const p = new URLSearchParams(window.location.search);
  const nota = parseInt(p.get("nota") || "", 10);
  const ed = parseInt(p.get("ed") || "", 10);
  if (!Number.isInteger(nota) || nota < 1 || nota > 5 || !Number.isInteger(ed) || ed < 1) return null;
  return { ed, email: (p.get("s") || "").trim().toLowerCase() };
}

function idDoVoto(slug: string, ed: number): string | null {
  try {
    return sessionStorage.getItem(`vote_id_${slug}_${ed}`);
  } catch {
    return null;
  }
}

async function rpc(fn: string, body: Record<string, string>): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok ? String(await res.json()) : null;
  } catch {
    return null;
  }
}

export default function VotoEmail({ slug, cfg, t, estilo }: { slug: string; cfg: VotoEmailCfg; t: Tema; estilo?: CSSProperties }) {
  const uid = useId();
  const [braco, setBraco] = useState<"a" | "b" | null>(null);
  const [voto, setVoto] = useState<string | null>(null);
  const [email, setEmailSt] = useState(mem.email);
  const [estado, setEstadoSt] = useState<Estado>(mem.estado);
  const setEmail = (v: string) => {
    mem.email = v;
    setEmailSt(v);
  };
  const setEstado = (v: Estado) => {
    mem.estado = v;
    setEstadoSt(v);
  };

  useEffect(() => {
    let vivo = true;
    let solta = () => {};
    (async () => {
      const v = lerVoto();
      if (!v || v.email.includes("@")) return; // voto que veio do email já tem pessoa: fora do teste
      const q = new URLSearchParams(window.location.search);
      const forca = interno() ? (q.get("e201") || "").toLowerCase() : "";
      const flag = await Promise.race([
        fetch(cfg.flag, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        espera(3000),
      ]);
      // chave por casa: {"ligado": true, "casas": [...]} liga só as casas da lista; sem `casas`, liga a rede
      const fl = flag as { ligado?: unknown; casas?: unknown } | null;
      const ligado = !!fl && fl.ligado === true && (!Array.isArray(fl.casas) || fl.casas.includes(slug));
      if (!vivo || (!ligado && forca !== "a" && forca !== "b")) return;
      let sem = "";
      try {
        sem = localStorage.getItem("e201_seed") || "";
        if (!sem) {
          sem = rnd(32);
          localStorage.setItem("e201_seed", sem);
        }
      } catch {
        sem = rnd(32); // sem storage: sorteio por carregamento
      }
      let aparelho = "";
      let b: "a" | "b" = "a";
      try {
        aparelho = (await hex256("dev:" + sem)).slice(0, 16);
        b = forca === "a" || forca === "b" ? forca : parseInt((await hex256(`${cfg.sal}:${aparelho}`)).slice(0, 8), 16) % 2 === 0 ? "a" : "b";
      } catch {
        return; // sem crypto.subtle: página de hoje, fora do teste
      }
      // o voto web só existe depois do gesto: espera o evento do VoteBeacon (ou o id no sessionStorage,
      // que cobre o VoteBeacon de antes do frm/09, que grava no load); a página pode ficar aberta sem voto
      const id =
        idDoVoto(slug, v.ed) ||
        (await new Promise<string | null>((ok) => {
          const fim = (x: string | null) => {
            window.removeEventListener(EVENTO, noEvento);
            window.clearInterval(relogio);
            ok(x);
          };
          const noEvento = () => fim(idDoVoto(slug, v.ed));
          const relogio = window.setInterval(() => {
            const x = idDoVoto(slug, v.ed);
            if (x) fim(x);
          }, 500);
          window.addEventListener(EVENTO, noEvento);
          solta = () => fim(null);
        }));
      if (!vivo || !id) return;
      if (mem.registrado !== id) {
        mem.registrado = id;
        const voto = id;
        void (async () => {
          // o POST do voto pode chegar depois desta chamada: a RPC diz «sem_voto» e tenta de novo
          for (let i = 0; i < 3; i++) {
            if ((await rpc("voto_web_braco", { p_id: voto, p_braco: b, p_aparelho: aparelho })) !== "sem_voto") return;
            await espera(1500);
          }
        })();
      }
      setVoto(id);
      setBraco(b);
      sendBeacon(slug, `e201-${b}`);
    })();
    return () => {
      vivo = false;
      solta();
    };
  }, [slug, cfg]);

  const limpo = email.trim().toLowerCase();
  const valido = EMAIL_RE.test(limpo);

  async function enviar() {
    if (!voto || !valido || estado === "enviando" || estado === "feito") return;
    setEstado("enviando");
    let h = "";
    try {
      h = await hex256(limpo);
    } catch {
      setEstado("erro");
      return;
    }
    const r = await Promise.race([rpc("voto_web_email", { p_id: voto, p_hash: h }), espera(6000)]);
    if (r === "ok") {
      setEmail(""); // o email digitado sai da memória da página
      setEstado("feito");
      sendBeacon(slug, "e201-b", { eventType: "converteu" });
    } else {
      setEstado("erro");
    }
  }

  if (braco !== "b") return null;

  const caixa: CSSProperties = {
    width: "100%",
    maxWidth: 480,
    boxSizing: "border-box" as const,
    marginTop: "1.75rem",
    padding: "16px 14px 14px",
    borderRadius: 12,
    border: `1px solid ${t.accent}55`,
    background: `${t.accent}0A`,
    textAlign: "left" as const,
    fontFamily: "var(--font-body, system-ui, sans-serif)",
    position: "relative" as const,
    ...estilo,
  };
  const titulo = { display: "block", fontFamily: t.font, fontSize: "1.1rem", fontWeight: 700, lineHeight: 1.3, color: t.heading, margin: "0 0 6px" };
  const miudo = { fontSize: ".82rem", lineHeight: 1.45, color: t.text, opacity: 0.75, margin: "8px 0 0" };

  if (estado === "feito") {
    return (
      <div data-e201="b-feito" role="status" style={caixa}>
        <b style={titulo}>{cfg.okTitulo}</b>
        <p style={{ fontSize: ".92rem", lineHeight: 1.5, color: t.text, margin: 0 }}>{cfg.ok}</p>
      </div>
    );
  }

  return (
    <div data-e201="b" style={caixa}>
      <label htmlFor={uid} style={titulo}>
        {cfg.titulo}
      </label>
      <p style={{ fontSize: ".92rem", lineHeight: 1.5, color: t.text, margin: "0 0 12px" }}>{cfg.texto}</p>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          id={uid}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={254}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (estado === "erro") setEstado("aberto");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void enviar();
          }}
          placeholder="seu@email.com"
          style={{ flex: 1, minWidth: 0, boxSizing: "border-box", fontSize: 16, lineHeight: 1.3, padding: ".75rem 1rem", borderRadius: 10, border: `1px solid ${t.accent}55`, background: "rgba(127,127,127,.08)", color: t.heading, outline: "none", fontFamily: "inherit" }}
        />
        <button
          type="button"
          onClick={() => void enviar()}
          disabled={!valido || estado === "enviando"}
          style={{ flex: "none", border: "none", borderRadius: 10, padding: "0 1.1rem", fontSize: 15, fontWeight: 700, background: t.btnBg, color: t.btnText, opacity: valido && estado !== "enviando" ? 1 : 0.45, cursor: valido ? "pointer" : "default" }}
        >
          {estado === "enviando" ? "..." : "Enviar"}
        </button>
      </div>
      {estado === "erro" ? (
        <p role="alert" style={{ ...miudo, opacity: 1 }}>
          Não chegou. Tente de novo.
        </p>
      ) : (
        <p style={miudo}>{cfg.nota}</p>
      )}
    </div>
  );
}
