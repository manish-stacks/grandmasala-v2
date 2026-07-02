'use client';
import Link from 'next/link';
import Image from 'next/image';

export default function BlogSection({ initialBlogs }: { initialBlogs: any[] }) {
  
  return (
    <div className="relative bg-[#F4F1EA] py-16 px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="mb-12 text-center">
          <div className="flex justify-center"><div className="w-16 h-1 bg-[#81190B] mb-2" /></div>
          <h2 className="text-3xl lg:text-4xl font-black text-[#81190B] mb-4">Spice Blogs</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {initialBlogs.length > 0 ? initialBlogs.map((blog: any) => (
            <div key={blog._id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              {blog.imageUrl && (
                <div className="h-48 overflow-hidden relative">
                  <img src={blog.imageUrl} alt={blog.meta_title} fill className="object-cover hover:scale-105 transition-transform duration-500" sizes="(max-width:768px) 100vw, 33vw" />
                </div>
              )}
              <div className="p-6">
                <span className="text-xs font-semibold text-[#81190B] uppercase tracking-wide">Spices & Health</span>
                <h3 className="text-xl font-bold text-gray-900 mt-2 mb-3 line-clamp-2">{blog.meta_title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{blog.metaDescription}</p>
                <Link href={`/blog/${blog.slug}`} className="inline-flex items-center text-[#81190B] font-medium hover:text-[#5a1208] transition-colors">
                  Read More <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </Link>
              </div>
            </div>
          )) : [1,2,3].map(i => (
            <div key={i} className="bg-white rounded-lg overflow-hidden shadow-md p-6">
              <div className="h-4 bg-gray-200 rounded mb-3 animate-pulse" />
              <div className="h-3 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link href="/blog" className="px-6 py-3 bg-[#81190B] text-white font-medium rounded-md hover:bg-[#5a1208] transition-colors">View All Spice Blogs</Link>
        </div>
      </div>
    </div>
  );
}
