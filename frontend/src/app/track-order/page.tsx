'use client';
import React, { useState } from 'react';
import { Search, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setOrder(null);
    try {
      const token = sessionStorage.getItem('token_login');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recent-order/${orderId.trim()}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      const data = await res.json();
      if (data.order || data.data) setOrder(data.order || data.data);
      else toast.error('Order not found. Please check the Order ID.');
    } catch { toast.error('Something went wrong'); } finally { setLoading(false); }
  };

  const steps = ['pending', 'confirmed', 'shipped', 'delivered'];
  const currentStep = order ? steps.indexOf(order.status) : -1;

  return (
    <div className="min-h-screen bg-[#F4F1EA]">
      <div className="bg-[#81190B] text-white py-16 text-center">
        <h1 className="text-4xl font-bold mb-2">Track Your Order</h1>
        <p className="text-white/80">Enter your Order ID to see real-time status</p>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <form onSubmit={handleTrack} className="flex gap-4">
            <input value={orderId} onChange={e => setOrderId(e.target.value)} required
              placeholder="Enter Order ID (e.g. ORD1234567)"
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#81190B] text-sm" />
            <button type="submit" disabled={loading}
              className="bg-[#81190B] hover:bg-[#5a1008] text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors disabled:opacity-50">
              <Search size={18} />{loading ? 'Tracking...' : 'Track'}
            </button>
          </form>
        </div>

        {order && (
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{order.orderId}</h2>
                <p className="text-gray-500 text-sm">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#81190B]">₹{order.payAmt?.toFixed(0)}</p>
                <p className="text-sm text-gray-500">{order.paymentType}</p>
              </div>
            </div>

            {/* Progress tracker */}
            <div className="relative mb-8">
              <div className="flex justify-between relative z-10">
                {steps.map((step, i) => {
                  const icons = [Clock, CheckCircle, Truck, Package];
                  const Icon = icons[i];
                  const done = i <= currentStep;
                  return (
                    <div key={step} className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${done ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <Icon size={18} />
                      </div>
                      <p className={`text-xs font-semibold capitalize text-center ${done ? 'text-green-600' : 'text-gray-400'}`}>{step}</p>
                    </div>
                  );
                })}
              </div>
              <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-gray-100 z-0">
                <div className="h-full bg-green-400 transition-all duration-500" style={{ width: `${Math.max(0, (currentStep / (steps.length - 1)) * 100)}%` }} />
              </div>
            </div>

            {order.shipping && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-700 mb-1">Delivering to:</p>
                <p className="text-sm text-gray-600">{order.shipping.name}, {order.shipping.addressLine}, {order.shipping.city} - {order.shipping.postCode}, {order.shipping.state}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
