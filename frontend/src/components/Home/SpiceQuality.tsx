import Link from "next/link";

export default function SpiceQuality() {
  const features = [
    {
      id: 1,
      img: "/images/hun-natura.png",
      title: "100% Natural",
      description: "Spices made with pure, natural ingredients.",
    },
    {
      id: 2,
      img: "/images/farm-fresh.png",
      title: "Farm Fresh",
      description: "Directly sourced from trusted farmers.",
    },
    {
      id: 3,
      img: "/images/safe-hygienic.png",
      title: "Safe & Hygienic",
      description: "Processed with care under strict hygiene.",
    },
    {
      id: 4,
      img: "/images/quality.png",
      title: "Premium Quality",
      description: "Handpicked spices for authentic flavor.",
    },
  ];
  return (
    <section className="py-16 bg-[#F4F1EA]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-2"><div className="w-16 h-1 bg-[#81190B]" /></div>
          <h2 className="text-3xl lg:text-4xl font-black text-[#81190B]">The Grand Masala Promise</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6 flex flex-col items-center text-center"
            >
              {/* Image */}
              <img
                src={feature.img}
                alt={feature.title}
                className="w-24 h-24 object-contain mb-6"
              />

              {/* Title */}
              <h3 className="text-xl font-bold text-dark-800 mb-3">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-6">{feature.description}</p>

              {/* Button */}
              <Link
                href="/shop"
                className="text-[#ffb229] font-semibold hover:underline"
              >
                EXPLORE ALL →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
