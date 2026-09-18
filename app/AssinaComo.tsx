"use client";

/* ============================================================
 * CAMPO «ASSINE COMO (OPCIONAL)» DAS PÁGINAS DE VOTO (exo-scriptorium/25)
 * AUTO-GERADO por _shared/scripts/exo25_assina.py. NÃO EDITAR À MÃO.
 * Fonte = _shared/voto-positivo/AssinaComo.template.tsx + o filtro nomeLimpo
 * de _shared/scriptorium-quiz/lib/voz.ts (exo/26), copiado na geração.
 *
 * modo "voto" (/voto-positivo e /voto-melhoria, só com nota 4 ou 5 na URL):
 * campo + aviso «sua frase pode sair na próxima edição». O nome válido fica
 * pendente e a página manda junto do comentário (enviarAssinatura, depois do
 * submitVoteComment). Sem `tema`, o campo copia o visual da caixa de texto
 * logo acima, então encaixa em qualquer página da casa.
 * modo "pauta" (/voto-pauta): campo + botão «Assinar», grava na hora no voto
 * de pauta desta sessão (créditos da pauta, exo/27).
 * O banco refaz o filtro (public.assinatura_limpa, migration 0058): o daqui
 * só evita mandar o que vai voltar recusado. Rota de apagar: o leitor responde
 * a qualquer edição e o Forum tira o nome.
 * ============================================================ */

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

/* filtro copiado de _shared/scriptorium-quiz/lib/voz.ts (nomeLimpo, exo/26) */
export const NOME_MAX = 40;

// Raízes barradas na assinatura. Casa por palavra inteira, sem acento: «Cuiabá» e «Putinga»
// passam, o palavrão solto não. Lista curta de propósito: a casa lê o nome antes de imprimir.
const OFENSIVAS = [
  "porra", "caralho", "merda", "bosta", "puta", "puto", "cu", "cuzao", "foda", "fodase", "foder",
  "buceta", "boceta", "piroca", "viado", "viadinho", "bicha", "arrombado",
  "otario", "otaria", "babaca", "idiota", "imbecil", "vagabunda", "vagabundo", "corno", "desgraca",
  "fdp", "vsf", "vtnc", "pqp", "nazista", "hitler", "fuck", "shit", "bitch", "nigger",
];

/** Controle, largura zero, marcas de direção e BOM: somem antes de qualquer conta. */
function invisivel(cp: number): boolean {
  return cp < 0x20 || (cp >= 0x7f && cp <= 0x9f) || (cp >= 0x200b && cp <= 0x200f)
    || (cp >= 0x2028 && cp <= 0x202f) || cp === 0xfeff;
}

function semAcento(s: string): string {
  return Array.from(s.normalize("NFD")).filter((ch) => {
    const cp = ch.codePointAt(0) as number;
    return cp < 0x300 || cp > 0x36f;
  }).join("");
}

export type NomeLido =
  | { ok: true; nome: string }
  | { ok: false; motivo: "vazio" | "email" | "link" | "ofensivo" | "sem_letra" };

/**
 * Assinatura que o leitor escolheu: sem caractere de controle, espaço colapsado, até 40
 * caracteres (o CHECK da tabela é o mesmo). Ninguém assina com endereço de email, link ou
 * palavrão, e o nome precisa de pelo menos uma letra.
 */
export function nomeLimpo(s?: string | null): NomeLido {
  const limpo = Array.from(s ?? "").filter((ch) => !invisivel(ch.codePointAt(0) as number)).join("");
  const t = Array.from(limpo.replace(/[<>]/g, "").replace(/\s+/g, " ").trim())
    .slice(0, NOME_MAX).join("").trim();
  if (!t) return { ok: false, motivo: "vazio" };
  if (/@/.test(t)) return { ok: false, motivo: "email" };
  if (/https?:|www\.|\.com\b|\.br\b|\/\//i.test(t)) return { ok: false, motivo: "link" };
  if (!/\p{L}/u.test(t)) return { ok: false, motivo: "sem_letra" };
  const palavras = semAcento(t).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  if (palavras.some((p) => OFENSIVAS.includes(p))) return { ok: false, motivo: "ofensivo" };
  return { ok: true, nome: t };
}

type Tema = { accent: string; heading: string; text: string; btnBg: string; btnText: string };

const CHAVE = "assina_como";   // último nome que o leitor usou neste aparelho (por domínio = por casa)
let pendente: string | null = null;

function lerUrl() {
  const p = new URLSearchParams(window.location.search);
  return { nota: parseInt(p.get("nota") || "", 10), ed: parseInt(p.get("ed") || "", 10) };
}

function idDaSessao(prefixo: string, slug: string): string | null {
  try {
    const { ed } = lerUrl();
    const direto = Number.isInteger(ed) ? sessionStorage.getItem(`${prefixo}_${slug}_${ed}`) : null;
    if (direto) return direto;
    const k = Object.keys(sessionStorage).find((x) => x.startsWith(`${prefixo}_${slug}_`));
    return k ? sessionStorage.getItem(k) : null;
  } catch {
    return null;
  }
}

async function rpc(fn: string, pId: string, nome: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_id: pId, p_nome: nome }),
    });
    return res.ok ? String(await res.json()) : null;
  } catch {
    return null;
  }
}

