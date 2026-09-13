"use client";

import { useEffect } from "react";
import { lerConsentimento } from "@/lib/consentimento";

type Props = { numero: string; valorCentavos: number; registrar: boolean };

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Dispara o evento de compra uma unica vez por pedido.
 * O servidor ja marcou o pedido como registrado, e a trava local evita
 * repeticao se a pessoa recarregar a pagina.
 */
export function EventoCompra({ numero, valorCentavos, registrar }: Props) {
  useEffect(() => {
    if (!registrar) return;
    const chave = `zelo:compra:${numero}`;
    try {
      if (window.localStorage.getItem(chave)) return;
      window.localStorage.setItem(chave, "1");
    } catch {
      // sem armazenamento a trava do servidor continua valendo
    }

    const consentimento = lerConsentimento();
    const valor = valorCentavos / 100;
    if (consentimento?.analise && typeof window.gtag === "function") {
      window.gtag("event", "purchase", {
        transaction_id: numero,
        value: valor,
        currency: "BRL",
      });
    }
    if (consentimento?.publicidade && typeof window.fbq === "function") {
      window.fbq("track", "Purchase", { value: valor, currency: "BRL" }, { eventID: numero });
    }
  }, [numero, valorCentavos, registrar]);

  return null;
}
