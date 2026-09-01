import Script from 'next/script';

const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim();
const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
// TS Pixel (conta TS Mídia do LC): campanhas ST_* otimizam Lead nele; recebe os mesmos eventos
const tsPixelId = '1350334970327217';
const gaId = process.env.NEXT_PUBLIC_GA_ID?.trim();

export function TrackingPixels() {
  return (
    <>
      {/* Google Tag Manager */}
      {gtmId && (
        <Script id="gtm" strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
          }}
        />
      )}

      {/* Google Analytics (GA4) */}
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`,
            }}
          />
        </>
      )}

      {/* Meta Pixel. Dono da init do pixel principal (NEXT_PUBLIC_META_PIXEL_ID)
          é o GTM (tag base com trackSingle, ticket bui/43): init aqui era a dupla
          que o fbevents acusava (Duplicate Pixel ID) e dobrava o PageView no Ads
          Manager. O código inita SÓ o TS Pixel, com PageView por trackSingle pra
          não vazar broadcast pro principal. Eventos de funil (ViewContent,
          InitiateCheckout, Lead) seguem broadcast: os dois pixels recebem. */}
      {pixelId && (
        <Script id="meta-pixel" strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${tsPixelId}');fbq('trackSingle','${tsPixelId}','PageView');`,
          }}
        />
      )}
    </>
  );
}

