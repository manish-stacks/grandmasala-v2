'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ Email: '', Password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    if (!token) { setChecking(false); return; }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/my-details`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.data?.Role === 'Admin') router.replace('/admin');
        else { sessionStorage.removeItem('admin_token'); setChecking(false); }
      })
      .catch(() => { sessionStorage.removeItem('admin_token'); setChecking(false); });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: form.Email, Password: form.Password }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        setError(data.message || 'Invalid email or password');
        return;
      }
      if (data.login?.Role !== 'Admin') {
        setError('Access denied. Admin accounts only.');
        return;
      }
      sessionStorage.setItem('admin_token', data.token);
      sessionStorage.setItem('token_login', data.token);
      router.replace('/admin');
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-900/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md w-full">
        <div className="bg-gray-800 rounded-3xl shadow-2xl border border-gray-700/60 p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-red-700 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
              <span className="text-3xl">🌶</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-400 text-sm mt-1">Grand Masala — Secure Access</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-950/50 border border-red-800/50 rounded-xl px-4 py-3">
              <AlertCircle size={17} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="email" value={form.Email}
                  onChange={e => { setForm(p => ({ ...p, Email: e.target.value })); setError(''); }}
                  required placeholder="admin@grandmasala.in"
                  className="w-full bg-gray-700/50 border border-gray-600 text-white placeholder-gray-500 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type={showPw ? 'text' : 'password'} value={form.Password}
                  onChange={e => { setForm(p => ({ ...p, Password: e.target.value })); setError(''); }}
                  required placeholder="Your password"
                  className="w-full bg-gray-700/50 border border-gray-600 text-white placeholder-gray-500 rounded-xl pl-10 pr-12 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-colors" />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-amber-600 to-red-700 hover:from-amber-500 hover:to-red-600 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg mt-2">
              {loading
                ? <><Loader2 size={18} className="animate-spin" /> Signing in...</>
                : 'Sign In to Admin'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-600 mt-6">Admin access only · Unauthorised access prohibited</p>
        </div>

        <div className="text-center mt-4">
          <a href="/" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">← Back to Grand Masala</a>
        </div>
      </div>
    </div>
  );
}
