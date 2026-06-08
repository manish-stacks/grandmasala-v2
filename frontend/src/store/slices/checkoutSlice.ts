import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { API_BASE } from '@/lib/api';

export const fetchSettings = createAsyncThunk('checkout/fetchSettings', async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE}/admin/settings`);
    const data = await res.json();
    return data.data;
  } catch { return rejectWithValue('Failed to fetch settings'); }
});

export const createOrder = createAsyncThunk(
  'checkout/createOrder',
  async ({ orderData, token }: { orderData: any; token: string }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/add-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(orderData),
      });
      const result = await res.json();
      if (!res.ok || !result.success) return rejectWithValue(result.message || 'Failed to create order');
      if (result.razorpayOrderId) return result;
      sessionStorage.removeItem('cartItems');
      sessionStorage.removeItem('appliedCoupon');
      return result.order;
    } catch { return rejectWithValue('Failed to create order'); }
  }
);

interface Address {
  name: string; addressLine: string; city: string;
  state: string; postCode: string; addressType: string;
}

interface CheckoutState {
  currentStep: number; loading: boolean; error: string; success: boolean;
  settings: any; address: Address; paymentMethod: string;
  cartSubtotal: number; shipping: number; orderTotal: number;
  discountAmount: number; appliedCoupon: any; createdOrder: any;
}

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState: {
    currentStep: 1, loading: false, error: '', success: false,
    settings: {}, address: { name: '', addressLine: '', city: '', state: '', postCode: '', addressType: '' },
    paymentMethod: '', cartSubtotal: 0, shipping: 0, orderTotal: 0,
    discountAmount: 0, appliedCoupon: null, createdOrder: null,
  } as CheckoutState,
  reducers: {
    setCurrentStep: (s, a: PayloadAction<number>) => { s.currentStep = a.payload; },
    setError: (s, a: PayloadAction<string>) => { s.error = a.payload; },
    clearError: (s) => { s.error = ''; },
    updateAddress: (s, a: PayloadAction<Partial<Address>>) => { s.address = { ...s.address, ...a.payload }; },
    setPaymentMethod: (s, a: PayloadAction<string>) => { s.paymentMethod = a.payload; },
    calculateTotals: (s, a: PayloadAction<{ cartItems: any[]; appliedCoupon: any }>) => {
      const { cartItems, appliedCoupon } = a.payload;
      const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const freeThreshold = s.settings?.freeShippingThreshold || 299;
      const shippingCost = s.settings?.shippingCost || 0;
      const shipping = subtotal >= freeThreshold ? 0 : shippingCost;
      const discount = appliedCoupon?.discountAmount || 0;
      s.cartSubtotal = subtotal;
      s.shipping = shipping;
      s.discountAmount = discount;
      s.orderTotal = Math.max(0, subtotal + shipping - discount);
    },
    loadAppliedCoupon: (s) => {
      if (typeof window === 'undefined') return;
      const stored = sessionStorage.getItem('appliedCoupon');
      s.appliedCoupon = stored ? JSON.parse(stored) : null;
    },
    removeCoupon: (s) => {
      s.appliedCoupon = null;
      s.discountAmount = 0;
      if (typeof window !== 'undefined') sessionStorage.removeItem('appliedCoupon');
    },
    resetCheckout: (s) => {
      s.currentStep = 1; s.error = ''; s.success = false;
      s.paymentMethod = ''; s.createdOrder = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchSettings.fulfilled, (s, a) => { s.settings = a.payload; });
    b.addCase(createOrder.pending, (s) => { s.loading = true; s.error = ''; });
    b.addCase(createOrder.fulfilled, (s, a) => { s.loading = false; s.createdOrder = a.payload; s.success = true; });
    b.addCase(createOrder.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; });
  },
});

export const { setCurrentStep, setError, clearError, updateAddress, setPaymentMethod,
  calculateTotals, loadAppliedCoupon, removeCoupon, resetCheckout } = checkoutSlice.actions;
export default checkoutSlice.reducer;
