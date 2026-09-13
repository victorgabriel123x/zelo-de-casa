import { NextResponse } from "next/server";
import { ipDaRequisicao, limitar } from "@/lib/rate-limit";

/** Consulta de CEP para preenchimento assistido. O preenchimento manual continua valendo. */
export async function GET(requisicao: Request, contexto: { params: Promise<{ cep: string }> }) {
  const { cep } = await contexto.params;
  const limpo = cep.replace(/\D+/g, "");
  if (limpo.length !== 8) {
    return NextResponse.json({ erro: "CEP inválido" }, { status: 400 });
  }

  const ip = ipDaRequisicao(requisicao.headers);
  if (!limitar(`cep:${ip}`, 40, 60_000)) {
    return NextResponse.json({ erro: "Muitas consultas. Tente em instantes." }, { status: 429 });
  }

  try {
    const controlador = new AbortController();
    const relogio = setTimeout(() => controlador.abort(), 6000);
    const resposta = await fetch(`https://viacep.com.br/ws/${limpo}/json/`, {
      signal: controlador.signal,
      cache: "no-store",
    });
    clearTimeout(relogio);
    if (!resposta.ok) throw new Error("consulta indisponível");
    const dados = (await resposta.json()) as Record<string, string> & { erro?: boolean };
    if (dados.erro) return NextResponse.json({ erro: "CEP não encontrado" }, { status: 404 });
    return NextResponse.json({
      cep: limpo,
      logradouro: dados["logradouro"] ?? "",
      bairro: dados["bairro"] ?? "",
      cidade: dados["localidade"] ?? "",
      estado: dados["uf"] ?? "",
    });
  } catch {
    return NextResponse.json(
      { erro: "Não foi possível consultar o CEP agora. Preencha o endereço manualmente." },
      { status: 503 },
    );
  }
}
