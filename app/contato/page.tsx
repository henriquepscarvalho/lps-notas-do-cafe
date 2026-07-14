import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contato · Notas do Café",
  description:
    "Fale com o Notas do Café: dúvidas de leitor, sugestão de grão ou cafeteria pra provar e parcerias de imprensa.",
  alternates: { canonical: "/contato" },
};

const wrap: React.CSSProperties = { minHeight: "100vh", background: "#2C1810", color: "#F5EDE0" };
const eyebrow: React.CSSProperties = { fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "#C8963E", marginBottom: "1rem" };
const h1: React.CSSProperties = { fontFamily: "var(--font-heading)", fontSize: "clamp(1.7rem, 4vw, 2.4rem)", fontWeight: 700, color: "#F5EDE0", marginBottom: "1.2rem", lineHeight: 1.2 };
const h2: React.CSSProperties = { fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700, color: "#F5EDE0", margin: "2rem 0 0.6rem" };
const p: React.CSSProperties = { fontFamily: "var(--font-body)", fontSize: "1rem", color: "#D4C4AE", lineHeight: 1.75, marginBottom: "1rem" };
const a: React.CSSProperties = { color: "#C8963E", textDecoration: "underline", textUnderlineOffset: 3 };

export default function Contato() {
  return (
    <main style={wrap}>
      <section style={{ maxWidth: 680, margin: "0 auto", padding: "5rem 24px 4rem" }}>
        <p style={eyebrow}>Contato</p>
        <h1 style={h1}>Fale com o Notas do Café</h1>
        <p style={p}>
          O Notas do Café é uma newsletter diária de curadoria de café especial brasileiro.
          Todo dia, às 08:08, sai um grão, uma origem ou um método destrinchado da fazenda à
          xícara. Se você tem uma dúvida, uma sugestão ou uma pauta, o canal é direto.
        </p>

        <h2 style={h2}>Dúvidas de leitor</h2>
        <p style={p}>
          Problema com o recebimento, pergunta sobre uma edição ou sugestão de grão, torrefador ou
          cafeteria pra entrar na fila: escreva para{" "}
          <a style={a} href="mailto:leia@notasdocafe.com.br">leia@notasdocafe.com.br</a>. Toda mensagem é lida.
        </p>

        <h2 style={h2}>Imprensa e parcerias</h2>
        <p style={p}>
          Torrefadores, produtores e marcas que queiram apresentar um café ou equipamento para
          avaliação, ou propor uma parceria, usam{" "}
          <a style={a} href="mailto:parcerias@notasdocafe.com.br">parcerias@notasdocafe.com.br</a>.
          Vale registrar: nenhuma recomendação é comprada. Um café só aparece se passar no filtro,
          e o veredicto é sempre honesto, patrocinado ou não.
        </p>

        <h2 style={h2}>Descadastro</h2>
        <p style={p}>
          Todo email do Notas do Café traz um link de cancelamento no rodapé, com efeito imediato.
          Se preferir, peça o descadastro pelo email acima.
        </p>

        <p style={{ ...p, marginTop: "2.5rem", fontSize: "0.85rem", color: "#9E8E7A" }}>
          <Link href="/" style={{ ...a, color: "#9E8E7A" }}>Voltar ao início</Link>{" · "}
          <Link href="/sobre" style={{ ...a, color: "#9E8E7A" }}>Sobre</Link>{" · "}
          <Link href="/privacidade" style={{ ...a, color: "#9E8E7A" }}>Privacidade</Link>
        </p>
      </section>
    </main>
  );
}
