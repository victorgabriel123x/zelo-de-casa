import type { Metadata } from "next";
import Link from "next/link";
import { PaginaTexto } from "@/components/PaginaTexto";
import { AvisoPendencias, Pendente } from "@/components/Pendente";
import { FORNECEDOR, FORNECEDOR_COMPLETO } from "@/lib/fornecedor";
import { formatarCentavos } from "@/lib/dinheiro";
import { LOJA, PARCELAMENTO_ESTENDIDO_ATIVO, PRODUTO } from "@/lib/produto";

export const metadata: Metadata = {
  title: "Termos de compra",
  description: "Condições de venda, pagamento e prazos da loja Zelo de Casa.",
};

export default function Termos() {
  return (
    <PaginaTexto
      titulo="Termos de compra"
      resumo="Condições aplicáveis às compras feitas nesta loja. Estes termos não afastam os direitos previstos na legislação de consumo."
    >
      {!FORNECEDOR_COMPLETO && <AvisoPendencias />}

      <h2>O que vendemos</h2>
      <p>
        Vendemos o {PRODUTO.nome} novo, na cor preta, com nota fiscal. A voltagem deve ser escolhida
        entre 127 V e 220 V antes da compra. O cliente pode combinar as duas versões em um pedido,
        conferindo as quantidades no resumo.
      </p>

      <h2>Preço e pagamento</h2>
      <p>
        O preço por unidade é {formatarCentavos(PRODUTO.precoCentavos)} no Pix ou em até duas
        parcelas sem juros no cartão de crédito. O valor de{" "}
        {formatarCentavos(PRODUTO.precoAnteriorCentavos)} indicado como anterior foi informado pelo
        vendedor e não representa pesquisa de preço de mercado.
      </p>
      <p>
        {PARCELAMENTO_ESTENDIDO_ATIVO
          ? "Para três a dez parcelas, as condições e o valor total são exibidos antes do pagamento."
          : "O parcelamento de três a dez vezes está desabilitado enquanto a tabela de juros não estiver configurada. Nenhuma condição é exibida sem valor confirmado."}
      </p>
      <p>
        Cupons válidos terão suas condições apresentadas no checkout. Todos os valores são
        recalculados no servidor antes da cobrança.
      </p>

      <h2>Confirmação do pedido</h2>
      <p>
        O recebimento do pedido não significa pagamento aprovado. A confirmação será enviada após a
        validação da transação pelo processador de pagamento. Guarde o resumo do pedido e a nota
        fiscal. Erros de endereço devem ser comunicados o quanto antes pelo e-mail de atendimento.
      </p>

      <h2>Entrega</h2>
      <p>
        O frete é grátis para todo o Brasil. A postagem ocorre em até{" "}
        {PRODUTO.prazoPostagemDiasUteis} dias úteis após a confirmação do pagamento e a entrega tem
        estimativa de {PRODUTO.prazoEntregaDiasUteis} dias úteis após a postagem. Consulte a{" "}
        <Link href="/entrega">página de entrega</Link> para detalhes.
      </p>

      <h2>Garantia</h2>
      <p>
        Aplicam-se a garantia legal do produto durável e a garantia contratual do fabricante
        conforme certificado.{" "}
        {FORNECEDOR.garantiaMeses ? (
          <>O prazo contratual informado pelo fabricante é de {FORNECEDOR.garantiaMeses} meses.</>
        ) : (
          <Pendente>prazo de garantia contratual conferido no certificado do modelo</Pendente>
        )}
      </p>

      <h2>Atendimento</h2>
      <p>
        Fale com a loja pelo e-mail <a href={`mailto:${LOJA.email}`}>{LOJA.email}</a> informando o
        número do pedido. Consulte também a{" "}
        <Link href="/trocas">política de trocas e devoluções</Link> e a{" "}
        <Link href="/privacidade">política de privacidade</Link>.
      </p>
    </PaginaTexto>
  );
}
