import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade · Notas do Café",
  description:
    "Como o Notas do Café coleta, usa e protege seus dados, e como funcionam os anúncios de terceiros nas páginas de guia.",
  alternates: { canonical: "/privacidade" },
};

const wrap: React.CSSProperties = { minHeight: "100vh", background: "#2C1810", color: "#F5EDE0" };
const eyebrow: React.CSSProperties = { fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "#C8963E", marginBottom: "1rem" };
const h1: React.CSSProperties = { fontFamily: "var(--font-heading)", fontSize: "clamp(1.7rem, 4vw, 2.4rem)", fontWeight: 700, color: "#F5EDE0", marginBottom: "1.2rem", lineHeight: 1.2 };
const h2: React.CSSProperties = { fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700, color: "#F5EDE0", margin: "2rem 0 0.6rem" };
const p: React.CSSProperties = { fontFamily: "var(--font-body)", fontSize: "1rem", color: "#D4C4AE", lineHeight: 1.75, marginBottom: "1rem" };
const a: React.CSSProperties = { color: "#C8963E", textDecoration: "underline", textUnderlineOffset: 3 };

export default function Privacidade() {
  return (
    <main style={wrap}>
      <section style={{ maxWidth: 680, margin: "0 auto", padding: "5rem 24px 4rem" }}>
        <p style={eyebrow}>Privacidade</p>
        <h1 style={h1}>Política de Privacidade</h1>
        <p style={p}>
          Esta política explica quais dados o Notas do Café coleta, para que servem e como você
          controla o que é seu. A regra é simples: pedimos o mínimo necessário para entregar a
          newsletter e nunca vendemos seus dados.
        </p>

        <h2 style={h2}>O que coletamos</h2>
        <p style={p}>
          Ao assinar, coletamos seu email e, quando disponíveis, os parâmetros de origem da visita
          (de qual campanha ou link você chegou). Isso serve para enviar as edições e entender quais
          canais trazem leitores, nada além.
        </p>

        <h2 style={h2}>Como usamos</h2>
        <p style={p}>
          O email é usado para enviar a newsletter diária e comunicados sobre ela. Você pode cancelar
          a qualquer momento pelo link no rodapé de cada edição, com efeito imediato.
        </p>

        <h2 style={h2}>Anúncios de terceiros</h2>
        <p style={p}>
          As páginas de guia deste site podem exibir anúncios do Google AdSense. Para isso, o Google e
          seus parceiros usam cookies para veicular anúncios com base em visitas anteriores a este e a
          outros sites. Você pode desativar a publicidade personalizada nas{" "}
          <a style={a} href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
            configurações de anúncios do Google
          </a>{" "}
          ou gerenciar cookies de fornecedores terceiros em{" "}
          <a style={a} href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">
            aboutads.info
          </a>.
        </p>

        <h2 style={h2}>Seus direitos</h2>
        <p style={p}>
          Você pode pedir acesso, correção ou exclusão dos seus dados a qualquer momento escrevendo para{" "}
          <a style={a} href="mailto:leia@notasdocafe.com.br">leia@notasdocafe.com.br</a>.
          Atendemos o pedido e confirmamos a remoção.
        </p>

        <p style={{ ...p, marginTop: "2.5rem", fontSize: "0.85rem", color: "#9E8E7A" }}>
          <Link href="/" style={{ ...a, color: "#9E8E7A" }}>Voltar ao início</Link>{" · "}
          <Link href="/sobre" style={{ ...a, color: "#9E8E7A" }}>Sobre</Link>{" · "}
          <Link href="/contato" style={{ ...a, color: "#9E8E7A" }}>Contato</Link>
        </p>
      </section>
    </main>
  );
}
