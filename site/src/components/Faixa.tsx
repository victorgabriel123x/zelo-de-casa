import { Icone } from "./Icone";

export function Faixa() {
  return (
    <div className="faixa">
      <div className="container">
        <span>
          <Icone nome="caminhao" tamanho={15} />
          Frete grátis para todo o Brasil
        </span>
        <span aria-hidden="true">•</span>
        <span>
          <Icone nome="nota-fiscal" tamanho={15} />
          Nota fiscal
        </span>
        <span aria-hidden="true">•</span>
        <span>
          <Icone nome="cadeado" tamanho={15} />
          Compra segura
        </span>
      </div>
    </div>
  );
}
