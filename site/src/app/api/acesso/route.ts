import { NextResponse } from "next/server";
import { ENV } from "@/lib/ambiente";
import { montarEmail } from "@/lib/email-templates";
import { criarLinkAcessoPublico, enviarEmailDireto } from "@/lib/notificacoes";
import { obterPedidoPorNumero } from "@/lib/repositorio";
import { ipDaRequisicao, limitar } from "@/lib/rate-limit";

/**
 * Envia um acesso temporario para o e-mail do pedido.
 * A resposta e sempre a mesma, com ou sem correspondencia, para nao revelar
 * a existencia de um pedido nem o e-mail de quem comprou.
 */
export async function POST(requisicao: Request) {
  const ip = ipDaRequisicao(requisicao.headers);
  if (!limitar(`acesso:${ip}`, 8, 10 * 60_000)) {
    return NextResponse.json(
      { ok: true, mensagem: "Se os dados estiverem corretos, o acesso chega por e-mail." },
      { status: 200 },
    );
  }

  const corpo = await requisicao.json().catch(() => ({}));
  const numero = String(corpo?.numero ?? "").trim();
  const email = String(corpo?.email ?? "").trim().toLowerCase();

  if (numero && email) {
    const pedido = await obterPedidoPorNumero(numero);
    if (pedido && pedido.comprador.email === email) {
      try {
        const url = await criarLinkAcessoPublico(pedido);
        const modelo = montarEmail("ACESSO_PEDIDO", pedido, url);
        await enviarEmailDireto(email, modelo.assunto, modelo.html, modelo.texto);
      } catch (erro) {
        console.error("falha ao enviar acesso", erro instanceof Error ? erro.message : erro);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    mensagem: `Se os dados estiverem corretos, enviamos um acesso temporário para o e-mail do pedido. O link vale por 30 minutos.${
      ENV.resendApiKey ? "" : " Em modo demonstração nenhum e-mail é enviado de verdade."
    }`,
  });
}
