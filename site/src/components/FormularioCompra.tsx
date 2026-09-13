"use client";

import { useMemo, useState } from "react";
import { Icone } from "./Icone";
import { formatarCentavos } from "@/lib/dinheiro";
import { calcularResumo } from "@/lib/precos";
import { PRODUTO, VARIANTES, type CodigoVoltagem } from "@/lib/produto";

/**
 * Formulario da oferta. Funciona como formulario GET comum, sem JavaScript:
 * envia voltagem, quantidade e, se marcado, a segunda voltagem para /checkout.
 * Com JavaScript ativo acrescenta o resumo em tempo real.
 */
export function FormularioCompra({ vendasPausadas = false }: { vendasPausadas?: boolean }) {
  const [voltagem, setVoltagem] = useState<CodigoVoltagem | "">("");
  const [quantidade, setQuantidade] = useState(1);
  const [outra, setOutra] = useState(false);
  const [quantidadeOutra, setQuantidadeOutra] = useState(1);
  const [erro, setErro] = useState<string | null>(null);

  const segunda = voltagem === "127" ? "220" : voltagem === "220" ? "127" : "";

  const resumo = useMemo(() => {
    if (!voltagem) return null;
    const itens = [{ voltagem, quantidade }];
    if (outra && segunda) itens.push({ voltagem: segunda, quantidade: quantidadeOutra });
    return calcularResumo(itens, null);
  }, [voltagem, quantidade, outra, quantidadeOutra, segunda]);

  return (
    <form
      className="cartao-compra"
      id="comprar"
      method="get"
      action="/checkout"
      onSubmit={(evento) => {
        if (!voltagem) {
          evento.preventDefault();
          setErro("Selecione a voltagem para continuar");
          document.getElementById("voltagem-127")?.focus();
        }
      }}
    >
      <p className="disponibilidade">{PRODUTO.disponibilidade}</p>
      <h2>Leve mais praticidade para sua cozinha</h2>

      <fieldset className="campo-grupo" style={{ marginTop: 26 }}>
        <legend>Escolha a voltagem</legend>
        <div className="voltagens">
          {VARIANTES.map((variante) => (
            <label className="voltagem" key={variante.codigo}>
              <input
                type="radio"
                name="v"
                id={`voltagem-${variante.codigo}`}
                value={variante.codigo}
                checked={voltagem === variante.codigo}
                onChange={() => {
                  setVoltagem(variante.codigo);
                  setErro(null);
                }}
                required
              />
              <span>{variante.rotulo}</span>
            </label>
          ))}
        </div>
        {erro && (
          <p className="erro-campo" role="alert">
            {erro}
          </p>
        )}
      </fieldset>

      <div className="linha-voltagem">
        <span className="linha-voltagem__rotulo">
          <label htmlFor="quantidade">Quantidade</label>
        </span>
        <Contador
          id="quantidade"
          nome="q"
          valor={quantidade}
          aoMudar={setQuantidade}
          rotulo={voltagem ? `Quantidade de ${voltagem} V` : "Quantidade"}
        />
      </div>

      <div className="campo-grupo" style={{ marginTop: 4 }}>
        <label className="caixa-marcar">
          <input
            type="checkbox"
            name="outra"
            value="on"
            checked={outra}
            onChange={(e) => setOutra(e.target.checked)}
            disabled={!voltagem}
          />
          <span>
            Adicionar outra voltagem
            {segunda ? ` (${segunda} V)` : ""}
          </span>
        </label>
      </div>

      {outra && segunda && (
        <div className="linha-voltagem">
          <span className="linha-voltagem__rotulo">
            <label htmlFor="quantidade-outra">Quantidade de {segunda} V</label>
          </span>
          <Contador
            id="quantidade-outra"
            nome="q2"
            valor={quantidadeOutra}
            aoMudar={setQuantidadeOutra}
            rotulo={`Quantidade de ${segunda} V`}
          />
        </div>
      )}

      <div className="resumo-preco">
        <p className="texto-pequeno texto-suave" style={{ margin: "0 0 6px" }}>
          De {formatarCentavos(PRODUTO.precoAnteriorCentavos)} por
        </p>
        <div className="resumo-linha resumo-linha--destaque">
          <span>{resumo && resumo.quantidadeTotal > 1 ? "Total" : "Por unidade"}</span>
          <strong>
            {formatarCentavos(resumo ? resumo.totalCentavos : PRODUTO.precoCentavos)}
          </strong>
        </div>
        <p className="texto-pequeno texto-suave" style={{ marginTop: 8 }}>
          No Pix ou em 2x de{" "}
          {formatarCentavos(Math.round((resumo ? resumo.totalCentavos : PRODUTO.precoCentavos) / 2))}{" "}
          sem juros
        </p>
      </div>

      <div className="aviso-frete">
        <Icone nome="caminhao" tamanho={18} />
        <span>
          Frete grátis para todo o Brasil. Postagem em até {PRODUTO.prazoPostagemDiasUteis} dias
          úteis após a confirmação do pagamento. Entrega estimada em{" "}
          {PRODUTO.prazoEntregaDiasUteis} dias úteis após a postagem.
        </span>
      </div>

      <button type="submit" className="botao botao--largo" disabled={vendasPausadas}>
        {vendasPausadas ? "Vendas pausadas" : "Comprar agora"}
      </button>

      <p className="texto-pequeno texto-suave" style={{ marginTop: 14, textAlign: "center" }}>
        Preço anterior informado pelo vendedor. Produto novo com nota fiscal.
      </p>
    </form>
  );
}

function Contador({
  id,
  nome,
  valor,
  aoMudar,
  rotulo,
}: {
  id: string;
  nome: string;
  valor: number;
  aoMudar: (n: number) => void;
  rotulo: string;
}) {
  const limitar = (n: number) => Math.max(1, Math.min(20, n));
  return (
    <div className="contador">
      <button
        type="button"
        onClick={() => aoMudar(limitar(valor - 1))}
        aria-label={`Diminuir ${rotulo.toLowerCase()}`}
      >
        <Icone nome="menos" tamanho={16} />
      </button>
      <input
        id={id}
        name={nome}
        type="number"
        inputMode="numeric"
        min={1}
        max={20}
        step={1}
        value={valor}
        aria-label={rotulo}
        onChange={(e) => aoMudar(limitar(Number(e.target.value) || 1))}
      />
      <button
        type="button"
        onClick={() => aoMudar(limitar(valor + 1))}
        aria-label={`Aumentar ${rotulo.toLowerCase()}`}
      >
        <Icone nome="mais" tamanho={16} />
      </button>
    </div>
  );
}
