import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "./globals.css";
import "./formularios.css";
import { ConsentimentoCookies } from "@/components/ConsentimentoCookies";
import { Medicao } from "@/components/Medicao";
import { ENV } from "@/lib/ambiente";
import { LOJA, PRODUTO } from "@/lib/produto";

export const metadata: Metadata = {
  metadataBase: new URL(ENV.siteUrl),
  title: {
    default: `${LOJA.nome} | ${PRODUTO.nome}`,
    template: `%s | ${LOJA.nome}`,
  },
  description:
    "Mini Processador Britânia 2P preto, 160 W e 360 ml, em 127 V ou 220 V. Frete grátis para todo o Brasil, produto novo com nota fiscal.",
  applicationName: LOJA.nome,
  icons: {
    icon: [
      { url: "/marca/favicon.svg", type: "image/svg+xml" },
      { url: "/marca/favicon.png", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: LOJA.nome,
    title: `${LOJA.nome} | ${PRODUTO.nome}`,
    description: LOJA.slogan,
    images: [{ url: "/marca/compartilhamento.png", width: 1200, height: 630, alt: LOJA.nome }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#F7F1E8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Script id="marcar-js" strategy="beforeInteractive">
          {`document.documentElement.classList.add('com-js')`}
        </Script>
        <a className="pular-para-conteudo" href="#conteudo">
          Pular para o conteúdo
        </a>
        {children}
        <ConsentimentoCookies />
        <Medicao gaId={ENV.gaId} pixelId={ENV.metaPixelId} />
      </body>
    </html>
  );
}
