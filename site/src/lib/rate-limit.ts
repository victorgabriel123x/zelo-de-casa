/**
 * Limite de requisicoes em memoria. Serve para uma instancia.
 * Em producao com varias instancias serverless, trocar por Upstash Redis
 * ou equivalente. O README registra essa pendencia.
 */
type Janela = { contador: number; reiniciaEm: number };
const janelas = new Map<string, Janela>();

export function limitar(chave: string, maximo: number, janelaMs: number): boolean {
  const agora = Date.now();
  const atual = janelas.get(chave);
  if (!atual || atual.reiniciaEm < agora) {
    janelas.set(chave, { contador: 1, reiniciaEm: agora + janelaMs });
    return true;
  }
  if (atual.contador >= maximo) return false;
  atual.contador += 1;
  return true;
}

export function ipDaRequisicao(cabecalhos: Headers): string {
  const encaminhado = cabecalhos.get("x-forwarded-for");
  if (encaminhado) return encaminhado.split(",")[0]!.trim();
  return cabecalhos.get("x-real-ip") ?? "0.0.0.0";
}

/** Limpa janelas vencidas para a memoria nao crescer sem limite. */
export function limparJanelas(): void {
  const agora = Date.now();
  for (const [chave, janela] of janelas) if (janela.reiniciaEm < agora) janelas.delete(chave);
}
