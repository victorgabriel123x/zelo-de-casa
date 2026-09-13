import { redirect } from "next/navigation";
import { FormularioAcao } from "@/components/admin/FormularioAcao";
import { formatarCentavos } from "@/lib/dinheiro";
import { listarCupons } from "@/lib/repositorio";
import { sessaoValida } from "@/lib/sessao-admin";
import { salvarCupomAdmin } from "../acoes";

export default async function CuponsAdmin() {
  if (!(await sessaoValida())) redirect("/admin");
  const cupons = await listarCupons();

  return (
    <>
      <div className="painel__topo">
        <h1 style={{ fontSize: 32 }}>Cupons</h1>
      </div>

      <div className="checkout__grade">
        <div>
          {cupons.length === 0 ? (
            <p className="aviso aviso--neutro">Nenhum cupom cadastrado</p>
          ) : (
            <div className="tabela-envolvente">
              <table className="tabela">
                <thead>
                  <tr>
                    <th scope="col">Código</th>
                    <th scope="col">Desconto</th>
                    <th scope="col">Mínimo</th>
                    <th scope="col">Usos</th>
                    <th scope="col">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {cupons.map((cupom) => (
                    <tr key={cupom.codigo}>
                      <td>{cupom.codigo}</td>
                      <td>
                        {cupom.tipo === "PERCENTUAL"
                          ? `${cupom.valor}%`
                          : formatarCentavos(cupom.valor)}
                      </td>
                      <td>{formatarCentavos(cupom.minimoCentavos)}</td>
                      <td>
                        {cupom.usos}
                        {cupom.limiteUsos ? ` de ${cupom.limiteUsos}` : ""}
                      </td>
                      <td>{cupom.ativo ? "Ativo" : "Inativo"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <section className="bloco">
          <h2>Novo cupom</h2>
          <FormularioAcao acao={salvarCupomAdmin} textoBotao="Salvar cupom">
            <div className="grade-campos" style={{ marginBottom: 18 }}>
              <div className="campo">
                <label htmlFor="codigo">Código</label>
                <input id="codigo" name="codigo" required maxLength={40} placeholder="BEMVINDO10" />
              </div>
              <div className="campo campo--6">
                <label htmlFor="tipo">Tipo</label>
                <select id="tipo" name="tipo" defaultValue="PERCENTUAL">
                  <option value="PERCENTUAL">Percentual</option>
                  <option value="VALOR">Valor fixo</option>
                </select>
              </div>
              <div className="campo campo--6">
                <label htmlFor="valor">Valor</label>
                <input id="valor" name="valor" inputMode="decimal" required />
                <small>Percentual em número inteiro ou valor em reais</small>
              </div>
              <div className="campo campo--6">
                <label htmlFor="minimo">Mínimo do pedido em reais</label>
                <input id="minimo" name="minimo" inputMode="decimal" defaultValue="0" />
              </div>
              <div className="campo campo--6">
                <label htmlFor="limiteUsos">Limite de usos</label>
                <input id="limiteUsos" name="limiteUsos" inputMode="numeric" />
              </div>
              <div className="campo campo--6">
                <label htmlFor="inicioEm">Início</label>
                <input id="inicioEm" name="inicioEm" type="datetime-local" />
              </div>
              <div className="campo campo--6">
                <label htmlFor="fimEm">Fim</label>
                <input id="fimEm" name="fimEm" type="datetime-local" />
              </div>
              <div className="campo">
                <label className="caixa-marcar">
                  <input type="checkbox" name="ativo" defaultChecked />
                  <span>Cupom ativo</span>
                </label>
              </div>
            </div>
          </FormularioAcao>
        </section>
      </div>
    </>
  );
}
