import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { ENV, TEM_BANCO } from "./ambiente";
import type {
  Cupom,
  Envio,
  ItemPedido,
  NotaFiscal,
  Notificacao,
  Pagamento,
  Pedido,
  RegistroAuditoria,
  StatusFinanceiro,
  StatusLogistico,
} from "./tipos";

/**
 * Camada de dados. Com Supabase configurado grava nas tabelas com RLS.
 * Sem credenciais mantem tudo em memoria apenas para a demonstracao visual,
 * o que e explicitado na interface e reiniciado a cada processo.
 */

let clienteSupabase: SupabaseClient | null = null;
function supabase(): SupabaseClient {
  if (!clienteSupabase) {
    clienteSupabase = createClient(ENV.supabaseUrl!, ENV.supabaseServiceKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "x-application-name": "zelo-de-casa" } },
    });
  }
  return clienteSupabase;
}

// ----------------------------------------------------------------- memoria ---
type Desafio = {
  id: string;
  email: string;
  codigoHash: string;
  expiraEm: string;
  tentativas: number;
  reenvios: number;
  consumido: boolean;
  criadoEm: string;
};
type TokenAcesso = {
  id: string;
  pedidoId: string;
  tokenHash: string;
  expiraEm: string;
  usadoEm: string | null;
};

type Memoria = {
  pedidos: Map<string, Pedido>;
  cupons: Map<string, Cupom>;
  resgates: Set<string>;
  webhooks: Map<string, { processadoEm: string | null }>;
  notificacoes: Map<string, Notificacao>;
  auditoria: RegistroAuditoria[];
  desafios: Map<string, Desafio>;
  tokens: Map<string, TokenAcesso>;
};

// O armazenamento de demonstracao vive em globalThis para que paginas, acoes e
// rotas de API enxerguem os mesmos dados dentro do mesmo processo.
const globalComMemoria = globalThis as typeof globalThis & { __zeloMemoria?: Memoria };

const memoria: Memoria = (globalComMemoria.__zeloMemoria ??= {
  pedidos: new Map<string, Pedido>(),
  cupons: new Map<string, Cupom>([
    [
      "BEMVINDO10",
      {
        codigo: "BEMVINDO10",
        tipo: "PERCENTUAL",
        valor: 10,
        minimoCentavos: 20000,
        inicioEm: null,
        fimEm: null,
        limiteUsos: 50,
        usos: 0,
        ativo: true,
      },
    ],
  ]),
  resgates: new Set<string>(),
  webhooks: new Map<string, { processadoEm: string | null }>(),
  notificacoes: new Map<string, Notificacao>(),
  auditoria: [] as RegistroAuditoria[],
  desafios: new Map<string, Desafio>(),
  tokens: new Map<string, TokenAcesso>(),
});

const agora = () => new Date().toISOString();

// ----------------------------------------------------------------- pedidos ---
export type NovoPedido = Omit<Pedido, "id" | "criadoEm" | "atualizadoEm" | "pagamentos">;

