import { LOJA } from "./produto";
import { formatarCentavos } from "./dinheiro";
import type { Pedido } from "./tipos";

/** Escapa qualquer conteudo dinamico antes de entrar no HTML do e-mail. */
export function escapar(valor: unknown): string {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Apenas https e aceito em links vindos de dados. */
export function urlSegura(valor: string | null | undefined): string | null {
  if (!valor) return null;
  try {
    const url = new URL(valor);
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

type Bloco = { titulo: string; corpo: string; botao?: { rotulo: string; url: string } | null; extra?: string };

function moldura({ titulo, corpo, botao, extra }: Bloco): string {
  const acao = botao
    ? `<p style="padding:24px 0 4px"><a href="${escapar(botao.url)}" style="background:#A74429;color:#ffffff;padding:16px 24px;border-radius:12px;text-decoration:none;display:inline-block;font-weight:600">${escapar(botao.rotulo)}</a></p>`
    : "";
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapar(titulo)}</title></head><body style="margin:0;background:#F7F1E8;color:#2A211D;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" style="max-width:600px;margin:auto;background:#ffffff;border-radius:20px"><tr><td style="padding:32px"><p style="color:#A74429;font-size:22px;font-family:Georgia,serif;margin:0 0 8px">${escapar(LOJA.nome)}</p><h1 style="font-size:26px;font-family:Georgia,serif;margin:0 0 16px;font-weight:600">${escapar(titulo)}</h1><div style="line-height:1.7;font-size:15px">${corpo}</div>${acao}${extra ?? ""}<p style="font-size:13px;line-height:1.6;color:#67584F;margin-top:28px">${escapar(LOJA.slogan)}<br>Atendimento: ${escapar(LOJA.email)}</p></td></tr></table></td></tr></table></body></html>`;
}

export function resumoHtml(pedido: Pedido): string {
  const linhas = (pedido.itens ?? [])
    .map(
      (item) =>
        `<tr><td style="padding:6px 0">${escapar(item.descricao)} <span style="color:#67584F">x${item.quantidade}</span></td><td style="padding:6px 0;text-align:right">${escapar(formatarCentavos(item.quantidade * item.precoUnitarioCentavos))}</td></tr>`,
    )
    .join("");
  const desconto =
    pedido.descontoCentavos > 0
      ? `<tr><td style="padding:6px 0">Desconto</td><td style="padding:6px 0;text-align:right">- ${escapar(formatarCentavos(pedido.descontoCentavos))}</td></tr>`
      : "";
  return `<table role="presentation" width="100%" style="font-size:15px;border-top:1px solid #E6D3C1;border-bottom:1px solid #E6D3C1;margin:16px 0;padding:8px 0">${linhas}${desconto}<tr><td style="padding:6px 0">Frete</td><td style="padding:6px 0;text-align:right">Grátis</td></tr><tr><td style="padding:10px 0;font-weight:700">Total</td><td style="padding:10px 0;text-align:right;font-weight:700">${escapar(formatarCentavos(pedido.totalCentavos))}</td></tr></table>`;
}

export type ModeloEmail = { assunto: string; html: string; texto: string };

/** E-mail do codigo de acesso ao painel, sem vinculo com pedido. */
export function montarEmailCodigoAdmin(codigo: string): ModeloEmail {
  return {
    assunto: "Código de acesso ao painel",
    texto: `Código de acesso ao painel da Zelo de Casa: ${codigo}`,
    html: moldura({
      titulo: "Código de acesso",
      corpo: `<p>Use o código abaixo para concluir a entrada no painel. Ele vale por 5 minutos.</p><p style="font-size:32px;letter-spacing:6px;font-weight:700">${escapar(codigo)}</p><p>Se não foi você que pediu este código, troque a senha do painel.</p>`,
    }),
  };
}

export function montarEmail(evento: string, pedido: Pedido, urlAcesso: string): ModeloEmail {
  const numero = escapar(pedido.numero);
  const resumo = resumoHtml(pedido);
  const link = urlSegura(urlAcesso) ?? urlAcesso;

  switch (evento) {
    case "PEDIDO_RECEBIDO":
      return {
        assunto: `Recebemos o pedido ${pedido.numero}`,
        texto: `Recebemos o pedido ${pedido.numero}. A preparação começa após a confirmação do pagamento.`,
        html: moldura({
          titulo: "Recebemos seu pedido",
          corpo: `<p>Recebemos o pedido <strong>${numero}</strong>. Confira os itens abaixo. A preparação começa após a confirmação do pagamento.</p>${resumo}`,
          botao: { rotulo: "Ver meu pedido", url: link },
        }),
      };
    case "PAGAMENTO_CONFIRMADO":
      return {
        assunto: `Pagamento confirmado do pedido ${pedido.numero}`,
        texto: `O pagamento do pedido ${pedido.numero} foi confirmado.`,
        html: moldura({
          titulo: "Pagamento confirmado",
          corpo: `<p>O pagamento do pedido <strong>${numero}</strong> foi confirmado. Vamos preparar sua compra para postagem em até 2 dias úteis.</p>${resumo}`,
          botao: { rotulo: "Acompanhar pedido", url: link },
        }),
      };
    case "EM_PREPARACAO":
      return {
        assunto: `Seu pedido ${pedido.numero} está em preparação`,
        texto: `Estamos preparando o pedido ${pedido.numero}.`,
        html: moldura({
          titulo: "Seu pedido está em preparação",
          corpo: `<p>Estamos preparando o pedido <strong>${numero}</strong>. Você receberá o rastreamento assim que ele for postado.</p>`,
          botao: { rotulo: "Ver meu pedido", url: link },
        }),
      };
    case "POSTADO":
      return {
        assunto: `Seu pedido ${pedido.numero} foi postado`,
        texto: `O pedido ${pedido.numero} foi postado.`,
        html: moldura({
          titulo: "Seu pedido foi postado",
          corpo: `<p>O pedido <strong>${numero}</strong> foi enviado pela ${escapar(pedido.envio?.transportadora ?? "transportadora")}. Código: <strong>${escapar(pedido.envio?.codigo ?? "")}</strong>. A entrega está estimada em 8 dias úteis após a postagem.</p>`,
          botao: { rotulo: "Rastrear meu pedido", url: link },
        }),
      };
    case "NOTA_FISCAL":
      return {
        assunto: `Nota fiscal do pedido ${pedido.numero}`,
        texto: `A nota fiscal do pedido ${pedido.numero} está disponível no acesso seguro.`,
        html: moldura({
          titulo: "Sua nota fiscal está disponível",
          corpo: `<p>A nota fiscal do pedido <strong>${numero}</strong> está disponível no acesso seguro abaixo. Guarde o documento da sua compra.</p>`,
          botao: { rotulo: "Acessar nota fiscal", url: link },
        }),
      };
    case "ENTREGUE":
      return {
        assunto: `Entrega registrada do pedido ${pedido.numero}`,
        texto: `A entrega do pedido ${pedido.numero} foi registrada.`,
        html: moldura({
          titulo: "Entrega registrada",
          corpo: `<p>A entrega do pedido <strong>${numero}</strong> foi registrada. Se houver alguma divergência, fale conosco em ${escapar(LOJA.email)}.</p>`,
          botao: { rotulo: "Ver meu pedido", url: link },
        }),
      };
    case "CANCELADO":
      return {
        assunto: `Pedido ${pedido.numero} cancelado`,
        texto: `O pedido ${pedido.numero} foi cancelado.`,
        html: moldura({
          titulo: "Pedido cancelado",
          corpo: `<p>O pedido <strong>${numero}</strong> foi cancelado. Se houve pagamento, acompanhe a situação do reembolso pelo acesso seguro.</p>`,
          botao: { rotulo: "Consultar pedido", url: link },
        }),
      };
    case "REEMBOLSO":
      return {
        assunto: `Reembolso do pedido ${pedido.numero}`,
        texto: `O reembolso do pedido ${pedido.numero} foi atualizado.`,
        html: moldura({
          titulo: "Reembolso atualizado",
          corpo: `<p>O reembolso do pedido <strong>${numero}</strong> está com status ${escapar(
            pedido.reembolso?.concluidoEm ? "concluído" : "solicitado",
          )}. Valor: ${escapar(formatarCentavos(pedido.reembolso?.valorCentavos ?? 0))}. O prazo de visualização depende do meio de pagamento.</p>`,
          botao: { rotulo: "Consultar reembolso", url: link },
        }),
      };
    case "NOVA_VENDA_ADMIN":
      return {
        assunto: `Nova venda confirmada ${pedido.numero}`,
        texto: `Venda confirmada do pedido ${pedido.numero}.`,
        html: moldura({
          titulo: "Nova venda confirmada",
          corpo: `<p>Pedido <strong>${numero}</strong> com pagamento confirmado.</p>${resumo}<p>Comprador: ${escapar(pedido.comprador.nome)}<br>Cidade: ${escapar(pedido.endereco.cidade)} ${escapar(pedido.endereco.estado)}</p>`,
          botao: { rotulo: "Abrir no painel", url: link },
        }),
      };
    case "ACESSO_PEDIDO":
      return {
        assunto: `Acesso ao pedido ${pedido.numero}`,
        texto: `Link de acesso ao pedido ${pedido.numero}.`,
        html: moldura({
          titulo: "Acesso ao seu pedido",
          corpo: `<p>Use o link abaixo para ver os detalhes do pedido <strong>${numero}</strong>. Ele vale por 30 minutos e é de uso pessoal.</p>`,
          botao: { rotulo: "Abrir meu pedido", url: link },
        }),
      };
    default:
      return {
        assunto: `Atualização do pedido ${pedido.numero}`,
        texto: `Atualização do pedido ${pedido.numero}.`,
        html: moldura({
          titulo: "Atualização do pedido",
          corpo: `<p>Houve uma atualização no pedido <strong>${numero}</strong>.</p>`,
          botao: { rotulo: "Ver meu pedido", url: link },
        }),
      };
  }
}

/** Textos dos templates utilitarios do WhatsApp, conforme modelos/whatsapp.md. */
export const TEMPLATES_WHATSAPP: Record<string, string> = {
  PEDIDO_RECEBIDO: "zelo_pedido_recebido",
  PAGAMENTO_CONFIRMADO: "zelo_pagamento_confirmado",
  EM_PREPARACAO: "zelo_em_preparacao",
  POSTADO: "zelo_pedido_postado",
  NOTA_FISCAL: "zelo_nota_fiscal",
  ENTREGUE: "zelo_entrega_registrada",
  CANCELADO: "zelo_pedido_cancelado",
  REEMBOLSO: "zelo_reembolso_atualizado",
};
