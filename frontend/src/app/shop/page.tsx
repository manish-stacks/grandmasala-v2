import type { Metadata } from 'next';
import { serverFetch, serverFetchNoCache, SITE_URL } from '@/lib/api';
import ShopClient from './ShopClient';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Shop All Spices — Grand Masala',
  description: 'Shop 100% pure handmade Indian spices — Haldi, Garam Masala, Lal Mirch, Dhania. No preservatives. Free delivery above ₹299.',
  alternates: { canonical: `${SITE_URL}/shop` },
  openGraph: { title: 'Shop Pure Indian Spices — Grand Masala', url: `${SITE_URL}/shop`, images: [`${SITE_URL}/og-image.jpg`] },
};

export default async function ShopPage() {
  const [productsData, categoriesData] = await Promise.all([
    serverFetchNoCache<any>('/get-product'),
    serverFetchNoCache<any>('/admin/category'),
  ]);
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#81190B]" />
      </div>
    }>
      <ShopClient initialProducts={productsData?.products || []} initialCategories={categoriesData?.categories || []} />
    </Suspense>
  )
}
