'use client';
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, Users, TrendingUp, Eye, ArrowUpRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL;

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminDashboard() {
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ orders: 0, revenue: 0, users: 0, products: 0 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const token = sessionStorage.getItem('admin_token');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [recentRes, allOrdersRes, usersRes, productsRes] = await Promise.all([
        fetch(`${API}/get-recent-orders`, { headers }).then(r => r.json()),
        fetch(`${API}/admin/get-all-order`, { headers }).then(r => r.json()),
        fetch(`${API}/admin/get-users`, { headers }).then(r => r.json()),
        fetch(`${API}/get-product`).then(r => r.json()),
      ]);
      console.log("recentRes, allOrdersRes, usersRes, productsRes", recentRes, allOrdersRes, usersRes, productsRes);
      setRecentOrders(recentRes.data || recentRes.orders || []);
      const allOrders = allOrdersRes.data || [];
      const revenue = allOrders.reduce((s: number, o: any) => s + (o.payAmt || 0), 0);
      setStats({
        orders: allOrders.length,
        revenue,
        users: (usersRes.data || []).length,
        products: (productsRes.products || []).length,
      });
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const cards = [
    { label: 'Total Orders', value: stats.orders, icon: ShoppingCart, color: 'bg-blue-500', link: '/admin/orders', change: '' },
    { label: 'Total Revenue', value: `₹${stats.revenue.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'bg-green-500', link: '/admin/reports', change: '' },
    { label: 'Total Users', value: stats.users, icon: Users, color: 'bg-purple-500', link: '/admin/users', change: '' },
    { label: 'Products', value: stats.products, icon: Package, color: 'bg-amber-500', link: '/admin/products', change: '' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back! Here's your store overview.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl text-sm transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(card => (
          <Link key={card.label} href={card.link}
            className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-3">
              <div className={`${card.color} w-10 h-10 rounded-xl flex items-center justify-center`}>
                <card.icon size={20} className="text-white" />
              </div>
              <ArrowUpRight size={16} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? <span className="block w-16 h-7 bg-gray-200 rounded animate-pulse" /> : card.value}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-[#81190B] hover:underline font-medium">View All →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Order ID', 'Customer', 'Items', 'Amount', 'Payment', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {Array(7).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : recentOrders.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No recent orders</td></tr>
              ) : (
                recentOrders.slice(0, 10).map((order: any) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-bold text-gray-900">{order.orderId}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{order.userId?.Name === 'Guest' ? order.shipping?.name : order.userId?.Name ||  '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{order.items?.length || 0} items</td>
                    <td className="px-4 py-3 text-sm font-bold text-[#81190B]">₹{order.payAmt?.toFixed(0)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${order.paymentType === 'ONLINE' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {order.paymentType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.orderId}`}
                        className="flex items-center gap-1 text-[#81190B] hover:underline text-sm font-medium">
                        <Eye size={14} /> View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
