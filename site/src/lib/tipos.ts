import type { CodigoVoltagem } from "./produto";

export type StatusFinanceiro =
  | "CRIADO"
  | "PENDENTE"
  | "EM_ANALISE"
  | "CONFIRMADO"
  | "RECEBIDO"
  | "RECUSADO"
  | "ESTORNO_SOLICITADO"
  | "ESTORNADO"
  | "CHARGEBACK"
  | "CANCELADO";

export type StatusLogistico =
  | "AGUARDANDO_PAGAMENTO"
  | "EM_PREPARACAO"
  | "POSTADO"
  | "ENTREGUE"
  | "CANCELADO";

export type ItemPedido = {
  voltagem: CodigoVoltagem;
  sku: string;
  descricao: string;
  quantidade: number;
  precoUnitarioCentavos: number;
  descontoCentavos: number;
};

export type Comprador = {
  nome: string;
  cpf: string;
  email: string;
  whatsapp: string;
};

export type Endereco = {
  cep: string;
  logradouro: string;
  numero: string;
  semNumero: boolean;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
};

export type Consentimentos = {
  termos: boolean;
  privacidade: boolean;
  whatsappOptIn: boolean;
  registradoEm: string;
  ip: string | null;
  userAgent: string | null;
};

export type Pagamento = {
  id: string;
  asaasPaymentId: string | null;
  asaasCustomerId: string | null;
  forma: "PIX" | "CARTAO";
  parcelas: number;
  valorCentavos: number;
  status: StatusFinanceiro;
  chaveIdempotencia: string;
  ativo: boolean;
  pixCopiaECola: string | null;
  pixImagemBase64: string | null;
  pixExpiraEm: string | null;
  mensagemRecusa: string | null;
  criadoEm: string;
  atualizadoEm: string;
  demonstracao: boolean;
};

export type Envio = {
  transportadora: string;
  codigo: string;
  url: string | null;
  postadoEm: string | null;
};

export type NotaFiscal = {
  caminho: string;
  hash: string;
  enviadaEm: string;
  nomeArquivo: string;
};

export type Pedido = {
  id: string;
  numero: string;
  criadoEm: string;
  atualizadoEm: string;
  comprador: Comprador;
  endereco: Endereco;
  consentimentos: Consentimentos;
  itens: ItemPedido[];
  cupom: string | null;
  subtotalCentavos: number;
  descontoCentavos: number;
  freteCentavos: number;
  totalCentavos: number;
  statusFinanceiro: StatusFinanceiro;
  statusLogistico: StatusLogistico;
  pagamentos: Pagamento[];
  envio: Envio | null;
  notaFiscal: NotaFiscal | null;
  eventoCompraRegistrado: boolean;
  reembolso: { solicitadoEm: string | null; concluidoEm: string | null; valorCentavos: number } | null;
  observacoesInternas: string;
};

export type Cupom = {
  codigo: string;
  tipo: "PERCENTUAL" | "VALOR";
  valor: number;
  minimoCentavos: number;
  inicioEm: string | null;
  fimEm: string | null;
  limiteUsos: number | null;
  usos: number;
  ativo: boolean;
};

export type Notificacao = {
  id: string;
  pedidoId: string;
  evento: string;
  canal: "EMAIL" | "WHATSAPP";
  destinatario: string;
  chaveDeduplicacao: string;
  tentativas: number;
  status: "PENDENTE" | "ACEITA" | "FALHA" | "IGNORADA";
  erro: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

export type RegistroAuditoria = {
  id: string;
  criadoEm: string;
  ator: string;
  acao: string;
  recurso: string;
  detalhes: Record<string, unknown>;
};

export const STATUS_FINANCEIRO_ROTULO: Record<StatusFinanceiro, string> = {
  CRIADO: "Pedido criado",
  PENDENTE: "Aguardando pagamento",
  EM_ANALISE: "Pagamento em análise",
  CONFIRMADO: "Pagamento confirmado",
  RECEBIDO: "Pagamento recebido",
  RECUSADO: "Pagamento recusado",
  ESTORNO_SOLICITADO: "Estorno solicitado",
  ESTORNADO: "Estornado",
  CHARGEBACK: "Chargeback",
  CANCELADO: "Cancelado",
};

export const STATUS_LOGISTICO_ROTULO: Record<StatusLogistico, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  EM_PREPARACAO: "Em preparação",
  POSTADO: "Postado",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export const PAGO: StatusFinanceiro[] = ["CONFIRMADO", "RECEBIDO"];
