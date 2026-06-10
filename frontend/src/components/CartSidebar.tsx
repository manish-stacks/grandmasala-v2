"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Tag,
  ChevronRight,
  Gift,
  Truck,
} from "lucide-react";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  closeCartSidebar,
  updateQuantity,
  removeItem,
  clearCoupon,
  applyPromoCode,
} from "@/store/slices/cartSlice";

const API = process.env.NEXT_PUBLIC_API_URL;

interface CartSidebarProps {
  onCheckout: () => void;
}

export default function CartSidebar({ onCheckout }: CartSidebarProps) {
  const dispatch = useAppDispatch();
  const {
    cartItems,
    sidebarOpen,
    promoApplied,
    discountAmount,
    promoCode,
    couponError,
    loading,
  } = useAppSelector((s) => s.cart);
  const [couponInput, setCouponInput] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  // ── Dynamic shipping from admin settings ────────────────────
  const [freeThreshold, setFreeThreshold] = useState(299);
  const [shippingCost, setShippingCost] = useState(0);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    fetch(`${API}/settings`)
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.data?.freeShippingThreshold === "number")
          setFreeThreshold(d.data.freeShippingThreshold);
        if (typeof d.data?.shippingCost === "number")
          setShippingCost(d.data.shippingCost);
      })
      .catch(() => {})
      .finally(() => setSettingsLoaded(true));
  }, []);

  // ── Computed totals ─────────────────────────────────────────
  const subtotal = cartItems.reduce(
    (t, i) => t + Number(i.price) * Number(i.quantity),
    0,
  );
  const shipping = subtotal >= freeThreshold ? 0 : shippingCost;
  const discount = promoApplied ? discountAmount : 0;
  const total = subtotal + shipping - discount;

  // Free delivery progress
  const amountForFree = Math.max(0, freeThreshold - subtotal);
  const progressPct = Math.min(100, (subtotal / freeThreshold) * 100);

  // Lock body scroll when open
  useEffect(() => {
    if (sidebarOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    dispatch(
      applyPromoCode({
        code: couponInput.trim().toUpperCase(),
        orderAmount: subtotal,
      }),
    );
  };

  const handleCheckout = () => {
    document.body.style.overflow = ""; // ✅ add karo
    dispatch(closeCartSidebar());
    onCheckout();
  };

  if (!sidebarOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={() => {
          document.body.style.overflow = ""; // ✅ add karo
          dispatch(closeCartSidebar());
        }}
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-gray-700" />
            <h2 className="font-bold text-gray-900 text-lg">My Cart</h2>
            <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
              {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
            </span>
          </div>
          <button
            onClick={() => {
              document.body.style.overflow = ""; // ✅ add karo
              dispatch(closeCartSidebar());
            }}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free shipping progress bar */}
        {settingsLoaded &&
          (amountForFree > 0 ? (
            <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
              <div className="flex items-center gap-2 mb-1.5">
                <Truck size={13} className="text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700 font-medium">
                  Add{" "}
                  <span className="font-bold">₹{amountForFree.toFixed(0)}</span>{" "}
                  more for <span className="font-bold">FREE delivery 🚚</span>
                </p>
              </div>
              <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="px-5 py-2.5 bg-green-50 border-b border-green-100">
              <p className="text-xs text-green-700 font-semibold flex items-center gap-1.5">
                🚚 You've unlocked FREE delivery!
              </p>
            </div>
          ))}

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-4 px-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag size={32} className="text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Your cart is empty</p>
              <p className="text-gray-400 text-sm mt-1">
                Add some delicious spices!
              </p>
              <button
                onClick={() => dispatch(closeCartSidebar())}
                className="mt-4 text-[#81190B] font-semibold text-sm hover:underline"
              >
                Continue Shopping →
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.product + (item.variantId || "")}
                className="flex gap-3"
              >
                {/* Image */}
                <div className="relative w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.product_name}
                      fill
                      className="object-contain p-1"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🌶
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                    {item.product_name}
                  </p>
                  {item.size && (
                    <p className="text-xs text-gray-400 mt-0.5">{item.size}</p>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    {/* Qty controls */}
                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-2 py-1">
                      <button
                        onClick={() => {
                          if (item.quantity <= 1) {
                            dispatch(removeItem(item.product));
                          } else {
                            dispatch(
                              updateQuantity({
                                id: item.product,
                                newQuantity: item.quantity - 1,
                              }),
                            );
                          }
                        }}
                        className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        {item.quantity === 1 ? (
                          <Trash2 size={11} className="text-red-400" />
                        ) : (
                          <Minus size={12} />
                        )}
                      </button>
                      <span className="text-sm font-bold text-gray-900 min-w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          dispatch(
                            updateQuantity({
                              id: item.product,
                              newQuantity: item.quantity + 1,
                            }),
                          )
                        }
                        className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Price + Delete */}
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">
                        ₹{(Number(item.price) * item.quantity).toFixed(0)}
                      </span>
                      <button
                        onClick={() => dispatch(removeItem(item.product))}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom section */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-100 px-5 pt-4 pb-5 space-y-4">
            {/* Coupon */}
            {!promoApplied ? (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    value={couponInput}
                    onChange={(e) =>
                      setCouponInput(e.target.value.toUpperCase())
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    placeholder="Enter coupon code"
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#81190B] uppercase"
                  />
                </div>
                <button
                  onClick={handleApplyCoupon}
                  disabled={loading || !couponInput.trim()}
                  className="px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "..." : "Apply"}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                <span className="text-green-700 text-sm font-semibold">
                  🎉 {promoCode} — ₹{discountAmount.toFixed(0)} off
                </span>
                <button
                  onClick={() => {
                    dispatch(clearCoupon());
                    setCouponInput("");
                  }}
                  className="text-red-400 hover:text-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            {couponError && (
              <p className="text-red-500 text-xs -mt-2">{couponError}</p>
            )}

            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span
                  className={
                    shipping === 0 ? "text-green-600 font-semibold" : ""
                  }
                >
                  {!settingsLoaded
                    ? "..."
                    : shipping === 0
                      ? "Free"
                      : `₹${shipping}`}
                </span>
              </div>
              {promoApplied && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{discountAmount.toFixed(0)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
              <span>Total</span>
              <span className="text-[#81190B]">₹{total.toFixed(0)}</span>
            </div>

            {/* CTA */}
            <button
              onClick={handleCheckout}
              className="w-full bg-gradient-to-r from-[#81190B] to-[#a02010] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-red-900/20"
            >
              Proceed to Checkout
              <ChevronRight size={18} />
            </button>

            {/* Trust badges */}
            <div className="flex justify-center gap-6 pt-1">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_Pay_Logo_%282020%29.svg/120px-Google_Pay_Logo_%282020%29.svg.png"
                alt="GPay"
                className="h-5 opacity-50 grayscale"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/en/thumb/2/22/PhonePe_Logo.svg/120px-PhonePe_Logo.svg.png"
                alt="PhonePe"
                className="h-5 opacity-50 grayscale"
              />
              <span className="text-xs text-gray-400 self-center">+ more</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
