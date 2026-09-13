# Direção visual

Página editorial de venda com produto reconhecível, espaços generosos e hierarquia de oferta. Evitar aparência de marketplace genérico, excesso de badges e gradientes chamativos.

## Identidade
Logo original vetorial com casa e coração. Palavra Zelo de Casa em contornos derivados de Fraunces, sem dependência de fonte para o nome. Slogan em sans-serif. Respiro mínimo de 20% da altura do símbolo. Símbolo isolado para favicon e telas pequenas. Não distorcer ou combinar com o logotipo da fabricante.
Paleta: creme #F7F1E8, branco #FFFFFF, terracota #C65D3A, bege #E6D3C1 e marrom #2A211D. Para botões com letras brancas usar #A74429 e hover #87351F, preservando contraste. Terracota original permanece nas áreas decorativas.
Tipografia do site: Fraunces 500 e 600, Inter 400, 500 e 600. Hospedar fontes localmente na implementação, com licenças. Títulos sem ponto final e sem travessão em qualquer texto.

## Desktop
Container 1200 px. Margens 48 px. Hero em duas colunas 45/55 com título 64 a 76 px e altura ditada pelo conteúdo. Foto nunca coberta pelo preço. Texto em HTML, não embutido na foto. Seções com 88 a 112 px de respiro. Alternar foto e texto. Detalhes em grade 2 por 3. Oferta com foto e seletor lado a lado. FAQ com acordeões sem esconder o acesso às políticas.

## Mobile
Margens 20 px. Título 38 a 44 px. Oferta visível cedo. Foto inteira com object-fit contain. Botões de pelo menos 48 px. Comprar agora fixo com safe-area-inset-bottom, espaço equivalente no corpo e oculto quando o formulário de compra estiver em foco. Nada de rolagem horizontal. Menu simples e rastreamento fácil de encontrar.

## Movimento
Entradas de 400 a 600 ms com translateY de 16 px e opacidade. Conteúdo visível sem JS. No máximo três ingredientes vetoriais decorativos flutuando por 7 a 10 segundos, amplitude de 8 px. Logo pulsa apenas uma vez. Sem efeitos sobre campos de pagamento. Reduced motion desliga efeitos e reprodução automática.
Carrossel de avaliações somente quando validado: intervalo de 7 segundos, botão pausar, setas, indicadores, pausa em hover e foco, respeitar preferência por movimento reduzido. Não animar números de vendas ou avaliações para simular atividade.

## Imagens
Cinco fotografias sintéticas independentes, não documentação técnica. Usar referência fornecida e catálogo oficial para validar contorno, rótulos e peças. A imagem 03 é um ângulo elevado, não uma vista ortogonal. A imagem 04 não substitui fotografia oficial da lâmina. Marcas pequenas geradas podem divergir, portanto não ampliar marcações como especificações. Não usar fotos como promessa de tamanho exato do corte.

## Componentes
AnnouncementBar, Header, BrandLogo, Hero, ProductGallery, BenefitCard, StorySection, ProductSpecs, PurchaseForm, VoltageSelector, QuantityStepper, CouponField, PriceSummary, ShippingSummary, FAQ, Footer, CookiePreferences, MobileBuyBar, CheckoutSteps, PixPayment, CardPayment, OrderStatus, TrackingLink, AdminTable, StatusBadge, InvoiceUpload e RefundDialog.
Estados comuns: normal, hover, foco, desabilitado, carregando, sucesso e erro. Não usar só cor para comunicar status. Ícones decorativos com aria-hidden e botões com nome acessível.
