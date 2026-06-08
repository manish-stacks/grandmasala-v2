'use client';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import GlobalCart from './GlobalCart';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      {children}
      <GlobalCart />
      <ToastContainer position="top-right" autoClose={3000} />
    </Provider>
  );
}
