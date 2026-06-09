'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Mail, Phone, User, ArrowRight, RefreshCw, ChevronLeft } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL;
type Step = 'form' | 'otp';

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep]               = useState<Step>('form');
  const [form, setForm]               = useState({ Name: '', Email: '', ContactNumber: '' });
  const [loading, setLoading]         = useState(false);
  const [otp, setOtp]                 = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading]   = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('token_login')) {
      router.replace('/profile');
    }
  }, [router]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // ── Step 1: Register & send OTP ──────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.Name.trim())          { toast.error('Naam daalo'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.Email)) { toast.error('Valid email daalo'); return; }
    if (!/^[0-9]{10}$/.test(form.ContactNumber)) { toast.error('10-digit mobile number daalo'); return; }

    setLoading(true);
    try {
      // Register with a random password — user will always login via OTP
      const randomPass = `gm_${Date.now()}_${Math.random().toString(36).slice(-6)}`;
      const res = await fetch(`${API}/regsiter-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, Password: randomPass }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || 'Registration failed');
        return;
      }
      setStep('otp');
      setResendTimer(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      toast.success('OTP sent successfully. Please check your email.');
    } catch {
      toast.error('Server error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP handlers ──────────────────────────────────────────
  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[i] = val.slice(-1); setOtp(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };
  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (t.length === 6) { setOtp(t.split('')); inputRefs.current[5]?.focus(); }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────
  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) { toast.error('6-digit OTP poora bharo'); return; }
    setOtpLoading(true);
    try {
      const res = await fetch(`${API}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.Email, otp: code, type: 'register' }),
      });
      const data = await res.json();
      if (!data.token && !data.success) {
        toast.error(data.message || 'Invalid OTP');
        return;
      }
      if (data.token) sessionStorage.setItem('token_login', data.token);
      toast.success('Registration successful! 🌶');
      router.push('/profile');
    } catch {
      toast.error('Server error');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await fetch(`${API}/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.Email, type: 'register' }),
      });
      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      toast.success('OTP sent successfully. Please check your email.');
    } catch { toast.error('Resend failed'); }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#81190B] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-900/20">
            <span className="text-3xl">🌶</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'form' ? 'Create your account' : 'Verify your email'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 'form' ? 'Register to get started' : `OTP sent to: ${form.Email}`}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-8">

          {/* ── Registration form ── */}
          {step === 'form' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text" value={form.Name}
                    onChange={e => setForm(p => ({ ...p, Name: e.target.value }))}
                    required placeholder="Enter your full name"
                    className="w-full border-2 border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#81190B] transition-colors"
                  />
                </div>
              </div>
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email" value={form.Email}
                    onChange={e => setForm(p => ({ ...p, Email: e.target.value }))}
                    required placeholder="your@email.com"
                    className="w-full border-2 border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#81190B] transition-colors"
                  />
                </div>
              </div>
              {/* Mobile */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel" value={form.ContactNumber}
                    onChange={e => setForm(p => ({ ...p, ContactNumber: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    required placeholder="10-digit mobile number"
                    maxLength={10}
                    className="w-full border-2 border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#81190B] transition-colors"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center pt-1">
                Password is not required as you will receive an OTP for login. If you want to set a password later, you can do so in your profile settings.
              </p>

              <button
                type="submit" disabled={loading}
                className="w-full bg-[#81190B] hover:bg-[#5a1008] text-white font-semibold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-red-900/10"
              >
                {loading
                  ? <><RefreshCw size={16} className="animate-spin" /> Creating...</>
                  : <><ArrowRight size={16} /> Create Account & Send OTP</>
                }
              </button>

              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link href="/login" className="text-[#81190B] font-semibold hover:underline">Login</Link>
              </p>
            </form>
          )}

          {/* ── OTP step ── */}
          {step === 'otp' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
                <p className="text-sm text-blue-700">
                  Verification code sent to: <span className="font-bold">{form.Email}</span>
                </p>
                <p className="text-xs text-blue-500 mt-0.5">Please check your inbox or spam folder</p>
              </div>

              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input key={i} ref={el => { inputRefs.current[i] = el; }}
                    type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className={`w-12 h-14 text-center text-xl font-bold rounded-2xl border-2 focus:outline-none transition-all
                      ${digit ? 'border-[#81190B] bg-red-50 text-[#81190B]' : 'border-gray-200 focus:border-[#81190B]'}`}
                  />
                ))}
              </div>

              <button onClick={handleVerifyOtp} disabled={otpLoading || otp.join('').length < 6}
                className="w-full bg-[#81190B] hover:bg-[#5a1008] text-white font-semibold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-red-900/10">
                {otpLoading ? <><RefreshCw size={16} className="animate-spin" /> Verifying...</> : <><ArrowRight size={16} /> Verify & Continue</>}
              </button>

              <div className="text-center">
                {resendTimer > 0
                  ? <p className="text-sm text-gray-400">Resend in <span className="font-bold text-gray-600">{resendTimer}s</span></p>
                  : <button onClick={handleResend} className="text-sm text-[#81190B] font-semibold hover:underline">OTP not received? Resend</button>
                }
              </div>

              <button onClick={() => { setStep('form'); setOtp(['','','','','','']); }}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                <ChevronLeft size={14} /> Go Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}