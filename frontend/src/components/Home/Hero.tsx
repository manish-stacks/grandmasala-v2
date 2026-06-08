'use client';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

const SLIDES = [
  {
    id: 0,
    image: '/images/hero-1.png',

  },
  {
    id: 1,
    image: '/images/hero-2.png',

  }
];

const AUTOPLAY_MS = 5000;

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent(p => (p + 1) % SLIDES.length), []);
  const prev = useCallback(() => setCurrent(p => (p - 1 + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(next, AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [current, paused, next]);

  const slide = SLIDES[current];

  return (
    <section
      className="relative w-full overflow-hidden bg-[#f8f5f0]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative aspect-[1920/700] w-full">
        {SLIDES.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'
              }`}
          >
            <Image
              src={s.image}
              alt={`Banner ${i + 1}`}
              fill
              priority={i === 0}
              className="object-contain md:object-cover"
              sizes="100vw"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-black/5 to-[#81190B]/10" />
      </div>

      {/* Navigation */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20
    w-12 h-12 rounded-full bg-white/90 shadow-lg
    flex items-center justify-center hover:scale-110 transition"
      >
        <ChevronLeft size={22} className="text-[#81190B]" />
      </button>

      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20
    w-12 h-12 rounded-full bg-white/90 shadow-lg
    flex items-center justify-center hover:scale-110 transition"
      >
        <ChevronRight size={22} className="text-[#81190B]" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${i === current
              ? 'w-8 bg-[#81190B]'
              : 'w-2 bg-white/70'
              }`}
          />
        ))}
      </div>
    </section>
  );
}