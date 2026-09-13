import { ENV, TEM_PAGAMENTO } from "./ambiente";
import { centavosParaReais } from "./dinheiro";
import type { StatusFinanceiro } from "./tipos";

/**
 * Cliente da API do Asaas.
 * Documentacao consultada em setembro de 2026:
 *  autenticacao  https://docs.asaas.com/docs/autenticacao
 *  cartao        https://docs.asaas.com/docs/cobrancas-via-cartao-de-credito
 *  pix           https://docs.asaas.com/docs/cobrancas-via-pix
 *  qr code       https://docs.asaas.com/reference/obter-qr-code-para-pagamentos-via-pix
 *  webhooks      https://docs.asaas.com/docs/webhook-para-cobrancas
 *
 * Nenhum dado completo de cartao e gravado, registrado em log ou devolvido ao navegador.
 */

const BASE =
  ENV.asaasAmbiente === "producao"
    ? "https://api.asaas.com/v3"
    : "https://sandbox.asaas.com/api/v3";

const TIMEOUT_MS = 20_000;

export class ErroAsaas extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detalhes?: unknown,
    readonly timeout = false,
  ) {
    super(message);
    this.name = "ErroAsaas";
  }
}

async function chamada<T>(
  caminho: string,
  init: RequestInit & { corpo?: unknown } = {},
): Promise<T> {
  if (!TEM_PAGAMENTO) throw new ErroAsaas("Asaas não configurado", 503);
  const controlador = new AbortController();
  const relogio = setTimeout(() => controlador.abort(), TIMEOUT_MS);
  try {
    const resposta = await fetch(`${BASE}${caminho}`, {
      ...init,
      signal: controlador.signal,
      headers: {
        access_token: ENV.asaasApiKey!,
        "Content-Type": "application/json",
        "User-Agent": "zelo-de-casa",
        ...(init.headers ?? {}),
      },
      body: init.corpo !== undefined ? JSON.stringify(init.corpo) : init.body,
      cache: "no-store",
    });
    const texto = await resposta.text();
    const dados = texto ? JSON.parse(texto) : {};
    if (!resposta.ok) {
      const descricao =
        dados?.errors?.[0]?.description ?? `Falha na comunicação com o provedor (${resposta.status})`;
      throw new ErroAsaas(descricao, resposta.status, dados);
    }
    return dados as T;
  } catch (erro) {
    if (erro instanceof ErroAsaas) throw erro;
    const abortado = erro instanceof Error && erro.name === "AbortError";
    throw new ErroAsaas(
      abortado ? "Tempo esgotado na comunicação com o provedor" : "Falha de rede com o provedor",
      abortado ? 504 : 502,
      undefined,
      abortado,
    );
  } finally {
    clearTimeout(relogio);
  }
}

export type ClienteAsaas = { id: string };

export async function obterOuCriarCliente(dados: {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  cep: string;
  numero: string;
  complemento: string;
}): Promise<ClienteAsaas> {
  const busca = await chamada<{ data?: ClienteAsaas[] }>(
    `/customers?cpfCnpj=${encodeURIComponent(dados.cpf)}&limit=1`,
    { method: "GET" },
  );
  const existente = busca.data?.[0];
  if (existente) return existente;

  return chamada<ClienteAsaas>("/customers", {
    method: "POST",
    corpo: {
      name: dados.nome,
      cpfCnpj: dados.cpf,
      email: dados.email,
      mobilePhone: dados.telefone,
      postalCode: dados.cep,
      addressNumber: dados.numero || "S/N",
      complement: dados.complemento || undefined,
      notificationDisabled: true,
    },
  });
}

export type CobrancaAsaas = {
  id: string;
  status: string;
  value: number;
  dueDate: string;
  invoiceUrl?: string;
  externalReference?: string;
  creditCard?: { creditCardToken?: string };
};

export type QrCodePix = {
  encodedImage: string;
  payload: string;
  expirationDate: string | null;
};

