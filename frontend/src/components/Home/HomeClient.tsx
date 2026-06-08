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
interface HomeClientProps {
  initialProducts: any[];
  initialBlogs: any[];
  settings: any;
}

export default function HomeClient({ initialProducts, initialBlogs, settings }: HomeClientProps) {
  return (
    <>
      <Hero />
      <VideoTestimonial />
      <ShopByCategory />
      <FeaturedProducts initialProducts={initialProducts} />
      <StatsCounter />
      <SpiceQuality />
      <GrandmaMasalaProcess />
      <BlogSection initialBlogs={initialBlogs} />
      <OurStory />
      <Testimonials />
    </>
  );
}
