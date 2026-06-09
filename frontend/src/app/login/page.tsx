'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Mail, Phone, ArrowRight, RefreshCw, ChevronLeft } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL;
type Step = 'identifier' | 'otp';

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep]               = useState<Step>('identifier');
  const [identifier, setIdentifier]   = useState('');  // email or phone
  const [resolvedEmail, setResolvedEmail] = useState(''); // email returned from API
  const [loading, setLoading]         = useState(false);
  const [otp, setOtp]                 = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading]   = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if already logged in
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('token_login')) {
      router.replace('/profile');
    }
  }, [router]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // ── Step 1: Send OTP ──────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = identifier.trim();
    if (!val) { toast.error('Email or mobile number required'); return; }

    // Validate format
    const isPhone = /^[0-9]{10}$/.test(val);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    if (!isPhone && !isEmail) {
      toast.error('Valid email or 10-digit mobile number required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/send-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: val }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || 'Error sending OTP. Try again.');
        return;
      }
      setResolvedEmail(data.email); // backend returns the email to verify against
      setStep('otp');
      setResendTimer(60);
      // Focus first OTP box
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      toast.error('Server error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP box handlers ──────────────────────────────────────
  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────
  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) { toast.error('6-digit OTP required'); return; }
    setOtpLoading(true);
    try {
      const res = await fetch(`${API}/verify-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resolvedEmail, otp: code }),
      });
      const data = await res.json();
      if (!data.token && !data.success) {
        toast.error(data.message || 'Invalid OTP. Try again.');
        return;
      }
      if (data.token) {
        sessionStorage.setItem('token_login', data.token);
      }
      toast.success('Login successful! 🎉');
      router.push('/profile');
    } catch {
      toast.error('Server error. Try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────
  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      const res = await fetch(`${API}/send-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: resolvedEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setResendTimer(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        toast.success('OTP sent again!');
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Resend failed');
    }
  };

  const isPhone = /^[0-9]/.test(identifier);

  return (
    <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo + Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#81190B] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-900/20">
            <span className="text-3xl">🌶</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'identifier' ? 'Sign in to Grand Masala' : 'Enter OTP'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 'identifier'
              ? 'Login with your email or phone number. No password needed!'
              : `OTP sent to: ${resolvedEmail}`}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-8">

          {/* ── Step 1: Identifier ── */}
          {step === 'identifier' && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email or Mobile Number
                </label>
                <div className="relative">
                  {isPhone
                    ? <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    : <Mail  size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  }
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="yourname@email.com or 9876543210"
                    autoFocus
                    className="w-full border-2 border-gray-200 rounded-2xl pl-10 pr-4 py-3.5 text-sm focus:outline-none focus:border-[#81190B] transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  No password needed — we'll verify you with an OTP
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#81190B] hover:bg-[#5a1008] text-white font-semibold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-red-900/10"
              >
                {loading
                  ? <><RefreshCw size={16} className="animate-spin" /> Sending OTP...</>
                  : <><ArrowRight size={16} /> Send OTP</>
                }
              </button>

              <p className="text-center text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-[#81190B] font-semibold hover:underline">
                  Register
                </Link>
              </p>
            </form>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 'otp' && (
            <div className="space-y-6">
              {/* Sent-to info */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
                <p className="text-sm text-blue-700">
                  OTP sent to: <span className="font-bold">{resolvedEmail}</span>
                </p>
                <p className="text-xs text-blue-500 mt-0.5">Please check your inbox or spam folder</p>
              </div>

              {/* 6-box OTP input */}
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className={`w-12 h-14 text-center text-xl font-bold rounded-2xl border-2 focus:outline-none transition-all duration-150
                      ${digit
                        ? 'border-[#81190B] bg-red-50 text-[#81190B]'
                        : 'border-gray-200 focus:border-[#81190B] text-gray-900'
                      }`}
                  />
                ))}
              </div>

              {/* Verify button */}
              <button
                onClick={handleVerifyOtp}
                disabled={otpLoading || otp.join('').length < 6}
                className="w-full bg-[#81190B] hover:bg-[#5a1008] text-white font-semibold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-red-900/10"
              >
                {otpLoading
                  ? <><RefreshCw size={16} className="animate-spin" /> Verifying...</>
                  : <><ArrowRight size={16} /> Verify & Login</>
                }
              </button>

              {/* Resend */}
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-sm text-gray-400">
                    Resend OTP in{' '}
                    <span className="font-bold text-gray-600">{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    className="text-sm text-[#81190B] font-semibold hover:underline"
                  >
                    OTP not received? Resend
                  </button>
                )}
              </div>

              {/* Back */}
              <button
                onClick={() => {
                  setStep('identifier');
                  setOtp(['', '', '', '', '', '']);
                }}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ChevronLeft size={14} /> Go Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}