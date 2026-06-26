'use client';
import React, { useState } from 'react';
import { ShoppingCart, Truck, RotateCcw, Plus, Minus, ChevronLeft, ChevronRight, Star, Leaf, ShieldCheck, FlaskConical, Wheat, BadgeCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { addToCart } from '@/store/slices/cartSlice';
import { toast } from 'react-toastify';
import ProductStaticSections from './ProductStaticSections';
import ZoomableImage from './ZoomableImage';


export default function ProductDetailClient({ product }: { product: any }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const images = [
    product.ProductMainImage?.url, product.SecondImage?.url, product.ThirdImage?.url,
    product.FourthImage?.url, product.FifthImage?.url,
  ].filter(Boolean);

  const currentVariant = product.isVarient ? product.Varient?.[selectedVariant] : null;
  const price = currentVariant?.price_after_discount || product.afterDiscountPrice || product.price;
  const origPrice = currentVariant?.price || product.price;
  const disc = currentVariant?.discount_percentage || product.discount || 0;

  const handleAddToCart = () => {
    if (product.isVarient && !currentVariant) { toast.error('Please select a variant'); return; }
    dispatch(addToCart({ product: product._id, product_name: product.product_name, price: Number(price), quantity, image: images[0], variantId: currentVariant?._id, size: currentVariant?.quantity }));
    toast.success(`${product.product_name} added to cart! 🛒`);
  };

  const handleBuyNow = () => { handleAddToCart(); router.push('/cart'); };

  const canBuy = !product.isVarient || !!currentVariant;

  return (
    <div className="min-h-screen bg-white pb-28 lg:pb-24">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 pt-4 text-sm text-gray-500">
        <Link href="/" className="hover:text-[#81190B]">Home</Link> / <span className="text-[#81190B]">{product.product_name}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Images */}
          <div>
            <div className="relative h-[650px] sm:h-[500px] bg-[#ffffff] rounded-2xl overflow-hidden border border-[#E8DCCB]">
              {disc > 0 && (
                <div className="absolute top-3 left-3 z-20 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                  {disc}% OFF
                </div>
              )}
              {images[selectedImage] ? (
                <ZoomableImage src={images[selectedImage]} alt={product.product_name} />
              ) : <div className="w-full h-full flex items-center justify-center text-8xl">🌶️</div>}
              {images.length > 1 && (
                <>
                  <button onClick={() => setSelectedImage(p => Math.max(0, p - 1))} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/80 rounded-full shadow hover:bg-white"><ChevronLeft size={18} /></button>
                  <button onClick={() => setSelectedImage(p => Math.min(images.length - 1, p + 1))} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/80 rounded-full shadow hover:bg-white"><ChevronRight size={18} /></button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 mt-4">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)} className={`flex-shrink-0 w-28 h-28 rounded-lg overflow-hidden border-2 ${selectedImage === i ? 'border-[#81190B]' : 'border-[#E8DCCB]'}`}>
                    <Image src={img} alt="" width={100} height={100} className="object-cover w-full h-full" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">{product.product_name}</h1>

            {/* Hindi tagline — swap per-product copy here if you want something more specific */}
            <p className="text-amber-700 text-sm">शुद्ध भारतीय मसाले का स्वाद</p>

            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />)}
              <span className="text-gray-500 text-sm">400+ reviews</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full"><BadgeCheck size={13} /> Lab Tested</span>
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full"><BadgeCheck size={13} /> 100% Natural</span>
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full"><BadgeCheck size={13} /> Chemical Free</span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <span className="text-3xl font-bold text-amber-700">₹{Number(price).toFixed(0)}</span>
              {origPrice > price && (
                <>
                  <span className="text-lg text-gray-400 line-through">₹{origPrice}</span>
                  <span className="bg-[#81190B] text-white text-xs font-bold px-2 py-1 rounded-full">{disc}% OFF</span>
                </>
              )}
            </div>

            {product.isVarient && product.Varient?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {product.Varient.map((v: any, i: number) => (
                    <button key={v._id} onClick={() => setSelectedVariant(i)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${selectedVariant === i ? 'bg-[#81190B] text-white' : 'bg-amber-500 text-white hover:bg-amber-600'}`}>
                      {v.quantity}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Quantity</h3>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity(p => Math.max(1, p - 1))} className="w-10 h-10 rounded-xl border border-gray-300 flex items-center justify-center hover:bg-gray-50"><Minus size={16} /></button>
                <span className="text-xl font-semibold min-w-8 text-center">{quantity}</span>
                <button onClick={() => setQuantity(p => p + 1)} className="w-10 h-10 rounded-xl border border-gray-300 flex items-center justify-center hover:bg-gray-50"><Plus size={16} /></button>
              </div>
            </div>

            {/* CTAs — brand colors: maroon outline for Add to Cart, amber fill for Buy Now */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button onClick={handleAddToCart} disabled={!canBuy}
                className="flex-1 bg-[#81190B] hover:bg-[#5a1008] text-white font-semibold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                <ShoppingCart size={18} /> Add to Cart
              </button>
              <button onClick={handleBuyNow} disabled={!canBuy}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                Buy Now
              </button>
            </div>

            {/* Trust icon grid — Bilona-style 4-up row from the reference, reworded for spices */}
            <div className="grid grid-cols-1 pt-5 w-full">
             <img src="/images/trust-icon.png" alt="Trust Icon" className="w-full" />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#E8DCCB] text-sm text-gray-600">
              <div className="flex items-center gap-2"><Truck size={16} className="text-[#81190B]" />Free delivery ₹299+</div>
              <div className="flex items-center gap-2"><RotateCcw size={16} className="text-[#81190B]" />Easy returns</div>
              <div className="flex items-center gap-2"><span>🌿</span> No Preservatives</div>
              <div className="flex items-center gap-2"><span>📦</span> Dispatched in 24 hours</div>
            </div>
          </div>
        </div>

        {/* Description */}
        {(product.product_description || product.extra_description) && (
          <div className="border-t border-[#E8DCCB] mt-8 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Description</h2>
            {product.product_description && <p className="text-gray-700 leading-relaxed mb-3">{product.product_description}</p>}
            {product.extra_description && <p className="text-gray-700 leading-relaxed">{product.extra_description}</p>}
          </div>
        )}
      </div>

      {/* Static marketing sections: process, comparisons, benefits, reviews, FAQ */}
      <ProductStaticSections productId={product._id} />

      {/* Sticky buy bar — mobile + desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E8DCCB] shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="hidden sm:block flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-[#F4F1EA] relative">
            {images[0] && <Image src={images[0]} alt={product.product_name} fill className="object-contain p-1" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate hidden sm:block">{product.product_name}</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-amber-700">₹{Number(price).toFixed(0)}</span>
              {origPrice > price && <span className="text-sm text-gray-400 line-through">₹{origPrice}</span>}
            </div>
          </div>
          <button onClick={handleAddToCart} disabled={!canBuy}
            className="flex items-center justify-center gap-2 border-2 border-[#81190B] text-[#81190B] font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 hover:bg-red-50">
            <ShoppingCart size={16} />
            <span className="hidden sm:inline">Add to Cart</span>
          </button>
          <button onClick={handleBuyNow} disabled={!canBuy}
            className="flex-shrink-0 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors disabled:opacity-50">
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}