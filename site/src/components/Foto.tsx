type Props = {
  base: string;
  alt: string;
  prioridade?: boolean;
  tamanhos?: string;
  className?: string;
  /** Larguras geradas para esta imagem. Padrao: as do kit. */
  larguras?: number[];
  /** Proporcao intrinseca, usada para reservar espaco antes do carregamento. */
  largura?: number;
  altura?: number;
};

/**
 * Imagens ja otimizadas em AVIF e WebP nas larguras 640, 960 e 1440.
 * Nenhuma imagem generica substitui as cenas do kit.
 */
export function Foto({
  base,
  alt,
  prioridade = false,
  tamanhos = "(max-width: 900px) 100vw, 50vw",
  className,
  larguras = [640, 960, 1440],
  largura = 1440,
  altura = 960,
}: Props) {
  const srcset = (formato: string) =>
    larguras.map((l) => `/imagens/${base}-${l}.${formato} ${l}w`).join(", ");
  const padrao = larguras[Math.min(1, larguras.length - 1)];
  return (
    <picture>
      <source type="image/avif" srcSet={srcset("avif")} sizes={tamanhos} />
      <source type="image/webp" srcSet={srcset("webp")} sizes={tamanhos} />
      <img
        src={`/imagens/${base}-${padrao}.webp`}
        alt={alt}
        width={largura}
        height={altura}
        loading={prioridade ? "eager" : "lazy"}
        decoding={prioridade ? "sync" : "async"}
        fetchPriority={prioridade ? "high" : "auto"}
        className={className}
      />
    </picture>
  );
}
