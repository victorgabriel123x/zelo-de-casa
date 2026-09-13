import type { Metadata } from "next";
import { PaginaTexto } from "@/components/PaginaTexto";
import { AvisoPendencias, Pendente } from "@/components/Pendente";
import { AbrirPreferencias } from "@/components/ConsentimentoCookies";
import { FORNECEDOR, FORNECEDOR_COMPLETO } from "@/lib/fornecedor";
import { LOJA } from "@/lib/produto";

export const metadata: Metadata = {
  title: "Privacidade",
  description: "Como a Zelo de Casa trata os dados pessoais de quem compra na loja.",
};

export default function Privacidade() {
  return (
    <PaginaTexto
      titulo="Política de privacidade"
      resumo="Quais dados tratamos, para quê, com quem compartilhamos e como você exerce seus direitos."
    >
      {!FORNECEDOR_COMPLETO && <AvisoPendencias />}

      <h2>Responsável pelos dados</h2>
      <p>
        {FORNECEDOR.nome && FORNECEDOR.documento ? (
          <>
            {FORNECEDOR.nome}, {FORNECEDOR.documento}
          </>
        ) : (
          <Pendente>nome e documento do responsável pelo tratamento</Pendente>
        )}
        . Contato: <a href={`mailto:${LOJA.email}`}>{LOJA.email}</a>
      </p>

      <h2>Dados tratados e finalidades</h2>
      <p>
        Tratamos nome, CPF, contatos, endereço e informações do pedido para processar a compra,
        emitir o documento fiscal, entregar o produto e prestar atendimento. Tratamos dados técnicos
        mínimos para segurança e prevenção de fraude. As bases legais incluem execução contratual,
        obrigação legal e, quando aplicável, consentimento.
      </p>

      <h2>Compartilhamento</h2>
      <p>
        Compartilhamos os dados necessários com o processador de pagamento Asaas, com
        transportadoras e com prestadores de infraestrutura e comunicação configurados para a loja,
        incluindo Supabase, Vercel, Resend e WhatsApp Business Platform.
      </p>
      <p>
        Região de armazenamento e transferências internacionais aplicáveis:{" "}
        {FORNECEDOR.regiaoDados ?? (
          <Pendente>região de armazenamento e medidas de transferência internacional</Pendente>
        )}
      </p>

      <h2>Dados de pagamento</h2>
      <p>
        Não guardamos o número completo do cartão nem o código de segurança. Esses dados trafegam
        apenas para o processador de pagamento no momento da cobrança e não são gravados em bancos
        de dados, registros de log ou ferramentas de análise da loja.
      </p>

      <h2>Retenção</h2>
      <p>
        Dados do pedido e fiscais são mantidos pelo tempo necessário ao cumprimento de obrigações e
        exercício regular de direitos.{" "}
        {FORNECEDOR.retencaoDados ?? <Pendente>tabela de retenção e rotina de exclusão</Pendente>}
      </p>

      <h2>Seus direitos</h2>
      <p>
        Você pode solicitar informações, acesso, correção e demais direitos aplicáveis pelo e-mail
        de atendimento. Algumas informações precisam ser mantidas por obrigação legal. A autorização
        de mensagens de pedido pelo WhatsApp é opcional e pode ser retirada a qualquer momento,
        mantendo-se o acompanhamento por e-mail.
      </p>

      <h2>Cookies</h2>
      <p>
        Recursos essenciais mantêm a compra, a segurança e as preferências de privacidade. Cookies
        de análise e publicidade são opcionais e só carregam após o consentimento da categoria
        correspondente. Aceitar e recusar opcionais têm facilidade equivalente.
      </p>
      <p>
        <AbrirPreferencias tom="claro" />
      </p>
    </PaginaTexto>
  );
}
