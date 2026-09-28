// Perfil do leitor (perfil-do-leitor/02, HC 28/09/26): todo dado novo de leitor (nome, telefone)
// grava no Supabase no mesmo passo em que é coletado. Uma chamada à RPC leitor_perfil_upsert
// (migration 0065), que decide a precedência por fonte: escolhido > pesquisa > compra > grupo.
//
// FONTE ÚNICA: _shared/scripts/templates/leitor-perfil.ts. As cópias (app/lib das LPs, lib do
// Pharos) saem daqui pelo _shared/scripts/leitor_perfil_rollout.py; editar só o template.
//
// Service role, nunca anon (a função só aceita service_role). Nunca levanta e nunca segura a
// resposta por mais de 4 s: falha no perfil não derruba a gravação de hoje (pesquisa, compra).

export type FontePerfil = 'pesquisa' | 'pesquisa_parcial' | 'compra';

export type DadosPerfil = {
  email: string | null | undefined;
  nome?: string | null;
  sobrenome?: string | null;
  fone?: string | null;
  fonte: FontePerfil;
  slug?: string | null;
};

const s = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 120) : null);

export async function gravaPerfil(d: DadosPerfil): Promise<string> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const email = s(d.email)?.toLowerCase();
    if (!url || !key) return 'erro: env';
    if (!email) return 'sem_chave';
    const nome = s(d.nome);
    const fone = s(d.fone);
    if (!nome && !fone) return 'sem_dado';
    const r = await fetch(`${url}/rest/v1/rpc/leitor_perfil_upsert`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        p_email: email,
        p_sub_hash: null,
        p_nome: nome,
        p_sobrenome: s(d.sobrenome),
        p_fone: fone,
        p_fonte: d.fonte,
        p_slug: s(d.slug),
        p_optin: null,
      }),
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    });
    const txt = await r.text();
    if (!r.ok) {
      console.error('[leitor-perfil]', d.fonte, r.status, txt.slice(0, 160));
      return `erro: ${r.status}`;
    }
    return txt.replace(/"/g, '');
  } catch (e) {
    console.error('[leitor-perfil]', d.fonte, e instanceof Error ? e.message : e);
    return 'erro: excecao';
  }
}

const MINUSCULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

/** Nome do checkout da Stripe (customer_details.name) em nome + sobrenome. O nome do cartão
 *  chega em caixa alta («JOAO SILVA») e iria assim pra saudação: vira «Joao Silva». */
export function partesDoNome(completo: string | null | undefined): { nome: string | null; sobrenome: string | null } {
  let t = s(completo);
  if (!t) return { nome: null, sobrenome: null };
  if (t === t.toUpperCase() || t === t.toLowerCase()) {
    t = t
      .toLowerCase()
      .split(/\s+/)
      .map((p, i) => (i > 0 && MINUSCULAS.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
      .join(' ');
  }
  const [nome, ...resto] = t.split(/\s+/);
  return { nome, sobrenome: resto.length ? resto.join(' ') : null };
}
