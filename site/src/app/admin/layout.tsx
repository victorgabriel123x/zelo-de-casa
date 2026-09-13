import type { Metadata } from "next";
import Link from "next/link";
import { Marca } from "@/components/Marca";
import { sessaoValida } from "@/lib/sessao-admin";
import { sair } from "./acoes";

export const metadata: Metadata = {
  title: "Gestão da Zelo de Casa",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const sessao = await sessaoValida();
  return (
    <>
      <header className="cabecalho">
        <div className="container">
          <Link href={sessao ? "/admin/pedidos" : "/admin"} className="cabecalho__marca">
            <Marca altura={34} />
          </Link>
          {sessao && (
            <nav className="cabecalho__nav" aria-label="Painel">
              <Link href="/admin/pedidos">Pedidos</Link>
              <Link href="/admin/cupons">Cupons</Link>
              <Link href="/">Ver a loja</Link>
            </nav>
          )}
          <div className="cabecalho__acoes">
            {sessao && (
              <form action={sair}>
                <button type="submit" className="botao botao--contorno">
                  Sair
                </button>
              </form>
            )}
          </div>
        </div>
      </header>
      <main id="conteudo" className="painel">
        <div className="container">{children}</div>
      </main>
    </>
  );
}
