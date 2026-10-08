"use client";

/* ============================================================
 * CAMPO «NOME E SOBRENOME (OPCIONAL)» DAS PÁGINAS DE VOTO (exo-scriptorium/25; rótulo e filtro do app/92)
 * AUTO-GERADO por _shared/scripts/exo25_assina.py. NÃO EDITAR À MÃO.
 * Fonte = _shared/voto-positivo/AssinaComo.template.tsx + o filtro nomeReal
 * de _shared/scriptorium-quiz/lib/voz.ts (exo/26), copiado na geração.
 *
 * modo "voto" (/voto-positivo e /voto-melhoria, só com nota 4 ou 5 na URL):
 * campo + aviso «Sua frase pode sair numa edição.» (texto do switch, exo/139). O nome válido fica
 * pendente e a página manda junto do comentário (enviarAssinatura, depois do
 * submitVoteComment). Sem `tema`, o campo copia o visual da caixa de texto
 * logo acima, então encaixa em qualquer página da casa.
 * modo "pauta" (/voto-pauta): campo + botão «Assinar», grava na hora no voto
 * de pauta desta sessão (créditos da pauta, exo/27).
 * O banco refaz o filtro (public.assinatura_limpa, migration 0058): o daqui
 * só evita mandar o que vai voltar recusado. app/92: o campo pede nome e sobrenome
 * (nomeReal, as regras do bloco Leitores VIP); o banco segue com o filtro de antes. Rota de apagar: o leitor responde
 * a qualquer edição e o Forum tira o nome.
 * exo/139: o aviso do modo voto passa a dizer que a frase pode ser publicada (texto do switch, no
 * lugar do aviso do gam/219 citado acima) e o envio carimba edition_votes.aviso_publicacao pela RPC
 * set_vote_aviso (migration 0070). O seletor dos «Comentários do leitor» só imprime frase carimbada.
 * ============================================================ */

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

/* filtro copiado de _shared/scriptorium-quiz/lib/voz.ts (nomeLimpo e nomeReal, exo/26 e app/92) */
export const NOME_MAX = 40;

