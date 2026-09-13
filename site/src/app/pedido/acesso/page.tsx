import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import { liberarPedidoNoNavegador } from "@/lib/acesso-pedido";
import { consumirTokenAcesso, obterPedidoPorId } from "@/lib/repositorio";
import { hashToken } from "@/lib/seguranca";

export const metadata: Metadata = {
  title: "Acesso ao pedido",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AcessoPedido({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const pedidoId = t ? await consumirTokenAcesso(hashToken(t)) : null;
  const pedido = pedidoId ? await obterPedidoPorId(pedidoId) : null;

  if (pedido) {
    await liberarPedidoNoNavegador(pedido.numero);
    redirect(`/pedido/confirmacao?n=${encodeURIComponent(pedido.numero)}`);
  }

  return (
    <>
      <Cabecalho compacto />
      <main id="conteudo" className="pagina-simples">
        <div className="container pagina-simples__conteudo">
          <h1>Este acesso não está mais válido</h1>
          <p>
            O link de acesso vale por 30 minutos e pode ser usado apenas a partir do e-mail do
            pedido. Peça um novo acesso na página de acompanhamento.
          </p>
          <p style={{ marginTop: 28 }}>
            <Link className="botao" href="/acompanhar">
              Acompanhar pedido
            </Link>
          </p>
        </div>
      </main>
      <Rodape />
    </>
  );
}
