import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual, scryptSync } from "node:crypto";

const ALFABETO = "ABCDEFGHJKMNPQRSTVWXYZ0123456789"; // sem I, L, O e U para leitura em voz alta

/** Numero publico do pedido com alta entropia, sem sequencia previsivel. */
export function gerarNumeroPedido(): string {
  const bytes = randomBytes(10);
  let saida = "";
  for (const byte of bytes) saida += ALFABETO[byte % ALFABETO.length];
  return `ZC-${saida.slice(0, 5)}-${saida.slice(5, 10)}`;
}

export function gerarToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function gerarCodigoNumerico(digitos = 6): string {
  let codigo = "";
  for (let i = 0; i < digitos; i += 1) codigo += randomInt(0, 10).toString();
  return codigo;
}

/** Hash de senha com scrypt. O formato guardado e scrypt$<salt>$<derivado>. */
export function hashSenha(senha: string, saltInformado?: string): string {
  const salt = saltInformado ?? randomBytes(16).toString("hex");
  const derivado = scryptSync(senha.normalize("NFKC"), salt, 64).toString("hex");
  return `scrypt$${salt}$${derivado}`;
}

export function conferirSenha(senha: string, guardado: string): boolean {
  const partes = guardado.split("$");
  if (partes.length !== 3 || partes[0] !== "scrypt") return false;
  const calculado = hashSenha(senha, partes[1]);
  return comparacaoSegura(calculado, guardado);
}

export function comparacaoSegura(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export function assinar(valor: string, segredo: string): string {
  return createHmac("sha256", segredo).update(valor).digest("base64url");
}

export function criarCookieAssinado(dados: Record<string, unknown>, segredo: string): string {
  const corpo = Buffer.from(JSON.stringify(dados)).toString("base64url");
  return `${corpo}.${assinar(corpo, segredo)}`;
}

export function lerCookieAssinado<T>(valor: string | undefined, segredo: string): T | null {
  if (!valor) return null;
  const separador = valor.lastIndexOf(".");
  if (separador < 0) return null;
  const corpo = valor.slice(0, separador);
  const assinatura = valor.slice(separador + 1);
  if (!comparacaoSegura(assinar(corpo, segredo), assinatura)) return null;
  try {
    return JSON.parse(Buffer.from(corpo, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

/** Mascara usada em logs e telas. Nunca guardamos o numero completo do cartao. */
export function ultimosQuatro(numero: string): string {
  return numero.slice(-4).padStart(4, "0");
}
