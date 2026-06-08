import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './slices/cartSlice';
import checkoutReducer from './slices/checkoutSlice';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    checkout: checkoutReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
