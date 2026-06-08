'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Grid, List, ShoppingCart, Star, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { addToCart } from '@/store/slices/cartSlice';
import { toast } from 'react-toastify';

const seededRandom = (s: string) => { let h=0; for(let i=0;i<s.length;i++){h=(h<<5)-h+s.charCodeAt(i);h|=0;} return Math.abs(h); };

export default function ShopClient({ initialProducts, initialCategories }: { initialProducts: any[]; initialCategories: any[] }) {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const [priceRange, setPriceRange] = useState('all');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const categories = ['All', ...initialCategories.map((c: any) => c.name)];

  const filtered = useMemo(() => {
    let p = [...products];
    if (search) p = p.filter(x => x.product_name?.toLowerCase().includes(search.toLowerCase()));
    if (selectedCategory !== 'All') p = p.filter(x => x.category?.name === selectedCategory);
    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number);
      p = p.filter(x => {
        const price = x.Varient?.[0]?.price_after_discount || x.afterDiscountPrice || x.price || 0;
        return max ? price >= min && price <= max : price >= min;
      });
    }
    if (sortBy === 'price-low') p.sort((a,b) => (a.Varient?.[0]?.price_after_discount||a.price) - (b.Varient?.[0]?.price_after_discount||b.price));
    if (sortBy === 'price-high') p.sort((a,b) => (b.Varient?.[0]?.price_after_discount||b.price) - (a.Varient?.[0]?.price_after_discount||a.price));
    if (sortBy === 'discount') p.sort((a,b) => (b.discount||0) - (a.discount||0));
    return p;
  }, [products, search, selectedCategory, sortBy, priceRange]);

  const handleAddToCart = (product: any) => {
    const vid = selectedVariants[product._id];
    const variant = product.Varient?.find((v: any) => v._id === vid) || product.Varient?.[0];
    const price = variant?.price_after_discount || product.afterDiscountPrice || product.price;
    dispatch(addToCart({ product: product._id, product_name: product.product_name, price: Number(price), quantity: 1, image: product.ProductMainImage?.url, variantId: variant?._id, size: variant?.quantity }));
    toast.success(`${product.product_name} added to cart! 🛒`);
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA]">
      {/* Banner */}
      <div className="relative bg-[#81190B] text-white py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">Our Spice Collection</h1>
        <p className="text-white/80">100% Pure · Handmade · No Preservatives</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-8 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search spices..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#81190B] text-sm" />
          </div>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#81190B] text-sm bg-white">
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={priceRange} onChange={e => setPriceRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#81190B] text-sm bg-white">
            <option value="all">All Prices</option>
            <option value="0-200">Under ₹200</option>
            <option value="200-500">₹200 – ₹500</option>
            <option value="500-1000">₹500 – ₹1000</option>
            <option value="1000">₹1000+</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#81190B] text-sm bg-white">
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="discount">Biggest Discount</option>
          </select>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode==='grid' ? 'bg-[#81190B] text-white' : 'bg-gray-100'}`}><Grid size={18}/></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode==='list' ? 'bg-[#81190B] text-white' : 'bg-gray-100'}`}><List size={18}/></button>
          </div>
        </div>

        <p className="text-gray-500 text-sm mb-4">{filtered.length} products found</p>

        {filtered.length === 0 ? (
          <div className="text-center py-20"><p className="text-2xl mb-2">🌶</p><p className="text-gray-500">No products found. Try a different filter.</p></div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6' : 'space-y-4'}>
            {filtered.map(product => {
              const vid = selectedVariants[product._id];
              const variant = product.Varient?.find((v: any) => v._id === vid) || product.Varient?.[0];
              const price = variant?.price_after_discount || product.afterDiscountPrice || product.price;
              const origPrice = variant?.price || product.price;
              const rating = (seededRandom(product._id + 'r') % 2) + 4;
              const reviews = (seededRandom(product._id + 'rv') % 451) + 50;
              const disc = variant?.discount_percentage || product.discount || 0;

              if (viewMode === 'list') return (
                <div key={product._id} className="bg-white rounded-2xl shadow-sm p-4 flex gap-4 items-center hover:shadow-md transition-shadow">
                  <Link href={`/product/${product._id}`} className="flex-shrink-0">
                    {product.ProductMainImage?.url
                      ? <Image src={product.ProductMainImage.url} alt={product.product_name} width={100} height={100} className="rounded-xl object-cover w-24 h-24" />
                      : <div className="w-24 h-24 bg-[#F4F1EA] rounded-xl flex items-center justify-center text-3xl">🌶</div>}
                  </Link>
                  <div className="flex-1">
                    <Link href={`/product/${product._id}`}><h3 className="font-bold text-gray-900 hover:text-[#81190B]">{product.product_name}</h3></Link>
                    <div className="flex items-center my-1">{[...Array(5)].map((_,i) => <Star key={i} size={12} className={i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />)}<span className="text-xs text-gray-400 ml-1">({reviews})</span></div>
                    <p className="text-gray-500 text-sm line-clamp-1">{product.product_description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-[#81190B]">₹{Number(price).toFixed(0)}</p>
                    {origPrice > price && <p className="text-sm text-gray-400 line-through">₹{origPrice}</p>}
                    <button onClick={() => handleAddToCart(product)} className="mt-2 bg-[#81190B] text-white px-4 py-2 rounded-xl text-sm hover:bg-[#5a1008] transition-colors flex items-center gap-1"><ShoppingCart size={14}/>Add to Cart</button>
                  </div>
                </div>
              );

              return (
                <div key={product._id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <Link href={`/product/${product._id}`}>
                    <div className="relative h-56 overflow-hidden bg-[#F4F1EA]">
                      {product.ProductMainImage?.url
                        ? <Image src={product.ProductMainImage.url} alt={product.product_name} fill className="object-cover p-2 group-hover:scale-105 transition-transform duration-500" sizes="25vw" />
                        : <div className="w-full h-full flex items-center justify-center text-5xl">🌶</div>}
                      {disc > 0 && <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{disc}% OFF</span>}
                    </div>
                  </Link>
                  <div className="p-4">
                    <p className="text-xs text-gray-400 font-medium mb-1">GRAND MASALA</p>
                    <Link href={`/product/${product._id}`}><h3 className="font-bold text-gray-900 group-hover:text-[#81190B] transition-colors truncate">{product.product_name}</h3></Link>
                    <div className="flex items-center my-2">{[...Array(5)].map((_,i) => <Star key={i} size={12} className={i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />)}<span className="text-xs text-gray-400 ml-1">({reviews})</span></div>
                    {product.isVarient && product.Varient?.length > 0 && (
                      <div className="relative mb-3">
                        <select value={vid || product.Varient[0]?._id} onChange={e => setSelectedVariants(p => ({...p,[product._id]:e.target.value}))}
                          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#81190B] appearance-none">
                          {product.Varient.map((v: any) => <option key={v._id} value={v._id}>Size {v.quantity} – ₹{v.price_after_discount}{v.discount_percentage > 0 ? ` (${v.discount_percentage}% off)` : ''}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-gray-900">₹{Number(price).toFixed(0)}</span>
                        {origPrice > price && <span className="text-sm text-gray-400 line-through ml-1">₹{origPrice}</span>}
                      </div>
                      <button onClick={() => handleAddToCart(product)} className="bg-[#81190B] text-white p-2 rounded-xl hover:bg-[#5a1008] transition-colors"><ShoppingCart size={16}/></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
