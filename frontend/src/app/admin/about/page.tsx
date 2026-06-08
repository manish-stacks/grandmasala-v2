'use client';
import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminAbout() {
  const [form, setForm] = useState({ title: '', content: '', metaDescription: '' });
  const [saving, setSaving] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetch(`${API}/get-about`).then(r => r.json()).then(d => {
      const a = d.about || {};
      setForm({ title: a.title || 'About Grand Masala', content: a.content || '', metaDescription: a.metaDescription || '' });
    }).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const token = sessionStorage.getItem('admin_token');
      const res = await fetch(`${API}/create-or-update-about`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success || res.ok) toast.success('About Us updated!');
      else toast.error(data.message || 'Failed');
    } catch { toast.error('Error'); } finally { setSaving(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">About Us</h1>
      <form onSubmit={handleSave} className="max-w-4xl space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Page Title</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B]" placeholder="About Grand Masala" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Meta Description</label>
            <input value={form.metaDescription} onChange={e => setForm(p => ({ ...p, metaDescription: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B]" placeholder="Brief description for SEO" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Content (HTML)</label>
            <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={20}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#81190B] font-mono text-sm resize-y"
              placeholder="<h2>Our Story</h2>&#10;<p>Grand Masala was founded...</p>" />
          </div>
        </div>
        <button type="submit" disabled={saving}
          className="w-full bg-[#81190B] hover:bg-[#5a1008] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
          <Save size={18} />{saving ? 'Saving...' : 'Save About Us'}
        </button>
      </form>
    </div>
  );
}
