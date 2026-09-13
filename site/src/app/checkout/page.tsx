import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Cabecalho } from "@/components/Cabecalho";
import { FormularioCheckout } from "@/components/FormularioCheckout";
import { Rodape } from "@/components/Rodape";
import { ENV, MODO_DEMONSTRACAO } from "@/lib/ambiente";
import { itensDaConsulta } from "@/lib/carrinho";
import { calcularResumo, opcoesParcelamento } from "@/lib/precos";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Checkout({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const consulta = await searchParams;
  const itens = itensDaConsulta(consulta);

  if (itens.length === 0 || ENV.vendasPausadas) redirect("/#comprar");

  const resumo = calcularResumo(itens, null);
  const opcoes = opcoesParcelamento(resumo.totalCentavos);

  return (
    <>
      <Cabecalho compacto />
      <main id="conteudo" className="checkout">
        <div className="container">
          <FormularioCheckout
            itens={itens}
            opcoesParcela={opcoes}
            modoDemonstracao={MODO_DEMONSTRACAO}
          />
        </div>
      </main>
      <Rodape />
    </>
  );
}
