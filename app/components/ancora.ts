// Âncora que não existe na página (slug da edição, nome de equipamento inventado pelo
// redator) caía no topo do catálogo, e o leitor lia isso como "link de compra quebrado"
// (fnx/333: 130 das 242 âncoras das edições 001 a 114). Ordem: id exato (o browser já
// resolveu), alias fixo, card com mais palavras em comum. Sem par nenhum, fica no topo.

const VAZIAS = new Set([
  "de", "do", "da", "dos", "das", "no", "na", "em", "com", "e", "a", "o",
  "cafe", "250g", "250ml", "natural", "torra", "media", "graus", "kit",
]);

const palavras = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !VAZIAS.has(t));

export function resolverAncora(
  itens: { slug: string; texto: string }[],
  alias: Record<string, string> = {},
) {
  const pedido = decodeURIComponent(window.location.hash.slice(1));
  if (!pedido || document.getElementById(pedido)) return;

  let alvo: string | undefined = alias[pedido];
  if (!alvo) {
    const busca = palavras(pedido);
    let melhor = 0;
    for (const it of itens) {
      const doCard = new Set(palavras(`${it.slug} ${it.texto}`));
      const pontos = busca.filter((t) => doCard.has(t)).length;
      if (pontos > melhor) {
        melhor = pontos;
        alvo = it.slug;
      }
    }
  }

  const el = alvo ? document.getElementById(alvo) : null;
  if (!el) return;
  history.replaceState(null, "", `#${alvo}`);
  el.scrollIntoView({ block: "start" });
  el.style.boxShadow = "0 0 0 2px var(--accent)";
}
