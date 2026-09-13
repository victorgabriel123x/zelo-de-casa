import { NextResponse } from "next/server";
import { ENV } from "@/lib/ambiente";
import { processarFila } from "@/lib/notificacoes";
import { comparacaoSegura } from "@/lib/seguranca";
import { limparJanelas } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Processamento da fila de notificacoes.
 * Deve ser chamada por um agendamento externo, por exemplo o Cron da Vercel,
 * com o cabecalho Authorization Bearer CRON_SEGREDO.
 */
export async function POST(requisicao: Request) {
  if (!ENV.cronSegredo) {
    return NextResponse.json({ erro: "Agendamento não configurado" }, { status: 503 });
  }
  const autorizacao = requisicao.headers.get("authorization") ?? "";
  if (!comparacaoSegura(autorizacao, `Bearer ${ENV.cronSegredo}`)) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  limparJanelas();
  const resultado = await processarFila(30);
  return NextResponse.json({ ok: true, ...resultado });
}

export const GET = POST;
