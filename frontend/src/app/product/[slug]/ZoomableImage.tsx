'use client';
import React, { useRef, useState } from 'react';
import Image from 'next/image';

/**
 * Amazon-style hover zoom: on desktop hover, shows a magnified version of the
 * image that pans based on cursor position. Falls back to a plain image on
 * touch devices (no mouse to hover with).
 */
export default function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [bgPos, setBgPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setBgPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden cursor-zoom-in"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
    >
      <Image src={src} alt={alt} fill className="object-contain p-4" sizes="(max-width:1024px) 100vw, 50vw" priority />

      {/* Magnified layer — only mounted while hovering, follows cursor via background-position */}
      {isHovering && (
        <div
          className="absolute inset-0 hidden lg:block pointer-events-none"
          style={{
            backgroundImage: `url(${src})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: '230%',
            backgroundPosition: `${bgPos.x}% ${bgPos.y}%`,
          }}
        />
      )}
    </div>
  );
}