export async function criarPedido(dados: NovoPedido): Promise<Pedido> {
  const pedido: Pedido = {
    ...dados,
    id: randomUUID(),
    criadoEm: agora(),
    atualizadoEm: agora(),
    pagamentos: [],
  };

  if (!TEM_BANCO) {
    memoria.pedidos.set(pedido.id, pedido);
    return pedido;
  }

  const db = supabase();
  const { error } = await db.from("orders").insert({
    id: pedido.id,
    numero: pedido.numero,
    nome: pedido.comprador.nome,
    cpf: pedido.comprador.cpf,
    email: pedido.comprador.email,
    whatsapp: pedido.comprador.whatsapp,
    cep: pedido.endereco.cep,
    logradouro: pedido.endereco.logradouro,
    numero_endereco: pedido.endereco.numero,
    sem_numero: pedido.endereco.semNumero,
    complemento: pedido.endereco.complemento,
    bairro: pedido.endereco.bairro,
    cidade: pedido.endereco.cidade,
    estado: pedido.endereco.estado,
    cupom: pedido.cupom,
    subtotal_centavos: pedido.subtotalCentavos,
    desconto_centavos: pedido.descontoCentavos,
    frete_centavos: pedido.freteCentavos,
    total_centavos: pedido.totalCentavos,
    status_financeiro: pedido.statusFinanceiro,
    status_logistico: pedido.statusLogistico,
  });
  if (error) throw new Error(`Falha ao gravar pedido: ${error.message}`);

  const itens = pedido.itens.map((item) => ({
    order_id: pedido.id,
    voltagem: item.voltagem,
    sku: item.sku,
    descricao: item.descricao,
    quantidade: item.quantidade,
    preco_unitario_centavos: item.precoUnitarioCentavos,
    desconto_centavos: item.descontoCentavos,
  }));
  const itensErro = (await db.from("order_items").insert(itens)).error;
  if (itensErro) throw new Error(`Falha ao gravar itens: ${itensErro.message}`);

  await db.from("legal_acceptances").insert({
    order_id: pedido.id,
    termos: pedido.consentimentos.termos,
    privacidade: pedido.consentimentos.privacidade,
    whatsapp_opt_in: pedido.consentimentos.whatsappOptIn,
    ip: pedido.consentimentos.ip,
    user_agent: pedido.consentimentos.userAgent,
  });

  return pedido;
}

type LinhaPedido = Record<string, unknown>;

function montarPedido(
  linha: LinhaPedido,
  itens: ItemPedido[],
  pagamentos: Pagamento[],
  envio: Envio | null,
  nota: NotaFiscal | null,
): Pedido {
  const s = (chave: string) => String(linha[chave] ?? "");
  const n = (chave: string) => Number(linha[chave] ?? 0);
  return {
    id: s("id"),
    numero: s("numero"),
    criadoEm: s("criado_em"),
    atualizadoEm: s("atualizado_em"),
    comprador: { nome: s("nome"), cpf: s("cpf"), email: s("email"), whatsapp: s("whatsapp") },
    endereco: {
      cep: s("cep"),
      logradouro: s("logradouro"),
      numero: s("numero_endereco"),
      semNumero: Boolean(linha["sem_numero"]),
      complemento: s("complemento"),
      bairro: s("bairro"),
      cidade: s("cidade"),
      estado: s("estado"),
    },
    consentimentos: {
      termos: true,
      privacidade: true,
      whatsappOptIn: Boolean(linha["whatsapp_opt_in"]),
      registradoEm: s("criado_em"),
      ip: null,
      userAgent: null,
    },
    itens,
    cupom: (linha["cupom"] as string | null) ?? null,
    subtotalCentavos: n("subtotal_centavos"),
    descontoCentavos: n("desconto_centavos"),
    freteCentavos: n("frete_centavos"),
    totalCentavos: n("total_centavos"),
    statusFinanceiro: s("status_financeiro") as StatusFinanceiro,
    statusLogistico: s("status_logistico") as StatusLogistico,
    pagamentos,
    envio,
    notaFiscal: nota,
    eventoCompraRegistrado: Boolean(linha["evento_compra_registrado"]),
    reembolso: linha["reembolso_solicitado_em"]
      ? {
          solicitadoEm: (linha["reembolso_solicitado_em"] as string) ?? null,
          concluidoEm: (linha["reembolso_concluido_em"] as string) ?? null,
          valorCentavos: n("reembolso_valor_centavos"),
        }
      : null,
    observacoesInternas: s("observacoes_internas"),
  };
}

