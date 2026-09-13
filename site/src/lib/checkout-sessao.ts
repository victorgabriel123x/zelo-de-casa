import { cookies } from "next/headers";
import { segredoSessao } from "./ambiente";
import { criarCookieAssinado, lerCookieAssinado } from "./seguranca";
import type { EntradaEntrega } from "./validacao";

const COOKIE = "zelo_checkout";
const DURACAO_MINUTOS = 60;

type Guardado = EntradaEntrega & { criadoEm: number };

/**
 * Carrega os dados da primeira etapa do checkout entre as duas telas.
 *
 * O cookie e assinado e httpOnly: o navegador nao consegue alterar nome,
 * CPF ou endereco no caminho. Ainda assim nada aqui e tratado como confiavel,
 * porque a etapa de pagamento revalida tudo com o mesmo esquema antes de
 * registrar o pedido. Nao guarda nada de cartao.
 */
export async function guardarDadosEntrega(dados: EntradaEntrega): Promise<void> {
  const jar = await cookies();
  const conteudo: Guardado = { ...dados, criadoEm: Date.now() };
  jar.set(COOKIE, criarCookieAssinado(conteudo, segredoSessao()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * DURACAO_MINUTOS,
  });
}

export async function lerDadosEntrega(): Promise<EntradaEntrega | null> {
  const jar = await cookies();
  const guardado = lerCookieAssinado<Guardado>(jar.get(COOKIE)?.value, segredoSessao());
  if (!guardado) return null;
  if (Date.now() - guardado.criadoEm > DURACAO_MINUTOS * 60 * 1000) return null;
  return { comprador: guardado.comprador, endereco: guardado.endereco };
}

export async function limparDadosEntrega(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
