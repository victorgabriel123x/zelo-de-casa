"use client";

import { useActionState, useEffect, useId, useMemo, useState } from "react";
import { enviarPedido, type EstadoCheckout } from "@/app/checkout/acoes";
import { Icone } from "./Icone";
import { formatarCentavos } from "@/lib/dinheiro";
import { calcularResumo, type EntradaItem, type OpcaoParcela } from "@/lib/precos";
import { PARCELAMENTO, PRODUTO, variantePorCodigo } from "@/lib/produto";
import { ESTADOS } from "@/lib/validacao";

type Props = {
  itens: EntradaItem[];
  opcoesParcela: OpcaoParcela[];
  modoDemonstracao: boolean;
};

const ESTADO_INICIAL: EstadoCheckout = { ok: false };

export function FormularioCheckout({ itens, opcoesParcela, modoDemonstracao }: Props) {
  const [estado, acao, enviando] = useActionState(enviarPedido, ESTADO_INICIAL);
  const [forma, setForma] = useState<"PIX" | "CARTAO">("PIX");
  const [semNumero, setSemNumero] = useState(false);
  const [cupom, setCupom] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState<{ codigo: string; desconto: number } | null>(null);
  const [mensagemCupom, setMensagemCupom] = useState<string | null>(null);
  const [conferindoCupom, setConferindoCupom] = useState(false);
  const [endereco, setEndereco] = useState({ logradouro: "", bairro: "", cidade: "", estado: "" });
  const [avisoCep, setAvisoCep] = useState<string | null>(null);
  const idFormulario = useId();

  const resumo = useMemo(() => calcularResumo(itens, null), [itens]);
  const desconto = cupomAplicado?.desconto ?? 0;
  const total = Math.max(0, resumo.subtotalCentavos - desconto) + resumo.freteCentavos;

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

  async function conferirCupom() {
    const codigo = cupom.trim();
    if (!codigo) return;
    setConferindoCupom(true);
    setMensagemCupom(null);
    try {
      const resposta = await fetch("/api/cupom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, itens }),
      });
      const dados = await resposta.json();
      if (dados.valido) {
        setCupomAplicado({ codigo: dados.codigo, desconto: dados.descontoCentavos });
        setMensagemCupom(null);
      } else {
        setCupomAplicado(null);
        setMensagemCupom(dados.erro ?? "Este cupom não está disponível para este pedido");
      }
    } catch {
      setMensagemCupom("Não foi possível conferir o cupom agora");
    } finally {
      setConferindoCupom(false);
    }
  }

  const parcelaEscolhida = opcoesParcela.find((o) => o.parcelas === 2) ?? opcoesParcela[0];

  return (
    <form action={acao} className="checkout__grade" noValidate={false}>
      {/* selecao vinda da pagina de vendas, recalculada no servidor */}
      <input type="hidden" name="v" value={itens[0]?.voltagem ?? ""} />
      <input type="hidden" name="q" value={itens[0]?.quantidade ?? 1} />
      {itens[1] && <input type="hidden" name="outra" value="on" />}
      {itens[1] && <input type="hidden" name="q2" value={itens[1].quantidade} />}

      <div>
        <h1 style={{ fontSize: "clamp(28px, 3.4vw, 40px)", marginBottom: 10 }}>
          Falta pouco para facilitar sua rotina
        </h1>
        <ol className="etapas">
          <li>Seus dados</li>
          <li>Entrega</li>
          <li>Pagamento</li>
        </ol>

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
              <input id="nome" name="nome" autoComplete="name" required maxLength={120} />
            </div>
            <div className="campo campo--4">
              <label htmlFor="cpf">CPF</label>
              <input id="cpf" name="cpf" inputMode="numeric" autoComplete="off" required maxLength={14} placeholder="000.000.000-00" />
            </div>
            <div className="campo campo--6">
              <label htmlFor="email">E-mail</label>
              <input id="email" name="email" type="email" autoComplete="email" required maxLength={160} />
              <small>Enviamos a confirmação e a nota fiscal para este endereço</small>
            </div>
            <div className="campo campo--6">
              <label htmlFor="whatsapp">WhatsApp</label>
              <input id="whatsapp" name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" required maxLength={16} placeholder="(00) 00000-0000" />
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
              <input id="complemento" name="complemento" maxLength={80} />
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
        </section>

        {/* ------------------------------------------------------- pagamento */}
        <section className="bloco">
          <h2>Pagamento</h2>

          <div className="opcoes-pagamento">
            <label className="opcao-pagamento">
              <input
                type="radio"
                name="formaPagamento"
                value="PIX"
                checked={forma === "PIX"}
                onChange={() => setForma("PIX")}
              />
              <span>
                <strong>
                  <Icone nome="pix" tamanho={19} /> Pix
                </strong>
                <small>
                  {formatarCentavos(total)} à vista. O QR Code aparece na próxima tela.
                </small>
              </span>
            </label>

            <label className="opcao-pagamento">
              <input
                type="radio"
                name="formaPagamento"
                value="CARTAO"
                checked={forma === "CARTAO"}
                onChange={() => setForma("CARTAO")}
              />
              <span>
                <strong>
                  <Icone nome="cartao" tamanho={19} /> Cartão de crédito
                </strong>
                <small>
                  Até {PARCELAMENTO.semJuros}x de{" "}
                  {formatarCentavos(Math.round(total / PARCELAMENTO.semJuros))} sem juros
                </small>
              </span>
            </label>
          </div>

          {forma === "CARTAO" && (
            <div className="grade-campos">
              <div className="campo campo--12">
                <label htmlFor="parcelas">Parcelamento</label>
                <select id="parcelas" name="parcelas" defaultValue={String(parcelaEscolhida?.parcelas ?? 1)}>
                  {opcoesParcela.map((opcao) => (
                    <option key={opcao.parcelas} value={opcao.parcelas}>
                      {opcao.parcelas}x de {formatarCentavos(opcao.valorParcelaCentavos)}
                      {opcao.comJuros
                        ? ` com juros, total ${formatarCentavos(opcao.totalCentavos)}`
                        : " sem juros"}
                    </option>
                  ))}
                </select>
                {opcoesParcela.length <= PARCELAMENTO.semJuros && (
                  <small>
                    Parcelamento de 3x a 10x indisponível no momento. A tabela de juros ainda não
                    está configurada e não exibimos condições sem valor confirmado.
                  </small>
                )}
              </div>

              <div className="campo campo--12">
                <label htmlFor="cartaoTitular">Nome impresso no cartão</label>
                <input id="cartaoTitular" name="cartaoTitular" autoComplete="cc-name" maxLength={120} />
              </div>
              <div className="campo campo--12">
                <label htmlFor="cartaoNumero">Número do cartão</label>
                <input
                  id="cartaoNumero"
                  name="cartaoNumero"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  maxLength={23}
                  placeholder="0000 0000 0000 0000"
                />
              </div>
              <div className="campo campo--3">
                <label htmlFor="cartaoMes">Mês</label>
                <input id="cartaoMes" name="cartaoMes" inputMode="numeric" autoComplete="cc-exp-month" maxLength={2} placeholder="MM" />
              </div>
              <div className="campo campo--3">
                <label htmlFor="cartaoAno">Ano</label>
                <input id="cartaoAno" name="cartaoAno" inputMode="numeric" autoComplete="cc-exp-year" maxLength={4} placeholder="AAAA" />
              </div>
              <div className="campo campo--3">
                <label htmlFor="cartaoCvv">Código</label>
                <input id="cartaoCvv" name="cartaoCvv" inputMode="numeric" autoComplete="cc-csc" maxLength={4} placeholder="CVV" />
              </div>
              <div className="campo campo--12">
                <p className="texto-pequeno texto-suave" style={{ margin: 0 }}>
                  Os dados do cartão são usados apenas para processar esta cobrança e não ficam
                  guardados na loja.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* --------------------------------------------------- consentimentos */}
        <section className="bloco">
          <h2>Confirmação</h2>
          <div className="consentimentos">
            <label className="caixa-marcar">
              <input type="checkbox" name="termos" required />
              <span>Li e aceito os termos de compra e a política de trocas e devoluções</span>
            </label>
            <label className="caixa-marcar">
              <input type="checkbox" name="privacidade" required />
              <span>Estou ciente de como meus dados são usados na Política de privacidade</span>
            </label>
            <label className="caixa-marcar">
              <input type="checkbox" name="whatsappOptIn" />
              <span>
                Quero receber atualizações deste pedido e da nota fiscal pelo WhatsApp
              </span>
            </label>
          </div>

          <p className="texto-pequeno texto-suave">
            Confira voltagem, quantidade e endereço antes de pagar.
          </p>

          <button type="submit" className="botao botao--largo" disabled={enviando}>
            <span className={enviando ? "botao-carregando" : undefined}>
              {enviando
                ? "Estamos processando"
                : forma === "PIX"
                  ? "Gerar Pix"
                  : "Pagar com cartão"}
            </span>
          </button>
        </section>
      </div>

      {/* ----------------------------------------------------------- resumo */}
      <aside className="checkout__resumo" aria-label="Resumo do pedido">
        <h2>Resumo do pedido</h2>
        {resumo.itens.map((item) => (
          <div className="resumo-item" key={item.voltagem}>
            <span>
              {PRODUTO.nome}
              <br />
              {variantePorCodigo(item.voltagem)?.rotulo} · {item.quantidade} un
            </span>
            <strong>{formatarCentavos(item.quantidade * item.precoUnitarioCentavos)}</strong>
          </div>
        ))}

        <div className="cupom">
          <input
            aria-label="Tem um cupom"
            placeholder="Tem um cupom"
            name="cupom"
            value={cupom}
            maxLength={40}
            onChange={(e) => setCupom(e.target.value.toUpperCase())}
          />
          <button
            type="button"
            className="botao botao--contorno"
            onClick={conferirCupom}
            disabled={conferindoCupom || !cupom.trim()}
          >
            Aplicar cupom
          </button>
        </div>
        {mensagemCupom && (
          <p className="erro-campo" role="alert">
            {mensagemCupom}
          </p>
        )}
        {cupomAplicado && (
          <div className="resumo-item">
            <span>Cupom {cupomAplicado.codigo}</span>
            <strong>- {formatarCentavos(cupomAplicado.desconto)}</strong>
          </div>
        )}

        <div className="resumo-item">
          <span>Frete</span>
          <strong>Grátis</strong>
        </div>
        <div className="resumo-item" style={{ borderBottom: 0, paddingTop: 18 }}>
          <span style={{ fontWeight: 700, color: "var(--tinta)" }}>Total</span>
          <strong style={{ fontFamily: "var(--fonte-titulo)", fontSize: 26 }}>
            {formatarCentavos(total)}
          </strong>
        </div>

        <p className="texto-pequeno texto-suave" style={{ marginTop: 14 }}>
          O valor final é sempre recalculado no servidor antes da cobrança.
        </p>

        <div className="aviso-frete" style={{ marginBottom: 0 }}>
          <Icone nome="caminhao" tamanho={18} />
          <span>
            Postagem em até {PRODUTO.prazoPostagemDiasUteis} dias úteis após a confirmação do
            pagamento. Entrega estimada em {PRODUTO.prazoEntregaDiasUteis} dias úteis após a
            postagem.
          </span>
        </div>
      </aside>
    </form>
  );
}
