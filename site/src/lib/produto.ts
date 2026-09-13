// Catalogo e textos da loja. Fonte: conteudo/produto.json e conteudo/textos-site.md do kit.
// Precos sempre em centavos. Nenhum valor comercial e calculado no navegador.

export type CodigoVoltagem = "127" | "220";

export type Variante = {
  codigo: CodigoVoltagem;
  rotulo: string;
  sku: string;
};

export const LOJA = {
  nome: "Zelo de Casa",
  slogan: "Praticidade que cuida da sua rotina",
  email: "contato@vlds.com.br",
  fabricante: "Britânia",
  origem: "Maranhão",
} as const;

export const PRODUTO = {
  nome: "Mini Processador Britânia 2P",
  cor: "Preto",
  potenciaWatts: 160,
  capacidadeMl: 360,
  pesoKg: 0.68,
  dimensoesCm: { largura: 21, altura: 14.5, profundidade: 10 },
  composicao: "Plástico e metal",
  precoCentavos: 20000,
  precoAnteriorCentavos: 35000,
  precoAnteriorOrigem: "Informado pelo vendedor como preço anterior real",
  freteCentavos: 0,
  disponibilidade: "Disponível para envio",
  prazoPostagemDiasUteis: 2,
  prazoEntregaDiasUteis: 8,
  garantia: "Garantia de fábrica conforme o manual, além dos direitos legais aplicáveis",
  fonteFabricante: "https://catalogo.britania.com.br/Produto/063301004/846",
} as const;

export const VARIANTES: Variante[] = [
  { codigo: "127", rotulo: "127 V", sku: "MP2P-PRETO-127" },
  { codigo: "220", rotulo: "220 V", sku: "MP2P-PRETO-220" },
];

export function variantePorCodigo(codigo: string): Variante | undefined {
  return VARIANTES.find((v) => v.codigo === codigo);
}

// Parcelamento. interestFreeInstallments = 2 e installmentRates = null no kit.
// Sem tabela de juros validada, 3x a 10x permanecem desabilitadas de forma explicita.
export const PARCELAMENTO = {
  maximoTecnico: 10,
  semJuros: 2,
  tabelaJuros: null as null | Record<number, number>,
} as const;

export function parcelasDisponiveis(): number[] {
  const lista = [1, 2];
  if (PARCELAMENTO.tabelaJuros) {
    for (let n = 3; n <= PARCELAMENTO.maximoTecnico; n += 1) {
      if (PARCELAMENTO.tabelaJuros[n] !== undefined) lista.push(n);
    }
  }
  return lista;
}

export const PARCELAMENTO_ESTENDIDO_ATIVO = parcelasDisponiveis().length > PARCELAMENTO.semJuros;

// Bloco que substitui avaliacoes enquanto nao houver fonte validada.
export const CLAREZA = [
  {
    icone: "nota-fiscal",
    titulo: "Nota fiscal",
    texto: "Documento da sua compra disponível após a emissão",
  },
  {
    icone: "caminhao",
    titulo: "Envio acompanhado",
    texto: "Receba o link de rastreamento após a postagem",
  },
  {
    icone: "email",
    titulo: "Atendimento por e-mail",
    texto: `Fale com a loja em ${LOJA.email}`,
  },
] as const;

export const BENEFICIOS = [
  {
    icone: "capacidade",
    titulo: "360 ml para pequenas porções",
    texto: "Prepare quantidades compatíveis com a capacidade do recipiente.",
  },
  {
    icone: "energia",
    titulo: "160 W de potência",
    texto: "Um aparelho compacto para ajudar no preparo dos ingredientes.",
  },
  {
    icone: "sacola",
    titulo: "Função pulsar",
    texto: "Acione em pulsos e acompanhe o processo pela jarra transparente.",
  },
  {
    icone: "escudo",
    titulo: "Lâmina de aço inoxidável",
    texto: "Material informado pelo fabricante para a lâmina do produto.",
  },
  {
    icone: "cadeado",
    titulo: "Trava de segurança",
    texto: "Monte e trave o aparelho conforme as instruções antes de usar.",
  },
] as const;

