import Link from "next/link";
import { Marca } from "./Marca";

export function Cabecalho({ compacto = false }: { compacto?: boolean }) {
  return (
    <header className="cabecalho">
      <div className="container">
        <Link href="/" className="cabecalho__marca" aria-label="Zelo de Casa, página inicial">
          <Marca altura={38} pulsar />
        </Link>

        {!compacto && (
          <nav className="cabecalho__nav" aria-label="Seções da página">
            <a href="#produto">O produto</a>
            <a href="#como-usar">Como usar</a>
            <a href="#detalhes">Detalhes</a>
            <a href="#duvidas">Dúvidas</a>
            <Link href="/acompanhar">Acompanhar pedido</Link>
          </nav>
        )}

        <div className="cabecalho__acoes">
          {compacto ? (
            <Link href="/" className="botao botao--contorno">
              Voltar para a loja
            </Link>
          ) : (
            <Link href="/comprar" className="botao">
              Comprar agora
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
