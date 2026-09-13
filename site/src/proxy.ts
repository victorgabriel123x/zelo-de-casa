import { NextResponse, type NextRequest } from "next/server";

/**
 * Barreira de borda para o painel. A verificacao real da sessao acontece em cada
 * rota e endpoint com sessaoValida, esta camada apenas evita entregar paginas
 * administrativas a quem nao tem nenhum cookie de sessao e impede cache.
 */
export function proxy(request: NextRequest) {
  const caminho = request.nextUrl.pathname;
  const temSessao = Boolean(request.cookies.get("zelo_admin")?.value);

  const ehEntradaDoPainel = caminho === "/admin" || caminho === "/admin/codigo";
  if (caminho.startsWith("/admin") && !ehEntradaDoPainel && !temSessao) {
    const destino = new URL("/admin", request.url);
    return NextResponse.redirect(destino);
  }

  const resposta = NextResponse.next();
  if (caminho.startsWith("/admin") || caminho.startsWith("/checkout") || caminho.startsWith("/pedido")) {
    resposta.headers.set("Cache-Control", "no-store, max-age=0");
    resposta.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return resposta;
}

export const config = {
  matcher: ["/admin/:path*", "/checkout/:path*", "/pedido/:path*"],
};
