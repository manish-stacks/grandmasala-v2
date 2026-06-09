import type { Metadata } from 'next';
import { serverFetch, SITE_URL } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Spice Blogs & Recipes — Grand Masala',
  description: 'Read our blog for spice guides, Indian recipes, health benefits of turmeric, garam masala, and more. Learn about pure handmade Indian spices.',
  alternates: { canonical: `${SITE_URL}/blog` },
};

export const blogsData = [
    {
      id: 1,
      title: " The Magic of Turmeric",
      subtitle: "Discover the golden spice that heals and flavors.",
      imageUrl: "/images/blog/hldi.jpg",
      category: "Spices & Health"
    },
    {
      id: 2,
      title: "Cinnamon Secrets",
      subtitle: "Why this sweet spice is loved worldwide.",
      imageUrl: "/images/blog/right.png",
      category: "Flavors & Wellness"
    },
    {
      id: 3,
      title: "Red Chili Power",
      subtitle: "The fiery spice that adds heat to every dish.",
      imageUrl: "/images/blog/chilli.jpeg",
      category: "Spice Culture"
    }
  ];

export default async function BlogsPage() {
  const data = await serverFetch<any>('/blog');
  console.log('Fetched blogs data:', data);
  const blogs = data?.blogs || blogsData;

  return (
    <div className="min-h-screen bg-[#F4F1EA]">
      <div className="relative bg-[#81190B] text-white py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-4">Our <span className="text-amber-400">Blogs</span></h1>
        <p className="text-white/80">Spice guides, recipes, and health benefits</p>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {blogs.length === 0 ? (
          <p className="text-center text-gray-500 py-16">No blogs yet. Check back soon!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog: any) => (
              <article key={blog._id} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                {blog.imageUrl && (
                  <div className="h-48 relative overflow-hidden">
                    <Image src={blog.imageUrl} alt={blog.meta_title} fill className="object-cover hover:scale-105 transition-transform duration-500" sizes="33vw" />
                  </div>
                )}
                <div className="p-6">
                  <span className="text-xs font-semibold text-[#81190B] uppercase tracking-wide">
                    {blog.metaKeyWord?.[0] || 'Spices & Health'}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 mt-2 mb-3 line-clamp-2">{blog.meta_title}</h2>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{blog.metaDescription}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">By {blog.author || 'Grand Masala'}</span>
                    <Link href={`/blog/${blog.slug}`} className="inline-flex items-center text-[#81190B] font-medium text-sm hover:text-[#5a1208] transition-colors">
                      Read More →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
