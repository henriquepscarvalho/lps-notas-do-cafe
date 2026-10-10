"use client";

/* ============================================================
 * AtoSeguinte: o próximo ato das páginas de voto (gam/194).
 * AUTO-COPIADO por _shared/voto-melhoria/build.py (fonte: AtoSeguinte.template.tsx).
 * NÃO EDITAR À MÃO na casa.
 *
 * Quem avalia a edição com nota 1 a 4 caía em «Recebido» e nenhum link. Aqui a
 * página ganha uma saída, sempre uma só:
 *   1. votar a próxima pauta: as 4 pautas da oferta aberta da casa, lidas do
 *      discover.json que o loop do Discover publica no Storage (discover_publica.py),
 *      casadas pelo `ed` da URL do voto; cada opção leva pra /voto-pauta?p=..&ed=..&s=..,
 *      que grava o voto no load, igual ao bloco da edição;
 *   2. o hub do leitor (/xp) com o e-mail do voto, quando não há oferta aberta pra esse
 *      `ed`: casa sem fila de pauta, voto já fechado, JSON fora do ar, `ed` ausente ou
 *      pauta já votada nesta sessão.
 * Beacon por destino em lp_page_views (PageBeacon.sendBeacon): `voto-ato-pauta` e
 * `voto-ato-hub`, apareceu ao montar com o destino resolvido, converteu no clique.
 * ============================================================ */

import { useEffect, useState } from "react";
import { sendBeacon } from "./PageBeacon";

export type AtoPauta = { json: string; rota: string };
export type AtoHub = { href: string };
export type AtoTema = { accent: string; heading: string; text: string; btnBg: string; btnText: string; font: string };

type Sai = { dia: string; ddmm: string } | null;
type Oferta = { ed: number; envio?: string; fecha_em?: string; sai?: Sai; pautas?: Record<string, { titulo?: string }> };
type Estado =
  | { tipo: "pauta"; ed: number; s: string; rota: string; sai: Sai; opcoes: { p: string; titulo: string }[] }
  | { tipo: "hub"; href: string }
  | null;

const LETRAS = ["a", "b", "c", "d"];

const CSS = `
.vp-ato{width:100%;max-width:480px;box-sizing:border-box;margin-top:1.75rem;padding:16px 14px 14px;border-radius:12px;border:1px solid;text-align:left;font-family:var(--font-body, system-ui, sans-serif);position:relative}
.vp-ato-on{padding:20px 16px 16px}
.vp-ato-k{display:block;font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--ato-accent);margin-bottom:8px}
.vp-ato p{font-size:.95rem;line-height:1.5;margin:0 0 4px}
.vp-ato-on p{font-size:1.1rem;font-weight:600}
.vp-ato-op{display:flex;gap:10px;align-items:baseline;width:100%;box-sizing:border-box;text-align:left;background:transparent;border:1px solid;border-radius:10px;padding:12px 14px;font:inherit;font-size:.95rem;line-height:1.3;cursor:pointer;margin-top:8px;text-decoration:none;transition:background .16s ease}
.vp-ato-op:hover{background:rgba(127,127,127,.12)}
.vp-ato-op b{font-family:var(--font-heading, inherit);font-size:.9rem;letter-spacing:.06em;min-width:1.2em}
.vp-ato small{display:block;font-size:.8rem;line-height:1.45;color:var(--ato-text);margin-top:10px}
.vp-ato-btn{display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;padding:13px 22px;border-radius:10px;text-decoration:none;line-height:1;margin-top:10px;transition:transform .16s ease,opacity .16s ease}
.vp-ato-btn:hover{transform:translateY(-1px);opacity:.92}
@media (max-width:480px){.vp-ato-btn{width:100%}}
`;

