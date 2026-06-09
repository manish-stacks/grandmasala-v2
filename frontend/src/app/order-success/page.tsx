'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { CheckCircle, Package, Truck, Phone, Mail, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function fmt(n: any) { try { return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR' }).format(n); } catch { return '₹'+(n??0); } }

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get('id');
  const type = searchParams.get('type');

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    const token = sessionStorage.getItem('token_login');
    const endpoint = type === 'cod' ? `/my-recent-cod-order/${orderId}` : `/my-recent-order/${orderId}`;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json()).then(d => setOrder(d.order || d.data))
      .catch(() => {}).finally(() => setLoading(false));
  }, [orderId, type]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#81190B]"/></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
          <CheckCircle className="w-12 h-12 text-white"/>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Order Placed! 🎉</h1>
        <p className="text-gray-600 text-lg mb-6">Thank you for shopping with Grand Masala</p>

        {order && (
          <div className="bg-gray-50 rounded-2xl p-6 mb-6 text-left">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><p className="text-xs text-gray-500">Order ID</p><p className="font-bold text-gray-900">{order.orderId}</p></div>
              <div><p className="text-xs text-gray-500">Payment</p><p className="font-bold text-gray-900">{order.paymentType}</p></div>
              <div><p className="text-xs text-gray-500">Total</p><p className="font-bold text-[#81190B]">{fmt(order.payAmt)}</p></div>
              <div><p className="text-xs text-gray-500">Status</p><span className="inline-block bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full text-sm">{order.status}</span></div>
            </div>
            {order.shipping && (
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-1 flex items-center"><Truck size={14} className="mr-1 text-[#81190B]"/>Delivering to:</p>
                <p className="text-sm text-gray-600">{order.shipping.name}, {order.shipping.addressLine}, {order.shipping.city} - {order.shipping.postCode}, {order.shipping.state}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link href="/profile" className="flex items-center justify-center gap-2 bg-[#81190B] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#5a1008] transition-colors">
            <Package size={18}/> Track Order
          </Link>
          <Link href="/shop" className="flex items-center justify-center gap-2 bg-gray-100 text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
            <ShoppingBag size={18}/> Continue Shopping
          </Link>
        </div>

        <div className="text-sm text-gray-500">
          <p>Questions? Contact us at <a href="tel:+919355577789" className="text-[#81190B] font-medium">+91 93555 77789</a></p>
          <p>or <a href="mailto:info@grandmasala.in" className="text-[#81190B] font-medium">info@grandmasala.in</a></p>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#81190B]"/>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}