import Link from "next/link";
import { redirect } from "next/navigation";
import { FormularioAcao } from "@/components/admin/FormularioAcao";
import { formatarCentavos } from "@/lib/dinheiro";
import { listarPedidos } from "@/lib/repositorio";
import { sessaoValida } from "@/lib/sessao-admin";
import {
  STATUS_FINANCEIRO_ROTULO,
  STATUS_LOGISTICO_ROTULO,
  type StatusFinanceiro,
  type StatusLogistico,
} from "@/lib/tipos";
import { reenviarNotificacoes } from "../acoes";

export default async function PedidosAdmin({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; financeiro?: string; logistico?: string }>;
}) {
  if (!(await sessaoValida())) redirect("/admin");
  const filtros = await searchParams;

  const pedidos = await listarPedidos({
    busca: filtros.busca,
    statusFinanceiro: (filtros.financeiro as StatusFinanceiro) || "TODOS",
    statusLogistico: (filtros.logistico as StatusLogistico) || "TODOS",
    limite: 100,
  });

  return (
    <>
      <div className="painel__topo">
        <div>
          <h1 style={{ fontSize: 32 }}>Pedidos</h1>
          <p className="texto-suave" style={{ margin: 0 }}>
            {pedidos.length} pedido{pedidos.length === 1 ? "" : "s"} listado
            {pedidos.length === 1 ? "" : "s"}
          </p>
        </div>
        <FormularioAcao
          acao={reenviarNotificacoes}
          textoBotao="Processar fila de notificações"
          variante="contorno"
        />
      </div>

      <form className="painel__filtros" method="get">
        <div className="campo">
          <label htmlFor="busca">Buscar</label>
          <input id="busca" name="busca" defaultValue={filtros.busca ?? ""} placeholder="Número, nome ou e-mail" />
        </div>
        <div className="campo">
          <label htmlFor="financeiro">Pagamento</label>
          <select id="financeiro" name="financeiro" defaultValue={filtros.financeiro ?? "TODOS"}>
            <option value="TODOS">Todos</option>
            {Object.entries(STATUS_FINANCEIRO_ROTULO).map(([chave, rotulo]) => (
              <option key={chave} value={chave}>
                {rotulo}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="logistico">Logística</label>
          <select id="logistico" name="logistico" defaultValue={filtros.logistico ?? "TODOS"}>
            <option value="TODOS">Todos</option>
            {Object.entries(STATUS_LOGISTICO_ROTULO).map(([chave, rotulo]) => (
              <option key={chave} value={chave}>
                {rotulo}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="botao" style={{ minHeight: 52 }}>
          Filtrar
        </button>
      </form>

      {pedidos.length === 0 ? (
        <p className="aviso aviso--neutro">Nenhum pedido encontrado</p>
      ) : (
        <div className="tabela-envolvente">
          <table className="tabela">
            <thead>
              <tr>
                <th scope="col">Pedido</th>
                <th scope="col">Data</th>
                <th scope="col">Cliente</th>
                <th scope="col">Itens</th>
                <th scope="col">Total</th>
                <th scope="col">Pagamento</th>
                <th scope="col">Logística</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => (
                <tr key={pedido.id}>
                  <td>
                    <Link href={`/admin/pedidos/${pedido.numero}`}>{pedido.numero}</Link>
                  </td>
                  <td>{new Date(pedido.criadoEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td>
                    {pedido.comprador.nome}
                    <br />
                    <span className="texto-suave" style={{ fontSize: 13 }}>
                      {pedido.endereco.cidade} {pedido.endereco.estado}
                    </span>
                  </td>
                  <td>
                    {pedido.itens
                      .map((item) => `${item.quantidade}x ${item.voltagem} V`)
                      .join(" · ")}
                  </td>
                  <td>{formatarCentavos(pedido.totalCentavos)}</td>
                  <td>{STATUS_FINANCEIRO_ROTULO[pedido.statusFinanceiro]}</td>
                  <td>{STATUS_LOGISTICO_ROTULO[pedido.statusLogistico]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
