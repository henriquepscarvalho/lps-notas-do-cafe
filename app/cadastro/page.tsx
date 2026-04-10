"use client";

import { useEffect, useRef } from "react";
import SubscribeForm from "../components/SubscribeForm";

export default function CadastroPage() {
  const typewriterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Scroll reveal
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    document
      .querySelectorAll(".reveal, .reveal-left, .reveal-right")
      .forEach((el) => revealObserver.observe(el));

    // Typewriter
    const text = "Você toma café todo dia. Mas sabe o que está tomando?";
    const el = typewriterRef.current;
    if (el) {
      let i = 0;
      function type() {
        if (i < text.length && el) {
          el.textContent += text.charAt(i);
          i++;
          setTimeout(type, 65);
        }
      }
      setTimeout(type, 600);
    }

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const href = (a as HTMLAnchorElement).getAttribute("href");
        if (href) {
          const target = document.querySelector(href);
          if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });

    // Nav hide/show on scroll
    let lastScroll = 0;
    const nav = document.querySelector("nav");
    const onScroll = () => {
      const current = window.scrollY;
      if (nav) {
        if (current > lastScroll && current > 100) {
          nav.style.transform = "translateY(-100%)";
          nav.style.transition = "transform 0.35s cubic-bezier(0.16,1,0.3,1)";
        } else {
          nav.style.transform = "translateY(0)";
        }
      }
      lastScroll = current;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      revealObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  function toggleFaq(e: React.MouseEvent<HTMLDivElement>) {
    const item = e.currentTarget.parentElement;
    if (item) item.classList.toggle("open");
  }

  return (
    <>
      {/* NAV */}
      <nav
        className="fixed top-0 w-full z-50"
        style={{
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          background: "rgba(44,24,16,0.88)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo/simbolo.png"
              alt="Notas do Café"
              className="w-8 h-8 object-contain"
            />
            <span className="font-heading text-lg font-bold text-gold">
              Notas do Café
            </span>
          </div>
          <a
            href="#hero"
            className="cta-btn px-5 py-2.5 rounded-lg text-sm hidden md:inline-block"
          >
            Quero receber
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section
        id="hero"
        className="min-h-screen relative flex items-center justify-center"
      >
        <div className="absolute inset-0">
          <img
            src="/images/hero/hero-01.png"
            alt="Grão de café especial"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(44,24,16,0.82), rgba(44,24,16,0.92))",
            }}
          />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-6 md:px-8 pt-28 pb-16 md:py-0 text-center">
          <div className="mb-8 reveal stagger-1 flex justify-center">
            <img
              src="/images/logo/simbolo.png"
              alt="Notas do Café"
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.08] mb-6 reveal stagger-2">
            <span ref={typewriterRef}></span>
            <span className="typewriter-cursor"></span>
          </h1>
          <p className="text-lg md:text-xl text-text-secondary font-light leading-relaxed mb-10 reveal stagger-3">
            Uma edição por semana com o melhor do café especial brasileiro. Grão,
            preparo, origem e equipamento. Sem elitismo, sem enrolação.
          </p>
          <SubscribeForm
            className="flex flex-col sm:flex-row gap-3 mb-4 reveal stagger-4 max-w-lg mx-auto"
            inputId="email-hero"
            inputClassName="email-input flex-1 px-5 py-3.5 rounded-lg text-base font-body"
            buttonClassName="cta-btn px-7 py-3.5 rounded-lg text-base whitespace-nowrap"
            buttonText="Quero meu primeiro sábado"
          />
          <p className="text-sm text-text-muted reveal stagger-5">
            Grátis. 5 minutos de leitura. Cancele quando quiser.
          </p>
        </div>
      </section>

      <div className="gold-line" />

      {/* O QUE É */}
      <section
        id="about"
        className="flex flex-col md:flex-row"
        style={{ background: "var(--surface)" }}
      >
        <div className="w-full md:w-1/2 flex items-center px-6 md:px-16 lg:px-20 py-16 md:py-28 order-2 md:order-1">
          <div className="max-w-lg">
            <p className="text-sm text-gold font-semibold tracking-widest uppercase mb-4 reveal-left stagger-1">
              O que é
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6 leading-tight reveal-left stagger-2">
              50 perfis. 20 canais. 10 blogs. Nenhum editorial semanal.
            </h2>
            <p className="text-text-secondary leading-relaxed mb-5 reveal-left stagger-3">
              O café especial no Brasil tem um problema. Não é falta de qualidade.
              É excesso de ruído. Jargão em inglês, embalagens que não explicam
              nada, opiniões sem critério. Notas do Café corta esse ruído.
            </p>
            <p className="text-text-secondary leading-relaxed mb-5 reveal-left stagger-4">
              Uma edição por semana com três seções fixas: grão, preparo e
              equipamento.
            </p>
            <p className="text-cream font-medium reveal-left stagger-5">
              Vale a xícara.
            </p>
          </div>
        </div>
        <div className="w-full md:w-1/2 min-h-[40vh] md:min-h-[600px] split-image order-1 md:order-2">
          <img src="/images/conceitos/cupping.png" alt="Mesa de cupping" />
        </div>
      </section>

      <div className="gold-line" />

      {/* COMO FUNCIONA */}
      <section
        id="ritual"
        className="py-20 md:py-28 relative"
        style={{ background: "var(--bg)" }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="text-center mb-16">
            <p className="text-sm text-gold font-semibold tracking-widest uppercase mb-4 reveal">
              Como funciona
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold reveal stagger-1">
              Três seções, todo sábado de manhã
            </h2>
            <p className="text-text-secondary text-lg font-light leading-relaxed mt-5 max-w-2xl mx-auto reveal stagger-2">
              Toda semana, o mesmo ritual. 3 seções que cobrem o que importa, na
              ordem certa.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="feature-card rounded-xl p-7 reveal stagger-1">
              <div className="text-3xl mb-4">🫘</div>
              <h3 className="font-heading text-lg font-bold mb-2">
                Grão da Semana
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Um café destrinchado por completo: origem, notas de sabor, preparo
                ideal, onde comprar.
              </p>
            </div>
            <div className="feature-card rounded-xl p-7 reveal stagger-2">
              <div className="text-3xl mb-4">☕</div>
              <h3 className="font-heading text-lg font-bold mb-2">
                Preparo da Semana
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Uma receita detalhada com proporções, temperatura, tempo. E por que
                funciona.
              </p>
            </div>
            <div className="feature-card rounded-xl p-7 reveal stagger-3">
              <div className="text-3xl mb-4">⚙️</div>
              <h3 className="font-heading text-lg font-bold mb-2">
                Setup Honesto
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Review de equipamento com prós e contras. Sem link disfarçado.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="gold-line" />

      {/* AMOSTRA */}
      <section
        id="amostra"
        className="py-20 md:py-28"
        style={{ background: "var(--surface)" }}
      >
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm text-gold font-semibold tracking-widest uppercase mb-4 reveal">
              Edição de amostra
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold reveal stagger-1">
              Um gole do que você recebe
            </h2>
          </div>

          <div className="amostra-card rounded-2xl overflow-hidden reveal stagger-2">
            <div className="amostra-header px-6 md:px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/images/logo/simbolo.png"
                  alt=""
                  className="w-9 h-9 object-contain"
                />
                <div>
                  <p className="font-heading font-bold text-sm leading-tight">
                    Notas do Café
                  </p>
                  <p className="text-xs text-text-muted">Edição #14</p>
                </div>
              </div>
              <span className="text-xs text-text-muted font-medium">
                Sábado, 8h
              </span>
            </div>
            <div className="px-6 md:px-8 py-8">
              <p className="text-xs text-gold font-semibold tracking-widest uppercase mb-3">
                Grão da Semana
              </p>
              <h3 className="font-heading text-2xl font-bold mb-4">
                Catuaí Vermelho da Chapada Diamantina
              </h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Notas de frutas vermelhas, mel silvestre e finalização longa.
                Processo natural com secagem em terreiro suspenso por 21 dias. Torra
                média.
              </p>
              <p className="text-text-secondary leading-relaxed mb-6">
                Melhor em V60 com moagem média-fina.{" "}
                <strong className="text-cream">
                  15g de café, 240ml de água a 92 graus
                </strong>
                . Proporção 1:16 (1g de café para cada 16ml de água). Tempo total: 3
                minutos.
              </p>
              <p className="text-text-secondary leading-relaxed">
                Encontra na <strong className="text-cream">Um Coffee Co.</strong> e
                na <strong className="text-cream">Coffee &amp; Joy</strong> por volta
                de R$ 45 a embalagem de 250g.
              </p>
              <div
                className="mt-8 pt-6"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <p className="font-heading font-bold text-gold text-lg">
                  Bom café. Até sábado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="gold-line" />

      {/* PRA QUEM */}
      <section
        id="praquem"
        className="flex flex-col md:flex-row"
        style={{ background: "var(--bg)" }}
      >
        <div className="w-full md:w-1/2 min-h-[40vh] md:min-h-[600px] split-image">
          <img src="/images/conceitos/mantiqueira.png" alt="Fazenda na Mantiqueira" />
        </div>
        <div className="w-full md:w-1/2 flex items-center px-6 md:px-16 lg:px-20 py-16 md:py-28">
          <div className="max-w-lg">
            <p className="text-sm text-gold font-semibold tracking-widest uppercase mb-4 reveal-right stagger-1">
              Pra quem é
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6 leading-tight reveal-right stagger-2">
              Você não precisa virar barista pra tomar café de verdade
            </h2>
            <p className="text-text-secondary leading-relaxed mb-5 reveal-right stagger-3">
              Pra quem quer entender o que toma. Sem curso, sem vergonha, sem
              obrigação.
            </p>
            <p className="text-cream font-medium reveal-right stagger-4">
              Sua manhã merece mais.
            </p>
          </div>
        </div>
      </section>

      <div className="gold-line" />

      {/* FAQ */}
      <section
        id="faq"
        className="py-20 md:py-28"
        style={{ background: "var(--surface)" }}
      >
        <div className="max-w-2xl mx-auto px-6 md:px-8">
          <div className="mb-12">
            <p className="text-sm text-gold font-semibold tracking-widest uppercase mb-4 reveal">
              Perguntas frequentes
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold reveal stagger-1">
              Sem frescura
            </h2>
          </div>
          <div className="reveal stagger-2">
            {[
              {
                q: "Preciso entender de café pra acompanhar?",
                a: "Não. A newsletter é feita pra quem está começando. Todo jargão técnico é traduzido. Você vai aprender no ritmo certo, sem pressão.",
              },
              {
                q: "Quando chega?",
                a: "Todo sábado de manhã, no seu email. Leva uns 5 minutos pra ler. Combina com a primeira xícara do dia.",
              },
              {
                q: "Posso cancelar quando quiser?",
                a: "Sim. Um clique e você sai. Sem pergunta, sem email de convencimento, sem drama.",
              },
              {
                q: "Quem escreve?",
                a: "Uma equipe de curadoria que lê tudo, testa em casa e conversa com produtores. Não somos Q-Graders. Somos entusiastas metódicos que organizam o melhor do café especial pra você.",
              },
            ].map((item, i) => (
              <div key={i} className="faq-item py-5">
                <div
                  className="faq-q flex justify-between items-center gap-4"
                  onClick={toggleFaq}
                >
                  <h3 className="font-heading font-bold text-base">{item.q}</h3>
                  <svg
                    className="faq-arrow w-5 h-5 flex-shrink-0 text-gold"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                <div className="faq-a text-sm text-text-secondary leading-relaxed">
                  {item.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gold-line" />

      {/* DEPOIMENTOS */}
      <section
        id="depoimentos"
        className="py-20 md:py-28"
        style={{ background: "var(--bg)" }}
      >
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <div className="text-center mb-16">
            <p className="text-sm text-gold font-semibold tracking-widest uppercase mb-4 reveal">
              Quem lê, recomenda
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold reveal stagger-1">
              O que dizem os leitores
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                text: "Eu comprava café caro achando que era bom. Depois da terceira edição, entendi o que olhar antes de escolher.",
                name: "Renato M.",
                since: "Leitor desde a edição #3",
                initial: "R",
              },
              {
                text: "Finalmente alguém que explica café sem parecer sommelier. Direto, útil, e chega na hora certa do sábado.",
                name: "Camila S.",
                since: "Leitora desde a edição #7",
                initial: "C",
              },
              {
                text: "O Setup Honesto vale a assinatura sozinho. Já economizei comprando o equipamento certo na primeira vez.",
                name: "Felipe T.",
                since: "Leitor desde a edição #1",
                initial: "F",
              },
            ].map((t, i) => (
              <div
                key={i}
                className={`feature-card rounded-xl p-7 reveal stagger-${i + 1}`}
              >
                <p className="text-text-secondary leading-relaxed mb-6 italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      background: "var(--surface-elevated)",
                      color: "var(--accent)",
                    }}
                  >
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-text-muted">{t.since}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gold-line" />

      {/* CTA FINAL */}
      <section
        id="cta"
        className="flex flex-col md:flex-row min-h-[70vh]"
        style={{ background: "var(--bg)" }}
      >
        <div className="w-full md:w-1/2 min-h-[40vh] md:min-h-full split-image order-2 md:order-1">
          <img src="/images/conceitos/v60.png" alt="Preparo de café V60" />
        </div>
        <div className="w-full md:w-1/2 flex items-center px-6 md:px-16 lg:px-20 py-16 md:py-28 order-1 md:order-2">
          <div className="max-w-lg w-full">
            <div className="mb-8 reveal stagger-1">
              <img
                src="/images/logo/simbolo.png"
                alt=""
                className="w-14 h-14 object-contain"
              />
            </div>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold mb-5 leading-tight reveal stagger-2">
              O próximo sábado pode ser diferente
            </h2>
            <p className="text-lg text-text-secondary font-light leading-relaxed mb-3 reveal stagger-3">
              Da fazenda à xícara, sem frescura. Todo sábado no seu email.
            </p>
            <SubscribeForm
              className="flex flex-col sm:flex-row gap-3 mb-4 reveal stagger-4"
              inputId="email-final"
              inputClassName="email-input flex-1 px-5 py-3.5 rounded-lg text-base font-body"
              buttonClassName="cta-btn px-7 py-3.5 rounded-lg text-base whitespace-nowrap"
              buttonText="Começar no próximo sábado"
            />
            <p className="text-sm text-text-muted reveal stagger-5">
              Grátis. 5 minutos de leitura. Cancele quando quiser.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="py-10 text-center"
        style={{
          borderTop: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <img
            src="/images/logo/simbolo.png"
            alt=""
            className="w-6 h-6 object-contain"
          />
          <span className="font-heading text-sm font-bold text-gold">
            Notas do Café
          </span>
        </div>
        <p className="text-xs text-text-muted">
          Da fazenda à xícara, sem frescura.
        </p>
        <p className="text-xs text-text-muted mt-2">
          &copy; {new Date().getFullYear()} Notas do Café. Todos os direitos
          reservados.
        </p>
      </footer>

      {/* MOBILE STICKY CTA */}
      <div className="mobile-cta">
        <a
          href="#cta"
          className="cta-btn flex-1 text-center py-3 rounded-lg text-sm font-bold"
        >
          Receber todo sábado, grátis
        </a>
      </div>
    </>
  );
}
