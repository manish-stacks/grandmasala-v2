"use client";
import React, { useState, useEffect } from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaXTwitter,
  FaYoutube,
  FaWhatsapp,
} from "react-icons/fa6";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-toastify";

export default function Footer() {
  const [setting, setSetting] = useState<any>({});
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/settings`)
      .then((r) => r.json())
      .then((d) => setSetting(d.data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/create-newsletter`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setIsSubscribed(true);
        setEmail("");
        toast.success(data.message);
      } else toast.error(data.message);
    } catch {
      toast.error("Something went wrong. Please try again!");
    }
  };

  const socialLinks = [
    {
      icon: FaFacebookF,
      url:
        setting?.socialMediaLinks?.facebook ||
        "https://www.facebook.com/granddmasala/",
      label: "Facebook",
    },
    {
      icon: FaInstagram,
      url:
        setting?.socialMediaLinks?.instagram ||
        "https://www.instagram.com/grand.masala/",
      label: "Instagram",
    },
    {
      icon: FaXTwitter,
      url: setting?.socialMediaLinks?.twitter || "#",
      label: "Twitter",
    },
    {
      icon: FaYoutube,
      url:
        setting?.socialMediaLinks?.youtube ||
        "https://www.youtube.com/@GrandMasala2025",
      label: "YouTube",
    },
  ];

  return (
    <>
      <footer className="bg-[#81190B] text-white py-16 relative">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Brand Info */}
            <div>
              <div className="flex flex-col mb-2 gap-1">
                <a className="flex text-light">
                  <span className="mr-2">📍</span>
                  47, VPO Dhauj, Tehsil Dhauj, Near Rabia Masjid, Faridabad,
                  India, Haryana
                </a>
                <a className="flex text-light" href="tel:+919355577789">
                  <span className="mr-2">🕿</span>+919355577789
                </a>
                <a
                  className="flex text-light"
                  href="mailto:info@grandmasala.in"
                >
                  <span className="mr-2">✉️</span>info@grandmasala.in
                </a>
              </div>

              {/* Social Media Icons */}
              <div className="flex gap-3 mt-3">
                <a
                  href={
                    setting?.socialMediaLinks?.facebook ||
                    "https://www.facebook.com/granddmasala/"
                  }
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaFacebookF className="w-6 h-6 text-white" />
                </a>

                <a
                  href={
                    setting?.socialMediaLinks?.instagram ||
                    "https://www.instagram.com/grand.masala/?next=%2F"
                  }
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaInstagram className="w-6 h-6 text-white" />
                </a>

                <a
                  href={setting?.socialMediaLinks?.twitter || "#"}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaXTwitter className="w-6 h-6 text-white" />
                </a>

                <a
                  href={
                    setting?.socialMediaLinks?.youtube ||
                    "https://www.youtube.com/@GrandMasala2025"
                  }
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaYoutube className="w-6 h-6 text-white" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-bold mb-6">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/about"
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="/shop"
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    Shop
                  </a>
                </li>
                <li>
                  <a
                    href="/blogs"
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    Blogs
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Products */}
            <div>
              <h3 className="text-lg font-bold mb-6">Products</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/shop"
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    Haldi
                  </a>
                </li>
                <li>
                  <a
                    href="/shop"
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    Lal Mirch
                  </a>
                </li>
                <li>
                  <a
                    href="/shop"
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    Dhania
                  </a>
                </li>
                <li>
                  <a
                    href="/shop"
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    Garam Masala
                  </a>
                </li>
              </ul>
            </div>

            {/* Also Available On */}
            <div>
              <h3 className="text-lg font-bold mb-6">Also Available On</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://www.amazon.in/s?k=grand+masala"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors"
                  >
                    {/* <span className="text-xl">🛒</span>  */}
                    Amazon
                  </a>
                </li>
                <li>
                  <a
                    href="https://blinkit.com/s/?q=grand+masala"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors"
                  >
                    {/* <span className="text-xl">⚡</span>  */}
                    Blinkit
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className="text-lg font-bold mb-6">Newsletter</h3>
              <p className="text-white/80 mb-4">
                Sign up with your email to join our mailing list.
              </p>

              {isSubscribed ? (
                <p className="text-green-300 font-semibold">
                  ✅ You’re subscribed!
                </p>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col space-y-3"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#FFB229]"
                    required
                  />
                  <button
                    type="submit"
                    className="py-3 bg-[#FFB229] hover:bg-[#D19A40] text-white font-semibold rounded-lg transition-colors"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/20 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-white">
                © 2025 Grand Masala. All rights reserved.
              </p>
              <div className="flex gap-6">
                <a
                  href="/privacy"
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  Privacy Policy
                </a>
                <a
                  href="/terms"
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  Terms of Service
                </a>
                {/* <a href="/refund" className="text-white hover:text-gray-200 transition-colors">Refund & Return policy</a> */}
                <a
                  href="/return"
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  Refund & Return policy
                </a>
                <a
                  href="/shipping"
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  Shipping policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
