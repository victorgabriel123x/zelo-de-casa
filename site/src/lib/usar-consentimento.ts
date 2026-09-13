"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  CHAVE_CONSENTIMENTO,
  EVENTO_CONSENTIMENTO,
  VERSAO_CONSENTIMENTO,
  type Consentimento,
} from "./consentimento";

function assinar(aoMudar: () => void): () => void {
  window.addEventListener(EVENTO_CONSENTIMENTO, aoMudar);
  window.addEventListener("storage", aoMudar);
  return () => {
    window.removeEventListener(EVENTO_CONSENTIMENTO, aoMudar);
    window.removeEventListener("storage", aoMudar);
  };
}

function instantaneo(): string | null {
  try {
    return window.localStorage.getItem(CHAVE_CONSENTIMENTO);
  } catch {
    return null;
  }
}

const instantaneoServidor = (): string | null => null;

/** Le a escolha de cookies do navegador sem provocar renderizacoes em cascata. */
export function useConsentimento(): Consentimento | null {
  const bruto = useSyncExternalStore(assinar, instantaneo, instantaneoServidor);
  return useMemo(() => {
    if (!bruto) return null;
    try {
      const dados = JSON.parse(bruto) as Consentimento;
      return dados.versao === VERSAO_CONSENTIMENTO ? dados : null;
    } catch {
      return null;
    }
  }, [bruto]);
}