export default function AtoSeguinte({
  slug,
  pauta,
  hub,
  t,
  delay,
  destaque,
}: {
  slug: string;
  pauta: AtoPauta | null;
  hub: AtoHub;
  t: AtoTema;
  delay: string;
  destaque: boolean;
}) {
  const [estado, setEstado] = useState<Estado>(null);

  useEffect(() => {
    let vivo = true;
    const q = new URLSearchParams(window.location.search);
    const ed = parseInt(q.get("ed") || "", 10);
    const s = (q.get("s") || "").trim().toLowerCase();
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : "";
    const sep = hub.href.includes("?") ? "&" : "?";
    const hubHref = `${hub.href}${sep}${email ? `e=${encodeURIComponent(email)}&` : ""}utm_source=lp&utm_medium=voto&utm_campaign=xp&utm_content=ato-hub`;
    const cairNoHub = () => {
      if (!vivo) return;
      setEstado({ tipo: "hub", href: hubHref });
      sendBeacon(slug, "voto-ato-hub");
    };
    if (!pauta || !Number.isInteger(ed) || ed < 1) {
      cairNoHub();
      return;
    }
    try {
      if (sessionStorage.getItem(`pauta_${slug}_${ed}`)) {
        cairNoHub();
        return;
      }
    } catch {
      /* storage bloqueado: segue pro JSON */
    }
    const rota = pauta.rota;
    fetch(pauta.json, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { ofertas?: Oferta[] }) => {
        const of = (d.ofertas || []).find((o) => o.ed === ed);
        const fecha = of && of.fecha_em ? Date.parse(of.fecha_em) : NaN;
        if (!of || !Number.isFinite(fecha) || Date.now() >= fecha) {
          cairNoHub();
          return;
        }
        const ps = of.pautas || {};
        const opcoes = LETRAS.flatMap((p) => {
          const titulo = ps[p] && ps[p].titulo;
          return titulo ? [{ p, titulo }] : [];
        });
        if (opcoes.length < 2 || !vivo) {
          cairNoHub();
          return;
        }
        setEstado({ tipo: "pauta", ed, s: email, rota, sai: of.sai || null, opcoes });
        sendBeacon(slug, "voto-ato-pauta");
      })
      .catch(cairNoHub);
    return () => {
      vivo = false;
    };
    // pauta e hub são constantes do CFG da página; o efeito roda uma vez por montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (!estado) return null;

  return (
    <div
      className={destaque ? "vp-ato vp-ato-on" : "vp-ato"}
      style={{
        borderColor: `${t.accent}${destaque ? "66" : "33"}`,
        animation: `vpUp .9s ease-out ${delay} both`,
        ["--ato-accent" as string]: t.accent,
        ["--ato-text" as string]: t.text,
      }}
    >
      <style>{CSS}</style>
      {estado.tipo === "pauta" ? (
        <>
          <span className="vp-ato-k" style={{ fontFamily: t.font }}>Votação aberta</span>
          <p style={{ color: t.heading }}>{destaque ? "Agora escolha a próxima pauta." : "Qual dessas vira edição?"}</p>
          {estado.opcoes.map((o) => (
            <a
              key={o.p}
              href={`${estado.rota}?p=${o.p}&ed=${estado.ed}${estado.s ? `&s=${encodeURIComponent(estado.s)}` : ""}`}
              className="vp-ato-op"
              style={{ color: t.heading, borderColor: `${t.accent}55` }}
              onClick={() => sendBeacon(slug, "voto-ato-pauta", { eventType: "converteu" })}
            >
              <b style={{ color: t.accent }}>{o.p.toUpperCase()}</b>
              <span>{o.titulo}</span>
            </a>
          ))}
          {/* gam/219: o mesmo dia do card do email (discover.json `sai`), nunca «amanhã» */}
          <small>
            {estado.sai
              ? `A mais votada sai ${estado.sai.dia === "sábado" || estado.sai.dia === "domingo" ? "no" : "na"} ${estado.sai.dia}, ${estado.sai.ddmm}.`
              : "A mais votada sai nos próximos dias."}
          </small>
        </>
      ) : (
        <>
          <span className="vp-ato-k" style={{ fontFamily: t.font }}>Seu hub do leitor</span>
          <p style={{ color: t.heading }}>Ouro, ofensiva e o que você já destravou nesta casa.</p>
          <a
            href={estado.href}
            className="vp-ato-btn"
            style={{ background: t.btnBg, color: t.btnText }}
            onClick={() => sendBeacon(slug, "voto-ato-hub", { eventType: "converteu" })}
          >
            Abrir o hub do leitor
          </a>
        </>
      )}
    </div>
  );
}
