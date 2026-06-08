'use client';
import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminSupport() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const API = process.env.NEXT_PUBLIC_API_URL;

  const fetchTickets = async () => {
    setLoading(true);
    try { const token = sessionStorage.getItem('admin_token'); const res = await fetch(`${API}/admin/support-request/all`, { headers:{Authorization:`Bearer ${token}`} }); const d = await res.json(); setTickets(d.contacts||d.data||[]); }
    catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchTickets(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this ticket?')) return;
    try { const token = sessionStorage.getItem('admin_token'); await fetch(`${API}/admin/support-delete/${id}`, { method:'DELETE', headers:{Authorization:`Bearer ${token}`} }); toast.success('Deleted'); fetchTickets(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Support Requests ({tickets.length})</h1>
      {loading ? <div className="bg-white rounded-2xl p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#81190B] mx-auto"/></div> : (
        <div className="space-y-4">
          {tickets.map(t => (
            <div key={t._id} className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2"><h3 className="font-bold text-gray-900">{t.name||t.Name}</h3><span className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</span></div>
                  <p className="text-sm text-gray-600 mb-1">📧 {t.email||t.Email}</p>
                  {t.phone && <p className="text-sm text-gray-600 mb-2">📞 {t.phone}</p>}
                  <p className="text-gray-700 bg-gray-50 rounded-xl p-3 text-sm">{t.message}</p>
                </div>
                <button onClick={() => handleDelete(t._id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 flex-shrink-0"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
          {tickets.length === 0 && <div className="bg-white rounded-2xl p-12 text-center text-gray-400">No support requests</div>}
        </div>
      )}
    </div>
  );
}
