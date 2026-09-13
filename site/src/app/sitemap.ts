import type { MetadataRoute } from "next";
import { ENV } from "@/lib/ambiente";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = ENV.siteUrl.replace(/\/$/, "");
  // /checkout e /checkout/pagamento ficam de fora: sao etapas de um pedido em
  // andamento, ja marcadas como noindex.
  const paginas = [
    "",
    "/comprar",
    "/acompanhar",
    "/entrega",
    "/trocas",
    "/privacidade",
    "/termos",
    "/fornecedor",
  ];
  return paginas.map((caminho) => ({
    url: `${base}${caminho}`,
    lastModified: new Date(),
    changeFrequency: caminho === "" || caminho === "/comprar" ? "weekly" : "monthly",
    priority: caminho === "" ? 1 : caminho === "/comprar" ? 0.9 : 0.5,
  }));
}
