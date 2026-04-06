"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const OPCOES_GENERO = ["Masculino", "Feminino", "Outro", "Prefiro não informar"];

const OPCOES_IDADE = ["< 18", "18-24", "25-34", "35-44", "45-54", "55+"];

const OPCOES_ORIGEM = [
  { emoji: "📩", label: "Newsletter" },
  { emoji: "🤝", label: "Indicação" },
  { emoji: "📸", label: "Instagram" },
  { emoji: "🎥", label: "YouTube" },
  { emoji: "💼", label: "LinkedIn" },
  { emoji: "✖️", label: "X" },
  { emoji: "🎵", label: "TikTok" },
  { emoji: "📝", label: "Blog" },
  { emoji: "🎤", label: "Palestra" },
  { emoji: "🎙️", label: "Podcast" },
];

const OPCOES_INTERESSE = [
  { emoji: "☕", label: "Métodos de preparo (aeropress, V60, moka, chemex)" },
  { emoji: "🌱", label: "Grãos e origens (cerrado, mogiana, sul de Minas)" },
  { emoji: "🔥", label: "Torrefação artesanal e microtorrefações" },
  { emoji: "👅", label: "Cafés de especialidade e avaliação sensorial" },
  { emoji: "🛠️", label: "Equipamentos e acessórios (moedores, balanças)" },
  { emoji: "📖", label: "História do café brasileiro" },
  { emoji: "🌍", label: "Sustentabilidade na cadeia do café" },
  { emoji: "🏪", label: "Curadoria de produtos e onde comprar" },
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
  { emoji: "🏆", label: "Tenho setup completo e compro direto de torrefadores" },
];

const OPCOES_CONSOME = [
  { emoji: "📚", label: "Sim, regularmente (blogs, cursos, comunidades de barista)" },
  { emoji: "📄", label: "Sim, mas de forma esporádica" },
  { emoji: "🔍", label: "Não, mas quero começar" },
  { emoji: "❌", label: "Não tenho interesse além da newsletter" },
];

const OPCOES_INVESTE = [
  { emoji: "💰", label: "Sim, tenho setup completo (moedor, método de gotejamento, etc.)" },
  { emoji: "🪙", label: "Sim, tenho pelo menos um equipamento de qualidade" },
  { emoji: "🤔", label: "Uso o básico mas quero evoluir meu setup" },
  { emoji: "❌", label: "Ainda faço só no cafeteira elétrica comum" },
];

const OPCOES_RECURSO = [
  { emoji: "📋", label: "Guias de preparo passo a passo por método" },
  { emoji: "🎓", label: "Curso de barismo e avaliação sensorial" },
  { emoji: "🧭", label: "Consultoria para montar setup por orçamento" },
  { emoji: "👥", label: "Comunidade de apreciadores de café especial" },
  { emoji: "📚", label: "Biblioteca de reviews de grãos e torrefações" },
  { emoji: "🛒", label: "Curadoria de onde comprar o melhor café" },
  { emoji: "❓", label: "Ainda não sei" },
];

const OPCOES_AREA = [
  { emoji: "🛒", label: "Escolher grãos melhores sem gastar mais" },
  { emoji: "⚗️", label: "Aprender a preparar café como um barista" },
  { emoji: "🌱", label: "Conhecer origens e torrefadores de qualidade" },
  { emoji: "🛠️", label: "Montar um setup caseiro funcional" },
  { emoji: "👥", label: "Compartilhar a experiência com outras pessoas" },
  { emoji: "🌍", label: "Apoiar produtores e torrefadores brasileiros" },
];

