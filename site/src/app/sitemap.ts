import type { MetadataRoute } from "next";
import { ENV } from "@/lib/ambiente";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = ENV.siteUrl.replace(/\/$/, "");
  const paginas = ["", "/acompanhar", "/entrega", "/trocas", "/privacidade", "/termos", "/fornecedor"];
  return paginas.map((caminho) => ({
    url: `${base}${caminho}`,
    lastModified: new Date(),
    changeFrequency: caminho === "" ? "weekly" : "monthly",
    priority: caminho === "" ? 1 : 0.5,
  }));
}
