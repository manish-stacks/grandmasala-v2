import type { Metadata } from 'next';
import { serverFetch, SITE_URL } from '@/lib/api';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await serverFetch<any>(`/get-product/${id}`);
  if (!data?.product) return { title: 'Product Not Found' };
  const p = data.product;
  const price = p.Varient?.[0]?.price_after_discount || p.afterDiscountPrice || p.price;
  return {
    title: `${p.product_name} — Grand Masala`,
    description: p.product_description?.slice(0, 160) || `Buy ${p.product_name} — 100% pure handmade Indian spice. FSSC 22000 certified. Free delivery above ₹299.`,
    keywords: [p.product_name, 'pure spices', 'handmade masala', 'Indian spices', p.category?.name],
    alternates: { canonical: `${SITE_URL}/product/${id}` },
    openGraph: {
      title: `${p.product_name} — Grand Masala`,
      description: p.product_description?.slice(0, 160),
      url: `${SITE_URL}/product/${id}`,
      images: p.ProductMainImage?.url ? [{ url: p.ProductMainImage.url, width: 800, height: 800, alt: p.product_name }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await serverFetch<any>(`/get-product/${id}`);
  if (!data?.product) notFound();

  const p = data.product;
  const price = p.Varient?.[0]?.price_after_discount || p.afterDiscountPrice || p.price;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.product_name,
    description: p.product_description,
    image: p.ProductMainImage?.url,
    brand: { '@type': 'Brand', name: 'Grand Masala' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: price,
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/product/${id}`,
      seller: { '@type': 'Organization', name: 'Grand Masala' },
    },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: '400' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <ProductDetailClient product={p} />
    </>
  );
}
