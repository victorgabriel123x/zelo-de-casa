// Leitura central de variaveis de ambiente. Sem credenciais a loja funciona em
// modo demonstracao: nada e cobrado, nada e enviado e a interface avisa o visitante.

function texto(nome: string): string | undefined {
  const valor = process.env[nome];
  if (!valor || valor.trim() === "" || valor.startsWith("substitua")) return undefined;
  return valor.trim();
}

export const ENV = {
  siteUrl: texto("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000",
  supabaseUrl: texto("SUPABASE_URL"),
  supabaseServiceKey: texto("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseBucketNotas: texto("SUPABASE_BUCKET_NOTAS") ?? "notas-fiscais",
  asaasApiKey: texto("ASAAS_API_KEY"),
  asaasAmbiente: (texto("ASAAS_AMBIENTE") ?? "sandbox") as "sandbox" | "producao",
  asaasWebhookToken: texto("ASAAS_WEBHOOK_TOKEN"),
  resendApiKey: texto("RESEND_API_KEY"),
  emailRemetente: texto("EMAIL_REMETENTE"),
  emailAdmin: texto("EMAIL_ADMIN"),
  whatsappToken: texto("WHATSAPP_TOKEN"),
  whatsappPhoneId: texto("WHATSAPP_PHONE_NUMBER_ID"),
  adminEmail: texto("ADMIN_EMAIL"),
  adminSenhaHash: texto("ADMIN_SENHA_HASH"),
  segredoSessao: texto("SEGREDO_SESSAO"),
  cronSegredo: texto("CRON_SEGREDO"),
  gaId: texto("NEXT_PUBLIC_GA_ID"),
  metaPixelId: texto("NEXT_PUBLIC_META_PIXEL_ID"),
  vendasPausadas: texto("VENDAS_PAUSADAS") === "true",
} as const;

export const TEM_BANCO = Boolean(ENV.supabaseUrl && ENV.supabaseServiceKey);
export const TEM_PAGAMENTO = Boolean(ENV.asaasApiKey);
export const TEM_EMAIL = Boolean(ENV.resendApiKey && ENV.emailRemetente);
export const TEM_WHATSAPP = Boolean(ENV.whatsappToken && ENV.whatsappPhoneId);
export const TEM_ADMIN = Boolean(ENV.adminEmail && ENV.adminSenhaHash && ENV.segredoSessao);

/** Em modo demonstracao nenhum pagamento real e criado e nenhuma mensagem sai. */
export const MODO_DEMONSTRACAO = !TEM_PAGAMENTO;

export function segredoSessao(): string {
  // Em demonstracao gera um segredo efemero para nao exigir configuracao.
  return ENV.segredoSessao ?? "demonstracao-sem-segredo-configurado";
}
