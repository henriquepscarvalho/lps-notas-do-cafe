"use client";

import { useEffect, useRef, useState } from "react";
import { sendBeacon } from "./PageBeacon";

/* Quiz do comprador (obg/12, mapa obrigado-do-comprador): a missão 3 da página de obrigado em N toques,
   uma pergunta por tela, na mesma caixa. O 1º toque é o motivo (a pergunta de 1 clique do obg/01); os
   outros dizem pra que o comprador usa, o próximo desafio e o formato em que aprende melhor. É dessa
   leitura que nasce o próximo produto da casa.

   Cada toque vai pro Pharos (POST /api/ebook/motivo) levando TUDO o que já foi marcado, numa linha só por
   compra (upsert por session_id). Falha de rede não trava o quiz: o toque seguinte leva o que faltou, e o
   fim tenta mais uma vez. O «Outro» grava o toque na hora e abre o campo de uma frase.

   O visual das respostas é o da página (.mot-op, .mot-outro, .mot-enviar, .sec, .mis-k, .sec-t, .sec-sub);
   aqui moram só as classes novas (.qz-*). */

export type QuizOpcao = { k: string; t: string };
export type QuizPergunta = { k: "motivo" | "uso" | "desafio" | "formato"; q: string; opcoes: QuizOpcao[] };

type Props = {
  sessionId: string;
  sc: string;
  slug: string;
  versao: string;
  perguntas: QuizPergunta[];
  /** Rótulo da missão: «Missão n de de». */
  n: number;
  de: number;
  pharos: string;
};

const TXT = {
  campo: "Conta em uma frase",
  enviar: "Enviar",
  voltar: "Voltar um toque",
  seguir: "Seguir sem escrever",
  fimTitulo: "Suas respostas",
  fimSub: "Obrigado por contar.",
  fim: "Anotado. O próximo guia da casa nasce das suas respostas.",
};

/* A mesma regra do PageBeacon (?internal=1 grava, ?internal=0 apaga), inline: nem toda casa exporta. */
const interno = () => {
  try {
    const p = new URLSearchParams(window.location.search).get("internal");
    if (p === "1") localStorage.setItem("vdn_internal", "1");
    if (p === "0") localStorage.removeItem("vdn_internal");
    return localStorage.getItem("vdn_internal") === "1";
  } catch {
    return false;
  }
};

