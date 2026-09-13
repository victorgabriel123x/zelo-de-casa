"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useMemo, useState } from "react";
import { enviarPedido, type EstadoCheckout } from "@/app/checkout/acoes";
import { Icone } from "./Icone";
import { Etapas, ResumoPedido } from "./ResumoPedido";
import { formatarCentavos } from "@/lib/dinheiro";
import { calcularResumo, opcoesParcelamento, type EntradaItem } from "@/lib/precos";
import { PARCELAMENTO } from "@/lib/produto";
import type { EntradaEntrega } from "@/lib/validacao";

type Props = {
  itens: EntradaItem[];
  entrega: EntradaEntrega;
  modoDemonstracao: boolean;
  voltarPara: string;
};

const ESTADO_INICIAL: EstadoCheckout = { ok: false };

function telefoneLegivel(digitos: string): string {
  if (digitos.length === 11) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  if (digitos.length === 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  return digitos;
}

function cepLegivel(digitos: string): string {
  return digitos.length === 8 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
}

/**
 * Etapa 2 do checkout, em pagina propria: forma de pagamento, parcelamento,
 * dados do cartao e confirmacao. Identificacao e entrega ja foram validadas
 * na etapa anterior e sao apenas conferidas aqui.
 */
export function FormularioPagamento({ itens, entrega, modoDemonstracao, voltarPara }: Props) {
  const [estado, acao, enviando] = useActionState(enviarPedido, ESTADO_INICIAL);
  const [forma, setForma] = useState<"PIX" | "CARTAO">("PIX");
  const [parcelas, setParcelas] = useState<number>(PARCELAMENTO.semJuros);
  const [cupom, setCupom] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState<{ codigo: string; desconto: number } | null>(null);
  const [mensagemCupom, setMensagemCupom] = useState<string | null>(null);
  const [conferindoCupom, setConferindoCupom] = useState(false);
  const idFormulario = useId();

  const resumo = useMemo(() => calcularResumo(itens, null), [itens]);
  const desconto = cupomAplicado?.desconto ?? 0;
  const total = Math.max(0, resumo.subtotalCentavos - desconto) + resumo.freteCentavos;

  // Recalculado junto com o cupom para a tela nunca mostrar parcela defasada.
  // O servidor refaz esta mesma conta antes de cobrar.
  const opcoesParcela = useMemo(() => opcoesParcelamento(total), [total]);
  const opcaoAtual = opcoesParcela.find((o) => o.parcelas === parcelas) ?? opcoesParcela[0];

  // Quem chega aqui vem de um submit da etapa anterior, que rola a pagina ate o
  // botao. Sem isto a tela de pagamento abriria no meio.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    if (estado.erro) {
      document.getElementById(`${idFormulario}-erro`)?.scrollIntoView({ block: "center" });
    }
  }, [estado, idFormulario]);

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

  const { comprador, endereco } = entrega;

  return (
    <form action={acao} className="checkout__grade">
      <input type="hidden" name="v" value={itens[0]?.voltagem ?? ""} />
      <input type="hidden" name="q" value={itens[0]?.quantidade ?? 1} />
      {itens[1] && <input type="hidden" name="outra" value="on" />}
      {itens[1] && <input type="hidden" name="q2" value={itens[1].quantidade} />}
      <input type="hidden" name="cupom" value={cupomAplicado?.codigo ?? ""} />

      <div>
        <h1 style={{ fontSize: "clamp(28px, 3.4vw, 40px)", marginBottom: 10 }}>
          Como você prefere pagar
        </h1>
        <Etapas atual={2} />

        {modoDemonstracao && (
          <p className="aviso-demo">
            Modo demonstração. O pedido é registrado para revisão, nenhuma cobrança é feita e
            nenhuma mensagem é enviada.
          </p>
        )}

        {estado.erro && (
          <p className="aviso aviso--erro" role="alert" id={`${idFormulario}-erro`}>
            {estado.erro}
            {estado.campo === "entrega" && (
              <>
                {" "}
                <Link href={voltarPara}>Voltar para os dados de entrega</Link>
              </>
            )}
          </p>
        )}

        {/* ------------------------------------------------ dados conferidos */}
        <section className="bloco">
          <h2>Entrega para</h2>
          <div className="conferencia">
            <p>
              <strong>{comprador.nome}</strong>
              <br />
              {comprador.email} · {telefoneLegivel(comprador.whatsapp)}
            </p>
            <p>
              {endereco.logradouro}
              {endereco.semNumero ? ", sem número" : `, ${endereco.numero}`}
              {endereco.complemento ? ` · ${endereco.complemento}` : ""}
              <br />
              {endereco.bairro} · {endereco.cidade}/{endereco.estado} · CEP{" "}
              {cepLegivel(endereco.cep)}
            </p>
          </div>
          <Link href={voltarPara} className="botao--texto">
            Alterar dados de entrega
          </Link>
        </section>

        {/* ------------------------------------------------------- pagamento */}
        <section className="bloco">
          <h2>Forma de pagamento</h2>

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
                <small>{formatarCentavos(total)} à vista. O QR Code aparece na próxima tela.</small>
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
                  {formatarCentavos(Math.round(total / PARCELAMENTO.semJuros))} sem juros, ou até{" "}
                  {PARCELAMENTO.maximoTecnico}x com juros
                </small>
              </span>
            </label>
          </div>

          {forma === "CARTAO" && (
            <div className="grade-campos">
              <div className="campo campo--12">
                <label htmlFor="parcelas">Parcelamento</label>
                <select
                  id="parcelas"
                  name="parcelas"
                  value={String(parcelas)}
                  onChange={(e) => setParcelas(Number(e.target.value))}
                >
                  {opcoesParcela.map((opcao) => (
                    <option key={opcao.parcelas} value={opcao.parcelas}>
                      {opcao.parcelas}x de {formatarCentavos(opcao.valorParcelaCentavos)}
                      {opcao.comJuros
                        ? ` com juros, total ${formatarCentavos(opcao.totalCentavos)}`
                        : " sem juros"}
                    </option>
                  ))}
                </select>
                <small>
                  Até {PARCELAMENTO.semJuros}x sem juros. A partir de {PARCELAMENTO.semJuros + 1}x
                  incidem juros de{" "}
                  {(PARCELAMENTO.jurosAoMes * 100).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  % ao mês, já somados ao valor mostrado acima.
                </small>
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
              <span>Quero receber atualizações deste pedido e da nota fiscal pelo WhatsApp</span>
            </label>
          </div>

          <p className="texto-pequeno texto-suave">
            {forma === "CARTAO" && opcaoAtual?.comJuros
              ? `Você vai pagar ${opcaoAtual.parcelas}x de ${formatarCentavos(opcaoAtual.valorParcelaCentavos)}, total de ${formatarCentavos(opcaoAtual.totalCentavos)}.`
              : `Você vai pagar ${formatarCentavos(total)}.`}{" "}
            Confira voltagem, quantidade e endereço antes de pagar.
          </p>

          <button type="submit" className="botao botao--largo" disabled={enviando}>
            <span className={enviando ? "botao-carregando" : undefined}>
              {enviando ? "Estamos processando" : forma === "PIX" ? "Gerar Pix" : "Pagar com cartão"}
            </span>
          </button>
        </section>
      </div>

      <ResumoPedido
        itens={resumo.itens}
        totalCentavos={total}
        rodape={
          forma === "CARTAO" && opcaoAtual?.comJuros ? (
            <p className="texto-pequeno texto-suave" style={{ margin: "10px 0 0" }}>
              No cartão em {opcaoAtual.parcelas}x: {formatarCentavos(opcaoAtual.valorParcelaCentavos)}{" "}
              por mês, total de {formatarCentavos(opcaoAtual.totalCentavos)} com juros.
            </p>
          ) : null
        }
      >
        <div className="cupom">
          <input
            aria-label="Tem um cupom"
            placeholder="Tem um cupom"
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
      </ResumoPedido>
    </form>
  );
}
