const Product = require('../models/Product.model');
const Blog = require('../models/BlogModel');
const Page = require('../models/Pages.');

const BASE_URL = 'https://grandmasala.in';

exports.getSitemap = async (req, res) => {
    try {
        const [products, blogs, pages] = await Promise.all([
            Product.find({}, '_id updatedAt').lean(),
            Blog.find({}, 'slug updatedAt').lean(),
            Page.find({ isShown: true }, 'slug updatedAt').lean()
        ]);

        const staticRoutes = [
            { url: '/', changefreq: 'daily', priority: '1.0' },
            { url: '/shop', changefreq: 'daily', priority: '0.9' },
            { url: '/about', changefreq: 'monthly', priority: '0.7' },
            { url: '/contact', changefreq: 'monthly', priority: '0.6' },
            { url: '/blogs', changefreq: 'weekly', priority: '0.8' },
            { url: '/privacy', changefreq: 'yearly', priority: '0.3' },
            { url: '/terms', changefreq: 'yearly', priority: '0.3' },
            { url: '/refund', changefreq: 'yearly', priority: '0.3' },
            { url: '/shipping', changefreq: 'yearly', priority: '0.3' },
            { url: '/return', changefreq: 'yearly', priority: '0.3' },
        ];

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        // Static routes
        staticRoutes.forEach(route => {
            xml += `
  <url>
    <loc>${BASE_URL}${route.url}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
        });

        // Product pages
        products.forEach(product => {
            xml += `
  <url>
    <loc>${BASE_URL}/product-page/${product._id}</loc>
    <lastmod>${new Date(product.updatedAt || Date.now()).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        });

        // Blog pages
        blogs.forEach(blog => {
            xml += `
  <url>
    <loc>${BASE_URL}/blogs/${blog.slug}</loc>
    <lastmod>${new Date(blog.updatedAt || Date.now()).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
        });

        // Dynamic pages
        pages.forEach(page => {
            xml += `
  <url>
    <loc>${BASE_URL}/pages/${page.slug}</loc>
    <lastmod>${new Date(page.updatedAt || Date.now()).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
        });

        xml += `\n</urlset>`;

        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.status(200).send(xml);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sitemap generation failed', error: error.message });
    }
};

exports.getRobotsTxt = (req, res) => {
    const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /checkout
Disallow: /cart
Disallow: /profile
Disallow: /api/

Sitemap: ${BASE_URL}/sitemap.xml`;

    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(robots);
};
