import { NextResponse } from "next/server";
import { MODO_DEMONSTRACAO } from "@/lib/ambiente";
import { confirmarPagamentoDemonstracao } from "@/lib/pedidos";
import { obterPedidoPorNumero } from "@/lib/repositorio";
import { pedidoLiberadoNoNavegador } from "@/lib/acesso-pedido";

/** Confirmacao simulada, existe apenas enquanto nao ha credenciais de pagamento. */
export async function POST(_requisicao: Request, contexto: { params: Promise<{ numero: string }> }) {
  if (!MODO_DEMONSTRACAO) {
    return NextResponse.json({ erro: "Indisponível" }, { status: 404 });
  }
  const { numero } = await contexto.params;
  if (!(await pedidoLiberadoNoNavegador(numero))) {
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 });
  }
  const pedido = await obterPedidoPorNumero(numero);
  if (!pedido) return NextResponse.json({ erro: "Pedido não encontrado" }, { status: 404 });

  await confirmarPagamentoDemonstracao(pedido);
  return NextResponse.json({ ok: true });
}
