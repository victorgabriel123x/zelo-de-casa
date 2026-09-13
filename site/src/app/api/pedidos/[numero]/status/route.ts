import { NextResponse } from "next/server";
import { obterPedidoPorNumero } from "@/lib/repositorio";
import { ipDaRequisicao, limitar } from "@/lib/rate-limit";
import { STATUS_FINANCEIRO_ROTULO, STATUS_LOGISTICO_ROTULO } from "@/lib/tipos";

/** Status minimo por numero do pedido. Nao devolve dados pessoais nem documentos. */
export async function GET(requisicao: Request, contexto: { params: Promise<{ numero: string }> }) {
  const ip = ipDaRequisicao(requisicao.headers);
  if (!limitar(`status:${ip}`, 60, 60_000)) {
    return NextResponse.json({ erro: "Muitas consultas. Aguarde um instante." }, { status: 429 });
  }

  const { numero } = await contexto.params;
  const pedido = await obterPedidoPorNumero(numero);
  if (!pedido) {
    return NextResponse.json({ erro: "Pedido não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    numero: pedido.numero,
    statusFinanceiro: pedido.statusFinanceiro,
    statusFinanceiroRotulo: STATUS_FINANCEIRO_ROTULO[pedido.statusFinanceiro],
    statusLogistico: pedido.statusLogistico,
    statusLogisticoRotulo: STATUS_LOGISTICO_ROTULO[pedido.statusLogistico],
    postadoEm: pedido.envio?.postadoEm ?? null,
    transportadora: pedido.envio?.transportadora ?? null,
    temRastreamento: Boolean(pedido.envio?.codigo),
  });
}
