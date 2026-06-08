'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [form, setForm] = useState({ title:'', status:'active' });
  const [loading, setLoading] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_URL;

  const fetchAnnouncements = async () => {
    try { const res = await fetch(`${API}/admin/annoncements`); const d = await res.json(); setAnnouncements(d.data||[]); } catch {}
  };
  useEffect(() => { fetchAnnouncements(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const token = sessionStorage.getItem('admin_token');
      const res = await fetch(`${API}/annoncement`, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body:JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { toast.success('Created!'); setForm({ title:'', status:'active' }); fetchAnnouncements(); }
      else toast.error('Failed');
    } catch { toast.error('Error'); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return;
    try {
      const token = sessionStorage.getItem('admin_token');
      await fetch(`${API}/admin/annoncement/${id}`, { method:'DELETE', headers:{Authorization:`Bearer ${token}`} });
      toast.success('Deleted'); fetchAnnouncements();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Announcements</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold mb-4">Add Announcement</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Text *</label><input value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} required placeholder="Free delivery on orders above ₹299" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#81190B] text-sm"/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(p=>({...p,status:e.target.value}))} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm">
                <option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#81190B] text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#5a1008]">
              <Plus size={16}/>{loading ? 'Adding...' : 'Add'}
            </button>
          </form>
        </div>
        <div className="lg:col-span-2 space-y-3">
          {announcements.map(a => (
            <div key={a._id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between">
              <div><p className="font-medium text-gray-900">{a.title}</p><span className={`text-xs font-semibold ${a.status==='active' ? 'text-green-600' : 'text-gray-400'}`}>{a.status}</span></div>
              <button onClick={() => handleDelete(a._id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"><Trash2 size={16}/></button>
            </div>
          ))}
          {announcements.length === 0 && <div className="bg-white rounded-2xl p-8 text-center text-gray-400">No announcements</div>}
        </div>
      </div>
    </div>
  );
}
