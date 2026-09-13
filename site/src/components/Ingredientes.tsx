import Image from "next/image";

/** No maximo tres ingredientes vetoriais, decorativos e sem conteudo. */
export function Ingredientes() {
  return (
    <div aria-hidden="true">
      <Image src="/decoracao/alho.svg" alt="" width={46} height={46} className="ingrediente ingrediente--1" />
      <Image src="/decoracao/cebola.svg" alt="" width={38} height={38} className="ingrediente ingrediente--2" />
      <Image src="/decoracao/folha.svg" alt="" width={32} height={32} className="ingrediente ingrediente--3" />
    </div>
  );
}
