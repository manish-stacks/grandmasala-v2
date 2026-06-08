'use client';
import Link from 'next/link';
import Image from 'next/image';

const categories = [
  { name: 'Haldi', productId: '685ba0ff4deb208604e627cb', image: '/categories/haldi.png' },
  { name: 'Lal Mirch', productId: '685b9fc44deb208604e627a6', image: '/categories/lal-mirch.png' },
  { name: 'Dhania', productId: '685b9dd14deb208604e62788', image: '/categories/dhania.png' },
  { name: 'Garam Masala', productId: '685b9e7e4deb208604e62792', image: '/categories/garam-masala.png' },
];

export default function ShopByCategory() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl lg:text-4xl font-black text-[#81190B] mb-14 text-center">Shop By Category</h2>
        <div className="flex flex-wrap justify-center gap-10 md:gap-16">
          {categories.map((cat, index) => (
            <Link
              href={`/product-page/${cat.productId}`} 
              key={index}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div
                className="w-34 h-34 md:w-40 md:h-40 rounded-full flex items-center justify-center mb-4 relative overflow-hidden shadow-lg"
                style={{ backgroundColor: `#81190B` }}
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <p className="text-center text-lg font-semibold text-gray-700 group-hover:text-gray-900">
                {cat.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
