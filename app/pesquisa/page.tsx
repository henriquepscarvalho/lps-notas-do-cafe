"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import PageBeacon, { sendBeacon } from "../PageBeacon";

const OPCOES_GENERO = ["👨 Masculino", "👩 Feminino", "🌈 Outro", "🙊 Prefiro não informar"];

const OPCOES_IDADE = ["🧒 < 18", "🧑 18-24", "👨 25-34", "🧔 35-44", "👨‍🦱 45-54", "👴 55+"];

const OPCOES_ORIGEM = [
  { emoji: "📣", label: "Vi um anúncio" },
  { emoji: "📸", label: "Instagram ou Facebook (post)" },
  { emoji: "▶️", label: "YouTube" },
  { emoji: "🔍", label: "Pesquisei no Google" },
  { emoji: "🤝", label: "Indicação de alguém" },
  { emoji: "📩", label: "Newsletter ou email" },
  { emoji: "🌐", label: "Outro (TikTok, LinkedIn, X...)" },
];

const OPCOES_INTERESSE = [
  { emoji: "☕", label: "Métodos de preparo (aeropress, V60, moka, chemex)" },
  { emoji: "🌱", label: "Grãos e origens (cerrado, mogiana, sul de Minas)" },
  { emoji: "🔥", label: "Torrefação artesanal e microtorrefações" },
  { emoji: "👅", label: "Cafés de especialidade e avaliação sensorial" },
  { emoji: "🛠️", label: "Equipamentos e acessórios (moedores, balanças)" },
  { emoji: "📖", label: "História do café brasileiro" },
  { emoji: "🌍", label: "Sustentabilidade na cadeia do café" }
];

const OPCOES_SITUACAO = [
  { emoji: "🏢", label: "Trabalho em empresa (CLT)" },
  { emoji: "🏗️", label: "Tenho negócio próprio" },
  { emoji: "💻", label: "Sou freelancer/autônomo" },
  { emoji: "🎬", label: "Sou criador de conteúdo" },
  { emoji: "📚", label: "Estou estudando/começando" },
  { emoji: "🔄", label: "Entre empregos/transição" },
  { emoji: "🏖️", label: "Aposentado" },
];

const OPCOES_EXPERIENCIA = [
  { emoji: "☕", label: "Bebo café diariamente mas não escolho com critério" },
  { emoji: "🔍", label: "Já experimentei alguns cafés especiais por curiosidade" },
  { emoji: "⚖️", label: "Escolho grãos e métodos com atenção" },
  { emoji: "🏆", label: "Tenho setup completo e compro direto de torrefadores" }
];

const OPCOES_CONSOME = [
  { emoji: "📚", label: "Sim, regularmente (blogs, cursos, comunidades de barista)" },
  { emoji: "📄", label: "Sim, mas de forma esporádica" },
  { emoji: "🔍", label: "Não, mas quero começar" },
  { emoji: "❌", label: "Não tenho interesse além da newsletter" }
];

const OPCOES_INVESTE = [
  { emoji: "💰", label: "Sim, tenho setup completo (moedor, método de gotejamento, etc.)" },
  { emoji: "🪙", label: "Sim, tenho pelo menos um equipamento de qualidade" },
  { emoji: "🤔", label: "Uso o básico mas quero evoluir meu setup" },
  { emoji: "❌", label: "Ainda faço só no cafeteira elétrica comum" }
];

const OPCOES_RECURSO = [
  { emoji: "📋", label: "Guias de preparo passo a passo por método" },
  { emoji: "🎓", label: "Curso de barismo e avaliação sensorial" },
  { emoji: "🧭", label: "Consultoria para montar setup por orçamento" },
  { emoji: "👥", label: "Comunidade de apreciadores de café especial" },
  { emoji: "📚", label: "Biblioteca de reviews de grãos e torrefações" },
  { emoji: "🛒", label: "Curadoria de onde comprar o melhor café" },
  { emoji: "❓", label: "Ainda não sei" }
];

