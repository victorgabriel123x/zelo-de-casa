"use client";

import { useState } from "react";

export function FormularioAcesso({ numeroInicial = "" }: { numeroInicial?: string }) {
  const [numero, setNumero] = useState(numeroInicial);
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setMensagem(null);
    try {
      const resposta = await fetch("/api/acesso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero, email }),
      });
      const dados = await resposta.json();
      setMensagem(dados.mensagem ?? "Pedido enviado");
    } catch {
      setMensagem("Não foi possível enviar agora. Tente novamente em instantes.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="bloco" onSubmit={enviar}>
      <h2>Ver documentos e dados pessoais</h2>
      <p className="texto-suave" style={{ fontSize: 15 }}>
        Para ver documentos e dados pessoais, confirme o acesso pelo link enviado ao seu e-mail.
      </p>
      <div className="grade-campos">
        <div className="campo campo--6">
          <label htmlFor="acesso-numero">Número do pedido</label>
          <input
            id="acesso-numero"
            value={numero}
            onChange={(e) => setNumero(e.target.value.toUpperCase())}
            required
            maxLength={20}
          />
        </div>
        <div className="campo campo--6">
          <label htmlFor="acesso-email">E-mail do pedido</label>
          <input
            id="acesso-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={160}
          />
        </div>
      </div>
      <div className="acoes-linha">
        <button type="submit" className="botao" disabled={enviando}>
          {enviando ? "Enviando" : "Enviar acesso por e-mail"}
        </button>
      </div>
      {mensagem && (
        <p className="aviso aviso--sucesso" role="status" style={{ marginTop: 20, marginBottom: 0 }}>
          {mensagem}
        </p>
      )}
    </form>
  );
}