function mapearPagamento(linha: LinhaPedido): Pagamento {
  return {
    id: String(linha["id"]),
    asaasPaymentId: (linha["asaas_payment_id"] as string | null) ?? null,
    asaasCustomerId: (linha["asaas_customer_id"] as string | null) ?? null,
    forma: linha["forma"] as "PIX" | "CARTAO",
    parcelas: Number(linha["parcelas"] ?? 1),
    valorCentavos: Number(linha["valor_centavos"] ?? 0),
    status: linha["status"] as StatusFinanceiro,
    chaveIdempotencia: String(linha["chave_idempotencia"]),
    ativo: Boolean(linha["ativo"]),
    pixCopiaECola: (linha["pix_copia_e_cola"] as string | null) ?? null,
    pixImagemBase64: (linha["pix_imagem_base64"] as string | null) ?? null,
    pixExpiraEm: (linha["pix_expira_em"] as string | null) ?? null,
    mensagemRecusa: (linha["mensagem_recusa"] as string | null) ?? null,
    criadoEm: String(linha["criado_em"]),
    atualizadoEm: String(linha["atualizado_em"]),
    demonstracao: Boolean(linha["demonstracao"]),
  };
}

async function carregarAgregados(linha: LinhaPedido): Promise<Pedido> {
  const db = supabase();
  const id = String(linha["id"]);
  const [itens, pagamentos, envio, nota, aceite] = await Promise.all([
    db.from("order_items").select("*").eq("order_id", id),
    db.from("payments").select("*").eq("order_id", id).order("criado_em", { ascending: true }),
    db.from("shipments").select("*").eq("order_id", id).maybeSingle(),
    db.from("invoices").select("*").eq("order_id", id).maybeSingle(),
    db.from("legal_acceptances").select("*").eq("order_id", id).maybeSingle(),
  ]);

  const pedido = montarPedido(
    { ...linha, whatsapp_opt_in: aceite.data?.["whatsapp_opt_in"] ?? false },
    (itens.data ?? []).map((i) => ({
      voltagem: i["voltagem"],
      sku: i["sku"],
      descricao: i["descricao"],
      quantidade: i["quantidade"],
      precoUnitarioCentavos: i["preco_unitario_centavos"],
      descontoCentavos: i["desconto_centavos"],
    })),
    (pagamentos.data ?? []).map(mapearPagamento),
    envio.data
      ? {
          transportadora: envio.data["transportadora"],
          codigo: envio.data["codigo"],
          url: envio.data["url"] ?? null,
          postadoEm: envio.data["postado_em"] ?? null,
        }
      : null,
    nota.data
      ? {
          caminho: nota.data["caminho"],
          hash: nota.data["hash"],
          nomeArquivo: nota.data["nome_arquivo"],
          enviadaEm: nota.data["enviada_em"],
        }
      : null,
  );
  return pedido;
}

export async function obterPedidoPorNumero(numero: string): Promise<Pedido | null> {
  if (!TEM_BANCO) {
    for (const pedido of memoria.pedidos.values()) if (pedido.numero === numero) return pedido;
    return null;
  }
  const { data } = await supabase().from("orders").select("*").eq("numero", numero).maybeSingle();
  return data ? carregarAgregados(data) : null;
}

export async function obterPedidoPorId(id: string): Promise<Pedido | null> {
  if (!TEM_BANCO) return memoria.pedidos.get(id) ?? null;
  const { data } = await supabase().from("orders").select("*").eq("id", id).maybeSingle();
  return data ? carregarAgregados(data) : null;
}

export async function obterPedidoPorPagamentoAsaas(asaasId: string): Promise<Pedido | null> {
  if (!TEM_BANCO) {
    for (const pedido of memoria.pedidos.values()) {
      if (pedido.pagamentos.some((p) => p.asaasPaymentId === asaasId)) return pedido;
    }
    return null;
  }
  const { data } = await supabase()
    .from("payments")
    .select("order_id")
    .eq("asaas_payment_id", asaasId)
    .maybeSingle();
  if (!data) return null;
  return obterPedidoPorId(String(data["order_id"]));
}

export type PatchPedido = Partial<
  Pick<
    Pedido,
    | "statusFinanceiro"
    | "statusLogistico"
    | "eventoCompraRegistrado"
    | "observacoesInternas"
    | "reembolso"
    | "envio"
    | "notaFiscal"
  >