const OPCOES_RENDA = [
  "Sem renda no momento",
  "Até R$ 2.000",
  "R$ 2.000 - R$ 5.000",
  "R$ 5.000 - R$ 10.000",
  "R$ 10.000 - R$ 25.000",
  "R$ 25.000 - R$ 50.000",
  "Acima de R$ 50.000",
  "Prefiro não informar",
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

  const normalizedOptions =
    typeof options[0] === "string"
      ? (options as string[]).map((o) => ({ emoji: "", label: o }))
      : (options as { emoji: string; label: string }[]);

  return (
    <div className="survey-field">
      <label className="survey-label">
        <span className="survey-number">{questionNumber}.</span>
        {label}
        {required && <span className="survey-required">*</span>}
      </label>
      <div className="dropdown-wrapper" data-open={open}>
        <button
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
        {open && (
          <div className="dropdown-menu">
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
        )}
      </div>
    </div>
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
}: {
  label: string;
  questionNumber: number;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="survey-field">
      <label className="survey-label">
        <span className="survey-number">{questionNumber}.</span>
        {label}
        {required && <span className="survey-required">*</span>}
      </label>
      <input
        type={type}
        className="survey-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
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
function ProgressBar({ filled, total }: { filled: number; total: number }) {
  const pct = Math.round((filled / total) * 100);
  return (
    <div className="progress-wrapper">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-label">{pct}% completo</span>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Pesquisa() {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const set = (field: keyof FormData) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const filledCount = Object.entries(form).filter(
    ([, v]) => v.trim() !== ""
  ).length;

  const totalFields = Object.keys(form).length;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const parent = entry.target.parentElement;
            if (parent) {
              const siblings = Array.from(parent.querySelectorAll(".survey-reveal"));
              const index = siblings.indexOf(entry.target);
              (entry.target as HTMLElement).style.transitionDelay = `${index * 0.08}s`;
            }
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -20px 0px" }
    );
    document.querySelectorAll(".survey-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".dropdown-wrapper")) {
        document.querySelectorAll(".dropdown-wrapper[data-open='true']").forEach((el) => {
          const btn = el.querySelector(".dropdown-trigger") as HTMLButtonElement;
          if (btn) btn.click();
        });
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Progressive reveal
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const section4Ref = useRef<HTMLDivElement>(null);

  const section1Done = REQUIRED_FIELDS.slice(0, 6).every(f => form[f].trim() !== "");
  const section2Done = REQUIRED_FIELDS.slice(6, 10).every(f => form[f].trim() !== "");
  const section3Done = REQUIRED_FIELDS.slice(10).every(f => form[f].trim() !== "");

  const [revealed, setRevealed] = useState(1);

  useEffect(() => {
    if (section1Done && revealed === 1) setRevealed(2);
  }, [section1Done, revealed]);

  useEffect(() => {
    if (section2Done && revealed === 2) setRevealed(3);
  }, [section2Done, revealed]);

  useEffect(() => {
    if (section3Done && revealed === 3) setRevealed(4);
  }, [section3Done, revealed]);

  useEffect(() => {
    const refs = [null, null, section2Ref, section3Ref, section4Ref];
    const ref = refs[revealed];
    if (ref?.current) {
      setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, [revealed]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

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

  if (status === "success") {
    window.location.href = "/cadastro";
    return null;
  }

  return (
    <>
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
          <div className="survey-header-line" />
          <p className="survey-kicker survey-reveal">PESQUISA DE BOAS-VINDAS</p>
          <h1 className="survey-title survey-reveal">
            Quero te conhecer.
          </h1>
          <p className="survey-subtitle survey-reveal">
            Responda as perguntas abaixo. Leva 3 minutos.
            <br />
            Suas respostas moldam o conteúdo que você recebe.
          </p>
        </header>

        {/* Skip */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <a
            href="/cadastro-confirmado"
            style={{
              color: "var(--text-3, #8A7060)",
              fontSize: "0.85rem",
              textDecoration: "none",
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.08)",
              opacity: 0.7,
            }}
          >
            Preencher depois
          </a>
        </div>

        {/* Progress */}
        <ProgressBar filled={filledCount} total={totalFields} />

        {/* Form */}
        <form className="survey-form" onSubmit={handleSubmit} noValidate>
          {/* ─── O Apreciador ─── */}
          <section className="survey-section survey-reveal">
            <h2 className="survey-section-title">O Apreciador</h2>
            <div className="survey-section-line" />

            <TextInput
              questionNumber={1}
              label="Qual é o seu primeiro nome?"
              value={form.nome}
              onChange={set("nome")}
              required
              placeholder="Seu primeiro nome"
            />

            <TextInput
              questionNumber={2}
              label="Qual é o seu sobrenome?"
              value={form.sobrenome}
              onChange={set("sobrenome")}
              required
              placeholder="Seu sobrenome"
            />

            <TextInput
              questionNumber={3}
              label="Qual é o seu melhor email?"
              value={form.email}
              onChange={set("email")}
              required
              type="email"
              placeholder="seu@email.com"
            />

            <TextInput
              questionNumber={4}
              label="Qual é o seu número de WhatsApp?"
              value={form.celular}
              onChange={set("celular")}
              required
              type="tel"
              placeholder="11987654321"
            />

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
          </section>

          {revealed >= 2 && (
          <div ref={section2Ref} style={{ animation: "surveyFadeUp 0.7s ease forwards" }}>
          {/* ─── O Primeiro Gole ─── */}
          <section className="survey-section">
            <h2 className="survey-section-title">O Primeiro Gole</h2>
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
          </div>
          )}

          {revealed >= 3 && (
          <div ref={section3Ref} style={{ animation: "surveyFadeUp 0.7s ease forwards" }}>
          {/* ─── A Xícara ─── */}
          <section className="survey-section">
            <h2 className="survey-section-title">A Xícara</h2>
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

            <Dropdown
              questionNumber={15}
              label="Qual faixa melhor representa sua renda ou faturamento mensal?"
              value={form.faixa_renda}
              onChange={set("faixa_renda")}
              options={OPCOES_RENDA}
              required
            />
          </section>
          </div>
          )}

          {revealed >= 4 && (
          <div ref={section4Ref} style={{ animation: "surveyFadeUp 0.7s ease forwards" }}>
          {/* ─── A Última Nota ─── */}
          <section className="survey-section">
            <h2 className="survey-section-title">A Última Nota</h2>
            <div className="survey-section-line" />
            <p className="survey-section-desc">
              Essas duas perguntas são opcionais, mas são as mais valiosas.
              <br />
              Quanto mais detalhado, melhor o conteúdo que vou criar para você.
            </p>

            <TextArea
              questionNumber={16}
              label="Qual é o maior problema com o café que você bebe hoje?"
              value={form.maior_desafio}
              onChange={set("maior_desafio")}
              placeholder="Ex: Compro café de supermercado porque não sei onde encontrar coisa boa na minha cidade e tenho medo de gastar R$ 60 num grão ruim..."
            />

            <TextArea
              questionNumber={17}
              label="Descreva o seu ritual de café ideal."
              value={form.pergunta_mentoria}
              onChange={set("pergunta_mentoria")}
              placeholder="Horário, método, grão, onde você está, o que está fazendo ao mesmo tempo..."
            />
          </section>

          {/* ─── Error ─── */}
          {errorMsg && (
            <div className="survey-error">
              {errorMsg}
            </div>
          )}

          {/* ─── Submit ─── */}
          <div className="survey-submit-wrapper">
            <button
              type="submit"
              className="survey-submit"
              disabled={status === "sending"}
            >
              {status === "sending" ? "Enviando..." : "Enviar Respostas"}
            </button>
          </div>
          </div>
          )}
        </form>
      </main>

      {/* Footer */}
      <footer className="survey-footer">
        <p>Notas do Café — Bom café. Até sábado.</p>
      </footer>
    </>
  );
}
