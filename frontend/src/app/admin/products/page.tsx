'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Eye, EyeOff, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-toastify';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/get-product`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    const token = sessionStorage.getItem('admin_token');
    try {
      const res = await fetch(`${API}/delete-product/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success || res.ok) { toast.success('Product deleted'); fetchProducts(); }
      else toast.error(data.message || 'Failed to delete');
    } catch { toast.error('Error deleting'); }
    finally { setDeleting(''); }
  };

  const handleToggleHome = async (id: string, current: boolean) => {
    const token = sessionStorage.getItem('admin_token');
    try {
      const res = await fetch(`${API}/update-show-home/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isShowOnHomeScreen: !current }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success(`${!current ? 'Added to' : 'Removed from'} home screen`);
        setProducts(p => p.map(prod => prod._id === id ? { ...prod, isShowOnHomeScreen: !current } : prod));
      } else toast.error('Failed to update');
    } catch { toast.error('Error'); }
  };

  const filtered = products.filter(p =>
    !search || p.product_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm">{products.length} products total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchProducts} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors" title="Refresh">
            <RefreshCw size={16} />
          </button>
          <Link href="/admin/products/create"
            className="bg-[#81190B] hover:bg-[#5a1008] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold transition-colors">
            <Plus size={16} /> Add Product
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#81190B] text-sm" />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#81190B] mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Image', 'Product Name', 'Price', 'Category', 'Show Home', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => {
                  const price = p.isVarient
                    ? p.Varient?.[0]?.price_after_discount || p.Varient?.[0]?.price
                    : p.afterDiscountPrice || p.price;
                  return (
                    <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 w-16">
                        {p.ProductMainImage?.url ? (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#F4F1EA]">
                            <Image src={p.ProductMainImage.url} alt={p.product_name} fill className="object-cover" sizes="48px" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-[#F4F1EA] rounded-xl flex items-center justify-center text-xl">🌶</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 max-w-xs truncate">{p.product_name}</p>
                        {p.tag && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded mt-0.5 inline-block">{p.tag}</span>}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#81190B]">
                        ₹{Number(price || 0).toFixed(0)}{p.isVarient && p.Varient?.length > 1 ? '+' : ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.category?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggleHome(p._id, p.isShowOnHomeScreen)}
                          className={`p-2 rounded-xl transition-colors ${p.isShowOnHomeScreen ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                          title={p.isShowOnHomeScreen ? 'Remove from home' : 'Show on home'}>
                          {p.isShowOnHomeScreen ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link href={`/admin/products/${p._id}`}
                            className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors" title="Edit">
                            <Edit size={15} />
                          </Link>
                          <button onClick={() => handleDelete(p._id, p.product_name)}
                            disabled={deleting === p._id}
                            className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-40" title="Delete">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    {search ? `No products matching "${search}"` : 'No products yet'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
