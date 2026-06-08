'use client';
import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminHero() {
  const [hero, setHero] = useState<any>({});
  const [form, setForm] = useState({ title: '', subtitle: '', buttonText: '', buttonLink: '', imageUrl: '', isActive: true });
  const [saving, setSaving] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetch(`${API}/admin/get/hero_page`).then(r => r.json()).then(d => {
      const h = d.heroPage || d.data || {};
      setHero(h);
      setForm({ title: h.title || '', subtitle: h.subtitle || '', buttonText: h.buttonText || 'Shop Now', buttonLink: h.buttonLink || '/shop', imageUrl: h.imageUrl || '', isActive: h.isActive !== false });
    }).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const token = sessionStorage.getItem('admin_token');
      const res = await fetch(`${API}/admin/create_and_update/hero_page`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success || res.ok) toast.success('Hero section updated!');
      else toast.error(data.message || 'Failed');
    } catch { toast.error('Error saving'); } finally { setSaving(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Hero Section</h1>
      <form onSubmit={handleSave} className="max-w-2xl space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-900 border-b pb-2">Hero Content</h2>
          {[['Title', 'title', 'text', 'e.g. Elevate Your Cooking'], ['Subtitle', 'subtitle', 'text', 'e.g. Premium handcrafted blends...'], ['Button Text', 'buttonText', 'text', 'Shop Now'], ['Button Link', 'buttonLink', 'text', '/shop'], ['Background Image URL', 'imageUrl', 'url', 'https://...']].map(([label, key, type, ph]) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
              <input type={type} value={form[key as keyof typeof form] as string} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={ph} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B]" />
            </div>
          ))}
          <div className="flex items-center gap-3">
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-[#81190B]" />
            <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">Active (show on homepage)</label>
          </div>
        </div>
        <button type="submit" disabled={saving}
          className="w-full bg-[#81190B] hover:bg-[#5a1008] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
          <Save size={18} />{saving ? 'Saving...' : 'Save Hero Section'}
        </button>
      </form>
    </div>
  );
}
