import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FormularioAcao } from "@/components/admin/FormularioAcao";
import { formatarCentavos } from "@/lib/dinheiro";
import { MODO_DEMONSTRACAO } from "@/lib/ambiente";
import { listarAuditoria, listarNotificacoesDoPedido, obterPedidoPorNumero } from "@/lib/repositorio";
import { sessaoValida } from "@/lib/sessao-admin";
import { PAGO, STATUS_FINANCEIRO_ROTULO, STATUS_LOGISTICO_ROTULO } from "@/lib/tipos";
import {
  alterarStatusLogistico,
  cancelarPedido,
  confirmarPagamentoManual,
  enviarNotaFiscal,
  salvarRastreamento,
  solicitarReembolso,
} from "../../acoes";

export default async function DetalhePedido({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  if (!(await sessaoValida())) redirect("/admin");
  const { numero } = await params;
  const pedido = await obterPedidoPorNumero(numero);
  if (!pedido) notFound();

  const notificacoes = await listarNotificacoesDoPedido(pedido.id);
  const auditoria = (await listarAuditoria(80)).filter((r) => r.recurso === pedido.numero);
  const pago = PAGO.includes(pedido.statusFinanceiro);

  return (
    <>
      <p style={{ marginBottom: 10 }}>
        <Link href="/admin/pedidos">Voltar para a lista</Link>
      </p>
      <div className="painel__topo">
        <div>
          <h1 style={{ fontSize: 30 }}>Pedido {pedido.numero}</h1>
          <p className="texto-suave" style={{ margin: 0 }}>
            Criado em{" "}
            {new Date(pedido.criadoEm).toLocaleString("pt-BR", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span className={pago ? "selo-status selo-status--pago" : "selo-status selo-status--aguardando"}>
            {STATUS_FINANCEIRO_ROTULO[pedido.statusFinanceiro]}
          </span>
          <span className="selo-status selo-status--neutro">
            {STATUS_LOGISTICO_ROTULO[pedido.statusLogistico]}
          </span>
        </div>
      </div>

      <div className="checkout__grade">
        <div>
          <section className="bloco">
            <h2>Itens</h2>
            {pedido.itens.map((item) => (
              <div className="resumo-item" key={item.voltagem}>
                <span>
                  {item.descricao} · {item.quantidade} un · SKU {item.sku}
                </span>
                <strong>{formatarCentavos(item.quantidade * item.precoUnitarioCentavos)}</strong>
              </div>
            ))}
            {pedido.descontoCentavos > 0 && (
              <div className="resumo-item">
                <span>Cupom {pedido.cupom}</span>
                <strong>- {formatarCentavos(pedido.descontoCentavos)}</strong>
              </div>
            )}
            <div className="resumo-item" style={{ borderBottom: 0 }}>
              <span style={{ fontWeight: 700, color: "var(--tinta)" }}>Total</span>
              <strong>{formatarCentavos(pedido.totalCentavos)}</strong>
            </div>
          </section>

          <section className="bloco">
            <h2>Cliente e entrega</h2>
            <p style={{ color: "var(--suave)" }}>
              {pedido.comprador.nome}
              <br />
              CPF {pedido.comprador.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
              <br />
              {pedido.comprador.email} · {pedido.comprador.whatsapp}
            </p>
            <p style={{ color: "var(--suave)" }}>
              {pedido.endereco.logradouro}, {pedido.endereco.semNumero ? "S/N" : pedido.endereco.numero}
              {pedido.endereco.complemento ? ` · ${pedido.endereco.complemento}` : ""}
              <br />
              {pedido.endereco.bairro} · {pedido.endereco.cidade} {pedido.endereco.estado}
              <br />
              CEP {pedido.endereco.cep}
            </p>
            <p className="texto-pequeno texto-suave" style={{ margin: 0 }}>
              WhatsApp autorizado: {pedido.consentimentos.whatsappOptIn ? "sim" : "não"}
            </p>
          </section>

          <section className="bloco">
            <h2>Pagamentos</h2>
            {pedido.pagamentos.length === 0 && <p className="texto-suave">Nenhuma tentativa registrada</p>}
            {pedido.pagamentos.map((pagamento) => (
              <div className="resumo-item" key={pagamento.id}>
                <span>
                  {pagamento.forma === "PIX" ? "Pix" : `Cartão ${pagamento.parcelas}x`}
                  {pagamento.demonstracao ? " · demonstração" : ""}
                  <br />
                  <span className="texto-suave" style={{ fontSize: 13 }}>
                    {pagamento.asaasPaymentId ?? "sem identificador"} ·{" "}
                    {new Date(pagamento.criadoEm).toLocaleString("pt-BR")}
                    {pagamento.ativo ? " · tentativa ativa" : ""}
                  </span>
                </span>
                <strong>{STATUS_FINANCEIRO_ROTULO[pagamento.status]}</strong>
              </div>
            ))}

            {MODO_DEMONSTRACAO && !pago && (
              <FormularioAcao
                acao={confirmarPagamentoManual}
                textoBotao="Confirmar pagamento, apenas demonstração"
                variante="contorno"
              >
                <input type="hidden" name="numero" value={pedido.numero} />
              </FormularioAcao>
            )}
          </section>

          <section className="bloco">
            <h2>Notificações</h2>
            {notificacoes.length === 0 && <p className="texto-suave">Nada na fila deste pedido</p>}
            {notificacoes.map((n) => (
              <div className="resumo-item" key={n.id}>
                <span>
                  {n.evento} · {n.canal}
                  <br />
                  <span className="texto-suave" style={{ fontSize: 13 }}>
                    {n.destinatario} · {n.tentativas} tentativa{n.tentativas === 1 ? "" : "s"}
                    {n.erro ? ` · ${n.erro}` : ""}
                  </span>
                </span>
                <strong>{n.status}</strong>
              </div>
            ))}
          </section>

          <section className="bloco">
            <h2>Auditoria</h2>
            {auditoria.length === 0 && <p className="texto-suave">Sem registros para este pedido</p>}
            {auditoria.map((registro) => (
              <div className="resumo-item" key={registro.id}>
                <span>
                  {registro.acao}
                  <br />
                  <span className="texto-suave" style={{ fontSize: 13 }}>
                    {registro.ator} ·{" "}
                    {new Date(registro.criadoEm).toLocaleString("pt-BR")}
                  </span>
                </span>
              </div>
            ))}
          </section>
        </div>

        <div>
          <section className="bloco">
            <h2>Rastreamento</h2>
            {pedido.envio && (
              <p className="texto-suave" style={{ fontSize: 14 }}>
                Atual: {pedido.envio.transportadora} · {pedido.envio.codigo}
              </p>
            )}
            <FormularioAcao acao={salvarRastreamento} textoBotao="Salvar e avisar o cliente">
              <input type="hidden" name="numero" value={pedido.numero} />
              <div className="grade-campos" style={{ marginBottom: 18 }}>
                <div className="campo">
                  <label htmlFor="transportadora">Transportadora</label>
                  <input
                    id="transportadora"
                    name="transportadora"
                    defaultValue={pedido.envio?.transportadora ?? ""}
                    required
                  />
                </div>
                <div className="campo">
                  <label htmlFor="codigo">Código</label>
                  <input id="codigo" name="codigo" defaultValue={pedido.envio?.codigo ?? ""} required />
                </div>
                <div className="campo">
                  <label htmlFor="url">Link https de rastreamento</label>
                  <input id="url" name="url" type="url" defaultValue={pedido.envio?.url ?? ""} />
                </div>
              </div>
            </FormularioAcao>
          </section>

          <section className="bloco">
            <h2>Status logístico</h2>
            <FormularioAcao acao={alterarStatusLogistico} textoBotao="Atualizar status" variante="contorno">
              <input type="hidden" name="numero" value={pedido.numero} />
              <div className="campo" style={{ marginBottom: 18 }}>
                <label htmlFor="statusLogistico">Novo status</label>
                <select id="statusLogistico" name="statusLogistico" defaultValue={pedido.statusLogistico}>
                  {Object.entries(STATUS_LOGISTICO_ROTULO).map(([chave, rotulo]) => (
                    <option key={chave} value={chave}>
                      {rotulo}
                    </option>
                  ))}
                </select>
                <small>Entregue depende de conferência manual, não há integração automática</small>
              </div>
            </FormularioAcao>
          </section>

          <section className="bloco">
            <h2>Nota fiscal</h2>
            {pedido.notaFiscal ? (
              <p className="texto-suave" style={{ fontSize: 14 }}>
                Anexada em {new Date(pedido.notaFiscal.enviadaEm).toLocaleString("pt-BR")}
                <br />
                hash {pedido.notaFiscal.hash.slice(0, 16)}
              </p>
            ) : (
              <p className="texto-suave" style={{ fontSize: 14 }}>
                Nenhum documento anexado. A emissão acontece fora do site.
              </p>
            )}
            <FormularioAcao
              acao={enviarNotaFiscal}
              textoBotao="Anexar nota fiscal"
              variante="contorno"
              encTypeArquivo
            >
              <input type="hidden" name="numero" value={pedido.numero} />
              <div className="campo" style={{ marginBottom: 18 }}>
                <label htmlFor="arquivo">Arquivo PDF ou XML</label>
                <input id="arquivo" name="arquivo" type="file" accept=".pdf,.xml" required />
              </div>
            </FormularioAcao>
          </section>

          <section className="bloco">
            <h2>Cancelamento</h2>
            <FormularioAcao acao={cancelarPedido} textoBotao="Cancelar pedido" variante="contorno">
              <input type="hidden" name="numero" value={pedido.numero} />
              <div className="campo" style={{ marginBottom: 18 }}>
                <label htmlFor="confirmacao-cancelar">Digite {pedido.numero} para confirmar</label>
                <input id="confirmacao-cancelar" name="confirmacao" required />
              </div>
            </FormularioAcao>
          </section>

          <section className="bloco">
            <h2>Reembolso</h2>
            {pedido.reembolso?.solicitadoEm ? (
              <p className="texto-suave" style={{ fontSize: 14 }}>
                Solicitado em {new Date(pedido.reembolso.solicitadoEm).toLocaleString("pt-BR")} no
                valor de {formatarCentavos(pedido.reembolso.valorCentavos)}.
                {pedido.reembolso.concluidoEm
                  ? ` Concluído em ${new Date(pedido.reembolso.concluidoEm).toLocaleString("pt-BR")}.`
                  : " Aguardando confirmação do provedor."}
              </p>
            ) : (
              <FormularioAcao acao={solicitarReembolso} textoBotao="Solicitar estorno" variante="contorno">
                <input type="hidden" name="numero" value={pedido.numero} />
                <div className="grade-campos" style={{ marginBottom: 18 }}>
                  <div className="campo">
                    <label htmlFor="valor">Valor em reais</label>
                    <input
                      id="valor"
                      name="valor"
                      inputMode="decimal"
                      defaultValue={(pedido.totalCentavos / 100).toFixed(2)}
                    />
                    <small>Confira o pedido e o valor antes de confirmar o reembolso</small>
                  </div>
                  <div className="campo">
                    <label htmlFor="confirmacao-reembolso">Digite {pedido.numero} para confirmar</label>
                    <input id="confirmacao-reembolso" name="confirmacao" required />
                  </div>
                </div>
              </FormularioAcao>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
