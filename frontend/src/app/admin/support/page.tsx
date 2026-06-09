'use client';
import React, { useState, useEffect } from 'react';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';

const PAGE_SIZE = 10;

export default function AdminSupport() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const API = process.env.NEXT_PUBLIC_API_URL;

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('admin_token');
      const res = await fetch(`${API}/admin/support-request/all`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      setTickets(d.contacts || d.data || []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchTickets(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this ticket?')) return;
    try {
      const token = sessionStorage.getItem('admin_token');
      await fetch(`${API}/admin/support-delete/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      toast.success('Deleted');
      fetchTickets();
      // agar last page pe sirf 1 item tha aur delete hua toh prev page pe le jao
      if (paginated.length === 1 && page > 1) setPage(p => p - 1);
    } catch { toast.error('Failed'); }
  };

  const totalPages = Math.ceil(tickets.length / PAGE_SIZE);
  const paginated = tickets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Support Requests ({tickets.length})
      </h1>

      {loading ? (
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#81190B] mx-auto" />
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginated.map(t => (
              <div key={t._id} className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-900">{t.name || t.Name}</h3>
                      <span className="text-xs text-gray-400">
                        {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">📧 {t.email || t.Email}</p>
                    {t.phone && <p className="text-sm text-gray-600 mb-2">📞 {t.phone}</p>}
                    <p className="text-gray-700 bg-gray-50 rounded-xl p-3 text-sm">{t.message}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(t._id)}
                    className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {tickets.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center text-gray-400">
                No support requests
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 bg-white rounded-2xl shadow-sm px-5 py-3">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, tickets.length)} of {tickets.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600"
                >
                  <ChevronLeft size={18} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                      ${n === page
                        ? 'bg-[#81190B] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    {n}
                  </button>
                ))}

                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}