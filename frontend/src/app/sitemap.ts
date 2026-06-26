import { MetadataRoute } from 'next';
import { API_BASE, SITE_URL } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/shop`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  let blogRoutes: MetadataRoute.Sitemap = [];

  try {
    const productsRes = await fetch(`${API_BASE}/get-product`, { next: { revalidate: 3600 } });
    const productsData = await productsRes.json();
    productRoutes = (productsData.products || []).map((p: any) => ({
      url: `${SITE_URL}/product/${p.slug || p._id}`,
      lastModified: new Date(p.updatedAt || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {}

  try {
    const blogsRes = await fetch(`${API_BASE}/blog`, { next: { revalidate: 3600 } });
    const blogsData = await blogsRes.json();
    blogRoutes = (blogsData.blogs || []).map((b: any) => ({
      url: `${SITE_URL}/blog/${b.slug}`,
      lastModified: new Date(b.updatedAt || Date.now()),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  } catch {}

  return [...staticRoutes, ...productRoutes, ...blogRoutes];
}