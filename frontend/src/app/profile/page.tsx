'use client';
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, User, MapPin, Heart, ShoppingBag, LogOut,
  Package, TrendingUp, Clock, Star, ChevronRight, Edit3, Home
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Image from 'next/image';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL;

type TabId = 'dashboard' | 'profile' | 'addresses' | 'wishlist' | 'orders';

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100  text-blue-700',
  shipped:   'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100   text-red-700',
};

export default function ProfilePage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState<any>({});
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('token_login');
    if (!token) { router.push('/login'); return; }

    Promise.all([
      fetch(`${API}/my-details`,  { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/my-all-order`,{ headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/wishlist`,    { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([u, o, w]) => {
      console.log('w:',w);
      setUser(u.data || {});
      setEditForm({ Name: u.data?.Name || '', ContactNumber: u.data?.ContactNumber || '' });
      setOrders(o.order || []);
      setWishlist(w.wishlist || w.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem('token_login');
    toast.success('Logged out!');
    router.push('/');
  };

  const handleSaveProfile = async () => {
    const token = sessionStorage.getItem('token_login');
    setSavingProfile(true);
    try {
      const res = await fetch(`${API}/update-user-profile`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) { setUser((p: any) => ({ ...p, ...editForm })); toast.success('Profile updated!'); }
      else toast.error(data.message || 'Failed');
    } catch { toast.error('Error'); } finally { setSavingProfile(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#81190B] border-t-transparent" />
    </div>
  );

  const totalSpent = orders.reduce((t, o) => t + (o.payAmt || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;

  const SIDEBAR_ITEMS: { id: TabId; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard',     icon: LayoutDashboard },
    { id: 'profile',   label: 'My Profile',    icon: User },
    { id: 'addresses', label: 'Addresses',     icon: MapPin },
    // { id: 'wishlist',  label: 'Wishlist',      icon: Heart },
    { id: 'orders',    label: 'Order History', icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Sidebar ── */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm">
              {/* User card */}
              <div className="p-5 flex items-center gap-3 border-b border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-[#A75F55] to-[#A75F55] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {user?.Name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-gray-900 truncate">{user?.Name || 'User'}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.Email}</p>
                </div>
              </div>

              {/* Nav */}
              <nav className="p-2">
                {SIDEBAR_ITEMS.map(item => (
                  <button key={item.id} onClick={() => setTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      tab === item.id
                        ? 'bg-[#A75F55] text-white shadow-sm shadow-purple-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                    <item.icon size={18} />
                    {item.label}
                  </button>
                ))}
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors mt-1">
                  <LogOut size={18} />
                  Logout
                </button>
              </nav>
            </div>
          </aside>

          {/* ── Main ── */}
          <main className="flex-1 min-w-0">

            {/* Dashboard */}
            {tab === 'dashboard' && (
              <div className="space-y-5">
                {/* Welcome banner */}
                <div className="bg-gradient-to-r from-[#A75F55] via-[#A75F55] to-[#A75F55] rounded-2xl p-6 text-white">
                  <p className="text-sm opacity-80 mb-1">Welcome back 👋</p>
                  <h1 className="text-3xl font-bold">{user?.Name?.split(' ')[0] || 'User'}</h1>
                  <p className="text-sm opacity-70 mt-1">Here's a quick overview of your account activity.</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'text-purple-500 bg-purple-50' },
                    { label: 'Total Spent', value: `₹${totalSpent.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-teal-500 bg-teal-50' },
                    { label: 'Pending Orders', value: pendingOrders, icon: Clock, color: 'text-amber-500 bg-amber-50' },
                    // { label: 'Wishlist', value: wishlist.length, icon: Heart, color: 'text-pink-500 bg-pink-50' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-2xl shadow-sm p-5">
                      <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                        <stat.icon size={20} />
                      </div>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Quick actions */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                  <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { label: 'Edit Profile', icon: User, color: 'bg-blue-50 text-blue-500', tab: 'profile' as TabId },
                      { label: 'Addresses', icon: MapPin, color: 'bg-green-50 text-green-500', tab: 'addresses' as TabId },
                      { label: 'My Orders', icon: ShoppingBag, color: 'bg-purple-50 text-purple-500', tab: 'orders' as TabId },
                      // { label: 'Wishlist', icon: Heart, color: 'bg-pink-50 text-pink-500', tab: 'wishlist' as TabId },
                    ].map(action => (
                      <button key={action.label} onClick={() => setTab(action.tab)}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-100 hover:border-gray-200 transition-colors">
                        <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
                          <action.icon size={18} />
                        </div>
                        <span className="text-xs font-medium text-gray-700">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent orders */}
                {orders.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900">Recent Orders</h3>
                      <button onClick={() => setTab('orders')} className="text-sm text-purple-600 font-medium hover:underline">View All</button>
                    </div>
                    <div className="space-y-3">
                      {orders.slice(0, 3).map(o => (
                        <div key={o._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{o.orderId}</p>
                            <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                            <p className="font-bold text-gray-900 text-sm mt-0.5">₹{o.payAmt?.toFixed(0)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* My Profile */}
            {tab === 'profile' && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                    {user?.Name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{user?.Name}</h2>
                    <p className="text-gray-500 text-sm">{user?.Email}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                    <input value={editForm.Name} onChange={e => setEditForm((p: any) => ({ ...p, Name: e.target.value }))}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                    <input value={user?.Email || ''} disabled
                      className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
                    <input value={editForm.ContactNumber} onChange={e => setEditForm((p: any) => ({ ...p, ContactNumber: e.target.value }))}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 text-sm" />
                  </div>
                  <button onClick={handleSaveProfile} disabled={savingProfile}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Addresses */}
            {tab === 'addresses' && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-5">Saved Addresses</h2>
                {orders.length > 0 ? (
                  <div className="space-y-3">
                    {[...new Map(
                      orders.filter(o => o.shipping).map(o => [o.shipping.addressLine, o.shipping])
                    ).values()].map((addr: any, i: number) => (
                      <div key={i} className="border-2 border-gray-100 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Home size={18} className="text-green-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-gray-900">{addr.name}</span>
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase">{addr.addressType}</span>
                            </div>
                            <p className="text-sm text-gray-600">{addr.addressLine}, {addr.city}, {addr.state} — {addr.postCode}</p>
                            {addr.mobileNumber && <p className="text-xs text-gray-400 mt-1">📱 {addr.mobileNumber}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <MapPin size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No saved addresses yet</p>
                    <p className="text-sm mt-1">Addresses will appear here after your first order</p>
                  </div>
                )}
              </div>
            )}

            {/* Wishlist */}
            {tab === 'wishlist' && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-5">My Wishlist ({wishlist.length})</h2>
                {wishlist.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wishlist.map((item: any) => (
                      <Link key={item._id} href={`/product/${item._id}`}
                        className="flex gap-3 p-3 border border-gray-100 rounded-2xl hover:border-purple-200 hover:shadow-sm transition-all">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                          {item.ProductMainImage?.url
                            ? <Image src={item.ProductMainImage.url} alt={item.product_name} fill className="object-cover" sizes="64px" />
                            : <div className="w-full h-full flex items-center justify-center text-2xl">🌶</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{item.product_name}</p>
                          <p className="text-[#81190B] font-bold text-sm">₹{item.afterDiscountPrice || item.price}</p>
                        </div>
                        <Heart size={16} className="text-pink-500 fill-pink-500 flex-shrink-0 mt-1" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Heart size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No items in wishlist</p>
                    <Link href="/shop" className="text-purple-600 font-semibold text-sm mt-2 inline-block hover:underline">Browse Products →</Link>
                  </div>
                )}
              </div>
            )}

            {/* Order History */}
            {tab === 'orders' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Order History</h2>
                  <span className="text-sm text-gray-400">{orders.length} orders</span>
                </div>
                {orders.length > 0 ? (
                  orders.map(o => (
                    <div key={o._id} className="bg-white rounded-2xl shadow-sm p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-gray-900">{o.orderId}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>
                          {o.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          {o.items?.length} item(s) · <span className={`font-semibold ${o.paymentType === 'ONLINE' ? 'text-blue-600' : 'text-orange-600'}`}>{o.paymentType}</span>
                        </p>
                        <p className="font-bold text-[#81190B]">₹{o.payAmt?.toFixed(0)}</p>
                      </div>
                      {o.shipping && (
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <MapPin size={11} /> {o.shipping.city}, {o.shipping.state}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400">
                    <Package size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-medium">No orders yet</p>
                    <Link href="/shop" className="text-purple-600 font-semibold text-sm mt-2 inline-block hover:underline">Start Shopping →</Link>
                  </div>
                )}
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