const OPCOES_AREA = [
  { emoji: "🛒", label: "Escolher grãos melhores sem gastar mais" },
  { emoji: "⚗️", label: "Aprender a preparar café como um barista" },
  { emoji: "🌱", label: "Conhecer origens e torrefadores de qualidade" },
  { emoji: "🛠️", label: "Montar um setup caseiro funcional" },
  { emoji: "👥", label: "Compartilhar a experiência com outras pessoas" },
  { emoji: "🌍", label: "Apoiar produtores e torrefadores brasileiros" }
];

const OPCOES_RENDA = [
  "🚫 Sem renda no momento",
  "💵 Até R$ 2.000",
  "💵 R$ 2.000 - R$ 5.000",
  "💴 R$ 5.000 - R$ 10.000",
  "💶 R$ 10.000 - R$ 25.000",
  "🤑 Acima de R$ 25.000",
  "🙊 Prefiro não informar",
];

interface FormData {
  nome: string;
  sobrenome: string;
  email: string;
  celular: string;
  genero: string;
  idade: string;
  origem: string;
  interesse_conteudo: string;
  situacao_profissional: string;
  nivel_experiencia: string;
  consome_cafe: string;
  investe_cafe: string;
  tipo_recurso: string;
  area_principal: string;
  faixa_renda: string;
  maior_desafio: string;
  pergunta_mentoria: string;
}

const INITIAL: FormData = {
  nome: "",
  sobrenome: "",
  email: "",
  celular: "",
  genero: "",
  idade: "",
  origem: "",
  interesse_conteudo: "",
  situacao_profissional: "",
  nivel_experiencia: "",
  consome_cafe: "",
  investe_cafe: "",
  tipo_recurso: "",
  area_principal: "",
  faixa_renda: "",
  maior_desafio: "",
  pergunta_mentoria: "",
};

const REQUIRED_FIELDS: (keyof FormData)[] = [
  "nome",
  "sobrenome",
  "email",
  "celular",
  "genero",
  "idade",
  "origem",
  "interesse_conteudo",
  "situacao_profissional",
  "nivel_experiencia",
  "consome_cafe",
  "investe_cafe",
  "tipo_recurso",
  "area_principal",
  "faixa_renda",
];

