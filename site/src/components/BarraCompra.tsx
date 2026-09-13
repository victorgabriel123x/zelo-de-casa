"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatarCentavos } from "@/lib/dinheiro";
import { PRODUTO } from "@/lib/produto";

/**
 * Botao fixo no celular. Some quando o formulario de compra ou o consentimento
 * estao em foco, para nao cobrir conteudo nem a escolha de privacidade.
 */
export function BarraCompra() {
  const [oculta, setOculta] = useState(false);

  useEffect(() => {
    const formulario = document.getElementById("comprar");
    if (!formulario) return;
    const observador = new IntersectionObserver(
      (entradas) => setOculta(entradas.some((e) => e.isIntersecting)),
      { threshold: 0.12 },
    );
    observador.observe(formulario);

    const aoFocar = (evento: FocusEvent) => {
      const alvo = evento.target as HTMLElement | null;
      if (alvo?.closest("#comprar, .consentimento")) setOculta(true);
    };
    document.addEventListener("focusin", aoFocar);
    return () => {
      observador.disconnect();
      document.removeEventListener("focusin", aoFocar);
    };
  }, []);

  return (
    <div className="barra-compra" data-oculta={oculta}>
      <div className="barra-compra__preco">
        {formatarCentavos(PRODUTO.precoCentavos)}
        <small>no Pix ou 2x sem juros</small>
      </div>
      <Link href="/comprar" className="botao">
        Comprar agora
      </Link>
    </div>
  );
}
