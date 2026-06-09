import { Trophy, Timer, Thermometer, ClipboardList } from 'lucide-react';

export default function WhyGrandMasala() {
  const usps = [
    {
      icon: <Trophy size={22} className="text-[#81190B]" />,
      title: 'Premium source ingredients',
      desc: 'We handpick only the best grade — Selam turmeric, Teja premium red chilli, whole coriander & cumin — so every batch starts with the finest raw material.',
    },
    {
      icon: <Timer size={22} className="text-[#81190B]" />,
      title: 'Ground only after you order',
      desc: "We don't pre-stock finished masala. The moment your order arrives, we begin processing — so you receive freshly ground spices, never something sitting on a shelf.",
    },
    {
      icon: <Thermometer size={22} className="text-[#81190B]" />,
      title: 'Cold-process grinding',
      desc: 'High heat kills aroma and colour. We grind at low temperature to preserve the natural oils, fragrance, and nutrients that make spices worth buying.',
    },
    {
      icon: <ClipboardList size={22} className="text-[#81190B]" />,
      title: 'Full ingredient transparency',
      desc: "We tell you exactly what's inside — which haldi variety, which chilli, every ingredient in our garam masala blend. You know what you're eating, always.",
    },
  ];

  const badges = ['Selam haldi', 'Teja premium mirch', 'Whole dhaniya', 'Jeera mix', 'Signature garam masala'];

  return (
    <section className="py-16 bg-[#F4F1EA] px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center mb-2">
          <div className="w-14 h-1 bg-[#81190B] rounded-full" />
        </div>
        <h2 className="text-3xl lg:text-4xl font-black text-[#81190B] text-center mb-2">
          Why Grand Masala Tastes Different
        </h2>
        <p className="text-center text-[#6b5c4e] mb-10">
          Every order is ground fresh. No stock. No shortcuts.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {usps.map((u, i) => (
            <div key={i} className="bg-white border border-[#e0d8cf] rounded-2xl p-5 flex gap-4 items-start">
              <div className="w-11 h-11 rounded-xl bg-[#fbf2ef] flex items-center justify-center flex-shrink-0">
                {u.icon}
              </div>
              <div>
                <p className="font-semibold text-[#2a1a14] mb-1">{u.title}</p>
                <p className="text-sm text-[#6b5c4e] leading-relaxed">{u.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {badges.map((b, i) => (
            <span key={i} className="bg-[#81190B] text-[#fdeae7] text-xs px-4 py-1.5 rounded-full">
              {b}
            </span>
          ))}
        </div>

        <p className="text-center text-xs text-[#9c7c6e] italic">
          No preservatives · No artificial colour
        </p>
      </div>
    </section>
  );
}