>;

export async function atualizarPedido(id: string, patch: PatchPedido): Promise<Pedido | null> {
  if (!TEM_BANCO) {
    const pedido = memoria.pedidos.get(id);
    if (!pedido) return null;
    const atualizado: Pedido = { ...pedido, ...patch, atualizadoEm: agora() };
    memoria.pedidos.set(id, atualizado);
    return atualizado;
  }

  const db = supabase();
  const linha: Record<string, unknown> = { atualizado_em: agora() };
  if (patch.statusFinanceiro) linha["status_financeiro"] = patch.statusFinanceiro;
  if (patch.statusLogistico) linha["status_logistico"] = patch.statusLogistico;
  if (patch.eventoCompraRegistrado !== undefined)
    linha["evento_compra_registrado"] = patch.eventoCompraRegistrado;
  if (patch.observacoesInternas !== undefined)
    linha["observacoes_internas"] = patch.observacoesInternas;
  if (patch.reembolso !== undefined) {
    linha["reembolso_solicitado_em"] = patch.reembolso?.solicitadoEm ?? null;
    linha["reembolso_concluido_em"] = patch.reembolso?.concluidoEm ?? null;
    linha["reembolso_valor_centavos"] = patch.reembolso?.valorCentavos ?? null;
  }
  await db.from("orders").update(linha).eq("id", id);

  if (patch.envio !== undefined && patch.envio) {
    await db.from("shipments").upsert({
      order_id: id,
      transportadora: patch.envio.transportadora,
      codigo: patch.envio.codigo,
      url: patch.envio.url,
      postado_em: patch.envio.postadoEm,
      atualizado_em: agora(),
    });
  }
  if (patch.notaFiscal !== undefined && patch.notaFiscal) {
    await db.from("invoices").upsert({
      order_id: id,
      caminho: patch.notaFiscal.caminho,
      hash: patch.notaFiscal.hash,
      nome_arquivo: patch.notaFiscal.nomeArquivo,
      enviada_em: patch.notaFiscal.enviadaEm,
    });
  }
  return obterPedidoPorId(id);
}

export type FiltroPedidos = {
  busca?: string;
  statusFinanceiro?: StatusFinanceiro | "TODOS";
  statusLogistico?: StatusLogistico | "TODOS";
  limite?: number;
};

export async function listarPedidos(filtro: FiltroPedidos = {}): Promise<Pedido[]> {
  const limite = Math.min(filtro.limite ?? 50, 200);
  if (!TEM_BANCO) {
    let lista = [...memoria.pedidos.values()].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
    if (filtro.statusFinanceiro && filtro.statusFinanceiro !== "TODOS")
      lista = lista.filter((p) => p.statusFinanceiro === filtro.statusFinanceiro);
    if (filtro.statusLogistico && filtro.statusLogistico !== "TODOS")
      lista = lista.filter((p) => p.statusLogistico === filtro.statusLogistico);
    if (filtro.busca) {
      const busca = filtro.busca.toLowerCase();
      lista = lista.filter(
        (p) =>
          p.numero.toLowerCase().includes(busca) ||
          p.comprador.nome.toLowerCase().includes(busca) ||
          p.comprador.email.toLowerCase().includes(busca),
      );
    }
    return lista.slice(0, limite);
  }

  let consulta = supabase().from("orders").select("*").order("criado_em", { ascending: false }).limit(limite);
  if (filtro.statusFinanceiro && filtro.statusFinanceiro !== "TODOS")
    consulta = consulta.eq("status_financeiro", filtro.statusFinanceiro);
  if (filtro.statusLogistico && filtro.statusLogistico !== "TODOS")
    consulta = consulta.eq("status_logistico", filtro.statusLogistico);
  if (filtro.busca) {
    const termo = `%${filtro.busca}%`;
    consulta = consulta.or(`numero.ilike.${termo},nome.ilike.${termo},email.ilike.${termo}`);
  }
  const { data } = await consulta;
  return Promise.all((data ?? []).map(carregarAgregados));
}

