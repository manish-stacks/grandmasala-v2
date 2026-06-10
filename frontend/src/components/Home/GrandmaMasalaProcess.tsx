"use client";

import Image from "next/image";

export default function GrandmaMasalaProcess() {
  return (
    <section className="w-full bg-[#f6f1e7] py-8 md:py-12">
      <div className=" mx-auto px-4">
        <div className="rounded-2xl md:rounded-[32px] shadow-xl">
          <Image
            src="/images/banner-1.png"
            alt="Grandma Masala Process"
            width={2000}
            height={800}
            priority
            className="w-full h-auto object-contain"
          />
        </div>
      </div>
    </section>
  );
}