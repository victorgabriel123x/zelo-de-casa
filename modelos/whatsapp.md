# Modelos de WhatsApp

Submeter templates utilitários à aprovação da Meta. Aplicativo WhatsApp Business instalado não equivale a Cloud API configurada. Usar opt-in específico para atualizações do pedido. Sem publicidade nestas mensagens. Não enviar CPF, endereço completo ou links públicos permanentes de nota fiscal. Variáveis dependem do formato aprovado pelo provedor.

## Recebemos seu pedido

Zelo de Casa
Recebemos o pedido {{pedido}}. Confira os itens abaixo. A preparação começa após a confirmação do pagamento.
Ver meu pedido: {{url_segura}}
Atendimento: contato@vlds.com.br

## Pagamento confirmado

Zelo de Casa
O pagamento do pedido {{pedido}} foi confirmado. Vamos preparar sua compra para postagem em até 2 dias úteis.
Acompanhar pedido: {{url_segura}}
Atendimento: contato@vlds.com.br

## Seu pedido está em preparação

Zelo de Casa
Estamos preparando o pedido {{pedido}}. Você receberá o rastreamento assim que ele for postado.
Ver meu pedido: {{url_segura}}
Atendimento: contato@vlds.com.br

## Seu pedido foi postado

Zelo de Casa
O pedido {{pedido}} foi enviado pela {{transportadora}}. Código: {{rastreamento}}. A entrega está estimada em 8 dias úteis após a postagem.
Rastrear meu pedido: {{url_segura}}
Atendimento: contato@vlds.com.br

## Sua nota fiscal está disponível

Zelo de Casa
A nota fiscal do pedido {{pedido}} está disponível no acesso seguro abaixo. Guarde o documento da sua compra.
Acessar nota fiscal: {{url_segura}}
Atendimento: contato@vlds.com.br

## Entrega registrada

Zelo de Casa
A entrega do pedido {{pedido}} foi registrada. Se houver alguma divergência, fale conosco em contato@vlds.com.br.
Ver meu pedido: {{url_segura}}
Atendimento: contato@vlds.com.br

## Pedido cancelado

Zelo de Casa
O pedido {{pedido}} foi cancelado. Se houve pagamento, acompanhe a situação do reembolso pelo acesso seguro.
Consultar pedido: {{url_segura}}
Atendimento: contato@vlds.com.br

## Reembolso atualizado

Zelo de Casa
O reembolso do pedido {{pedido}} está com status {{status_reembolso}}. Valor: {{valor_reembolso}}. O prazo de visualização depende do meio de pagamento.
Consultar reembolso: {{url_segura}}
Atendimento: contato@vlds.com.br

## O prazo do Pix terminou

Zelo de Casa
O prazo de pagamento do pedido {{pedido}} terminou. Se ainda quiser concluir a compra, acesse o pedido para gerar outro Pix.
Gerar novo Pix: {{url_segura}}
Atendimento: contato@vlds.com.br

## Regras de envio
Fila com tentativas e deduplicação por pedido, evento, destinatário e canal. Enviar apenas depois da persistência do estado real. Notificação de entregue depende de atualização manual no painel ou integração futura, nunca de tempo decorrido. Registrar aceitação e entrega do provedor separadamente. Falha no WhatsApp não impede confirmação por e-mail. Notas fiscais por link autenticado ou documento permitido pelo provedor. Domínio verificado e templates aprovados são pré-requisitos operacionais.