function vencimentoHoje(): string {
  const hoje = new Date();
  const iso = new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60_000).toISOString();
  return iso.slice(0, 10);
}

export async function criarCobrancaPix(dados: {
  clienteId: string;
  valorCentavos: number;
  referencia: string;
  descricao: string;
}): Promise<CobrancaAsaas> {
  return chamada<CobrancaAsaas>("/payments", {
    method: "POST",
    corpo: {
      customer: dados.clienteId,
      billingType: "PIX",
      value: centavosParaReais(dados.valorCentavos),
      dueDate: vencimentoHoje(),
      description: dados.descricao,
      externalReference: dados.referencia,
    },
  });
}

export async function obterQrCodePix(pagamentoId: string): Promise<QrCodePix> {
  const dados = await chamada<{ encodedImage: string; payload: string; expirationDate?: string }>(
    `/payments/${pagamentoId}/pixQrCode`,
    { method: "GET" },
  );
  return {
    encodedImage: dados.encodedImage,
    payload: dados.payload,
    expirationDate: dados.expirationDate ?? null,
  };
}

export async function criarCobrancaCartao(dados: {
  clienteId: string;
  valorCentavos: number;
  parcelas: number;
  referencia: string;
  descricao: string;
  ipDoComprador: string;
  cartao: { titular: string; numero: string; mes: string; ano: string; cvv: string };
  titular: {
    nome: string;
    email: string;
    cpf: string;
    cep: string;
    numero: string;
    complemento: string;
    telefone: string;
  };
}): Promise<CobrancaAsaas> {
  const corpoBase: Record<string, unknown> = {
    customer: dados.clienteId,
    billingType: "CREDIT_CARD",
    dueDate: vencimentoHoje(),
    description: dados.descricao,
    externalReference: dados.referencia,
    remoteIp: dados.ipDoComprador,
    creditCard: {
      holderName: dados.cartao.titular,
      number: dados.cartao.numero,
      expiryMonth: dados.cartao.mes.padStart(2, "0"),
      expiryYear: dados.cartao.ano.length === 2 ? `20${dados.cartao.ano}` : dados.cartao.ano,
      ccv: dados.cartao.cvv,
    },
    creditCardHolderInfo: {
      name: dados.titular.nome,
      email: dados.titular.email,
      cpfCnpj: dados.titular.cpf,
      postalCode: dados.titular.cep,
      addressNumber: dados.titular.numero || "S/N",
      addressComplement: dados.titular.complemento || undefined,
      mobilePhone: dados.titular.telefone,
    },
  };

  if (dados.parcelas > 1) {
    corpoBase["installmentCount"] = dados.parcelas;
    corpoBase["totalValue"] = centavosParaReais(dados.valorCentavos);
  } else {
    corpoBase["value"] = centavosParaReais(dados.valorCentavos);
  }

  return chamada<CobrancaAsaas>("/payments", { method: "POST", corpo: corpoBase });
}

export async function consultarCobranca(pagamentoId: string): Promise<CobrancaAsaas> {
  return chamada<CobrancaAsaas>(`/payments/${pagamentoId}`, { method: "GET" });
}

/** Usada apos timeout de criacao: confere se a cobranca ja existe antes de tentar de novo. */
export async function buscarCobrancaPorReferencia(referencia: string): Promise<CobrancaAsaas | null> {
  const dados = await chamada<{ data?: CobrancaAsaas[] }>(
    `/payments?externalReference=${encodeURIComponent(referencia)}&limit=10`,
    { method: "GET" },
  );
  const lista = dados.data ?? [];
  const ativa = lista.find((c) => !["REFUNDED", "REFUND_REQUESTED"].includes(c.status));
  return ativa ?? lista[0] ?? null;
}

export async function cancelarCobranca(pagamentoId: string): Promise<void> {
  await chamada(`/payments/${pagamentoId}`, { method: "DELETE" });
}

