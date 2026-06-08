"use client";

import React, { useRef, useEffect } from "react";
const videos = [
  {
    src: "https://hoverbusinessservices.com/cloud/grandmasala/04.mp4",
  },
  {
    src: "https://hoverbusinessservices.com/cloud/grandmasala/02.mp4",
  },
  {
    src: "https://hoverbusinessservices.com/cloud/grandmasala/IMG_3576.mp4",
  },
  {
    src: "https://hoverbusinessservices.com/cloud/grandmasala/IMG_3578.mp4",
  },
  {
    src: "https://hoverbusinessservices.com/cloud/grandmasala/IMG_3579.mp4",
  }
];

export default function VideoTestimonial() {
  const videoRefs = useRef([]);

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

  return (
    <section className="py-12 bg-[#fff7f0]">
      <div className="max-w-400 mx-auto px-4">

        {/* Heading */}
        <h2 className="text-3xl lg:text-4xl font-black text-[#81190B] mb-14 text-center">
          Customer Reviews
        </h2>

        {/* Scroll Container */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar">

          {videos.map((video, index) => (
            <div
              key={index}
              className="min-w-62 md:min-w-[18%] bg-black rounded-xl overflow-hidden relative"
            >
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={video.src}
                loop
                muted
                playsInline
                preload="none"
                className="w-full h-100 object-cover"
              />
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}