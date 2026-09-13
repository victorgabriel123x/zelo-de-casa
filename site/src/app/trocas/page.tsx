import type { Metadata } from "next";
import { PaginaTexto } from "@/components/PaginaTexto";
import { Pendente } from "@/components/Pendente";
import { FORNECEDOR } from "@/lib/fornecedor";
import { LOJA } from "@/lib/produto";

export const metadata: Metadata = {
  title: "Trocas e devoluções",
  description: "Direito de arrependimento, devoluções, reembolso e garantia.",
};

export default function Trocas() {
  return (
    <PaginaTexto
      titulo="Trocas, devoluções e reembolso"
      resumo="Como solicitar atendimento, prazos aplicáveis e o que acontece com o valor pago."
    >
      <h2>Como solicitar</h2>
      <p>
        Escreva para <a href={`mailto:${LOJA.email}`}>{LOJA.email}</a> com o número do pedido.
        Confirmamos o recebimento da solicitação e respondemos em até cinco dias, conforme a
        regulamentação aplicável.
      </p>

      <h2>Direito de arrependimento</h2>
      <p>
        Nas compras online, você pode exercer o direito de arrependimento em até sete dias corridos
        após o recebimento do produto. A loja orienta a devolução sem custo e providencia o
        reembolso integral dos valores pagos, observadas as obrigações legais. Não condicionamos o
        exercício desse direito a embalagem lacrada.
      </p>

      <h2>Cancelamento antes do envio</h2>
      <p>
        Pedidos ainda não postados podem ser cancelados pelo atendimento. Se o envio já ocorreu,
        orientamos o procedimento de devolução.
      </p>

      <h2>Reembolso</h2>
      <p>
        O reembolso é solicitado pelo meio de pagamento utilizado, e o prazo de visualização pode
        depender da instituição financeira. A solicitação de estorno é comunicada de imediato
        quando cabível, sem espera arbitrária além da lei.
      </p>

      <h2>Produto com avaria ou divergência</h2>
      <p>
        Se houver avaria, defeito ou item divergente, comunique o ocorrido. Fotos podem ajudar na
        análise, mas não são condição absoluta para receber atendimento. Não exigimos vídeo de
        abertura da embalagem.
      </p>

      <h2>Garantia</h2>
      <p>
        Aplicam-se a garantia legal do produto durável e a garantia contratual do fabricante
        conforme certificado.{" "}
        {FORNECEDOR.garantiaMeses ? (
          <>O prazo contratual informado é de {FORNECEDOR.garantiaMeses} meses.</>
        ) : (
          <Pendente>prazo de garantia contratual conferido no certificado do modelo</Pendente>
        )}{" "}
        Os direitos legais do consumidor não são afastados por esta política.
      </p>
    </PaginaTexto>
  );
}
