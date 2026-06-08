'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Package, Users, ShoppingCart, BarChart3, Settings,
  HelpCircle, LogOut, ChevronDown, Plus, Layers, Bell, FileText,
  PercentDiamond, Image as ImageIcon, BookOpen, MessageSquare,
  Menu, X, PackageOpen, ChevronRight, ExternalLink,
} from 'lucide-react';

const MENU = [
  { title: 'Dashboard',     icon: LayoutDashboard, path: '/admin' },
  { title: 'Products',      icon: Package,         submenu: [
    { title: 'Create Product', path: '/admin/products/create', icon: Plus },
    { title: 'All Products',   path: '/admin/products',        icon: Layers },
  ]},
  { title: 'Categories',    icon: PackageOpen,     path: '/admin/categories' },
  { title: 'Orders',        icon: ShoppingCart,    path: '/admin/orders' },
  { title: 'Users',         icon: Users,           path: '/admin/users' },
  { title: 'Blogs',         icon: BookOpen,        submenu: [
    { title: 'Create Blog', path: '/admin/blogs/create', icon: Plus },
    { title: 'All Blogs',   path: '/admin/blogs',        icon: Layers },
  ]},
  { title: 'Coupons',       icon: PercentDiamond,  path: '/admin/coupons' },
  { title: 'Reports',       icon: BarChart3,       path: '/admin/reports' },
  { title: 'Announcements', icon: Bell,            path: '/admin/announcements' },
  { title: 'Pages',         icon: FileText,        path: '/admin/pages' },
  { title: 'Hero Section',  icon: ImageIcon,       path: '/admin/hero' },
  { title: 'About Us',      icon: MessageSquare,   path: '/admin/about' },
  { title: 'Support',       icon: HelpCircle,      path: '/admin/support' },
  { title: 'Settings',      icon: Settings,        path: '/admin/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [sidebarOpen,       setSidebarOpen]       = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [expanded,          setExpanded]          = useState<Record<string, boolean>>({});
  const [adminUser,         setAdminUser]         = useState<{ name: string; email: string } | null>(null);
  const [authChecked,       setAuthChecked]       = useState(false);

  // ── Auth check ────────────────────────────────────────────
  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    if (!token) { router.replace('/admin-login'); return; }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/my-details`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (!data.data || data.data.Role !== 'Admin') {
          sessionStorage.removeItem('admin_token');
          router.replace('/admin-login');
          return;
        }
        setAdminUser({ name: data.data.Name || 'Admin', email: data.data.Email });
        setAuthChecked(true);
      })
      .catch(() => router.replace('/admin-login'));
  }, [router]);

  // Auto-expand active submenu
  useEffect(() => {
    MENU.forEach(item => {
      if (item.submenu?.some(s => pathname.startsWith(s.path))) {
        setExpanded(p => ({ ...p, [item.title]: true }));
      }
    });
  }, [pathname]);

  const logout = () => {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('token_login');
    router.push('/admin-login');
  };

  // Loading while verifying
  if (!authChecked) return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 border-[3px] border-amber-400 border-t-transparent rounded-full animate-spin" />
      <p className="text-amber-400 text-sm font-medium">Verifying admin access...</p>
    </div>
  );

  // ── Sidebar content ───────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={`flex-shrink-0 border-b border-gray-700/60 ${sidebarOpen ? 'p-4' : 'p-3'}`}>
        {sidebarOpen ? (
          <div>
            <p className="text-amber-400 font-bold leading-tight">Grand Masala</p>
            <p className="text-gray-500 text-xs mt-0.5">Admin Panel</p>
          </div>
        ) : (
          <div className="flex justify-center text-xl">🌶</div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {MENU.map(item => (
          <div key={item.title}>
            {item.submenu ? (
              <>
                <button
                  onClick={() => setExpanded(p => ({ ...p, [item.title]: !p[item.title] }))}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm
                    ${item.submenu.some(s => pathname.startsWith(s.path))
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:bg-gray-700/60 hover:text-white'}`}
                >
                  <item.icon size={17} className="flex-shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left font-medium">{item.title}</span>
                      <ChevronDown size={13} className={`transition-transform duration-200 ${expanded[item.title] ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>
                {expanded[item.title] && sidebarOpen && (
                  <div className="ml-6 mt-0.5 border-l border-gray-700 pl-3 space-y-0.5">
                    {item.submenu.map(sub => (
                      <Link key={sub.path} href={sub.path}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                          ${pathname === sub.path
                            ? 'bg-amber-600 text-white font-semibold'
                            : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                      >
                        <sub.icon size={13} />{sub.title}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link href={item.path!}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${pathname === item.path
                    ? 'bg-amber-600 text-white'
                    : 'text-gray-400 hover:bg-gray-700/60 hover:text-white'}`}
              >
                <item.icon size={17} className="flex-shrink-0" />
                {sidebarOpen && <span>{item.title}</span>}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="flex-shrink-0 border-t border-gray-700/60 p-2 space-y-1">
        {sidebarOpen && adminUser && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-700/40">
            <div className="w-7 h-7 bg-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{adminUser.name[0]?.toUpperCase()}</span>
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-white text-xs font-semibold truncate">{adminUser.name}</p>
              <p className="text-gray-400 text-xs truncate">{adminUser.email}</p>
            </div>
          </div>
        )}
        <button onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors ${!sidebarOpen ? 'justify-center' : ''}`}>
          <LogOut size={17} />
          {sidebarOpen && 'Logout'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col flex-shrink-0 bg-gray-900 text-white transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-[60px]'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="relative w-60 bg-gray-900 text-white flex flex-col z-10 shadow-2xl">
            <button onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-3 right-3 p-1.5 bg-gray-700 rounded-lg text-gray-400 hover:text-white z-10">
              <X size={15} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top navbar */}
        <header className="bg-white border-b border-gray-200 px-4 flex items-center justify-between h-14 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <Menu size={19} />
            </button>
            <button onClick={() => setSidebarOpen(p => !p)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <Menu size={19} />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500">
              <span>Admin</span>
              <ChevronRight size={13} />
              <span className="text-gray-900 font-semibold capitalize">
                {pathname === '/admin' ? 'Dashboard' : pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a href="/" target="_blank" rel="noopener"
              className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors">
              View Site <ExternalLink size={11} />
            </a>
            {adminUser && (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5">
                <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{adminUser.name[0]?.toUpperCase()}</span>
                </div>
                <span className="hidden sm:block text-xs font-semibold text-gray-800">{adminUser.name}</span>
              </div>
            )}
            <button onClick={logout}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Logout">
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
