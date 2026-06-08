'use client';
import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateQuantity, removeItem, clearCoupon, applyPromoCode } from '@/store/slices/cartSlice';

export default function CartPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { cartItems, promoCode, promoApplied, discountAmount, couponError, loading } = useAppSelector(s => s.cart);
  const [couponInput, setCouponInput] = useState('');

  const subtotal = cartItems.reduce((t, i) => t + Number(i.price) * Number(i.quantity), 0);
  const shipping = subtotal >= 299 ? 0 : 80;
  const total = promoApplied ? subtotal - discountAmount + shipping : subtotal + shipping;

  const handleCheckout = () => {
    if (cartItems.length === 0) { toast.error('Your cart is empty'); return; }
    router.push('/checkout');
  };

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    dispatch(applyPromoCode({ code: couponInput.trim(), orderAmount: subtotal }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/shop" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft size={20} className="mr-2" /> Continue Shopping
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
            <div className="flex items-center gap-2 text-gray-600"><ShoppingBag size={20}/><span className="font-medium">{cartItems.length} Items</span></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cartItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center"><ShoppingBag size={40} className="text-gray-400"/></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Add some delicious spices to your cart!</p>
            <Link href="/shop" className="bg-[#81190B] text-white px-8 py-3 rounded-xl font-medium hover:bg-[#5a1008] transition-colors">Start Shopping</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-semibold">Cart Items ({cartItems.length})</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {cartItems.map(item => (
                    <div key={item.product + (item.variantId || '')} className="p-6 flex items-start gap-4">
                      <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-[#F4F1EA]">
                        {item.image ? <Image src={item.image} alt={item.product_name} fill className="object-contain p-1" sizes="96px" /> : <div className="w-full h-full flex items-center justify-center text-3xl">🌶</div>}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.product_name}</h3>
                        {item.size && <p className="text-sm text-gray-500">Size: {item.size}</p>}
                        <p className="text-[#81190B] font-bold mt-1">₹{Number(item.price).toFixed(0)}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <button onClick={() => dispatch(updateQuantity({ id: item.product, newQuantity: item.quantity - 1 }))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"><Minus size={14}/></button>
                          <span className="font-semibold w-6 text-center">{item.quantity}</span>
                          <button onClick={() => dispatch(updateQuantity({ id: item.product, newQuantity: item.quantity + 1 }))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"><Plus size={14}/></button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">₹{(Number(item.price) * item.quantity).toFixed(0)}</p>
                        <button onClick={() => dispatch(removeItem(item.product))} className="mt-2 text-red-500 hover:text-red-700 transition-colors"><Trash2 size={18}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coupon */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold mb-4">Apply Coupon Code</h3>
                {promoApplied ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
                    <span className="text-green-700 font-semibold">🎉 Coupon applied! You save ₹{discountAmount.toFixed(0)}</span>
                    <button onClick={() => dispatch(clearCoupon())} className="text-red-500 hover:text-red-700"><X size={18}/></button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <input value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code" className="flex-1 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-[#81190B] uppercase" />
                    <button onClick={handleApplyCoupon} disabled={loading} className="bg-[#81190B] text-white px-6 py-2 rounded-xl hover:bg-[#5a1008] transition-colors disabled:opacity-50">
                      {loading ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                )}
                {couponError && <p className="text-red-500 text-sm mt-2">{couponError}</p>}
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Shipping</span><span className={shipping===0 ? 'text-green-600 font-semibold' : ''}>{shipping===0 ? 'FREE' : `₹${shipping}`}</span></div>
                  {promoApplied && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{discountAmount.toFixed(0)}</span></div>}
                  {subtotal < 299 && <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">Add ₹{(299 - subtotal).toFixed(0)} more for FREE delivery!</p>}
                </div>
                <div className="border-t pt-4 mb-6 flex justify-between text-xl font-bold">
                  <span>Total</span><span className="text-[#81190B]">₹{total.toFixed(0)}</span>
                </div>
                <button onClick={handleCheckout} className="w-full bg-[#81190B] hover:bg-[#5a1008] text-white font-semibold py-4 rounded-xl transition-colors text-lg">
                  Proceed to Checkout →
                </button>
                <div className="mt-4 text-center text-xs text-gray-400">🔒 Secure Checkout · Razorpay · COD Available</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
