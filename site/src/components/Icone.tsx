import { ICONES, type NomeIcone } from "@/lib/icones";

type Props = {
  nome: NomeIcone;
  tamanho?: number;
  titulo?: string;
  className?: string;
};

/** Icones decorativos recebem aria-hidden. Com titulo viram imagem acessivel. */
export function Icone({ nome, tamanho = 24, titulo, className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={titulo ? "img" : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: ICONES[nome] }}
    />
  );
}
