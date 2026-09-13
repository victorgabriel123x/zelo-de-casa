import { redirect } from "next/navigation";
import { FormularioAcao } from "@/components/admin/FormularioAcao";
import { TEM_ADMIN } from "@/lib/ambiente";
import { sessaoValida } from "@/lib/sessao-admin";
import { entrarComSenha } from "./acoes";

export default async function EntradaAdmin() {
  if (await sessaoValida()) redirect("/admin/pedidos");

  return (
    <div className="cartao-login">
      <h1>Gestão da Zelo de Casa</h1>
      <p>
        Acesso restrito ao proprietário. Depois da senha enviamos um código para o e-mail
        cadastrado.
      </p>

      {!TEM_ADMIN && (
        <p className="aviso aviso--neutro">
          O painel ainda não foi configurado. Defina ADMIN_EMAIL, ADMIN_SENHA_HASH e SEGREDO_SESSAO
          no ambiente. Use npm run hash-admin para gerar o hash da senha.
        </p>
      )}

      <FormularioAcao acao={entrarComSenha} textoBotao="Continuar" textoOcupado="Conferindo">
        <div className="grade-campos" style={{ marginBottom: 20 }}>
          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" autoComplete="username" required />
          </div>
          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              required
              minLength={10}
            />
          </div>
        </div>
      </FormularioAcao>
    </div>
  );
}
