"use client";

import { useEffect, useState, CSSProperties } from "react";
import { captureUtm, getUtm } from "../lib/utm";

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

  // Captura UTMs/click-ids da URL no load (persiste em localStorage)
  useEffect(() => {
    captureUtm();
  }, []);

  async function handleSubscribe(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = new FormData(form).get("email") as string;
    if (!email) return;
    setFormStatus("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, utm: getUtm() }),
      });
      if (!res.ok) throw new Error();
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
    } catch {
      setFormStatus("error");
    }
  }

  return (
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
      />
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
  );
}
