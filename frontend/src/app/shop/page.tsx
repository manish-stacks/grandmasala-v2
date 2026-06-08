import type { Metadata } from 'next';
import { serverFetch, SITE_URL } from '@/lib/api';
import ShopClient from './ShopClient';

export const metadata: Metadata = {
  title: 'Shop All Spices — Grand Masala',
  description: 'Shop 100% pure handmade Indian spices — Haldi, Garam Masala, Lal Mirch, Dhania. No preservatives. FSSC 22000 certified. Free delivery above ₹299.',
  alternates: { canonical: `${SITE_URL}/shop` },
  openGraph: { title: 'Shop Pure Indian Spices — Grand Masala', url: `${SITE_URL}/shop`, images: [`${SITE_URL}/og-image.jpg`] },
};

export default async function ShopPage() {
  const [productsData, categoriesData] = await Promise.all([
    serverFetch<any>('/get-product'),
    serverFetch<any>('/admin/category'),
  ]);
  return <ShopClient initialProducts={productsData?.products || []} initialCategories={categoriesData?.categories || []} />;
}
