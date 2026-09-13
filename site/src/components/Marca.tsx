import Image from "next/image";

type Props = { tom?: "escuro" | "claro"; altura?: number; pulsar?: boolean };

/**
 * Logo montada com o simbolo vetorial do kit mais o logotipo ja desenhado.
 * O coracao pulsa uma unica vez, conforme a direcao visual.
 */
export function Marca({ tom = "escuro", altura = 40, pulsar = false }: Props) {
  const cor = tom === "claro" ? "#F0B79B" : "#C65D3A";
  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: altura * 0.26 }}
      aria-label="Zelo de Casa"
      role="img"
    >
      <svg
        width={altura}
        height={altura}
        viewBox="0 0 128 128"
        aria-hidden="true"
        focusable="false"
        style={{ flex: "none" }}
      >
        <g fill="none" stroke={cor} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 58 64 18 110 58M28 51v59h72V51" />
          <path
            d="M64 94 45 76c-16-18 9-35 19-16 10-19 35-2 19 16Z"
            className={pulsar ? "coracao-pulsa" : undefined}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
        </g>
      </svg>
      <Image
        src={tom === "claro" ? "/marca/logotipo-claro.svg" : "/marca/logotipo.svg"}
        alt=""
        width={Math.round(altura * 2.45)}
        height={altura}
        style={{ height: altura, width: "auto" }}
        priority
      />
    </span>
  );
}
