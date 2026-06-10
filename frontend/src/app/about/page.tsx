"use client";

import GrandmaMasalaProcess from "@/components/Home/GrandmaMasalaProcess";
import SpiceQuality from "@/components/Home/SpiceQuality";
import Link from "next/link";

export default function OurStory() {
  return (
    <>
      <section className="relative py-20 bg-[#fdf8f5]">
        <div className="container mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Image */}
            <div>
              <img
                src="/images/grand-masala-D5LjdSqq.jpg"
                alt="Grand Masala"
                className="w-full h-[500px] object-cover rounded-[30px] shadow-xl"
              />
            </div>

            {/* Content */}
            <div>
              <span className="inline-block px-4 py-2 rounded-full bg-[#81190B]/10 text-[#81190B] font-semibold">
                OUR STORY
              </span>

              <h2 className="mt-5 text-4xl lg:text-5xl font-bold text-gray-900">
                The Taste of Tradition,
                <span className="block text-[#81190B]">
                  Crafted for Today
                </span>
              </h2>

              <p className="mt-6 text-gray-600 leading-8">
                At Grand Masala, we believe every meal deserves authentic
                flavor. Our journey began with a passion for bringing
                traditional Indian spices to modern kitchens while preserving
                their purity, aroma, and freshness.
              </p>

              <p className="mt-4 text-gray-600 leading-8">
                From sourcing premium ingredients to carefully blending each
                spice mix, we ensure every pack delivers the rich taste that
                families love and trust.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-5 mt-8">
                <div>
                  <h3 className="text-3xl font-bold text-[#81190B]">50+</h3>
                  <p className="text-sm text-gray-500">Products</p>
                </div>

                <div>
                  <h3 className="text-3xl font-bold text-[#81190B]">10K+</h3>
                  <p className="text-sm text-gray-500">Customers</p>
                </div>

                <div>
                  <h3 className="text-3xl font-bold text-[#81190B]">100%</h3>
                  <p className="text-sm text-gray-500">Pure Spices</p>
                </div>
              </div>

              <Link
                href="/shop"
                className="inline-flex mt-8 bg-[#81190B] text-white px-8 py-4 rounded-xl hover:bg-[#6b1409] transition"
              >
                Explore Products
              </Link>
            </div>
          </div>
        </div>
      </section>
      <GrandmaMasalaProcess />
      <SpiceQuality/>
    </>
  );
}