export const ESPECIFICACOES = [
  { rotulo: "Modelo", valor: "Mini Processador Britânia 2P" },
  { rotulo: "Cor", valor: "Preto" },
  { rotulo: "Potência", valor: "160 W" },
  { rotulo: "Capacidade", valor: "360 ml" },
  { rotulo: "Voltagem", valor: "Escolha 127 V ou 220 V" },
  { rotulo: "Dimensões", valor: "21 cm de largura, 14,5 cm de altura e 10 cm de profundidade" },
  { rotulo: "Peso", valor: "680 g" },
  { rotulo: "Composição", valor: "Plástico e metal" },
] as const;

export const PERGUNTAS = [
  {
    pergunta: "O aparelho é bivolt",
    resposta:
      "Não. Selecione 127 V ou 220 V de acordo com a instalação elétrica do local de uso.",
  },
  {
    pergunta: "Posso comprar as duas voltagens no mesmo pedido",
    resposta:
      "Sim. Adicione a quantidade desejada de cada versão e confira o resumo antes de pagar.",
  },
  {
    pergunta: "Qual é a capacidade",
    resposta:
      "A jarra tem capacidade informada de 360 ml. Respeite o limite e as instruções de uso do manual.",
  },
  {
    pergunta: "O produto é novo",
    resposta: "Sim. O produto é novo e acompanha nota fiscal emitida pelo vendedor.",
  },
  {
    pergunta: "Como funciona o frete",
    resposta:
      "O frete é grátis para todo o Brasil. A postagem ocorre em até 2 dias úteis após o pagamento confirmado e a entrega tem estimativa de 8 dias úteis após a postagem.",
  },
  {
    pergunta: "Como acompanho a entrega",
    resposta:
      "Após a postagem, enviamos o link de rastreamento por e-mail e, com sua autorização, pelo WhatsApp. Você também pode consultar o status na página Acompanhar pedido.",
  },
  {
    pergunta: "Quais são as formas de pagamento",
    resposta:
      "Pix por R$ 200 ou cartão em até 10 parcelas, sendo até 2 sem juros. As condições das demais parcelas são apresentadas antes da confirmação.",
  },
  {
    pergunta: "Qual é a garantia",
    resposta:
      "O produto conta com a garantia de fábrica nas condições do manual, além dos direitos legais aplicáveis. O prazo contratual será exibido após conferência do certificado do modelo.",
  },
  {
    pergunta: "Como solicito troca ou devolução",
    resposta: `Envie o número do pedido para ${LOJA.email}. Consulte a política de trocas e devoluções para conhecer os prazos e procedimentos.`,
  },
] as const;

// Destaques discretos ao lado do produto na primeira tela.
export const DESTAQUES_HERO = [
  {
    icone: "relogio",
    titulo: "Praticidade no dia a dia",
    texto: "Pica, tritura e mistura em segundos",
  },
  {
    icone: "folha",
    titulo: "Tamanho ideal",
    texto: "Perfeito para pequenas porções",
  },
  {
    icone: "brilho",
    titulo: "Mais tempo para o que importa",
    texto: "Uma rotina na cozinha mais simples e leve",
  },
] as const;

// Linha de seguranca logo abaixo do botao principal.
export const SELOS_HERO = [
  { icone: "caminhao", texto: "Frete grátis" },
  { icone: "nota-fiscal", texto: "Novo com nota fiscal" },
  { icone: "energia", texto: "127 V ou 220 V" },
  { icone: "cadeado", texto: "Compra segura" },
] as const;

export const IMAGENS = {
  heroProduto: {
    base: "hero-produto",
    larguras: [480, 720, 1080, 1134],
    largura: 1134,
    altura: 980,
    alt: "Mini Processador Britânia 2P preto com jarra transparente de 360 ml",
  },
  heroCenario: {
    base: "hero-cenario",
    larguras: [640, 1024, 1440, 1672],
    largura: 1672,
    altura: 941,
    alt: "",
  },
  hero: {
    base: "04-detalhe",
    alt: "Mini Processador Britânia 2P preto com a jarra transparente sobre bancada de madeira",
  },
  uso: {
    base: "02-uso",
    alt: "Mão acionando o mini processador com alho e cebola no recipiente",
  },
  possibilidades: {
    base: "03-temperos",
    alt: "Mini processador com ervas processadas e ingredientes ao redor",
  },
  oferta: {
    base: "05-oferta",
    alt: "Mini processador preto acompanhado de alho, cebola, tomate e ervas",
  },
} as const;
