'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-toastify';

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const API = process.env.NEXT_PUBLIC_API_URL;

  const fetchBlogs = async () => {
    setLoading(true);
    try { const res = await fetch(`${API}/blog`); const d = await res.json(); setBlogs(d.blogs||[]); }
    catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchBlogs(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog?')) return;
    try {
      const token = sessionStorage.getItem('admin_token');
      await fetch(`${API}/blog/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } });
      toast.success('Blog deleted'); fetchBlogs();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Blogs ({blogs.length})</h1>
        <Link href="/admin/blogs/create" className="bg-[#81190B] hover:bg-[#5a1008] text-white px-4 py-2 rounded-xl flex items-center gap-2"><Plus size={16}/>New Blog</Link>
      </div>
      {loading ? <div className="bg-white rounded-2xl p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#81190B] mx-auto"/></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map(blog => (
            <div key={blog._id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {blog.imageUrl && <div className="relative h-40"><Image src={blog.imageUrl} alt={blog.meta_title} fill className="object-cover" sizes="33vw"/></div>}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{blog.meta_title}</h3>
                <p className="text-sm text-gray-500 mb-1">/{blog.slug}</p>
                <p className="text-xs text-gray-400 mb-4">By {blog.author} · {new Date(blog.createdAt).toLocaleDateString()}</p>
                <div className="flex gap-2">
                  <Link href={`/admin/blogs/${blog._id}`} className="flex-1 flex items-center justify-center gap-1 bg-blue-50 text-blue-600 rounded-xl py-2 text-sm hover:bg-blue-100"><Edit size={14}/>Edit</Link>
                  <button onClick={() => handleDelete(blog._id)} className="flex-1 flex items-center justify-center gap-1 bg-red-50 text-red-600 rounded-xl py-2 text-sm hover:bg-red-100"><Trash2 size={14}/>Delete</button>
                </div>
              </div>
            </div>
          ))}
          {blogs.length === 0 && <div className="col-span-3 text-center py-12 text-gray-400">No blogs yet. Create your first blog!</div>}
        </div>
      )}
    </div>
  );
}
