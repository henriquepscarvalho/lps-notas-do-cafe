import type { ReactNode } from "react";

// Artigos de busca (arbitragem AdSense + captura, réplica Crime Aberto jul/26).
// Body em markdown-lite: ## h2 · ### h3 · > citação · **negrito** · parágrafos.
// Marcadores de layout: [[AD1]] e [[AD2]] (blocos AdSense, máx 2 por artigo,
// nunca adjacentes a botão) e [[CAPTURE]] (formulário de captação inline).

export interface Artigo {
  slug: string;
  titulo: string;
  descricao: string;
  termo: string;
  localData: string;
  statusTag: string;
  dataPublicacao: string; // ISO
  leitura: string;
  imagem?: string; // hero da edição (Supabase assets), reusada no artigo e no OG
  imagemAlt?: string;
  body: string;
  relacionados?: string[];
}

import { artigo as cafeDescafeinado } from "./artigos-data/cafe-descafeinado";
import { artigo as cafeEspecial } from "./artigos-data/cafe-especial";
import { artigo as cafeConilon } from "./artigos-data/cafe-conilon";
import { artigo as cafeJacu } from "./artigos-data/cafe-jacu";
import { artigo as cafeEmGraos } from "./artigos-data/cafe-em-graos";
import { artigo as cafeArabica } from "./artigos-data/cafe-arabica";
import { artigo as cafeRobusta } from "./artigos-data/cafe-robusta";
import { artigo as cafeTorrado } from "./artigos-data/cafe-torrado-em-graos";
import { artigo as cafeBourbonAmarelo } from "./artigos-data/cafe-bourbon-amarelo";
import { artigo as cafeGeisha } from "./artigos-data/cafe-geisha";

// Ordem = volume de busca real BR (kw_ideas, coffee-intent, dedup por termo,
// gated por fidelidade a edição fonte).
// café descafeinado 40,5k · café especial 22,2k · café conilon 22,2k ·
// café jacu 18,1k · café em grãos 18,1k · café arábica 9,9k · café robusta 5,4k ·
// café torrado em grãos 4,4k · café bourbon amarelo 2,4k · café geisha 1,9k.
export const ARTIGOS: Artigo[] = [
  cafeDescafeinado,
  cafeEspecial,
  cafeConilon,
  cafeJacu,
  cafeEmGraos,
  cafeArabica,
  cafeRobusta,
  cafeTorrado,
  cafeBourbonAmarelo,
  cafeGeisha,
];

export function getArtigo(slug: string): Artigo | undefined {
  return ARTIGOS.find((a) => a.slug === slug);
}

export function anchorId(heading: string): string {
  return heading
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function tocOf(body: string): { id: string; label: string }[] {
  return body
    .split("\n")
    .filter((l) => l.startsWith("## "))
    .map((l) => {
      const label = l.slice(3).trim();
      return { id: anchorId(label), label };
    });
}

function inline(text: string): ReactNode[] {
  // **negrito** e *itálico* (ex.: binômios latinos como *Coffea canephora*).
  // A alternância testa ** antes de *, então **x** casa o primeiro ramo.
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

// Parágrafo de linha do tempo: "**1903.** Ludwig Roselius patenteia o..."
const TL_RE = /^\*\*([^*]+?)\.?\*\*\s+([\s\S]+)$/;

// Renderiza o body em blocos React. Marcadores [[AD1]]/[[AD2]]/[[CAPTURE]]
// são resolvidos pelo caller via o mapa `slots`. Sob um h2 de "linha do
// tempo", os parágrafos "**Data.** fato" viram um infográfico vertical
// (.artigo-timeline) em vez de texto corrido.
export function renderBody(
  body: string,
  slots: Record<string, ReactNode>
): ReactNode[] {
  const blocks = body.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
  const out: ReactNode[] = [];
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    const marker = b.match(/^\[\[(AD1|AD2|CAPTURE)\]\]$/);
    if (marker) {
      out.push(<div key={i}>{slots[marker[1]]}</div>);
      i++;
      continue;
    }
    if (b.startsWith("### ")) {
      out.push(<h3 key={i}>{inline(b.slice(4).trim())}</h3>);
      i++;
      continue;
    }
    // Lista: bloco de linhas iniciadas por "- " vira <ul> (markdown-lite).
    if (b.startsWith("- ")) {
      const items = b
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.startsWith("- "))
        .map((l) => l.slice(2).trim());
      out.push(
        <ul className="artigo-lista" key={i}>
          {items.map((it, j) => (
            <li key={j}>{inline(it)}</li>
          ))}
        </ul>
      );
      i++;
      continue;
    }
    if (b.startsWith("## ")) {
      const label = b.slice(3).trim();
      out.push(<h2 key={i} id={anchorId(label)}>{inline(label)}</h2>);
      i++;
      if (/linha do tempo/i.test(label)) {
        const items: { data: string; txt: string }[] = [];
        while (i < blocks.length) {
          const m = blocks[i].match(TL_RE);
          if (!m) break;
          items.push({ data: m[1], txt: m[2] });
          i++;
        }
        if (items.length) {
          out.push(
            <ol className="artigo-timeline" key={`tl-${i}`}>
              {items.map((it, j) => (
                <li key={j}>
                  <span className="tl-data">{it.data}</span>
                  <span className="tl-txt">{inline(it.txt)}</span>
                </li>
              ))}
            </ol>
          );
        }
      }
      continue;
    }
    if (b.startsWith("> ")) {
      out.push(<blockquote key={i}>{inline(b.slice(2))}</blockquote>);
      i++;
      continue;
    }
    out.push(<p key={i}>{inline(b)}</p>);
    i++;
  }
  return out;
}
