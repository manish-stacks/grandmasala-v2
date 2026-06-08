import type { Metadata } from 'next';
import { serverFetch, SITE_URL } from '@/lib/api';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await serverFetch<any>(`/blog/${slug}`);
  if (!data?.blog) return { title: 'Blog Not Found' };
  const blog = data.blog;
  return {
    title: `${blog.meta_title} — Grand Masala`,
    description: blog.metaDescription,
    keywords: blog.metaKeyWord,
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
    openGraph: {
      title: blog.meta_title,
      description: blog.metaDescription,
      url: `${SITE_URL}/blog/${slug}`,
      type: 'article',
      images: blog.imageUrl ? [{ url: blog.imageUrl }] : [],
      publishedTime: blog.createdAt,
      modifiedTime: blog.updatedAt,
      authors: [blog.author || 'Grand Masala'],
    },
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await serverFetch<any>(`/blog/${slug}`);
  if (!data?.blog) notFound();
  const blog = data.blog;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.meta_title,
    description: blog.metaDescription,
    image: blog.imageUrl,
    author: { '@type': 'Person', name: blog.author || 'Grand Masala' },
    publisher: { '@type': 'Organization', name: 'Grand Masala', logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` } },
    datePublished: blog.createdAt,
    dateModified: blog.updatedAt,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${slug}` },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="bg-[#FDFBF7] min-h-screen">
        {/* Banner */}
        <div className="relative bg-[#81190B] text-white py-20">
          {blog.imageUrl && <Image src={blog.imageUrl} alt={blog.meta_title} fill className="object-cover opacity-20" sizes="100vw" />}
          <div className="relative max-w-4xl mx-auto text-center px-6">
            <span className="text-amber-300 text-sm font-semibold uppercase tracking-widest">{blog.metaKeyWord?.[0] || 'Spices & Health'}</span>
            <h1 className="text-4xl md:text-5xl font-bold mt-3 mb-4">{blog.meta_title}</h1>
            <p className="text-white/70 text-sm">By {blog.author || 'Grand Masala'} · {new Date(blog.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="prose prose-lg max-w-none prose-headings:text-[#81190B] prose-a:text-[#81190B]"
            dangerouslySetInnerHTML={{ __html: blog.html_content }} />

          {/* Tags */}
          {blog.metaKeyWord?.length > 0 && (
            <div className="mt-10 pt-6 border-t flex flex-wrap gap-2">
              {blog.metaKeyWord.map((kw: string) => (
                <span key={kw} className="bg-[#F4F1EA] text-[#81190B] text-xs font-medium px-3 py-1 rounded-full">{kw}</span>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-10 bg-[#81190B] text-white rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-3">Ready to experience authentic spices?</h3>
            <Link href="/shop" className="inline-block bg-white text-[#81190B] font-semibold px-8 py-3 rounded-xl hover:bg-amber-50 transition-colors">Shop Grand Masala →</Link>
          </div>

          <div className="mt-8">
            <Link href="/blog" className="text-[#81190B] hover:underline">← Back to All Blogs</Link>
          </div>
        </div>
      </div>
    </>
  );
}
