# Prompt para o Claude

Você é responsável por implementar a loja Zelo de Casa usando os arquivos deste pacote. Construa a aplicação completa e revisável, com interface refinada e integrações reais preparadas para configuração. Trabalhe até concluir o código, testar os fluxos críticos e entregar instruções claras de execução. Não se limite a uma landing page estática.

## Primeiro passo
Leia README.md, guias/identidade-e-layout.md, guias/arquitetura-e-integracoes.md, conteudo/produto.json, conteudo/textos-site.md, conteudo/microcopy.json e conteudo/politicas-base.md. Examine todas as imagens e SVGs antes de usá-los. Use as fontes oficiais apontadas no guia técnico para conferir as APIs atuais e as características do aparelho. Preserve as decisões deste pacote e resolva escolhas rotineiras autonomamente.

## Objetivo
Vender um único modelo de produto, o Mini Processador Britânia 2P preto, novo, 160 W, 360 ml, em variantes 127 V e 220 V. A loja é Zelo de Casa, com slogan Praticidade que cuida da sua rotina. A marca da loja é independente da fabricante. Público de pessoas que cozinham e buscam praticidade. Tom acolhedor e predominantemente promocional, com benefícios concretos.

## Regras editoriais obrigatórias
Não use travessão. Não coloque ponto final nos títulos, subtítulos, nomes de cards e botões. Texto corrido pode ter pontuação normal. Não invente percentuais de economia de tempo, prazo de garantia, certificações, estoque escasso, cronômetros promocionais ou números de vendas. Os dados de avaliações estão em arquivo separado, desabilitados até validação de origem. Não publique esses relatos como avaliações reais nem gere nomes, fotos ou selo de compra verificada. Use o bloco Mais clareza em cada etapa como substituição visual. O valor anterior R$ 350 foi informado pelo vendedor, não foi pesquisado como preço de mercado.

## Interface e ativos
Use logo SVG pronta, sem redesenhar. Fraunces nos títulos e Inter no corpo. Instale e hospede fontes com licenças. Use assets/design-tokens.css como base. Terracota #C65D3A decorativo, ação #A74429 com texto branco e hover #87351F. Creme #F7F1E8, branco e marrom #2A211D. Hierarquia forte, respiro e pequenas composições editoriais. Evite layout repetitivo com todas as seções em cards idênticos.
Use as cinco imagens de assets/imagens, preservando proporção e produto inteiro. Otimize para WebP/AVIF em vários tamanhos sem degradar detalhes. Não substitua por imagens genéricas. As cenas foram geradas por IA e precisam de conferência com o catálogo antes da publicação, especialmente lâmina e marcações. Não tratar cenas como comprovação técnica ou resultado garantido. Use fundo claro e cor nos ingredientes, com mãos apenas na imagem de uso.
Hero: Menos tempo preparando / Mais tempo aproveitando, com quebra de linha sem ponto. Faixa de frete, nota fiscal e compra segura. CTA Comprar agora. Oferta clara e seletor de voltagem sem opção pré-selecionada. Coração da logo pulsa uma vez. Até três pequenos ingredientes vetoriais flutuam suavemente. Scroll com entradas discretas, conteúdo disponível sem JS. Obedecer prefers-reduced-motion.
Mobile primeiro, validar 360, 390, 768 e 1440 px. Botão fixo com safe area, sem esconder conteúdo ou consentimento. Layout de checkout sem distrações. Navegação por teclado, labels reais, foco visível, contraste e anúncio acessível de erros.

## Conteúdo e páginas
Implementar narrativa do arquivo de textos: hero, rotina antes do fogão, ajuda no preparo, benefícios, possibilidades, detalhes técnicos, confiança, oferta final e FAQ. Rodapé discreto com atendimento por e-mail, políticas e identificação verdadeira do fornecedor acessível e visível.
Rotas: /, /checkout, /pedido/confirmacao, /acompanhar, acesso privado ao pedido, /privacidade, /termos, /trocas, /entrega, /fornecedor e /admin. Não publicar campos pendentes como se fossem dados reais.

