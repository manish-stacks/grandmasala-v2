'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Save, ArrowLeft, Eye } from 'lucide-react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function CreateBlog() {
  const router = useRouter();
  const [form, setForm] = useState({
    meta_title: '', author: 'Grand Masala', imageUrl: '',
    metaDescription: '', slug: '', metaKeyWord: '', html_content: '',
  });
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const autoSlug = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.meta_title || !form.slug || !form.imageUrl || !form.metaDescription || !form.html_content) {
      toast.error('All fields marked * are required'); return;
    }
    setSaving(true);
    const token = sessionStorage.getItem('admin_token');
    try {
      const body = {
        ...form,
        metaKeyWord: form.metaKeyWord.split(',').map(k => k.trim()).filter(Boolean),
      };
      const res = await fetch(`${API}/blog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) { toast.success('Blog published!'); router.push('/admin/blogs'); }
      else toast.error(data.message || 'Failed to create blog');
    } catch { toast.error('Something went wrong'); } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/blogs" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft size={16} /> Blogs
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Blog Post</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Blog Title *</label>
                <input value={form.meta_title}
                  onChange={e => setForm(p => ({ ...p, meta_title: e.target.value, slug: autoSlug(e.target.value) }))}
                  required placeholder="e.g. Benefits of Pure Haldi for Your Health"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cover Image URL *</label>
                <input value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))}
                  required placeholder="https://res.cloudinary.com/..."
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] text-sm" />
                {form.imageUrl && (
                  <div className="mt-2 rounded-xl overflow-hidden h-32 bg-gray-100">
                    <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Meta Description * <span className="text-gray-400 font-normal">(shows in Google results)</span></label>
                <textarea value={form.metaDescription}
                  onChange={e => setForm(p => ({ ...p, metaDescription: e.target.value }))}
                  required rows={3} placeholder="Brief description of the blog for SEO (150-160 characters)"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] text-sm resize-none" />
                <div className={`text-xs mt-0.5 ${form.metaDescription.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>{form.metaDescription.length}/160</div>
              </div>
            </div>

            {/* Content */}
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
                  dangerouslySetInnerHTML={{ __html: form.html_content || '<p class="text-gray-400">Nothing to preview yet...</p>' }} />
              ) : (
                <textarea value={form.html_content}
                  onChange={e => setForm(p => ({ ...p, html_content: e.target.value }))}
                  required rows={24}
                  placeholder={`<h2>Introduction</h2>\n<p>Your blog content here...</p>\n\n<h3>Section 1</h3>\n<p>More content...</p>`}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#81190B] font-mono text-xs resize-y" />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4">Publish</h3>
              <button type="submit" disabled={saving}
                className="w-full bg-[#81190B] hover:bg-[#5a1008] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
                <Save size={16} />{saving ? 'Publishing...' : 'Publish Blog'}
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
              <h3 className="font-bold text-gray-900">URL Settings</h3>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Slug (URL) *</label>
                <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} required
                  placeholder="benefits-of-pure-haldi"
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#81190B] text-xs font-mono" />
                <p className="text-xs text-gray-400 mt-0.5">grandmasala.in/blog/<span className="font-semibold">{form.slug || 'your-slug'}</span></p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Author</label>
                <input value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#81190B] text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Keywords (comma separated)</label>
                <input value={form.metaKeyWord} onChange={e => setForm(p => ({ ...p, metaKeyWord: e.target.value }))}
                  placeholder="haldi, turmeric, benefits"
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#81190B] text-sm" />
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-gray-700">HTML Formatting Tips:</p>
              <p><code className="bg-white px-1 rounded">&lt;h2&gt;</code> Main heading</p>
              <p><code className="bg-white px-1 rounded">&lt;h3&gt;</code> Sub heading</p>
              <p><code className="bg-white px-1 rounded">&lt;p&gt;</code> Paragraph</p>
              <p><code className="bg-white px-1 rounded">&lt;strong&gt;</code> Bold text</p>
              <p><code className="bg-white px-1 rounded">&lt;ul&gt;&lt;li&gt;</code> Bullet list</p>
              <p><code className="bg-white px-1 rounded">&lt;img src="..." /&gt;</code> Image</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
