import { NextResponse } from "next/server";
import { z } from "zod";
import { calcularResumo, cupomElegivel } from "@/lib/precos";
import { obterCupom } from "@/lib/repositorio";
import { ipDaRequisicao, limitar } from "@/lib/rate-limit";

const esquema = z.object({
  codigo: z.string().trim().min(1).max(40),
  itens: z
    .array(z.object({ voltagem: z.enum(["127", "220"]), quantidade: z.number().int().min(1).max(20) }))
    .min(1),
});

/** Pre-visualizacao do cupom. O valor cobrado e sempre recalculado no envio do pedido. */
export async function POST(requisicao: Request) {
  const ip = ipDaRequisicao(requisicao.headers);
  if (!limitar(`cupom:${ip}`, 20, 60_000)) {
    return NextResponse.json({ erro: "Muitas tentativas. Aguarde um instante." }, { status: 429 });
  }

  const corpo = await requisicao.json().catch(() => null);
  const dados = esquema.safeParse(corpo);
  if (!dados.success) {
    return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 });
  }

  const semCupom = calcularResumo(dados.data.itens, null);
  const cupom = await obterCupom(dados.data.codigo);
  if (!cupom || !cupomElegivel(cupom, semCupom.subtotalCentavos)) {
    return NextResponse.json(
      { valido: false, erro: "Este cupom não está disponível para este pedido" },
      { status: 200 },
    );
  }

  const resumo = calcularResumo(dados.data.itens, cupom);
  return NextResponse.json({
    valido: true,
    codigo: cupom.codigo,
    descontoCentavos: resumo.descontoCentavos,
    totalCentavos: resumo.totalCentavos,
  });
}
