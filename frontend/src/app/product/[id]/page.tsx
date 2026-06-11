import type { Metadata } from "next";
import { serverFetch, serverFetchNoCache, SITE_URL } from "@/lib/api";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";
import RelatedProducts from "@/components/Relatedproducts";
// import RelatedProducts from "@/components/Product/RelatedProducts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await serverFetchNoCache<any>(`/get-product/${id}`);
  if (!data?.data) return { title: "Product Not Found" };
  const p = data.data;
  const price =
    p.Varient?.[0]?.price_after_discount || p.afterDiscountPrice || p.price;
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
    alternates: { canonical: `${SITE_URL}/product/${id}` },
    openGraph: {
      title: `${p.product_name} — Grand Masala`,
      description: p.product_description?.slice(0, 160),
      url: `${SITE_URL}/product/${id}`,
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

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Product + All products parallel fetch
  const [data, allProductsData] = await Promise.all([
    serverFetch<any>(`/get-product/${id}`),
    serverFetch<any>(`/get-product?limit=20`),
  ]);

  if (!data?.data) notFound();

  const p = data.data;
  const price =
    p.Varient?.[0]?.price_after_discount || p.afterDiscountPrice || p.price;

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
      (x) => x._id !== id && x.category?._id === p.category?._id,
    ),
  );

  const otherCategory = shuffleArray(
    allProducts.filter(
      (x) => x._id !== id && x.category?._id !== p.category?._id,
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
      url: `${SITE_URL}/product/${id}`,
      seller: { "@type": "Organization", name: "Grand Masala" },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "400",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ProductDetailClient product={p} />
      {related.length > 0 && <RelatedProducts products={related} />}
    </>
  );
}
