import type { Metadata } from "next";
import Link from "next/link";
import { Cabecalho } from "@/components/Cabecalho";
import { FormularioAcesso } from "@/components/FormularioAcesso";
import { LinhaDoTempo } from "@/components/DetalhesPedido";
import { Rodape } from "@/components/Rodape";
import { obterPedidoPorNumero } from "@/lib/repositorio";
import { LOJA } from "@/lib/produto";
import { PAGO, STATUS_FINANCEIRO_ROTULO } from "@/lib/tipos";

export const metadata: Metadata = {
  title: "Acompanhar pedido",
  description: "Consulte o andamento do seu pedido na Zelo de Casa.",
};

export const dynamic = "force-dynamic";

export default async function Acompanhar({
  searchParams,
}: {
  searchParams: Promise<{ n?: string }>;
}) {
  const { n } = await searchParams;
  const numero = n?.trim() ?? "";
  const pedido = numero ? await obterPedidoPorNumero(numero) : null;
  const naoEncontrado = Boolean(numero) && !pedido;

  return (
    <>
      <Cabecalho compacto />
      <main id="conteudo" className="checkout">
        <div className="container" style={{ maxWidth: 820 }}>
          <h1 style={{ fontSize: "clamp(30px, 3.6vw, 44px)", marginBottom: 12 }}>
            Acompanhe seu pedido
          </h1>
          <p className="texto-suave" style={{ maxWidth: "60ch" }}>
            Informe o número do pedido para ver o andamento. Esta consulta mostra apenas o status,
            sem dados pessoais ou documentos.
          </p>

          <form className="bloco" method="get" style={{ marginTop: 28 }}>
            <h2>Consultar</h2>
            <div className="grade-campos">
              <div className="campo campo--8">
                <label htmlFor="n">Número do pedido</label>
                <input
                  id="n"
                  name="n"
                  defaultValue={numero}
                  placeholder="ZC-00000-00000"
                  maxLength={20}
                  required
                />
              </div>
              <div className="campo campo--4" style={{ justifyContent: "flex-end" }}>
                <button type="submit" className="botao">
                  Consultar pedido
                </button>
              </div>
            </div>
          </form>

          {naoEncontrado && (
            <p className="aviso aviso--erro" role="status">
              Não foi possível localizar o pedido com os dados informados.
            </p>
          )}

          {pedido && (
            <section className="bloco">
              <h2>Pedido {pedido.numero}</h2>
              <p
                className={
                  PAGO.includes(pedido.statusFinanceiro)
                    ? "selo-status selo-status--pago"
                    : "selo-status selo-status--aguardando"
                }
              >
                {STATUS_FINANCEIRO_ROTULO[pedido.statusFinanceiro]}
              </p>
              <LinhaDoTempo pedido={pedido} />
              {pedido.envio?.url && (
                <p style={{ marginTop: 20 }}>
                  <a
                    className="botao botao--contorno"
                    href={pedido.envio.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                  >
                    Rastrear na transportadora
                  </a>
                </p>
              )}
            </section>
          )}

          <FormularioAcesso numeroInicial={numero} />

          <p className="texto-pequeno texto-suave" style={{ marginTop: 24 }}>
            Precisa de ajuda, escreva para <a href={`mailto:${LOJA.email}`}>{LOJA.email}</a>{" "}
            informando o número do pedido. Consulte também a{" "}
            <Link href="/entrega">página de entrega</Link>.
          </p>
        </div>
      </main>
      <Rodape />
    </>
  );
}
