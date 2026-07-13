import { NextResponse } from "next/server";

// Partial capture: fired when the reader advances past step 1 of /pesquisa.
// Writes nome/sobrenome/celular as Beehiiv custom_fields on the existing
// subscription (same field names the Pharos sync-pesquisa cron uses), so an
// abandoned survey still leaves name + WhatsApp attached to the lead.
// No Supabase write — network_pesquisa stays submit-only (metric numerator).

const BASE = "https://api.beehiiv.com/v2";

function bh(path: string, init?: RequestInit) {
  return fetch(
    `${BASE}/publications/${process.env.BEEHIIV_PUBLICATION_ID}${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${process.env.BEEHIIV_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
}

// Form field -> canonical custom_field name. MUST match the column names the
// Pharos sync-pesquisa cron writes on full submit (q_* vocabulary), or the
// partial save would create duplicate fields on the publication.
const FIELD_MAP: Record<string, string> = {
  nome: "nome",
  sobrenome: "sobrenome",
  celular: "celular",
  genero: "genero",
  idade: "idade",
  origem: "origem",
  interesse_conteudo: "q_interesse",
  situacao_profissional: "situacao_profissional",
  nivel_experiencia: "q_experiencia",
  consome_cafe: "q_consumo",
  investe_cafe: "q_objetivo",
  tipo_recurso: "q_recurso",
  area_principal: "q_area",
  faixa_renda: "faixa_renda",
};

// Beehiiv silently drops values for custom fields the publication doesn't
// have. Ensure needed definitions exist, remembered per server instance.
const ensured = new Set<string>();
async function ensureFields(names: string[]) {
  const missing = names.filter((n) => !ensured.has(n));
  if (missing.length === 0) return;
  const res = await bh(`/custom_fields?limit=100`);
  if (!res.ok) return; // best-effort: worst case the PATCH drops the value
  const json = (await res.json()) as { data?: Array<{ display: string }> };
  const existing = new Set((json.data ?? []).map((c) => c.display));
  for (const name of missing) {
    if (!existing.has(name)) {
      await bh(`/custom_fields`, {
        method: "POST",
        body: JSON.stringify({ kind: "string", display: name }),
      });
    }
    ensured.add(name);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    if (!email || !email.includes("@") || !email.includes(".")) {
      return NextResponse.json({ saved: false }, { status: 400 });
    }

    const fields = Object.entries(FIELD_MAP)
      .map(([formKey, name]) => ({ name, value: String(body?.[formKey] ?? "").trim().slice(0, 255) }))
      .filter((f) => f.value !== "");
    if (fields.length === 0) return NextResponse.json({ saved: false });

    // Only enrich an existing subscription. A visitor with no subscription
    // isn't a lead yet — the full submit path (sync-pesquisa cron) handles
    // backfill for those.
    const lookup = await bh(`/subscriptions/by_email/${encodeURIComponent(email)}`);
    if (!lookup.ok) return NextResponse.json({ saved: false });
    const sub = (await lookup.json()) as { data?: { id: string } };
    if (!sub.data?.id) return NextResponse.json({ saved: false });

    await ensureFields(fields.map((f) => f.name));

    const patch = await bh(`/subscriptions/${sub.data.id}`, {
      method: "PATCH",
      body: JSON.stringify({ custom_fields: fields }),
    });

    return NextResponse.json({ saved: patch.ok });
  } catch {
    // Partial capture is a bonus — never surface an error to the survey UI.
    return NextResponse.json({ saved: false });
  }
}
