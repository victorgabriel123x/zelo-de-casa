/**
 * Identificacao do vendedor. Sem os dados reais configurados, as paginas
 * mostram um marcador de pendencia visivel em vez de inventar informacao.
 */
function texto(nome: string): string | null {
  const valor = process.env[nome];
  if (!valor || valor.trim() === "" || valor.startsWith("substitua")) return null;
  return valor.trim();
}

export const FORNECEDOR = {
  nome: texto("FORNECEDOR_NOME"),
  documento: texto("FORNECEDOR_DOCUMENTO"),
  endereco: texto("FORNECEDOR_ENDERECO"),
  municipio: texto("FORNECEDOR_MUNICIPIO"),
  estado: texto("FORNECEDOR_ESTADO") ?? "Maranhão",
  retencaoDados: texto("POLITICA_RETENCAO"),
  garantiaMeses: texto("GARANTIA_CONTRATUAL_MESES"),
  regiaoDados: texto("REGIAO_DADOS"),
} as const;

export const FORNECEDOR_COMPLETO = Boolean(
  FORNECEDOR.nome && FORNECEDOR.documento && FORNECEDOR.endereco,
);
