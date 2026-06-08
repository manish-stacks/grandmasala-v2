'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';

const API = process.env.NEXT_PUBLIC_API_URL;

const POLICY_PAGES = [
  { slug: 'privacy-policy', title: 'Privacy Policy', url: '/privacy' },
  { slug: 'terms-conditions', title: 'Terms & Conditions', url: '/terms' },
  { slug: 'refund-policy', title: 'Refund Policy', url: '/refund' },
  { slug: 'shipping-policy', title: 'Shipping Policy', url: '/shipping' },
  { slug: 'return-policy', title: 'Return Policy', url: '/return' },
];

const emptyForm = { title: '', content: '', url: '', meta_title: '', meta_dec: '', meta_keywords: '', slug: '', isShown: true };

export default function AdminPages() {
  const [pages, setPages] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('admin_token');
      const res = await fetch(`${API}/admin/pages`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      setPages(d.pages || []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchPages(); }, []);

  const openEdit = async (slug: string, preset?: { title: string; url: string }) => {
    const token = sessionStorage.getItem('admin_token');
    try {
      const res = await fetch(`${API}/admin/page/${slug}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (d.page) {
        setEditing(d.page);
        setForm({
          title: d.page.title || '', content: d.page.content || '',
          url: d.page.url || '', meta_title: d.page.meta_title || '',
          meta_dec: d.page.meta_dec || d.page.meta_desc || '', // both field names handle karo
          meta_keywords: Array.isArray(d.page.meta_keywords) ? d.page.meta_keywords.join(', ') : (d.page.meta_keywords || ''),
          slug: d.page.slug || '', isShown: d.page.isShown !== false,
        });
      } else {
        // Page doesn't exist yet - create mode
        setEditing({ slug, isNew: true });
        setForm({ ...emptyForm, title: preset?.title || '', url: preset?.url || '', slug, meta_title: preset?.title || '' });
      }
    } catch {
      setEditing({ slug, isNew: true });
      setForm({ ...emptyForm, title: preset?.title || '', url: preset?.url || '', slug });
    }
  };

  const openNew = () => {
    setEditing({ isNew: true });
    setForm(emptyForm);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.slug || !form.url) { toast.error('Title, Slug and URL are required'); return; }
    setSaving(true);
    const token = sessionStorage.getItem('admin_token');
    try {
      const isNew = editing?.isNew || !pages.find(p => p.slug === form.slug);
      const url = isNew ? `${API}/admin/page` : `${API}/admin/page/${form.slug}`;
      const method = isNew ? 'POST' : 'PUT';
      const body = {
        title: form.title, content: form.content, url: form.url,
        meta_title: form.meta_title, meta_dec: form.meta_dec,
        meta_keywords: form.meta_keywords.split(',').map((k: string) => k.trim()).filter(Boolean),
        slug: form.slug, isShown: form.isShown,
      };
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.page || res.ok) {
        toast.success(isNew ? 'Page created!' : 'Page updated!');
        setEditing(null);
        fetchPages();
      } else {
        toast.error(data.message || 'Failed to save');
      }
    } catch { toast.error('Error saving'); } finally { setSaving(false); }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Delete this page?')) return;
    const token = sessionStorage.getItem('admin_token');
    try {
      await fetch(`${API}/admin/page/${slug}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      toast.success('Deleted'); fetchPages();
    } catch { toast.error('Failed'); }
  };

  // ─── EDIT MODE ───
  if (editing) return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setEditing(null)} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{editing.isNew ? 'Create Page' : `Edit: ${editing.title || form.title}`}</h1>
      </div>

      <form onSubmit={handleSave} className="max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Page Title *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required
                  placeholder="e.g. Privacy Policy"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Content (HTML) *</label>
                <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={20}
                  placeholder="<h2>Your Page Title</h2>&#10;<p>Content goes here...</p>"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#81190B] font-mono text-xs resize-y" />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Publish */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-3">Publish</h3>
              <div className="flex items-center gap-3 mb-4">
                <input type="checkbox" id="isShown" checked={form.isShown} onChange={e => setForm(p => ({ ...p, isShown: e.target.checked }))} className="w-4 h-4 accent-[#81190B]" />
                <label htmlFor="isShown" className="text-sm font-medium text-gray-700">
                  {form.isShown ? '👁 Visible to public' : '🙈 Hidden from public'}
                </label>
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-[#81190B] hover:bg-[#5a1008] text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors text-sm">
                <Save size={16} />{saving ? 'Saving...' : 'Save Page'}
              </button>
            </div>

            {/* URL & Slug */}
            <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
              <h3 className="font-bold text-gray-900">URL & Routing</h3>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">URL Path *</label>
                <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} required
                  placeholder="/privacy" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#81190B] text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Slug *</label>
                <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} required
                  placeholder="privacy-policy" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#81190B] text-sm font-mono" />
              </div>
            </div>

            {/* SEO */}
            <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
              <h3 className="font-bold text-gray-900">SEO</h3>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Meta Title</label>
                <input value={form.meta_title} onChange={e => setForm(p => ({ ...p, meta_title: e.target.value }))}
                  placeholder="Page title for search engines"
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#81190B] text-sm" />
                <p className="text-xs text-gray-400 mt-0.5">{form.meta_title.length}/60</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Meta Description</label>
                <textarea value={form.meta_dec} onChange={e => setForm(p => ({ ...p, meta_dec: e.target.value }))}
                  rows={3} placeholder="Brief description for Google results"
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#81190B] text-sm resize-none" />
                <p className="text-xs text-gray-400 mt-0.5">{form.meta_dec.length}/160</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Keywords (comma separated)</label>
                <input value={form.meta_keywords} onChange={e => setForm(p => ({ ...p, meta_keywords: e.target.value }))}
                  placeholder="keyword1, keyword2, keyword3"
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#81190B] text-sm" />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );

  // ─── LIST MODE ───
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pages</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage policy pages and custom pages</p>
        </div>
        <button onClick={openNew}
          className="bg-[#81190B] hover:bg-[#5a1008] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold transition-colors">
          <Plus size={16} /> New Page
        </button>
      </div>

      {/* Policy Pages */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Policy Pages</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {POLICY_PAGES.map(pp => {
            const exists = pages.find(p => p.slug === pp.slug);
            return (
              <div key={pp.slug} className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{pp.title}</h3>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{pp.url}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${exists ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {exists ? 'Live' : 'Empty'}
                  </span>
                </div>
                {exists && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{exists.meta_dec || exists.meta_desc || 'No meta description'}</p>}
                <div className="flex gap-2">
                  <button onClick={() => openEdit(pp.slug, { title: pp.title, url: pp.url })}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl text-xs font-semibold transition-colors">
                    <Edit size={13} />{exists ? 'Edit' : 'Create'}
                  </button>
                  {exists && (
                    <button onClick={() => handleDelete(pp.slug)}
                      className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Pages */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Custom Pages</h2>
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#81190B] mx-auto" /></div>
        ) : (
          <div className="space-y-2">
            {pages.filter(p => !POLICY_PAGES.find(pp => pp.slug === p.slug)).map(p => (
              <div key={p._id} className="bg-white rounded-2xl shadow-sm px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${p.isShown ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div>
                    <p className="font-semibold text-gray-900">{p.title}</p>
                    <p className="text-xs text-gray-400 font-mono">{p.url}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(p.slug)} className="p-1.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100"><Edit size={15} /></button>
                  <button onClick={() => handleDelete(p.slug)} className="p-1.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
            {pages.filter(p => !POLICY_PAGES.find(pp => pp.slug === p.slug)).length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">
                No custom pages yet. Click "New Page" to create one.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
