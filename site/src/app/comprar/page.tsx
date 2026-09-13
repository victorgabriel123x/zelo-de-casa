import type { Metadata } from "next";
import Link from "next/link";
import { Cabecalho } from "@/components/Cabecalho";
import { Faixa } from "@/components/Faixa";
import { Foto } from "@/components/Foto";
import { FormularioCompra } from "@/components/FormularioCompra";
import { Icone } from "@/components/Icone";
import { Rodape } from "@/components/Rodape";
import { ENV, MODO_DEMONSTRACAO } from "@/lib/ambiente";
import { ESPECIFICACOES, IMAGENS, PRODUTO, SELOS_HERO } from "@/lib/produto";
import type { NomeIcone } from "@/lib/icones";

export const metadata: Metadata = {
  title: "Comprar",
  description:
    "Escolha a voltagem e a quantidade do Mini Processador Britânia 2P. Frete grátis para todo o Brasil, produto novo com nota fiscal.",
};

/** Escolha de voltagem e quantidade, em pagina propria antes do checkout. */
export default function Comprar() {
  return (
    <>
      <Faixa />
      <Cabecalho />

      <main id="conteudo" className="secao">
        <div className="container">
          <div className="oferta__grade">
            <div>
              <div className="oferta__figura">
                <Foto
                  base={IMAGENS.oferta.base}
                  alt={IMAGENS.oferta.alt}
                  prioridade
                  tamanhos="(max-width: 900px) 100vw, 520px"
                />
              </div>

              <ul className="ficha-rapida">
                {ESPECIFICACOES.slice(0, 5).map((linha) => (
                  <li key={linha.rotulo}>
                    <span>{linha.rotulo}</span>
                    <strong>{linha.valor}</strong>
                  </li>
                ))}
              </ul>
              <p className="texto-pequeno texto-suave" style={{ marginTop: 14 }}>
                Ficha completa e dúvidas frequentes na{" "}
                <Link href="/#detalhes">página do produto</Link>.
              </p>
            </div>

            <div>
              {MODO_DEMONSTRACAO && (
                <p className="aviso-demo">
                  Modo demonstração. Nenhuma cobrança é feita e nenhuma mensagem é enviada enquanto
                  as credenciais de pagamento não estiverem configuradas.
                </p>
              )}

              <FormularioCompra vendasPausadas={ENV.vendasPausadas} />

              <ul className="selos-compra">
                {SELOS_HERO.map((selo) => (
                  <li key={selo.texto}>
                    <Icone nome={selo.icone as NomeIcone} tamanho={17} />
                    {selo.texto}
                  </li>
                ))}
              </ul>

              <p className="texto-pequeno texto-suave" style={{ marginTop: 18 }}>
                {PRODUTO.garantia}.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Rodape />
    </>
  );
}