// Raízes barradas na assinatura. Casa por palavra inteira, sem acento: «Cuiabá» e «Putinga»
// passam, o palavrão solto não. Lista curta de propósito: a casa lê o nome antes de imprimir.
// Anda junto da OFENSIVAS do bloco Leitores VIP (_shared/scripts/leitores_vip.py); o voz.test.ts trava.
export const OFENSIVAS = [
  "porra", "caralho", "merda", "bosta", "puta", "puto", "cu", "cuzao", "foda", "fodase", "foder",
  "buceta", "boceta", "piroca", "viado", "viadinho", "bicha", "arrombado",
  "otario", "otaria", "babaca", "idiota", "imbecil", "vagabunda", "vagabundo", "corno", "desgraca",
  "fdp", "vsf", "vtnc", "pqp", "nazista", "hitler", "fuck", "shit", "bitch", "nigger",
  "cacete", "rola", "pau", "xota", "xoxota", "punheta", "bunda", "peido", "safado", "safada",
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

// Nome e sobrenome (app/92): o formulário pede o que o bloco Leitores VIP imprime. Mesmas regras do
// `nome_real` de _shared/scripts/leitores_vip.py, menos o Censo e a conferência à mão, que ficam só no
// bloco: o que passa aqui passa lá, salvo primeiro nome fora do Censo (a casa libera à mão).
// RAIZES reprova dentro da palavra («Bundinha»); curta de propósito pra não pegar sobrenome.
export const RAIZES = ["bund", "porr", "caralh", "merd", "fod", "bucet", "bocet", "piroc", "punhet", "xoxot",
  "cuzao", "arromb", "viad", "putinh", "putaria"];
export const FALSOS = ["fulano", "fulana", "ciclano", "beltrano", "teste", "test", "anonimo", "anonima", "ninguem",
  "leitor", "leitora", "usuario", "usuaria", "admin", "nome", "sobrenome", "eu", "mim", "sim", "nao", "xxx", "asdf",
  "qwerty", "abc", "vip", "assinante"];
export const PARTICULAS = ["da", "de", "do", "das", "dos", "e", "di", "du", "del", "van", "von", "la", "le", "y"];

export const ROTULO_NOME = "Nome e sobrenome";
export const EXEMPLO_NOME = "Ex.: Marina Souza";
export const ERRO_SOBRENOME = "Falta o sobrenome. Escreva como Marina Souza.";
export const ERRO_NOME = "Use nome e sobrenome, sem número, símbolo, email, link ou palavrão.";

export type NomeReal =
  | { ok: true; nome: string }
  | { ok: false; motivo: "vazio" | "email" | "link" | "ofensivo" | "sem_letra" | "sobrenome" | "estranho" };

const ehMaiuscula = (c: string) => c !== c.toLowerCase() && c === c.toUpperCase();
const ehMinuscula = (c: string) => c !== c.toUpperCase() && c === c.toLowerCase();

/** «MARIA DA SILVA» e «maria da silva» viram «Maria da Silva» (o `_titulo` do bloco). */
function titulo(t: string): string {
  return t.toLowerCase().split(" ").map((w, i) => (i && PARTICULAS.includes(w) ? w
    : w.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("-"))).join(" ");
}

/**
 * Nome que o formulário aceita: o `nomeLimpo` e mais as regras do bloco. Duas palavras completas
 * (partícula como «da» no meio vale), sem número nem símbolo, maiúscula só no começo da palavra,
 * com vogal, sem letra repetida três vezes, sem palavrão nem nome de mentira. Apóstrofo curvo do
 * celular vira o reto («D’Ávila» → «D'Ávila»). `sobrenome` = faltou o sobrenome ou ele veio abreviado.
 */
export function nomeReal(s?: string | null): NomeReal {
  const lido = nomeLimpo((s ?? "").normalize("NFC").replace(/[’‘ʼ`´]/g, "'"));
  if (!lido.ok) return lido;
  let t = lido.nome.replace(/[.,;: ]+$/, "");
  if (/\p{Nd}/u.test(t) || /[^\p{L}\p{N}\s'.-]|_/u.test(t)) return { ok: false, motivo: "estranho" };
  const letras = Array.from(t).filter((c) => /\p{L}/u.test(c));
  if (letras.length >= 4 && (letras.every(ehMaiuscula) || letras.every(ehMinuscula))) t = titulo(t);
  const toks = t.split(" ");
  if (toks.every((x) => /^(?:\p{L}\.?){1,4}$/u.test(x) && x.toUpperCase() === x)) return { ok: false, motivo: "sobrenome" };
  let cheias = 0;
  let ultimo = "";
  for (let i = 0; i < toks.length; i++) {
    const tok = toks[i];
    const nu = semAcento(tok).toLowerCase().replace(/^[.']+|[.']+$/g, "");
    // partícula no fim («Maria da») conta como sobrenome faltando: aqui o formulário é mais rígido que o bloco
    if (i > 0 && PARTICULAS.includes(nu)) { ultimo = "particula"; continue; }
    if (/^\p{L}\.?$/u.test(tok)) { ultimo = "inicial"; continue; }
    const corpo = tok.replace(/['-]/g, "");
    if (Array.from(corpo).length < 2 || !/^\p{L}+$/u.test(corpo)) return { ok: false, motivo: "estranho" };
    if (tok.split(/['-]/).some((p) => p && Array.from(p).slice(1).some(ehMaiuscula))) return { ok: false, motivo: "estranho" };
    if (!/[aeiouyáàâãéêíóôõúü]/.test(corpo.toLowerCase())) return { ok: false, motivo: "estranho" };
    if (/(.)\1\1/u.test(corpo.toLowerCase())) return { ok: false, motivo: "estranho" };
    cheias++;
    ultimo = "cheia";
  }
  const palavras = semAcento(t).toLowerCase().split(/[^a-z]+/).filter(Boolean);
  if (palavras.some((p) => OFENSIVAS.includes(p) || RAIZES.some((r) => p.includes(r)))) return { ok: false, motivo: "ofensivo" };
  if (palavras.some((p) => FALSOS.includes(p))) return { ok: false, motivo: "estranho" };
  if (cheias < 2 || ultimo === "inicial" || ultimo === "particula") return { ok: false, motivo: "sobrenome" };
  return { ok: true, nome: t };
}

/** Linha de erro do campo: curta quando só falta o sobrenome. */
export function erroDoNome(motivo: string): string {
  return motivo === "sobrenome" ? ERRO_SOBRENOME : ERRO_NOME;
}

type Tema = { accent: string; heading: string; text: string; btnBg: string; btnText: string };

const CHAVE = "assina_como";   // último nome que o leitor usou neste aparelho (por domínio = por casa)
let pendente: string | null = null;
const NOTAS_PUBLICA: number[] = [4, 5];   // notas em que o aviso diz que a frase pode sair (switch); nas outras fica o aviso do nome
let avisado = false;   // a caixa do voto mostrou o aviso de publicação nesta página

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
  // exo/139: frase escrita com o aviso na tela leva o carimbo; o nome, quando veio, grava na mesma chamada
  if (id && avisado) {
    const r = await Promise.race([rpc("set_vote_aviso", id, nome || ""), new Promise<string>((ok) => setTimeout(() => ok("tempo"), 5000))]);
    if (r === "tempo") return false;   // rede presa: o comentário já gravou, a página não fica em «Enviando...»
    if (r !== null) {
      if (r === "ok" && nome) guarda(nome);
      return r === "ok";
    }
    // sem resposta da função (erro do banco): cai no caminho de antes, que ainda grava o nome
  }
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
  const [publica, setPublica] = useState(false);   // esta nota leva o aviso de publicação

  useEffect(() => {
    const { nota } = lerUrl();
    setVisivel(modo === "pauta" || nota === 4 || nota === 5);
    const pub = modo === "voto" && NOTAS_PUBLICA.includes(nota);
    setPublica(pub);
    // voto sem email no link (post público) não tem frase que a edição possa imprimir: sem campo e sem aviso de publicação
    if (pub && !(new URLSearchParams(window.location.search).get("s") || "").includes("@")) setVisivel(false);
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo && nomeReal(salvo).ok) setNome(salvo);
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

  const lido = nome.trim() ? nomeReal(nome) : null;
  const valido = lido?.ok ? lido.nome : null;
  const erro = !!lido && !lido.ok;
  if (modo === "voto") pendente = valido;

  useEffect(() => () => { if (modo === "voto") pendente = null; }, [modo]);
  useEffect(() => {
    // só vale o carimbo com o aviso na tela: com nome recusado, a linha do aviso dá lugar ao alerta do filtro
    if (modo === "voto") avisado = visivel && publica && !erro;
    return () => { if (modo === "voto") avisado = false; };
  }, [modo, visivel, publica, erro]);

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
  const aviso = modo === "pauta" ? "Se esta pauta vencer, seu nome pode sair na edição." : (publica ? "Sua frase pode sair numa edição." : "Seu nome fica guardado pra quando a casa abrir o espaço dos leitores.");
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
        {ROTULO_NOME} (opcional)
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <input id={uid} type="text" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={NOME_MAX}
          placeholder={EXEMPLO_NOME} autoComplete="name" aria-invalid={erro} style={{ ...input, flex: 1, minWidth: 0 }} />
        {modo === "pauta" && tema ? (
          <button type="button" onClick={assinar} disabled={!valido || estado !== "aberto"}
            style={{ flex: "none", border: "none", borderRadius: 10, padding: "0 1.1rem", fontSize: 15, fontWeight: 700, cursor: valido ? "pointer" : "default",
              background: tema.btnBg, color: tema.btnText, opacity: valido && estado === "aberto" ? 1 : .45 }}>
            {estado === "enviando" ? "..." : "Assinar"}
          </button>
        ) : null}
      </div>
      {erro ? (
        <p role="alert" style={{ ...pequeno, opacity: 1 }}>{erroDoNome(lido && !lido.ok ? lido.motivo : "")}</p>
      ) : (
        <p style={pequeno}>{aviso}{valido ? apagar : ""}</p>
      )}
    </div>
  );
}
