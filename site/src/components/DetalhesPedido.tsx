import { formatarCentavos } from "@/lib/dinheiro";
import { PRODUTO, variantePorCodigo } from "@/lib/produto";
import { STATUS_LOGISTICO_ROTULO, type Pedido } from "@/lib/tipos";

export function ResumoPedido({ pedido }: { pedido: Pedido }) {
  return (
    <div className="bloco">
      <h2>Resumo do pedido</h2>
      {pedido.itens.map((item) => (
        <div className="resumo-item" key={item.voltagem}>
          <span>
            {PRODUTO.nome}
            <br />
            {variantePorCodigo(item.voltagem)?.rotulo} · {item.quantidade} un
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
      <div className="resumo-item">
        <span>Frete</span>
        <strong>Grátis</strong>
      </div>
      <div className="resumo-item" style={{ borderBottom: 0 }}>
        <span style={{ fontWeight: 700, color: "var(--tinta)" }}>Total</span>
        <strong style={{ fontFamily: "var(--fonte-titulo)", fontSize: 24 }}>
          {formatarCentavos(pedido.totalCentavos)}
        </strong>
      </div>
    </div>
  );
}

export function EnderecoPedido({ pedido }: { pedido: Pedido }) {
  const e = pedido.endereco;
  return (
    <div className="bloco">
      <h2>Entrega</h2>
      <p style={{ margin: 0, color: "var(--suave)" }}>
        {pedido.comprador.nome}
        <br />
        {e.logradouro}, {e.semNumero ? "S/N" : e.numero}
        {e.complemento ? ` · ${e.complemento}` : ""}
        <br />
        {e.bairro} · {e.cidade} {e.estado}
        <br />
        CEP {e.cep.replace(/(\d{5})(\d{3})/, "$1-$2")}
      </p>
    </div>
  );
}

const ETAPAS: { chave: string; titulo: string; descricao: string }[] = [
  {
    chave: "AGUARDANDO_PAGAMENTO",
    titulo: "Pedido recebido",
    descricao: "A preparação começa após a confirmação do pagamento",
  },
  {
    chave: "EM_PREPARACAO",
    titulo: "Em preparação",
    descricao: `Postagem em até ${PRODUTO.prazoPostagemDiasUteis} dias úteis após o pagamento confirmado`,
  },
  {
    chave: "POSTADO",
    titulo: "Postado",
    descricao: `Entrega estimada em ${PRODUTO.prazoEntregaDiasUteis} dias úteis após a postagem`,
  },
  { chave: "ENTREGUE", titulo: "Entregue", descricao: "Registrado pela loja após a confirmação" },
];

export function LinhaDoTempo({ pedido }: { pedido: Pedido }) {
  if (pedido.statusLogistico === "CANCELADO") {
    return (
      <p className="aviso aviso--neutro">
        Este pedido está {STATUS_LOGISTICO_ROTULO[pedido.statusLogistico].toLowerCase()}.
      </p>
    );
  }
  const indiceAtual = ETAPAS.findIndex((e) => e.chave === pedido.statusLogistico);
  return (
    <ol className="linha-do-tempo">
      {ETAPAS.map((etapa, indice) => (
        <li key={etapa.chave} data-ativo={indice <= indiceAtual}>
          <span>
            <strong>{etapa.titulo}</strong>
            <small>{etapa.descricao}</small>
          </span>
        </li>
      ))}
    </ol>
  );
}
