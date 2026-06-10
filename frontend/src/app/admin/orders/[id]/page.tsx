'use client';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, MapPin, User, CreditCard, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { use } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    const token = sessionStorage.getItem('admin_token');
    try {
      const res = await fetch(`${API}/recent-order/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("Order data", data);
      setOrder(data.order || data.data || null);
    } catch {
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchOrder(); }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    const token = sessionStorage.getItem('admin_token');
    try {
      const res = await fetch(`${API}/admin/change-order-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: order._id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Status updated to "${newStatus}"`);
        setOrder((p: any) => ({ ...p, status: newStatus }));
      } else {
        toast.error(data.message || 'Failed to update');
      }
    } catch { toast.error('Error'); } finally { setUpdating(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#81190B] border-t-transparent" />
    </div>
  );

  if (!order) return (
    <div className="text-center py-16">
      <p className="text-gray-500 mb-4">Order not found</p>
      <Link href="/admin/orders" className="text-[#81190B] hover:underline">← Back to Orders</Link>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/orders" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft size={16} /> Orders
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderId}</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package size={18} className="text-[#81190B]" /> Ordered Items
            </h2>
            <div className="divide-y divide-gray-100">
              {(order.items || []).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold text-gray-900">{item.name || item.product_name}</p>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity || item.Qunatity}
                      {(item.size || item.Varient_id) && ` · ${item.size || item.Varient_id}`}
                    </p>
                  </div>
                  <p className="font-bold text-gray-900">
                    ₹{((item.price || item.price_after_discount) * (item.quantity || item.Qunatity)).toFixed(0)}
                  </p>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="border-t pt-4 mt-2 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{order.totalAmount?.toFixed(0) || '—'}</span></div>
              {order.shippingAmount > 0 && <div className="flex justify-between text-gray-500"><span>Shipping</span><span>₹{order.shippingAmount}</span></div>}
              {order.discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span><span>-₹{order.discountAmount}</span></div>}
              {order.codFeeAmount > 0 && <div className="flex justify-between text-gray-500"><span>COD Fee</span><span>₹{order.codFeeAmount}</span></div>}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total Paid</span>
                <span className="text-[#81190B]">₹{order.payAmt?.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Update Status */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <RefreshCw size={18} className="text-[#81190B]" /> Update Order Status
            </h2>
            <div className="flex flex-wrap gap-2">
              {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => (
                <button key={s} disabled={updating || order.status === s}
                  onClick={() => handleStatusChange(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors capitalize ${order.status === s
                    ? (STATUS_COLORS[s] || 'bg-gray-100 text-gray-600') + ' ring-2 ring-offset-1 ring-current'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50'}`}>
                  {s}
                </button>
              ))}
            </div>
            {order.status === 'cancelled' && (
              <div className="mt-3 flex items-center gap-2">
                <button onClick={() => {
                  const token = sessionStorage.getItem('admin_token');
                  fetch(`${API}/refund-request-order/${order._id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } })
                    .then(r => r.json()).then(d => { if (d.success) toast.success('Refund initiated'); else toast.error(d.message); })
                    .catch(() => toast.error('Failed'));
                }} className="text-sm bg-red-50 text-red-600 px-4 py-2 rounded-xl hover:bg-red-100 transition-colors">
                  Initiate Refund
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Customer Info */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <User size={16} className="text-[#81190B]" /> Customer
            </h3>
            <div className="space-y-1">
              <p className="font-semibold text-gray-900">{order.userId?.Name || 'Guest'}</p>
              {order.userId?.Email && <p className="text-sm text-gray-500">{order.userId.Email}</p>}
              {order.userId?.ContactNumber && <p className="text-sm text-gray-500">📞 {order.userId.ContactNumber}</p>}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-[#81190B]" /> Delivery Address
            </h3>
            {order.shipping ? (
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-semibold text-gray-900">{order.shipping.name}</p>
                <p>{order.shipping.addressLine}</p>
                <p>{order.shipping.city}, {order.shipping.state} — {order.shipping.postCode}</p>
                <p>India</p>
                {order.shipping.mobileNumber && <p className="mt-1">📞 {order.shipping.mobileNumber}</p>}
                {order.shipping.email && <p>✉️ {order.shipping.email}</p>}
                <span className="inline-block mt-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full capitalize">{order.shipping.addressType}</span>
              </div>
            ) : <p className="text-sm text-gray-400">No address on record</p>}
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <CreditCard size={16} className="text-[#81190B]" /> Payment
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${order.paymentType === 'ONLINE' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                  {order.paymentType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-bold text-[#81190B]">₹{order.payAmt?.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              {order.razorpayOrderId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Razorpay ID</span>
                  <span className="font-mono text-xs truncate max-w-24">{order.razorpayOrderId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
