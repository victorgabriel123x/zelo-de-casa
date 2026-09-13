const formatadorBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatarCentavos(centavos: number): string {
  return formatadorBRL.format(centavos / 100);
}

export function formatarCentavosSimples(centavos: number): string {
  return formatarCentavos(centavos).replace(/ /g, " ");
}

export function centavosParaReais(centavos: number): number {
  return Math.round(centavos) / 100;
}
