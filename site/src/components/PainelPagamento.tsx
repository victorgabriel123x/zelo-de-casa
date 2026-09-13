"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icone } from "./Icone";

type Props = {
  numero: string;
  forma: "PIX" | "CARTAO";
  copiaECola: string | null;
  imagemBase64: string | null;
  expiraEm: string | null;
  demonstracao: boolean;
  aguardando: boolean;
};

export function PainelPagamento({
  numero,
  forma,
  copiaECola,
  imagemBase64,
  expiraEm,
  demonstracao,
  aguardando,
}: Props) {
  const roteador = useRouter();
  const [copiado, setCopiado] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  // Consulta periodica do estado real no servidor. Nada e concluido pelo navegador.
  useEffect(() => {
    if (!aguardando) return;
    const intervalo = window.setInterval(async () => {
      try {
        const resposta = await fetch(`/api/pedidos/${numero}/status`, { cache: "no-store" });
        if (!resposta.ok) return;
        const dados = await resposta.json();
        if (dados.statusFinanceiro !== "PENDENTE" && dados.statusFinanceiro !== "CRIADO") {
          roteador.refresh();
        }
      } catch {
        // falha de rede momentanea nao muda o estado exibido
      }
    }, 8000);
    return () => window.clearInterval(intervalo);
  }, [aguardando, numero, roteador]);

  const copiar = useCallback(async () => {
    if (!copiaECola) return;
    try {
      await navigator.clipboard.writeText(copiaECola);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2500);
    } catch {
      setMensagem("Não foi possível copiar. Selecione o código manualmente.");
    }
  }, [copiaECola]);

  async function gerarNovoPix() {
    setOcupado(true);
    setMensagem(null);
    try {
      const resposta = await fetch(`/api/pedidos/${numero}/novo-pix`, { method: "POST" });
      const dados = await resposta.json();
      if (!resposta.ok) setMensagem(dados.erro ?? "Não foi possível gerar outro Pix agora");
      else roteador.refresh();
    } finally {
      setOcupado(false);
    }
  }

  async function confirmarDemonstracao() {
    setOcupado(true);
    try {
      await fetch(`/api/pedidos/${numero}/demonstracao`, { method: "POST" });
      roteador.refresh();
    } finally {
      setOcupado(false);
    }
  }

  if (forma === "CARTAO") {
    return (
      <div>
        {aguardando && (
          <p className="aviso aviso--neutro">
            Estamos verificando o resultado com o processador de pagamento. Esta página atualiza
            sozinha. Não tente pagar novamente enquanto isso.
          </p>
        )}
        {demonstracao && (
          <button type="button" className="botao botao--contorno" onClick={confirmarDemonstracao} disabled={ocupado}>
            Simular confirmação, apenas demonstração
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="pix">
      <h2 style={{ fontSize: 22 }}>Pague pelo aplicativo do seu banco</h2>

      {imagemBase64 ? (
        <div className="pix__qr">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/png;base64,${imagemBase64}`} alt="QR Code do Pix deste pedido" />
        </div>
      ) : (
        <p className="aviso aviso--neutro" style={{ marginBottom: 0 }}>
          {demonstracao
            ? "Em modo demonstração nenhum QR Code real é gerado."
            : "O QR Code não pôde ser exibido. Use o código copia e cola abaixo."}
        </p>
      )}

      {copiaECola && <p className="pix__codigo">{copiaECola}</p>}

      <div className="acoes-linha" style={{ justifyContent: "center" }}>
        {copiaECola && (
          <button type="button" className="botao" onClick={copiar}>
            <Icone nome={copiado ? "check" : "pix"} tamanho={18} />
            {copiado ? "Código copiado" : "Copiar código Pix"}
          </button>
        )}
        <button type="button" className="botao botao--contorno" onClick={gerarNovoPix} disabled={ocupado}>
          Gerar novo Pix
        </button>
      </div>

      {expiraEm && (
        <p className="texto-pequeno texto-suave" style={{ margin: 0 }}>
          Prazo informado pelo provedor de pagamento:{" "}
          {new Date(expiraEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
        </p>
      )}

      <p className="texto-pequeno texto-suave" style={{ margin: 0 }}>
        O pedido será confirmado após a validação do pagamento.
      </p>

      {mensagem && (
        <p className="erro-campo" role="alert">
          {mensagem}
        </p>
      )}

      {demonstracao && (
        <button type="button" className="botao botao--contorno" onClick={confirmarDemonstracao} disabled={ocupado}>
          Simular confirmação, apenas demonstração
        </button>
      )}
    </div>
  );
}
