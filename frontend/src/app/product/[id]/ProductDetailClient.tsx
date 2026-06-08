'use client';
import React, { useState } from 'react';
import { ShoppingCart, Truck, RotateCcw, Plus, Minus, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { addToCart } from '@/store/slices/cartSlice';
import { toast } from 'react-toastify';

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

  return (
    <div className="min-h-screen bg-[#F4F1EA]">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
          <Link href="/" className="hover:text-[#81190B]">Home</Link> / <Link href="/shop" className="hover:text-[#81190B]">Shop</Link> / <span className="text-[#81190B]">{product.product_name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Images */}
            <div className="p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-gray-100">
              <div className="relative h-96 bg-[#F4F1EA] rounded-2xl overflow-hidden mb-4">
                {images[selectedImage] ? (
                  <Image src={images[selectedImage]} alt={product.product_name} fill className="object-contain p-4" sizes="(max-width:1024px) 100vw, 50vw" priority />
                ) : <div className="w-full h-full flex items-center justify-center text-8xl">🌶</div>}
                {images.length > 1 && (
                  <>
                    <button onClick={() => setSelectedImage(p => Math.max(0, p-1))} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow hover:bg-white"><ChevronLeft size={18}/></button>
                    <button onClick={() => setSelectedImage(p => Math.min(images.length-1, p+1))} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow hover:bg-white"><ChevronRight size={18}/></button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setSelectedImage(i)} className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${selectedImage===i ? 'border-[#81190B]' : 'border-gray-200'}`}>
                      <Image src={img} alt="" width={64} height={64} className="object-cover w-full h-full" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-6 lg:p-8 space-y-5">
              {product.category?.name && <p className="text-[#81190B] font-medium text-sm uppercase tracking-wide">{product.category.name}</p>}
              <h1 className="text-3xl font-bold text-gray-900">{product.product_name}</h1>

              <div className="flex items-center gap-2">
                {[...Array(5)].map((_,i) => <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />)}
                <span className="text-gray-500 text-sm">(400+ reviews)</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-gray-900">₹{Number(price).toFixed(0)}</span>
                {origPrice > price && <><span className="text-xl text-gray-400 line-through">₹{origPrice}</span><span className="bg-red-100 text-red-700 text-sm font-semibold px-2 py-1 rounded">{disc}% OFF</span></>}
              </div>

              {product.isVarient && product.Varient?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Select Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.Varient.map((v: any, i: number) => (
                      <button key={v._id} onClick={() => setSelectedVariant(i)}
                        className={`px-4 py-2 rounded-xl border-2 font-medium transition-all ${selectedVariant===i ? 'border-[#81190B] bg-red-50 text-[#81190B]' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}>
                        {v.quantity}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Quantity</h3>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantity(p => Math.max(1, p-1))} className="w-10 h-10 rounded-xl border border-gray-300 flex items-center justify-center hover:bg-gray-50"><Minus size={16}/></button>
                  <span className="text-xl font-semibold min-w-8 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(p => p+1)} className="w-10 h-10 rounded-xl border border-gray-300 flex items-center justify-center hover:bg-gray-50"><Plus size={16}/></button>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={handleAddToCart} disabled={product.isVarient && !currentVariant}
                  className="flex-1 bg-[#81190B] hover:bg-[#5a1008] text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  <ShoppingCart size={18}/> Add to Cart
                </button>
                <button onClick={handleBuyNow} disabled={product.isVarient && !currentVariant}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  Buy Now
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600"><Truck size={16} className="text-[#81190B]"/>Free delivery ₹299+</div>
                <div className="flex items-center gap-2 text-sm text-gray-600"><RotateCcw size={16} className="text-[#81190B]"/>Easy returns</div>
                <div className="flex items-center gap-2 text-sm text-gray-600"><span>✅</span> FSSC 22000 Certified</div>
                <div className="flex items-center gap-2 text-sm text-gray-600"><span>🌿</span> No Preservatives</div>
              </div>
            </div>
          </div>

          {/* Description */}
          {(product.product_description || product.extra_description) && (
            <div className="border-t border-gray-100 p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Description</h2>
              {product.product_description && <p className="text-gray-700 leading-relaxed mb-3">{product.product_description}</p>}
              {product.extra_description && <p className="text-gray-700 leading-relaxed">{product.extra_description}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
