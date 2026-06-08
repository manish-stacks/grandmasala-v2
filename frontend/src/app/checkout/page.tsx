'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, CreditCard, CheckCircle, Loader2,
  AlertCircle, Truck, Plus, Mail, Phone, ArrowRight,
  RefreshCw, ShoppingBag, Tag, X, ChevronLeft, ChevronDown, ChevronUp,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearCart, applyPromoCode, clearCoupon } from '@/store/slices/cartSlice';
import { toast } from 'react-toastify';

const API = process.env.NEXT_PUBLIC_API_URL;

// ─── Load Razorpay script dynamically ───────────────────────────
function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof (window as any).Razorpay !== 'undefined') { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload  = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.head.appendChild(script);
  });
}

// Steps: auth → address → review
type Step = 'auth' | 'address' | 'review';
type AuthMode = 'identifier' | 'otp';

// ─── Step progress bar ─────────────────────────────────────────
const STEP_LIST = [
  { id: 'auth'    as Step, label: 'Login'   },
  { id: 'address' as Step, label: 'Address' },
  { id: 'review'  as Step, label: 'Confirm' },
];
function StepBar({ current, skipAuth }: { current: Step; skipAuth: boolean }) {
  const visible = skipAuth ? STEP_LIST.filter(s => s.id !== 'auth') : STEP_LIST;
  const idx = visible.findIndex(s => s.id === current);
  return (
    <div className="flex items-center">
      {visible.map((s, i) => (
        <React.Fragment key={s.id}>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < idx  ? 'bg-green-500 text-white' :
              i === idx ? 'bg-[#81190B] text-white ring-4 ring-red-100' :
                          'bg-gray-100 text-gray-400'
            }`}>
              {i < idx ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span className={`text-xs font-medium ${i <= idx ? 'text-[#81190B]' : 'text-gray-400'}`}>{s.label}</span>
          </div>
          {i < visible.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-5 rounded ${i < idx ? 'bg-[#81190B]' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── OTP Boxes ─────────────────────────────────────────────────
function OtpBoxes({ otp, onChange, onKeyDown, refs, onPaste }: {
  otp: string[];
  onChange: (i: number, val: string) => void;
  onKeyDown: (i: number, e: React.KeyboardEvent) => void;
  refs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onPaste: (e: React.ClipboardEvent) => void;
}) {
  return (
    <div className="flex gap-2.5 justify-center" onPaste={onPaste}>
      {otp.map((d, i) => (
        <input key={i}
          ref={el => { refs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1} value={d}
          onChange={e => onChange(i, e.target.value)}
          onKeyDown={e => onKeyDown(i, e)}
          className={`w-11 h-13 text-center text-lg font-bold border-2 rounded-2xl focus:outline-none transition-all
            ${d ? 'border-[#81190B] bg-red-50 text-[#81190B]' : 'border-gray-200 focus:border-[#81190B]'}`}
        />
      ))}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────
export default function CheckoutPage() {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const { cartItems, promoApplied, discountAmount, promoCode } = useAppSelector(s => s.cart);

  // Settings
  const [freeThreshold, setFreeThreshold] = useState(299);
  const [shippingCost,  setShippingCost]  = useState(0);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Step
  const [step,      setStep]      = useState<Step>('auth');
  const [skipAuth,  setSkipAuth]  = useState(false);
  const [error,     setError]     = useState('');
  const [showSummary, setShowSummary] = useState(false);

  // Auth
  const [authMode,       setAuthMode]       = useState<AuthMode>('identifier');
  const [identifier,     setIdentifier]     = useState('');
  const [resolvedEmail,  setResolvedEmail]  = useState('');
  const [authLoading,    setAuthLoading]    = useState(false);
  const [otpBoxes,       setOtpBoxes]       = useState(['', '', '', '', '', '']);
  const [resendTimer,    setResendTimer]    = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // User
  const [token, setToken] = useState('');
  const [user,  setUser]  = useState<any>(null);

  // Address
  const [savedAddr,     setSavedAddr]     = useState<any>(null);
  const [selectedAddr,  setSelectedAddr]  = useState<any>(null);
  const [addingNew,     setAddingNew]     = useState(false);
  const [addrForm, setAddrForm] = useState({ name: '', addressLine: '', city: '', state: '', postCode: '', addressType: 'Home' });

  // Payment & coupon
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'COD' | ''>('ONLINE');
  const [couponInput,   setCouponInput]   = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [placing,       setPlacing]       = useState(false);

  // Computed
  const subtotal = cartItems.reduce((t, i) => t + i.price * i.quantity, 0);
  const shipFee  = subtotal >= freeThreshold ? 0 : shippingCost;
  const discount = promoApplied ? discountAmount : 0;
  const total    = subtotal + shipFee - discount;

  // ─── Init ──────────────────────────────────────────────────
  useEffect(() => {
    if (cartItems.length === 0) { router.replace('/shop'); return; }

    // Fetch shipping from admin settings
    fetch(`${API}/settings`)
      .then(r => r.json())
      .then(d => {
        if (d.data?.freeShippingThreshold) setFreeThreshold(d.data.freeShippingThreshold);
        if (d.data?.shippingCost)          setShippingCost(d.data.shippingCost);
      })
      .catch(() => {})
      .finally(() => setSettingsLoaded(true));

    // Check logged in
    const t = sessionStorage.getItem('token_login');
    if (!t) return;
    setToken(t);

    fetch(`${API}/my-details`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(d => {
        if (!d.data) return;
        setUser(d.data);
        setSkipAuth(true);
        setStep('address');

        // Load last address
        fetch(`${API}/my-last-order`, { headers: { Authorization: `Bearer ${t}` } })
          .then(r => r.json())
          .then(od => {
            if (od.order?.shipping) {
              const s = od.order.shipping;
              const addr = {
                name: s.name, addressLine: s.addressLine,
                city: s.city, state: s.state, postCode: s.postCode,
                addressType: s.addressType || 'Home',
                mobile: s.mobileNumber || String(d.data?.ContactNumber || ''),
              };
              setSavedAddr(addr);
              setSelectedAddr(addr);
            }
          })
          .catch(() => {});
      })
      .catch(() => {});
  }, [cartItems.length, router]);

  // Resend timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // ─── Auth handlers ─────────────────────────────────────────
  const handleSendOtp = async () => {
    const val = identifier.trim();
    if (!val) { setError('Enter email or mobile number'); return; }
    const isPhone = /^[0-9]{10}$/.test(val);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    if (!isPhone && !isEmail) { setError('Enter a valid email or 10-digit mobile number'); return; }
    setAuthLoading(true); setError('');
    try {
      const res = await fetch(`${API}/send-login-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: val }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Failed to send OTP'); return; }
      setResolvedEmail(data.email);
      setAuthMode('otp');
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch { setError('Server error'); }
    finally { setAuthLoading(false); }
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otpBoxes]; next[i] = val.slice(-1); setOtpBoxes(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };
  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpBoxes[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (t.length === 6) { setOtpBoxes(t.split('')); otpRefs.current[5]?.focus(); }
  };
  const handleVerifyOtp = async () => {
    const code = otpBoxes.join('');
    if (code.length < 6) { setError('Enter the 6-digit OTP'); return; }
    setAuthLoading(true); setError('');
    try {
      const res = await fetch(`${API}/verify-login-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resolvedEmail, otp: code }),
      });
      const data = await res.json();
      if (!data.success && !data.token) { setError(data.message || 'Invalid OTP'); return; }
      sessionStorage.setItem('token_login', data.token);
      setToken(data.token);
      setUser(data.login || {});
      setSkipAuth(true);
      setStep('address');
      setError('');
    } catch { setError('Server error'); }
    finally { setAuthLoading(false); }
  };
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    try {
      const res = await fetch(`${API}/send-login-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: resolvedEmail }),
      });
      const data = await res.json();
      if (data.success) { setResendTimer(60); setOtpBoxes(['', '', '', '', '', '']); otpRefs.current[0]?.focus(); toast.success('OTP resent successfully!'); }
      else toast.error(data.message || 'Resend failed');
    } catch { toast.error('Resend failed'); }
  };

  // ─── Address next ──────────────────────────────────────────
  const handleAddrNext = () => {
    if (addingNew) {
      const f = addrForm;
      if (!f.name || !f.addressLine || !f.city || !f.state || !f.postCode) { setError('Please fill all required fields'); return; }
      const newAddr = { ...f, mobile: String(user?.ContactNumber || '') };
      setSavedAddr(newAddr); setSelectedAddr(newAddr); setAddingNew(false);
    }
    if (!selectedAddr) { setError('Please select or add an address'); return; }
    setError(''); setStep('review');
  };

  // ─── Coupon ────────────────────────────────────────────────
  const handleCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      await dispatch(applyPromoCode({ code: couponInput.trim().toUpperCase(), orderAmount: subtotal })).unwrap();
      toast.success('Coupon applied!');
    } catch (e: any) { toast.error(e || 'Invalid coupon'); }
    finally { setCouponLoading(false); }
  };

  // ─── Place order ───────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!paymentMethod) { setError('Select a payment method'); return; }
    if (!selectedAddr)  { setError('Address not found'); return; }
    const t = token || sessionStorage.getItem('token_login');
    if (!t) { setError('Login required'); setStep('auth'); return; }

    const addr = selectedAddr;
    const orderData = {
      items: cartItems.map(i => ({
        product_id: i.product, product_name: i.product_name,
        Qunatity: i.quantity, price_after_discount: i.price,
        Varient_id: i.variantId || 'N/A', size: i.size || 'N/A',
      })),
      totalAmount: subtotal, payAmt: total, paymentType: paymentMethod,
      isVarientInCart: cartItems.some(i => i.variantId),
      offerId: null, discountAmount: discount, shippingAmount: shipFee,
      couponCode: promoApplied ? promoCode : null,
      shipping: {
        name: addr.name, addressLine: addr.addressLine,
        city: addr.city, state: addr.state, postCode: addr.postCode,
        addressType: addr.addressType,
        mobileNumber: addr.mobile || String(user?.ContactNumber || ''),
        email: user?.Email || resolvedEmail,
      },
    };

    setPlacing(true); setError('');
    try {
      if (paymentMethod === 'COD') {
        const res = await fetch(`${API}/create-cod-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
          body: JSON.stringify({ amount: 0, orderData }),
        });
        const data = await res.json();
        if (data.success || data.orderId) {
          dispatch(clearCart());
          router.push(`/order-success?id=${data.orderId}&type=cod`);
        } else setError(data.message || 'Order failed');
      } else {
        const res = await fetch(`${API}/add-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
          body: JSON.stringify(orderData),
        });
        const data = await res.json();
        if (!data.razorpayOrderId) { setError('Could not initiate payment'); return; }

        // Ensure Razorpay SDK is loaded before calling it
        try { await loadRazorpay(); } catch { setError('Payment SDK failed to load. Please refresh and try again.'); return; }

        const rzp = new (window as any).Razorpay({
          key: data.rezorPayKey || process.env.NEXT_PUBLIC_RAZORPAY_KEY,
          amount: data.amount * 100, currency: 'INR',
          name: 'Grand Masala', description: 'Order Payment',
          order_id: data.razorpayOrderId,
          handler: async (resp: any) => {
            const v = await fetch(`${API}/verify-payment`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(resp),
            });
            const vd = await v.json();
            if (vd.success) { dispatch(clearCart()); router.push(vd.redirectUrl || '/order-success'); }
            else setError('Payment verification failed');
          },
          prefill: {
            name: user?.Name || addr.name,
            email: user?.Email || resolvedEmail,
            contact: String(user?.ContactNumber || ''),
          },
          theme: { color: '#81190B' },
          modal: { ondismiss: () => setPlacing(false) },
        });
        rzp.open();
        return;
      }
    } catch { setError('Server error. Please try again.'); }
    finally { setPlacing(false); }
  };

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Left ── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-700 text-sm">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
                <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
              </div>
            )}

            {/* Step bar */}
            <div className="bg-white rounded-2xl shadow-sm px-6 py-4">
              <StepBar current={step} skipAuth={skipAuth} />
            </div>

            {/* ══════════════════════════════════
                AUTH
            ══════════════════════════════════ */}
            {step === 'auth' && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900 text-lg">Login</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Enter your email or mobile to receive a one-time password</p>
                </div>
                <div className="px-6 py-6">

                  {authMode === 'identifier' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email or Mobile Number</label>
                        <div className="relative">
                          {/^[0-9]/.test(identifier)
                            ? <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            : <Mail  size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          }
                          <input type="text" value={identifier}
                            onChange={e => setIdentifier(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                            autoFocus placeholder="yourname@email.com or 9876543210"
                            className="w-full border-2 border-gray-200 rounded-2xl pl-10 pr-4 py-3.5 text-sm focus:outline-none focus:border-[#81190B] transition-colors"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                          <Mail size={11} /> OTP will be sent to your email
                        </p>
                      </div>
                      <button onClick={handleSendOtp} disabled={authLoading}
                        className="w-full bg-[#81190B] hover:bg-[#5a1008] text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-red-900/10">
                        {authLoading ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <><ArrowRight size={16} /> Send OTP</>}
                      </button>
                    </div>
                  )}

                  {authMode === 'otp' && (
                    <div className="space-y-5">
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
                        <p className="text-sm text-blue-700">OTP sent to: <span className="font-bold">{resolvedEmail}</span></p>
                        <p className="text-xs text-blue-400 mt-0.5">Check your inbox or spam folder</p>
                      </div>

                      <OtpBoxes otp={otpBoxes} onChange={handleOtpChange} onKeyDown={handleOtpKey} refs={otpRefs} onPaste={handleOtpPaste} />

                      <button onClick={handleVerifyOtp} disabled={authLoading || otpBoxes.join('').length < 6}
                        className="w-full bg-[#81190B] hover:bg-[#5a1008] text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-red-900/10">
                        {authLoading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : <><CheckCircle size={16} /> Verify & Continue</>}
                      </button>

                      <div className="flex items-center justify-between text-sm">
                        <button onClick={() => { setAuthMode('identifier'); setOtpBoxes(['', '', '', '', '', '']); setError(''); }}
                          className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                          <ChevronLeft size={13} /> Back
                        </button>
                        {resendTimer > 0
                          ? <span className="text-gray-400">Resend in <b className="text-gray-600">{resendTimer}s</b></span>
                          : <button onClick={handleResendOtp} className="text-[#81190B] font-semibold hover:underline">Resend OTP</button>
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════
                ADDRESS
            ══════════════════════════════════ */}
            {step === 'address' && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-bold text-gray-900">Delivery Address</h2>
                  {!addingNew && (
                    <button
                      onClick={() => { setAddingNew(true); setAddrForm({ name: user?.Name || '', addressLine: '', city: '', state: '', postCode: '', addressType: 'Home' }); }}
                      className="flex items-center gap-1 text-[#81190B] text-sm font-semibold">
                      <Plus size={14} /> Add New
                    </button>
                  )}
                </div>
                <div className="px-6 py-5 space-y-4">

                  {/* User badge */}
                  {user && (
                    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
                      <div className="w-8 h-8 bg-[#81190B] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {(user.Name || 'U')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.Name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.Email}</p>
                      </div>
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    </div>
                  )}

                  {/* Coupon */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2"><Tag size={14} /> Coupon</h3>
                    {!promoApplied ? (
                      <div className="flex gap-2">
                        <input value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())}
                          onKeyDown={e => e.key === 'Enter' && handleCoupon()}
                          placeholder="Coupon code"
                          className="flex-1 border-2 border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#81190B] uppercase" />
                        <button onClick={handleCoupon} disabled={couponLoading}
                          className="px-5 bg-gray-900 hover:bg-gray-700 text-white rounded-2xl text-sm font-semibold disabled:opacity-50">
                          {couponLoading ? '...' : 'Apply'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl px-4 py-2.5">
                        <span className="text-green-700 text-sm font-semibold">🎉 {promoCode} — ₹{discount.toFixed(0)} off</span>
                        <button onClick={() => { dispatch(clearCoupon()); setCouponInput(''); }} className="text-red-400 hover:text-red-600 ml-2"><X size={14} /></button>
                      </div>
                    )}
                  </div>

                  {/* Shipping display */}
                  <div className={`border-2 rounded-2xl p-4 flex items-center justify-between ${shipFee === 0 ? 'border-green-400 bg-green-50/30' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${shipFee === 0 ? 'bg-green-100' : 'bg-gray-100'}`}>🚚</div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Standard Delivery</p>
                        <p className="text-xs text-gray-400">3–7 working days</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${shipFee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                        {!settingsLoaded ? '...' : shipFee === 0 ? 'FREE 🎉' : `₹${shipFee}`}
                      </p>
                      {subtotal < freeThreshold && settingsLoaded && (
                        <p className="text-xs text-gray-400">₹{(freeThreshold - subtotal).toFixed(0)} more for free delivery</p>
                      )}
                    </div>
                  </div>

                  {/* Saved address */}
                  {savedAddr && !addingNew && (
                    <button onClick={() => setSelectedAddr(savedAddr)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${selectedAddr === savedAddr ? 'border-[#81190B] bg-red-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-900">{savedAddr.name}</span>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase">{savedAddr.addressType}</span>
                          </div>
                          <p className="text-sm text-gray-600">{savedAddr.addressLine}, {savedAddr.city}, {savedAddr.state} — {savedAddr.postCode}</p>
                          {savedAddr.mobile && <p className="text-xs text-gray-400 mt-0.5">📱 {savedAddr.mobile}</p>}
                        </div>
                        {selectedAddr === savedAddr && <CheckCircle size={20} className="text-[#81190B] flex-shrink-0" />}
                      </div>
                    </button>
                  )}

                  {!savedAddr && !addingNew && (
                    <div className="text-center py-8 text-gray-400">
                      <MapPin size={36} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm mb-3">No saved address found</p>
                      <button onClick={() => setAddingNew(true)} className="text-[#81190B] text-sm font-semibold">+ Add new address</button>
                    </div>
                  )}

                  {addingNew && (
                    <div className="space-y-3">
                      <p className="text-sm font-bold text-gray-700">New Address</p>
                      <input value={addrForm.name} onChange={e => setAddrForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Full name *" className="w-full border-2 border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#81190B]" />
                      <input value={addrForm.addressLine} onChange={e => setAddrForm(p => ({ ...p, addressLine: e.target.value }))}
                        placeholder="House no, Street, Area *" className="w-full border-2 border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#81190B]" />
                      <div className="grid grid-cols-2 gap-3">
                        <input value={addrForm.city} onChange={e => setAddrForm(p => ({ ...p, city: e.target.value }))}
                          placeholder="City *" className="border-2 border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#81190B]" />
                        <input value={addrForm.state} onChange={e => setAddrForm(p => ({ ...p, state: e.target.value }))}
                          placeholder="State *" className="border-2 border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#81190B]" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input value={addrForm.postCode} onChange={e => setAddrForm(p => ({ ...p, postCode: e.target.value }))}
                          placeholder="PIN Code *" className="border-2 border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#81190B]" />
                        <select value={addrForm.addressType} onChange={e => setAddrForm(p => ({ ...p, addressType: e.target.value }))}
                          className="border-2 border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#81190B]">
                          <option>Home</option><option>Office</option><option>Other</option>
                        </select>
                      </div>
                      {savedAddr && <button onClick={() => setAddingNew(false)} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    {!skipAuth && (
                      <button onClick={() => { setStep('auth'); setError(''); }}
                        className="flex-1 border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-2xl hover:bg-gray-50 text-sm flex items-center justify-center gap-1">
                        <ChevronLeft size={14} /> Back
                      </button>
                    )}
                    <button onClick={handleAddrNext}
                      className="flex-1 bg-[#81190B] hover:bg-[#5a1008] text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-1.5 text-sm shadow-md shadow-red-900/10">
                      Continue <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════
                REVIEW + PAYMENT
            ══════════════════════════════════ */}
            {step === 'review' && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900">Review & Place Order</h2>
                </div>
                <div className="px-6 py-5 space-y-4">

                  {/* Address */}
                  {selectedAddr && (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2.5">
                          <MapPin size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Delivering to</p>
                            <p className="font-semibold text-gray-900 text-sm">{selectedAddr.name}</p>
                            <p className="text-sm text-gray-600">{selectedAddr.addressLine}, {selectedAddr.city} — {selectedAddr.postCode}</p>
                            <p className="text-sm text-gray-500">{selectedAddr.state}, India</p>
                          </div>
                        </div>
                        <button onClick={() => setStep('address')} className="text-xs text-blue-600 hover:underline flex-shrink-0 ml-2">Change</button>
                      </div>
                    </div>
                  )}

                  {/* Payment method */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2"><CreditCard size={14} /> Payment Method</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'ONLINE' as const, icon: '💳', title: 'Pay Online',       sub: 'UPI / Card / Wallet' },
                        { id: 'COD'    as const, icon: '💵', title: 'Cash on Delivery', sub: 'Pay when delivered' },
                      ].map(opt => (
                        <button key={opt.id} onClick={() => setPaymentMethod(opt.id)}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${paymentMethod === opt.id ? 'border-[#81190B] bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <span className="text-2xl block mb-2">{opt.icon}</span>
                          <p className={`font-bold text-sm ${paymentMethod === opt.id ? 'text-[#81190B]' : 'text-gray-900'}`}>{opt.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{opt.sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-3">Order Items ({cartItems.length})</p>
                    <div className="space-y-3">
                      {cartItems.map(item => (
                        <div key={item.product} className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white flex-shrink-0 border border-gray-100">
                            {item.image
                              ? <Image src={item.image} alt={item.product_name} fill className="object-contain" sizes="48px" />
                              : <div className="w-full h-full flex items-center justify-center">🌶</div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{item.product_name}</p>
                            <p className="text-xs text-gray-400">Qty: {item.quantity}{item.size ? ` · ${item.size}` : ''}</p>
                          </div>
                          <p className="font-bold text-gray-900 text-sm flex-shrink-0">₹{(item.price * item.quantity).toFixed(0)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-1 text-sm">
                      {promoApplied && <div className="flex justify-between text-green-600"><span>Discount ({promoCode})</span><span>-₹{discount.toFixed(0)}</span></div>}
                      <div className="flex justify-between text-gray-500">
                        <span>Shipping</span>
                        <span className={shipFee === 0 ? 'text-green-600 font-medium' : ''}>
                          {!settingsLoaded ? '...' : shipFee === 0 ? 'Free 🎉' : `₹${shipFee}`}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-base text-gray-900 pt-1 border-t border-gray-200">
                        <span>Total</span><span className="text-[#81190B]">₹{total.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => { setStep('address'); setError(''); }}
                      className="flex-1 border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-2xl hover:bg-gray-50 text-sm flex items-center justify-center gap-1">
                      <ChevronLeft size={14} /> Back
                    </button>
                    <button onClick={handlePlaceOrder} disabled={placing || !paymentMethod}
                      className="flex-1 bg-gradient-to-r from-[#81190B] to-[#a01a0a] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all shadow-lg shadow-red-900/20 text-sm">
                      {placing ? <Loader2 size={16} className="animate-spin" /> : null}
                      {!paymentMethod
                        ? 'Select a payment method'
                        : paymentMethod === 'ONLINE'
                          ? `Pay ₹${total.toFixed(0)}`
                          : `Place Order — ₹${total.toFixed(0)}`
                      }
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Order Summary ── */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm p-5 sticky top-24">
              <button onClick={() => setShowSummary(p => !p)} className="w-full flex items-center justify-between lg:cursor-default">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} className="text-[#81190B]" />
                  <h3 className="font-bold text-gray-900">Order Summary</h3>
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{cartItems.length}</span>
                </div>
                <div className="lg:hidden">{showSummary ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}</div>
              </button>

              <div className={`${showSummary ? 'block' : 'hidden'} lg:block`}>
                <div className="mt-4 space-y-3">
                  {cartItems.map(item => (
                    <div key={item.product} className="flex gap-3 items-center">
                      <div className="relative w-12 h-12 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                        {item.image
                          ? <Image src={item.image} alt={item.product_name} fill className="object-contain p-0.5" sizes="48px" />
                          : <div className="w-full h-full flex items-center justify-center text-xl">🌶</div>
                        }
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#81190B] text-white text-[9px] font-bold rounded-full flex items-center justify-center">{item.quantity}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                        {item.size && <p className="text-xs text-gray-400">{item.size}</p>}
                      </div>
                      <p className="text-sm font-bold text-gray-900 flex-shrink-0">₹{(item.price * item.quantity).toFixed(0)}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Shipping</span>
                    <span className={shipFee === 0 ? 'text-green-600 font-semibold' : ''}>
                      {!settingsLoaded ? '...' : shipFee === 0 ? 'Free' : `₹${shipFee}`}
                    </span>
                  </div>
                  {promoApplied && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>-₹{discount.toFixed(0)}</span></div>}
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span className="text-[#81190B]">₹{total.toFixed(0)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
                  {[
                    '🔒 SSL secured checkout',
                    `🚚 Free delivery above ₹${freeThreshold}`,
                    '↩️ Easy returns',
                  ].map(t => <p key={t} className="text-xs text-gray-400">{t}</p>)}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}