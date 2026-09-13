import { NextResponse } from "next/server";
import { pedidoLiberadoNoNavegador } from "@/lib/acesso-pedido";
import { ErroAsaas } from "@/lib/asaas";
import { iniciarPagamentoPix } from "@/lib/pedidos";
import { obterPedidoPorNumero } from "@/lib/repositorio";
import { ipDaRequisicao, limitar } from "@/lib/rate-limit";
import { PAGO } from "@/lib/tipos";

/**
 * Gera outra cobranca Pix para o mesmo pedido.
 * Antes de gerar, confere o estado atual para nao duplicar cobranca ja paga.
 */
export async function POST(requisicao: Request, contexto: { params: Promise<{ numero: string }> }) {
  const ip = ipDaRequisicao(requisicao.headers);
  if (!limitar(`novo-pix:${ip}`, 6, 60_000)) {
    return NextResponse.json({ erro: "Aguarde antes de gerar outro Pix." }, { status: 429 });
  }

  const { numero } = await contexto.params;
  if (!(await pedidoLiberadoNoNavegador(numero))) {
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 });
  }

  const pedido = await obterPedidoPorNumero(numero);
  if (!pedido) return NextResponse.json({ erro: "Pedido não encontrado" }, { status: 404 });
  if (PAGO.includes(pedido.statusFinanceiro)) {
    return NextResponse.json({ erro: "Este pedido já está pago" }, { status: 409 });
  }

  try {
    await iniciarPagamentoPix(pedido);
    return NextResponse.json({ ok: true });
  } catch (erro) {
    const mensagem =
      erro instanceof ErroAsaas
        ? erro.message
        : "Não foi possível gerar o Pix agora. Tente novamente em instantes.";
    return NextResponse.json({ erro: mensagem }, { status: 502 });
  }
}
