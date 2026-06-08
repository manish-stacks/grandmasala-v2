import type { Metadata } from 'next';
import { serverFetch, SITE_URL } from '@/lib/api';

const titles: Record<string, string> = { privacy:'Privacy Policy', terms:'Terms & Conditions', refund:'Refund Policy', shipping:'Shipping Policy', return:'Return Policy' };
const slugMap: Record<string, string> = { privacy:'privacy-policy', terms:'terms-conditions', refund:'refund-policy', shipping:'shipping-policy', return:'return-policy' };

export const metadata: Metadata = { title: titles['return'] + ' — Grand Masala', alternates: { canonical: '/return' } };

export default async function Page() {
  const data = await serverFetch<any>('/admin/page/' + slugMap['return']);
  const page = data?.page;
  return (
    <div className="min-h-screen bg-[#F4F1EA]">
      <div className="bg-[#81190B] text-white py-16 text-center"><h1 className="text-4xl font-bold">{titles['return']}</h1></div>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {page?.content ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-gray-600"><p>Content coming soon. Contact us at info@grandmasala.in for any queries.</p></div>
        )}
      </div>
    </div>
  );
}
