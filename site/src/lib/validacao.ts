import { z } from "zod";

export function apenasDigitos(valor: string): string {
  return valor.replace(/\D+/g, "");
}

export function cpfValido(entrada: string): boolean {
  const cpf = apenasDigitos(entrada);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  const digito = (ate: number) => {
    let soma = 0;
    for (let i = 0; i < ate; i += 1) soma += Number(cpf[i]) * (ate + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]);
}

export const ESTADOS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
] as const;

export const esquemaItem = z.object({
  voltagem: z.enum(["127", "220"]),
  quantidade: z.number().int().min(1).max(20),
});

export const esquemaComprador = z.object({
  nome: z
    .string()
    .trim()
    .min(5, "Informe o nome completo")
    .max(120)
    .refine((v) => v.split(/\s+/).length >= 2, "Informe nome e sobrenome"),
  cpf: z.string().transform(apenasDigitos).refine(cpfValido, "Informe um CPF válido"),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido").max(160),
  whatsapp: z
    .string()
    .transform(apenasDigitos)
    .refine((v) => v.length === 10 || v.length === 11, "Informe DDD e número"),
});

export const esquemaEndereco = z.object({
  cep: z.string().transform(apenasDigitos).refine((v) => v.length === 8, "Informe um CEP válido"),
  logradouro: z.string().trim().min(3, "Informe o endereço").max(160),
  numero: z.string().trim().max(20).optional().default(""),
  semNumero: z.boolean().default(false),
  complemento: z.string().trim().max(80).optional().default(""),
  bairro: z.string().trim().min(2, "Informe o bairro").max(80),
  cidade: z.string().trim().min(2, "Informe a cidade").max(80),
  estado: z.enum(ESTADOS),
});

export const esquemaConsentimentos = z.object({
  termos: z.literal(true, { message: "É preciso aceitar os termos para continuar" }),
  privacidade: z.literal(true, { message: "Confirme a ciência da política de privacidade" }),
  whatsappOptIn: z.boolean().default(false),
});

export const esquemaPedido = z.object({
  itens: z.array(esquemaItem).min(1, "Selecione a voltagem para continuar"),
  cupom: z.string().trim().max(40).optional().default(""),
  comprador: esquemaComprador,
  endereco: esquemaEndereco,
  consentimentos: esquemaConsentimentos,
  formaPagamento: z.enum(["PIX", "CARTAO"]),
  parcelas: z.number().int().min(1).max(10).default(1),
});

export type EntradaPedido = z.infer<typeof esquemaPedido>;

export const esquemaCartao = z.object({
  titular: z.string().trim().min(5).max(120),
  numero: z.string().transform(apenasDigitos).refine((v) => v.length >= 13 && v.length <= 19, "Número do cartão inválido"),
  mes: z.string().transform(apenasDigitos).refine((v) => Number(v) >= 1 && Number(v) <= 12, "Mês inválido"),
  ano: z.string().transform(apenasDigitos).refine((v) => v.length === 2 || v.length === 4, "Ano inválido"),
  cvv: z.string().transform(apenasDigitos).refine((v) => v.length === 3 || v.length === 4, "Código inválido"),
});
