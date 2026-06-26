"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Star, Check, X, Trash2, BadgeCheck } from "lucide-react";
import { toast } from "react-toastify";

type StatusTab = "pending" | "approved" | "rejected";

export default function AdminReviews() {
  const [tab, setTab] = useState<StatusTab>("pending");
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const API = process.env.NEXT_PUBLIC_API_URL;

  const fetchReviews = async (status: StatusTab) => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("admin_token");
      const res = await fetch(`${API}/admin/reviews?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleStatusChange = async (reviewId: string, status: "approved" | "rejected") => {
    setActingOn(reviewId);
    try {
      const token = sessionStorage.getItem("admin_token");
      const res = await fetch(`${API}/admin/reviews/${reviewId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(status === "approved" ? "Review approved" : "Review rejected");
        setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      } else {
        toast.error(data.message || "Failed to update review");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setActingOn(null);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Delete this review permanently?")) return;
    setActingOn(reviewId);
    try {
      const token = sessionStorage.getItem("admin_token");
      const res = await fetch(`${API}/admin/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Review deleted");
        setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      } else {
        toast.error(data.message || "Failed to delete review");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setActingOn(null);
    }
  };

  const tabs: { key: StatusTab; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t.key
                ? "bg-[#81190B] text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-4 border-b">
          <h2 className="font-bold text-gray-900">
            {tabs.find((t) => t.key === tab)?.label} Reviews ({reviews.length})
          </h2>
        </div>

        <div className="divide-y divide-gray-100">
          {loading && (
            <p className="px-4 py-8 text-center text-gray-400">Loading reviews…</p>
          )}

          {!loading && reviews.length === 0 && (
            <p className="px-4 py-8 text-center text-gray-400">
              No {tab} reviews right now.
            </p>
          )}

          {!loading &&
            reviews.map((review) => (
              <div key={review._id} className="px-4 py-4 flex flex-col sm:flex-row gap-4">
                {/* Product thumb */}
                <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-[#F4F1EA] relative overflow-hidden border border-gray-100">
                  {review.product?.ProductMainImage?.url ? (
                    <Image
                      src={review.product.ProductMainImage.url}
                      alt={review.product?.product_name || "Product"}
                      fill
                      className="object-contain p-1"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🌶️</div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">
                      {review.product?.product_name || "Unknown Product"}
                    </p>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                        />
                      ))}
                    </div>
                    <span className="font-medium text-gray-700 text-sm">{review.name}</span>
                    {review.isVerifiedPurchase && (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <BadgeCheck size={11} /> Verified
                      </span>
                    )}
                    {review.user?.Email && (
                      <span className="text-xs text-gray-400 truncate">{review.user.Email}</span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col gap-2 flex-shrink-0">
                  {tab !== "approved" && (
                    <button
                      onClick={() => handleStatusChange(review._id, "approved")}
                      disabled={actingOn === review._id}
                      className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Check size={14} /> Approve
                    </button>
                  )}
                  {tab !== "rejected" && (
                    <button
                      onClick={() => handleStatusChange(review._id, "rejected")}
                      disabled={actingOn === review._id}
                      className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <X size={14} /> Reject
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review._id)}
                    disabled={actingOn === review._id}
                    className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}