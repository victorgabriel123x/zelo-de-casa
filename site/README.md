# Zelo de Casa

Loja de página única para o Mini Processador Britânia 2P, construída em Next.js com
TypeScript. A home concentra toda a venda e leva para o checkout em rota própria.

## O que está pronto

- Página inicial única com hero, narrativa, benefícios, possibilidades, ficha técnica,
  bloco de clareza, oferta com seletor de voltagem, FAQ e rodapé
- Checkout sem cadastro em `/checkout`, com CEP assistido, cupom, consentimentos separados
  e escolha entre Pix e cartão
- Preços, descontos e frete recalculados no servidor, sempre em centavos
- Integração com Asaas para Pix e cartão, com idempotência, tratamento de timeout,
  webhooks autenticados, deduplicação e reconciliação
- Supabase para os dados privados, com RLS ligado em todas as tabelas
- E-mails transacionais pelo Resend e mensagens utilitárias pela WhatsApp Cloud API,
  com fila, tentativas e deduplicação
- Painel do proprietário com senha mais código por e-mail, pedidos, rastreamento,
  nota fiscal, cupons, cancelamento, reembolso e auditoria
- Consentimento de cookies por categoria, com Meta Pixel e GA4 carregados apenas
  depois da autorização correspondente
- Páginas de privacidade, termos, trocas, entrega e dados do fornecedor

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha o que já tiver
npm run dev
```

Sem as credenciais de pagamento a loja entra em modo demonstração: os pedidos são
registrados em memória, nenhuma cobrança é criada e nenhuma mensagem é enviada. A
interface avisa isso em todas as telas envolvidas.

Scripts úteis:

```bash
npm run verificar   # tipos, lint e build
npm run assets      # recria public a partir de assets do kit, com AVIF e WebP
npm run imagens     # regenera apenas as imagens
npm run hash-admin "sua senha longa"
```

## Configuração dos serviços

### Supabase

1. Crie o projeto e rode `supabase/migrations/0001_schema.sql` no editor SQL
2. Crie um bucket privado chamado `notas-fiscais`
3. Copie a URL do projeto e a chave `service_role` para `SUPABASE_URL` e
   `SUPABASE_SERVICE_ROLE_KEY`
4. A chave `anon` não é usada por este projeto. As tabelas ficam com RLS ligado e sem
   policies, então só o servidor enxerga os dados
5. Opcional: rode `supabase/seed-demo.sql` para ter cupons de teste

### Asaas

1. Comece pelo sandbox, com `ASAAS_AMBIENTE=sandbox`
2. Copie a chave de API para `ASAAS_API_KEY`
3. Cadastre o webhook apontando para `https://SEU-DOMINIO/api/webhooks/asaas`, com o
   token de autenticação igual a `ASAAS_WEBHOOK_TOKEN`
4. Assine os eventos de cobrança, incluindo criação, confirmação, recebimento, recusa,
   análise de risco, estorno e chargeback
5. Só troque para `ASAAS_AMBIENTE=producao` depois de testar os fluxos em sandbox

### Resend

1. Verifique o domínio de envio
2. Preencha `RESEND_API_KEY` e `EMAIL_REMETENTE` com um remetente do domínio verificado
3. `EMAIL_ADMIN` recebe o aviso de nova venda

### WhatsApp Cloud API

1. Número habilitado na Cloud API e templates utilitários aprovados pela Meta
2. Preencha `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_NUMBER_ID`
3. Os nomes de template esperados estão em `src/lib/email-templates.ts`, no mapa
   `TEMPLATES_WHATSAPP`. Ajuste conforme os nomes aprovados
4. As mensagens só saem para quem marcou o opt-in no checkout

### Painel

```bash
npm run hash-admin "uma senha longa de verdade"
```

Copie a saída para `ADMIN_SENHA_HASH`, defina `ADMIN_EMAIL` e gere `SEGREDO_SESSAO`
com `openssl rand -base64 48`. A entrada exige senha e, em seguida, um código de seis
dígitos enviado ao e-mail cadastrado, com validade de 5 minutos e limite de cinco
tentativas.

