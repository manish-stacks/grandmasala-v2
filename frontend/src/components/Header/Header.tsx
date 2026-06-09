"use client";
import React, { useState, useEffect } from "react";
import { Search, ShoppingCart, User, Menu, X, LogIn } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { toggleCartSidebar } from "@/store/slices/cartSlice";

export default function Header() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { cartItems } = useAppSelector((state) => state.cart);
  const [isToken, setIsToken] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [announcements, setAnnouncements] = useState([
    "Free delivery on orders above ₹299",
    "100% Natural & Handmade Spices",
    "ISO Certified",
  
  ]);

  useEffect(() => {
    setIsToken(!!sessionStorage.getItem("token_login"));
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/annoncements`)
      .then((r) => r.json())
      .then((d) => {
        const active = d.data
          ?.filter((a: any) => a.status === true)
          .map((a: any) => a.title);
        if (active?.length > 0) setAnnouncements(active);
      })
      .catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsSearchOpen(false);
    }
  };

  const navLinks = [
    ["/", "Home"],
    ["/about", "About Us"],
    ["/shop", "Shop"],
    ["/blog", "Blogs"],
    ["/contact", "Contact Us"],
  ];

  return (
    <header className="bg-white sticky shadow-lg top-0 z-40">
      {/* Marquee */}
      <div className="bg-[#81190B] text-white text-sm py-2">
        <div className="max-w-8xl mx-auto px-3">
          <div className="top-navbar w-full overflow-hidden">
            <article className="main-container__marquee">
              <div className="main-container__marquee-track flex">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    aria-hidden={i > 1}
                    className="main-container__marquee-items flex space-x-8"
                  >
                    {announcements.map((text, idx) => (
                      <span key={idx} className="main-container__marquee-item">
                        {text}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>

      <div className="bg-[#F4F1EA]">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <Link href="/" onClick={() => setIsMenuOpen(false)}>
              <Image
                src="/logo.png"
                width={80}
                height={80}
                alt="Grand Masala"
                className="w-[80px] rounded-lg"
              />
            </Link>

            <nav className="hidden lg:flex items-center space-x-8">
              {navLinks.map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="text-[#862113] hover:text-black font-medium transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center flex-1 max-w-lg mx-8">
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  type="text"
                  placeholder="Search for Spices.."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#81190b] rounded-full focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                  type="submit"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#81190b]"
                >
                  <Search size={20} />
                </button>
              </form>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden p-2 text-[#862113]"
              >
                <Search size={24} />
              </button>

              {isToken ? (
                <Link
                  href="/profile"
                  className="hidden sm:flex p-2 text-[#862113] hover:text-black"
                >
                  <User size={24} />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="hidden sm:flex p-2 text-[#862113] hover:text-black"
                >
                  <LogIn size={24} />
                </Link>
              )}

              {/* Cart icon — opens sidebar */}
              <button
                onClick={() => dispatch(toggleCartSidebar())}
                className="p-2 text-[#862113] hover:text-black relative"
              >
                <ShoppingCart size={24} />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full border-2 border-white animate-pulse">
                    {cartItems.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 text-[#862113]"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {isSearchOpen && (
            <div className="md:hidden mt-4 pb-4">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search spices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-black text-[#862113]"
                />
                <button
                  type="submit"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  <Search size={20} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-4">
              {navLinks.map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-[#862113] font-medium py-2"
                >
                  {label}
                </Link>
              ))}
              <hr />
              {isToken ? (
                <Link
                  href="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-2 text-gray-700"
                >
                  <User size={20} />
                  <span>Account</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-2 text-gray-700"
                >
                  <LogIn size={20} />
                  <span>Login</span>
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
