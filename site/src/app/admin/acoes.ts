"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ENV, MODO_DEMONSTRACAO, TEM_ADMIN } from "@/lib/ambiente";
import { ErroAsaas, estornarCobranca, cancelarCobranca } from "@/lib/asaas";
import { montarEmailCodigoAdmin } from "@/lib/email-templates";
import { enviarEmailDireto, notificar, processarFila } from "@/lib/notificacoes";
import { aplicarStatusFinanceiro } from "@/lib/pedidos";
import { guardarNotaFiscal } from "@/lib/armazenamento";
import {
  atualizarDesafioAdmin,
  atualizarPedido,
  criarDesafioAdmin,
  listarCupons,
  obterDesafioAdmin,
  obterPedidoPorNumero,
  registrarAuditoria,
  salvarCupom,
} from "@/lib/repositorio";
import { ipDaRequisicao, limitar } from "@/lib/rate-limit";
import {
  abrirSessao,
  exigirSessao,
  fecharSessao,
  gravarDesafio,
  limparDesafio,
  lerDesafio,
} from "@/lib/sessao-admin";
import {
  comparacaoSegura,
  conferirSenha,
  gerarCodigoNumerico,
  hashToken,
} from "@/lib/seguranca";
import type { Pedido, StatusLogistico } from "@/lib/tipos";
import { PAGO } from "@/lib/tipos";

export type EstadoAdmin = { erro?: string; aviso?: string };

const MINUTOS_DESAFIO = 5;
const MAXIMO_TENTATIVAS = 5;

function texto(dados: FormData, chave: string): string {
  const valor = dados.get(chave);
  return typeof valor === "string" ? valor.trim() : "";
}

/** Etapa 1: senha. Nao abre sessao, apenas cria o desafio por e-mail. */
export async function entrarComSenha(_anterior: EstadoAdmin, dados: FormData): Promise<EstadoAdmin> {
  const cabecalhos = await headers();
  const ip = ipDaRequisicao(cabecalhos);
  if (!limitar(`admin-login:${ip}`, 8, 10 * 60_000)) {
    return { erro: "Muitas tentativas. Aguarde alguns minutos." };
  }
  if (!TEM_ADMIN) {
    return {
      erro: "O painel ainda não foi configurado. Defina ADMIN_EMAIL, ADMIN_SENHA_HASH e SEGREDO_SESSAO.",
    };
  }

  const email = texto(dados, "email").toLowerCase();
  const senha = texto(dados, "senha");
  const emailConfere = comparacaoSegura(email, ENV.adminEmail!.toLowerCase());
  const senhaConfere = conferirSenha(senha, ENV.adminSenhaHash!);

  if (!emailConfere || !senhaConfere) {
    await registrarAuditoria({
      ator: email || "desconhecido",
      acao: "LOGIN_RECUSADO",
      recurso: "admin",
      detalhes: { ip },
    });
    return { erro: "E-mail ou senha incorretos" };
  }

  const codigo = gerarCodigoNumerico(6);
  const desafio = await criarDesafioAdmin(email, hashToken(codigo), MINUTOS_DESAFIO);
  await gravarDesafio({ desafioId: desafio.id, email, criadoEm: Date.now() });

  const modelo = montarEmailCodigoAdmin(codigo);
  await enviarEmailDireto(email, modelo.assunto, modelo.html, modelo.texto);

  if (MODO_DEMONSTRACAO && !ENV.resendApiKey) {
    console.info(`[demonstração] código de acesso ao painel: ${codigo}`);
  }

  await registrarAuditoria({ ator: email, acao: "LOGIN_SENHA_OK", recurso: "admin", detalhes: { ip } });
  redirect("/admin/codigo");
}

