'use client';
import { useEffect, useRef, useState } from 'react';

const stats = [
  { end: 10000, suffix: '+', label: 'Happy Customers' },
  { end: 400, suffix: '+', label: 'Verified Reviews' },
  { end: 3, suffix: '+', label: 'Years in Business' },
  { end: 4, suffix: '', label: 'Product Categories' },
];

function Counter({ end, suffix }: { end: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = Math.ceil(end / 60);
        const interval = setInterval(() => {
          start += step;
          if (start >= end) { setCount(end); clearInterval(interval); }
          else setCount(start);
        }, 30);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return <span ref={ref}>{count.toLocaleString('en-IN')}{suffix}</span>;
}

export default function StatsCounter() {
  return (
    <section className="py-16 bg-[#81190B] text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map(({ end, suffix, label }) => (
            <div key={label} className="p-6">
              <div className="text-4xl md:text-5xl font-extrabold text-amber-300 mb-2">
                <Counter end={end} suffix={suffix} />
              </div>
              <p className="text-white/80 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
