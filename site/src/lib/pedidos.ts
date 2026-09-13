import { MODO_DEMONSTRACAO, ENV } from "./ambiente";
import {
  buscarCobrancaPorReferencia,
  criarCobrancaCartao,
  criarCobrancaPix,
  ErroAsaas,
  obterOuCriarCliente,
  obterQrCodePix,
  traduzirStatus,
  podeAvancar,
} from "./asaas";
import { notificar } from "./notificacoes";
import { calcularResumo, cupomElegivel, opcaoParcelaValida } from "./precos";
import { PRODUTO, LOJA } from "./produto";
import {
  atualizarPagamento,
  atualizarPedido,
  buscarPagamentoPorIdempotencia,
  criarPedido,
  desativarPagamentos,
  obterCupom,
  resgatarCupom,
  salvarPagamento,
} from "./repositorio";
import { gerarNumeroPedido, gerarToken } from "./seguranca";
import type { EntradaPedido } from "./validacao";
import type { Pagamento, Pedido, StatusFinanceiro, StatusLogistico } from "./tipos";
import { PAGO } from "./tipos";

export type ContextoRequisicao = { ip: string | null; userAgent: string | null };

export class ErroDeNegocio extends Error {
  constructor(message: string, readonly campo?: string) {
    super(message);
    this.name = "ErroDeNegocio";
  }
}

/**
 * Cria o pedido com precos recalculados no servidor.
 * Nenhum total vindo do navegador e considerado.
 */
export async function registrarPedido(
  entrada: EntradaPedido,
  contexto: ContextoRequisicao,
): Promise<Pedido> {
  if (ENV.vendasPausadas) {
    throw new ErroDeNegocio("As vendas estão temporariamente pausadas");
  }

  const cupomBruto = entrada.cupom?.trim().toUpperCase() ?? "";
  const cupom = cupomBruto ? await obterCupom(cupomBruto) : null;
  const resumoSemCupom = calcularResumo(entrada.itens, null);
  if (resumoSemCupom.itens.length === 0) {
    throw new ErroDeNegocio("Selecione a voltagem para continuar", "itens");
  }
  if (cupomBruto && (!cupom || !cupomElegivel(cupom, resumoSemCupom.subtotalCentavos))) {
    throw new ErroDeNegocio("Este cupom não está disponível para este pedido", "cupom");
  }

  const resumo = calcularResumo(entrada.itens, cupom);

  if (entrada.formaPagamento === "CARTAO") {
    const opcao = opcaoParcelaValida(resumo.totalCentavos, entrada.parcelas);
    if (!opcao) {
      throw new ErroDeNegocio("Esta condição de parcelamento não está disponível", "parcelas");
    }
  }

  const pedido = await criarPedido({
    numero: gerarNumeroPedido(),
    comprador: entrada.comprador,
    endereco: {
      ...entrada.endereco,
      numero: entrada.endereco.semNumero ? "S/N" : entrada.endereco.numero,
    },
    consentimentos: {
      termos: entrada.consentimentos.termos,
      privacidade: entrada.consentimentos.privacidade,
      whatsappOptIn: entrada.consentimentos.whatsappOptIn,
      registradoEm: new Date().toISOString(),
      ip: contexto.ip,
      userAgent: contexto.userAgent,
    },
    itens: resumo.itens,
    cupom: resumo.cupomAplicado,
    subtotalCentavos: resumo.subtotalCentavos,
    descontoCentavos: resumo.descontoCentavos,
    freteCentavos: resumo.freteCentavos,
    totalCentavos: resumo.totalCentavos,
    statusFinanceiro: "CRIADO",
    statusLogistico: "AGUARDANDO_PAGAMENTO",
    envio: null,
    notaFiscal: null,
    eventoCompraRegistrado: false,
    reembolso: null,
    observacoesInternas: "",
  });

  // Resgate do cupom depois de existir o pedido, com contagem atomica.
  if (resumo.cupomAplicado) {
    const resgatado = await resgatarCupom(resumo.cupomAplicado, pedido.id);
    if (!resgatado) {
      const semCupom = calcularResumo(entrada.itens, null);
      await atualizarPedido(pedido.id, {});
      throw new ErroDeNegocio(
        `Este cupom não está mais disponível. O valor do pedido é ${semCupom.totalCentavos / 100}`,
        "cupom",
      );
    }
  }

  await notificar(pedido, "PEDIDO_RECEBIDO");
  return pedido;
}

