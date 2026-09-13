"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ErroAsaas } from "@/lib/asaas";
import { liberarPedidoNoNavegador } from "@/lib/acesso-pedido";
import { ErroDeNegocio, iniciarPagamentoCartao, iniciarPagamentoPix, registrarPedido } from "@/lib/pedidos";
import { ipDaRequisicao, limitar } from "@/lib/rate-limit";
import { esquemaCartao, esquemaPedido } from "@/lib/validacao";
import { itensDaConsulta } from "@/lib/carrinho";

export type EstadoCheckout = { ok: boolean; erro?: string; campo?: string };

function texto(dados: FormData, chave: string): string {
  const valor = dados.get(chave);
  return typeof valor === "string" ? valor : "";
}

function marcado(dados: FormData, chave: string): boolean {
  const valor = dados.get(chave);
  return valor === "on" || valor === "true";
}

export async function enviarPedido(
  _anterior: EstadoCheckout,
  dados: FormData,
): Promise<EstadoCheckout> {
  const cabecalhos = await headers();
  const ip = ipDaRequisicao(cabecalhos);
  if (!limitar(`checkout:${ip}`, 12, 60_000)) {
    return { ok: false, erro: "Muitas tentativas em pouco tempo. Aguarde um instante." };
  }

  const itens = itensDaConsulta({
    v: texto(dados, "v"),
    q: texto(dados, "q"),
    outra: texto(dados, "outra"),
    q2: texto(dados, "q2"),
  });

  const formaPagamento = texto(dados, "formaPagamento") === "CARTAO" ? "CARTAO" : "PIX";
  const parcelasBrutas = Number(texto(dados, "parcelas") || "1");

  const analise = esquemaPedido.safeParse({
    itens,
    cupom: texto(dados, "cupom"),
    comprador: {
      nome: texto(dados, "nome"),
      cpf: texto(dados, "cpf"),
      email: texto(dados, "email"),
      whatsapp: texto(dados, "whatsapp"),
    },
    endereco: {
      cep: texto(dados, "cep"),
      logradouro: texto(dados, "logradouro"),
      numero: texto(dados, "numero"),
      semNumero: marcado(dados, "semNumero"),
      complemento: texto(dados, "complemento"),
      bairro: texto(dados, "bairro"),
      cidade: texto(dados, "cidade"),
      estado: texto(dados, "estado"),
    },
    consentimentos: {
      termos: marcado(dados, "termos"),
      privacidade: marcado(dados, "privacidade"),
      whatsappOptIn: marcado(dados, "whatsappOptIn"),
    },
    formaPagamento,
    parcelas: Number.isFinite(parcelasBrutas) ? parcelasBrutas : 1,
  });

  if (!analise.success) {
    const primeiro = analise.error.issues[0];
    return {
      ok: false,
      erro: primeiro?.message ?? "Confira os dados informados",
      campo: primeiro?.path.join("."),
    };
  }

  let numeroCriado = "";
  try {
    const pedido = await registrarPedido(analise.data, {
      ip,
      userAgent: cabecalhos.get("user-agent"),
    });
    numeroCriado = pedido.numero;
    await liberarPedidoNoNavegador(pedido.numero);

    if (formaPagamento === "PIX") {
      await iniciarPagamentoPix(pedido);
    } else {
      const cartao = esquemaCartao.safeParse({
        titular: texto(dados, "cartaoTitular"),
        numero: texto(dados, "cartaoNumero"),
        mes: texto(dados, "cartaoMes"),
        ano: texto(dados, "cartaoAno"),
        cvv: texto(dados, "cartaoCvv"),
      });
      if (!cartao.success) {
        return {
          ok: false,
          erro: cartao.error.issues[0]?.message ?? "Confira os dados do cartão",
          campo: "cartao",
        };
      }
      await iniciarPagamentoCartao(pedido, cartao.data, analise.data.parcelas, ip);
    }
  } catch (erro) {
    if (erro instanceof ErroDeNegocio) return { ok: false, erro: erro.message, campo: erro.campo };
    if (erro instanceof ErroAsaas) {
      return {
        ok: false,
        erro: erro.timeout
          ? "Estamos verificando o resultado. Aguarde antes de tentar novamente."
          : erro.message,
      };
    }
    console.error("falha ao concluir checkout", erro instanceof Error ? erro.message : erro);
    return { ok: false, erro: "Não foi possível concluir agora. Tente novamente em instantes." };
  }

  redirect(`/pedido/confirmacao?n=${encodeURIComponent(numeroCriado)}`);
}