export async function estornarCobranca(
  pagamentoId: string,
  valorCentavos?: number,
): Promise<CobrancaAsaas> {
  return chamada<CobrancaAsaas>(`/payments/${pagamentoId}/refund`, {
    method: "POST",
    corpo: valorCentavos ? { value: centavosParaReais(valorCentavos) } : {},
  });
}

/** Traducao dos status do Asaas para o vocabulario interno da loja. */
export function traduzirStatus(statusAsaas: string): StatusFinanceiro {
  switch (statusAsaas) {
    case "PENDING":
    case "AWAITING_PAYMENT":
      return "PENDENTE";
    case "AWAITING_RISK_ANALYSIS":
      return "EM_ANALISE";
    case "CONFIRMED":
      return "CONFIRMADO";
    case "RECEIVED":
    case "RECEIVED_IN_CASH":
      return "RECEBIDO";
    case "REPROVED_BY_RISK_ANALYSIS":
    case "CREDIT_CARD_CAPTURE_REFUSED":
      return "RECUSADO";
    case "REFUND_REQUESTED":
      return "ESTORNO_SOLICITADO";
    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
      return "ESTORNADO";
    case "CHARGEBACK_REQUESTED":
    case "CHARGEBACK_DISPUTE":
    case "AWAITING_CHARGEBACK_REVERSAL":
      return "CHARGEBACK";
    case "DELETED":
      return "CANCELADO";
    case "OVERDUE":
      return "PENDENTE";
    default:
      return "PENDENTE";
  }
}

/** Traducao dos eventos de webhook. Eventos desconhecidos nao alteram o pedido. */
export function statusDoEvento(evento: string): StatusFinanceiro | null {
  switch (evento) {
    case "PAYMENT_CREATED":
    case "PAYMENT_UPDATED":
    case "PAYMENT_OVERDUE":
      return "PENDENTE";
    case "PAYMENT_AWAITING_RISK_ANALYSIS":
      return "EM_ANALISE";
    case "PAYMENT_APPROVED_BY_RISK_ANALYSIS":
    case "PAYMENT_CONFIRMED":
      return "CONFIRMADO";
    case "PAYMENT_RECEIVED":
      return "RECEBIDO";
    case "PAYMENT_REPROVED_BY_RISK_ANALYSIS":
    case "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED":
      return "RECUSADO";
    case "PAYMENT_REFUND_REQUESTED":
      return "ESTORNO_SOLICITADO";
    case "PAYMENT_REFUNDED":
    case "PAYMENT_PARTIALLY_REFUNDED":
      return "ESTORNADO";
    case "PAYMENT_CHARGEBACK_REQUESTED":
    case "PAYMENT_CHARGEBACK_DISPUTE":
    case "PAYMENT_AWAITING_CHARGEBACK_REVERSAL":
      return "CHARGEBACK";
    case "PAYMENT_DELETED":
      return "CANCELADO";
    default:
      return null;
  }
}

/**
 * Ordem dos estados financeiros. Webhooks fora de ordem nao podem
 * rebaixar um pedido ja confirmado ou recebido.
 */
const PESO: Record<StatusFinanceiro, number> = {
  CRIADO: 0,
  PENDENTE: 1,
  EM_ANALISE: 2,
  RECUSADO: 3,
  CANCELADO: 3,
  CONFIRMADO: 4,
  RECEBIDO: 5,
  ESTORNO_SOLICITADO: 6,
  ESTORNADO: 7,
  CHARGEBACK: 8,
};

export function podeAvancar(atual: StatusFinanceiro, novo: StatusFinanceiro): boolean {
  if (atual === novo) return false;
  // Recusa e cancelamento nao sobrescrevem pagamento ja confirmado.
  if ((novo === "RECUSADO" || novo === "CANCELADO") && PESO[atual] >= PESO["CONFIRMADO"]) {
    return false;
  }
  return PESO[novo] > PESO[atual];
}
