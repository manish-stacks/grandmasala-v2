'use client';
import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminReports() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_URL;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const token = sessionStorage.getItem('admin_token');
      const res = await fetch(`${API}/get-reports`, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body:JSON.stringify({ dateFrom, dateTo }) });
      const data = await res.json();
      console.log("Report", data);
      if (data.success || res.ok) setReport(data);
      else toast.error('Failed to generate report');
    } catch { toast.error('Something went wrong'); } finally { setLoading(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <form onSubmit={handleGenerate} className="flex flex-wrap gap-4 items-end">
          <div><label className="block text-sm font-semibold text-gray-700 mb-1">From Date</label><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} required className="border-2 border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-[#81190B]"/></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1">To Date</label><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} required className="border-2 border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-[#81190B]"/></div>
          <button type="submit" disabled={loading} className="bg-[#81190B] hover:bg-[#5a1008] text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors">
            <Download size={16}/>{loading ? 'Generating...' : 'Generate Report'}
          </button>
        </form>
      </div>
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[['Total Orders', report.totalOrders||0],['Total Revenue', `₹${(report.totalRevenue||0).toLocaleString('en-IN')}`],['Delivered Orders', report.deliveredOrders||0]].map(([label, value]) => (
            <div key={label as string} className="bg-white rounded-2xl shadow-sm p-6 text-center">
              <p className="text-sm text-gray-500 mb-2">{label}</p>
              <p className="text-3xl font-bold text-[#81190B]">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
