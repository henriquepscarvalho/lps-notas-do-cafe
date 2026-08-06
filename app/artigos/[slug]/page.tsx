import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "../../components/AdSlot";
import SubscribeForm from "../../components/SubscribeForm";
import { ARTIGOS, getArtigo, renderBody, tocOf } from "../../lib/artigos";

export function generateStaticParams() {
  return ARTIGOS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const artigo = getArtigo(slug);
  if (!artigo) return {};
  return {
    title: `${artigo.titulo} · Notas do Café`,
    description: artigo.descricao,
    alternates: { canonical: `/artigos/${artigo.slug}` },
    openGraph: {
      title: artigo.titulo,
      description: artigo.descricao,
      type: "article",
      ...(artigo.imagem ? { images: [artigo.imagem] } : {}),
    },
  };
}

const PROOF_AVATARS: string[] = [];

function Capture({ variant }: { variant: "meio" | "fim" }) {
  return (
    <div className="artigo-capture">
      <h4>
        {variant === "meio"
          ? "Mais um grão destrinchado, todo dia às 08:08"
          : "O próximo café chega amanhã, 08:08"}
      </h4>
      <p className="cap-sub">
        {variant === "meio"
          ? "Notas do Café destrincha grão, origem e preparo. Sem frescura, por email."
          : "Receba a próxima curadoria no seu email. Todo dia, às 08:08. Gratuito."}
      </p>
      <div className="artigo-proof">
        <div className="artigo-avs">
          {PROOF_AVATARS.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="" width={30} height={30} />
          ))}
        </div>
        <span>
          <b>2.115</b> leitores já recebem
        </span>
      </div>
      <SubscribeForm
        inputId={`cap-${variant}`}
        className="email-form"
        inputClassName="email-input"
        buttonClassName="submit-btn"
        buttonText="Quero receber"
      />
      <p className="cta-fine">Todo dia às 08:08 · 5 min · Cancele quando quiser</p>
    </div>
  );
}

export default async function ArtigoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artigo = getArtigo(slug);
  if (!artigo) notFound();

  const toc = tocOf(artigo.body);
  const explicitos = (artigo.relacionados ?? [])
    .map(getArtigo)
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  // fallback: os 2 seguintes no ranking (wrap), pra todo artigo interligar
  const idx = ARTIGOS.findIndex((a) => a.slug === artigo.slug);
  const relacionados = explicitos.length
    ? explicitos
    : [ARTIGOS[(idx + 1) % ARTIGOS.length], ARTIGOS[(idx + 2) % ARTIGOS.length]].filter(
        (a) => a && a.slug !== artigo.slug
      );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: artigo.titulo,
    description: artigo.descricao,
    datePublished: artigo.dataPublicacao,
    inLanguage: "pt-BR",
    publisher: { "@type": "Organization", name: "Notas do Café" },
  };

  return (
    <main style={{ minHeight: "100vh", background: "#2C1810", color: "#F5EDE0" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 40, background: "rgba(44, 24, 16, 0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(200, 150, 62, 0.14)" }}>
        <div style={{ width: "100%", maxWidth: 1024, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <Image src="/images/simbolo.png" alt="Notas do Café" width={26} height={26} style={{ borderRadius: 6 }} />
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "0.95rem", color: "#F5EDE0" }}>Notas do Café</span>
          </Link>
          <Link href="/cadastro" style={{ background: "#C8963E", color: "#2C1810", padding: "8px 20px", borderRadius: 8, fontFamily: "var(--font-heading)", fontSize: "0.85rem", fontWeight: 700, textDecoration: "none" }}>Receber</Link>
        </div>
      </nav>

      <article style={{ maxWidth: 720, margin: "0 auto", padding: "7.5rem 24px 4rem" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "#C8963E", marginBottom: "0.9rem" }}>
          Guia · {artigo.statusTag}
        </p>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.7rem, 4vw, 2.4rem)", fontWeight: 700, color: "#F5EDE0", lineHeight: 1.2, marginBottom: "0.9rem" }}>
          {artigo.titulo}
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#9E8E7A", marginBottom: "0.5rem" }}>
          {artigo.localData} · Leitura de {artigo.leitura}
        </p>

        {artigo.imagem && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artigo.imagem}
            alt={artigo.imagemAlt ?? artigo.termo}
            style={{ width: "100%", height: "auto", borderRadius: 12, margin: "1.2rem 0 0.4rem", border: "1px solid rgba(200, 150, 62, 0.14)" }}
          />
        )}

        <div className="artigo-toc">
          <p className="toc-label">Neste guia</p>
          <ol>
            {toc.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`}>{t.label}</a>
              </li>
            ))}
          </ol>
        </div>

        <div className="artigo-body">
          {renderBody(artigo.body, {
            AD1: <AdSlot slot="artigo-topo" />,
            AD2: <AdSlot slot="artigo-fim" />,
            CAPTURE: <Capture variant="meio" />,
          })}
        </div>

        <div className="artigo-veja" style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#C8963E", marginBottom: "0.7rem" }}>
            Veja também
          </p>
          {relacionados.map((r) => (
            <p key={r.slug} style={{ marginBottom: "0.5rem" }}>
              <Link href={`/artigos/${r.slug}`}>{r.titulo}</Link>
            </p>
          ))}
          <p style={{ marginBottom: "0.5rem" }}>
            <Link href="/artigos">Todos os guias publicados</Link>
          </p>
        </div>

        <Capture variant="fim" />

        <footer style={{ marginTop: "3rem", paddingTop: "1.2rem", background: "transparent", borderTop: "1px solid rgba(200, 150, 62, 0.14)", fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#9E8E7A", lineHeight: 1.7 }}>
          <p>
            Notas do Café é uma newsletter diária de curadoria de café especial brasileiro. Este guia reconstrói a análise a partir da edição fonte e de referências públicas verificáveis.{" "}
            <Link href="/privacidade" style={{ color: "#9E8E7A", textDecoration: "underline" }}>Política de privacidade</Link>
          </p>
        </footer>
      </article>
    </main>
  );
}
