"use client";

import { useEffect, useState, CSSProperties } from "react";
import { captureUtm, getUtm } from "../lib/utm";
import { sendBeacon } from "../PageBeacon";
import { emailError } from "../lib/email";

interface SubscribeFormProps {
  id?: string;
  inputId: string;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  buttonText: string;
  style?: CSSProperties;
}

export default function SubscribeForm({
  id,
  inputId,
  className = "email-form",
  inputClassName,
  buttonClassName,
  buttonText,
  style,
}: SubscribeFormProps) {
  const [formStatus, setFormStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [fieldErr, setFieldErr] = useState<string | null>(null);

  // Captura UTMs/click-ids da URL no load (persiste em localStorage)
  useEffect(() => {
    captureUtm();
  }, []);

  async function handleSubscribe(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = new FormData(form).get("email") as string;
    // espelho da validação do servidor: erro específico antes do fetch
    const msg = emailError(email ?? "");
    if (msg) {
      setFieldErr(msg);
      return;
    }
    setFieldErr(null);
    setFormStatus("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, utm: getUtm() }),
      });
      if (!res.ok) {
        // source=="bh" no corpo = falha veio do Beehiiv -> sufixo bh<status>
        let _sfx = String(res.status);
        try { if ((await res.json())?.source === "bh") _sfx = "bh" + res.status; } catch { /* corpo nao-JSON */ }
        throw new Error(_sfx);
      }
      setFormStatus("success");
      // Meta Pixel: dispara Lead event para atribuicao correta no Ads Manager.
      // Sem isso, o pixel so conta PageView e o Meta subreporta conversoes.
      if (typeof window !== "undefined" && (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq) {
        (window as unknown as { fbq: (...args: unknown[]) => void }).fbq("track", "Lead", { content_name: "notas-do-cafe" });
      }
      // Carry the email into /pesquisa so it isn't re-typed (avoids the
      // mismatch/typo that broke the Beehiiv custom_field sync).
      try {
        localStorage.setItem("vdn_lead_email", email);
      } catch {}
      form.reset();
      setTimeout(() => {
        try { sessionStorage.setItem("vdn_funnel", String(Date.now())); } catch {}
        window.location.href = "/pesquisa";
      }, 1200);
    } catch (err) {
      // vdn-erro-subscribe: falha do submit vira beacon no lp_page_views (incidente MM 14-15/07/26,
      // 33h de /api/subscribe caido sem sinal). Sufixo = status HTTP; 0 = rede/timeout.
      try { const _st = err instanceof Error && /^(bh)?\d+$/.test(err.message) ? err.message : "0"; sendBeacon("notas-do-cafe", "erro-subscribe-" + _st, { dedupe: false }); } catch { /* best-effort */ }
      setFormStatus("error");
    }
  }

  return (
    <>
    <form
      className={className}
      id={id}
      style={style}
      aria-label="Inscrever na newsletter"
      onSubmit={handleSubscribe}
    >
      <label htmlFor={inputId} className="sr-only">
        Seu email
      </label>
      <input
        type="email"
        id={inputId}
        name="email"
        className={inputClassName}
        placeholder="Seu melhor email"
        aria-label="Seu email"
        required
      
        aria-invalid={fieldErr ? true : undefined}
        onChange={() => fieldErr && setFieldErr(null)}/>
      <button
        type="submit"
        className={buttonClassName}
        disabled={formStatus === "sending"}
      >
        {formStatus === "idle" && buttonText}
        {formStatus === "sending" && "Enviando..."}
        {formStatus === "success" && "Inscrito!"}
        {formStatus === "error" && "Erro, tente novamente"}
      </button>
    </form>
    {fieldErr && (
      <p role="alert" style={{ color: "#F87171", fontSize: "13px", textAlign: "center", margin: "8px 0 0" }}>
        {fieldErr}
      </p>
    )}
    </>
  );
}
