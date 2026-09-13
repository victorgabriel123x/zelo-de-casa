import type { ReactNode } from "react";
import { Cabecalho } from "./Cabecalho";
import { Rodape } from "./Rodape";

export function PaginaTexto({
  titulo,
  resumo,
  children,
}: {
  titulo: string;
  resumo?: string;
  children: ReactNode;
}) {
  return (
    <>
      <Cabecalho compacto />
      <main id="conteudo" className="pagina-simples">
        <div className="container">
          <div className="pagina-simples__conteudo">
            <h1>{titulo}</h1>
            {resumo && <p style={{ fontSize: 18 }}>{resumo}</p>}
            {children}
          </div>
        </div>
      </main>
      <Rodape />
    </>
  );
}
