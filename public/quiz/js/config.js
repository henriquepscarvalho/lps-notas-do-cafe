/**
 * Notas do Café · O Mapa da Xícara · config do funil
 * Réplica leva 2 do golden FI (ticket 15). Valores vazios desativam o recurso.
 */
window.NC_CONFIG = {
  // Checkout Stripe embutido JÁ LIVE da news (ebook premium existente).
  // O quiz aponta pro fluxo existente; nada de gateway novo.
  checkoutUrl: "https://lp.notasdocafe.com.br/ebook-premium/checkout",

  // Meta Pixel ID (só números). Mesmo pixel que as LPs vivas da news carregam.
  metaPixelId: "648841918486990",

  // Beacon do funil na mesma tabela lp_page_views das LPs, com as mesmas
  // chaves de sessao do PageBeacon do Next: a jornada que comeca aqui
  // continua na /vsl, no checkout e no obrigado. A chave anon e publica por
  // desenho (RLS da tabela so permite INSERT); vazia = quiz nao mede nada.
  supabaseUrl: "https://ecmveymyzdqiehvtqxms.supabase.co",
  supabaseAnonKey: "sb_publishable_0rVyKQMVG6Vfq5fjRmEi9A_xOgoDPNZ",
  beaconSlug: "notas-do-cafe",

  // Segundo de PLAY do vídeo em que a oferta aparece na página da VSL.
  // Regra do golden: o segundo em que a voz fala o nome do produto,
  // medido por whisper no corte final. ?offer=5 testa sem esperar.
  offerDelaySeconds: 0,

  productDisplayName: "Café de Balcão no Coador de Casa",
  priceLabel: "R$ 27",
};
