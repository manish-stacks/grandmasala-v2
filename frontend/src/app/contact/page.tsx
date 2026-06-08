'use client';
import React, { useState } from 'react';
import { Phone, Mail, MapPin, Send } from 'lucide-react';
import { toast } from 'react-toastify';
export const dynamic = 'force-dynamic';

export default function ContactPage() {
  const [form, setForm] = useState({ name:'', email:'', phone:'', message:'' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/support-request`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success || res.ok) { toast.success('Message sent! We will get back to you shortly.'); setForm({ name:'',email:'',phone:'',message:'' }); }
      else toast.error(data.message || 'Failed to send message');
    } catch { toast.error('Something went wrong'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA]">
      <div className="bg-[#81190B] text-white py-16 text-center"><h1 className="text-4xl font-bold mb-2">Contact Us</h1><p className="text-white/80">We're here to help!</p></div>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            {[{ icon:Phone, label:'Phone', value:'+91 93555 77789', href:'tel:+919355577789' },{ icon:Mail, label:'Email', value:'info@grandmasala.in', href:'mailto:info@grandmasala.in' },{ icon:MapPin, label:'Address', value:'47, VPO Dhauj, Near Rabia Masjid, Faridabad, Haryana', href:'#' }].map(({ icon:Icon, label, value, href }) => (
              <a key={label} href={href} className="bg-white rounded-2xl shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow block">
                <div className="w-12 h-12 bg-[#81190B] rounded-xl flex items-center justify-center flex-shrink-0"><Icon className="w-6 h-6 text-white"/></div>
                <div><p className="font-semibold text-gray-900">{label}</p><p className="text-gray-600 text-sm">{value}</p></div>
              </a>
            ))}
          </div>
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Name</label><input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} required placeholder="Your name" className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B]"/></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} required placeholder="your@email.com" className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B]"/></div>
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label><input type="tel" value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} placeholder="10-digit mobile number" className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B]"/></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Message</label><textarea value={form.message} onChange={e => setForm(p=>({...p,message:e.target.value}))} required rows={5} placeholder="How can we help you?" className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] resize-none"/></div>
              <button type="submit" disabled={loading} className="w-full bg-[#81190B] hover:bg-[#5a1008] text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                <Send size={18}/>{loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
