import { cookies } from "next/headers";
import { segredoSessao } from "./ambiente";
import { criarCookieAssinado, lerCookieAssinado } from "./seguranca";

const COOKIE = "zelo_pedido";
const DURACAO_HORAS = 4;

type Credencial = { numeros: string[]; criadoEm: number };

/**
 * Guarda no proprio navegador quais pedidos foram criados nesta sessao de compra.
 * E o que permite mostrar o resumo completo logo apos a compra sem expor dados
 * a quem apenas conhece o numero do pedido.
 */
export async function liberarPedidoNoNavegador(numero: string): Promise<void> {
  const jar = await cookies();
  const atual = lerCookieAssinado<Credencial>(jar.get(COOKIE)?.value, segredoSessao());
  const numeros = [...new Set([...(atual?.numeros ?? []), numero])].slice(-5);
  jar.set(COOKIE, criarCookieAssinado({ numeros, criadoEm: Date.now() }, segredoSessao()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * DURACAO_HORAS,
  });
}

export async function pedidoLiberadoNoNavegador(numero: string): Promise<boolean> {
  const jar = await cookies();
  const atual = lerCookieAssinado<Credencial>(jar.get(COOKIE)?.value, segredoSessao());
  if (!atual) return false;
  if (Date.now() - atual.criadoEm > DURACAO_HORAS * 60 * 60 * 1000) return false;
  return atual.numeros.includes(numero);
}
