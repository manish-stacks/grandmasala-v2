'use client';
import React, { useState } from 'react';
import { ShoppingCart, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAppDispatch } from '@/store/hooks';
import { addToCart, openCartSidebar } from '@/store/slices/cartSlice';
import { toast } from 'react-toastify';

const seededRandom = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) { hash = (hash << 5) - hash + seed.charCodeAt(i); hash |= 0; }
  return Math.abs(hash);
};

export default function FeaturedProducts({ initialProducts }: { initialProducts: any[] }) {
  // console.log("initialProducts", initialProducts)
  const dispatch = useAppDispatch();
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const getVariant = (product: any) => {
    const id = selectedVariants[product._id];
    return product.Varient?.find((v: any) => v._id === id) || product.Varient?.[0];
  };

  const handleAddToCart = (product: any) => {
    const variant = getVariant(product);
    const price = variant ? variant.price_after_discount : product.afterDiscountPrice || product.price;
    dispatch(addToCart({
      product: product._id,
      product_name: product.product_name,
      price: Number(price),
      quantity: 1,
      image: product.ProductMainImage?.url,
      variantId: variant?._id,
      size: variant?.quantity,
    }));
    toast.success(`${product.product_name} added to cart!`);
  };

  if (!initialProducts.length) return null;

  return (
    <section className="py-16 bg-[#F4F1EA]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-2 rounded-full bg-[#FFF3E5] text-[#81190B] text-sm font-semibold mb-4">
            🌶 Premium Indian Spices
          </span>

          <h2 className="text-4xl md:text-5xl font-bold text-[#81190B]">
            Featured Products
          </h2>

          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Handpicked traditional spices crafted with purity, rich aroma,
            and authentic Indian taste.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {initialProducts.map((product) => {
            const variant = getVariant(product);
            const price = variant ? variant.price_after_discount : product.afterDiscountPrice || product.price;
            const originalPrice = variant ? variant.price : product.price;
            const rating = (seededRandom(product._id + 'rating') % 2) + 4;
            const reviews = (seededRandom(product._id + 'reviews') % 451) + 50;
            const disc = variant?.discount_percentage || product.discount || 0;
            return (
              <div
                key={product._id}
                className="group bg-white rounded-3xl overflow-hidden border border-[#E8DCCB] shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
              >
                <Link href={`/product/${product._id}`}>
                  <div className="relative h-64 bg-[#F4F1EA] overflow-hidden">

                    {/* Discount Badge */}
                    {disc > 0 && (
                      <div className="absolute top-3 left-3 z-20 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        {disc}% OFF
                      </div>
                    )}

                    {/* Premium Badge */}
                    <div className="absolute top-3 right-3 z-20 bg-[#C89B3C] text-white px-3 py-1 rounded-full text-xs font-semibold shadow">
                      Best Seller
                    </div>

                    {product.ProductMainImage?.url ? (
                      <Image
                        src={product.ProductMainImage.url}
                        alt={product.product_name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        🌶️
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                  </div>
                </Link>

                <div className="p-5">
                    <Link href={`/product/${product._id}`}>
                  {/* Product Name */}
                  <h3 className="font-bold text-lg text-[#81190B] line-clamp-2 min-h-[56px]">
                    {product.product_name}
                  </h3>
                  </Link>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={
                          i < rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }
                      />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">
                      ({reviews})
                    </span>
                  </div>

                  {/* Variant */}
                  {product.isVarient && product.Varient?.length > 0 && (
                    <select
                      value={
                        selectedVariants[product._id] ||
                        product.Varient[0]?._id
                      }
                      onChange={(e) =>
                        setSelectedVariants((p) => ({
                          ...p,
                          [product._id]: e.target.value,
                        }))
                      }
                      className="w-full mt-3 rounded-xl border border-[#E8DCCB] bg-[#FFF9F3] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#81190B]"
                    >
                      {product.Varient.map((v: any) => (
                        <option key={v._id} value={v._id}>
                          {v.quantity} - ₹{v.price_after_discount}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Price */}
                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-2xl font-bold text-[#81190B]">
                      ₹{Number(price).toFixed(0)}
                    </span>

                    {originalPrice > price && (
                      <>
                        <span className="text-sm text-gray-400 line-through">
                          ₹{originalPrice}
                        </span>

                        <span className="text-green-600 text-sm font-semibold">
                          Save ₹{(originalPrice - price).toFixed(0)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Add To Cart */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="mt-5 w-full flex items-center justify-center gap-2 bg-[#81190B] hover:bg-[#651307] text-white py-3 rounded-2xl font-semibold transition-all duration-300"
                  >
                    <ShoppingCart size={18} />
                    Add To Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-10">
          <Link href="/shop" className="inline-block bg-[#81190B] hover:bg-[#5a1008] text-white font-semibold py-3 px-10 rounded-xl transition-colors">
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
}
