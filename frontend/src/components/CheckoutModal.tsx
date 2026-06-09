"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  X,
  MapPin,
  CreditCard,
  CheckCircle,
  Loader2,
  Plus,
  Truck,
  Mail,
  Phone,
  ArrowRight,
  RefreshCw,
  ChevronLeft,
  Tag,
  ShoppingBag,
  AlertCircle,
  User,
} from "lucide-react";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearCart,
  applyPromoCode,
  clearCoupon,
} from "@/store/slices/cartSlice";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;

// ─── Load Razorpay script dynamically ───────────────────────────
function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (typeof (window as any).Razorpay !== "undefined") {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.head.appendChild(script);
  });
}

// ─── Steps ───────────────────────────────────────────────────────
// 'auth'     → login via OTP (skip if already logged in)
// 'address'  → show saved addr or add new
// 'review'   → order summary + payment method + place order

type Step = "auth" | "address" | "review";
// type AuthMode = "identifier" | "otp";

interface CheckoutModalProps {
  onClose: () => void;
}

// ─── OTP Box Component ───────────────────────────────────────────
function OtpBoxes({
  otp,
  onChange,
  onKeyDown,
  refs,
  onPaste,
}: {
  otp: string[];
  onChange: (i: number, val: string) => void;
  onKeyDown: (i: number, e: React.KeyboardEvent) => void;
  refs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onPaste: (e: React.ClipboardEvent) => void;
}) {
  return (
    <div className="flex gap-2 justify-center" onPaste={onPaste}>
      {otp.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => onChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          className={`w-11 h-12 text-center text-lg font-bold border-2 rounded-xl focus:outline-none transition-all
            ${d ? "border-[#81190B] bg-red-50 text-[#81190B]" : "border-gray-200 focus:border-[#81190B] text-gray-900"}`}
        />
      ))}
    </div>
  );
}

