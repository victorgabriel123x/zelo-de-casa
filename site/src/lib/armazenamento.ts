import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { ENV, TEM_BANCO } from "./ambiente";

const TIPOS_PERMITIDOS = new Set(["application/pdf", "application/xml", "text/xml"]);
const TAMANHO_MAXIMO = 10 * 1024 * 1024;

export type ResultadoUpload = {
  caminho: string;
  hash: string;
  nomeArquivo: string;
};

/**
 * Guarda a nota fiscal em bucket privado. O arquivo e validado por tipo e
 * tamanho, renomeado e nunca servido diretamente por URL publica.
 */
export async function guardarNotaFiscal(
  pedidoId: string,
  arquivo: File,
): Promise<ResultadoUpload> {
  if (!TIPOS_PERMITIDOS.has(arquivo.type)) {
    throw new Error("Envie a nota fiscal em PDF ou XML");
  }
  if (arquivo.size > TAMANHO_MAXIMO) {
    throw new Error("O arquivo passa do limite de 10 MB");
  }

  const bytes = Buffer.from(await arquivo.arrayBuffer());
  const assinatura = bytes.subarray(0, 5).toString("utf8");
  const pareceParaPdf = assinatura.startsWith("%PDF");
  const pareceXml = bytes.subarray(0, 200).toString("utf8").trimStart().startsWith("<");
  if (arquivo.type === "application/pdf" && !pareceParaPdf) {
    throw new Error("O conteúdo do arquivo não corresponde a um PDF");
  }
  if (arquivo.type !== "application/pdf" && !pareceXml) {
    throw new Error("O conteúdo do arquivo não corresponde a um XML");
  }

  const hash = createHash("sha256").update(bytes).digest("hex");
  const extensao = arquivo.type === "application/pdf" ? "pdf" : "xml";
  const caminho = `${pedidoId}/${hash.slice(0, 16)}.${extensao}`;

  if (!TEM_BANCO) {
    // Sem Supabase configurado a demonstracao apenas registra os metadados.
    return { caminho, hash, nomeArquivo: `nota-fiscal.${extensao}` };
  }

  const db = createClient(ENV.supabaseUrl!, ENV.supabaseServiceKey!, {
    auth: { persistSession: false },
  });
  const { error } = await db.storage
    .from(ENV.supabaseBucketNotas)
    .upload(caminho, bytes, { contentType: arquivo.type, upsert: true });
  if (error) throw new Error(`Falha ao guardar a nota fiscal: ${error.message}`);

  return { caminho, hash, nomeArquivo: `nota-fiscal.${extensao}` };
}

/** URL assinada e temporaria. Nunca expomos o bucket publicamente. */
export async function urlTemporariaNota(caminho: string, segundos = 300): Promise<string | null> {
  if (!TEM_BANCO) return null;
  const db = createClient(ENV.supabaseUrl!, ENV.supabaseServiceKey!, {
    auth: { persistSession: false },
  });
  const { data } = await db.storage.from(ENV.supabaseBucketNotas).createSignedUrl(caminho, segundos);
  return data?.signedUrl ?? null;
}
