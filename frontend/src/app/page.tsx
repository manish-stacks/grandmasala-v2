import type { Metadata } from 'next';
import { serverFetch, SITE_URL } from '@/lib/api';
import HomeClient from '@/components/Home/HomeClient';

export const metadata: Metadata = {
  title: 'Grand Masala — 100% Pure Handmade Indian Spices | Free Delivery ₹299+',
  description: 'Buy premium handmade Indian spices. Haldi, Garam Masala, Lal Mirch, Dhania — no preservatives, FSSC 22000 certified. Trusted by 10,000+ households.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Grand Masala — Pure Handmade Indian Spices',
    description: 'Premium handmade spices. No preservatives. FSSC 22000 certified. Free delivery on orders above ₹299.',
    url: SITE_URL,
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630 }],
  },
};

export default async function HomePage() {
  // Prefetch data server-side for SEO
  const [productsData, blogsData, settingsData] = await Promise.all([
    serverFetch<any>('/get-product?limit=8'),
    serverFetch<any>('/blog?limit=3'),
    serverFetch<any>('/admin/settings'),
  ]);

  return <HomeClient 
    initialProducts={productsData?.products || []}
    initialBlogs={blogsData?.blogs || []}
    settings={settingsData?.data || {}}
  />;
}
