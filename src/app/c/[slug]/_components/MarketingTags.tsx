import Script from "next/script";
import type { MarketingConfig } from "@/lib/marketing";

/**
 * The business's Meta Pixel and Google Analytics, from Settings → Marketing. The IDs were
 * checked when saved (digits / G-…) and are checked again here, so nothing else can reach the
 * scripts. Events (add to cart, checkout, order sent) are sent from _lib/tracking.ts.
 */
export function MarketingTags({ config }: { config: MarketingConfig }) {
  const pixel = /^\d{8,20}$/.test(config.meta_pixel_id) ? config.meta_pixel_id : "";
  const ga = /^G-[A-Z0-9]{4,16}$/.test(config.ga_id) ? config.ga_id : "";
  if (!pixel && !ga) return null;

  return (
    <>
      {pixel && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(pixel)});fbq('track','PageView');`}
        </Script>
      )}
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config',${JSON.stringify(ga)});`}
          </Script>
        </>
      )}
    </>
  );
}
