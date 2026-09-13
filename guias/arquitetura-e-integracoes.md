# Arquitetura e integrações

Este kit é o material de construção para o Claude, não uma loja implantada. Configurar e verificar integrações em sandbox antes de receber dinheiro real.

## Rotas
/ vendas, /checkout compra sem cadastro, /pedido/confirmacao resultado baseado no servidor, /acompanhar consulta mínima, /pedido/acesso acesso privado, /privacidade, /termos, /trocas, /entrega, /fornecedor e /admin.

## Dados
products e variants: duas voltagens, disponibilidade contínua e opção manual de pausar vendas, sem contagem de estoque.
orders: UUID interno, número público aleatório de alta entropia, comprador, endereço, consentimentos, preços congelados, status financeiro separado do status logístico.
order_items: variante, quantidade inteira positiva, preço e desconto em centavos. Sem limite comercial fixo, com validação de limites técnicos do gateway.
payments: identificadores Asaas, tentativas, status, vencimento e reconciliação. Uma tentativa ativa por pedido.
coupons e coupon_redemptions: valor ou percentual, vigência, mínimo e limite de uso com transação atômica. Nunca confiar no total do navegador.
shipments: transportadora, código, URL https validada, data da postagem, status manual.
invoices: caminho privado, hash e data. Upload de PDF/XML validado, verificação de tipo/tamanho e sem execução.
notifications, webhook_events, admin_audit, legal_acceptances e admin_challenges.
RLS em todas as tabelas. Dados de clientes nunca públicos. Chaves privilegiadas só no servidor.

## Consulta por número do pedido
Atender a escolha do usuário: número do pedido suficiente para status logístico mínimo, com identificador aleatório e rate limit. Não retornar nome, endereço, CPF, itens sensíveis ou nota fiscal nessa consulta. Para detalhes e documentos, enviar acesso temporário ao e-mail cadastrado. Não reintroduzir e-mail obrigatório na consulta mínima sem explicar o motivo.

## Asaas
Consultar documentação oficial atual antes de programar endpoints. Criar cobranças e calcular valores no servidor. HTTPS obrigatório na captura de cartão. Não armazenar PAN ou CVV, nem registrá-los em logs, analytics, cache ou ferramentas de replay. Checkout próprio exige revisão do escopo PCI aplicável. Não prometer que tokenização elimina todas as obrigações.
2x sem juros. 3x a 10x exigem configuração real de taxas e cálculo do total no servidor. Não assumir repasse automático de juros do Asaas. Na ausência de tabela validada, desabilitar essas opções de forma clara em vez de inventar taxas.
Pix de 30 minutos é requisito a validar no provedor. Usar expiração efetiva oferecida pela API ou cancelamento/reconciliação suportados. Não simular expiração apenas escondendo QR no navegador. Verificar possibilidade de pagamento tardio, impedir duplicação e conciliar antes de emitir nova cobrança. Nunca dizer expirado se a cobrança permanece pagável sem tratamento.
Eventos autenticados conforme mecanismo documentado pelo Asaas, deduplicados, com reconciliação. Separar criado, pendente, em análise, confirmado, recebido, recusado, estornado e chargeback. Não marcar compra paga pelo redirect ou sucesso HTTP isolado. Timeout de criação exige consulta antes de retry.
Refund: confirmação explícita da ação no painel, valor validado, registro de auditoria, estado solicitado separado de concluído. Não estornar duas vezes.

## Administração
Acesso único ao proprietário, sem cadastro público e com allowlist de identidade. Senha mais código por e-mail é requisito específico: implementar challenge adicional no servidor com código aleatório, hash, TTL de 5 minutos, máximo de 5 tentativas e limite de reenvio. Vincular à sessão após senha, usar cookie HttpOnly seguro e validar a conclusão em cada endpoint de admin. Não afirmar que OTP simples equivale a MFA nativo do Supabase. Auditar sessões e invalidação após logout.

## Notificações
Resend com domínio verificado. WhatsApp Cloud API com número habilitado, templates aprovados e opt-in. Configurar remetente real em variável de ambiente. Link de nota fiscal autenticado e expirável. Uma outbox transacional evita perder mensagens após gravar pedido. Fila e retry com limite. Anexo de nota não equivale a emissão fiscal: o vendedor emite externamente e faz upload.

## Medição
Meta Pixel e GA4 após consentimentos separados. view_item, begin_checkout, add_payment_info e purchase. Evento purchase com ID único e valor real, uma vez por pedido confirmado. Recarregar a página não gera nova compra. Não enviar CPF, e-mail, endereço ou cartão em eventos. Não ativar scripts de publicidade no checkout que capturem campos. Deduplicar eventos se houver integração servidor e navegador.

## Limites e configuração
Sem credenciais, entregar modo demonstração explícito com pagamento real desabilitado. Não apresentar mensagens como enviadas sem integração. Serviços podem ter custos e limites próprios. Vercel usa jobs/filas externos ou agendamento compatível, não setTimeout de 30 minutos no processo. Definir região, retenção, backups e restauração. Segredos somente via variáveis privadas, nunca pedir chaves no texto do site.

## Fontes consultadas
Produto: https://catalogo.britania.com.br/Produto/063301004/846
Cartão: https://docs.asaas.com/docs/cobrancas-via-cartao-de-credito
Pix: https://docs.asaas.com/reference/obter-qr-code-para-pagamentos-via-pix
MFA: https://supabase.com/docs/guides/auth/auth-mfa
WhatsApp: https://developers.facebook.com/docs/whatsapp/cloud-api/
E-commerce: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm
