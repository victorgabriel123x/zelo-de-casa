"use client";

import { useActionState, type ReactNode } from "react";
import type { EstadoAdmin } from "@/app/admin/acoes";

type Props = {
  acao: (estado: EstadoAdmin, dados: FormData) => Promise<EstadoAdmin>;
  children?: ReactNode;
  textoBotao: string;
  textoOcupado?: string;
  className?: string;
  variante?: "primario" | "contorno";
  encTypeArquivo?: boolean;
};

export function FormularioAcao({
  acao,
  children,
  textoBotao,
  textoOcupado = "Processando",
  className,
  variante = "primario",
  encTypeArquivo = false,
}: Props) {
  const [estado, enviar, pendente] = useActionState(acao, {} as EstadoAdmin);
  return (
    <form action={enviar} className={className} encType={encTypeArquivo ? "multipart/form-data" : undefined}>
      {estado?.erro && (
        <p className="aviso aviso--erro" role="alert">
          {estado.erro}
        </p>
      )}
      {estado?.aviso && (
        <p className="aviso aviso--sucesso" role="status">
          {estado.aviso}
        </p>
      )}
      {children}
      <div className="acoes-linha">
        <button
          type="submit"
          className={variante === "contorno" ? "botao botao--contorno" : "botao"}
          disabled={pendente}
        >
          {pendente ? textoOcupado : textoBotao}
        </button>
      </div>
    </form>
  );
}
