import Link from "next/link";
import { BarraCompra } from "@/components/BarraCompra";
import { Cabecalho } from "@/components/Cabecalho";
import { Faixa } from "@/components/Faixa";
import { Foto } from "@/components/Foto";
import { FormularioCompra } from "@/components/FormularioCompra";
import { Icone } from "@/components/Icone";
import { Revelar } from "@/components/Revelar";
import { Rodape } from "@/components/Rodape";
import { ENV, MODO_DEMONSTRACAO } from "@/lib/ambiente";
import { formatarCentavos } from "@/lib/dinheiro";
import {
  BENEFICIOS,
  CLAREZA,
  DESTAQUES_HERO,
  ESPECIFICACOES,
  IMAGENS,
  LOJA,
  PERGUNTAS,
  PRODUTO,
  SELOS_HERO,
} from "@/lib/produto";
import type { NomeIcone } from "@/lib/icones";

export default function Home() {
  const dadosEstruturados = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: PRODUTO.nome,
    color: PRODUTO.cor,
    brand: { "@type": "Brand", name: LOJA.fabricante },
    description:
      "Mini processador compacto de 160 W e 360 ml para o preparo de pequenas porções, disponível em 127 V e 220 V.",
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (PRODUTO.precoCentavos / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: LOJA.nome },
    },
  };

  return (
    <>
      <Faixa />
      <Cabecalho />

      <main id="conteudo">
        {/* ------------------------------------------------------------ hero */}
        <section className="hero" id="produto">
          {/* Cenario real da cozinha: cobre a secao inteira e serve de bancada. */}
          <div className="hero__cenario" aria-hidden="true">
            <Foto
              base={IMAGENS.heroCenario.base}
              alt=""
              prioridade
              larguras={[...IMAGENS.heroCenario.larguras]}
              largura={IMAGENS.heroCenario.largura}
              altura={IMAGENS.heroCenario.altura}
              tamanhos="100vw"
            />
          </div>
          <div className="hero__veu" aria-hidden="true" />

          <div className="hero__interior">
            <div className="hero__cabecalho">
              <p className="etiqueta hero__etiqueta">Mini Processador Britânia 2P</p>
              <h1>
                Menos tempo preparando
                <br />
                Mais tempo aproveitando
              </h1>
              <p className="hero__descricao">
                Do alho do refogado à cebola do almoço, uma ajuda compacta para preparar pequenas
                porções e simplificar sua rotina na cozinha.
              </p>
            </div>

            <div className="hero__palco">
              <ul className="hero__destaques">
                {DESTAQUES_HERO.map((destaque) => (
                  <li key={destaque.titulo}>
                    <span className="hero__destaque-icone">
                      <Icone nome={destaque.icone as NomeIcone} tamanho={24} />
                    </span>
                    <span>
                      <strong>{destaque.titulo}</strong>
                      {destaque.texto}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="hero__produto">
                <Foto
                  base={IMAGENS.heroProduto.base}
                  alt={IMAGENS.heroProduto.alt}
                  prioridade
                  larguras={[...IMAGENS.heroProduto.larguras]}
                  largura={IMAGENS.heroProduto.largura}
                  altura={IMAGENS.heroProduto.altura}
                  tamanhos="(max-width: 900px) 82vw, (max-width: 1280px) 36vw, 34vw"
                />
              </div>

              <aside className="hero__oferta">
                <p className="preco-anterior">
                  {formatarCentavos(PRODUTO.precoAnteriorCentavos)}
                </p>
                <p className="preco-atual">{formatarCentavos(PRODUTO.precoCentavos)}</p>
                <p className="hero__condicao">
                  No Pix ou em 2x de {formatarCentavos(PRODUTO.precoCentavos / 2)} sem juros
                </p>
                <p className="hero__complemento">
                  Até 10x no cartão, com juros a partir da 3ª parcela. Consulte os valores antes de
                  pagar.
                </p>
              </aside>

              <div className="hero__acoes">
                <a href="#comprar" className="botao botao--hero">
                  <Icone nome="carrinho" tamanho={22} />
                  Comprar agora
                </a>
              </div>

              <ul className="hero__selos">
                {SELOS_HERO.map((selo) => (
                  <li key={selo.texto}>
                    <Icone nome={selo.icone as NomeIcone} tamanho={16} />
                    {selo.texto}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------- narrativa inicial */}
        <section className="secao secao--clara secao--estreita">
          <div className="container duas-colunas">
            <Revelar>
              <h2 style={{ fontSize: "clamp(28px, 3.3vw, 42px)" }}>
                Toda receita começa antes do fogão
              </h2>
            </Revelar>
            <Revelar atraso={90}>
              <div>
                <p className="narrativa">
                  Você escolhe o que vai cozinhar. Separa os ingredientes. E então vem aquela etapa
                  que se repete todos os dias: preparar o alho, picar a cebola e deixar tudo pronto
                  para a panela.
                </p>
                <p className="texto-suave" style={{ marginTop: 22, maxWidth: "52ch" }}>
                  O Mini Processador Britânia 2P entra nessa parte da rotina para ajudar no preparo
                  de pequenas porções.
                </p>
              </div>
            </Revelar>
          </div>
        </section>

        {/* --------------------------------------------------------- como usar */}
        <section className="secao" id="como-usar">
          <div className="container">
            <Revelar>
              <div className="editorial">
                <div className="editorial__figura">
                  <Foto base={IMAGENS.uso.base} alt={IMAGENS.uso.alt} />
                </div>
                <div>
                  <p className="etiqueta">Como usar</p>
                  <h2>Seu tempero ganha uma ajuda</h2>
                  <p>
                    Com acionamento por toque e função pulsar, você acompanha o preparo pela jarra
                    transparente. Uma solução compacta para deixar os ingredientes no ponto que sua
                    receita pede, respeitando as orientações do manual.
                  </p>
                  <p style={{ marginTop: 26 }}>
                    <a href="#detalhes" className="botao botao--contorno">
                      Conhecer os detalhes
                    </a>
                  </p>
                </div>
              </div>
            </Revelar>
          </div>
        </section>

        {/* -------------------------------------------------------- beneficios */}
        <section className="secao secao--clara">
          <div className="container">
            <Revelar>
              <div className="cabecalho-secao">
                <p className="etiqueta">Benefícios</p>
                <h2>Pequeno na bancada, presente na rotina</h2>
              </div>
            </Revelar>
            <Revelar atraso={80}>
              <div className="beneficios">
                {BENEFICIOS.map((beneficio) => (
                  <article className="beneficio" key={beneficio.titulo}>
                    <span className="beneficio__icone">
                      <Icone nome={beneficio.icone as NomeIcone} />
                    </span>
                    <h3>{beneficio.titulo}</h3>
                    <p>{beneficio.texto}</p>
                  </article>
                ))}
              </div>
            </Revelar>
          </div>
        </section>

        {/* ----------------------------------------------------- possibilidades */}
        <section className="secao">
          <div className="container">
            <Revelar>
              <div className="editorial editorial--invertida">
                <div className="editorial__figura">
                  <Foto base={IMAGENS.possibilidades.base} alt={IMAGENS.possibilidades.alt} />
                </div>
                <div>
                  <p className="etiqueta">Possibilidades</p>
                  <h2>Do refogado aos pequenos preparos</h2>
                  <p>
                    Alho e cebola para começar a receita. Nozes, coco, torradas e carne em porções
                    compatíveis com as instruções do fabricante.
                  </p>
                  <p className="texto-pequeno texto-suave" style={{ marginTop: 20 }}>
                    Consulte o manual para conhecer os alimentos indicados, os tempos de
                    acionamento e os cuidados de limpeza do aparelho.
                  </p>
                </div>
              </div>
            </Revelar>
          </div>
        </section>

        {/* ----------------------------------------------------------- detalhes */}
        <section className="secao secao--clara" id="detalhes">
          <div className="container duas-colunas">
            <Revelar>
              <div>
                <p className="etiqueta">Ficha técnica</p>
                <h2 style={{ fontSize: "clamp(28px, 3.3vw, 42px)" }}>Conheça cada detalhe</h2>
                <p className="texto-suave" style={{ marginTop: 18, maxWidth: "38ch" }}>
                  Informações do catálogo do fabricante. Produto novo com nota fiscal.
                </p>
              </div>
            </Revelar>
            <Revelar atraso={80}>
              <div>
                <dl className="especificacoes">
                  {ESPECIFICACOES.map((item) => (
                    <div className="especificacao" key={item.rotulo}>
                      <dt>{item.rotulo}</dt>
                      <dd>{item.valor}</dd>
                    </div>
                  ))}
                </dl>
                <p className="nota-tecnica">
                  O aparelho não é bivolt. Escolha a versão compatível com a instalação elétrica do
                  local de uso. As fotografias são ilustrativas e não substituem o manual do
                  fabricante.
                </p>
              </div>
            </Revelar>
          </div>
        </section>

        {/* ------------------------------------------------------------ clareza */}
        <section className="secao secao--escura secao--estreita">
          <div className="container">
            <Revelar>
              <div className="cabecalho-secao">
                <p className="etiqueta" style={{ color: "#e2b49c" }}>
                  Compra acompanhada
                </p>
                <h2>Mais clareza em cada etapa</h2>
                <p className="texto-suave">
                  Ainda não publicamos avaliações porque não temos uma fonte verificada de relatos
                  de clientes. Enquanto isso, deixamos claro o que você recebe em cada etapa.
                </p>
              </div>
            </Revelar>
            <Revelar atraso={80}>
              <div className="clareza">
                {CLAREZA.map((item) => (
                  <div className="clareza__item" key={item.titulo}>
                    <Icone nome={item.icone as NomeIcone} />
                    <div>
                      <h3>{item.titulo}</h3>
                      <p>{item.texto}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Revelar>
          </div>
        </section>

        {/* ------------------------------------------------------------- oferta */}
        <section className="secao">
          <div className="container">
            <div className="oferta__grade">
              <Revelar>
                <div className="oferta__figura">
                  <Foto
                    base={IMAGENS.oferta.base}
                    alt={IMAGENS.oferta.alt}
                    tamanhos="(max-width: 860px) 100vw, 520px"
                  />
                </div>
              </Revelar>
              <Revelar atraso={80}>
                <div>
                  {MODO_DEMONSTRACAO && (
                    <p className="aviso-demo">
                      Modo demonstração. Nenhuma cobrança é feita e nenhuma mensagem é enviada
                      enquanto as credenciais de pagamento não estiverem configuradas.
                    </p>
                  )}
                  <FormularioCompra vendasPausadas={ENV.vendasPausadas} />
                </div>
              </Revelar>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------- duvidas */}
        <section className="secao secao--clara" id="duvidas">
          <div className="container">
            <Revelar>
              <div className="cabecalho-secao">
                <p className="etiqueta">Dúvidas</p>
                <h2>Perguntas que ajudam na escolha</h2>
              </div>
            </Revelar>
            <div className="faq">
              {PERGUNTAS.map((item) => (
                <details key={item.pergunta} name="faq-zelo">
                  <summary>{item.pergunta}</summary>
                  <p>{item.resposta}</p>
                </details>
              ))}
            </div>
            <p className="texto-pequeno texto-suave" style={{ marginTop: 32, maxWidth: "70ch" }}>
              Consulte também as páginas de{" "}
              <Link href="/entrega">entrega</Link>,{" "}
              <Link href="/trocas">trocas e devoluções</Link>,{" "}
              <Link href="/privacidade">privacidade</Link> e{" "}
              <Link href="/termos">termos de compra</Link>.
            </p>
          </div>
        </section>
      </main>

      <Rodape />
      <BarraCompra />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dadosEstruturados) }}
      />
    </>
  );
}
