'use client';
import React, { useEffect, useState } from 'react';
import { Star, BadgeCheck, X } from 'lucide-react';
import { toast } from 'react-toastify';

const API = process.env.NEXT_PUBLIC_API_URL;

interface ReviewItem {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  isDefault: boolean;
  createdAt: string;
}

interface ReviewSummary {
  average: number;
  totalReal: number;
  breakdown: { stars: number; count: number }[];
}

interface ReviewableOrder {
  _id: string;
  orderId: string;
  orderDate: string;
  status: string;
}

export default function ReviewsSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchReviews = () => {
    fetch(`${API}/get-reviews/${productId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.success) {
          setReviews(data.reviews || []);
          setSummary(data.summary || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const displayAverage = summary?.totalReal ? summary.average : 5;
  const displayTotal = summary?.totalReal ?? 0;
  const breakdown = summary?.breakdown || [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0 }));
  const maxCount = Math.max(1, ...breakdown.map((b) => b.count));

  return (
    <section className="max-w-7xl mx-auto px-4 py-14">
      <h2 className="text-3xl font-bold text-gray-900 text-center">Customer Reviews</h2>

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={20} className={i < Math.round(displayAverage) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
            ))}
            <span className="ml-2 text-lg font-bold text-gray-900">{displayAverage.toFixed(2)} out of 5</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {displayTotal > 0 ? `Based on ${displayTotal} review${displayTotal === 1 ? '' : 's'}` : 'Be the first to leave a review'}
          </p>
        </div>

        <div className="w-full max-w-xs space-y-1.5">
          {breakdown.map((row) => (
            <div key={row.stars} className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-10 flex items-center gap-0.5">{row.stars} <Star size={11} className="text-yellow-400 fill-yellow-400" /></span>
              <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${(row.count / maxCount) * 100}%` }} />
              </div>
              <span className="w-8 text-right">{row.count}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors"
        >
          Write a review
        </button>
      </div>

      <div className="mt-12 max-w-5xl mx-auto divide-y divide-[#E8DCCB]">
        {loading && <p className="text-center text-gray-400 py-6">Loading reviews…</p>}
        {!loading && reviews.map((review) => (
          <div key={review._id} className="py-6 first:pt-0">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{review.name}</span>
                {review.isVerifiedPurchase && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <BadgeCheck size={12} /> Verified Purchase
                  </span>
                )}
              </div>
              {!review.isDefault && (
                <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">{review.comment}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <WriteReviewModal
          productId={productId}
          onClose={() => setShowForm(false)}
          onSubmitted={() => { setShowForm(false); fetchReviews(); }}
        />
      )}
    </section>
  );
}

function WriteReviewModal({
  productId,
  onClose,
  onSubmitted,
}: {
  productId: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [orders, setOrders] = useState<ReviewableOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notLoggedIn, setNotLoggedIn] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('token_login');
    if (!token) { setNotLoggedIn(true); setLoadingOrders(false); return; }

    fetch(`${API}/get-my-reviewable-orders/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success) {
          setOrders(data.orders || []);
          if (data.orders?.length === 1) setSelectedOrder(data.orders[0]._id);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, [productId]);

  const handleSubmit = async () => {
    const token = sessionStorage.getItem('token_login');
    if (!token) { setNotLoggedIn(true); return; }
    if (!selectedOrder) { toast.error('Please select which order this review is for'); return; }
    if (!comment.trim()) { toast.error('Please write a few words about the product'); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/add-review/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating, comment, orderId: selectedOrder }),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success(data.message || 'Review submitted for approval!');
        onSubmitted();
      } else {
        toast.error(data?.message || 'Could not submit review');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-gray-900 mb-4">Write a Review</h3>

        {notLoggedIn ? (
          <div className="text-center py-6">
            <p className="text-gray-600">Please log in to write a review for a product you&apos;ve purchased.</p>
            <a href="/login" className="mt-4 inline-block bg-[#81190B] hover:bg-[#5a1008] text-white font-semibold py-2.5 px-6 rounded-xl transition-colors">
              Log In
            </a>
          </div>
        ) : loadingOrders ? (
          <p className="text-center text-gray-400 py-6">Checking your orders…</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-600 py-4">
            We couldn&apos;t find a delivered or confirmed order for this product on your account.
            Only verified buyers can leave a review.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Your Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)}>
                    <Star size={26} className={n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                  </button>
                ))}
              </div>
            </div>

            {orders.length > 1 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Which order is this for?</label>
                <select
                  value={selectedOrder}
                  onChange={(e) => setSelectedOrder(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select an order</option>
                  {orders.map((o) => (
                    <option key={o._id} value={o._id}>
                      {o.orderId} — {new Date(o.orderDate).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Your Review</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="How was the taste, aroma, and quality?"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm resize-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-[#81190B] hover:bg-[#5a1008] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
            <p className="text-xs text-gray-400 text-center">Your review will appear after admin approval.</p>
          </div>
        )}
      </div>
    </div>
  );
}