# Relatório de testes

Execução em 12 de setembro de 2026, contra build de produção rodando localmente em modo
demonstração, com Supabase, Asaas, Resend e WhatsApp desligados e apenas o token de
webhook configurado para exercitar o endpoint.

## Verificações automatizadas

Vinte e duas verificações de ponta a ponta em navegador real, todas passando.

| Verificação | Resultado |
| --- | --- |
| Resumo da oferta soma três unidades em duas voltagens | passou |
| Quantidade adulterada no navegador é limitada pelo servidor | passou |
| Cupom de 10% aplicado e recalculado | passou |
| Cupom inexistente recusado | passou |
| Checkout bloqueado sem aceite dos termos | passou |
| Número do pedido gerado com alta entropia | passou |
| Pedido criado fica como aguardando pagamento | passou |
| Total com cupom recalculado no servidor | passou |
| Consulta sem credencial não expõe dados pessoais | passou |
| Endpoint de status devolve apenas o mínimo | passou |
| Geração de novo Pix exige credencial do navegador | passou |
| Painel redireciona quem não tem sessão | passou |
| Entrada no painel com senha e código por e-mail | passou |
| Painel mostra a tentativa de pagamento | passou |
| Webhook recusa token inválido | passou |
| Webhook de pagamento recebido é processado | passou |
| Webhook repetido é deduplicado | passou |
| Eventos fora de ordem não rebaixam pedido pago | passou |
| Pagamento confirmado move o pedido para preparação | passou |
| Evento de compra registrado uma única vez | passou |
| Sem rolagem horizontal em 360, 390, 768 e 1440 px | passou |
| Checkout sem voltagem volta para a oferta | passou |

## Acessibilidade

Varredura com axe-core nas regras WCAG 2.0 e 2.1, níveis A e AA, nas rotas `/`,
`/checkout`, `/acompanhar`, `/privacidade` e `/admin`. Nenhuma violação restante.

Dois problemas foram encontrados e corrigidos durante a verificação: o texto de
disponibilidade usava um verde com contraste de 3,7 contra o branco, trocado por um tom
com 6,0; e o botão de preferências de cookies aparecia em cor de rodapé dentro da página
de privacidade, agora com variante para fundo claro.

## Qualidade de código

- `npm run typecheck` sem erros
- `npm run lint` sem erros nem avisos
- `npm run build` concluído, 23 rotas geradas

## Correções feitas a partir dos testes

- Estouro horizontal em 360 e 390 px causado por colunas de grade sem `minmax(0, …)`,
  corrigido em todas as grades do projeto
- Caixa de seleção Sem número recebendo largura total por uma regra genérica de campo,
  corrigida com seletor que ignora caixas e botões de rádio
- Linha do tempo do pedido com três elementos em uma grade de duas colunas, deixando o
  texto espremido
- Oferta e imagem lado a lado sem quebra no celular
- Armazenamento de demonstração movido para o escopo global do processo, para que
  páginas, ações e rotas de API enxerguem os mesmos pedidos

## O que não foi testado

Tudo que depende de credenciais reais permanece sem execução e está listado em
`PENDENCIAS-DE-LANCAMENTO.md`. Em especial, não foram executados:

- Cobrança Pix e cartão reais no sandbox do Asaas, incluindo pagamento tardio,
  análise de risco, recusa do emissor, estorno e chargeback
- Envio real de e-mail pelo Resend e de mensagens pela WhatsApp Cloud API
- Gravação e leitura no Supabase com RLS, incluindo upload de nota fiscal no bucket
  privado e URLs assinadas
- Deduplicação do evento de compra entre navegador e servidor com Meta Pixel e GA4 reais
- Comportamento do limite de requisições com várias instâncias em produção

Nenhuma dessas etapas pode ser declarada aprovada antes de rodar com as credenciais
configuradas.
