import { cookies } from "next/headers";
import { ENV, TEM_ADMIN, segredoSessao } from "./ambiente";
import { criarCookieAssinado, hashToken, lerCookieAssinado } from "./seguranca";

export const COOKIE_DESAFIO = "zelo_desafio";
export const COOKIE_SESSAO = "zelo_admin";
const DURACAO_SESSAO_HORAS = 8;

export type Desafio = { desafioId: string; email: string; criadoEm: number };
export type Sessao = { email: string; sid: string; criadoEm: number };

const opcoesCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function gravarDesafio(dados: Desafio): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_DESAFIO, criarCookieAssinado(dados, segredoSessao()), {
    ...opcoesCookie,
    maxAge: 60 * 10,
  });
}

export async function lerDesafio(): Promise<Desafio | null> {
  const jar = await cookies();
  return lerCookieAssinado<Desafio>(jar.get(COOKIE_DESAFIO)?.value, segredoSessao());
}

export async function limparDesafio(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_DESAFIO);
}

export async function abrirSessao(email: string): Promise<string> {
  const sid = hashToken(`${email}:${Date.now()}:${Math.random()}`).slice(0, 32);
  const jar = await cookies();
  jar.set(
    COOKIE_SESSAO,
    criarCookieAssinado({ email, sid, criadoEm: Date.now() } satisfies Sessao, segredoSessao()),
    { ...opcoesCookie, maxAge: 60 * 60 * DURACAO_SESSAO_HORAS },
  );
  return sid;
}

export async function fecharSessao(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_SESSAO);
  jar.delete(COOKIE_DESAFIO);
}

/** Unica funcao de autorizacao do painel. Toda rota e endpoint de admin chama isto. */
export async function sessaoValida(): Promise<Sessao | null> {
  if (!TEM_ADMIN) return null;
  const jar = await cookies();
  const sessao = lerCookieAssinado<Sessao>(jar.get(COOKIE_SESSAO)?.value, segredoSessao());
  if (!sessao) return null;
  if (sessao.email !== ENV.adminEmail) return null;
  const idade = Date.now() - sessao.criadoEm;
  if (idade > DURACAO_SESSAO_HORAS * 60 * 60 * 1000) return null;
  return sessao;
}

export async function exigirSessao(): Promise<Sessao> {
  const sessao = await sessaoValida();
  if (!sessao) throw new Error("Acesso negado");
  return sessao;
}