## Oferta
R$ 200 no Pix ou até 2x de R$ 100 sem juros. Preço anterior informado R$ 350. Até 10x quando tabela de juros estiver configurada, mostrando parcelas e total. Frete grátis para todo o Brasil. Postagem em até 2 dias úteis após pagamento confirmado. Entrega estimada em 8 dias úteis após postagem, validando cobertura antes do lançamento. Disponível para envio, sem contagem de estoque e sem limite comercial fixo por pedido. Variantes podem ser misturadas.

## Compra e pagamento
Compra sem conta. Nome, CPF, e-mail, WhatsApp e endereço completo, usado também na nota fiscal. CEP com preenchimento assistido e alternativa manual. Cupom opcional. Recalcular preços, descontos e frete no servidor, em centavos. Aceite não pré-marcado dos termos, ciência da privacidade e opt-in separado para WhatsApp. Cookies opcionais não condicionam a compra.
Next.js e TypeScript para aplicação e servidor, Supabase para dados privados, Asaas para pagamento, Resend para e-mails e Cloud API para WhatsApp. Hospedagem prevista Vercel. Escolher versões estáveis atuais, registrar versões e lockfile.
Seguir rigorosamente guias/arquitetura-e-integracoes.md para Pix, cartão, expiração, idempotência, timeout e conciliação. Não inventar recursos do Asaas. Pix com validade desejada de 30 minutos somente se implementada efetivamente no provedor. Nunca simular expiração. Não armazenar dados completos do cartão nem CVV, nem capturá-los em logs ou analytics. Validar obrigações do checkout próprio antes de habilitar produção.
Só confirmar venda após estado financeiro válido recebido e reconciliado pelo servidor. Tratar pagamentos tardios, análise de risco, recusas, duplicidades e estornos. Compra confirmada deve exibir número, resumo e próximas etapas; pedido criado ainda pendente deve dizer Aguardando pagamento.

## Pedidos e administração
Proprietário único, senha e challenge por e-mail verificado no servidor. Implementar proteção de todas as rotas e endpoints administrativos. Painel com pesquisa e filtros, detalhes, status separado de pagamento, transportadora, código, link https, upload privado da nota fiscal, cupons, notificações, cancelamento, reembolso com confirmação e auditoria.
Consulta pública pelo número aleatório do pedido fornece apenas status mínimo. Documentos e dados pessoais requerem link temporário enviado ao e-mail. Link externo da transportadora validado e aberto com proteção apropriada. Status entregue atualizado pelo administrador, pois não há integração automática definida com transportadoras.

## Comunicação
Adapte os HTMLs de modelos/ para e-mails responsivos com escaping de variáveis. Conteúdo dinâmico nunca injetado sem sanitização. Templates de WhatsApp utilitários precisam de aprovação e opt-in. Enviar recebido, pago, preparação, postado, documento, entregue, cancelado e reembolso conforme evento real. Nova venda para contato@vlds.com.br. Separar enviado, entregue e falha. Retry e deduplicação obrigatórios. Nota fiscal é anexada pelo vendedor, não emitida pelo site.

## Privacidade e medição
Meta Pixel e Google Analytics com consentimento por categoria, recusa igualmente acessível e revogação. Registrar purchase uma vez com valor efetivo e ID do pedido, sem dados pessoais. Não carregar ferramentas invasivas no formulário do cartão. Usar RLS, segredos privados, autorização por recurso, URLs temporárias, limites de requisição e logs sem dados sensíveis.

## Verificação necessária
Testar adulteração de preço no cliente, cupom concorrente, mistura de voltagens, checkout sem voltagem, pagamento duplicado após timeout, webhook repetido e fora de ordem, Pix vencido e pagamento tardio, acesso indevido a pedidos e PDFs, desvio do challenge do admin, estorno repetido, falha de notificações e deduplicação de purchase. Executar build, lint e verificação TypeScript. Testar em sandbox e renderizar desktop e celular, corrigindo overflow, sobreposição, links e contraste. Registrar o que foi testado e o que depende de credenciais, sem afirmar que testes não executados passaram.

## Entrega
Entregar código completo, migrações, .env.example sem segredos, README de instalação, passos de configuração de Asaas/Resend/Meta/Supabase, dados de demonstração separados, relatório de testes e pendências de lançamento. Sem credenciais, a demonstração deve funcionar visualmente e avisar que pagamentos são demonstrativos, sem cobrar nem afirmar envio de mensagens. Não publicar nem ativar cobranças reais sem configuração e autorização de lançamento.
