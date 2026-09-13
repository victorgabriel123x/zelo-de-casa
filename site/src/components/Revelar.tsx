"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Entrada discreta ao rolar. O conteudo ja vem visivel no HTML e a classe so
 * e aplicada quando ha JavaScript, entao nada some sem script.
 */
export function Revelar({ children, atraso = 0 }: { children: ReactNode; atraso?: number }) {
  const alvo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elemento = alvo.current;
    if (!elemento) return;
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduzido) {
      elemento.dataset["visivel"] = "true";
      return;
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            window.setTimeout(() => {
              elemento.dataset["visivel"] = "true";
            }, atraso);
            observador.unobserve(entrada.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [atraso]);

  return (
    <div ref={alvo} className="revelar">
      {children}
    </div>
  );
}