// --------------------------------------------------------------- pagamentos ---
export async function desativarPagamentos(pedidoId: string): Promise<void> {
  if (!TEM_BANCO) {
    const pedido = memoria.pedidos.get(pedidoId);
    if (pedido) pedido.pagamentos = pedido.pagamentos.map((p) => ({ ...p, ativo: false }));
    return;
  }
  await supabase().from("payments").update({ ativo: false, atualizado_em: agora() }).eq("order_id", pedidoId);
}

export async function salvarPagamento(
  pedidoId: string,
  pagamento: Omit<Pagamento, "id" | "criadoEm" | "atualizadoEm">,
): Promise<Pagamento> {
  const registro: Pagamento = {
    ...pagamento,
    id: randomUUID(),
    criadoEm: agora(),
    atualizadoEm: agora(),
  };
  if (!TEM_BANCO) {
    const pedido = memoria.pedidos.get(pedidoId);
    if (pedido) pedido.pagamentos = [...pedido.pagamentos, registro];
    return registro;
  }
  const { error } = await supabase().from("payments").insert({
    id: registro.id,
    order_id: pedidoId,
    asaas_payment_id: registro.asaasPaymentId,
    asaas_customer_id: registro.asaasCustomerId,
    forma: registro.forma,
    parcelas: registro.parcelas,
    valor_centavos: registro.valorCentavos,
    status: registro.status,
    chave_idempotencia: registro.chaveIdempotencia,
    ativo: registro.ativo,
    pix_copia_e_cola: registro.pixCopiaECola,
    pix_imagem_base64: registro.pixImagemBase64,
    pix_expira_em: registro.pixExpiraEm,
    mensagem_recusa: registro.mensagemRecusa,
    demonstracao: registro.demonstracao,
  });
  if (error) throw new Error(`Falha ao gravar pagamento: ${error.message}`);
  return registro;
}

export async function buscarPagamentoPorIdempotencia(chave: string): Promise<Pagamento | null> {
  if (!TEM_BANCO) {
    for (const pedido of memoria.pedidos.values()) {
      const encontrado = pedido.pagamentos.find((p) => p.chaveIdempotencia === chave);
      if (encontrado) return encontrado;
    }
    return null;
  }
  const { data } = await supabase()
    .from("payments")
    .select("*")
    .eq("chave_idempotencia", chave)
    .maybeSingle();
  return data ? mapearPagamento(data) : null;
}

export async function atualizarPagamento(
  pagamentoId: string,
  patch: Partial<Pagamento>,
): Promise<void> {
  if (!TEM_BANCO) {
    for (const pedido of memoria.pedidos.values()) {
      const indice = pedido.pagamentos.findIndex((p) => p.id === pagamentoId);
      if (indice >= 0) {
        const atual = pedido.pagamentos[indice]!;
        pedido.pagamentos[indice] = { ...atual, ...patch, atualizadoEm: agora() };
        return;
      }
    }
    return;
  }
  const linha: Record<string, unknown> = { atualizado_em: agora() };
  if (patch.status) linha["status"] = patch.status;
  if (patch.ativo !== undefined) linha["ativo"] = patch.ativo;
  if (patch.asaasPaymentId !== undefined) linha["asaas_payment_id"] = patch.asaasPaymentId;
  if (patch.pixCopiaECola !== undefined) linha["pix_copia_e_cola"] = patch.pixCopiaECola;
  if (patch.pixImagemBase64 !== undefined) linha["pix_imagem_base64"] = patch.pixImagemBase64;
  if (patch.pixExpiraEm !== undefined) linha["pix_expira_em"] = patch.pixExpiraEm;
  if (patch.mensagemRecusa !== undefined) linha["mensagem_recusa"] = patch.mensagemRecusa;
  await supabase().from("payments").update(linha).eq("id", pagamentoId);
}

