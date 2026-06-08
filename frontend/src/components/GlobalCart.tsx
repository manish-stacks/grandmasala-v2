'use client';
import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import CartSidebar from './CartSidebar';
import CheckoutModal from './CheckoutModal';

export default function GlobalCart() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { sidebarOpen } = useAppSelector(s => s.cart);

  if (!sidebarOpen && !checkoutOpen) return null;

  return (
    <>
      {sidebarOpen && (
        <CartSidebar onCheckout={() => setCheckoutOpen(true)} />
      )}
      {checkoutOpen && (
        <CheckoutModal onClose={() => setCheckoutOpen(false)} />
      )}
    </>
  );
}
