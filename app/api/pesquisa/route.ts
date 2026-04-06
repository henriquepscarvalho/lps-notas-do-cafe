import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      nome,
      sobrenome,
      email,
      celular,
      genero,
      idade,
      origem,
      interesse_conteudo,
      situacao_profissional,
      nivel_experiencia,
      consome_cafe,
      investe_cafe,
      tipo_recurso,
      area_principal,
      faixa_renda,
      maior_desafio,
      pergunta_mentoria,
    } = body;

    // Validate required fields
    const required = [
      "nome",
      "sobrenome",
      "email",
      "celular",
      "genero",
      "idade",
      "origem",
      "interesse_conteudo",
      "situacao_profissional",
      "nivel_experiencia",
      "consome_cafe",
      "investe_cafe",
      "tipo_recurso",
      "area_principal",
      "faixa_renda",
    ];

    for (const field of required) {
      if (!body[field] || !String(body[field]).trim()) {
        return NextResponse.json(
          { error: `Campo obrigatório: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    if (!email.includes("@") || !email.includes(".")) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 });
    }

    const { error } = await supabase.from("nc_pesquisa").insert({
      nome: nome.trim(),
      sobrenome: sobrenome.trim(),
      email: email.trim().toLowerCase(),
      celular: celular.trim(),
      genero,
      idade,
      origem,
      interesse_conteudo,
      situacao_profissional,
      nivel_experiencia,
      consome_cafe,
      investe_cafe,
      tipo_recurso,
      area_principal,
      faixa_renda,
      maior_desafio: maior_desafio?.trim() || null,
      pergunta_mentoria: pergunta_mentoria?.trim() || null,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Erro ao salvar resposta." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
