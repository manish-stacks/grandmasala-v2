import React, { useState, useEffect } from 'react';

import Link from 'next/link';

export default function OurStory() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation after component mounts
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="relative overflow-hidden">
            {/* Background with parallax effect */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-fixed z-0"
                style={{ backgroundImage: `url(/images/parallax2.jpg)` }}
            />

            {/* Overlay with gradient */}
            <div className="absolute " />
            {/* <div className="absolute inset-0 bg-gradient-to-r from-amber-900/80 to-amber-700/70 z-1" /> */}

            <section className="relative overflow-hidden py-20 lg:py-32">
                {/* Background */}
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: "url('/images/parallax2.jpg')",
                    }}
                />

                <div className="absolute inset-0 bg-black/60" />

                <div className="container relative z-10 mx-auto px-5">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">

                        {/* Left Content */}
                        <div>
                            <span className="inline-block px-4 py-2 rounded-full bg-[#81190B]/80 text-white text-sm mb-5">
                                OUR JOURNEY
                            </span>

                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                                Bringing Authentic
                                <span className="block text-amber-400">
                                    Indian Spices
                                </span>
                                To Every Kitchen
                            </h2>

                            <p className="mt-6 text-lg text-gray-200 leading-8">
                                Grand Masala started with a simple vision:
                                preserving traditional Indian flavors while
                                delivering premium-quality spices to modern homes.
                            </p>

                            <p className="mt-4 text-lg text-gray-300 leading-8">
                                Today our products reach thousands of families,
                                helping them create memorable meals with
                                authentic taste and unmatched freshness.
                            </p>

                            <div className="flex flex-wrap gap-4 mt-8">
                                <Link
                                    href="/shop"
                                    className="px-7 py-4 rounded-xl bg-[#81190B] hover:bg-[#6c1409] transition text-white"
                                >
                                    Explore Products
                                </Link>

                                <Link
                                    href="/about"
                                    className="px-7 py-4 rounded-xl border border-white/30 backdrop-blur-md hover:bg-white/10 transition text-white"
                                >
                                    Learn More
                                </Link>
                            </div>
                        </div>

                        {/* Right Image */}
                        {/* <div className="relative">
                            <div className="overflow-hidden rounded-[30px]">
                                <img
                                    src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop&crop=face"
                                    alt="Grand Masala Story"
                                    className="w-full h-[600px] object-cover"
                                />
                            </div>

                            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-2xl max-w-xs">
                                <h4 className="text-[#81190B] font-bold text-xl">
                                    Since 2025
                                </h4>

                                <p className="text-gray-600 mt-2">
                                    Dedicated to preserving authentic Indian spice traditions.
                                </p>
                            </div>
                        </div> */}

                    </div>
                </div>
            </section>
        </div>
    );
}