// ------------------------------------------------------------------- cupons ---
export async function obterCupom(codigo: string): Promise<Cupom | null> {
  const chave = codigo.trim().toUpperCase();
  if (!chave) return null;
  if (!TEM_BANCO) return memoria.cupons.get(chave) ?? null;
  const { data } = await supabase().from("coupons").select("*").eq("codigo", chave).maybeSingle();
  if (!data) return null;
  return {
    codigo: data["codigo"],
    tipo: data["tipo"],
    valor: data["valor"],
    minimoCentavos: data["minimo_centavos"],
    inicioEm: data["inicio_em"],
    fimEm: data["fim_em"],
    limiteUsos: data["limite_usos"],
    usos: data["usos"],
    ativo: data["ativo"],
  };
}

/** Resgate atomico. No Supabase usa a funcao resgatar_cupom com lock de linha. */
export async function resgatarCupom(codigo: string, pedidoId: string): Promise<boolean> {
  const chave = codigo.trim().toUpperCase();
  if (!TEM_BANCO) {
    const cupom = memoria.cupons.get(chave);
    if (!cupom || !cupom.ativo) return false;
    if (cupom.limiteUsos !== null && cupom.usos >= cupom.limiteUsos) return false;
    if (memoria.resgates.has(pedidoId)) return true;
    memoria.resgates.add(pedidoId);
    cupom.usos += 1;
    return true;
  }
  const { data, error } = await supabase().rpc("resgatar_cupom", {
    p_codigo: chave,
    p_order_id: pedidoId,
  });
  if (error) return false;
  return Boolean(data);
}

export async function listarCupons(): Promise<Cupom[]> {
  if (!TEM_BANCO) return [...memoria.cupons.values()];
  const { data } = await supabase().from("coupons").select("*").order("criado_em", { ascending: false });
  return (data ?? []).map((d) => ({
    codigo: d["codigo"],
    tipo: d["tipo"],
    valor: d["valor"],
    minimoCentavos: d["minimo_centavos"],
    inicioEm: d["inicio_em"],
    fimEm: d["fim_em"],
    limiteUsos: d["limite_usos"],
    usos: d["usos"],
    ativo: d["ativo"],
  }));
}

export async function salvarCupom(cupom: Omit<Cupom, "usos">): Promise<void> {
  const chave = cupom.codigo.trim().toUpperCase();
  if (!TEM_BANCO) {
    const atual = memoria.cupons.get(chave);
    memoria.cupons.set(chave, { ...cupom, codigo: chave, usos: atual?.usos ?? 0 });
    return;
  }
  await supabase().from("coupons").upsert({
    codigo: chave,
    tipo: cupom.tipo,
    valor: cupom.valor,
    minimo_centavos: cupom.minimoCentavos,
    inicio_em: cupom.inicioEm,
    fim_em: cupom.fimEm,
    limite_usos: cupom.limiteUsos,
    ativo: cupom.ativo,
  });
}

// ----------------------------------------------------------------- webhooks ---
export async function registrarWebhook(
  id: string,
  evento: string,
  payload: unknown,
): Promise<{ novo: boolean }> {
  if (!TEM_BANCO) {
    if (memoria.webhooks.has(id)) return { novo: false };
    memoria.webhooks.set(id, { processadoEm: null });
    return { novo: true };
  }
  const { error } = await supabase().from("webhook_events").insert({ id, evento, payload });
  if (error) {
    // conflito de chave primaria significa evento repetido
    return { novo: false };
  }
  return { novo: true };
}

export async function marcarWebhookProcessado(id: string): Promise<void> {
  if (!TEM_BANCO) {
    memoria.webhooks.set(id, { processadoEm: agora() });
    return;
  }
  await supabase().from("webhook_events").update({ processado_em: agora() }).eq("id", id);
}

