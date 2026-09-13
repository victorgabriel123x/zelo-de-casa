import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Cabecalho } from "@/components/Cabecalho";
import { FormularioEntrega } from "@/components/FormularioEntrega";
import { Rodape } from "@/components/Rodape";
import { ENV, MODO_DEMONSTRACAO } from "@/lib/ambiente";
import { itensDaConsulta } from "@/lib/carrinho";
import { lerDadosEntrega } from "@/lib/checkout-sessao";

export const metadata: Metadata = {
  title: "Dados e entrega",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Etapa 1: identificacao e entrega. O pagamento tem pagina propria. */
export default async function Checkout({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const consulta = await searchParams;
  const itens = itensDaConsulta(consulta);

  if (itens.length === 0 || ENV.vendasPausadas) redirect("/comprar");

  // Quem volta da tela de pagamento reencontra os campos preenchidos.
  const inicial = await lerDadosEntrega();

  return (
    <>
      <Cabecalho compacto />
      <main id="conteudo" className="checkout">
        <div className="container">
          <FormularioEntrega
            itens={itens}
            modoDemonstracao={MODO_DEMONSTRACAO}
            inicial={inicial}
          />
        </div>
      </main>
      <Rodape />
    </>
  );
}
