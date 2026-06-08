'use client';
import React, { useState, useEffect } from 'react';
import { Save, Globe, Mail, Share2, Search, Code, Truck, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const API = process.env.NEXT_PUBLIC_API_URL;

const TABS = [
  { id: 'general',  label: 'General',        icon: Globe },
  { id: 'seo',      label: 'SEO & Meta',      icon: Search },
  { id: 'scripts',  label: 'Scripts & Tags',  icon: Code },
  { id: 'smtp',     label: 'Email / SMTP',    icon: Mail },
  { id: 'social',   label: 'Social Media',    icon: Share2 },
  { id: 'shipping', label: 'Shipping & COD',  icon: Truck },
];

const DEFAULT: any = {
  siteName: '', siteUrl: '', supportEmail: '', contactNumber: '', address: '',
  codFee: 0, freeShippingThreshold: 299, shippingCost: 80,
  smtp_email: '', smtp_password: '',
  socialMediaLinks: { facebook: '', instagram: '', youtube: '', twitter: '', linkedin: '' },
  seo: {
    metaTitle: '', metaDesc: '', metaKeywords: '', ogImage: '',
    googleVerification: '', canonicalUrl: '', robots: 'index, follow',
    gaId: '', fbPixelId: '', headScript: '', bodyScript: '',
  },
};

export default function AdminSettings() {
  const [tab, setTab] = useState('general');
  const [s, setS]     = useState<any>(DEFAULT);   // s = settings state
  const [id, setId]   = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  // ── Load ──────────────────────────────────────────────────
  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    fetch(`${API}/admin/settings`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const data = d.data || {};
        // Deep merge with defaults
        setS({
          ...DEFAULT,
          ...data,
          socialMediaLinks: { ...DEFAULT.socialMediaLinks, ...(data.socialMediaLinks || {}) },
          seo: { ...DEFAULT.seo, ...(data.seo || {}) },
        });
        setId(data._id || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Helpers ───────────────────────────────────────────────
  const set    = (k: string, v: any) => setS((p: any) => ({ ...p, [k]: v }));
  const setSoc = (k: string, v: string) => setS((p: any) => ({ ...p, socialMediaLinks: { ...p.socialMediaLinks, [k]: v } }));
  const setSeo = (k: string, v: string) => setS((p: any) => ({ ...p, seo: { ...p.seo, [k]: v } }));

  // ── Save ──────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = sessionStorage.getItem('admin_token');
    try {
      // Always upsert — backend handles it
      const url    = id ? `${API}/admin/settings/${id}` : `${API}/admin/create/settings`;
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(s),
      });
      const data = await res.json();
      if (data.success) {
        if (data.data?._id) setId(data.data._id);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        toast.success('Settings saved!');
      } else {
        toast.error(data.message || 'Failed to save');
      }
    } catch {
      toast.error('Server error');
    } finally {
      setSaving(false);
    }
  };

  // ── UI helpers ─────────────────────────────────────────────
  const inp = (label: string, key: string, type = 'text', ph = '', hint = '') => (
    <div key={key}>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <input type={type} value={s[key] ?? ''} onChange={e => set(key, e.target.value)}
        placeholder={ph}
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] text-sm transition-colors" />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
  const ta = (label: string, key: string, rows = 3, ph = '', hint = '', mono = false) => (
    <div key={key}>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <textarea value={s[key] ?? ''} onChange={e => set(key, e.target.value)}
        rows={rows} placeholder={ph}
        className={`w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] text-sm resize-none transition-colors ${mono ? 'font-mono text-xs' : ''}`} />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
  const seoInp = (label: string, key: string, type = 'text', ph = '', hint = '') => (
    <div key={key}>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <input type={type} value={s.seo?.[key] ?? ''} onChange={e => setSeo(key, e.target.value)}
        placeholder={ph}
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] text-sm transition-colors" />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
  const seoTa = (label: string, key: string, rows = 3, ph = '', hint = '', mono = false) => (
    <div key={key}>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <textarea value={s.seo?.[key] ?? ''} onChange={e => setSeo(key, e.target.value)}
        rows={rows} placeholder={ph}
        className={`w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] text-sm resize-none transition-colors ${mono ? 'font-mono text-xs' : ''}`} />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#81190B] border-t-transparent" />
    </div>
  );

  return (
    <form onSubmit={handleSave}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage site configuration, SEO, and tracking</p>
        </div>
        <button type="submit" disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${saved ? 'bg-green-600 text-white' : 'bg-[#81190B] hover:bg-[#5a1008] text-white'} disabled:opacity-50`}>
          {saved ? <><CheckCircle size={16} /> Saved!</> : saving ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : <><Save size={16} /> Save Settings</>}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Tabs */}
        <nav className="lg:w-48 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {TABS.map(t => (
              <button key={t.id} type="button" onClick={() => setTab(t.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${tab === t.id ? 'bg-[#81190B] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                <t.icon size={15} />{t.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Tab content */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm p-6 space-y-5">

          {/* ── GENERAL ── */}
          {tab === 'general' && (
            <>
              <h2 className="text-lg font-bold text-gray-900 border-b pb-3">General Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inp('Site Name', 'siteName', 'text', 'Grand Masala')}
                {inp('Site URL', 'siteUrl', 'url', 'https://grandmasala.in')}
                {inp('Support Email', 'supportEmail', 'email', 'info@grandmasala.in')}
                {inp('Contact Number', 'contactNumber', 'tel', '+91 93555 77789')}
              </div>
              {ta('Business Address', 'address', 2, '47, VPO Dhauj, Faridabad, Haryana')}
            </>
          )}

          {/* ── SEO & META ── */}
          {tab === 'seo' && (
            <>
              <h2 className="text-lg font-bold text-gray-900 border-b pb-3">SEO & Meta Tags</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                💡 These are site-wide SEO defaults. Individual product/blog pages override these with their own meta.
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Default Meta Title</label>
                <input value={s.seo?.metaTitle ?? ''} onChange={e => setSeo('metaTitle', e.target.value)}
                  placeholder="Grand Masala — 100% Pure Handmade Indian Spices"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] text-sm" />
                <div className={`text-xs mt-1 ${(s.seo?.metaTitle?.length || 0) > 60 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                  {s.seo?.metaTitle?.length || 0}/60 characters {(s.seo?.metaTitle?.length || 0) > 60 && '⚠️ Too long'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Default Meta Description</label>
                <textarea value={s.seo?.metaDesc ?? ''} onChange={e => setSeo('metaDesc', e.target.value)}
                  rows={3} placeholder="Buy premium handmade Indian spices. No preservatives. Free delivery above ₹299."
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] text-sm resize-none" />
                <div className={`text-xs mt-1 ${(s.seo?.metaDesc?.length || 0) > 160 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                  {s.seo?.metaDesc?.length || 0}/160 characters {(s.seo?.metaDesc?.length || 0) > 160 && '⚠️ Too long'}
                </div>
              </div>
              {seoInp('Meta Keywords (comma separated)', 'metaKeywords', 'text', 'Indian spices, pure haldi, garam masala, lal mirch', 'Separate each keyword with a comma')}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {seoInp('OG / Social Share Image URL', 'ogImage', 'url', 'https://grandmasala.in/og-image.jpg', 'Shown when sharing on WhatsApp, Instagram, etc.')}
                {seoInp('Canonical URL', 'canonicalUrl', 'url', 'https://www.grandmasala.in')}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {seoInp('Google Site Verification', 'googleVerification', 'text', 'google-site-verification=xxxxx', 'From Google Search Console → Verify → HTML tag method')}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Robots Meta</label>
                  <select value={s.seo?.robots ?? 'index, follow'} onChange={e => setSeo('robots', e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] text-sm">
                    <option value="index, follow">index, follow (Recommended)</option>
                    <option value="noindex, follow">noindex, follow</option>
                    <option value="index, nofollow">index, nofollow</option>
                    <option value="noindex, nofollow">noindex, nofollow (Blocks Google)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* ── SCRIPTS & TAGS ── */}
          {tab === 'scripts' && (
            <>
              <h2 className="text-lg font-bold text-gray-900 border-b pb-3">Scripts & Tracking Tags</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                ⚠️ Scripts saved here are injected on every page. Only add from trusted sources. Wrong code can break the website.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Google Analytics 4 — Measurement ID</label>
                  <input value={s.seo?.gaId ?? ''} onChange={e => setSeo('gaId', e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] text-sm font-mono" />
                  <p className="text-xs text-gray-400 mt-1">Google Analytics → Admin → Data Streams → Measurement ID</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Facebook Pixel ID</label>
                  <input value={s.seo?.fbPixelId ?? ''} onChange={e => setSeo('fbPixelId', e.target.value)}
                    placeholder="123456789012345"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] text-sm font-mono" />
                  <p className="text-xs text-gray-400 mt-1">Meta Business Suite → Events Manager → Pixel ID</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Custom &lt;head&gt; Script</label>
                <textarea value={s.seo?.headScript ?? ''} onChange={e => setSeo('headScript', e.target.value)}
                  rows={6} placeholder={'<!-- Injected inside <head> on every page -->\n<!-- e.g. Google Tag Manager, Hotjar, Clarity -->'}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] font-mono text-xs resize-y" />
                <p className="text-xs text-gray-400 mt-1">Injected inside <code>&lt;head&gt;</code> tag on all pages</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Custom &lt;body&gt; Script</label>
                <textarea value={s.seo?.bodyScript ?? ''} onChange={e => setSeo('bodyScript', e.target.value)}
                  rows={6} placeholder={'<!-- Injected before </body> on every page -->\n<!-- e.g. WhatsApp chat widget, live chat, noscript pixel -->'}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] font-mono text-xs resize-y" />
                <p className="text-xs text-gray-400 mt-1">Injected before <code>&lt;/body&gt;</code> closing tag on all pages</p>
              </div>

              {/* Live preview of what's being injected */}
              {(s.seo?.gaId || s.seo?.fbPixelId) && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm">
                  <p className="font-semibold text-green-800 mb-2">✅ Active tracking scripts:</p>
                  <ul className="space-y-1 text-green-700">
                    {s.seo?.gaId && <li>• Google Analytics 4 (<code className="bg-green-100 px-1 rounded">{s.seo.gaId}</code>)</li>}
                    {s.seo?.fbPixelId && <li>• Facebook Pixel (<code className="bg-green-100 px-1 rounded">{s.seo.fbPixelId}</code>)</li>}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* ── SMTP ── */}
          {tab === 'smtp' && (
            <>
              <h2 className="text-lg font-bold text-gray-900 border-b pb-3">Email / SMTP Configuration</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                📧 Used for order confirmation emails, OTP verification, and customer notifications.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inp('SMTP Email Address', 'smtp_email', 'email', 'grandmasala95604@gmail.com')}
                {inp('SMTP Password / App Password', 'smtp_password', 'password', 'Gmail app password (16 chars)')}
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">📋 How to get Gmail App Password:</p>
                <ol className="text-xs text-gray-600 space-y-1.5 list-decimal pl-4">
                  <li>Google Account → Security → 2-Step Verification (Enable it)</li>
                  <li>Search "App passwords" in Google Account search</li>
                  <li>Select app: "Mail", device: "Other" → Generate</li>
                  <li>Copy the 16-character password and paste above</li>
                </ol>
              </div>
            </>
          )}

          {/* ── SOCIAL ── */}
          {tab === 'social' && (
            <>
              <h2 className="text-lg font-bold text-gray-900 border-b pb-3">Social Media Links</h2>
              <p className="text-sm text-gray-500">These links appear in the website footer and are used for structured data (SEO).</p>
              <div className="space-y-4">
                {[
                  { label: 'Facebook',    key: 'facebook',  ph: 'https://www.facebook.com/granddmasala/' },
                  { label: 'Instagram',   key: 'instagram', ph: 'https://www.instagram.com/grand.masala/' },
                  { label: 'YouTube',     key: 'youtube',   ph: 'https://www.youtube.com/@GrandMasala2025' },
                  { label: 'Twitter / X', key: 'twitter',   ph: 'https://twitter.com/grandmasala' },
                  { label: 'LinkedIn',    key: 'linkedin',  ph: 'https://linkedin.com/company/grandmasala' },
                ].map(({ label, key, ph }) => (
                  <div key={key}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
                    <input value={s.socialMediaLinks?.[key] ?? ''} onChange={e => setSoc(key, e.target.value)}
                      placeholder={ph} type="url"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] text-sm" />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── SHIPPING ── */}
          {tab === 'shipping' && (
            <>
              <h2 className="text-lg font-bold text-gray-900 border-b pb-3">Shipping & COD Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Free Shipping Above (₹)</label>
                  <input type="number" min="0" value={s.freeShippingThreshold ?? 299}
                    onChange={e => set('freeShippingThreshold', Number(e.target.value))}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] text-sm" />
                  <p className="text-xs text-gray-400 mt-1">Orders above this get free delivery</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Shipping Cost Below Threshold (₹)</label>
                  <input type="number" min="0" value={s.shippingCost ?? 80}
                    onChange={e => set('shippingCost', Number(e.target.value))}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">COD Extra Fee (₹)</label>
                  <input type="number" min="0" value={s.codFee ?? 0}
                    onChange={e => set('codFee', Number(e.target.value))}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] text-sm" />
                  <p className="text-xs text-gray-400 mt-1">Set 0 for free COD</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <p className="font-semibold mb-1">Current shipping rules:</p>
                <p>• Orders ≥ ₹{s.freeShippingThreshold || 299} → <span className="font-bold text-green-700">FREE delivery</span></p>
                <p>• Orders &lt; ₹{s.freeShippingThreshold || 299} → <span className="font-bold">₹{s.shippingCost || 80} shipping charge</span></p>
                {s.codFee > 0 && <p>• COD orders → additional <span className="font-bold">₹{s.codFee} COD fee</span></p>}
              </div>
            </>
          )}

        </div>
      </div>
    </form>
  );
}
