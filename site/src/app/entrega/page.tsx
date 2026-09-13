import type { Metadata } from "next";
import Link from "next/link";
import { PaginaTexto } from "@/components/PaginaTexto";
import { FORNECEDOR } from "@/lib/fornecedor";
import { LOJA, PRODUTO } from "@/lib/produto";

export const metadata: Metadata = {
  title: "Entrega",
  description: "Prazos de postagem, estimativa de entrega e rastreamento dos pedidos.",
};

export default function Entrega() {
  return (
    <PaginaTexto
      titulo="Entrega e rastreamento"
      resumo="Como o pedido sai da loja, quanto tempo leva e como acompanhar o envio."
    >
      <h2>De onde saem os pedidos</h2>
      <p>
        Os pedidos saem do {FORNECEDOR.estado}. A postagem ocorre em até{" "}
        {PRODUTO.prazoPostagemDiasUteis} dias úteis após a confirmação do pagamento.
      </p>

      <h2>Prazo de entrega</h2>
      <p>
        A entrega tem estimativa de {PRODUTO.prazoEntregaDiasUteis} dias úteis após a postagem,
        conforme o atendimento da transportadora ao destino. O prazo de postagem e a estimativa de
        transporte são etapas distintas e se somam.
      </p>
      <p>
        A estimativa vale para as regiões atendidas pela transportadora contratada. Quando houver
        exceção de cobertura para o seu CEP, ela é apresentada no checkout antes do pagamento.
      </p>

      <h2>Frete</h2>
      <p>
        O frete é grátis para todo o Brasil, sem valor mínimo de compra e sem cobrança adicional por
        quantidade ou voltagem escolhida.
      </p>

      <h2>Rastreamento</h2>
      <p>
        Após a postagem, enviamos a transportadora e o link de rastreamento por e-mail e, mediante
        sua autorização, pelo WhatsApp. Você também pode consultar o andamento na página{" "}
        <Link href="/acompanhar">Acompanhar pedido</Link>, informando apenas o número do pedido.
      </p>

      <h2>Atrasos</h2>
      <p>
        Em caso de atraso, entre em contato pelo e-mail{" "}
        <a href={`mailto:${LOJA.email}`}>{LOJA.email}</a> para verificarmos a situação junto à
        transportadora e oferecermos as soluções cabíveis.
      </p>
    </PaginaTexto>
  );
}
