import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Cabecalho } from "@/components/Cabecalho";
import { FormularioPagamento } from "@/components/FormularioPagamento";
import { Rodape } from "@/components/Rodape";
import { ENV, MODO_DEMONSTRACAO } from "@/lib/ambiente";
import { itensDaConsulta, itensParaConsulta } from "@/lib/carrinho";
import { lerDadosEntrega } from "@/lib/checkout-sessao";

export const metadata: Metadata = {
  title: "Pagamento",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Etapa 2: pagamento, numa pagina so dele.
 * Sem os dados da etapa anterior nao ha o que pagar, entao volta para /checkout.
 */
export default async function Pagamento({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const consulta = await searchParams;
  const itens = itensDaConsulta(consulta);

  if (itens.length === 0 || ENV.vendasPausadas) redirect("/comprar");

  const voltarPara = `/checkout?${itensParaConsulta(itens)}`;
  const entrega = await lerDadosEntrega();
  if (!entrega) redirect(voltarPara);

  return (
    <>
      <Cabecalho compacto />
      <main id="conteudo" className="checkout">
        <div className="container">
          <FormularioPagamento
            itens={itens}
            entrega={entrega}
            modoDemonstracao={MODO_DEMONSTRACAO}
            voltarPara={voltarPara}
          />
        </div>
      </main>
      <Rodape />
    </>
  );
}
