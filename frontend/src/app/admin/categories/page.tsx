'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [subForm, setSubForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_URL;

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API}/admin/category`);
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {}
  };
  useEffect(() => { fetchCategories(); }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const token = sessionStorage.getItem('admin_token');
      const res = await fetch(`${API}/admin/create/category`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(catForm),
      });
      const data = await res.json();
      if (data.success || res.ok) { toast.success('Category created!'); setCatForm({ name: '', description: '' }); fetchCategories(); }
      else toast.error(data.message || 'Failed');
    } catch { toast.error('Error'); } finally { setLoading(false); }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      const token = sessionStorage.getItem('admin_token');
      await fetch(`${API}/admin/category-del/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      toast.success('Deleted'); fetchCategories();
    } catch { toast.error('Failed'); }
  };

  const handleAddSubcategory = async (catId: string) => {
    const name = subForm[catId];
    if (!name?.trim()) return;
    try {
      const token = sessionStorage.getItem('admin_token');
      const res = await fetch(`${API}/admin/create/sub-category/${catId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.success || res.ok) { toast.success('Subcategory added!'); setSubForm(p => ({ ...p, [catId]: '' })); fetchCategories(); }
      else toast.error(data.message || 'Failed');
    } catch { toast.error('Error'); }
  };

  const handleDeleteSubcategory = async (subId: string) => {
    if (!confirm('Delete this subcategory?')) return;
    try {
      const token = sessionStorage.getItem('admin_token');
      await fetch(`${API}/admin/sub-category/delete/${subId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      toast.success('Deleted'); fetchCategories();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Categories</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Category Form */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">Add Category</h2>
          <form onSubmit={handleCreateCategory} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
              <input value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} required
                placeholder="e.g. Whole Spices"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#81190B] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
              <textarea value={catForm.description} onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))}
                rows={3} placeholder="Optional description"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#81190B] text-sm resize-none" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[#81190B] text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#5a1008] transition-colors">
              <Plus size={16} />{loading ? 'Creating...' : 'Create Category'}
            </button>
          </form>
        </div>

        {/* Categories List */}
        <div className="lg:col-span-2 space-y-3">
          {categories.map(cat => (
            <div key={cat._id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <button onClick={() => setExpanded(p => ({ ...p, [cat._id]: !p[cat._id] }))}
                  className="flex items-center gap-3 flex-1 text-left">
                  {expanded[cat._id] ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                  <div>
                    <p className="font-bold text-gray-900">{cat.name}</p>
                    {cat.description && <p className="text-xs text-gray-500">{cat.description}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{cat.subcategories?.length || 0} subcategories</p>
                  </div>
                </button>
                <button onClick={() => handleDeleteCategory(cat._id)}
                  className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 ml-2"><Trash2 size={14} /></button>
              </div>

              {expanded[cat._id] && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                  {/* Subcategories */}
                  <div className="space-y-2 mb-3">
                    {(cat.subcategories || []).map((sub: any) => (
                      <div key={sub._id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                        <span className="text-sm text-gray-700">↳ {sub.name}</span>
                        <button onClick={() => handleDeleteSubcategory(sub._id)}
                          className="p-1 text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                      </div>
                    ))}
                    {!cat.subcategories?.length && <p className="text-xs text-gray-400">No subcategories yet</p>}
                  </div>
                  {/* Add subcategory */}
                  <div className="flex gap-2">
                    <input value={subForm[cat._id] || ''} onChange={e => setSubForm(p => ({ ...p, [cat._id]: e.target.value }))}
                      placeholder="New subcategory name"
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-[#81190B]" />
                    <button onClick={() => handleAddSubcategory(cat._id)}
                      className="bg-[#81190B] text-white px-3 py-1.5 rounded-xl text-sm hover:bg-[#5a1008] transition-colors">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {categories.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center text-gray-400">No categories yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
