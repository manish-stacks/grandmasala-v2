'use client';
import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
  { id:1, name:'Krishan Gupta', title:'Taste That Feels Like Home', review:'Using Grand Masala Haldi makes my meals comforting. The quality and purity are outstanding.', product:'Haldi – 100% Natural', gender:'M' },
  { id:2, name:'Aehmad', title:'Pure Aroma, Authentic Taste!', review:'The Garam Masala gives my cooking a rich, authentic flavor. The freshness is remarkable.', product:'Garam Masala – 100% Natural', gender:'M' },
  { id:3, name:'Anish Patel', title:'Perfect Balance of Heat & Flavor', review:'Grand Masala Lal Mirch has the right spice level without losing its authentic taste.', product:'Lal Mirch – 100% Natural', gender:'F' },
  { id:4, name:'Rajendra Singh', title:'Freshness You Can Smell', review:'The Dhania powder is so aromatic and fresh, it transforms my curries instantly.', product:'Dhania – 100% Natural', gender:'M' },
  { id:5, name:'Safaraz', title:'Authentic Flavor Every Time', review:'I\'ve tried many spice brands, but nothing comes close to the authentic flavor of Grand Masala.', product:'Grand Masala Pack', gender:'F' },
  { id:6, name:'Imrana Ansari', title:'Consistent Quality', review:'Grand Masala has always been my go-to for consistent quality and amazing flavor.', product:'Commercial Pack', gender:'M' },
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [perSlide, setPerSlide] = useState(3);

  useEffect(() => {
    const check = () => setPerSlide(window.innerWidth < 768 ? 1 : 3);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCurrent(p => (p + 1) % Math.ceil(testimonials.length / perSlide)), 5000);
    return () => clearInterval(t);
  }, [perSlide]);

  const visible = testimonials.slice(current * perSlide, current * perSlide + perSlide);
  const totalPages = Math.ceil(testimonials.length / perSlide);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-2"><div className="w-16 h-1 bg-[#81190B]" /></div>
          <h2 className="text-3xl lg:text-4xl font-black text-[#81190B]">What Our Customers Say</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {visible.map(t => (
            <div key={t.id} className="bg-[#F4F1EA] rounded-2xl p-6 shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-[#81190B] flex items-center justify-center text-white font-bold text-lg mr-3">
                  {t.name[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{t.name}</p>
                  <div className="flex">{[...Array(5)].map((_,i) => <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />)}</div>
                </div>
              </div>
              <h3 className="font-semibold text-[#81190B] mb-2">{t.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{t.review}</p>
              <p className="text-xs text-gray-400 mt-3">📦 {t.product}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center items-center gap-4">
          <button onClick={() => setCurrent(p => Math.max(0, p-1))} className="p-2 rounded-full bg-[#F4F1EA] hover:bg-[#81190B] hover:text-white transition-colors"><ChevronLeft size={20} /></button>
          <div className="flex gap-2">
            {[...Array(totalPages)].map((_,i) => <button key={i} onClick={() => setCurrent(i)} className={`w-2 h-2 rounded-full transition-colors ${i===current ? 'bg-[#81190B]' : 'bg-gray-300'}`} />)}
          </div>
          <button onClick={() => setCurrent(p => Math.min(totalPages-1, p+1))} className="p-2 rounded-full bg-[#F4F1EA] hover:bg-[#81190B] hover:text-white transition-colors"><ChevronRight size={20} /></button>
        </div>
      </div>
    </section>
  );
}
