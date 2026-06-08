'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function ForgetPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Password-Change-Request`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: email }),
      });
      const data = await res.json();
      if (data.success || res.ok) { setSent(true); toast.success('OTP sent to your email!'); }
      else toast.error(data.message || 'Email not found');
    } catch { toast.error('Something went wrong'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password</h1>
        <p className="text-gray-500 mb-8">Enter your email and we'll send you an OTP to reset your password.</p>
        {sent ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <p className="text-green-700 font-semibold text-lg mb-2">✅ OTP Sent!</p>
            <p className="text-green-600 text-sm mb-4">Check your email for the OTP.</p>
            <Link href="/verify-otp" className="text-[#81190B] font-semibold hover:underline">Verify OTP →</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="your@email.com"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#81190B] transition-colors" />
            <button type="submit" disabled={loading}
              className="w-full bg-[#81190B] hover:bg-[#5a1008] text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50">
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}
        <p className="mt-6 text-sm text-gray-500">
          Remember your password? <Link href="/login" className="text-[#81190B] font-semibold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
