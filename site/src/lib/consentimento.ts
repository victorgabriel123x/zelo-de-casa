export type Consentimento = {
  essenciais: true;
  analise: boolean;
  publicidade: boolean;
  versao: number;
  registradoEm: string;
};

export const CHAVE_CONSENTIMENTO = "zelo:consentimento";
export const VERSAO_CONSENTIMENTO = 1;
export const EVENTO_ABRIR_PREFERENCIAS = "zelo:abrir-preferencias";
export const EVENTO_CONSENTIMENTO = "zelo:consentimento-alterado";

export function lerConsentimento(): Consentimento | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = window.localStorage.getItem(CHAVE_CONSENTIMENTO);
    if (!bruto) return null;
    const dados = JSON.parse(bruto) as Consentimento;
    if (dados.versao !== VERSAO_CONSENTIMENTO) return null;
    return dados;
  } catch {
    return null;
  }
}

export function gravarConsentimento(analise: boolean, publicidade: boolean): Consentimento {
  const dados: Consentimento = {
    essenciais: true,
    analise,
    publicidade,
    versao: VERSAO_CONSENTIMENTO,
    registradoEm: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(CHAVE_CONSENTIMENTO, JSON.stringify(dados));
  } catch {
    // navegacao privada ou armazenamento bloqueado: a compra continua funcionando
  }
  window.dispatchEvent(new CustomEvent(EVENTO_CONSENTIMENTO, { detail: dados }));
  return dados;
}
