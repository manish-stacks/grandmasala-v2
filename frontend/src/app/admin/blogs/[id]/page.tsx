'use client';
import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Eye } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { use } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function EditBlog({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState({
    meta_title: '', author: '', imageUrl: '', metaDescription: '',
    slug: '', metaKeyWord: '', html_content: '',
  });

  useEffect(() => {
    // Fetch blog by ID from all blogs
    fetch(`${API}/blog`)
      .then(r => r.json())
      .then(d => {
        const blog = (d.blogs || []).find((b: any) => b._id === id);
        if (blog) {
          setForm({
            meta_title: blog.meta_title || '',
            author: blog.author || 'Grand Masala',
            imageUrl: blog.imageUrl || '',
            metaDescription: blog.metaDescription || '',
            slug: blog.slug || '',
            metaKeyWord: Array.isArray(blog.metaKeyWord) ? blog.metaKeyWord.join(', ') : (blog.metaKeyWord || ''),
            html_content: blog.html_content || '',
          });
        } else {
          toast.error('Blog not found');
          router.push('/admin/blogs');
        }
      })
      .catch(() => { toast.error('Failed to load blog'); })
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = sessionStorage.getItem('admin_token');
    try {
      const body = {
        ...form,
        metaKeyWord: form.metaKeyWord.split(',').map((k: string) => k.trim()).filter(Boolean),
      };
      const res = await fetch(`${API}/blog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) { toast.success('Blog updated!'); router.push('/admin/blogs'); }
      else toast.error(data.message || 'Failed to update');
    } catch { toast.error('Error saving'); } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#81190B] border-t-transparent" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/blogs" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft size={16} /> Blogs
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Blog</h1>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Blog Title *</label>
                <input value={form.meta_title} onChange={e => setForm(p => ({ ...p, meta_title: e.target.value }))} required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cover Image URL *</label>
                <input value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] text-sm" />
                {form.imageUrl && (
                  <div className="mt-2 rounded-xl overflow-hidden h-32 bg-gray-100">
                    <img src={form.imageUrl} alt="Cover" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Meta Description *</label>
                <textarea value={form.metaDescription} onChange={e => setForm(p => ({ ...p, metaDescription: e.target.value }))}
                  required rows={3} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] text-sm resize-none" />
                <div className={`text-xs mt-0.5 ${form.metaDescription.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>{form.metaDescription.length}/160</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700">Blog Content (HTML) *</label>
                <button type="button" onClick={() => setPreview(p => !p)}
                  className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors">
                  <Eye size={13} />{preview ? 'Edit' : 'Preview'}
                </button>
              </div>
              {preview ? (
                <div className="border-2 border-gray-100 rounded-xl p-6 min-h-64 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: form.html_content }} />
              ) : (
                <textarea value={form.html_content} onChange={e => setForm(p => ({ ...p, html_content: e.target.value }))}
                  required rows={24}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#81190B] font-mono text-xs resize-y" />
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4">Update</h3>
              <button type="submit" disabled={saving}
                className="w-full bg-[#81190B] hover:bg-[#5a1008] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
                <Save size={16} />{saving ? 'Saving...' : 'Update Blog'}
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
              <h3 className="font-bold text-gray-900">URL Settings</h3>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Slug (URL)</label>
                <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#81190B] text-xs font-mono" />
                <p className="text-xs text-gray-400 mt-0.5">/blog/<span className="font-semibold">{form.slug}</span></p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Author</label>
                <input value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#81190B] text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Keywords (comma separated)</label>
                <input value={form.metaKeyWord} onChange={e => setForm(p => ({ ...p, metaKeyWord: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#81190B] text-sm" />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
