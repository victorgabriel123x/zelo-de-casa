import type { ReactNode } from "react";
import { Icone } from "./Icone";
import { formatarCentavos } from "@/lib/dinheiro";
import { PRODUTO, variantePorCodigo } from "@/lib/produto";
import type { ItemPedido } from "@/lib/tipos";

type Props = {
  itens: ItemPedido[];
  totalCentavos: number;
  /** Bloco opcional entre os itens e o frete, usado pelo cupom na etapa 2. */
  children?: ReactNode;
  rodape?: ReactNode;
};

/** Resumo lateral do pedido. Aparece igual nas duas etapas do checkout. */
export function ResumoPedido({ itens, totalCentavos, children, rodape }: Props) {
  return (
    <aside className="checkout__resumo" aria-label="Resumo do pedido">
      <h2>Resumo do pedido</h2>

      {itens.map((item) => (
        <div className="resumo-item" key={item.voltagem}>
          <span>
            {PRODUTO.nome}
            <br />
            {variantePorCodigo(item.voltagem)?.rotulo} · {item.quantidade} un
          </span>
          <strong>{formatarCentavos(item.quantidade * item.precoUnitarioCentavos)}</strong>
        </div>
      ))}

      {children}

      <div className="resumo-item">
        <span>Frete</span>
        <strong>Grátis</strong>
      </div>
      <div className="resumo-item" style={{ borderBottom: 0, paddingTop: 18 }}>
        <span style={{ fontWeight: 700, color: "var(--tinta)" }}>Total</span>
        <strong style={{ fontFamily: "var(--fonte-titulo)", fontSize: 26 }}>
          {formatarCentavos(totalCentavos)}
        </strong>
      </div>

      {rodape}

      <p className="texto-pequeno texto-suave" style={{ marginTop: 14 }}>
        O valor final é sempre recalculado no servidor antes da cobrança.
      </p>

      <div className="aviso-frete" style={{ marginBottom: 0 }}>
        <Icone nome="caminhao" tamanho={18} />
        <span>
          Postagem em até {PRODUTO.prazoPostagemDiasUteis} dias úteis após a confirmação do
          pagamento. Entrega estimada em {PRODUTO.prazoEntregaDiasUteis} dias úteis após a postagem.
        </span>
      </div>
    </aside>
  );
}

/** Trilha das duas etapas do checkout. */
export function Etapas({ atual }: { atual: 1 | 2 }) {
  const nomes = ["Dados e entrega", "Pagamento"];
  return (
    <ol className="etapas">
      {nomes.map((nome, indice) => (
        <li key={nome} aria-current={indice + 1 === atual ? "step" : undefined}>
          {nome}
        </li>
      ))}
    </ol>
  );
}
