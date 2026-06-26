import React from 'react';
import { ShieldCheck, HeartPulse, Brain, Sparkles } from 'lucide-react';
import ReviewsSection from './ReviewsSection';
import GrandmaMasalaProcess from '@/components/Home/GrandmaMasalaProcess';
import VideoTestimonial from '@/components/Home/VideoTestimonial';
import Image from 'next/image';



const comparisonRows = [
  { feature: 'Ingredients', good: ['100% Whole Spices', 'Nothing else added'], bad: ['Mixed Powders', 'Often cut with starch or husk'] },
  { feature: 'Color & Flavor', good: ['Natural Color', 'True spice aroma'], bad: ['Artificial Colors', 'Dull, flat taste'] },
  { feature: 'Sourcing', good: ['Direct from Farms', 'Traceable, single-origin batches'], bad: ['Mass Market Mix', 'Blended from unknown sources'] },
  { feature: 'Grinding Process', good: ['Stone Ground', 'Low heat, preserves oils'], bad: ['Machine Milled', 'High heat, loses aroma'] },
  { feature: 'Preservatives', good: ['Chemical Free', 'No anti-caking agents'], bad: ['Added Preservatives', 'Extends shelf life artificially'] },
  { feature: 'Lab Testing', good: ['Every Batch Tested', 'Verified purity & safety'], bad: ['Rarely Tested', 'Quality varies batch to batch'] },
];

const healthBenefits = [
  { label: 'Boosts Immunity', icon: "/images/icon-1.jpg" },
  { label: 'Aids Digestion', icon: "/images/icon-2.jpg" },
  { label: 'Rich in Antioxidants', icon: "/images/icon-3.jpg" },
  { label: 'No Artificial Additives', icon: "/images/icon-4.jpg" },
];

const sizeComparison = [
  { feature: 'Price Per 100g', oneL: '₹95 (Standard pack)', fiveL: '₹72 (Save ₹23 per 100g)' },
  { feature: 'Packaging', oneL: 'Resealable Pack (Everyday use)', fiveL: 'Airtight Pack (Worth ₹120 — FREE with order)' },
  { feature: 'Best For', oneL: 'Small Families (2-3) (First-time buyers)', fiveL: 'Regular Cooking (Families of 4+)' },
  { feature: 'Reordering', oneL: 'Every Month (Multiple shipping costs)', fiveL: 'Once in 4 Months (One-time shipping)' },
  { feature: 'You Save', oneL: '₹0 SAVED (Standard price)', fiveL: '₹540 SAVED (Spice ₹420 + Pack ₹120)' },
];

const faqs = [
  { q: 'What makes this spice different from regular store-bought masala?', a: 'Most market masalas are machine-milled and often mixed with fillers like starch or husk to bulk up weight. Ours is stone-ground from 100% whole spices with nothing else added, so you get the true color, aroma, and strength in every pinch.' },
  { q: 'Why should I buy spices online instead of from a local store?', a: 'Local loose spices are often unlabelled and mixed from unknown sources. Buying online from us means full batch traceability — you know exactly which farm and harvest your pack came from, and every batch is lab tested before it ships.' },
  { q: 'Is this masala 100% natural with no added colors?', a: 'Yes — we never add artificial colors, anti-caking agents, or preservatives. The color and aroma you see are entirely from the spice itself.' },
  { q: 'How long does this spice stay fresh after opening?', a: 'Stored in a cool, dry place in an airtight container, our spices stay fresh and aromatic for up to 12 months, since there are no fillers that cause it to clump or spoil faster.' },
  { q: 'Is this product lab tested for purity?', a: 'Every batch is lab tested for purity and safety before it is packed, so you can be confident there is no adulteration in what you are cooking with.' },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-[#E8DCCB] py-4">
      <summary className="flex items-center justify-between cursor-pointer list-none text-gray-900 font-medium">
        {q}
        <span className="ml-4 shrink-0 text-[#81190B] transition-transform group-open:rotate-45 text-xl leading-none">+</span>
      </summary>
      <p className="mt-3 text-gray-600 text-sm leading-relaxed">{a}</p>
    </details>
  );
}

