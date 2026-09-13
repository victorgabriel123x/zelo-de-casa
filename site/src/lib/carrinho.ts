import type { CodigoVoltagem } from "./produto";
import type { EntradaItem } from "./precos";

function inteiro(valor: string | undefined, padrao: number): number {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return padrao;
  return Math.max(1, Math.min(20, Math.floor(numero)));
}

/**
 * Le a selecao vinda do formulario da oferta. O formulario funciona sem
 * JavaScript, entao a selecao chega pela query string.
 */
export function itensDaConsulta(consulta: Record<string, string | string[] | undefined>): EntradaItem[] {
  const texto = (chave: string): string | undefined => {
    const valor = consulta[chave];
    return Array.isArray(valor) ? valor[0] : valor;
  };

  const principal = texto("v");
  if (principal !== "127" && principal !== "220") return [];

  const itens: EntradaItem[] = [
    { voltagem: principal as CodigoVoltagem, quantidade: inteiro(texto("q"), 1) },
  ];

  if (texto("outra") === "on") {
    const outra: CodigoVoltagem = principal === "127" ? "220" : "127";
    itens.push({ voltagem: outra, quantidade: inteiro(texto("q2"), 1) });
  }
  return itens;
}

export function itensParaConsulta(itens: EntradaItem[]): string {
  const principal = itens[0];
  if (!principal) return "";
  const parametros = new URLSearchParams({
    v: principal.voltagem,
    q: String(principal.quantidade),
  });
  const segundo = itens[1];
  if (segundo) {
    parametros.set("outra", "on");
    parametros.set("q2", String(segundo.quantidade));
  }
  return parametros.toString();
}
