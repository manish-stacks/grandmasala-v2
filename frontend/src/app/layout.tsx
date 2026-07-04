import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import ConditionalLayout from '@/components/ConditionalLayout';
import { SITE_URL, API_BASE } from '@/lib/api';
import { FaWhatsapp } from 'react-icons/fa6';

const inter = Inter({ subsets: ['latin'] });

// Fetch site settings for SEO (server-side, cached 1hr)
async function getSiteSettings() {
  try {
    const res = await fetch(`${API_BASE}/admin/settings`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch { return null; }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const seo = settings?.seo || {};
  const title = seo.metaTitle || 'Grand Masala — 100% Pure Handmade Indian Spices';
  const desc = seo.metaDesc || 'Buy premium handmade Indian spices online. No preservatives. Free delivery above ₹299.';
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
    authors: [{ name: 'Grand Masala', url: SITE_URL }],
    creator: 'Grand Masala',
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
      index: !seo.robots?.includes('noindex'),
      follow: !seo.robots?.includes('nofollow'),
      googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    verification: seo.googleVerification ? { google: seo.googleVerification } : undefined,
    alternates: { canonical },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const seo = settings?.seo || {};
  // console.log("settings",settings)
  // console.log("seo",seo)

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
              settings?.socialMediaLinks?.facebook || 'https://www.facebook.com/granddmasala',
              settings?.socialMediaLinks?.youtube || 'https://www.youtube.com/@GrandMasala2025',
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

      <body className={inter.className} style={{ overflow: 'auto' }}>
        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>

        {/* WhatsApp sticky button */}
        <a
          href="https://wa.me/919355577789?text=Hello%20Grand%20Masala,%20I%20would%20like%20to%20know%20more%20about%20your%20products."
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="
    fixed
    right-6
    bottom-20
    md:bottom-20
    z-[9999]
    flex
    h-14
    w-14
    items-center
    justify-center
    rounded-full
    bg-[#25D366]
    text-white
    shadow-lg
    shadow-green-500/40
    transition-all
    duration-300
    hover:scale-110
    hover:bg-[#20ba5a]
  "
        >
          <FaWhatsapp className="h-7 w-7" strokeWidth={2.2} />
        </a>

        {/* Custom body scripts from admin */}
        {seo.bodyScript && (
          <div dangerouslySetInnerHTML={{ __html: seo.bodyScript }} />
        )}
      </body>
    </html>
  );
}