// ------------------------------------------------------------ notificacoes ---
export async function enfileirarNotificacao(dados: {
  pedidoId: string;
  evento: string;
  canal: "EMAIL" | "WHATSAPP";
  destinatario: string;
}): Promise<void> {
  const chave = `${dados.pedidoId}:${dados.evento}:${dados.canal}:${dados.destinatario}`;
  const registro: Notificacao = {
    id: randomUUID(),
    pedidoId: dados.pedidoId,
    evento: dados.evento,
    canal: dados.canal,
    destinatario: dados.destinatario,
    chaveDeduplicacao: chave,
    tentativas: 0,
    status: "PENDENTE",
    erro: null,
    criadoEm: agora(),
    atualizadoEm: agora(),
  };
  if (!TEM_BANCO) {
    if ([...memoria.notificacoes.values()].some((n) => n.chaveDeduplicacao === chave)) return;
    memoria.notificacoes.set(registro.id, registro);
    return;
  }
  await supabase().from("notifications").insert({
    id: registro.id,
    order_id: registro.pedidoId,
    evento: registro.evento,
    canal: registro.canal,
    destinatario: registro.destinatario,
    chave_deduplicacao: chave,
  });
}

export async function listarNotificacoesPendentes(limite = 20): Promise<Notificacao[]> {
  if (!TEM_BANCO) {
    return [...memoria.notificacoes.values()]
      .filter((n) => n.status === "PENDENTE" && n.tentativas < 5)
      .slice(0, limite);
  }
  const { data } = await supabase()
    .from("notifications")
    .select("*")
    .eq("status", "PENDENTE")
    .lt("tentativas", 5)
    .order("criado_em", { ascending: true })
    .limit(limite);
  return (data ?? []).map((d) => ({
    id: d["id"],
    pedidoId: d["order_id"],
    evento: d["evento"],
    canal: d["canal"],
    destinatario: d["destinatario"],
    chaveDeduplicacao: d["chave_deduplicacao"],
    tentativas: d["tentativas"],
    status: d["status"],
    erro: d["erro"],
    criadoEm: d["criado_em"],
    atualizadoEm: d["atualizado_em"],
  }));
}

export async function atualizarNotificacao(
  id: string,
  patch: Partial<Pick<Notificacao, "status" | "tentativas" | "erro">>,
): Promise<void> {
  if (!TEM_BANCO) {
    const atual = memoria.notificacoes.get(id);
    if (atual) memoria.notificacoes.set(id, { ...atual, ...patch, atualizadoEm: agora() });
    return;
  }
  await supabase()
    .from("notifications")
    .update({ ...patch, atualizado_em: agora() })
    .eq("id", id);
}

export async function listarNotificacoesDoPedido(pedidoId: string): Promise<Notificacao[]> {
  if (!TEM_BANCO) {
    return [...memoria.notificacoes.values()].filter((n) => n.pedidoId === pedidoId);
  }
  const { data } = await supabase()
    .from("notifications")
    .select("*")
    .eq("order_id", pedidoId)
    .order("criado_em", { ascending: false });
  return (data ?? []).map((d) => ({
    id: d["id"],
    pedidoId: d["order_id"],
    evento: d["evento"],
    canal: d["canal"],
    destinatario: d["destinatario"],
    chaveDeduplicacao: d["chave_deduplicacao"],
    tentativas: d["tentativas"],
    status: d["status"],
    erro: d["erro"],
    criadoEm: d["criado_em"],
    atualizadoEm: d["atualizado_em"],
  }));
}

// --------------------------------------------------------------- auditoria ---
export async function registrarAuditoria(dados: {
  ator: string;
  acao: string;
  recurso: string;
  detalhes?: Record<string, unknown>;
}): Promise<void> {
  const registro: RegistroAuditoria = {
    id: randomUUID(),
    criadoEm: agora(),
    ator: dados.ator,
    acao: dados.acao,
    recurso: dados.recurso,
    detalhes: dados.detalhes ?? {},
  };
  if (!TEM_BANCO) {
    memoria.auditoria.unshift(registro);
    return;
  }
  await supabase().from("admin_audit").insert({
    id: registro.id,
    ator: registro.ator,
    acao: registro.acao,
    recurso: registro.recurso,
    detalhes: registro.detalhes,
  });
}