function descricaoDoPedido(pedido: Pedido): string {
  return `${LOJA.nome} | pedido ${pedido.numero} | ${PRODUTO.nome}`;
}

/** Idempotencia por pedido e tentativa. A mesma chave nunca cria duas cobrancas. */
function chaveIdempotencia(pedido: Pedido, forma: string, tentativa: number): string {
  return `${pedido.numero}:${forma}:${tentativa}`;
}

export async function iniciarPagamentoPix(pedido: Pedido): Promise<Pagamento> {
  const ativo = pedido.pagamentos.find((p) => p.ativo && p.forma === "PIX");
  if (ativo && !["RECUSADO", "CANCELADO"].includes(ativo.status)) return ativo;

  const tentativa = pedido.pagamentos.length + 1;
  const chave = chaveIdempotencia(pedido, "PIX", tentativa);
  const jaCriado = await buscarPagamentoPorIdempotencia(chave);
  if (jaCriado) return jaCriado;

  await desativarPagamentos(pedido.id);

  if (MODO_DEMONSTRACAO) {
    const pagamento = await salvarPagamento(pedido.id, {
      asaasPaymentId: `demo_${gerarToken(8)}`,
      asaasCustomerId: null,
      forma: "PIX",
      parcelas: 1,
      valorCentavos: pedido.totalCentavos,
      status: "PENDENTE",
      chaveIdempotencia: chave,
      ativo: true,
      pixCopiaECola: "DEMONSTRACAO-SEM-COBRANCA-REAL",
      pixImagemBase64: null,
      pixExpiraEm: null,
      mensagemRecusa: null,
      demonstracao: true,
    });
    await aplicarStatusFinanceiro(pedido, "PENDENTE");
    return pagamento;
  }

  const cliente = await obterOuCriarCliente({
    nome: pedido.comprador.nome,
    cpf: pedido.comprador.cpf,
    email: pedido.comprador.email,
    telefone: pedido.comprador.whatsapp,
    cep: pedido.endereco.cep,
    numero: pedido.endereco.numero,
    complemento: pedido.endereco.complemento,
  });

  let cobranca;
  try {
    cobranca = await criarCobrancaPix({
      clienteId: cliente.id,
      valorCentavos: pedido.totalCentavos,
      referencia: pedido.numero,
      descricao: descricaoDoPedido(pedido),
    });
  } catch (erro) {
    // Timeout de criacao exige consulta antes de qualquer nova tentativa.
    if (erro instanceof ErroAsaas && erro.timeout) {
      const existente = await buscarCobrancaPorReferencia(pedido.numero);
      if (!existente) throw erro;
      cobranca = existente;
    } else {
      throw erro;
    }
  }

  const qr = await obterQrCodePix(cobranca.id);
  const pagamento = await salvarPagamento(pedido.id, {
    asaasPaymentId: cobranca.id,
    asaasCustomerId: cliente.id,
    forma: "PIX",
    parcelas: 1,
    valorCentavos: pedido.totalCentavos,
    status: traduzirStatus(cobranca.status),
    chaveIdempotencia: chave,
    ativo: true,
    pixCopiaECola: qr.payload,
    pixImagemBase64: qr.encodedImage,
    pixExpiraEm: qr.expirationDate,
    mensagemRecusa: null,
    demonstracao: false,
  });

  await aplicarStatusFinanceiro(pedido, traduzirStatus(cobranca.status));
  return pagamento;
}

