"use client";

import Link from "next/link";
import React, { useRef, useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const videos = [
  {
    src: "https://hoverbusinessservices.com/cloud/grandmasala/04.mp4",
    link: "/product/69c8e1d15acecd204bb8eaf4",
  },
  {
    src: "https://hoverbusinessservices.com/cloud/grandmasala/02.mp4",
    link: "/product/large-family-pack-turmeric-500gm-chilli-500gm-coriander500-and-garam-masala-powder100gm",
  },
  {
    src: "https://hoverbusinessservices.com/cloud/grandmasala/IMG_3576.mp4",
    link: "product/monthly-combo-pack-turmeric-200gm-chilli-200gm-coriander200gm-and-garam-masala-powder50gm",
  },
  {
    src: "https://hoverbusinessservices.com/cloud/grandmasala/IMG_3578.mp4",
    link: "/product/turmeric-powder-selam-haldi-powder",
  },
  {
    src: "https://hoverbusinessservices.com/cloud/grandmasala/IMG_3579.mp4",
    link: "/product/garam-masala-powder",
  },
];

export default function VideoTestimonial() {
  const videoRefs = useRef([]);
  const [mutedVideos, setMutedVideos] = useState(
    videos.map(() => true)
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            video.play().catch(() => { });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => {
      videoRefs.current.forEach((video) => {
        if (video) observer.unobserve(video);
      });
    };
  }, []);

  const toggleMute = (index) => {
    const video = videoRefs.current[index];
    if (!video) return;

    const newMuted = !video.muted;
    video.muted = newMuted;

    setMutedVideos((prev) => {
      const updated = [...prev];
      updated[index] = newMuted;
      return updated;
    });
  };

  return (
    <section className="bg-[#fff7f0] py-12">
      <div className="max-w-400 mx-auto px-4">
        <h2 className="mb-8 text-center text-3xl font-bold text-[#81190B] md:text-4xl">
          Customer Video Reviews
        </h2>

        <p className="mx-auto mb-10 max-w-2xl text-center text-gray-600">
          Hear directly from our happy customers and see why Grand Masala is loved in kitchens across India.
        </p>
        <div className="no-scrollbar flex gap-4 overflow-x-auto">
          {videos.map((video, index) => (
            <div
              key={index}
              className="relative min-w-62 overflow-hidden rounded-xl bg-black md:min-w-[18%]"
            >
              <Link href="/shop">
                <video
                  ref={(el) => (videoRefs.current[index] = el)}
                  src={video.src}
                  loop
                  muted
                  playsInline
                  preload="none"
                  className="h-100 w-full object-cover"
                />
              </Link>

              {/* Mute / Unmute Button */}
              <button
                onClick={() => toggleMute(index)}
                className="absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
              >
                {mutedVideos[index] ? (
                  <VolumeX size={20} />
                ) : (
                  <Volume2 size={20} />
                )}
              </button>
              <Link
                href={video?.link}
                className="absolute bottom-3 left-3 rounded-full bg-[#81190B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a1200f]"
              >
                Order Now →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}