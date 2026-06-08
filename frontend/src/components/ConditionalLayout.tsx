'use client';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // No Header/Footer on:
  // 1. /admin/* — has its own sidebar/navbar
  // 2. /admin-login — standalone dark page
  const noLayout = pathname?.startsWith('/admin') || pathname === '/admin-login';

  if (noLayout) return <>{children}</>;

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
