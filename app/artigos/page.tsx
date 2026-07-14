import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ARTIGOS } from "../lib/artigos";

export const metadata: Metadata = {
  title: "Guias · Notas do Café",
  description:
    "Guias de café especial brasileiro: grão, origem, processo e preparo, explicados sem frescura. O que importa antes de você comprar.",
  alternates: { canonical: "/artigos" },
};

export default function ArtigosIndex() {
  return (
    <main style={{ minHeight: "100vh", background: "#2C1810", color: "#F5EDE0" }}>
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 40, background: "rgba(44, 24, 16, 0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(200, 150, 62, 0.14)" }}>
        <div style={{ width: "100%", maxWidth: 1024, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <Image src="/images/simbolo.png" alt="Notas do Café" width={26} height={26} style={{ borderRadius: 6 }} />
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "0.95rem", color: "#F5EDE0" }}>Notas do Café</span>
          </Link>
          <Link href="/cadastro" style={{ background: "#C8963E", color: "#2C1810", padding: "8px 20px", borderRadius: 8, fontFamily: "var(--font-heading)", fontSize: "0.85rem", fontWeight: 700, textDecoration: "none" }}>Receber</Link>
        </div>
      </nav>

      <section style={{ maxWidth: 720, margin: "0 auto", padding: "7.5rem 24px 4rem" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "#C8963E", marginBottom: "1rem" }}>Guias</p>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 700, color: "#F5EDE0", marginBottom: "0.8rem", lineHeight: 1.15 }}>
          O que faz um café valer a pena, do grão à xícara
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "#9E8E7A", marginBottom: "2.5rem" }}>
          Origem, processo, varietal e preparo, explicados sem frescura. O que importa antes de você comprar.
        </p>

        {ARTIGOS.map((a) => (
          <Link
            key={a.slug}
            href={`/artigos/${a.slug}`}
            style={{ display: "block", textDecoration: "none", background: "#3D2517", border: "1px solid rgba(200, 150, 62, 0.14)", borderRadius: 12, padding: "1.4rem 1.5rem", marginBottom: 16 }}
          >
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C8963E", marginBottom: "0.5rem" }}>{a.statusTag}</p>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", fontWeight: 700, color: "#F5EDE0", lineHeight: 1.3, marginBottom: "0.5rem" }}>{a.titulo}</h2>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "#9E8E7A", lineHeight: 1.6 }}>{a.descricao}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