// ─── Step indicator ──────────────────────────────────────────────
function StepDots({ step }: { step: Step }) {
  const steps: Step[] = ["auth", "address", "review"];
  const labels = ["Login", "Address", "Confirm"];
  const idx = steps.indexOf(step);
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div
            className={`flex items-center gap-1.5 ${i <= idx ? "opacity-100" : "opacity-30"}`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all
              ${i < idx ? "bg-green-500 text-white" : i === idx ? "bg-[#81190B] text-white" : "bg-gray-200 text-gray-500"}`}
            >
              {i < idx ? "✓" : i + 1}
            </div>
            <span
              className={`text-xs font-medium hidden sm:block ${i === idx ? "text-[#81190B]" : "text-gray-400"}`}
            >
              {labels[i]}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-1 rounded ${i < idx ? "bg-green-500" : "bg-gray-200"}`}
              style={{ minWidth: 16 }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────
export default function CheckoutModal({ onClose }: CheckoutModalProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { cartItems, promoApplied, discountAmount, promoCode } = useAppSelector(
    (s) => s.cart,
  );

  // ── Settings (dynamic shipping from admin) ────────────────────
  const [freeThreshold, setFreeThreshold] = useState(299);
  const [shippingCost, setShippingCost] = useState(0);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // ── Step ──────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("auth");
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);

  // ── Auth ──────────────────────────────────────────────────────
  // const [authMode, setAuthMode] = useState<AuthMode>("identifier");
  // const [identifier, setIdentifier] = useState("");
  // const [resolvedEmail, setResolvedEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  // const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  // const [resendTimer, setResendTimer] = useState(0);
  // const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  // ── User ──────────────────────────────────────────────────────
  const [token, setToken] = useState("");
  const [user, setUser] = useState<any>(null);

  // ── Address ───────────────────────────────────────────────────
  const [savedAddr, setSavedAddr] = useState<any>(null);
  const [selectedAddr, setSelectedAddr] = useState<any>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [addrForm, setAddrForm] = useState({
    name: "",
    addressLine: "",
    city: "",
    state: "",
    postCode: "",
    addressType: "Home",
    email: "",
  });

  // ── Payment ───────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "COD" | "">(
    "ONLINE",
  );

  // ── Coupon ────────────────────────────────────────────────────
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  // ── Computed totals ───────────────────────────────────────────
  const subtotal = cartItems.reduce((t, i) => t + i.price * i.quantity, 0);
  const shipFee = subtotal >= freeThreshold ? 0 : shippingCost;
  const discount = promoApplied ? discountAmount : 0;
  const total = subtotal + shipFee - discount;

  // ─────────────────────────────────────────────────────────────
  // Init: load settings + check login
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = "hidden";

    // Fetch shipping settings from admin
    fetch(`${API}/settings`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.freeShippingThreshold)
          setFreeThreshold(d.data.freeShippingThreshold);
        if (d.data?.shippingCost) setShippingCost(d.data.shippingCost);
      })
      .catch(() => {})
      .finally(() => setSettingsLoaded(true));

    // Check if user already logged in
    const t = sessionStorage.getItem("token_login");
    if (!t) return;
    setToken(t);

    fetch(`${API}/my-details`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => {
        if (!d.data) return;
        const u = d.data;
        setUser(u);
        setStep("address"); // skip auth
        setAlreadyLoggedIn(true);
        // Load last order address
        fetch(`${API}/my-last-order`, {
          headers: { Authorization: `Bearer ${t}` },
        })
          .then((r) => r.json())
          .then((od) => {
            if (od.order?.shipping) {
              const s = od.order.shipping;
              const addr = {
                name: s.name,
                addressLine: s.addressLine,
                city: s.city,
                state: s.state,
                postCode: s.postCode,
                addressType: s.addressType || "Home",
                mobile: s.mobileNumber || String(u.ContactNumber || ""),
              };
              setSavedAddr(addr);
              setSelectedAddr(addr);
            }
          })
          .catch(() => {});
      })
      .catch(() => {});

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Resend timer countdown
  // useEffect(() => {
  //   if (resendTimer <= 0) return;
  //   const t = setTimeout(() => setResendTimer((p) => p - 1), 1000);
  //   return () => clearTimeout(t);
  // }, [resendTimer]);

  // ─────────────────────────────────────────────────────────────
  // AUTH handlers
  // ─────────────────────────────────────────────────────────────
  const handlePhoneLogin = async () => {
    const val = phoneNumber.trim();
    if (!/^[0-9]{10}$/.test(val)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }

    setAuthLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/create_user_from_cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ContactNumber: val }),
      });
      const data = await res.json();
      if (!data.success && !data.token) {
        setError(data.message || "Something went wrong");
        return;
      }
      sessionStorage.setItem("token_login", data.token);
      setToken(data.token);
      setUser(data.login || {});
      setStep("address");
      setError("");
    } catch {
      setError("Could not connect to server");
    } finally {
      setAuthLoading(false);
    }
  };

  // const handleOtpChange = (i: number, val: string) => {
  //   if (!/^\d*$/.test(val)) return;
  //   const next = [...otp];
  //   next[i] = val.slice(-1);
  //   setOtp(next);
  //   if (val && i < 5) otpRefs.current[i + 1]?.focus();
  // };
  // const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
  //   if (e.key === "Backspace" && !otp[i] && i > 0)
  //     otpRefs.current[i - 1]?.focus();
  // };
  // const handleOtpPaste = (e: React.ClipboardEvent) => {
  //   const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
  //   if (t.length === 6) {
  //     setOtp(t.split(""));
  //     otpRefs.current[5]?.focus();
  //   }
  // };

  // const handleVerifyOtp = async () => {
  //   const code = otp.join("");
  //   if (code.length < 6) {
  //     setError("Enter the complete 6-digit OTP");
  //     return;
  //   }
  //   setAuthLoading(true);
  //   setError("");
  //   try {
  //     const res = await fetch(`${API}/verify-login-otp`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ email: resolvedEmail, otp: code }),
  //     });
  //     const data = await res.json();
  //     if (!data.success && !data.token) {
  //       setError(data.message || "Invalid OTP");
  //       return;
  //     }
  //     const t = data.token;
  //     sessionStorage.setItem("token_login", t);
  //     setToken(t);
  //     setUser(data.login || {});
  //     setStep("address");
  //     setError("");
  //   } catch {
  //     setError("Server error. Try again.");
  //   } finally {
  //     setAuthLoading(false);
  //   }
  // };

  // const handleResendOtp = async () => {
  //   if (resendTimer > 0) return;
  //   try {
  //     const res = await fetch(`${API}/send-login-otp`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ identifier: resolvedEmail }),
  //     });
  //     const data = await res.json();
  //     if (data.success) {
  //       setResendTimer(60);
  //       setOtp(["", "", "", "", "", ""]);
  //       otpRefs.current[0]?.focus();
  //       toast.success("OTP dobara bhej diya!");
  //     } else {
  //       toast.error(data.message || "Resend failed");
  //     }
  //   } catch {
  //     toast.error("Resend failed");
  //   }
  // };

  // ─────────────────────────────────────────────────────────────
  // ADDRESS handlers
  // ─────────────────────────────────────────────────────────────
  const handleAddrNext = async () => {
    if (addingNew) {
      const f = addrForm;
      if (!f.name || !f.addressLine || !f.city || !f.state || !f.postCode) {
        setError("Please fill all required fields");
        return;
      }
      const newAddr = { ...f, mobile: String(user?.ContactNumber || "") };
      setSavedAddr(newAddr);
      setSelectedAddr(newAddr);
      setAddingNew(false);
    }
    if (!selectedAddr) {
      setError("Please select or add an address");
      return;
    }

    if(!addrForm.email){
      setError("Email is required to proceed");
    }

    // Email save karo agar diya hai
    if (addrForm.email) {
      const t = token || sessionStorage.getItem("token_login");
      await fetch(`${API}/create_user_from_cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify({
          ContactNumber: String(user?.ContactNumber || ""),
          Email: addrForm.email,
        }),
      }).catch(() => {});
    }

    setError("");
    setStep("review");
  };

  // ─────────────────────────────────────────────────────────────
  // COUPON
  // ─────────────────────────────────────────────────────────────
  const handleCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      await dispatch(
        applyPromoCode({
          code: couponInput.trim().toUpperCase(),
          orderAmount: subtotal,
        }),
      ).unwrap();
      toast.success("Coupon applied! 🎉");
    } catch (e: any) {
      toast.error(e || "Invalid coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // PLACE ORDER
  // ─────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!paymentMethod) {
      setError("Select a payment method");
      return;
    }
    if (!selectedAddr) {
      setError("Please select an address");
      return;
    }
    const t = token || sessionStorage.getItem("token_login");
    if (!t) {
      setError("Login required");
      setStep("auth");
      return;
    }

    const addr = selectedAddr;
    const orderData = {
      items: cartItems.map((i) => ({
        product_id: i.product,
        product_name: i.product_name,
        Qunatity: i.quantity,
        price_after_discount: i.price,
        Varient_id: i.variantId || "N/A",
        size: i.size || "N/A",
      })),
      totalAmount: subtotal,
      payAmt: total,
      paymentType: paymentMethod,
      isVarientInCart: cartItems.some((i) => i.variantId),
      offerId: null,
      discountAmount: discount,
      shippingAmount: shipFee,
      couponCode: promoApplied ? promoCode : null,
      shipping: {
        name: addr.name,
        addressLine: addr.addressLine,
        city: addr.city,
        state: addr.state,
        postCode: addr.postCode,
        addressType: addr.addressType,
        mobileNumber: addr.mobile || String(user?.ContactNumber || ""),
        email: user?.Email,
      },
    };

    setPlacing(true);
    setError("");
    try {
      if (paymentMethod === "COD") {
        const res = await fetch(`${API}/create-cod-order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${t}`,
          },
          body: JSON.stringify({ amount: 0, orderData }),
        });
        const data = await res.json();
        if (data.success || data.orderId) {
          dispatch(clearCart());
          onClose();
          router.push(`/order-success?id=${data.orderId}&type=cod`);
        } else {
          setError(data.message || "Order failed");
        }
      } else {
        // ONLINE — Razorpay
        const res = await fetch(`${API}/add-order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${t}`,
          },
          body: JSON.stringify(orderData),
        });
        const data = await res.json();
        if (!data.razorpayOrderId) {
          setError("Could not initiate payment");
          return;
        }

        // Ensure Razorpay SDK is loaded before calling it
        try {
          await loadRazorpay();
        } catch {
          setError("Payment SDK failed to load. Please refresh and try again.");
          return;
        }

        const rzp = new (window as any).Razorpay({
          key: data.rezorPayKey || process.env.NEXT_PUBLIC_RAZORPAY_KEY,
          amount: data.amount * 100,
          currency: "INR",
          name: "Grand Masala",
          description: "Order Payment",
          order_id: data.razorpayOrderId,
          handler: async (resp: any) => {
            try {
              const vRes = await fetch(`${API}/verify-payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(resp),
              });
              const vData = await vRes.json();
              if (vData.success) {
                dispatch(clearCart());
                onClose();
                window.location.href = vData.redirectUrl || "/order-success";
              } else {
                setError("Payment verification failed");
              }
            } catch {
              setError("Payment verification failed. Please contact support.");
            } finally {
              setPlacing(false);
            }
          },
          prefill: {
            name: user?.Name || addr.name,
            email: user?.Email,
            contact: String(user?.ContactNumber || addr.mobile || ""),
          },
          theme: { color: "#81190B" },
          modal: { ondismiss: () => setPlacing(false) },
        });

        rzp.on("payment.failed", (response: any) => {
          setError(
            `Payment failed: ${response.error?.description || "Please try again."}`,
          );
          setPlacing(false);
        });

        rzp.open();
        return; // placing state will be reset by modal dismiss
      }
    } catch {
      setError("Server error. Try again.");
    } finally {
      setPlacing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  const showBackBtn =
    step === "review" || (step === "address" && !alreadyLoggedIn);

  const handleBack = () => {
    setError("");
    if (step === "review") setStep("address");
    else if (step === "address") setStep("auth");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* Modal */}
        <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-xl shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh] overflow-hidden py-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-700 flex-shrink-0 ml-2"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-gray-900 text-sm leading-tight">
                  Checkout
                </h2>
                <div className="mt-1">
                  <StepDots step={step} />
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* Error banner */}
            {error && (
              <div className="mx-4 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-700 text-sm">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span className="flex-1">{error}</span>
                <button onClick={() => setError("")}>
                  <X size={13} />
                </button>
              </div>
            )}

            <div className="p-4 space-y-4">
              {/* ══════════════════════════════════════════════
                  STEP: AUTH
              ══════════════════════════════════════════════ */}
              {step === "auth" && (
                <div className="space-y-4">
                  <div className="text-center pb-1">
                    <p className="text-sm text-gray-500">
                      Enter your mobile number to continue
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone
                        size={14}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) =>
                          setPhoneNumber(
                            e.target.value.replace(/\D/g, "").slice(0, 10),
                          )
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" && handlePhoneLogin()
                        }
                        autoFocus
                        placeholder="9876543210"
                        className="w-full border-2 border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#81190B] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════
                  STEP: ADDRESS
              ══════════════════════════════════════════════ */}
              {step === "address" && (
                <div className="space-y-4">
                  {/* User badge */}
                  {user && (
                    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
                      <div className="w-8 h-8 bg-[#81190B] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {(user.Name || "U")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user.Name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.Email}
                        </p>
                      </div>
                      <CheckCircle
                        size={16}
                        className="text-green-500 flex-shrink-0"
                      />
                    </div>
                  )}

                  {/* Coupon */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Tag size={12} /> Coupon
                    </h3>
                    {!promoApplied ? (
                      <div className="flex gap-2">
                        <input
                          value={couponInput}
                          onChange={(e) =>
                            setCouponInput(e.target.value.toUpperCase())
                          }
                          onKeyDown={(e) => e.key === "Enter" && handleCoupon()}
                          placeholder="Coupon code"
                          className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#81190B] uppercase"
                        />
                        <button
                          onClick={handleCoupon}
                          disabled={couponLoading}
                          className="px-4 bg-gray-900 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
                        >
                          {couponLoading ? "..." : "Apply"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                        <span className="text-green-700 text-sm font-semibold">
                          🎉 {promoCode} — ₹{discount.toFixed(0)} off
                        </span>
                        <button
                          onClick={() => {
                            dispatch(clearCoupon());
                            setCouponInput("");
                          }}
                          className="text-red-400 hover:text-red-600"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Shipping info */}
                  <div
                    className={`flex items-center justify-between p-3 rounded-xl border-2 ${shipFee === 0 ? "border-green-400 bg-green-50/40" : "border-gray-200"}`}
                  >
                    <div className="flex items-center gap-2">
                      <Truck
                        size={15}
                        className={
                          shipFee === 0 ? "text-green-600" : "text-gray-500"
                        }
                      />
                      <span className="text-sm text-gray-700 font-medium">
                        Shipping
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-bold text-sm ${shipFee === 0 ? "text-green-600" : "text-gray-900"}`}
                      >
                        {!settingsLoaded
                          ? "..."
                          : shipFee === 0
                            ? "FREE"
                            : `₹${shipFee}`}
                      </span>
                      {subtotal < freeThreshold && settingsLoaded && (
                        <p className="text-xs text-gray-400">
                          ₹{(freeThreshold - subtotal).toFixed(0)} more for free
                          delivery
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Address section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                        <MapPin size={12} /> Delivery Address
                      </h3>
                      {!addingNew && (
                        <button
                          onClick={() => {
                            setAddingNew(true);
                            setAddrForm({
                              name: user?.Name || "",
                              addressLine: "",
                              city: "",
                              state: "",
                              postCode: "",
                              addressType: "Home",
                              email: addrForm.email,
                            });
                          }}
                          className="flex items-center gap-1 text-[#81190B] text-xs font-semibold"
                        >
                          <Plus size={12} /> New
                        </button>
                      )}
                    </div>

                    {/* Saved address */}
                    {savedAddr && !addingNew && (
                      <button
                        onClick={() => setSelectedAddr(savedAddr)}
                        className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all ${selectedAddr === savedAddr ? "border-[#81190B] bg-red-50/30" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-gray-900 text-sm">
                                {savedAddr.name}
                              </span>
                              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full uppercase">
                                {savedAddr.addressType}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {savedAddr.addressLine}, {savedAddr.city},{" "}
                              {savedAddr.state} — {savedAddr.postCode}
                            </p>
                            {savedAddr.mobile && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                📱 {savedAddr.mobile}
                              </p>
                            )}
                          </div>
                          {selectedAddr === savedAddr && (
                            <CheckCircle
                              size={18}
                              className="text-[#81190B] flex-shrink-0"
                            />
                          )}
                        </div>
                      </button>
                    )}

                    {/* No saved, show form directly */}
                    {!savedAddr && !addingNew && (
                      <div className="text-center py-6 text-gray-400">
                        <MapPin size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-xs mb-3">No saved address found</p>
                        <button
                          onClick={() => setAddingNew(true)}
                          className="text-[#81190B] text-sm font-semibold"
                        >
                          + Add new address
                        </button>
                      </div>
                    )}

                    {/* New address form */}
                    {addingNew && (
                      <div className="space-y-2.5">
                        <input
                          value={addrForm.name}
                          onChange={(e) =>
                            setAddrForm((p) => ({ ...p, name: e.target.value }))
                          }
                          placeholder="Full name *"
                          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#81190B]"
                        />
                        <input
                          value={addrForm.addressLine}
                          onChange={(e) =>
                            setAddrForm((p) => ({
                              ...p,
                              addressLine: e.target.value,
                            }))
                          }
                          placeholder="House no, Street, Area *"
                          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#81190B]"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={addrForm.city}
                            onChange={(e) =>
                              setAddrForm((p) => ({
                                ...p,
                                city: e.target.value,
                              }))
                            }
                            placeholder="City *"
                            className="border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#81190B]"
                          />
                          <input
                            value={addrForm.state}
                            onChange={(e) =>
                              setAddrForm((p) => ({
                                ...p,
                                state: e.target.value,
                              }))
                            }
                            placeholder="State *"
                            className="border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#81190B]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={addrForm.postCode}
                            onChange={(e) =>
                              setAddrForm((p) => ({
                                ...p,
                                postCode: e.target.value,
                              }))
                            }
                            placeholder="PIN Code *"
                            className="border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#81190B]"
                          />
                          <select
                            value={addrForm.addressType}
                            onChange={(e) =>
                              setAddrForm((p) => ({
                                ...p,
                                addressType: e.target.value,
                              }))
                            }
                            className="border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#81190B]"
                          >
                            <option>Home</option>
                            <option>Office</option>
                            <option>Other</option>
                          </select>
                        </div>
                        {savedAddr && (
                          <button
                            onClick={() => setAddingNew(false)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail
                        size={14}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="email"
                        value={addrForm.email || ""}
                        onChange={(e) =>
                          setAddrForm((p) => ({ ...p, email: e.target.value }))
                        }
                        placeholder="yourname@email.com"
                        className="w-full border-2 border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#81190B] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════
                  STEP: REVIEW
              ══════════════════════════════════════════════ */}
              {step === "review" && (
                <div className="space-y-4">
                  {/* Delivery address */}
                  {selectedAddr && (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3.5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <MapPin
                            size={14}
                            className="text-blue-600 flex-shrink-0 mt-0.5"
                          />
                          <div>
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-1">
                              Delivering to
                            </p>
                            <p className="font-semibold text-gray-900 text-sm">
                              {selectedAddr.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {selectedAddr.addressLine}, {selectedAddr.city} —{" "}
                              {selectedAddr.postCode}
                            </p>
                            <p className="text-xs text-gray-400">
                              {selectedAddr.state}, India
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setStep("address");
                            setError("");
                          }}
                          className="text-xs text-blue-600 hover:underline flex-shrink-0"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Payment method */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <CreditCard size={12} /> Payment Method
                    </h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        {
                          id: "ONLINE" as const,
                          icon: "💳",
                          title: "Pay Online",
                          sub: "UPI / Card / Wallet",
                        },
                        {
                          id: "COD" as const,
                          icon: "💵",
                          title: "Cash on Delivery",
                          sub: "Pay when delivered",
                        },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setPaymentMethod(opt.id)}
                          className={`p-3.5 rounded-2xl border-2 text-left transition-all ${paymentMethod === opt.id ? "border-[#81190B] bg-red-50/40" : "border-gray-200 hover:border-gray-300"}`}
                        >
                          <span className="text-xl block mb-1.5">
                            {opt.icon}
                          </span>
                          <p
                            className={`font-bold text-xs ${paymentMethod === opt.id ? "text-[#81190B]" : "text-gray-900"}`}
                          >
                            {opt.title}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {opt.sub}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Order items */}
                  <div className="bg-gray-50 rounded-2xl p-3.5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-3">
                      <ShoppingBag size={11} className="inline mr-1" />
                      {cartItems.length} Items
                    </p>
                    <div className="space-y-2.5">
                      {cartItems.map((item) => (
                        <div
                          key={item.product}
                          className="flex items-center gap-2.5"
                        >
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white flex-shrink-0 border border-gray-100">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.product_name}
                                fill
                                className="object-contain"
                                sizes="40px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-base">
                                🌶
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {item.product_name}
                            </p>
                            {item.size && (
                              <p className="text-[10px] text-gray-400">
                                {item.size}
                              </p>
                            )}
                          </div>
                          <p className="text-xs font-bold text-gray-900 flex-shrink-0">
                            ₹{(item.price * item.quantity).toFixed(0)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-1.5 text-xs">
                      <div className="flex justify-between text-gray-500">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Shipping</span>
                        <span
                          className={
                            shipFee === 0 ? "text-green-600 font-semibold" : ""
                          }
                        >
                          {!settingsLoaded
                            ? "..."
                            : shipFee === 0
                              ? "Free 🎉"
                              : `₹${shipFee}`}
                        </span>
                      </div>
                      {promoApplied && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount ({promoCode})</span>
                          <span>-₹{discount.toFixed(0)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-200">
                        <span className="text-gray-900">Total</span>
                        <span className="text-[#81190B]">
                          ₹{total.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Footer CTA ──────────────────────────────────────── */}

          <div className="px-4 pb-5 pt-3 border-t border-gray-100 flex-shrink-0">
            {/* ✅ FIX: Back + Primary CTA in one row */}
            <div
              className={`flex gap-2 ${showBackBtn ? "flex-row" : "flex-col"}`}
            >
              {/* Back button — hidden when user was already logged in on address step */}
              {showBackBtn && (
                <button
                  onClick={handleBack}
                  className="flex items-center justify-center gap-1.5 px-4 py-4 rounded-2xl border-2 border-gray-200 text-gray-500 font-semibold text-sm hover:border-gray-300 hover:text-gray-700 transition-colors flex-shrink-0"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
              )}

              {/* Primary CTA */}
              {step === "auth" && (
                <button
                  onClick={handlePhoneLogin}
                  disabled={authLoading}
                  className="flex-1 bg-[#81190B] hover:bg-[#5a1008] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-red-900/15"
                >
                  {authLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Please
                      wait...
                    </>
                  ) : (
                    <>
                      <ArrowRight size={16} /> Continue
                    </>
                  )}
                </button>
              )}

              {/* {step === "auth" && (
                <button
                  onClick={handleVerifyOtp}
                  disabled={authLoading || otp.join("").length < 6}
                  className="flex-1 bg-[#81190B] hover:bg-[#5a1008] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-red-900/15"
                >
                  {authLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />{" "}
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} /> Verify & Continue
                    </>
                  )}
                </button>
              )} */}

              {step === "address" && (
                <button
                  onClick={handleAddrNext}
                  className="flex-1 bg-[#81190B] hover:bg-[#5a1008] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-900/15"
                >
                  Continue to Review <ArrowRight size={16} />
                </button>
              )}

              {step === "review" && (
                <button
                  onClick={handlePlaceOrder}
                  disabled={placing || !paymentMethod}
                  className="flex-1 bg-[#81190B] hover:bg-[#5a1008] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-red-900/20"
                >
                  {placing ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : null}
                  {!paymentMethod
                    ? "Select a payment method"
                    : paymentMethod === "ONLINE"
                      ? `💳 Pay ₹${total.toFixed(0)}`
                      : `✅ Place Order — ₹${total.toFixed(0)}`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