export default function QuizComprador({ sessionId, sc, slug, versao, perguntas, n, de, pharos }: Props) {
  const [i, setI] = useState(0);
  const [resp, setResp] = useState<Record<string, string>>({});
  const [frase, setFrase] = useState<Record<string, string>>({});
  const [rascunho, setRascunho] = useState("");
  const [travado, setTravado] = useState(false);
  // O que a página já conseguiu gravar; `falta` liga quando um POST falhou e o seguinte precisa levar tudo.
  const gravou = useRef(false);
  const falta = useRef(false);
  const vivo = useRef(true);

  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);

  const total = perguntas.length;
  const fim = i >= total;
  const atual = fim ? null : perguntas[i];

  async function gravar(r: Record<string, string>, f: Record<string, string>): Promise<boolean> {
    if (!sessionId || !r.motivo) return false;
    try {
      const q = new URLSearchParams(window.location.search);
      const prova = (q.get("prova") || "").trim();
      let journey: string | null = null;
      let src: string | null = null;
      try {
        journey = sessionStorage.getItem("vdn_journey");
        src = sessionStorage.getItem("vdn_source");
      } catch {
        /* storage bloqueado: vai sem jornada */
      }
      const texto = (p: QuizPergunta) =>
        r[p.k] === "outro" ? f[p.k] || null : p.opcoes.find((o) => o.k === r[p.k])?.t ?? null;
      const corpo: Record<string, unknown> = {
        session_id: sessionId,
        sc,
        slug,
        versao,
        journey_id: journey,
        src,
        internal: interno(),
        fonte: /^[a-z0-9-]{1,30}$/.test(prova) ? `prova-${prova}` : undefined,
      };
      for (const p of perguntas) {
        if (!r[p.k]) continue;
        if (p.k === "motivo") {
          corpo.resposta = r[p.k];
          corpo.texto = texto(p);
        } else {
          corpo[p.k] = r[p.k];
          corpo[`${p.k}_texto`] = texto(p);
        }
      }
      const res = await fetch(`${pharos}/api/ebook/motivo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      if (!res.ok) throw new Error(String(res.status));
      if (!gravou.current) sendBeacon(slug, "obrigado-motivo", { eventType: "converteu" });
      gravou.current = true;
      falta.current = false;
      return true;
    } catch {
      falta.current = true;
      return false;
    }
  }

  function ir(para: number, r = resp, f = frase) {
    const alvo = Math.max(0, Math.min(total, para));
    setI(alvo);
    setRascunho(alvo < total ? f[perguntas[alvo].k] || "" : "");
    // No fim, o que ficou pra trás por falha de rede ganha mais uma tentativa.
    if (alvo >= total && falta.current) void gravar(r, f);
  }

  function tocar(p: QuizPergunta, o: QuizOpcao) {
    if (travado) return;
    const r = { ...resp, [p.k]: o.k };
    const f = { ...frase };
    if (o.k !== "outro") delete f[p.k];
    setResp(r);
    setFrase(f);
    void gravar(r, f);
    if (o.k === "outro") {
      setRascunho(f[p.k] || "");
      return;
    }
    // O escolhido acende antes de a pergunta trocar, pra o toque ter resposta na tela.
    setTravado(true);
    window.setTimeout(() => {
      if (!vivo.current) return;
      setTravado(false);
      ir(i + 1, r, f);
    }, 420);
  }

  function enviarFrase(p: QuizPergunta) {
    const t = rascunho.trim();
    if (!t || travado) return;
    const f = { ...frase, [p.k]: t };
    setFrase(f);
    void gravar(resp, f);
    ir(i + 1, resp, f);
  }

  const textoDe = (p: QuizPergunta) =>
    resp[p.k] === "outro" ? frase[p.k] || p.opcoes.find((o) => o.k === "outro")?.t || "" : p.opcoes.find((o) => o.k === resp[p.k])?.t || "";

  return (
    <section className="sec" data-legivel="1" aria-label={`Missão ${n}: ${total} toques sobre o que você levou`}>{/* LEGIVEL (col/32) */}
      <p className="mis-k">
        Missão {n} de {de}
        {fim && <span className="mis-ok"> · cumprida ✓</span>}
      </p>
      <h2 className="sec-t" aria-live="polite">{atual ? atual.q : TXT.fimTitulo}</h2>
      <p className="sec-sub">{atual ? `${total} toques. Cada um fica anotado na hora.` : TXT.fimSub}</p>

      {atual ? (
        <div className="qz-tela" key={atual.k}>
          <div className="qz-top">
            <span className="qz-n">
              Toque {i + 1} de {total}
            </span>
            <span className="qz-bar" aria-hidden="true">
              {perguntas.map((p, j) => (
                <i key={p.k} className={j < i ? "ok" : j === i ? "at" : ""} />
              ))}
            </span>
          </div>
          <div className="mot-ops" role="group" aria-label={atual.q}>
            {atual.opcoes.map((o) => (
              <button
                key={o.k}
                type="button"
                className={"mot-op" + (resp[atual.k] === o.k ? " on" : "")}
                aria-pressed={resp[atual.k] === o.k}
                disabled={travado}
                onClick={() => tocar(atual, o)}
              >
                <span className="mot-dot" aria-hidden="true" />
                {o.t}
              </button>
            ))}
            {resp[atual.k] === "outro" && (
              <div className="mot-outro">
                <textarea
                  aria-label={TXT.campo}
                  placeholder={TXT.campo}
                  maxLength={300}
                  rows={3}
                  value={rascunho}
                  onChange={(e) => setRascunho(e.target.value)}
                />
                <button type="button" className="mot-enviar" disabled={!rascunho.trim()} onClick={() => enviarFrase(atual)}>
                  {TXT.enviar}
                </button>
              </div>
            )}
          </div>
          <div className="qz-links">
            {i > 0 && (
              <button type="button" className="qz-link" onClick={() => ir(i - 1)}>
                {TXT.voltar}
              </button>
            )}
            {resp[atual.k] === "outro" && (
              <button type="button" className="qz-link" onClick={() => ir(i + 1)}>
                {TXT.seguir}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="qz-tela" key="fim">
          <div className="qz-fim">
            <p>{TXT.fim}</p>
            <ul className="qz-res">
              {perguntas.map((p) => (
                <li key={p.k}>
                  <b>{p.q}</b>
                  {textoDe(p)}
                </li>
              ))}
            </ul>
          </div>
          <div className="qz-links">
            <button type="button" className="qz-link" onClick={() => ir(total - 1)}>
              {TXT.voltar}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .qz-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px}
        .qz-n{font-family:var(--mono,ui-monospace,monospace);font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--text)}
        .qz-bar{display:flex;gap:5px;flex:0 0 112px}
        .qz-bar i{flex:1;height:6px;border-radius:3px;background:var(--hair,rgba(128,128,128,.28))}
        .qz-bar i.ok{background:var(--bright)}
        .qz-bar i.at{background:color-mix(in srgb,var(--bright) 45%,transparent)}
        .qz-links{display:flex;flex-wrap:wrap;gap:4px 24px;margin:12px 0 0;min-height:0}
        .qz-link{display:inline-block;margin:0;padding:12px 0;border:0;background:transparent;color:var(--text);font-family:var(--sans,inherit);font-size:15px;text-decoration:underline;text-underline-offset:4px;cursor:pointer}
        .qz-link:hover{color:var(--bright)}
        .qz-tela{animation:qz-in .22s ease both}
        @keyframes qz-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion:reduce){.qz-tela{animation:none}}
        .qz-fim{padding:18px;border:1px solid color-mix(in srgb,var(--bright) 30%,transparent);border-radius:12px;background:color-mix(in srgb,var(--bright) 8%,transparent)}
        .qz-fim p{margin:0;font-size:16px;line-height:1.5;color:#fff}
        .qz-res{list-style:none;margin:14px 0 0;padding:0;display:grid;gap:12px}
        .qz-res li{font-size:15px;line-height:1.45;color:var(--text)}
        .qz-res b{display:block;font-family:var(--mono,ui-monospace,monospace);font-size:13px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--text);line-height:1.35;text-wrap:balance;margin-bottom:2px}
      `}</style>
    </section>
  );
}
