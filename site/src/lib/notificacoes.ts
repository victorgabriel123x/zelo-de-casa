import { Resend } from "resend";
import { ENV, TEM_EMAIL, TEM_WHATSAPP } from "./ambiente";
import { LOJA } from "./produto";
import { montarEmail, TEMPLATES_WHATSAPP } from "./email-templates";
import {
  atualizarNotificacao,
  enfileirarNotificacao,
  listarNotificacoesPendentes,
  obterPedidoPorId,
  criarTokenAcesso,
} from "./repositorio";
import { gerarToken, hashToken } from "./seguranca";
import type { Pedido } from "./tipos";

/**
 * Outbox transacional simples. O pedido e gravado primeiro e a notificacao entra
 * na fila. O envio acontece em seguida e pode ser repetido pela rota de
 * processamento, com deduplicacao por pedido, evento, canal e destinatario.
 */

let resend: Resend | null = null;
function cliente(): Resend {
  if (!resend) resend = new Resend(ENV.resendApiKey!);
  return resend;
}

export const EVENTOS_CLIENTE = [
  "PEDIDO_RECEBIDO",
  "PAGAMENTO_CONFIRMADO",
  "EM_PREPARACAO",
  "POSTADO",
  "NOTA_FISCAL",
  "ENTREGUE",
  "CANCELADO",
  "REEMBOLSO",
] as const;

export type EventoNotificacao = (typeof EVENTOS_CLIENTE)[number] | "NOVA_VENDA_ADMIN";

export async function notificar(pedido: Pedido, evento: EventoNotificacao): Promise<void> {
  if (evento === "NOVA_VENDA_ADMIN") {
    const destino = ENV.emailAdmin ?? LOJA.email;
    await enfileirarNotificacao({
      pedidoId: pedido.id,
      evento,
      canal: "EMAIL",
      destinatario: destino,
    });
  } else {
    await enfileirarNotificacao({
      pedidoId: pedido.id,
      evento,
      canal: "EMAIL",
      destinatario: pedido.comprador.email,
    });
    if (pedido.consentimentos.whatsappOptIn && TEMPLATES_WHATSAPP[evento]) {
      await enfileirarNotificacao({
        pedidoId: pedido.id,
        evento,
        canal: "WHATSAPP",
        destinatario: pedido.comprador.whatsapp,
      });
    }
  }
  // Tenta despachar imediatamente. Falhas ficam na fila para a proxima rodada.
  void processarFila(5).catch(() => undefined);
}

async function gerarLinkAcesso(pedido: Pedido, minutos = 30): Promise<string> {
  const token = gerarToken(24);
  await criarTokenAcesso(pedido.id, hashToken(token), minutos);
  return `${ENV.siteUrl}/pedido/acesso?t=${encodeURIComponent(token)}`;
}

export async function enviarEmailDireto(
  destinatario: string,
  assunto: string,
  html: string,
  texto: string,
): Promise<void> {
  if (!TEM_EMAIL) {
    console.info(`[demonstração] e-mail não enviado para ${destinatario}: ${assunto}`);
    return;
  }
  await cliente().emails.send({
    from: ENV.emailRemetente!,
    to: destinatario,
    subject: assunto,
    html,
    text: texto,
  });
}

async function enviarWhatsapp(destinatario: string, template: string, parametros: string[]): Promise<void> {
  if (!TEM_WHATSAPP) {
    console.info(`[demonstração] WhatsApp não enviado para ${destinatario}: ${template}`);
    return;
  }
  const resposta = await fetch(
    `https://graph.facebook.com/v21.0/${ENV.whatsappPhoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.whatsappToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: `55${destinatario}`,
        type: "template",
        template: {
          name: template,
          language: { code: "pt_BR" },
          components: [
            {
              type: "body",
              parameters: parametros.map((texto) => ({ type: "text", text: texto })),
            },
          ],
        },
      }),
    },
  );
  if (!resposta.ok) {
    const corpo = await resposta.text();
    throw new Error(`WhatsApp recusou o envio: ${resposta.status} ${corpo.slice(0, 200)}`);
  }
}

/** Processa a fila. Chamada apos eventos e tambem pela rota agendada. */
export async function processarFila(limite = 20): Promise<{ processadas: number; falhas: number }> {
  const pendentes = await listarNotificacoesPendentes(limite);
  let processadas = 0;
  let falhas = 0;

  for (const notificacao of pendentes) {
    const pedido = await obterPedidoPorId(notificacao.pedidoId);
    if (!pedido) {
      await atualizarNotificacao(notificacao.id, { status: "IGNORADA", erro: "pedido inexistente" });
      continue;
    }
    try {
      if (notificacao.canal === "EMAIL") {
        const destinoAdmin = notificacao.evento === "NOVA_VENDA_ADMIN";
        const url = destinoAdmin
          ? `${ENV.siteUrl}/admin/pedidos/${pedido.numero}`
          : await gerarLinkAcesso(pedido);
        const modelo = montarEmail(notificacao.evento, pedido, url);
        await enviarEmailDireto(notificacao.destinatario, modelo.assunto, modelo.html, modelo.texto);
      } else {
        const template = TEMPLATES_WHATSAPP[notificacao.evento];
        if (!template) throw new Error("template não aprovado para este evento");
        const url = await gerarLinkAcesso(pedido);
        await enviarWhatsapp(notificacao.destinatario, template, [pedido.numero, url]);
      }
      await atualizarNotificacao(notificacao.id, {
        status: "ACEITA",
        tentativas: notificacao.tentativas + 1,
        erro: null,
      });
      processadas += 1;
    } catch (erro) {
      falhas += 1;
      const tentativas = notificacao.tentativas + 1;
      await atualizarNotificacao(notificacao.id, {
        tentativas,
        status: tentativas >= 5 ? "FALHA" : "PENDENTE",
        erro: erro instanceof Error ? erro.message.slice(0, 300) : "falha desconhecida",
      });
    }
  }
  return { processadas, falhas };
}

export async function criarLinkAcessoPublico(pedido: Pedido): Promise<string> {
  return gerarLinkAcesso(pedido);
}
