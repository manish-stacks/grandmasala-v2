import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center text-center px-4">
      <div>
        <div className="text-8xl mb-6">🌶</div>
        <h1 className="text-6xl font-extrabold text-[#81190B] mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">Oops! This spice seems to have gone missing.</p>
        <Link href="/" className="bg-[#81190B] hover:bg-[#5a1008] text-white px-8 py-3 rounded-xl font-semibold transition-colors">Go Home</Link>
      </div>
    </div>
  );
}
