import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/api';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/checkout', '/cart', '/profile', '/api/'] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
