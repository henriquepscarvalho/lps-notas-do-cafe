"use client";

import { useState, CSSProperties } from "react";

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
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setFormStatus("success");
      // Meta Pixel: dispara Lead event para atribuicao correta no Ads Manager.
      // Sem isso, o pixel so conta PageView e o Meta subreporta conversoes.
      if (typeof window !== "undefined" && (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq) {
        (window as unknown as { fbq: (...args: unknown[]) => void }).fbq("track", "Lead", { content_name: "notas-do-cafe" });
      }
      form.reset();
      setTimeout(() => {
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
        {formStatus === "error" && "Erro \u2014 tente novamente"}
      </button>
    </form>
  );
}
