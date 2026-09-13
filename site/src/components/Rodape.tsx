import Link from "next/link";
import { Marca } from "./Marca";
import { LOJA } from "@/lib/produto";
import { AbrirPreferencias } from "./ConsentimentoCookies";

export function Rodape() {
  return (
    <footer className="rodape">
      <div className="container">
        <div className="rodape__grade">
          <div>
            <Marca tom="claro" altura={44} />
            <p style={{ marginTop: 14, maxWidth: "34ch" }}>{LOJA.slogan}</p>
            <p>
              Atendimento:{" "}
              <a href={`mailto:${LOJA.email}`}>{LOJA.email}</a>
            </p>
          </div>

          <div>
            <h3>Seu pedido</h3>
            <ul>
              <li><Link href="/acompanhar">Acompanhar pedido</Link></li>
              <li><Link href="/entrega">Entrega</Link></li>
              <li><Link href="/trocas">Trocas e devoluções</Link></li>
            </ul>
          </div>

          <div>
            <h3>A loja</h3>
            <ul>
              <li><Link href="/fornecedor">Dados do fornecedor</Link></li>
              <li><Link href="/privacidade">Privacidade</Link></li>
              <li><Link href="/termos">Termos de compra</Link></li>
              <li><AbrirPreferencias /></li>
            </ul>
          </div>
        </div>

        <div className="rodape__base">
          <p style={{ margin: 0 }}>
            Zelo de Casa é a loja vendedora. Britânia é a fabricante do produto.
          </p>
          <p style={{ margin: 0 }}>
            As fotografias do produto são ilustrativas. Consulte o manual do fabricante antes do uso.
          </p>
        </div>
      </div>
    </footer>
  );
}
