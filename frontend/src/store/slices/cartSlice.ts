import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE } from '@/lib/api';

export interface CartItem {
  product: string;
  product_name: string;
  price: number;
  quantity: number;
  image?: string;
  variantId?: string;
  size?: string;
}

interface CartState {
  cartItems: CartItem[];
  savedItems: CartItem[];
  promoCode: string;
  promoApplied: boolean;
  discountAmount: number;
  couponError: string;
  loading: boolean;
  sidebarOpen: boolean;   // NEW: cart sidebar state
}

const loadFromStorage = <T>(key: string, def: T): T => {
  if (typeof window === 'undefined') return def;
  try {
    const stored = sessionStorage.getItem(key);
    return stored ? JSON.parse(stored) : def;
  } catch { return def; }
};

export const applyPromoCode = createAsyncThunk(
  'cart/applyPromoCode',
  async ({ code, orderAmount }: { code: string; orderAmount: number }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(`${API_BASE}/apply-coupon`, { code, orderAmount });
      const couponData = {
        code, applied: true,
        discountAmount: data.discountAmount,
        originalAmount: orderAmount,
        finalAmount: data.finalAmount,
        offerId: data.appliedCoupon._id,
      };
      sessionStorage.setItem('appliedCoupon', JSON.stringify(couponData));
      return { code, discountAmount: data.discountAmount, finalAmount: data.finalAmount, offerId: data.appliedCoupon._id };
    } catch (error: any) {
      sessionStorage.removeItem('appliedCoupon');
      return rejectWithValue(error.response?.data?.message || 'Failed to apply coupon');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    cartItems: loadFromStorage<CartItem[]>('cartItems', []),
    savedItems: loadFromStorage<CartItem[]>('savedItems', []),
    promoCode: '',
    promoApplied: false,
    discountAmount: 0,
    couponError: '',
    loading: false,
    sidebarOpen: false,
  } as CartState,
  reducers: {
    openCartSidebar: (state) => { state.sidebarOpen = true; },
    closeCartSidebar: (state) => { state.sidebarOpen = false; },
    toggleCartSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },

    updateQuantity: (state, action: PayloadAction<{ id: string; newQuantity: number }>) => {
      const { id, newQuantity } = action.payload;
      if (newQuantity < 1) return;
      const item = state.cartItems.find(i => i.product === id);
      if (item) {
        item.quantity = newQuantity;
        sessionStorage.setItem('cartItems', JSON.stringify(state.cartItems));
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.cartItems = state.cartItems.filter(i => i.product !== action.payload);
      sessionStorage.setItem('cartItems', JSON.stringify(state.cartItems));
    },
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const newItem = action.payload;
      const existing = state.cartItems.find(
        i => i.product === newItem.product && i.variantId === newItem.variantId
      );
      if (existing) {
        existing.quantity += newItem.quantity || 1;
      } else {
        state.cartItems.push({ ...newItem, quantity: newItem.quantity || 1 });
      }
      sessionStorage.setItem('cartItems', JSON.stringify(state.cartItems));
      state.sidebarOpen = true; // Auto-open sidebar on add
    },
    clearCart: (state) => {
      state.cartItems = [];
      state.promoCode = '';
      state.promoApplied = false;
      state.discountAmount = 0;
      state.sidebarOpen = false;
      sessionStorage.removeItem('cartItems');
      sessionStorage.removeItem('appliedCoupon');
    },
    clearCoupon: (state) => {
      state.promoCode = '';
      state.promoApplied = false;
      state.discountAmount = 0;
      state.couponError = '';
      sessionStorage.removeItem('appliedCoupon');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(applyPromoCode.pending, (state) => { state.loading = true; state.couponError = ''; })
      .addCase(applyPromoCode.fulfilled, (state, action) => {
        state.loading = false;
        state.promoApplied = true;
        state.discountAmount = action.payload.discountAmount;
        state.promoCode = action.payload.code;
      })
      .addCase(applyPromoCode.rejected, (state, action) => {
        state.loading = false;
        state.couponError = action.payload as string;
        state.promoApplied = false;
      });
  },
});

export const {
  openCartSidebar, closeCartSidebar, toggleCartSidebar,
  updateQuantity, removeItem, addToCart, clearCart, clearCoupon
} = cartSlice.actions;
export default cartSlice.reducer;
