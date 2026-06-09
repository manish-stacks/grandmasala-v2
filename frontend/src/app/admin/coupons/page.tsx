"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [form, setForm] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    minOrderValue: "",
    maxUsage: "",
    expirationDate: "",
  });
  const [loading, setLoading] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_URL;

  const fetchCoupons = async () => {
    try {
      const res = await fetch(`${API}/get-coupon`);
      const d = await res.json();
      console.log("Coupons", d);
      setCoupons(d.data || []);
    } catch {}
  };
  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = sessionStorage.getItem("admin_token");
      const body: any = {
        code: form.code.toUpperCase(),
        discountType: form.discountType,
        discount: Number(form.discountValue),
        minimumOrderAmount: Number(form.minOrderValue || 0),
        maxUsage: Number(form.maxUsage || 999),
      };
      if (form.expirationDate) body.expirationDate = form.expirationDate;

      const res = await fetch(`${API}/add-coupon`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success("Coupon created!");
        setForm({
          code: "",
          discountType: "percentage",
          discountValue: "",
          minOrderValue: "",
          maxUsage: "",
          expirationDate: "",
        });
        fetchCoupons();
      } else toast.error(data.message || "Failed");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      const token = sessionStorage.getItem("admin_token");
      await fetch(`${API}/delete-coupon/${code}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Deleted");
      fetchCoupons();
    } catch {
      toast.error("Failed to delete");
    }
  };

  // today's date in yyyy-mm-dd for min attr
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Coupons</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Create Form ── */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">Create Coupon</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Code *
                </label>
                <input
                  value={form.code}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  required
                  placeholder="SAVE20"
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#81190B] font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Discount Type
                </label>
                <select
                  value={form.discountType}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, discountType: e.target.value }))
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#81190B] text-sm"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Discount Value *
                </label>
                <input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, discountValue: e.target.value }))
                  }
                  required
                  placeholder={
                    form.discountType === "percentage" ? "20 (%)" : "50 (₹)"
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#81190B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Min Order Value (₹)
                </label>
                <input
                  type="number"
                  value={form.minOrderValue}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, minOrderValue: e.target.value }))
                  }
                  placeholder="299"
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#81190B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Max Usage
                </label>
                <input
                  type="number"
                  value={form.maxUsage}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, maxUsage: e.target.value }))
                  }
                  placeholder="100"
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#81190B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Expiration Date{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  value={form.expirationDate}
                  min={todayStr}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, expirationDate: e.target.value }))
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#81190B] text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#81190B] text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#5a1008] transition-colors"
              >
                <Plus size={16} />
                {loading ? "Creating..." : "Create Coupon"}
              </button>
            </form>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="p-4 border-b">
              <h2 className="font-bold text-gray-900">
                All Coupons ({coupons.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Code",
                      "Value",
                      "Min Order",
                      "Used",
                      "Expires",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coupons.map((c) => {
                    const isExpired =
                      c.expirationDate &&
                      new Date(c.expirationDate) < new Date();
                    return (
                      <tr key={c._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono font-bold text-gray-900">
                          {c.code}
                        </td>
                        {/* <td className="px-4 py-3 text-sm capitalize text-gray-600">
                          {c.discountType}
                        </td> */}
                        <td className="px-4 py-3 text-sm font-semibold text-[#81190B]">
                          {c.discountType === "percentage"
                            ? `${c.discount}%`
                            : `₹${c.discount}`}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          ₹{c.minimumOrderAmount || 0}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {c.usageCount || 0}/{c.maxUsage || "∞"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {c.expirationDate ? (
                            <span
                              className={
                                isExpired
                                  ? "text-red-500 font-medium"
                                  : "text-gray-600"
                              }
                            >
                              {isExpired && "⚠ "}
                              {new Date(c.expirationDate).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-400">No expiry</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDelete(c.code)}
                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {coupons.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-gray-400"
                      >
                        No coupons yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