/** Etapa 2: codigo enviado ao e-mail verificado. So aqui a sessao e aberta. */
export async function confirmarCodigo(_anterior: EstadoAdmin, dados: FormData): Promise<EstadoAdmin> {
  const desafioCookie = await lerDesafio();
  if (!desafioCookie) return { erro: "A sessão expirou. Entre novamente." };

  const desafio = await obterDesafioAdmin(desafioCookie.desafioId);
  if (!desafio || desafio.consumido) return { erro: "Este código não está mais válido." };
  if (new Date(desafio.expiraEm) < new Date()) return { erro: "O código expirou. Peça outro." };
  if (desafio.tentativas >= MAXIMO_TENTATIVAS) {
    return { erro: "Número de tentativas esgotado. Entre novamente." };
  }

  const codigo = texto(dados, "codigo");
  if (!comparacaoSegura(hashToken(codigo), desafio.codigoHash)) {
    await atualizarDesafioAdmin(desafio.id, { tentativas: desafio.tentativas + 1 });
    return { erro: "Código incorreto" };
  }

  await atualizarDesafioAdmin(desafio.id, { consumido: true });
  await limparDesafio();
  const sid = await abrirSessao(desafio.email);
  await registrarAuditoria({
    ator: desafio.email,
    acao: "LOGIN_CONCLUIDO",
    recurso: "admin",
    detalhes: { sid },
  });
  redirect("/admin/pedidos");
}

export async function sair(): Promise<void> {
  const sessao = await exigirSessao();
  await registrarAuditoria({ ator: sessao.email, acao: "LOGOUT", recurso: "admin" });
  await fecharSessao();
  redirect("/admin");
}

async function pedidoDoFormulario(dados: FormData): Promise<Pedido> {
  const numero = texto(dados, "numero");
  const pedido = await obterPedidoPorNumero(numero);
  if (!pedido) throw new Error("Pedido não encontrado");
  return pedido;
}

export async function salvarRastreamento(_anterior: EstadoAdmin, dados: FormData): Promise<EstadoAdmin> {
  const sessao = await exigirSessao();
  const pedido = await pedidoDoFormulario(dados);

  const transportadora = texto(dados, "transportadora");
  const codigo = texto(dados, "codigo");
  const url = texto(dados, "url");

  if (!transportadora || !codigo) return { erro: "Informe transportadora e código" };
  if (url) {
    try {
      const endereco = new URL(url);
      if (endereco.protocol !== "https:") return { erro: "O link de rastreamento precisa ser https" };
    } catch {
      return { erro: "O link de rastreamento não é uma URL válida" };
    }
  }

  await atualizarPedido(pedido.id, {
    envio: {
      transportadora,
      codigo,
      url: url || null,
      postadoEm: new Date().toISOString(),
    },
    statusLogistico: "POSTADO",
  });
  await registrarAuditoria({
    ator: sessao.email,
    acao: "RASTREAMENTO_SALVO",
    recurso: pedido.numero,
    detalhes: { transportadora, codigo },
  });

  const atualizado = await obterPedidoPorNumero(pedido.numero);
  if (atualizado) await notificar(atualizado, "POSTADO");

  revalidatePath(`/admin/pedidos/${pedido.numero}`);
  return { aviso: "Rastreamento salvo e notificação enfileirada" };
}

export async function alterarStatusLogistico(
  _anterior: EstadoAdmin,
  dados: FormData,
): Promise<EstadoAdmin> {
  const sessao = await exigirSessao();
  const pedido = await pedidoDoFormulario(dados);
  const novo = texto(dados, "statusLogistico") as StatusLogistico;

  const permitidos: StatusLogistico[] = [
    "AGUARDANDO_PAGAMENTO",
    "EM_PREPARACAO",
    "POSTADO",
    "ENTREGUE",
    "CANCELADO",
  ];
  if (!permitidos.includes(novo)) return { erro: "Status inválido" };
  if (novo === "ENTREGUE" && pedido.statusLogistico !== "POSTADO") {
    return { erro: "Marque como postado antes de registrar a entrega" };
  }

  await atualizarPedido(pedido.id, { statusLogistico: novo });
  await registrarAuditoria({
    ator: sessao.email,
    acao: "STATUS_LOGISTICO",
    recurso: pedido.numero,
    detalhes: { de: pedido.statusLogistico, para: novo },
  });

  const atualizado = await obterPedidoPorNumero(pedido.numero);
  if (atualizado && novo === "ENTREGUE") await notificar(atualizado, "ENTREGUE");
  if (atualizado && novo === "EM_PREPARACAO") await notificar(atualizado, "EM_PREPARACAO");

  revalidatePath(`/admin/pedidos/${pedido.numero}`);
  return { aviso: "Status atualizado" };
}

