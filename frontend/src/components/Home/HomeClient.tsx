'use client';
import React from 'react';
import Hero from './Hero';
import ShopByCategory from './ShopByCategory';
import FeaturedProducts from './FeaturedProducts';
import SpiceQuality from './SpiceQuality';
import StatsCounter from './StatsCounter';
import BlogSection from './BlogSection';
import Testimonials from './Testimonials';
import VideoTestimonial from './VideoTestimonial';
import OurStory from './OurStory';
import GrandmaMasalaProcess from './GrandmaMasalaProcess';
import WhyGrandMasala from './WhyGrandMasala';

interface HomeClientProps {
  initialProducts: any[];
  initialBlogs: any[];
  settings: any;
}

export default function HomeClient({ initialProducts, initialBlogs, settings }: HomeClientProps) {
  return (
    <>
      <Hero />
      <FeaturedProducts initialProducts={initialProducts} />
      <VideoTestimonial />
      <WhyGrandMasala />
      <StatsCounter />
      <SpiceQuality />
      <GrandmaMasalaProcess />
      <BlogSection initialBlogs={initialBlogs} />
      <OurStory />
      <Testimonials />
    </>
  );
}