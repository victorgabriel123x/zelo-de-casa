import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cabecalho } from "@/components/Cabecalho";
import { EventoCompra } from "@/components/EventoCompra";
import { EnderecoPedido, LinhaDoTempo, ResumoPedido } from "@/components/DetalhesPedido";
import { PainelPagamento } from "@/components/PainelPagamento";
import { Rodape } from "@/components/Rodape";
import { pedidoLiberadoNoNavegador } from "@/lib/acesso-pedido";
import { MODO_DEMONSTRACAO } from "@/lib/ambiente";
import { atualizarPedido, obterPedidoPorNumero } from "@/lib/repositorio";
import { LOJA } from "@/lib/produto";
import { PAGO, STATUS_FINANCEIRO_ROTULO, type StatusFinanceiro } from "@/lib/tipos";

export const metadata: Metadata = {
  title: "Seu pedido",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function classeSelo(status: StatusFinanceiro): string {
  if (PAGO.includes(status)) return "selo-status selo-status--pago";
  if (["RECUSADO", "CANCELADO", "CHARGEBACK"].includes(status)) return "selo-status selo-status--problema";
  if (["ESTORNADO", "ESTORNO_SOLICITADO"].includes(status)) return "selo-status selo-status--neutro";
  return "selo-status selo-status--aguardando";
}

export default async function Confirmacao({
  searchParams,
}: {
  searchParams: Promise<{ n?: string }>;
}) {
  const { n } = await searchParams;
  if (!n) notFound();

  const pedido = await obterPedidoPorNumero(n);
  if (!pedido) notFound();

  const liberado = await pedidoLiberadoNoNavegador(pedido.numero);
  const pago = PAGO.includes(pedido.statusFinanceiro);
  const aguardando = pedido.statusFinanceiro === "PENDENTE" || pedido.statusFinanceiro === "CRIADO";
  const pagamento = pedido.pagamentos.find((p) => p.ativo) ?? pedido.pagamentos.at(-1) ?? null;

  // Marca o registro do evento de compra na primeira exibicao de um pedido pago.
  let registrarCompra = false;
  if (pago && !pedido.eventoCompraRegistrado) {
    await atualizarPedido(pedido.id, { eventoCompraRegistrado: true });
    registrarCompra = true;
  }

  return (
    <>
      <Cabecalho compacto />
      <main id="conteudo" className="checkout">
        <div className="container" style={{ maxWidth: 860 }}>
          <p className={classeSelo(pedido.statusFinanceiro)}>
            {STATUS_FINANCEIRO_ROTULO[pedido.statusFinanceiro]}
          </p>

          <h1 style={{ fontSize: "clamp(28px, 3.6vw, 42px)", margin: "18px 0 10px" }}>
            {pago ? "Pagamento confirmado" : "Pedido registrado"}
          </h1>
          <p className="texto-suave" style={{ maxWidth: "60ch" }}>
            {pago
              ? "Obrigado por escolher a Zelo de Casa. Vamos preparar seu pedido e avisar quando ele for postado."
              : "Guarde o número do pedido. A compra só é confirmada depois que o pagamento é validado pelo nosso servidor."}
          </p>

          <p style={{ fontSize: 18, marginTop: 18 }}>
            Número do pedido: <strong>{pedido.numero}</strong>
          </p>

          {pedido.statusFinanceiro === "RECUSADO" && (
            <p className="aviso aviso--erro">
              Não foi possível aprovar o pagamento. Confira os dados ou escolha outra forma de
              pagamento.
            </p>
          )}
          {pedido.statusFinanceiro === "EM_ANALISE" && (
            <p className="aviso aviso--neutro">
              Estamos verificando o resultado. Aguarde antes de tentar novamente.
            </p>
          )}

          {!liberado && (
            <p className="aviso aviso--neutro">
              Esta consulta mostra apenas o andamento do pedido. Para ver dados pessoais e
              documentos, peça um acesso temporário em{" "}
              <Link href="/acompanhar">Acompanhar pedido</Link>.
            </p>
          )}

          {aguardando && pagamento && liberado && (
            <section className="bloco" style={{ marginTop: 28 }}>
              <PainelPagamento
                numero={pedido.numero}
                forma={pagamento.forma}
                copiaECola={pagamento.pixCopiaECola}
                imagemBase64={pagamento.pixImagemBase64}
                expiraEm={pagamento.pixExpiraEm}
                demonstracao={MODO_DEMONSTRACAO}
                aguardando={aguardando}
              />
            </section>
          )}

          <section className="bloco" style={{ marginTop: 28 }}>
            <h2>Próximas etapas</h2>
            <LinhaDoTempo pedido={pedido} />
          </section>

          {liberado && (
            <>
              <ResumoPedido pedido={pedido} />
              <EnderecoPedido pedido={pedido} />
            </>
          )}

          {pedido.envio?.codigo && (
            <div className="bloco">
              <h2>Rastreamento</h2>
              <p style={{ margin: 0 }}>
                {pedido.envio.transportadora} · código {pedido.envio.codigo}
              </p>
              {pedido.envio.url && (
                <p style={{ marginTop: 14 }}>
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
            </div>
          )}

          <p className="texto-pequeno texto-suave" style={{ marginTop: 26 }}>
            Dúvidas sobre este pedido, escreva para{" "}
            <a href={`mailto:${LOJA.email}`}>{LOJA.email}</a> informando o número.
          </p>
        </div>
      </main>
      <Rodape />
      <EventoCompra
        numero={pedido.numero}
        valorCentavos={pedido.totalCentavos}
        registrar={registrarCompra}
      />
    </>
  );
}