### Medição

`NEXT_PUBLIC_GA_ID` e `NEXT_PUBLIC_META_PIXEL_ID` são opcionais. Nada é carregado antes
do consentimento da categoria correspondente, e a publicidade nunca carrega no checkout,
na área do pedido nem no painel.

### Agendamento da fila

A entrega das mensagens é tentada na hora do evento. A fila existe para reprocessar o
que falhou, e `/api/notificacoes/processar` é o endpoint que faz isso.

`vercel.json` traz um cron diário (`0 11 * * *`, 8h de Brasília) porque o plano Hobby da
Vercel só permite uma execução por dia. Para ele funcionar, defina `CRON_SECRET` nas
variáveis de ambiente: a Vercel assina a chamada agendada com
`Authorization: Bearer $CRON_SECRET` sozinha, e não reconhece outro nome.

Uma varredura por dia é pouco para uma loja com movimento. Para voltar ao ritmo de 10 em
10 minutos sem pagar o plano Pro, aponte um agendador externo (cron-job.org, por exemplo)
para `https://SEU-DOMINIO/api/notificacoes/processar` com o cabeçalho
`Authorization: Bearer CRON_SEGREDO`. Em outra hospedagem, vale o mesmo. O endpoint aceita
GET e POST e processa até 30 itens por chamada.

## Configurar Supabase e Asaas

O passo a passo completo, com o caminho de cada tela nos dois paineis, checklist
de teste em sandbox e solucao dos erros mais comuns, esta em
[MANUAL-SUPABASE-E-ASAAS.md](MANUAL-SUPABASE-E-ASAAS.md).

## Publicar

O projeto foi pensado para a Vercel. Suba o repositório, configure as variáveis de
ambiente do `.env.example` e faça o deploy. Depois do primeiro deploy, ajuste o webhook
do Asaas para o domínio final e refaça um teste em sandbox.

## Estrutura

```
src/app          rotas, páginas e API
src/components   componentes de interface
src/lib          regras de negócio, integrações e dados
supabase         migrações e dados de demonstração
public           imagens otimizadas, marca, ícones e fontes
scripts          utilidades de linha de comando
```

Os preços vivem em `src/lib/produto.ts` e valem como fonte única. O cálculo fica em
`src/lib/precos.ts` e roda apenas no servidor.

## Assets

Os arquivos de `public/marca`, `public/icones`, `public/decoracao` e `public/imagens`
vêm da pasta `assets` do kit. Para recriá-los a partir dos originais, rode
`npm run assets` com o projeto dentro da pasta do kit. O comando copia os vetores,
regenera o logotipo sem o símbolo e recria as imagens em AVIF e WebP nas larguras 640,
960 e 1440.

## Decisões que valem registro

- O Pix do Asaas não oferece expiração em minutos. A interface mostra apenas o prazo
  que a API devolve e nunca simula vencimento. O campo de 30 minutos do kit continua
  como pendência dependente do provedor
- O parcelamento de 3x a 10x fica desabilitado enquanto `installmentRates` for nulo em
  `src/lib/produto.ts`. Nenhuma condição é exibida sem valor confirmado
- Avaliações não são publicadas. O bloco Mais clareza em cada etapa ocupa esse espaço
- A imagem `01-hero.png` do kit mostra 150 W impresso no corpo do aparelho, divergindo
  dos 160 W do catálogo, então ela não é usada no site. As outras quatro cenas estão
  publicadas
- O limite de requisições é feito em memória e serve a uma instância. Em produção com
  várias instâncias, troque `src/lib/rate-limit.ts` por Redis ou equivalente
- Dados completos de cartão nunca são gravados nem registrados em log. Ainda assim, um
  checkout próprio com captura de cartão exige revisão do escopo PCI aplicável antes de
  processar pagamentos reais
