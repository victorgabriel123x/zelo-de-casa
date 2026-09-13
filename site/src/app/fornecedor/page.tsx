import type { Metadata } from "next";
import { PaginaTexto } from "@/components/PaginaTexto";
import { AvisoPendencias, Pendente } from "@/components/Pendente";
import { FORNECEDOR, FORNECEDOR_COMPLETO } from "@/lib/fornecedor";
import { LOJA } from "@/lib/produto";

export const metadata: Metadata = {
  title: "Dados do fornecedor",
  description: "Identificação do vendedor responsável pela loja Zelo de Casa.",
};

export default function Fornecedor() {
  return (
    <PaginaTexto
      titulo="Dados do fornecedor"
      resumo="Identificação de quem vende, cobra e entrega os produtos anunciados nesta loja."
    >
      {!FORNECEDOR_COMPLETO && <AvisoPendencias />}

      <h2>Quem é a loja</h2>
      <p>
        Zelo de Casa é o nome da loja operada por{" "}
        {FORNECEDOR.nome ?? <Pendente>nome completo do responsável</Pendente>}, inscrito sob{" "}
        {FORNECEDOR.documento ?? <Pendente>CPF ou CNPJ</Pendente>}, com endereço em{" "}
        {FORNECEDOR.endereco ?? <Pendente>endereço completo</Pendente>}
        {FORNECEDOR.municipio ? `, ${FORNECEDOR.municipio}` : ""}, {FORNECEDOR.estado}, Brasil.
      </p>
      <p>
        Atendimento: <a href={`mailto:${LOJA.email}`}>{LOJA.email}</a>
      </p>

      <h2>Relação com a fabricante</h2>
      <p>
        A Britânia é a fabricante do produto anunciado. A Zelo de Casa é a loja vendedora e não se
        apresenta como canal oficial, revenda autorizada ou representante da fabricante.
      </p>

      <h2>Produto vendido</h2>
      <p>
        Mini Processador Britânia 2P, novo, na cor preta, nas versões 127 V e 220 V, acompanhado de
        nota fiscal emitida pelo vendedor.
      </p>
    </PaginaTexto>
  );
}
