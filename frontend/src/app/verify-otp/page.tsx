'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

export default function VerifyOtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verify-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ otp, Email: email }) });
      const data = await res.json();
      if (data.success || data.token) {
        if (data.token) sessionStorage.setItem('token_login', data.token);
        toast.success('Email verified! Please login.'); router.push('/login');
      } else toast.error(data.message || 'Invalid OTP');
    } catch { toast.error('Something went wrong'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        <div className="text-5xl mb-4">📧</div>
        <h1 className="text-3xl font-bold mb-2">Verify Your Email</h1>
        <p className="text-gray-500 mb-8">Enter the OTP sent to your email address</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#81190B]"/>
          <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required placeholder="Enter 6-digit OTP" maxLength={6} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#81190B] text-center text-2xl tracking-widest"/>
          <button type="submit" disabled={loading} className="w-full bg-[#81190B] text-white py-3 rounded-xl font-semibold hover:bg-[#5a1008] disabled:opacity-50">
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      </div>
    </div>
  );
}
