"use client";

import { useEffect, useState, type CSSProperties } from "react";

/**
 * Voto beacon → Supabase (tabela public.edition_votes).
 * Lê ?nota=1..5&ed=NNN&s=email da URL (links do bloco de voto no email).
 * - sub_hash = sha256(lower(email)) calculado AQUI; o email nunca é gravado.
 * - id gerado no client (RLS é insert-only, sem RETURNING) e guardado em
 *   sessionStorage pra página de feedback anexar o comentário via RPC.
 * - Idempotente por sessionStorage (slug+ed+nota).
 * - frm/09: sem `@` no `s` (post público no site: `{{email}}` literal ou vazio) o voto
 *   NÃO grava no load. Aparece uma barra com a nota e o botão «Confirmar nota» no
 *   visual da página (cor, fonte e raio copiados do botão «Enviar» dela); o voto grava
 *   no toque ou no envio do comentário. Crawler e prévia de link não tocam.
 *   Com email no link, grava no load como sempre.
 *
 * Uso:
 *   <VoteBeacon slug="fortaleza-interior" />   // em /voto-positivo, /voto-melhoria, /voto-feedback
 *   submitVoteComment("fortaleza-interior", texto)  // nas páginas com textarea
 */

type Voto = { nota: number; ed: number; email: string };

const EVENTO = "voto-gravado";
let emVoo: Promise<string | null> | null = null;

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function maskEmail(email: string): string | null {
  const at = email.indexOf("@");
  if (at < 1) return null;
  return email[0] + "****@" + email.slice(at + 1);
}

function parseVoteParams(): Voto | null {
  const p = new URLSearchParams(window.location.search);
  const nota = parseInt(p.get("nota") || "", 10);
  const ed = parseInt(p.get("ed") || "", 10);
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) return null;
  if (!Number.isInteger(ed) || ed < 1) return null;
  return { nota, ed, email: (p.get("s") || "").trim().toLowerCase() };
}