function guarda(nome: string) {
  try { localStorage.setItem(CHAVE, nome); } catch {}
}

/** Caixa do voto: manda o nome pendente depois do comentário. Sem nome, não faz nada. */
export async function enviarAssinatura(slug: string): Promise<boolean> {
  const nome = pendente;
  const id = idDaSessao("vote_id", slug);
  if (!nome || !id) return false;
  const r = await rpc("set_vote_assinatura", id, nome);
  if (r === "ok") guarda(nome);
  return r === "ok";
}

export default function AssinaComo({ slug, modo = "voto", tema }: { slug: string; modo?: "voto" | "pauta"; tema?: Tema }) {
  const uid = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);
  const [nome, setNome] = useState("");
  const [campo, setCampo] = useState<CSSProperties>({});
  const [estado, setEstado] = useState<"aberto" | "enviando" | "assinado">("aberto");

  useEffect(() => {
    const { nota } = lerUrl();
    setVisivel(modo === "pauta" || nota === 4 || nota === 5);
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo && nomeLimpo(salvo).ok) setNome(salvo);
    } catch {}
  }, [modo]);

  /* Sem tema: o campo veste o visual da caixa de texto da própria página. */
  useLayoutEffect(() => {
    if (!visivel || tema) return;
    const irmao = ref.current?.previousElementSibling;
    if (!(irmao instanceof HTMLTextAreaElement)) return;
    const s = getComputedStyle(irmao);
    setCampo({ background: s.backgroundColor, border: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`,
      borderRadius: s.borderTopLeftRadius, color: s.color, fontFamily: s.fontFamily });
  }, [visivel, tema]);

  const lido = nome.trim() ? nomeLimpo(nome) : null;
  const valido = lido?.ok ? lido.nome : null;
  const erro = !!lido && !lido.ok;
  if (modo === "voto") pendente = valido;

  useEffect(() => () => { if (modo === "voto") pendente = null; }, [modo]);

  if (!visivel) return null;

  async function assinar() {
    const id = idDaSessao("pauta_id", slug);
    if (!valido || !id || estado !== "aberto") return;
    setEstado("enviando");
    const r = await rpc("set_pauta_assinatura", id, valido);
    if (r === "ok") { guarda(valido); setEstado("assinado"); } else setEstado("aberto");
  }

  const cor = tema ? tema.text : (campo.color as string) || "inherit";
  const pequeno: CSSProperties = { fontSize: ".82rem", lineHeight: 1.45, color: cor, opacity: .75, margin: "6px 0 0" };
  const input: CSSProperties = {
    width: "100%", boxSizing: "border-box", fontSize: 16, lineHeight: 1.3, padding: ".75rem 1rem", outline: "none",
    ...(tema ? { background: "rgba(127,127,127,.08)", border: `1px solid ${tema.accent}55`, borderRadius: 10, color: tema.heading, fontFamily: "inherit" } : campo),
  };
  const aviso = modo === "pauta" ? "Se esta pauta vencer, seu nome pode sair na edição." : "Sua frase pode sair na próxima edição.";
  const apagar = " Pra tirar o nome depois, responda qualquer edição.";

  if (estado === "assinado") {
    return (
      <div ref={ref} style={{ width: "100%", maxWidth: 480, textAlign: "left", margin: "0 0 1.75rem" }}>
        <p style={{ ...pequeno, opacity: 1, fontSize: ".95rem", color: tema ? tema.heading : cor }}>Anotado: você assina como «{valido}».</p>
        <p style={pequeno}>{apagar.trim()}</p>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ width: "100%", maxWidth: 480, textAlign: "left", margin: modo === "pauta" ? "0 0 1.75rem" : "0 0 1rem" }}>
      <label htmlFor={uid} style={{ display: "block", fontSize: ".85rem", fontWeight: 600, color: tema ? tema.heading : cor, opacity: tema ? 1 : .85, marginBottom: 6 }}>
        Assine como (opcional)
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <input id={uid} type="text" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={NOME_MAX}
          placeholder="Seu nome ou iniciais" autoComplete="name" aria-invalid={erro} style={{ ...input, flex: 1, minWidth: 0 }} />
        {modo === "pauta" && tema ? (
          <button type="button" onClick={assinar} disabled={!valido || estado !== "aberto"}
            style={{ flex: "none", border: "none", borderRadius: 10, padding: "0 1.1rem", fontSize: 15, fontWeight: 700, cursor: valido ? "pointer" : "default",
              background: tema.btnBg, color: tema.btnText, opacity: valido && estado === "aberto" ? 1 : .45 }}>
            {estado === "enviando" ? "..." : "Assinar"}
          </button>
        ) : null}
      </div>
      {erro ? (
        <p role="alert" style={{ ...pequeno, opacity: 1 }}>Use nome, apelido ou iniciais, sem email, link ou palavrão.</p>
      ) : (
        <p style={pequeno}>{aviso}{valido ? apagar : ""}</p>
      )}
    </div>
  );
}
