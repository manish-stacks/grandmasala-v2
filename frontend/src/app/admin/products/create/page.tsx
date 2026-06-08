'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

interface Variant { quantity: string; price: string; discount_percentage: string; price_after_discount: string; stock_quantity: string; isStock: boolean; }
const emptyVariant = (): Variant => ({ quantity: '', price: '', discount_percentage: '0', price_after_discount: '', stock_quantity: '', isStock: true });

export default function CreateProduct() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [variants, setVariants] = useState<Variant[]>([emptyVariant()]);
  const [form, setForm] = useState({
    product_name: '', product_description: '', extra_description: '',
    category: '', sub_category: '', tag: '',
    isVarient: true, price: '', discount: '0', afterDiscountPrice: '', stock: '',
    isShowOnHomeScreen: false, color: '',
  });
  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetch(`${API}/admin/category`).then(r => r.json()).then(d => setCategories(d.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.category) { setSubCategories([]); return; }
    fetch(`${API}/admin/sub-category/${form.category}`).then(r => r.json()).then(d => setSubCategories(d.subcategories || [])).catch(() => {});
  }, [form.category]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 5 - images.length);
    setImages(p => [...p, ...newFiles]);
    newFiles.forEach(f => { const reader = new FileReader(); reader.onload = e => setPreviews(p => [...p, e.target?.result as string]); reader.readAsDataURL(f); });
  };

  const updateVariant = (i: number, key: keyof Variant, val: string | boolean) => {
    setVariants(prev => {
      const next = [...prev]; next[i] = { ...next[i], [key]: val };
      if ((key === 'price' || key === 'discount_percentage') && next[i].price) {
        const p = parseFloat(next[i].price) || 0;
        const d = parseFloat(next[i].discount_percentage as string) || 0;
        next[i].price_after_discount = (p - (p * d / 100)).toFixed(2);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_name.trim()) { toast.error('Product name required'); return; }
    if (images.length === 0) { toast.error('At least one image required'); return; }
    if (form.isVarient && variants.some(v => !v.quantity || !v.price)) { toast.error('Fill all variant fields'); return; }
    setLoading(true);
    try {
      const token = sessionStorage.getItem('admin_token');
      const fd = new FormData();
      images.forEach(img => fd.append('images', img));
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      fd.set('Varient', JSON.stringify(variants));
      const res = await fetch(`${API}/add-new-product`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      if (data.success || res.ok) { toast.success('Product created!'); router.push('/admin/products'); }
      else toast.error(data.message || 'Failed to create product');
    } catch { toast.error('Something went wrong'); } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/products" className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors"><ArrowLeft size={16} />Products</Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-900 border-b pb-2">Basic Information</h2>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1">Product Name *</label><input value={form.product_name} onChange={e => setForm(p => ({ ...p, product_name: e.target.value }))} required className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B]" placeholder="e.g. Shahi Haldi Powder" /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label><textarea value={form.product_description} onChange={e => setForm(p => ({ ...p, product_description: e.target.value }))} required rows={4} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] resize-none" placeholder="Product description..." /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1">Extra Description</label><textarea value={form.extra_description} onChange={e => setForm(p => ({ ...p, extra_description: e.target.value }))} rows={2} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] resize-none" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value, sub_category: '' }))} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B]">
                <option value="">Select category</option>
                {categories.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-1">Sub-category</label>
              <select value={form.sub_category} onChange={e => setForm(p => ({ ...p, sub_category: e.target.value }))} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B]" disabled={!subCategories.length}>
                <option value="">Select sub-category</option>
                {subCategories.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-gray-700 mb-1">Tag</label><input value={form.tag} onChange={e => setForm(p => ({ ...p, tag: e.target.value }))} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B]" placeholder="e.g. bestseller, organic" /></div>
            <div className="flex items-center gap-3 mt-7"><input type="checkbox" id="showHome" checked={form.isShowOnHomeScreen} onChange={e => setForm(p => ({ ...p, isShowOnHomeScreen: e.target.checked }))} className="w-4 h-4 accent-[#81190B]" /><label htmlFor="showHome" className="text-sm font-semibold text-gray-700">Show on Home Screen</label></div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-gray-900 border-b pb-2 mb-4">Product Images (Max 5)</h2>
          <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-[#81190B] transition-colors">
            <Upload size={32} className="text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Click to upload images</p>
            <p className="text-gray-400 text-xs mt-1">{images.length}/5 images selected</p>
            <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
          </div>
          {previews.length > 0 && (
            <div className="flex gap-3 mt-4 flex-wrap">
              {previews.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 group">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setImages(p => p.filter((_, j) => j !== i)); setPreviews(p => p.filter((_, j) => j !== i)); }}
                    className="absolute inset-0 bg-red-500/70 text-white items-center justify-center hidden group-hover:flex text-xs font-bold">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Variants */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <h2 className="font-bold text-gray-900">Variants / Pricing</h2>
            <div className="flex items-center gap-3"><input type="checkbox" id="isVarient" checked={form.isVarient} onChange={e => setForm(p => ({ ...p, isVarient: e.target.checked }))} className="w-4 h-4 accent-[#81190B]" /><label htmlFor="isVarient" className="text-sm font-semibold text-gray-700">Has Variants</label></div>
          </div>
          {form.isVarient ? (
            <div className="space-y-4">
              {variants.map((v, i) => (
                <div key={i} className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-gray-50 rounded-xl p-4 relative">
                  {[['Quantity/Size', 'quantity', 'text', '100g, 250g...'], ['Price (₹)', 'price', 'number', '200'], ['Discount %', 'discount_percentage', 'number', '10'], ['After Discount (₹)', 'price_after_discount', 'number', '180'], ['Stock', 'stock_quantity', 'number', '50']].map(([label, key, type, ph]) => (
                    <div key={key}><label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                      <input type={type} value={v[key as keyof Variant] as string} onChange={e => updateVariant(i, key as keyof Variant, e.target.value)}
                        placeholder={ph} className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#81190B] text-sm" />
                    </div>
                  ))}
                  {variants.length > 1 && <button type="button" onClick={() => setVariants(p => p.filter((_, j) => j !== i))} className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700"><Trash2 size={14} /></button>}
                </div>
              ))}
              <button type="button" onClick={() => setVariants(p => [...p, emptyVariant()])} className="flex items-center gap-2 text-[#81190B] hover:text-[#5a1008] text-sm font-semibold transition-colors">
                <Plus size={16} />Add Variant
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {[['Price (₹)', 'price', '200'], ['Discount %', 'discount', '10'], ['After Discount (₹)', 'afterDiscountPrice', '180']].map(([label, key, ph]) => (
                <div key={key}><label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
                  <input type="number" value={form[key as keyof typeof form] as string} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={ph}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B]" />
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-[#81190B] hover:bg-[#5a1008] text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors text-lg">
          <Save size={20} />{loading ? 'Creating Product...' : 'Create Product'}
        </button>
      </form>
    </div>
  );
}
