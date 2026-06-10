import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import ConditionalLayout from '@/components/ConditionalLayout';
import { SITE_URL, API_BASE } from '@/lib/api';

const inter = Inter({ subsets: ['latin'] });

// Fetch site settings for SEO (server-side, cached 1hr)
async function getSiteSettings() {
  try {
    const res = await fetch(`${API_BASE}/admin/settings`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch { return null; }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const seo = settings?.seo || {};
  const title = seo.metaTitle || 'Grand Masala — 100% Pure Handmade Indian Spices';
  const desc  = seo.metaDesc  || 'Buy premium handmade Indian spices online. No preservatives. Free delivery above ₹299.';
  const canonical = seo.canonicalUrl || SITE_URL;
// /logo.png
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: '%s | Grand Masala' },
    description: desc,
    icons: {
  icon: [
    { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
  ],
  apple: "/apple-touch-icon.png",
},
    keywords: seo.metaKeywords ? seo.metaKeywords.split(',').map((k: string) => k.trim()) : ['Indian spices online', 'pure haldi', 'handmade garam masala', 'Grand Masala'],
    authors:   [{ name: 'Grand Masala', url: SITE_URL }],
    creator:   'Grand Masala',
    publisher: 'Grand Masala',
    openGraph: {
      type: 'website', locale: 'en_IN', url: canonical,
      siteName: settings?.siteName || 'Grand Masala',
      title, description: desc,
      images: seo.ogImage
        ? [{ url: seo.ogImage, width: 1200, height: 630 }]
        : [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image', title, description: desc,
      images: [seo.ogImage || `${SITE_URL}/og-image.jpg`],
    },
    robots: {
      index:     !seo.robots?.includes('noindex'),
      follow:    !seo.robots?.includes('nofollow'),
      googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    verification: seo.googleVerification ? { google: seo.googleVerification } : undefined,
    alternates: { canonical },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const seo = settings?.seo || {};

  return (
    <html lang="en">
      <head>
        {/* Organization structured data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org', '@type': 'Organization',
            name: settings?.siteName || 'Grand Masala',
            url: SITE_URL,
            logo: `${SITE_URL}/logo.png`,
            contactPoint: { '@type': 'ContactPoint', telephone: settings?.contactNumber || '+91-93555-77789', contactType: 'customer service', areaServed: 'IN' },
            sameAs: [
              settings?.socialMediaLinks?.instagram || 'https://www.instagram.com/grand.masala',
              settings?.socialMediaLinks?.facebook  || 'https://www.facebook.com/granddmasala',
              settings?.socialMediaLinks?.youtube   || 'https://www.youtube.com/@GrandMasala2025',
            ].filter(Boolean),
          })
        }} />

        {/* Google Analytics */}
        {seo.gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${seo.gaId}`} />
            <script dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${seo.gaId}');`
            }} />
          </>
        )}

        {/* Facebook Pixel */}
        {seo.fbPixelId && (
          <script dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${seo.fbPixelId}');fbq('track','PageView');`
          }} />
        )}

        {/* Custom head scripts from admin */}
        {seo.headScript && (
          <script dangerouslySetInnerHTML={{ __html: seo.headScript }} />
        )}

        {/* Razorpay SDK loaded dynamically on checkout */}
      </head>

      <body className={inter.className} style={{overflow:'auto'}}>
  <Providers>
    <ConditionalLayout>{children}</ConditionalLayout>
  </Providers>

  {/* WhatsApp sticky button */}
  <a
    href="https://wa.me/919355577789?text=Hello%20Grand%20Masala,%20I%20would%20like%20to%20know%20more%20about%20your%20products."
    target="_blank"
    rel="noopener noreferrer"
    style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
      width: '56px', height: '56px', borderRadius: '50%',
      background: '#25D366', display: 'flex', alignItems: 'center',
      justifyContent: 'center', boxShadow: '0 4px 16px rgba(37,211,102,0.4)',
      textDecoration: 'none',
    }}
    aria-label="Chat on WhatsApp"
  >
    <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  </a>

  {/* Custom body scripts from admin */}
  {seo.bodyScript && (
    <div dangerouslySetInnerHTML={{ __html: seo.bodyScript }} />
  )}
</body>
    </html>
  );
}