export async function enviarNotaFiscal(_anterior: EstadoAdmin, dados: FormData): Promise<EstadoAdmin> {
  const sessao = await exigirSessao();
  const pedido = await pedidoDoFormulario(dados);
  const arquivo = dados.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) return { erro: "Escolha o arquivo da nota" };

  try {
    const resultado = await guardarNotaFiscal(pedido.id, arquivo);
    await atualizarPedido(pedido.id, {
      notaFiscal: { ...resultado, enviadaEm: new Date().toISOString() },
    });
    await registrarAuditoria({
      ator: sessao.email,
      acao: "NOTA_FISCAL_ENVIADA",
      recurso: pedido.numero,
      detalhes: { hash: resultado.hash },
    });
    const atualizado = await obterPedidoPorNumero(pedido.numero);
    if (atualizado) await notificar(atualizado, "NOTA_FISCAL");
    revalidatePath(`/admin/pedidos/${pedido.numero}`);
    return { aviso: "Nota fiscal anexada. O documento é emitido fora do site." };
  } catch (erro) {
    return { erro: erro instanceof Error ? erro.message : "Falha ao anexar a nota" };
  }
}

export async function cancelarPedido(_anterior: EstadoAdmin, dados: FormData): Promise<EstadoAdmin> {
  const sessao = await exigirSessao();
  const pedido = await pedidoDoFormulario(dados);
  if (texto(dados, "confirmacao") !== pedido.numero) {
    return { erro: "Digite o número do pedido para confirmar o cancelamento" };
  }
  if (PAGO.includes(pedido.statusFinanceiro)) {
    return { erro: "Este pedido está pago. Use o reembolso em vez do cancelamento." };
  }

  const ativo = pedido.pagamentos.find((p) => p.ativo && p.asaasPaymentId && !p.demonstracao);
  if (ativo?.asaasPaymentId) {
    try {
      await cancelarCobranca(ativo.asaasPaymentId);
    } catch (erro) {
      if (erro instanceof ErroAsaas && erro.status !== 404) {
        return { erro: `Não foi possível cancelar a cobrança: ${erro.message}` };
      }
    }
  }

  await atualizarPedido(pedido.id, { statusFinanceiro: "CANCELADO", statusLogistico: "CANCELADO" });
  await registrarAuditoria({ ator: sessao.email, acao: "PEDIDO_CANCELADO", recurso: pedido.numero });
  const atualizado = await obterPedidoPorNumero(pedido.numero);
  if (atualizado) await notificar(atualizado, "CANCELADO");
  revalidatePath(`/admin/pedidos/${pedido.numero}`);
  return { aviso: "Pedido cancelado" };
}

export async function solicitarReembolso(_anterior: EstadoAdmin, dados: FormData): Promise<EstadoAdmin> {
  const sessao = await exigirSessao();
  const pedido = await pedidoDoFormulario(dados);

  if (texto(dados, "confirmacao") !== pedido.numero) {
    return { erro: "Confira o pedido e digite o número para confirmar o reembolso" };
  }
  if (!PAGO.includes(pedido.statusFinanceiro)) {
    return { erro: "Só é possível estornar um pagamento confirmado" };
  }
  if (pedido.reembolso?.solicitadoEm) {
    return { erro: "Já existe um estorno solicitado para este pedido" };
  }

  const valorInformado = Number(texto(dados, "valor").replace(",", "."));
  const valorCentavos = Number.isFinite(valorInformado) && valorInformado > 0
    ? Math.round(valorInformado * 100)
    : pedido.totalCentavos;
  if (valorCentavos > pedido.totalCentavos) {
    return { erro: "O valor do estorno não pode passar do total pago" };
  }

  const pago = pedido.pagamentos.find((p) => p.asaasPaymentId && !p.demonstracao);
  if (pago?.asaasPaymentId) {
    try {
      await estornarCobranca(pago.asaasPaymentId, valorCentavos);
    } catch (erro) {
      return {
        erro:
          erro instanceof ErroAsaas
            ? `O provedor recusou o estorno: ${erro.message}`
            : "Falha ao solicitar o estorno",
      };
    }
  }

  await atualizarPedido(pedido.id, {
    statusFinanceiro: "ESTORNO_SOLICITADO",
    reembolso: { solicitadoEm: new Date().toISOString(), concluidoEm: null, valorCentavos },
  });
  await registrarAuditoria({
    ator: sessao.email,
    acao: "REEMBOLSO_SOLICITADO",
    recurso: pedido.numero,
    detalhes: { valorCentavos },
  });
  const atualizado = await obterPedidoPorNumero(pedido.numero);
  if (atualizado) await notificar(atualizado, "REEMBOLSO");
  revalidatePath(`/admin/pedidos/${pedido.numero}`);
  return { aviso: "Estorno solicitado. A conclusão é confirmada pelo provedor." };
}

export async function reenviarNotificacoes(_anterior: EstadoAdmin, _dados: FormData): Promise<EstadoAdmin> {
  const sessao = await exigirSessao();
  const resultado = await processarFila(30);
  await registrarAuditoria({
    ator: sessao.email,
    acao: "FILA_PROCESSADA",
    recurso: "notificacoes",
    detalhes: resultado,
  });
  return { aviso: `Fila processada. ${resultado.processadas} aceitas e ${resultado.falhas} com falha.` };
}

export async function confirmarPagamentoManual(
  _anterior: EstadoAdmin,
  dados: FormData,
): Promise<EstadoAdmin> {
  const sessao = await exigirSessao();
  if (!MODO_DEMONSTRACAO) return { erro: "Ação disponível apenas em demonstração" };
  const pedido = await pedidoDoFormulario(dados);
  await aplicarStatusFinanceiro(pedido, "CONFIRMADO");
  await registrarAuditoria({
    ator: sessao.email,
    acao: "PAGAMENTO_DEMONSTRACAO",
    recurso: pedido.numero,
  });
  revalidatePath(`/admin/pedidos/${pedido.numero}`);
  return { aviso: "Pagamento confirmado em modo demonstração" };
}

export async function salvarCupomAdmin(_anterior: EstadoAdmin, dados: FormData): Promise<EstadoAdmin> {
  const sessao = await exigirSessao();
  const codigo = texto(dados, "codigo").toUpperCase();
  if (!/^[A-Z0-9-]{3,40}$/.test(codigo)) return { erro: "Use letras, números e hífen no código" };

  const tipo = texto(dados, "tipo") === "VALOR" ? "VALOR" : "PERCENTUAL";
  const valorBruto = Number(texto(dados, "valor").replace(",", "."));
  if (!Number.isFinite(valorBruto) || valorBruto <= 0) return { erro: "Informe um valor válido" };
  if (tipo === "PERCENTUAL" && valorBruto > 90) return { erro: "O percentual máximo é 90" };

  const existentes = await listarCupons();
  const jaExiste = existentes.find((c) => c.codigo === codigo);

  await salvarCupom({
    codigo,
    tipo,
    valor: tipo === "VALOR" ? Math.round(valorBruto * 100) : Math.round(valorBruto),
    minimoCentavos: Math.round((Number(texto(dados, "minimo").replace(",", ".")) || 0) * 100),
    inicioEm: texto(dados, "inicioEm") || null,
    fimEm: texto(dados, "fimEm") || null,
    limiteUsos: Number(texto(dados, "limiteUsos")) || null,
    ativo: texto(dados, "ativo") === "on",
  });
  await registrarAuditoria({
    ator: sessao.email,
    acao: jaExiste ? "CUPOM_ATUALIZADO" : "CUPOM_CRIADO",
    recurso: codigo,
  });
  revalidatePath("/admin/cupons");
  return { aviso: "Cupom salvo" };
}