/* ─── Dropdown Component ─── */
function Dropdown({
  label,
  questionNumber,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  questionNumber: number;
  value: string;
  onChange: (v: string) => void;
  options: { emoji: string; label: string }[] | string[];
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight: number; placement: "below" | "above" } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const normalizedOptions =
    typeof options[0] === "string"
      ? (options as string[]).map((o) => ({ emoji: "", label: o }))
      : (options as { emoji: string; label: string }[]);

  const updatePos = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const GAP = 4;
    const PAD = 12;
    const spaceBelow = vh - r.bottom - GAP - PAD;
    const spaceAbove = r.top - GAP - PAD;
    const minDesired = 200;
    let placement: "below" | "above" = "below";
    let maxHeight = spaceBelow;
    if (spaceBelow < minDesired && spaceAbove > spaceBelow) {
      placement = "above";
      maxHeight = spaceAbove;
    }
    maxHeight = Math.max(140, Math.min(maxHeight, 360));
    if (placement === "below") {
      setPos({ top: r.bottom + GAP, left: r.left, width: r.width, maxHeight, placement });
    } else {
      // Ancora pelo BOTTOM: o menu cresce pra cima colado no gatilho, em vez de
      // ficar "pinado" no topo do espaço (longe de onde a pessoa tocou = mis-tap).
      setPos({ bottom: vh - r.top + GAP, left: r.left, width: r.width, maxHeight, placement });
    }
  };

  useEffect(() => {
    if (!open) return;
    updatePos();
    // Trava o scroll do body enquanto o menu está aberto: sem isso o menu
    // position:fixed "pula" a cada scroll no mobile e o toque erra a opção
    // (vira dead click). Travado, o menu fica parado e o alvo é estável.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onResize = () => updatePos();
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  // Close on outside click — portal'd menu lives in body, so check menu ref too
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest(".dropdown-portal-menu")) return;
      if (wrapperRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  return (
    <div className="survey-field">
      <label className="survey-label" onClick={() => setOpen(true)} style={{ cursor: "pointer" }}>
        <span className="survey-number">{questionNumber}.</span>
        {label}
        {required && <span className="survey-required">*</span>}
      </label>
      <div className="dropdown-wrapper" data-open={open} ref={wrapperRef}>
        <button
          ref={triggerRef}
          type="button"
          className="dropdown-trigger"
          onClick={() => setOpen(!open)}
          data-selected={!!value}
        >
          <span>{value || "Selecione uma opção"}</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {open && pos && typeof document !== "undefined" && createPortal(
          <>
          {/* Backdrop: captura o toque de "fechar clicando fora" num handler real.
              Sem ele o toque cai no body sem resposta = dead click no Clarity. */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 9998, background: "transparent" }}
          />
          <div
            className="dropdown-menu dropdown-portal-menu"
            style={{
              position: "fixed",
              ...(pos.placement === "above" ? { top: "auto", bottom: pos.bottom } : { top: pos.top, bottom: "auto" }),
              left: pos.left,
              width: pos.width,
              maxHeight: pos.maxHeight,
              overflowY: "auto",
              zIndex: 100000,
            }}
          >
            {normalizedOptions.map((opt) => (
              <button
                type="button"
                key={opt.label}
                className="dropdown-option"
                data-active={value === (opt.emoji ? `${opt.emoji} ${opt.label}` : opt.label)}
                onClick={() => {
                  onChange(opt.emoji ? `${opt.emoji} ${opt.label}` : opt.label);
                  setOpen(false);
                }}
              >
                {opt.emoji && <span className="dropdown-emoji">{opt.emoji}</span>}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
          </>,
          document.body
        )}
      </div>
    </div>
  );
}

/* ─── Field Icons (inline, no deps) ─── */
const FIELD_ICONS: Record<string, React.ReactNode> = {
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  phone: <path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
};

function FieldIcon({ name }: { name: string }) {
  return (
    <svg className="survey-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {FIELD_ICONS[name]}
    </svg>
  );
}

/* ─── Text Input Component ─── */
function TextInput({
  label,
  questionNumber,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
  readOnly,
  icon,
}: {
  label: string;
  questionNumber: number;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
  icon?: string;
}) {
  return (
    <div className="survey-field">
      <label className="survey-label">
        <span className="survey-number">{questionNumber}.</span>
        {label}
        {required && <span className="survey-required">*</span>}
      </label>
      <div className={`survey-input-wrap${icon ? " has-icon" : ""}`}>
        {icon && <FieldIcon name={icon} />}
        <input
          type={type}
          className="survey-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={type === "tel" ? "tel" : type === "email" ? "email" : "text"}
          autoComplete={type === "email" ? "email" : type === "tel" ? "tel" : "on"}
          autoCapitalize={type === "email" ? "off" : "sentences"}
          autoCorrect={type === "email" ? "off" : "on"}
          spellCheck={type !== "email"}
          readOnly={readOnly}
          style={readOnly ? { opacity: 0.7, cursor: "not-allowed" } : undefined}
        />
      </div>
    </div>
  );
}

/* ─── Textarea Component ─── */
function TextArea({
  label,
  questionNumber,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  questionNumber: number;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="survey-field">
      <label className="survey-label">
        <span className="survey-number">{questionNumber}.</span>
        {label}
        {required && <span className="survey-required">*</span>}
      </label>
      <textarea
        className="survey-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
      />
    </div>
  );
}

/* ─── Progress Bar ─── */

/* ─── Main Page ─── */
export default function Pesquisa() {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [emailLocked, setEmailLocked] = useState(false);

  const set = (field: keyof FormData) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Carry the email captured at /cadastro so the respondent never re-types it
  // (re-typing caused mismatches/typos that broke the Beehiiv custom_field
  // sync). Lock the field when we have it; leave it editable for anyone who
  // reached /pesquisa directly.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vdn_lead_email");
      if (saved && saved.includes("@")) {
        setForm((prev) => ({ ...prev, email: saved }));
        setEmailLocked(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const REVEAL_SEL = ".reveal, .survey-reveal";
    const targets = Array.from(document.querySelectorAll(REVEAL_SEL));
    if (targets.length === 0) return;
    let remaining = targets.length;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          if (el.classList.contains("visible")) {
            observer.unobserve(el);
            return;
          }
          const parent = el.parentElement;
          if (parent) {
            const siblings = Array.from(parent.querySelectorAll(REVEAL_SEL));
            const idx = siblings.indexOf(el);
            el.style.transitionDelay = `${Math.min(idx * 0.08, 0.4)}s`;
          }
          el.classList.add("visible");
          observer.unobserve(el);
          remaining -= 1;
          if (remaining <= 0) observer.disconnect();
        });
      },
      { threshold: 0.01, rootMargin: "0px 0px 0px 0px" }
    );
    targets.forEach((el) => observer.observe(el));
    // Safety net: force-reveal everything after 3s in case observer stalls (low-mem mobile)
    const timer = setTimeout(() => {
      targets.forEach((el) => (el as HTMLElement).classList.add("visible"));
      observer.disconnect();
    }, 3000);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  // Wizard: 4 steps, one section per screen
  const [step, setStep] = useState(1);

  const SECTION_FIELDS: (keyof FormData)[][] = [
    REQUIRED_FIELDS.slice(0, 6),                   // 1 · O Apreciador (6)
    REQUIRED_FIELDS.slice(6, 10),                  // 2 · O Primeiro Gole (4)
    REQUIRED_FIELDS.slice(10),                     // 3 · A Xícara (5)
    ["maior_desafio", "pergunta_mentoria"],        // 4 · A Última Nota (2, opcionais)
  ];
  const SECTION_REQUIRED = [true, true, true, false];
  const stepDone = (n: number) =>
    !SECTION_REQUIRED[n - 1] || SECTION_FIELDS[n - 1].every((f) => form[f].trim() !== "");

  // Goal gradient per section: "N de M respondidas" for the current step only
  const stepTotal = SECTION_FIELDS[step - 1].length;
  const answeredInStep = SECTION_FIELDS[step - 1].filter((f) => form[f].trim() !== "").length;

  // Personalization: greet by first name from step 2 on
  const firstName = form.nome.trim().split(" ")[0];

  // The reveal animation starts every .survey-reveal at opacity 0 and only the
  // IntersectionObserver flips it to .visible. A step mounted after that
  // observer disconnected would stay invisible. Activating on step change
  // keeps each screen visible without the observer.
  useEffect(() => {
    document.querySelectorAll(".reveal, .survey-reveal").forEach((el) => el.classList.add("visible"));
    window.scrollTo(0, 0);
  }, [step]);

  // Steps whose partial save the server confirmed — gates the "✓ salvo" chip
  // so it only shows where a write actually happened.
  const [savedSteps, setSavedSteps] = useState<number[]>([]);

  // Partial capture: every step transition attaches the answers of the step
  // just completed to the Beehiiv lead, so an abandoned survey still keeps
  // them. Fire-and-forget; never blocks navigation, once per step per session.
  function sendPartial(closedStep: number) {
    try {
      const key = `vdn_pesquisa_parcial_${closedStep}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
      const payload: Record<string, string> = { email: form.email };
      for (const f of SECTION_FIELDS[closedStep - 1]) payload[f] = form[f];
      fetch("/api/pesquisa-parcial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      })
        .then((r) => r.json())
        .then((j) => { if (j?.saved) setSavedSteps((s) => (s.includes(closedStep) ? s : [...s, closedStep])); })
        .catch(() => {});
    } catch {}
  }

  function goNext() {
    if (!stepDone(step)) {
      setErrorMsg("Preencha todos os campos obrigatórios (*).");
      return;
    }
    sendPartial(step);
    setErrorMsg("");
    setStep((s) => Math.min(s + 1, 4));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    // Enter on an earlier step advances instead of submitting a half-filled form
    if (step < 4) {
      goNext();
      return;
    }

    // Validate required
    for (const field of REQUIRED_FIELDS) {
      if (!form[field].trim()) {
        setErrorMsg("Preencha todos os campos obrigatórios (*).");
        return;
      }
    }

    // Validate email
    if (!form.email.includes("@") || !form.email.includes(".")) {
      setErrorMsg("Email inválido.");
      return;
    }

    setStatus("sending");

    try {
      const res = await fetch("/api/pesquisa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao enviar.");
      }

      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao enviar.");
      setStatus("error");
    }
  }

  useEffect(() => {
    if (status === "success") { try { sessionStorage.setItem("vdn_pesquisa", "filled"); } catch {} sendBeacon("notas-do-cafe", "pesquisa", { eventType: "converteu" }); window.location.href = "/cadastro-confirmado"; }
  }, [status]);
  if (status === "success") return null;

  return (
    <>
      <PageBeacon slug="notas-do-cafe" step="pesquisa" />
      <main className="survey-page">
        {/* Header */}
        <header className="survey-header">
          <a href="/" className="survey-logo">
            <Image
              src="/images/logo/simbolo.png"
              alt="Notas do Café"
              width={40}
              height={40}
            />
          </a>
          <div className="survey-stepper" aria-label={`Etapa ${step} de 4`}>
            {["Apreciador", "Gole", "Xícara", "Nota"].map((label, i) => {
              const n = i + 1;
              const state = n < step ? "done" : n === step ? "active" : "todo";
              return (
                <button
                  key={label}
                  type="button"
                  className={`survey-step ${state}`}
                  onClick={() => { if (n < step) { setErrorMsg(""); setStep(n); } }}
                  disabled={n > step}
                  aria-label={`Etapa ${n}: ${label}`}
                >
                  <span className="survey-step-dot">{n < step ? "✓" : n}</span>
                  <span className="survey-step-label">{label}</span>
                </button>
              );
            })}
          </div>
          <h1 className="survey-title">
            {step === 1 && "Quero te conhecer."}
            {step === 2 && (firstName ? `Prazer, ${firstName}.` : "Prazer.")}
            {step === 3 && (firstName ? `Quase lá, ${firstName}.` : "Quase lá.")}
            {step === 4 && (firstName ? `Por último, ${firstName}.` : "Por último.")}
          </h1>
          <p className="survey-subtitle">
            {step === 1 && "Suas respostas moldam o que você recebe. 4 etapas, uns 4 minutos, progresso salvo."}
            {step === 2 && "Agora quero entender como você chegou até aqui e o que te move."}
            {step === 3 && "Cinco perguntas rápidas sobre sua relação com o café."}
            {step === 4 && "Duas perguntas opcionais, as mais valiosas de todas."}
          </p>
        </header>

        {/* Progress */}
        <div className="progress-wrapper">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(answeredInStep / stepTotal) * 100}%` }} />
          </div>
          <span className="progress-label">
            {answeredInStep} de {stepTotal} respondidas
          </span>
        </div>

        {/* Recap: reinforce the section just finished. Echoing every answer so
            far walls off the questions by step 4; email/phone/surname read as
            noise rather than progress. */}
        {step > 1 && (
          <div className="survey-recap">
            {SECTION_FIELDS[step - 2]
              .filter((f) => f !== "email" && f !== "celular" && f !== "sobrenome")
              .map((f) => (
                <span key={f} className="survey-recap-item">✓ {form[f]}</span>
              ))}
            {savedSteps.includes(step - 1) && (
              <span className="survey-recap-item survey-recap-saved">✓ salvo</span>
            )}
          </div>
        )}

        {/* Form */}
        <form className="survey-form" onSubmit={handleSubmit} noValidate>
          {step === 1 && (<div>
          {/* ─── O Apreciador ─── */}
          <section className="survey-section survey-reveal">
            <h2 className="survey-section-title">Seção 1 · O Apreciador</h2>
            <div className="survey-section-line" />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 0.9rem" }}>
<TextInput
              questionNumber={1}
              label="Qual é o seu primeiro nome?"
              value={form.nome}
              onChange={set("nome")}
              required
              placeholder="Seu primeiro nome"
              icon="user"
            />
<TextInput
              questionNumber={2}
              label="Qual é o seu sobrenome?"
              value={form.sobrenome}
              onChange={set("sobrenome")}
              required
              placeholder="Seu sobrenome"
              icon="user"
            />
</div>

            <TextInput
              questionNumber={3}
              label="Qual é o seu melhor email?"
              value={form.email}
              onChange={set("email")}
              required
              type="email"
              placeholder="seu@email.com"
              readOnly={emailLocked}
              icon="mail"
            />

            <TextInput
              questionNumber={4}
              label="Qual é o seu número de WhatsApp?"
              value={form.celular}
              onChange={set("celular")}
              required
              type="tel"
              placeholder="11987654321"
              icon="phone"
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 0.9rem" }}>
<Dropdown
              questionNumber={5}
              label="Com qual gênero você se identifica?"
              value={form.genero}
              onChange={set("genero")}
              options={OPCOES_GENERO}
              required
            />
<Dropdown
              questionNumber={6}
              label="Em qual faixa de idade você se encontra?"
              value={form.idade}
              onChange={set("idade")}
              options={OPCOES_IDADE}
              required
            />
</div>
          </section>
          </div>)}

          {step === 2 && (<div>
          {/* ─── O Primeiro Gole ─── */}
          <section className="survey-section survey-reveal">
            <h2 className="survey-section-title">Seção 2 · O Primeiro Gole</h2>
            <div className="survey-section-line" />

            <Dropdown
              questionNumber={7}
              label="Por onde você conheceu as Notas do Café?"
              value={form.origem}
              onChange={set("origem")}
              options={OPCOES_ORIGEM}
              required
            />

            <Dropdown
              questionNumber={8}
              label="Que tipo de conteúdo sobre café mais te interessa?"
              value={form.interesse_conteudo}
              onChange={set("interesse_conteudo")}
              options={OPCOES_INTERESSE}
              required
            />

            <Dropdown
              questionNumber={9}
              label="Qual opção descreve melhor sua situação profissional?"
              value={form.situacao_profissional}
              onChange={set("situacao_profissional")}
              options={OPCOES_SITUACAO}
              required
            />

            <Dropdown
              questionNumber={10}
              label="Com qual destas frases você mais se identifica?"
              value={form.nivel_experiencia}
              onChange={set("nivel_experiencia")}
              options={OPCOES_EXPERIENCIA}
              required
            />
          </section>
          </div>)}

          {step === 3 && (<div>
          {/* ─── A Xícara ─── */}
          <section className="survey-section survey-reveal">
            <h2 className="survey-section-title">Seção 3 · A Xícara</h2>
            <div className="survey-section-line" />

            <Dropdown
              questionNumber={11}
              label="Você já busca informação sobre café além da newsletter?"
              value={form.consome_cafe}
              onChange={set("consome_cafe")}
              options={OPCOES_CONSOME}
              required
            />

            <Dropdown
              questionNumber={12}
              label="Você já investiu em equipamento específico para preparar café em casa?"
              value={form.investe_cafe}
              onChange={set("investe_cafe")}
              options={OPCOES_INVESTE}
              required
            />

            <Dropdown
              questionNumber={13}
              label="Que tipo de recurso te ajudaria mais?"
              value={form.tipo_recurso}
              onChange={set("tipo_recurso")}
              options={OPCOES_RECURSO}
              required
            />

            <Dropdown
              questionNumber={14}
              label="O que a newsletter pode transformar no seu ritual de café?"
              value={form.area_principal}
              onChange={set("area_principal")}
              options={OPCOES_AREA}
              required
            />

            <p className="survey-trust">só pra calibrar o conteúdo, nunca publicado</p>
            <Dropdown
              questionNumber={15}
              label="Qual faixa melhor representa sua renda ou faturamento mensal?"
              value={form.faixa_renda}
              onChange={set("faixa_renda")}
              options={OPCOES_RENDA}
              required
            />
          </section>
          </div>)}

          {step === 4 && (<div>
          {/* ─── A Última Nota ─── */}
          <section className="survey-section survey-reveal">
            <h2 className="survey-section-title">Seção 4 · A Última Nota</h2>
            <div className="survey-section-line" />
            <p className="survey-section-desc">
              Essas duas perguntas são opcionais, mas são as mais valiosas.
              <br />
              Quanto mais detalhado, melhor o conteúdo que vou criar para você.
            </p>

            <TextArea
              questionNumber={16}
              label="Qual é o maior problema com o café que você bebe hoje? (opcional)"
              value={form.maior_desafio}
              onChange={set("maior_desafio")}
              placeholder="Ex: Compro café de supermercado porque não sei onde encontrar coisa boa na minha cidade e tenho medo de gastar R$ 60 num grão ruim..."
            />

            <TextArea
              questionNumber={17}
              label="Descreva o seu ritual de café ideal. (opcional)"
              value={form.pergunta_mentoria}
              onChange={set("pergunta_mentoria")}
              placeholder="Horário, método, grão, onde você está, o que está fazendo ao mesmo tempo..."
            />
          </section>

          </div>)}

          {/* ─── Error ─── */}
          {errorMsg && (
            <div className="survey-error">
              {errorMsg}
            </div>
          )}

          {/* ─── Nav ─── */}
          <div className="survey-submit-wrapper">
            {step < 4 ? (
              <button type="button" className="survey-submit" onClick={goNext}>
                Continuar →
              </button>
            ) : (
              <>
                <button
                  type="submit"
                  className="survey-submit"
                  disabled={status === "sending"}
                >
                  {status === "sending" ? "Enviando..." : "Enviar e concluir →"}
                </button>
                <p style={{ textAlign: "center", marginTop: 10, fontSize: "0.8rem", color: "var(--s-text-3)" }}>
                  você volta pro último passo da sua jornada
                </p>
                <p style={{ textAlign: "center", marginTop: 6, fontSize: "0.8rem", color: "var(--s-text-3)" }}>
                  Respostas privadas: moldam só o conteúdo que você recebe.
                </p>
              </>
            )}
            {step > 1 && (
              <button type="button" className="survey-back" onClick={() => { setErrorMsg(""); setStep((s) => s - 1); }}>
                ← Voltar
              </button>
            )}
            <a href="/cadastro-confirmado" onClick={() => { try { sessionStorage.setItem("vdn_pesquisa", "skip"); } catch {} sendBeacon("notas-do-cafe", "pesquisa_skip", { eventType: "converteu" }); }} style={{ display: "block", textAlign: "center", marginTop: 14, fontSize: "0.875rem", color: "var(--s-text-3)", textDecoration: "underline", textUnderlineOffset: 3 }}>
              Preencher depois
            </a>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="survey-footer">
        <p>Notas do Café — Bom café. Até sábado.</p>
      </footer>
    </>
  );
}