/** Grava o voto 1x por sessão (slug+ed+nota) e devolve o id, ou null se falhou. */
function gravaVoto(slug: string, v: Voto): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return Promise.resolve(null);

  const k = `vote_${slug}_${v.ed}_${v.nota}`;
  try {
    if (sessionStorage.getItem(k)) return emVoo || Promise.resolve(sessionStorage.getItem(`vote_id_${slug}_${v.ed}`));
    sessionStorage.setItem(k, "1");
  } catch {
    /* modo privado etc., segue e grava */
  }

  emVoo = (async () => {
    let subHash: string | null = null;
    let emailMask: string | null = null;
    if (v.email.includes("@")) {
      emailMask = maskEmail(v.email);
      try {
        subHash = await sha256Hex(v.email);
      } catch {
        /* SubtleCrypto indisponível (http), voto segue anônimo */
      }
    }
    const id = crypto.randomUUID();
    try {
      sessionStorage.setItem(`vote_id_${slug}_${v.ed}`, id);
    } catch {}

    try {
      const res = await fetch(`${url}/rest/v1/edition_votes`, {
        method: "POST",
        keepalive: true,
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          id,
          slug,
          edition: v.ed,
          rating: v.nota,
          sub_hash: subHash,
          email_mask: emailMask,
          path: window.location.pathname,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      /* best-effort, nunca quebra a página; libera a sessão pra um novo toque */
      try {
        sessionStorage.removeItem(k);
        sessionStorage.removeItem(`vote_id_${slug}_${v.ed}`);
      } catch {}
      return null;
    }
    window.dispatchEvent(new Event(EVENTO));
    return id;
  })();
  return emVoo;
}

type Tema = { bg: string; texto: string; linha: string; fonte: string; titulo: string; btnBg: string; btnCor: string; btnFonte: string; raio: string; caixa: string; espaco: string };

const VAZIO = /^(rgba\(0, 0, 0, 0\)|transparent)$/;

/** Visual da própria página: fundo do <main>, cor do título, botão «Enviar» (a casa tem 3 famílias de variável CSS). */
function temaDaPagina(): Tema {
  const cs = (el: Element | null) => (el ? getComputedStyle(el) : null);
  const main = document.querySelector("main");
  const fundo = [cs(main), cs(document.body)].find((s) => s && !VAZIO.test(s.backgroundColor));
  const h1 = cs(document.querySelector("main h1"));
  const botoes = Array.from(document.querySelectorAll("main button"));
  const btn = cs(
    botoes.find((b) => /enviar/i.test(b.textContent || "")) ||
      botoes.find((b) => !VAZIO.test(getComputedStyle(b).backgroundColor)) ||
      null,
  );
  const texto = h1?.color || cs(document.body)?.color || "#222";
  return {
    bg: fundo?.backgroundColor || "#fff",
    texto,
    linha: `color-mix(in srgb, ${texto} 18%, transparent)`,
    fonte: cs(document.body)?.fontFamily || "system-ui, sans-serif",
    titulo: h1?.fontFamily || "inherit",
    btnBg: btn && !VAZIO.test(btn.backgroundColor) ? btn.backgroundColor : texto,
    btnCor: btn?.color || "#fff",
    btnFonte: btn?.fontFamily || "inherit",
    raio: btn?.borderRadius || "6px",
    caixa: btn?.textTransform || "none",
    espaco: btn?.letterSpacing || "normal",
  };
}

export default function VoteBeacon({ slug }: { slug: string }) {
  const [toque, setToque] = useState<{ v: Voto; t: Tema } | null>(null);
  const [estado, setEstado] = useState<"espera" | "gravando" | "falhou" | "ok">("espera");

  useEffect(() => {
    const v = parseVoteParams();
    if (!v) return;
    if (v.email.includes("@")) {
      void gravaVoto(slug, v);
      return;
    }
    try {
      if (sessionStorage.getItem(`vote_${slug}_${v.ed}_${v.nota}`)) return;
    } catch {}
    setToque({ v, t: temaDaPagina() });
    const fecha = () => setEstado("ok");
    window.addEventListener(EVENTO, fecha);
    return () => window.removeEventListener(EVENTO, fecha);
  }, [slug]);

  useEffect(() => {
    if (!toque) return;
    if (estado === "ok") {
      const t = window.setTimeout(() => setToque(null), 2600);
      return () => window.clearTimeout(t);
    }
    const antes = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "96px";
    return () => {
      document.body.style.paddingBottom = antes;
    };
  }, [toque, estado]);

  if (!toque) return null;
  const { v, t } = toque;

  async function confirmar() {
    if (estado === "gravando") return;
    setEstado("gravando");
    if ((await gravaVoto(slug, v)) === null) setEstado("falhou");
  }

  return (
    <div
      data-voto-toque
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 60,
        display: "flex",
        justifyContent: "center",
        padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
        background: t.bg,
        borderTop: `1px solid ${t.linha}`,
        boxShadow: "0 -8px 24px rgba(0,0,0,.08)",
        fontFamily: t.fonte,
        color: t.texto,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, width: "100%", maxWidth: 480 }}>
        {estado === "ok" ? (
          <p role="status" style={{ margin: 0, fontSize: 15 }}>
            Nota confirmada. Obrigado.
          </p>
        ) : (
          <>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.3 }}>
              Sua nota: <b style={{ fontFamily: t.titulo, fontSize: 18, whiteSpace: "nowrap" }}>{v.nota} de 5</b>
            </p>
            <button
              type="button"
              onClick={confirmar}
              disabled={estado === "gravando"}
              style={{
                flexShrink: 0,
                background: t.btnBg,
                color: t.btnCor,
                fontFamily: t.btnFonte,
                borderRadius: t.raio,
                textTransform: t.caixa as CSSProperties["textTransform"],
                letterSpacing: t.espaco,
                fontSize: 14,
                fontWeight: 600,
                padding: "13px 20px",
                border: "none",
                cursor: "pointer",
                opacity: estado === "gravando" ? 0.6 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {estado === "gravando" ? "Gravando..." : estado === "falhou" ? "Tentar de novo" : "Confirmar nota"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Anexa comentário ao voto desta sessão (RPC preenche 1x, nunca sobrescreve). */
export async function submitVoteComment(slug: string, comment: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const text = comment.trim();
  if (!url || !key || !text) return false;

  const v = parseVoteParams();
  let voteId: string | null = null;
  // Voto sem email ainda não gravado (frm/09): o envio do comentário grava o voto antes.
  if (v) voteId = await gravaVoto(slug, v);
  try {
    if (!voteId) {
      const k = Object.keys(sessionStorage).find((x) => x.startsWith(`vote_id_${slug}_`));
      voteId = k ? sessionStorage.getItem(k) : null;
    }
  } catch {}
  if (!voteId) return false;

  try {
    const res = await fetch(`${url}/rest/v1/rpc/set_vote_comment`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_id: voteId, p_comment: text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
