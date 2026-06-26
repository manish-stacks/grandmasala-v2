'use client';
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Package, MapPin, User, CreditCard, RefreshCw,
  Calendar, Star, Tag, Percent, AlertTriangle, RotateCcw,
  Printer, Download,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { use } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;

/* ================= STATUS CONFIG ================= */
const ORDER_STATUSES = ['pending', 'confirmed', 'progress', 'shipped', 'delivered', 'cancelled', 'returned'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  progress: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  returned: 'bg-gray-100 text-gray-700',
};

/* ================= HELPERS ================= */
const formatDate = (d: string) =>
  new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

/* ================= COMPONENT ================= */
export default function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showShiprocketForm, setShowShiprocketForm] = useState(false);
  const [shiprocketData, setShiprocketData] = useState({
    length: 10, breadth: 10, height: 5, weight: 0.5,
  });

  /* ---------- fetch ---------- */
  const fetchOrder = async () => {
    const token = sessionStorage.getItem('admin_token');
    try {
      setLoading(true);
      const res = await fetch(`${API}/recent-order/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOrder(data.order || data.data || null);
    } catch {
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  /* ---------- status change ---------- */
  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === order.status) return;

    // Shiprocket special case
    if (newStatus === 'shipped') {
      setShowShiprocketForm(true);
      return;
    }

    setUpdating(true);
    const token = sessionStorage.getItem('admin_token');
    try {
      const res = await fetch(`${API}/admin/change-order-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: order._id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success(`✅ Status updated to "${newStatus}"`);
        fetchOrder();
      } else {
        toast.error(data.message || 'Failed to update');
      }
    } catch { toast.error('Error updating status'); }
    finally { setUpdating(false); }
  };

  /* ---------- shiprocket submit ---------- */
  const handleCreateShiprocket = async () => {
    for (const key in shiprocketData) {
      if (!shiprocketData[key as keyof typeof shiprocketData] || shiprocketData[key as keyof typeof shiprocketData] <= 0) {
        toast.error(`Please enter valid ${key}`);
        return;
      }
    }

    setUpdating(true);
    const token = sessionStorage.getItem('admin_token');
    try {
      const res = await fetch(`${API}/admin/change-order-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          orderId: order._id,
          status: 'shipped',
          dimensions: shiprocketData,
        }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success('✅ Order shipped & Shiprocket shipment created');
        setShowShiprocketForm(false);
        fetchOrder();
      } else {
        throw new Error(data.message || 'Shiprocket failed');
      }
    } catch (err: any) {
      toast.error(`❌ ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  /* ---------- refund ---------- */
  const handleInitiateRefund = async () => {
    const token = sessionStorage.getItem('admin_token');
    try {
      const res = await fetch(`${API}/refund-request-order/${order._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) toast.success('Refund initiated');
      else toast.error(data.message);
    } catch { toast.error('Failed to initiate refund'); }
  };

  /* ---------- invoice HTML builder ---------- */
  const buildInvoiceHTML = (o: any) => {
    const hasOfferLocal = o.offerId && Object.keys(o.offerId).length > 0;
    const finalTotal = (o.payAmt - (o.paymentType === 'COD' ? (o.codFeeAmount || 0) : 0)).toFixed(2);

    return `<!DOCTYPE html>
<html>
<head>
  <title>Invoice - ${o.orderId}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; margin: 0; background: #f4f6f8; color: #111; }
    .invoice { max-width: 820px; margin: 20px auto; background: #fff; padding: 28px; border-radius: 10px; }
    .top { display: flex; justify-content: space-between; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; }
    .brand h1 { margin: 0; color: #81190B; font-size: 26px; }
    .brand p { margin: 4px 0 0; color: #666; font-size: 13px; }
    .invoice-meta { text-align: right; font-size: 14px; line-height: 1.8; }
    .section { margin-top: 22px; }
    .section h3 { font-size: 15px; margin-bottom: 8px; color: #81190B; border-bottom: 1px solid #f3e8e8; padding-bottom: 4px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 14px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .success { background: #dcfce7; color: #166534; }
    .danger { background: #fee2e2; color: #991b1b; }
    .offer { background: #e0f2fe; color: #075985; }
    .orderStatus { text-transform: capitalize; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
    th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
    th { background: #fdf2f2; font-weight: 600; color: #81190B; }
    .summary { width: 300px; margin-left: auto; margin-top: 20px; font-size: 14px; }
    .summary div { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .summary .final { font-size: 18px; font-weight: 700; border-top: 2px solid #e5e7eb; padding-top: 8px; color: #81190B; }
    .footer { margin-top: 30px; border-top: 1px dashed #e5e7eb; padding-top: 12px; font-size: 12px; color: #555; text-align: center; }
    @media print { body { background: #fff; } .invoice { box-shadow: none; margin: 0; border-radius: 0; } }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="top">
      <div class="brand">
        <h1>INVOICE</h1>
        <p>E-Commerce Invoice</p>
      </div>
      <div class="invoice-meta">
        <div><strong>Order ID:</strong> #${o.orderId}</div>
        <div><strong>Date:</strong> ${new Date(o.orderDate || o.createdAt).toLocaleString('en-IN')}</div>
        <div><strong>Payment:</strong> ${o.paymentType}</div>
        <div><span class="badge success orderStatus">${o.status}</span></div>
      </div>
    </div>

    <div class="section">
      <h3>Customer & Shipping Details</h3>
      <div class="grid">
        <div><strong>Name:</strong> ${o.shipping?.name || o.userId?.Name || 'N/A'}</div>
        <div><strong>Mobile:</strong> ${o.shipping?.mobileNumber || o.userId?.ContactNumber || 'N/A'}</div>
        <div><strong>Email:</strong> ${o.userId?.Email || 'N/A'}</div>
        <div><strong>Address Type:</strong> ${o.shipping?.addressType || 'N/A'}</div>
        <div style="grid-column: span 2;">
          <strong>Address:</strong>
          ${o.shipping?.addressLine || ''}, ${o.shipping?.city || ''},
          ${o.shipping?.state || ''} - ${o.shipping?.postCode || ''}
        </div>
      </div>
    </div>

    ${hasOfferLocal ? `
    <div class="section">
      <h3>Offer Applied</h3>
      <span class="badge offer">${o.offerId.code} — ${o.offerId.discount}% OFF</span>
      &nbsp; <span style="font-size:13px; color:#555;">Min. Order: ₹${o.offerId.minimumOrderAmount}</span>
    </div>` : ''}

    ${o.refundRequest ? `
    <div class="section">
      <h3>Refund Request</h3>
      <span class="badge danger">Requested</span>
      ${o.refundReason ? `<p style="margin:8px 0 0; font-size:13px;"><strong>Reason:</strong> ${o.refundReason}</p>` : ''}
    </div>` : ''}

    <div class="section">
      <h3>Order Items</h3>
      <table>
        <thead>
          <tr>
            <th>#</th><th>Product</th><th>Size</th><th>Qty</th><th>Price</th><th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${(o.items || []).map((item: any, idx: number) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${item.name || item.product_name}</td>
              <td>${item.size || item.Varient_id || '-'}</td>
              <td>${item.quantity || item.Qunatity}</td>
              <td>₹${parseFloat(item.price || item.price_after_discount).toFixed(2)}</td>
              <td>₹${((item.price || item.price_after_discount) * (item.quantity || item.Qunatity)).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="summary">
      <div><span>Subtotal</span><span>₹${(o.totalAmount || 0).toFixed(2)}</span></div>
      <div><span>Delivery Fee</span><span>${o.shippingAmount > 0 ? `₹${parseFloat(o.shippingAmount).toFixed(2)}` : 'Free'}</span></div>
      ${o.paymentType === 'COD' ? `<div><span>COD Fee (Advance)</span><span>-₹${(o.codFeeAmount || 0).toFixed(2)}</span></div>` : ''}
      ${hasOfferLocal ? `<div style="color:#16a34a;"><span>Discount (${o.offerId.discount}%)</span><span>-₹${(o.totalAmount - o.payAmt).toFixed(2)}</span></div>` : ''}
      <div class="final"><span>Total Paid</span><span>₹${finalTotal}</span></div>
    </div>

    <div class="footer">
      <p>Thank you for shopping with us ❤️</p>
      <p>This is a system generated invoice.</p>
    </div>
  </div>
  <script>
    window.onload = function () {
      setTimeout(() => {
        window.print();
        window.onafterprint = () => window.close();
      }, 500);
    };
  </script>
</body>
</html>`;
  };

  /* ---------- Print invoice ---------- */
  const handlePrintOrder = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=650');
    if (!printWindow) return toast.error('Popup blocked! Please allow popups.');
    printWindow.document.open();
    printWindow.document.write(buildInvoiceHTML(order));
    printWindow.document.close();
  };

  /* ---------- Download PDF ---------- */
  const handleDownloadPDF = () => {
    const html = buildInvoiceHTML(order);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${order.orderId}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Invoice downloaded! Open in browser and press Ctrl+P → Save as PDF');
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

  const hasOffer = order.offerId && Object.keys(order.offerId).length > 0;
  const savedAmount = hasOffer ? (order.totalAmount - order.payAmt).toFixed(2) : 0;

  /* ================= RENDER ================= */
  return (
    <div className="container mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft size={16} /> Orders
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderId}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <Calendar size={13} />
              {formatDate(order.orderDate || order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Invoice Buttons */}
          <button
            onClick={handlePrintOrder}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            <Printer size={15} /> Print Invoice
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-[#81190B] hover:bg-[#6b1409] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            <Download size={15} /> Download Invoice
          </button>
          {/* Inline status dropdown (same as ViewOrder) */}
          <select
            value={order.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updating}
            className="border border-gray-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#81190B]"
          >
            {ORDER_STATUSES.map(s => (
              <option key={s} value={s}>{s.toUpperCase()}</option>
            ))}
          </select>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
            {order.status}
          </span>
        </div>
      </div>

      {/* ── Shiprocket Form (conditional) ── */}
      {showShiprocketForm && (
        <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-blue-700 mb-4">🚚 Shiprocket Package Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['length', 'breadth', 'height', 'weight'] as const).map(field => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-600 mb-1 capitalize">{field}</label>
                <input
                  type="number"
                  step={field === 'weight' ? '0.1' : '1'}
                  value={shiprocketData[field]}
                  onChange={e => setShiprocketData(prev => ({ ...prev, [field]: parseFloat(e.target.value) }))}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCreateShiprocket}
              disabled={updating}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {updating ? 'Creating…' : 'Create Shipment'}
            </button>
            <button
              onClick={() => setShowShiprocketForm(false)}
              className="border border-gray-300 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Refund Request Banner (conditional) ── */}
      {order.refundRequest && (
        <div className="bg-white border border-orange-200 rounded-2xl p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-orange-800 mb-4">
            <RotateCcw size={18} className="text-orange-600" /> Refund Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 flex items-center justify-between">
              <div>
                <p className="text-gray-700 font-medium text-sm mb-1">Refund Status</p>
                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-semibold">
                  Pending Review
                </span>
              </div>
              <AlertTriangle size={20} className="text-orange-500" />
            </div>
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 flex items-center justify-between">
              <div>
                <p className="text-gray-700 font-medium text-sm mb-1">Refund Amount</p>
                <p className="text-orange-700 font-bold text-lg">₹{order.payAmt}</p>
              </div>
              <CreditCard size={20} className="text-orange-500" />
            </div>
          </div>
          {order.refundReason && (
            <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
              <p className="font-medium text-orange-800 text-sm mb-1">Refund Reason:</p>
              <p className="text-orange-700 text-sm bg-white p-3 rounded-lg border border-orange-200">{order.refundReason}</p>
            </div>
          )}
          <p className="mt-3 text-xs text-orange-600 bg-orange-50 px-4 py-3 rounded-xl border border-orange-200">
            <strong>Note:</strong> Refund requests are typically processed within 3–5 business days.
            The customer will receive an email once processed.
          </p>
        </div>
      )}

      {/* ── Offer Banner (conditional) ── */}
      {hasOffer && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-2xl p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-green-800 mb-4">
            <Tag size={18} className="text-green-600" /> Offer Applied
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Offer Code', value: order.offerId.code, icon: <Tag size={15} className="text-green-600" /> },
              { label: 'Discount', value: `${order.offerId.discount}% OFF`, icon: <Percent size={15} className="text-green-600" /> },
              { label: 'Min. Amount', value: `₹${order.offerId.minimumOrderAmount}`, icon: <CreditCard size={15} className="text-green-600" /> },
              { label: 'You Saved', value: `₹${savedAmount}`, icon: <Star size={15} className="text-green-600" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-white p-4 rounded-xl border border-green-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-600 text-xs font-medium">{label}</span>
                  {icon}
                </div>
                <p className="text-green-700 font-bold text-base">{value}</p>
              </div>
            ))}
          </div>
          {order.offerId.expirationDate && (
            <p className="mt-3 text-green-700 text-xs bg-green-100 px-4 py-2 rounded-xl">
              <strong>Valid Until:</strong> {new Date(order.offerId.expirationDate).toLocaleDateString('en-IN')}
            </p>
          )}
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Items + Status buttons */}
        <div className="lg:col-span-2 space-y-6">

          {/* Order Items */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package size={18} className="text-[#81190B]" /> Ordered Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left rounded-l-lg">Product</th>
                    <th className="px-4 py-3 text-left">Variant</th>
                    <th className="px-4 py-3 text-left">Price</th>
                    <th className="px-4 py-3 text-left">Qty</th>
                    <th className="px-4 py-3 text-left rounded-r-lg">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(order.items || []).map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <a
                          href={`/admin/products/edit/${item.productId}?type=View-Product`}
                          className="text-[#81190B] underline font-medium hover:opacity-80"
                        >
                          {item.name || item.product_name}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-gray-600">Size: {item.size || item.Varient_id || '-'}</td>
                      <td className="px-4 py-3 text-gray-700">₹{item.price || item.price_after_discount}</td>
                      <td className="px-4 py-3 text-gray-700">{item.quantity || item.Qunatity}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        ₹{((item.price || item.price_after_discount) * (item.quantity || item.Qunatity)).toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Price Summary */}
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-end">
                <div className="w-72 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>₹{order.totalAmount?.toFixed(0) || '—'}</span>
                  </div>
                  {hasOffer && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({order.offerId.discount}%)</span>
                      <span>-₹{savedAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-500">
                    <span>Delivery Fee</span>
                    <span>{order.shippingAmount > 0 ? `₹${order.shippingAmount}` : 'Free'}</span>
                  </div>
                  {order.paymentType === 'COD' && (
                    <div className="flex justify-between text-gray-500">
                      <span>COD Advance</span>
                      <span>-₹{order.codFeeAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base border-t pt-3">
                    <span>Total</span>
                    <span className="text-[#81190B]">
                      ₹{(order.payAmt - (order.paymentType === 'COD' ? (order.codFeeAmount || 0) : 0)).toFixed(0)}
                    </span>
                  </div>
                  {hasOffer && (
                    <div className="bg-green-50 p-3 rounded-xl text-center text-green-700 text-xs border border-green-200">
                      🎉 Saved ₹{savedAmount} with code {order.offerId.code}!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status Buttons */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <RefreshCw size={18} className="text-[#81190B]" /> Update Order Status
            </h2>
            <div className="flex flex-wrap gap-2">
              {ORDER_STATUSES.map(s => (
                <button
                  key={s}
                  disabled={updating || order.status === s}
                  onClick={() => handleStatusChange(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors
                    ${order.status === s
                      ? (STATUS_COLORS[s] || 'bg-gray-100 text-gray-600') + ' ring-2 ring-offset-1 ring-current'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50'
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {/* Initiate Refund — show when cancelled */}
            {order.status === 'cancelled' && (
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={handleInitiateRefund}
                  className="text-sm bg-red-50 text-red-600 px-4 py-2 rounded-xl hover:bg-red-100 transition-colors font-semibold"
                >
                  Initiate Refund
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">

          {/* Customer Info */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <User size={16} className="text-[#81190B]" /> Customer
            </h3>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-gray-900">{order.shipping?.name || order.userId?.Name || 'Guest'}</p>
              {order.userId?.Email && <p className="text-gray-500">{order.userId.Email}</p>}
              {(order.userId?.ContactNumber || order.shipping?.mobileNumber) && (
                <p className="text-gray-500">📞 {order.userId?.ContactNumber || order.shipping?.mobileNumber}</p>
              )}
              {order.OrderProcessRating > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold text-gray-700">{order.OrderProcessRating}/5</span>
                  <span className="text-gray-400 text-xs">rating</span>
                </div>
              )}
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
                {order.shipping.mobileNumber && <p className="mt-1">📞 {order.shipping.mobileNumber}</p>}
                {order.shipping.email && <p>✉️ {order.shipping.email}</p>}
                {order.shipping.addressType && (
                  <span className="inline-block mt-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                    {order.shipping.addressType}
                  </span>
                )}
              </div>
            ) : <p className="text-sm text-gray-400">No address on record</p>}
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <CreditCard size={16} className="text-[#81190B]" /> Payment
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Method</span>
                <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${order.paymentType === 'ONLINE' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                  {order.paymentType}
                </span>
              </div>

              {order.paymentType === 'ONLINE' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-semibold">Paid</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-bold text-[#81190B]">₹{order.payAmt?.toFixed(0)}</span>
                  </div>
                  {(order.transactionId || order.razorpayOrderId) && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Transaction ID</span>
                      <span className="font-mono text-xs truncate max-w-28 text-gray-700">
                        {order.transactionId || order.razorpayOrderId}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-semibold">Unpaid (COD)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-bold text-[#81190B]">₹{order.payAmt?.toFixed(0)}</span>
                  </div>
                  {order.codFeeAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">COD Fee</span>
                      <span>₹{order.codFeeAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">COD Fee Status</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${order.codFeePaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {order.codFeePaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                  {order.codFeePaymentId && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">COD Txn ID</span>
                      <span className="font-mono text-xs truncate max-w-28 text-gray-700">{order.codFeePaymentId}</span>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-500">Order Date</span>
                <span className="text-xs text-gray-700">
                  {new Date(order.orderDate || order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}