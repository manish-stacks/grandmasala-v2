import type { Metadata } from "next";
import { serverFetch, serverFetchNoCache, SITE_URL } from "@/lib/api";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";
import RelatedProducts from "@/components/Relatedproducts";
// import RelatedProducts from "@/components/Product/RelatedProducts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // The backend's /get-product/:id route accepts either a slug or a legacy
  // MongoDB _id, so this single endpoint works for both.
  const data = await serverFetchNoCache<any>(`/get-product/${slug}`);
  if (!data?.data) return { title: "Product Not Found" };
  const p = data.data;
  const price =
    p.Varient?.[0]?.price_after_discount || p.afterDiscountPrice || p.price;

  // Prefer the canonical slug returned by the API. Falls back to the current
  // URL param for legacy products that don't have a slug yet.
  const canonicalSlug = p.slug || slug;

  return {
    title: `${p.product_name} — Grand Masala`,
    description:
      p.product_description?.slice(0, 160) ||
      `Buy ${p.product_name} — 100% pure handmade Indian spice. Free delivery above ₹299.`,
    keywords: [
      p.product_name,
      "pure spices",
      "handmade masala",
      "Indian spices",
      p.category?.name,
    ],
    alternates: { canonical: `${SITE_URL}/product/${canonicalSlug}` },
    openGraph: {
      title: `${p.product_name} — Grand Masala`,
      description: p.product_description?.slice(0, 160),
      url: `${SITE_URL}/product/${canonicalSlug}`,
      images: p.ProductMainImage?.url
        ? [
            {
              url: p.ProductMainImage.url,
              width: 800,
              height: 800,
              alt: p.product_name,
            },
          ]
        : [],
    },
  };
}

// Static FAQ content shown on every product page — keep this in sync with the
// FAQ list rendered in ProductStaticSections.tsx so the schema matches the UI.
const productFaqs = [
  {
    q: "What makes this spice different from regular store-bought masala?",
    a: "Most market masalas are machine-milled and often mixed with fillers like starch or husk to bulk up weight. Ours is stone-ground from 100% whole spices with nothing else added, so you get the true color, aroma, and strength in every pinch.",
  },
  {
    q: "Why should I buy spices online instead of from a local store?",
    a: "Local loose spices are often unlabelled and mixed from unknown sources. Buying online from us means full batch traceability — you know exactly which farm and harvest your pack came from, and every batch is lab tested before it ships.",
  },
  {
    q: "Is this masala 100% natural with no added colors?",
    a: "Yes — we never add artificial colors, anti-caking agents, or preservatives. The color and aroma you see are entirely from the spice itself.",
  },
  {
    q: "How long does this spice stay fresh after opening?",
    a: "Stored in a cool, dry place in an airtight container, our spices stay fresh and aromatic for up to 12 months, since there are no fillers that cause it to clump or spoil faster.",
  },
  {
    q: "Is this product lab tested for purity?",
    a: "Every batch is lab tested for purity and safety before it is packed, so you can be confident there is no adulteration in what you are cooking with.",
  },
];

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Product + All products parallel fetch
  const [data, allProductsData] = await Promise.all([
    serverFetch<any>(`/get-product/${slug}`),
    serverFetch<any>(`/get-product?limit=20`),
  ]);

  if (!data?.data) notFound();

  const p = data.data;
  const price =
    p.Varient?.[0]?.price_after_discount || p.afterDiscountPrice || p.price;
  const canonicalSlug = p.slug || slug;

  // Related: same category pehle, baaki se fill karo, current product exclude, max 4
  // Shuffle helper
  const shuffleArray = (arr: any[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const allProducts: any[] = allProductsData?.products || [];

  const sameCategory = shuffleArray(
    allProducts.filter(
      (x) => x._id !== p._id && x.category?._id === p.category?._id,
    ),
  );

  const otherCategory = shuffleArray(
    allProducts.filter(
      (x) => x._id !== p._id && x.category?._id !== p.category?._id,
    ),
  );

  const related = [...sameCategory, ...otherCategory].slice(0, 4);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.product_name,
    description: p.product_description,
    image: p.ProductMainImage?.url,
    brand: { "@type": "Brand", name: "Grand Masala" },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: price,
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/product/${canonicalSlug}`,
      seller: { "@type": "Organization", name: "Grand Masala" },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "400",
    },
  };

  // FAQ schema for rich snippets — content lives in productFaqs above
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: productFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <ProductDetailClient product={p} />
      {related.length > 0 && <RelatedProducts products={related} />}
    </>
  );
}