export default function ProductStaticSections({ productId }: { productId: string }) {
  return (
    <>
      {/* Purity Process Timeline */}
      <section className="bg-linear-to-b from-[#FFFDF9] to-[#F8F5F0] py-10">
        <div className="max-w-7xl mx-auto px-6">
          {/* Heading */}
          <div className="text-center max-w-2xl mx-auto">

            <h2 className="mt-4 text-4xl font-bold text-gray-900">
              From Farm to Your Kitchen
            </h2>

            <p className="mt-4 text-lg text-gray-600">
              Every spice follows a carefully crafted journey to preserve
              freshness, aroma, and authentic taste.
            </p>
          </div>

          {/* Timeline */}
          <div className="mt-16">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-[#EFE5D6] bg-white">
              <img
                src="/images/purity-process.png"
                alt="Grand Masala Purity Process"
                className="w-full object-cover"
              />
            </div>
          </div>

          {/* Comparison */}
          <div className="mt-20 grid lg:grid-cols-2 gap-8">
            {/* Grand Masala */}
            <div className="rounded-3xl bg-white border border-green-200 shadow-lg p-8">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl mb-6">
                ✅
              </div>

              <h3 className="text-2xl font-bold text-gray-900">
                Grand Masala
              </h3>

              <ul className="mt-6 space-y-4 text-gray-600">
                <li className="flex gap-3">
                  <span className="text-green-600">✔</span>
                  Whole spices sourced directly from farms.
                </li>

                <li className="flex gap-3">
                  <span className="text-green-600">✔</span>
                  Naturally sun-dried to preserve essential oils.
                </li>

                <li className="flex gap-3">
                  <span className="text-green-600">✔</span>
                  Stone-ground for rich aroma and authentic flavor.
                </li>

                <li className="flex gap-3">
                  <span className="text-green-600">✔</span>
                  No artificial colors, fillers, or preservatives.
                </li>
              </ul>
            </div>

            {/* Market Masala */}
            <div className="rounded-3xl bg-white border border-red-200 shadow-lg p-8">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-2xl mb-6">
                ❌
              </div>

              <h3 className="text-2xl font-bold text-gray-900">
                Regular Market Masala
              </h3>

              <ul className="mt-6 space-y-4 text-gray-600">
                <li className="flex gap-3">
                  <span className="text-red-500">✕</span>
                  Machine-milled at high temperatures.
                </li>

                <li className="flex gap-3">
                  <span className="text-red-500">✕</span>
                  May contain fillers to increase weight.
                </li>

                <li className="flex gap-3">
                  <span className="text-red-500">✕</span>
                  Artificial colors for appearance.
                </li>

                <li className="flex gap-3">
                  <span className="text-red-500">✕</span>
                  Reduced aroma and authentic taste.
                </li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* Why Grand Masala is Better */}
      <section className="bg-[#F8F5EF] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Heading */}
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900">
              Why Grand Masala is Better
            </h2>

            <p className="mt-4 text-base sm:text-lg text-gray-600">
              Crafted with traditional methods to deliver authentic aroma,
              natural color, and unforgettable taste.
            </p>
          </div>

          {/* Comparison */}
          <div className="mt-14 rounded-3xl overflow-hidden border border-[#E6DDCF] bg-white shadow-xl">

            {/* Desktop Header */}
            <div className="hidden md:grid md:grid-cols-[1.2fr_1fr_1fr] bg-[#FAF8F3] border-b border-[#E6DDCF]">
              <div className="p-6 font-semibold text-gray-600 uppercase tracking-wide">
                Feature
              </div>

              <div className="p-6 bg-[#FFF7EB] text-center border-x border-[#E6DDCF]">
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                  ✅ Grand Masala
                </div>
              </div>

              <div className="p-6 text-center">
                <div className="inline-flex items-center gap-2 bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
                  ❌ Regular Masala
                </div>
              </div>
            </div>

            {/* Rows */}
            {comparisonRows.map((row, index) => (
              <div
                key={row.feature}
                className={`grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr]
          ${index !== comparisonRows.length - 1
                    ? "border-b border-[#ECE5D8]"
                    : ""
                  }`}
              >
                {/* Feature */}
                <div className="p-5 md:p-6 bg-[#FAF8F3] md:bg-transparent">
                  <h3 className="font-semibold text-lg md:text-base text-gray-900">
                    {row.feature}
                  </h3>
                </div>

                {/* Grand Masala */}
                <div className="p-5 md:p-6 bg-[#FFFDF8] md:border-x border-[#ECE5D8]">
                  <p className="md:hidden text-xs font-semibold uppercase text-green-700 mb-3">
                    Grand Masala
                  </p>

                  <div className="flex gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                      ✓
                    </div>

                    <div>
                      <h4 className="font-semibold text-green-700">
                        {row.good[0]}
                      </h4>

                      <p className="text-sm text-gray-500 mt-1">
                        {row.good[1]}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Regular Masala */}
                <div className="p-5 md:p-6">
                  <p className="md:hidden text-xs font-semibold uppercase text-red-600 mb-3">
                    Regular Masala
                  </p>

                  <div className="flex gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-bold">
                      ✕
                    </div>

                    <div>
                      <h4 className="font-semibold text-red-500">
                        {row.bad[0]}
                      </h4>

                      <p className="text-sm text-gray-500 mt-1">
                        {row.bad[1]}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Banner */}
          <div className="mt-12 rounded-3xl bg-[#81190B] px-5 sm:px-8 py-8 sm:py-10 text-center text-white">
            <h3 className="text-2xl sm:text-3xl font-bold">
              Taste the Difference in Every Spoon
            </h3>

            <p className="mt-3 text-sm sm:text-base text-[#F4E8D5] max-w-2xl mx-auto">
              No fillers. No artificial colors. Just naturally sourced spices
              that preserve the authentic aroma and rich flavor your family
              deserves.
            </p>
          </div>
        </div>
      </section>
      {/* Health Benefits */}
      <section className="bg-[#FCFAF6] py-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Heading */}
          <div className="max-w-2xl mx-auto text-center">

            <h2 className="mt-4 text-4xl font-bold text-gray-900">
              Health Benefits
            </h2>

            <p className="mt-4 text-lg text-gray-600">
              Every spoonful is packed with natural ingredients that support
              your health while delivering authentic taste.
            </p>
          </div>

          {/* Benefits */}
          <div className="mt-14 grid grid-cols-2 gap-6 md:grid-cols-4">
            {healthBenefits.map((item, index) => (
              <div
                key={index}
                className="group rounded-3xl border border-[#E8DCCB] bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
              >
                {/* Icon */}
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#FFF6EB] transition group-hover:scale-110">
                  <img
                    src={item.icon}
                    alt={item.label}
                    className="h-16 w-16 object-contain"
                  />
                </div>

                {/* Title */}
                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  {item.label}
                </h3>

                {/* Divider */}
                <div className="mx-auto mt-4 h-1 w-12 rounded-full bg-[#81190B]" />
              </div>
            ))}
          </div>


        </div>
      </section>


      <GrandmaMasalaProcess />
      {/* Choose Your Perfect Size */}
      <section className="bg-[#F8F5EF] py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Heading */}
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Choose Your Perfect Pack
            </h2>

            <p className="mt-3 text-gray-600 text-sm md:text-base">
              Compare both packs and pick the one that suits your family.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-[#D8CDBA] bg-white shadow-xl">

            {/* Desktop Header */}
            <div className="hidden md:grid md:grid-cols-[220px_1fr_1fr]">

              <div className="bg-[#F4F0E7] p-8 font-bold text-gray-700 uppercase">
                Feature
              </div>

              {/* Standard */}
              <div className="p-8 text-center border-l border-[#E5D9C8]">
                <h3 className="text-2xl font-bold">
                  Standard Pack
                </h3>

                <p className="text-gray-500 mt-1">
                  Perfect for Small Families
                </p>
              </div>

              {/* Family */}
              <div className="relative bg-[#FFF6E6] border-l-2 border-[#C89A2D]">

                <div className="absolute top-8 -right-1 bg-[#C89A2D] text-white text-[11px] px-8 py-1 rotate-45 translate-x-7 -translate-y-2">
                  RECOMMENDED
                </div>

                <div className="p-8 text-center">
                  <h3 className="text-2xl font-bold text-[#81190B]">
                    Family Pack ⭐
                  </h3>

                  <p className="text-[#81190B]/70 mt-1">
                    Best for Regular Cooking
                  </p>
                </div>
              </div>
            </div>

            {/* Rows */}
            {sizeComparison.map((item, index) => (
              <div
                key={item.feature}
                className={`grid grid-cols-1 md:grid-cols-[220px_1fr_1fr]
          ${index !== sizeComparison.length - 1 ? "border-t border-[#E5D9C8]" : ""}
          `}
              >
                {/* Feature */}
                <div className="bg-[#F9F6EF] px-5 md:px-8 py-5 md:py-6 font-semibold text-gray-700 flex items-center">
                  {item.feature}
                </div>

                {/* Standard */}
                <div className="px-5 md:px-8 py-5 md:py-6 text-left md:text-center border-t md:border-t-0 md:border-l border-[#E5D9C8]">
                  <p className="text-xs uppercase font-semibold text-gray-500 mb-2 md:hidden">
                    Standard Pack
                  </p>

                  <p className="font-bold text-gray-900">
                    {item.oneL}
                  </p>
                </div>

                {/* Family */}
                <div className="bg-[#FFF9EE] px-5 md:px-8 py-5 md:py-6 text-left md:text-center border-t md:border-t-0 md:border-l-2 border-[#C89A2D]">
                  <p className="text-xs uppercase font-semibold text-[#81190B] mb-2 md:hidden">
                    ⭐ Family Pack
                  </p>

                  <p className="font-bold text-[#81190B]">
                    {item.fiveL}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <VideoTestimonial />
      {/* Customer Reviews — dynamic, with 2 default placeholders + write-a-review flow */}
      <ReviewsSection productId={productId} />

      {/* FAQ */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">Frequently Asked Questions</h2>
          <div>
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}