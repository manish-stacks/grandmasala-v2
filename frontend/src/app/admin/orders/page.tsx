'use client';
import React, { useState, useEffect } from 'react';
import { Search, Eye, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const API = process.env.NEXT_PUBLIC_API_URL;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('admin_token');
      const res = await fetch(`${API}/admin/get-all-order`, { headers:{ Authorization:`Bearer ${token}` } });
      const data = await res.json();
      console.log("data",data)
      setOrders(data.orders || []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchOrders(); }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const token = sessionStorage.getItem('admin_token');
      const res = await fetch(`${API}/admin/change-order-status`, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body:JSON.stringify({ orderId, status: newStatus }) });
      const data = await res.json();
      if (data.success) { toast.success('Status updated'); fetchOrders(); }
      else toast.error('Failed to update status');
    } catch { toast.error('Error updating status'); }
  };

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.orderId?.toLowerCase().includes(search.toLowerCase()) || o.userId?.Name?.toLowerCase().includes(search.toLowerCase()) || o.userId?.Email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusColor = (s: string) => ({ pending:'bg-yellow-100 text-yellow-800', confirmed:'bg-blue-100 text-blue-800', shipped:'bg-purple-100 text-purple-800', delivered:'bg-green-100 text-green-800', cancelled:'bg-red-100 text-red-800' }[s] || 'bg-gray-100 text-gray-800');
  const statuses = ['pending','confirmed','shipped','delivered','cancelled'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders ({orders.length})</h1>
        <button onClick={fetchOrders} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl text-sm transition-colors"><RefreshCw size={14}/>Refresh</button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by Order ID or customer..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#81190B] text-sm"/>
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#81190B] text-sm">
            <option value="all">All Status</option>
            {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
        </div>
        {loading ? <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#81190B] mx-auto"/></div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50"><tr>{['Order ID','Customer','Amount','Payment','Status','Change Status','Action'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(o => (
                  <tr key={o._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{o.orderId}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{o.userId?.Name || o.userId?.Email || 'Guest'}</td>
                    <td className="px-4 py-3 text-sm font-semibold">₹{o.payAmt?.toFixed(0)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${o.paymentType==='ONLINE' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{o.paymentType}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor(o.status)}`}>{o.status}</span></td>
                    <td className="px-4 py-3">
                      <select value={o.status} onChange={e => handleStatusChange(o._id, e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#81190B]">
                        {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3"><Link href={`/admin/orders/${o._id}`} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 inline-flex"><Eye size={16}/></Link></td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No orders found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
