"use client";

import { useEffect, useState } from "react";
import { EVENTO_ABRIR_PREFERENCIAS, gravarConsentimento } from "@/lib/consentimento";
import { useConsentimento } from "@/lib/usar-consentimento";

export function AbrirPreferencias({ tom = "escuro" }: { tom?: "escuro" | "claro" }) {
  return (
    <button
      type="button"
      className={tom === "claro" ? "link-botao-claro" : "rodape__link-botao"}
      onClick={() => window.dispatchEvent(new Event(EVENTO_ABRIR_PREFERENCIAS))}
    >
      Preferências de cookies
    </button>
  );
}

export function ConsentimentoCookies() {
  const consentimento = useConsentimento();
  const [aberto, setAberto] = useState(false);
  const [detalhado, setDetalhado] = useState(false);
  const [escolha, setEscolha] = useState<{ analise: boolean; publicidade: boolean } | null>(null);

  useEffect(() => {
    const abrir = () => {
      setEscolha(null);
      setDetalhado(true);
      setAberto(true);
    };
    window.addEventListener(EVENTO_ABRIR_PREFERENCIAS, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR_PREFERENCIAS, abrir);
  }, []);

  const visivel = aberto || consentimento === null;
  if (!visivel) return null;

  const analise = escolha?.analise ?? consentimento?.analise ?? false;
  const publicidade = escolha?.publicidade ?? consentimento?.publicidade ?? false;

  const salvar = (a: boolean, p: boolean) => {
    gravarConsentimento(a, p);
    setAberto(false);
    setDetalhado(false);
    setEscolha(null);
  };

  return (
    <div className="consentimento" role="dialog" aria-labelledby="consentimento-titulo">
      <div className="consentimento__caixa">
        <h2 id="consentimento-titulo">Você escolhe como navegar</h2>
        <p>
          Usamos recursos essenciais para a compra funcionar. Com sua autorização, também usamos
          análise de visitas e publicidade.
        </p>

        {detalhado && (
          <div className="consentimento__categorias">
            <label className="consentimento__categoria">
              <input type="checkbox" checked disabled />
              <span>
                <strong>Essenciais</strong>
                <small>Mantêm a compra, a segurança e as suas preferências de privacidade</small>
              </span>
            </label>
            <label className="consentimento__categoria">
              <input
                type="checkbox"
                checked={analise}
                onChange={(e) => setEscolha({ analise: e.target.checked, publicidade })}
              />
              <span>
                <strong>Análise de visitas</strong>
                <small>Ajuda a entender como as páginas são usadas</small>
              </span>
            </label>
            <label className="consentimento__categoria">
              <input
                type="checkbox"
                checked={publicidade}
                onChange={(e) => setEscolha({ analise, publicidade: e.target.checked })}
              />
              <span>
                <strong>Publicidade</strong>
                <small>Permite medir campanhas nas plataformas de anúncio</small>
              </span>
            </label>
          </div>
        )}

        <div className="consentimento__acoes">
          {detalhado ? (
            <button type="button" className="botao" onClick={() => salvar(analise, publicidade)}>
              Salvar preferências
            </button>
          ) : (
            <>
              <button type="button" className="botao" onClick={() => salvar(true, true)}>
                Aceitar todos
              </button>
              <button
                type="button"
                className="botao botao--contorno"
                onClick={() => salvar(false, false)}
              >
                Recusar opcionais
              </button>
              <button type="button" className="botao--texto" onClick={() => setDetalhado(true)}>
                Personalizar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
