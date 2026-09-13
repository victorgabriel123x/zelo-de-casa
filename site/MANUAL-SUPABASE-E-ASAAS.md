# Manual de configuração: Supabase e Asaas

Passo a passo para tirar a loja do modo demonstração. Enquanto `ASAAS_API_KEY`
não estiver preenchida, o site funciona normalmente, registra pedidos para
conferência, **não cobra ninguém e não envia mensagem nenhuma**. Isso é
proposital: dá para testar o fluxo inteiro antes de ligar o dinheiro.

Reserve cerca de uma hora. Faça tudo primeiro em **sandbox**, e só depois troque
para produção.

Sumário:

1. [Supabase: banco e arquivos](#1-supabase)
2. [Asaas: cobranças Pix e cartão](#2-asaas)
3. [Variáveis de ambiente na Vercel](#3-variaveis-de-ambiente)
4. [Teste de ponta a ponta](#4-teste-de-ponta-a-ponta)
5. [Virar a chave para produção](#5-produção)
6. [Problemas comuns](#6-problemas-comuns)

---

## 1. Supabase

O Supabase guarda pedidos, pagamentos, cupons, notificações e as notas fiscais.
O plano gratuito atende o começo da operação.

### 1.1 Criar o projeto

1. Entre em https://supabase.com e crie a conta.
2. **New project**. Preencha:
   - **Name**: `zelo-de-casa`
   - **Database Password**: gere uma senha longa e **guarde no seu gerenciador de
     senhas**. Você não vai precisar dela no site, mas sem ela não dá para acessar
     o banco direto depois.
   - **Region**: `South America (São Paulo)` — a mais próxima dos compradores.
3. Aguarde uns dois minutos até o projeto terminar de subir.

### 1.2 Criar as tabelas

O projeto já vem com o SQL pronto em `supabase/migrations/0001_schema.sql`.

1. No painel do Supabase, abra **SQL Editor** no menu lateral.
2. Clique em **New query**.
3. Abra o arquivo `supabase/migrations/0001_schema.sql` do repositório, copie
   **todo** o conteúdo e cole no editor.
4. Clique em **Run**.
5. Deve aparecer `Success. No rows returned`. Confira em **Table Editor**: devem
   existir `orders`, `order_items`, `payments`, `coupons`, `notifications`,
   `webhook_events`, `admin_audit`, entre outras.

> **Sobre segurança:** o script liga Row Level Security em todas as tabelas e
> **não cria nenhuma policy**, de propósito. Com RLS ligado e sem policy, a chave
> pública (`anon`) não enxerga nada. Só a `service_role`, que fica no servidor,
> consegue ler e escrever. Não crie policies públicas nem use a chave `anon` no
> navegador.

### 1.3 Criar o bucket das notas fiscais

1. Menu lateral → **Storage** → **New bucket**.
2. Nome: `notas-fiscais`.
3. Deixe **Public bucket DESMARCADO**. As notas são documentos fiscais com dados
   pessoais; o site gera links temporários assinados quando precisa exibi-las.
4. **Create bucket**.

### 1.4 Copiar as chaves

1. Menu lateral → **Project Settings** → **API**.
2. Copie:
   - **Project URL** → vai em `SUPABASE_URL`
   - **service_role** (em *Project API keys*, precisa clicar em *Reveal*) → vai em
     `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ A chave `service_role` ignora todas as regras de segurança do banco. Ela só
> pode viver nas variáveis de ambiente do servidor. Nunca coloque em código, nunca
> mande por WhatsApp, nunca use em página do navegador. Se vazar, vá em
> **Project Settings → API → Rotate** imediatamente.

---

## 2. Asaas

O Asaas emite as cobranças Pix e processa o cartão de crédito.

### 2.1 Criar a conta

1. Entre em https://www.asaas.com e crie a conta.
2. Faça a verificação de identidade (documento e dados da empresa ou do CPF).
   **Sem a conta aprovada não é possível receber de verdade** — a aprovação leva
   de algumas horas a alguns dias.
3. Enquanto a aprovação não sai, use o **sandbox**: https://sandbox.asaas.com,
   que é uma conta separada e não precisa de aprovação.

### 2.2 Pegar a chave da API

No sandbox e na produção o caminho é o mesmo, mas **as chaves são diferentes**:

1. Menu do perfil → **Integrações** → **Chave de API**.
2. Clique em **Gerar chave** e copie o valor.
3. Ele vai em `ASAAS_API_KEY`.
4. Defina também `ASAAS_AMBIENTE`:
   - `sandbox` durante os testes
   - `producao` quando for vender de verdade

A chave do sandbox **não funciona** em produção, e vice-versa. Trocar uma sem
trocar a outra é o erro mais comum desta etapa.

### 2.3 Configurar o webhook

O webhook é como o Asaas avisa a loja que um pagamento foi confirmado. **Sem ele
o pedido fica travado em "aguardando pagamento" mesmo depois de pago.**

1. Menu do perfil → **Integrações** → **Notificações via webhook** →
   **Adicionar webhook**.
2. Preencha:
   - **Nome**: `Zelo de Casa`
   - **URL**: `https://SEU-DOMINIO/api/webhooks/asaas`
     (durante os testes locais, use um túnel como o `ngrok`; o Asaas não alcança
     `localhost`)
   - **E-mail para falhas**: o seu, para ser avisado se as entregas começarem a
     falhar
   - **Versão da API**: `v3`
   - **Token de autenticação**: gere um segredo longo e aleatório. Este mesmo
     valor vai em `ASAAS_WEBHOOK_TOKEN`. O site confere esse token em toda
     chamada e recusa quem não souber.
   - **Status**: Ativo
3. Em **Eventos**, marque os de cobrança. O site entende estes:

   | Evento | O que acontece no pedido |
   | --- | --- |
   | `PAYMENT_CREATED`, `PAYMENT_UPDATED`, `PAYMENT_OVERDUE` | continua pendente |
   | `PAYMENT_AWAITING_RISK_ANALYSIS` | em análise |
   | `PAYMENT_CONFIRMED`, `PAYMENT_APPROVED_BY_RISK_ANALYSIS` | confirmado |
   | `PAYMENT_RECEIVED` | recebido — dispara o e-mail de confirmação |
   | `PAYMENT_REPROVED_BY_RISK_ANALYSIS`, `PAYMENT_CREDIT_CARD_CAPTURE_REFUSED` | recusado |
   | `PAYMENT_REFUND_REQUESTED` | estorno solicitado |
   | `PAYMENT_REFUNDED`, `PAYMENT_PARTIALLY_REFUNDED` | estornado |
   | `PAYMENT_CHARGEBACK_REQUESTED`, `PAYMENT_CHARGEBACK_DISPUTE` | chargeback |

4. Salve.

> O site guarda o id de cada evento recebido e ignora repetições, então uma
> reentrega do Asaas não duplica pedido nem e-mail. Ele também **não confia no
> corpo do evento**: ao receber um aviso, consulta a cobrança no Asaas e usa o
> estado real. Um evento forjado não muda pedido nenhum.

### 2.4 Conferir a taxa de parcelamento

De 3x a 10x a loja repassa juros ao comprador. A taxa está em um único lugar,
`src/lib/produto.ts`:

```ts
export const PARCELAMENTO = {
  maximoTecnico: 10,
  semJuros: 2,
  jurosAoMes: 0.0299, // 2,99% ao mês
} as const;
```

**Confira esse número contra o seu contrato do Asaas antes de vender.** O valor
atual é uma taxa de mercado comum, não um número tirado da sua tabela. Se o Asaas
cobrar mais do que você repassa, cada venda parcelada sai no prejuízo; se cobrar
bem menos, você está encarecendo sem precisar.

Onde olhar: painel do Asaas → **Taxas e prazos**. Compare o custo de receber
parcelado com o que a loja está repassando. Para mudar, altere só o `jurosAoMes`
— a tela de pagamento, o total cobrado e o comprovante se ajustam sozinhos.

Para vender **sem juros em nenhuma parcela**, coloque `jurosAoMes: 0`. As opções
de 3x a 10x somem e só ficam 1x e 2x.

---

## 3. Variáveis de ambiente

Na Vercel: **Project → Settings → Environment Variables**. Marque
**Production**, **Preview** e **Development** em cada uma.

### Obrigatórias para vender

| Variável | Onde pegar |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | seu domínio, com `https://` e sem barra no fim |
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |
| `SUPABASE_BUCKET_NOTAS` | `notas-fiscais` |
| `ASAAS_API_KEY` | Asaas → Integrações → Chave de API |
| `ASAAS_AMBIENTE` | `sandbox` ou `producao` |
| `ASAAS_WEBHOOK_TOKEN` | o segredo que você criou no passo 2.3 |

### Painel administrativo

| Variável | Como obter |
| --- | --- |
| `ADMIN_EMAIL` | o e-mail que vai entrar no painel |
| `ADMIN_SENHA_HASH` | rode `npm run hash-admin "sua senha longa"` e copie a linha inteira |
| `SEGREDO_SESSAO` | `openssl rand -base64 48` |

A senha do admin **nunca** é guardada; o site só conhece o hash.

### E-mail e WhatsApp

| Variável | Observação |
| --- | --- |
| `RESEND_API_KEY` | crie em https://resend.com e valide seu domínio |
| `EMAIL_REMETENTE` | `Zelo de Casa <pedidos@seudominio>` |
| `EMAIL_ADMIN` | onde você recebe o aviso de venda nova |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | opcionais; sem eles o site só usa e-mail |

Sem `RESEND_API_KEY` nenhum e-mail sai — inclusive o de confirmação de pagamento.
Trate como obrigatório na prática.

### Agendamento da fila

| Variável | Para quê |
| --- | --- |
| `CRON_SECRET` | a Vercel assina a chamada agendada com este valor. É o único nome que ela reconhece |
| `CRON_SEGREDO` | mesmo valor, para agendadores externos |

Detalhes em [README.md](README.md#agendamento-da-fila).

### Identificação do vendedor

`FORNECEDOR_NOME`, `FORNECEDOR_DOCUMENTO`, `FORNECEDOR_ENDERECO`,
`FORNECEDOR_MUNICIPIO`, `FORNECEDOR_ESTADO`, `GARANTIA_CONTRATUAL_MESES`,
`POLITICA_RETENCAO`, `REGIAO_DADOS`.

São exigência do Código de Defesa do Consumidor e da LGPD. Enquanto ficarem
vazias, as páginas de termos e privacidade exibem aviso de pendência.

> Depois de mexer em qualquer variável, **faça um novo deploy**. A Vercel só
> aplica as mudanças no próximo build.

---

## 4. Teste de ponta a ponta

Faça em sandbox, com `ASAAS_AMBIENTE=sandbox`.

### Pix

1. Abra a loja, escolha a voltagem e clique em **Comprar agora**.
2. Preencha os dados e clique em **Ir para o pagamento**.
3. Escolha **Pix** e conclua. Deve aparecer o QR Code.
4. No painel do sandbox do Asaas, encontre a cobrança e marque como recebida
   (o sandbox permite confirmar manualmente).
5. Em até uns segundos a página do pedido deve virar sozinha para pagamento
   confirmado, e o e-mail deve chegar.

### Cartão

Use os cartões de teste do sandbox (na documentação do Asaas). Teste:

- **1x** — sem juros, cobra o valor do produto
- **6x** — confira que a parcela × 6 bate com o total mostrado, e que a página de
  confirmação exibe *"Valor total cobrado no cartão"* com o valor maior
- **cartão recusado** — o pedido tem que ficar como recusado, sem sumir

### Conferências finais

- [ ] O pedido aparece em `/admin/pedidos`
- [ ] O e-mail de confirmação chegou
- [ ] Em **Storage → notas-fiscais**, o upload de uma nota funciona pelo painel
- [ ] Em `webhook_events` (Table Editor) há registros dos eventos recebidos
- [ ] Chamar `/api/webhooks/asaas` sem o token devolve **401**

---

## 5. Produção

Quando o sandbox estiver redondo:

1. Conta do Asaas **aprovada**.
2. Gere a chave de API **da produção** (é outra chave) e troque `ASAAS_API_KEY`.
3. Troque `ASAAS_AMBIENTE` para `producao`.
4. Cadastre o webhook **de novo**, agora no painel de produção, apontando para o
   domínio final. Pode usar o mesmo `ASAAS_WEBHOOK_TOKEN` ou gerar outro — se
   gerar, atualize a variável.
5. Confira que `NEXT_PUBLIC_SITE_URL` é o domínio real.
6. Preencha as variáveis de `FORNECEDOR_*`.
7. Faça o deploy.
8. **Faça uma compra real de teste**, de verdade, com seu próprio cartão ou Pix, e
   depois estorne. É a única forma de confirmar que a produção está funcionando.

Repasse também a lista de [PENDENCIAS-DE-LANCAMENTO.md](PENDENCIAS-DE-LANCAMENTO.md).

---

## 6. Problemas comuns

**O site diz "modo demonstração" mesmo com tudo configurado.**
`ASAAS_API_KEY` está vazia ou começa com `substitua`. O site trata qualquer valor
iniciado por `substitua` como não configurado. Confira também se você fez deploy
depois de salvar a variável.

**Pedido pago continua em "aguardando pagamento".**
O webhook não está chegando. No Asaas, veja o histórico de entregas do webhook:

- **401** → o `ASAAS_WEBHOOK_TOKEN` da Vercel é diferente do token cadastrado no Asaas
- **503** → a variável `ASAAS_WEBHOOK_TOKEN` não existe na Vercel
- **não aparece nada** → a URL está errada, ou aponta para `localhost`

**Os e-mails não saem.**
Sem `RESEND_API_KEY` nada é enviado. Com a chave, confira se o domínio do
`EMAIL_REMETENTE` está verificado no Resend — remetente não verificado é recusado.
A fila guarda as tentativas: veja a tabela `notifications` e a página do pedido no
painel administrativo.

**"Esta condição de parcelamento não está disponível".**
O número de parcelas enviado não existe na tabela calculada. Acontece se
`jurosAoMes` estiver `0` e alguém pedir mais que 2x.

**Erro de permissão no banco.**
Você provavelmente usou a chave `anon` no lugar da `service_role`. Com RLS ligado
e sem policies, a `anon` não enxerga nada — o que é intencional.

**Não consigo entrar no painel administrativo.**
`ADMIN_SENHA_HASH` precisa ser a linha inteira gerada pelo `npm run hash-admin`,
no formato `scrypt$salt$hash`. Se faltar `SEGREDO_SESSAO`, a sessão não persiste.
