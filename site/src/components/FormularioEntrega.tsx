"use client";

import { useActionState, useEffect, useId, useMemo, useState } from "react";
import { salvarEntrega, type EstadoCheckout } from "@/app/checkout/acoes";
import { Etapas, ResumoPedido } from "./ResumoPedido";
import { calcularResumo, type EntradaItem } from "@/lib/precos";
import { ESTADOS, type EntradaEntrega } from "@/lib/validacao";

type Props = {
  itens: EntradaItem[];
  modoDemonstracao: boolean;
  /** Preenche de volta quando a pessoa volta da tela de pagamento. */
  inicial: EntradaEntrega | null;
};

const ESTADO_INICIAL: EstadoCheckout = { ok: false };

/**
 * Etapa 1 do checkout: identificacao e entrega.
 * O pagamento fica em /checkout/pagamento, numa tela so dele.
 */
export function FormularioEntrega({ itens, modoDemonstracao, inicial }: Props) {
  const [estado, acao, enviando] = useActionState(salvarEntrega, ESTADO_INICIAL);
  const [semNumero, setSemNumero] = useState(inicial?.endereco.semNumero ?? false);
  const [endereco, setEndereco] = useState({
    logradouro: inicial?.endereco.logradouro ?? "",
    bairro: inicial?.endereco.bairro ?? "",
    cidade: inicial?.endereco.cidade ?? "",
    estado: inicial?.endereco.estado ?? "",
  });
  const [avisoCep, setAvisoCep] = useState<string | null>(null);
  const idFormulario = useId();

  const resumo = useMemo(() => calcularResumo(itens, null), [itens]);

  useEffect(() => {
    if (estado.erro) {
      document.getElementById(`${idFormulario}-erro`)?.scrollIntoView({ block: "center" });
    }
  }, [estado, idFormulario]);

  async function consultarCep(valor: string) {
    const limpo = valor.replace(/\D+/g, "");
    if (limpo.length !== 8) return;
    setAvisoCep(null);
    try {
      const resposta = await fetch(`/api/cep/${limpo}`);
      const dados = await resposta.json();
      if (!resposta.ok) {
        setAvisoCep(dados.erro ?? "Preencha o endereço manualmente");
        return;
      }
      setEndereco({
        logradouro: dados.logradouro,
        bairro: dados.bairro,
        cidade: dados.cidade,
        estado: dados.estado,
      });
    } catch {
      setAvisoCep("Não foi possível consultar o CEP agora. Preencha o endereço manualmente.");
    }
  }

  return (
    <form action={acao} className="checkout__grade">
      {/* selecao vinda da pagina de vendas, recalculada no servidor */}
      <input type="hidden" name="v" value={itens[0]?.voltagem ?? ""} />
      <input type="hidden" name="q" value={itens[0]?.quantidade ?? 1} />
      {itens[1] && <input type="hidden" name="outra" value="on" />}
      {itens[1] && <input type="hidden" name="q2" value={itens[1].quantidade} />}

      <div>
        <h1 style={{ fontSize: "clamp(28px, 3.4vw, 40px)", marginBottom: 10 }}>
          Falta pouco para facilitar sua rotina
        </h1>
        <Etapas atual={1} />

        {modoDemonstracao && (
          <p className="aviso-demo">
            Modo demonstração. O pedido é registrado para revisão, nenhuma cobrança é feita e
            nenhuma mensagem é enviada.
          </p>
        )}

        {estado.erro && (
          <p className="aviso aviso--erro" role="alert" id={`${idFormulario}-erro`}>
            {estado.erro}
          </p>
        )}

        {/* ------------------------------------------------------ seus dados */}
        <section className="bloco">
          <h2>Seus dados</h2>
          <div className="grade-campos">
            <div className="campo campo--8">
              <label htmlFor="nome">Nome completo</label>
              <input
                id="nome"
                name="nome"
                autoComplete="name"
                required
                maxLength={120}
                defaultValue={inicial?.comprador.nome ?? ""}
              />
            </div>
            <div className="campo campo--4">
              <label htmlFor="cpf">CPF</label>
              <input
                id="cpf"
                name="cpf"
                inputMode="numeric"
                autoComplete="off"
                required
                maxLength={14}
                placeholder="000.000.000-00"
                defaultValue={inicial?.comprador.cpf ?? ""}
              />
            </div>
            <div className="campo campo--6">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={160}
                defaultValue={inicial?.comprador.email ?? ""}
              />
              <small>Enviamos a confirmação e a nota fiscal para este endereço</small>
            </div>
            <div className="campo campo--6">
              <label htmlFor="whatsapp">WhatsApp</label>
              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                maxLength={16}
                placeholder="(00) 00000-0000"
                defaultValue={inicial?.comprador.whatsapp ?? ""}
              />
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- entrega */}
        <section className="bloco">
          <h2>Entrega</h2>
          <div className="grade-campos">
            <div className="campo campo--4">
              <label htmlFor="cep">CEP</label>
              <input
                id="cep"
                name="cep"
                inputMode="numeric"
                autoComplete="postal-code"
                required
                maxLength={9}
                placeholder="00000-000"
                defaultValue={inicial?.endereco.cep ?? ""}
                onBlur={(e) => consultarCep(e.target.value)}
              />
              {avisoCep && <small style={{ color: "var(--erro)" }}>{avisoCep}</small>}
            </div>
            <div className="campo campo--8">
              <label htmlFor="logradouro">Endereço</label>
              <input
                id="logradouro"
                name="logradouro"
                autoComplete="address-line1"
                required
                maxLength={160}
                value={endereco.logradouro}
                onChange={(e) => setEndereco({ ...endereco, logradouro: e.target.value })}
              />
            </div>
            <div className="campo campo--3">
              <label htmlFor="numero">Número</label>
              <input
                id="numero"
                name="numero"
                autoComplete="address-line2"
                maxLength={20}
                disabled={semNumero}
                required={!semNumero}
                defaultValue={inicial?.endereco.numero ?? ""}
              />
            </div>
            <div className="campo campo--3" style={{ justifyContent: "flex-end" }}>
              <label className="caixa-marcar" style={{ marginBottom: 14 }}>
                <input
                  type="checkbox"
                  name="semNumero"
                  checked={semNumero}
                  onChange={(e) => setSemNumero(e.target.checked)}
                />
                <span>Sem número</span>
              </label>
            </div>
            <div className="campo campo--6">
              <label htmlFor="complemento">Complemento opcional</label>
              <input
                id="complemento"
                name="complemento"
                maxLength={80}
                defaultValue={inicial?.endereco.complemento ?? ""}
              />
            </div>
            <div className="campo campo--6">
              <label htmlFor="bairro">Bairro</label>
              <input
                id="bairro"
                name="bairro"
                required
                maxLength={80}
                value={endereco.bairro}
                onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })}
              />
            </div>
            <div className="campo campo--3">
              <label htmlFor="cidade">Cidade</label>
              <input
                id="cidade"
                name="cidade"
                required
                maxLength={80}
                value={endereco.cidade}
                onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })}
              />
            </div>
            <div className="campo campo--3">
              <label htmlFor="estado">Estado</label>
              <select
                id="estado"
                name="estado"
                required
                value={endereco.estado}
                onChange={(e) => setEndereco({ ...endereco, estado: e.target.value })}
              >
                <option value="">Selecione</option>
                {ESTADOS.map((sigla) => (
                  <option key={sigla} value={sigla}>
                    {sigla}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="texto-pequeno texto-suave" style={{ marginTop: 16 }}>
            Este endereço também será usado na nota fiscal.
          </p>

          <button type="submit" className="botao botao--largo" disabled={enviando}>
            <span className={enviando ? "botao-carregando" : undefined}>
              {enviando ? "Aguarde" : "Ir para o pagamento"}
            </span>
          </button>

          <p className="texto-pequeno texto-suave" style={{ marginTop: 14, textAlign: "center" }}>
            Nenhuma cobrança é feita nesta etapa. Você escolhe como pagar na próxima tela.
          </p>
        </section>
      </div>

      <ResumoPedido itens={resumo.itens} totalCentavos={resumo.totalCentavos} />
    </form>
  );
}