export async function listarAuditoria(limite = 50): Promise<RegistroAuditoria[]> {
  if (!TEM_BANCO) return memoria.auditoria.slice(0, limite);
  const { data } = await supabase()
    .from("admin_audit")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(limite);
  return (data ?? []).map((d) => ({
    id: d["id"],
    criadoEm: d["criado_em"],
    ator: d["ator"],
    acao: d["acao"],
    recurso: d["recurso"],
    detalhes: d["detalhes"] ?? {},
  }));
}

// ------------------------------------------------------- desafio do admin ---
export async function criarDesafioAdmin(email: string, codigoHash: string, minutos: number) {
  const registro: Desafio = {
    id: randomUUID(),
    email,
    codigoHash,
    expiraEm: new Date(Date.now() + minutos * 60_000).toISOString(),
    tentativas: 0,
    reenvios: 0,
    consumido: false,
    criadoEm: agora(),
  };
  if (!TEM_BANCO) {
    memoria.desafios.set(registro.id, registro);
    return registro;
  }
  await supabase().from("admin_challenges").insert({
    id: registro.id,
    email,
    codigo_hash: codigoHash,
    expira_em: registro.expiraEm,
  });
  return registro;
}

export async function obterDesafioAdmin(id: string): Promise<Desafio | null> {
  if (!TEM_BANCO) return memoria.desafios.get(id) ?? null;
  const { data } = await supabase().from("admin_challenges").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  return {
    id: data["id"],
    email: data["email"],
    codigoHash: data["codigo_hash"],
    expiraEm: data["expira_em"],
    tentativas: data["tentativas"],
    reenvios: data["reenvios"],
    consumido: data["consumido"],
    criadoEm: data["criado_em"],
  };
}

export async function atualizarDesafioAdmin(id: string, patch: Partial<Desafio>): Promise<void> {
  if (!TEM_BANCO) {
    const atual = memoria.desafios.get(id);
    if (atual) memoria.desafios.set(id, { ...atual, ...patch });
    return;
  }
  const linha: Record<string, unknown> = {};
  if (patch.tentativas !== undefined) linha["tentativas"] = patch.tentativas;
  if (patch.consumido !== undefined) linha["consumido"] = patch.consumido;
  if (patch.reenvios !== undefined) linha["reenvios"] = patch.reenvios;
  await supabase().from("admin_challenges").update(linha).eq("id", id);
}

// ----------------------------------------------- acesso temporario ao pedido ---
export async function criarTokenAcesso(pedidoId: string, tokenHash: string, minutos: number) {
  const registro: TokenAcesso = {
    id: randomUUID(),
    pedidoId,
    tokenHash,
    expiraEm: new Date(Date.now() + minutos * 60_000).toISOString(),
    usadoEm: null,
  };
  if (!TEM_BANCO) {
    memoria.tokens.set(tokenHash, registro);
    return registro;
  }
  await supabase().from("order_access_tokens").insert({
    id: registro.id,
    order_id: pedidoId,
    token_hash: tokenHash,
    expira_em: registro.expiraEm,
  });
  return registro;
}

export async function consumirTokenAcesso(tokenHash: string): Promise<string | null> {
  if (!TEM_BANCO) {
    const registro = memoria.tokens.get(tokenHash);
    if (!registro) return null;
    if (new Date(registro.expiraEm) < new Date()) return null;
    return registro.pedidoId;
  }
  const { data } = await supabase()
    .from("order_access_tokens")
    .select("*")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (!data) return null;
  if (new Date(String(data["expira_em"])) < new Date()) return null;
  await supabase().from("order_access_tokens").update({ usado_em: agora() }).eq("id", data["id"]);
  return String(data["order_id"]);
}
