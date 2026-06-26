"use client";

import { useEffect } from "react";

/**
 * Voto beacon → Supabase (tabela public.edition_votes).
 * Lê ?nota=1..5&ed=NNN&s=email da URL (links do bloco de voto no email).
 * - sub_hash = sha256(lower(email)) calculado AQUI; o email nunca é gravado.
 * - id gerado no client (RLS é insert-only, sem RETURNING) e guardado em
 *   sessionStorage pra página de feedback anexar o comentário via RPC.
 * - Idempotente por sessionStorage (slug+ed+nota).
 *
 * Uso:
 *   <VoteBeacon slug="fortaleza-interior" />   // em /voto-positivo, /voto-melhoria, /voto-feedback
 *   submitVoteComment("fortaleza-interior", texto)  // nas páginas com textarea
 */

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

function parseVoteParams() {
  const p = new URLSearchParams(window.location.search);
  const nota = parseInt(p.get("nota") || "", 10);
  const ed = parseInt(p.get("ed") || "", 10);
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) return null;
  if (!Number.isInteger(ed) || ed < 1) return null;
  return { nota, ed, email: (p.get("s") || "").trim().toLowerCase() };
}

export default function VoteBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;

    const v = parseVoteParams();
    if (!v) return;

    const k = `vote_${slug}_${v.ed}_${v.nota}`;
    try {
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, "1");
    } catch {
      /* modo privado etc. — segue e grava */
    }

    (async () => {
      let subHash: string | null = null;
      let emailMask: string | null = null;
      if (v.email.includes("@")) {
        emailMask = maskEmail(v.email);
        try {
          subHash = await sha256Hex(v.email);
        } catch {
          /* SubtleCrypto indisponível (http) — voto segue anônimo */
        }
      }
      const id = crypto.randomUUID();
      try {
        sessionStorage.setItem(`vote_id_${slug}_${v.ed}`, id);
      } catch {}

      fetch(`${url}/rest/v1/edition_votes`, {
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
      }).catch(() => {
        /* best-effort, nunca quebra a página */
      });
    })();
  }, [slug]);

  return null;
}

/** Anexa comentário ao voto desta sessão (RPC preenche 1x, nunca sobrescreve). */
export async function submitVoteComment(slug: string, comment: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const text = comment.trim();
  if (!url || !key || !text) return false;

  const v = parseVoteParams();
  let voteId: string | null = null;
  try {
    voteId = v ? sessionStorage.getItem(`vote_id_${slug}_${v.ed}`) : null;
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
