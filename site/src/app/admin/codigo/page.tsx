import { redirect } from "next/navigation";
import { FormularioAcao } from "@/components/admin/FormularioAcao";
import { lerDesafio, sessaoValida } from "@/lib/sessao-admin";
import { confirmarCodigo } from "../acoes";

export default async function CodigoAdmin() {
  if (await sessaoValida()) redirect("/admin/pedidos");
  const desafio = await lerDesafio();
  if (!desafio) redirect("/admin");

  return (
    <div className="cartao-login">
      <h1>Código de acesso</h1>
      <p>
        Digite o código enviado ao seu e-mail. Ele vale por 5 minutos e aceita no máximo cinco
        tentativas.
      </p>
      <FormularioAcao acao={confirmarCodigo} textoBotao="Entrar no painel" textoOcupado="Conferindo">
        <div className="grade-campos" style={{ marginBottom: 20 }}>
          <div className="campo">
            <label htmlFor="codigo">Código de seis dígitos</label>
            <input
              id="codigo"
              name="codigo"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              minLength={6}
              style={{ letterSpacing: "0.4em", fontSize: 22, textAlign: "center" }}
            />
          </div>
        </div>
      </FormularioAcao>
    </div>
  );
}
