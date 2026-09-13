"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useConsentimento } from "@/lib/usar-consentimento";

type Props = { gaId?: string; pixelId?: string };

const ROTAS_SEM_PUBLICIDADE = ["/checkout", "/pedido", "/admin"];

/**
 * Nenhum script de medicao e carregado antes do consentimento da categoria.
 * Publicidade nunca carrega no checkout, na area do pedido nem no painel.
 */
export function Medicao({ gaId, pixelId }: Props) {
  const consentimento = useConsentimento();
  const caminho = usePathname();
  const areaSensivel = ROTAS_SEM_PUBLICIDADE.some((rota) => caminho?.startsWith(rota));

  return (
    <>
      {gaId && consentimento?.analise && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-config" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
          </Script>
        </>
      )}

      {pixelId && consentimento?.publicidade && !areaSensivel && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
