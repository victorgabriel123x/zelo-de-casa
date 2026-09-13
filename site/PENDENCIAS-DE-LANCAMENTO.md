# Pendências de lançamento

Itens que precisam de decisão, dado ou credencial antes de vender de verdade. Enquanto
não forem resolvidos, o site continua funcionando em modo demonstração e as páginas
legais exibem marcadores de pendência em vez de informação inventada.

## Bloqueiam a publicação

1. **Identificação do vendedor.** Preencher `FORNECEDOR_NOME`, `FORNECEDOR_DOCUMENTO`,
   `FORNECEDOR_ENDERECO` e `FORNECEDOR_MUNICIPIO`. Sem isso as páginas de privacidade,
   termos e dados do fornecedor mostram aviso de pendência.
2. **Domínio e hospedagem.** Definir o domínio, apontar `NEXT_PUBLIC_SITE_URL` e
   confirmar a disponibilidade do nome Zelo de Casa. A disponibilidade da marca não foi
   verificada e não se deve supor registro.
3. **Credenciais do Asaas.** Chave de API, token de webhook e teste completo em sandbox
   antes de trocar para produção.
4. **Escopo PCI.** O checkout captura os dados do cartão no próprio site. Confirmar com
   o Asaas qual questionário se aplica e quais obrigações recaem sobre a loja.
5. **Supabase.** Projeto criado, migração aplicada, bucket privado de notas fiscais,
   região de armazenamento definida e rotina de backup e restauração combinada.
6. **Resend.** Domínio verificado e remetente real configurado.
7. **Painel.** `ADMIN_EMAIL`, `ADMIN_SENHA_HASH` e `SEGREDO_SESSAO` definidos. Sem eles
   o painel não abre.

## Dados que faltam

8. **Tabela de juros do cartão.** Enquanto `installmentRates` for nulo em
   `src/lib/produto.ts`, o parcelamento fica limitado a 2x sem juros. O texto do site já
   diz isso de forma explícita, sem prometer condição não confirmada.
9. **Prazo de garantia contratual.** Conferir o certificado do modelo e preencher
   `GARANTIA_CONTRATUAL_MESES`.
10. **Tabela de retenção de dados.** Preencher `POLITICA_RETENCAO` e `REGIAO_DADOS` com
    o que de fato será praticado.
11. **Rotas de entrega.** Validar com a transportadora se a estimativa de oito dias úteis
    após a postagem vale para as regiões atendidas e cadastrar as exceções reais.
12. **Dados do fornecedor do produto.** Confirmar origem e procedência do estoque antes
    de anunciar produto novo com nota fiscal.

## Limitações conhecidas do provedor

13. **Validade do Pix em 30 minutos.** A API do Asaas não oferece expiração em minutos
    para o QR Code de cobrança. O site mostra apenas o prazo devolvido pela API e nunca
    simula vencimento. Se a validade curta for requisito comercial, será preciso
    confirmar com o Asaas se existe recurso equivalente ou desenhar cancelamento e
    reconciliação explícitos.
14. **Entrega registrada manualmente.** Não há integração automática com transportadora.
    O status Entregue depende de conferência no painel.
15. **Limite de requisições em memória.** Vale para uma instância. Em produção com várias
    instâncias, trocar por Redis ou serviço equivalente.

## Conteúdo

16. **Imagem 01-hero.** A cena traz 150 W impresso no corpo do aparelho, divergindo dos
    160 W do catálogo. Ela ficou fora do site. Substituir por fotografia real do produto
    ou por uma cena corrigida antes de usá-la.
17. **Demais imagens.** As quatro cenas publicadas são sintéticas. Conferir lâmina,
    marcações e proporções contra o produto real antes de lançar.
18. **Avaliações.** O arquivo `conteudo/avaliacoes-pendentes.json` do kit continua fora
    do site. Só publicar relatos com origem verificável, e nunca gerar nomes, fotos ou
    selo de compra verificada.

## WhatsApp

19. **Templates aprovados.** Os nomes usados no código estão em `TEMPLATES_WHATSAPP`.
    Submeter os textos de `modelos/whatsapp.md` como templates utilitários e ajustar os
    nomes conforme a aprovação da Meta.
20. **Número habilitado na Cloud API.** Ter o aplicativo WhatsApp Business instalado não
    equivale a Cloud API configurada.

## Medição

21. **Meta Pixel e GA4.** Preencher os identificadores apenas quando as contas existirem.
    Se houver integração servidor além do navegador, combinar a deduplicação usando o
    número do pedido como identificador do evento.