export async function iniciarPagamentoCartao(
  pedido: Pedido,
  cartao: { titular: string; numero: string; mes: string; ano: string; cvv: string },
  parcelas: number,
  ipDoComprador: string,
): Promise<Pagamento> {
  const opcao = opcaoParcelaValida(pedido.totalCentavos, parcelas);
  if (!opcao) throw new ErroDeNegocio("Esta condição de parcelamento não está disponível", "parcelas");

  const tentativa = pedido.pagamentos.length + 1;
  const chave = chaveIdempotencia(pedido, "CARTAO", tentativa);
  const jaCriado = await buscarPagamentoPorIdempotencia(chave);
  if (jaCriado) return jaCriado;

  if (PAGO.includes(pedido.statusFinanceiro)) {
    throw new ErroDeNegocio("Este pedido já está pago");
  }

  await desativarPagamentos(pedido.id);

  if (MODO_DEMONSTRACAO) {
    const pagamento = await salvarPagamento(pedido.id, {
      asaasPaymentId: `demo_${gerarToken(8)}`,
      asaasCustomerId: null,
      forma: "CARTAO",
      parcelas,
      valorCentavos: opcao.totalCentavos,
      status: "PENDENTE",
      chaveIdempotencia: chave,
      ativo: true,
      pixCopiaECola: null,
      pixImagemBase64: null,
      pixExpiraEm: null,
      mensagemRecusa: null,
      demonstracao: true,
    });
    await aplicarStatusFinanceiro(pedido, "PENDENTE");
    return pagamento;
  }

  const cliente = await obterOuCriarCliente({
    nome: pedido.comprador.nome,
    cpf: pedido.comprador.cpf,
    email: pedido.comprador.email,
    telefone: pedido.comprador.whatsapp,
    cep: pedido.endereco.cep,
    numero: pedido.endereco.numero,
    complemento: pedido.endereco.complemento,
  });

  let cobranca;
  try {
    cobranca = await criarCobrancaCartao({
      clienteId: cliente.id,
      valorCentavos: opcao.totalCentavos,
      parcelas,
      referencia: pedido.numero,
      descricao: descricaoDoPedido(pedido),
      ipDoComprador,
      cartao,
      titular: {
        nome: pedido.comprador.nome,
        email: pedido.comprador.email,
        cpf: pedido.comprador.cpf,
        cep: pedido.endereco.cep,
        numero: pedido.endereco.numero,
        complemento: pedido.endereco.complemento,
        telefone: pedido.comprador.whatsapp,
      },
    });
  } catch (erro) {
    if (erro instanceof ErroAsaas && erro.timeout) {
      const existente = await buscarCobrancaPorReferencia(pedido.numero);
      if (!existente) throw erro;
      cobranca = existente;
    } else {
      throw erro;
    }
  }

  const status = traduzirStatus(cobranca.status);
  const pagamento = await salvarPagamento(pedido.id, {
    asaasPaymentId: cobranca.id,
    asaasCustomerId: cliente.id,
    forma: "CARTAO",
    parcelas,
    valorCentavos: opcao.totalCentavos,
    status,
    chaveIdempotencia: chave,
    ativo: true,
    pixCopiaECola: null,
    pixImagemBase64: null,
    pixExpiraEm: null,
    mensagemRecusa: status === "RECUSADO" ? "Pagamento não aprovado pelo emissor" : null,
    demonstracao: false,
  });

  await aplicarStatusFinanceiro(pedido, status);
  return pagamento;
}

const LOGISTICA_POR_FINANCEIRO: Partial<Record<StatusFinanceiro, StatusLogistico>> = {
  CONFIRMADO: "EM_PREPARACAO",
  RECEBIDO: "EM_PREPARACAO",
  CANCELADO: "CANCELADO",
};

/**
 * Aplica um novo estado financeiro respeitando a ordem dos eventos.
 * Webhooks repetidos ou fora de ordem nao rebaixam um pedido ja pago.
 */
export async function aplicarStatusFinanceiro(
  pedido: Pedido,
  novo: StatusFinanceiro,
): Promise<Pedido> {
  if (!podeAvancar(pedido.statusFinanceiro, novo)) return pedido;

  const logistico = LOGISTICA_POR_FINANCEIRO[novo];
  const manterLogistica =
    pedido.statusLogistico === "POSTADO" || pedido.statusLogistico === "ENTREGUE";

  const atualizado = await atualizarPedido(pedido.id, {
    statusFinanceiro: novo,
    ...(logistico && !manterLogistica ? { statusLogistico: logistico } : {}),
  });
  if (!atualizado) return pedido;

  const virouPago = PAGO.includes(novo) && !PAGO.includes(pedido.statusFinanceiro);
  if (virouPago) {
    await notificar(atualizado, "PAGAMENTO_CONFIRMADO");
    await notificar(atualizado, "NOVA_VENDA_ADMIN");
  }
  if (novo === "CANCELADO") await notificar(atualizado, "CANCELADO");
  if (novo === "ESTORNADO" || novo === "ESTORNO_SOLICITADO") await notificar(atualizado, "REEMBOLSO");

  return atualizado;
}

/** Confirmacao de pagamento usada apenas no modo demonstracao, para revisao visual. */
export async function confirmarPagamentoDemonstracao(pedido: Pedido): Promise<Pedido> {
  if (!MODO_DEMONSTRACAO) throw new ErroDeNegocio("Ação disponível apenas em demonstração");
  const ativo = pedido.pagamentos.find((p) => p.ativo);
  if (ativo) await atualizarPagamento(ativo.id, { status: "CONFIRMADO" });
  return aplicarStatusFinanceiro(pedido, "CONFIRMADO");
}
