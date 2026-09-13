import { PARCELAMENTO, PRODUTO, variantePorCodigo } from "./produto";
import type { Cupom, ItemPedido } from "./tipos";
import type { CodigoVoltagem } from "./produto";

export type EntradaItem = { voltagem: CodigoVoltagem; quantidade: number };

export type Resumo = {
  itens: ItemPedido[];
  quantidadeTotal: number;
  subtotalCentavos: number;
  descontoCentavos: number;
  freteCentavos: number;
  totalCentavos: number;
  cupomAplicado: string | null;
};

export const LIMITE_TECNICO_ITENS = 20;

/**
 * Unica fonte de verdade de precos. Roda apenas no servidor.
 * O navegador nunca envia totais e qualquer valor recebido do cliente e descartado.
 */
export function calcularResumo(entrada: EntradaItem[], cupom?: Cupom | null): Resumo {
  const agrupado = new Map<CodigoVoltagem, number>();
  for (const item of entrada) {
    const quantidade = Math.floor(item.quantidade);
    if (!Number.isFinite(quantidade) || quantidade <= 0) continue;
    if (!variantePorCodigo(item.voltagem)) continue;
    agrupado.set(item.voltagem, (agrupado.get(item.voltagem) ?? 0) + quantidade);
  }

  const itens: ItemPedido[] = [];
  for (const [voltagem, quantidade] of agrupado) {
    const variante = variantePorCodigo(voltagem);
    if (!variante) continue;
    itens.push({
      voltagem,
      sku: variante.sku,
      descricao: `${PRODUTO.nome} ${variante.rotulo}`,
      quantidade: Math.min(quantidade, LIMITE_TECNICO_ITENS),
      precoUnitarioCentavos: PRODUTO.precoCentavos,
      descontoCentavos: 0,
    });
  }
  itens.sort((a, b) => a.voltagem.localeCompare(b.voltagem));

  const quantidadeTotal = itens.reduce((soma, item) => soma + item.quantidade, 0);
  const subtotalCentavos = itens.reduce(
    (soma, item) => soma + item.quantidade * item.precoUnitarioCentavos,
    0,
  );

  let descontoCentavos = 0;
  let cupomAplicado: string | null = null;
  if (cupom && cupomElegivel(cupom, subtotalCentavos)) {
    descontoCentavos =
      cupom.tipo === "PERCENTUAL"
        ? Math.floor((subtotalCentavos * cupom.valor) / 100)
        : Math.floor(cupom.valor);
    descontoCentavos = Math.max(0, Math.min(descontoCentavos, subtotalCentavos));
    if (descontoCentavos > 0) cupomAplicado = cupom.codigo;
  }

  // Rateia o desconto entre os itens para manter o total consistente em centavos.
  if (descontoCentavos > 0 && subtotalCentavos > 0) {
    let restante = descontoCentavos;
    itens.forEach((item, indice) => {
      const bruto = item.quantidade * item.precoUnitarioCentavos;
      const parte =
        indice === itens.length - 1
          ? restante
          : Math.floor((descontoCentavos * bruto) / subtotalCentavos);
      item.descontoCentavos = Math.min(parte, restante);
      restante -= item.descontoCentavos;
    });
  }

  const freteCentavos = PRODUTO.freteCentavos;
  const totalCentavos = subtotalCentavos - descontoCentavos + freteCentavos;

  return {
    itens,
    quantidadeTotal,
    subtotalCentavos,
    descontoCentavos,
    freteCentavos,
    totalCentavos,
    cupomAplicado,
  };
}

export function cupomElegivel(cupom: Cupom, subtotalCentavos: number, agora = new Date()): boolean {
  if (!cupom.ativo) return false;
  if (cupom.inicioEm && new Date(cupom.inicioEm) > agora) return false;
  if (cupom.fimEm && new Date(cupom.fimEm) < agora) return false;
  if (cupom.limiteUsos !== null && cupom.usos >= cupom.limiteUsos) return false;
  if (subtotalCentavos < cupom.minimoCentavos) return false;
  return true;
}

export type OpcaoParcela = {
  parcelas: number;
  valorParcelaCentavos: number;
  totalCentavos: number;
  comJuros: boolean;
};

/**
 * Parcela pela tabela Price: P = PV * i / (1 - (1 + i)^-n).
 * O total devolvido e sempre parcela x n, entao o que aparece na tela fecha
 * com o que e cobrado, sem sobra de centavos na ultima parcela.
 */
function parcelaComJuros(totalCentavos: number, parcelas: number): OpcaoParcela {
  const i = PARCELAMENTO.jurosAoMes;
  const parcela = (totalCentavos * i) / (1 - Math.pow(1 + i, -parcelas));
  const valorParcelaCentavos = Math.ceil(parcela);
  return {
    parcelas,
    valorParcelaCentavos,
    totalCentavos: valorParcelaCentavos * parcelas,
    comJuros: true,
  };
}

/** Calcula as opcoes de parcelamento no servidor. O navegador nunca decide valor. */
export function opcoesParcelamento(totalCentavos: number): OpcaoParcela[] {
  const opcoes: OpcaoParcela[] = [];
  for (let n = 1; n <= PARCELAMENTO.semJuros; n += 1) {
    opcoes.push({
      parcelas: n,
      valorParcelaCentavos: Math.round(totalCentavos / n),
      totalCentavos,
      comJuros: false,
    });
  }
  if (PARCELAMENTO.jurosAoMes > 0) {
    for (let n = PARCELAMENTO.semJuros + 1; n <= PARCELAMENTO.maximoTecnico; n += 1) {
      opcoes.push(parcelaComJuros(totalCentavos, n));
    }
  }
  return opcoes;
}

export function opcaoParcelaValida(totalCentavos: number, parcelas: number): OpcaoParcela | null {
  return opcoesParcelamento(totalCentavos).find((o) => o.parcelas === parcelas) ?? null;
}
