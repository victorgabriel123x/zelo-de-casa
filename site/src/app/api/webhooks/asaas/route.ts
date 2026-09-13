import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { ENV, TEM_PAGAMENTO } from "@/lib/ambiente";
import { consultarCobranca, statusDoEvento, traduzirStatus } from "@/lib/asaas";
import { aplicarStatusFinanceiro } from "@/lib/pedidos";
import {
  atualizarPagamento,
  marcarWebhookProcessado,
  obterPedidoPorPagamentoAsaas,
  registrarWebhook,
} from "@/lib/repositorio";
import { comparacaoSegura } from "@/lib/seguranca";

export const dynamic = "force-dynamic";

/**
 * Webhook de cobrancas do Asaas.
 * Autenticacao pelo token configurado no painel do provedor, enviado no header
 * asaas-access-token. Eventos sao deduplicados pelo id e reconciliados com a
 * consulta da cobranca antes de mudar o pedido.
 */
export async function POST(requisicao: Request) {
  const tokenEsperado = ENV.asaasWebhookToken;
  const tokenRecebido = requisicao.headers.get("asaas-access-token") ?? "";

  if (!tokenEsperado) {
    console.error("webhook recebido sem ASAAS_WEBHOOK_TOKEN configurado");
    return NextResponse.json({ erro: "Webhook não configurado" }, { status: 503 });
  }
  if (!comparacaoSegura(tokenRecebido, tokenEsperado)) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const corpo = (await requisicao.json().catch(() => null)) as
    | { id?: string; event?: string; payment?: { id?: string; status?: string } }
    | null;

  if (!corpo?.event || !corpo.payment?.id) {
    return NextResponse.json({ erro: "Evento inválido" }, { status: 400 });
  }

  // Id do evento quando existir, caso contrario uma chave estavel do conteudo.
  const idEvento =
    corpo.id ??
    createHash("sha256")
      .update(`${corpo.event}:${corpo.payment.id}:${corpo.payment.status ?? ""}`)
      .digest("hex");

  const { novo } = await registrarWebhook(idEvento, corpo.event, corpo);
  if (!novo) {
    // Reentrega do mesmo evento. Responder 200 evita novas tentativas do provedor.
    return NextResponse.json({ ok: true, repetido: true });
  }

  try {
    const pedido = await obterPedidoPorPagamentoAsaas(corpo.payment.id);
    if (!pedido) {
      await marcarWebhookProcessado(idEvento);
      return NextResponse.json({ ok: true, ignorado: "cobrança não pertence a esta loja" });
    }

    // Reconciliacao: o estado vem da consulta a cobranca, nao do corpo do evento.
    let status = statusDoEvento(corpo.event);
    if (TEM_PAGAMENTO) {
      try {
        const cobranca = await consultarCobranca(corpo.payment.id);
        status = traduzirStatus(cobranca.status);
      } catch (erro) {
        console.error(
          "falha ao reconciliar cobrança",
          erro instanceof Error ? erro.message : erro,
        );
      }
    }

    if (status) {
      const pagamento = pedido.pagamentos.find((p) => p.asaasPaymentId === corpo.payment?.id);
      if (pagamento) await atualizarPagamento(pagamento.id, { status });
      await aplicarStatusFinanceiro(pedido, status);
    }

    await marcarWebhookProcessado(idEvento);
    return NextResponse.json({ ok: true });
  } catch (erro) {
    console.error("falha ao processar webhook", erro instanceof Error ? erro.message : erro);
    // 500 faz o provedor reenviar. O evento ja esta gravado e sera deduplicado.
    return NextResponse.json({ erro: "Falha ao processar" }, { status: 500 });
  }
}
