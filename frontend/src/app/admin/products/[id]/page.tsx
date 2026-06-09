"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Save,
  ArrowLeft,
  Trash2,
  Plus,
  Upload,
  X,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { use } from "react";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function EditProduct({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [product, setProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [form, setForm] = useState<any>({});

  // ── Load product ──────────────────────────────────────────
  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    Promise.all([
      fetch(`${API}/get-product/${id}`).then((r) => r.json()),
      fetch(`${API}/admin/category`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([prodData, catData]) => {
        console.log("prodData", prodData);
        const p = prodData.data;
        if (!p) {
          toast.error("Product not found");
          // router.push("/admin/products");
          return;
        }
        setProduct(p);
        setCategories(catData.categories || []);
        setForm({
          product_name: p.product_name || "",
          product_description: p.product_description || "",
          extra_description: p.extra_description || "",
          category: p.category?._id || p.category || "",
          sub_category: p.sub_category?._id || p.sub_category || "",
          tag: p.tag || "",
          isVarient: p.isVarient ?? true,
          price: p.price ?? "",
          discount: p.discount ?? 0,
          afterDiscountPrice: p.afterDiscountPrice ?? "",
          stock: p.stock ?? "",
          isShowOnHomeScreen: p.isShowOnHomeScreen ?? false,
          color: p.color || "",
        });
        setVariants(
          p.Varient?.length
            ? p.Varient.map((v: any) => ({ ...v }))
            : [
                {
                  quantity: "",
                  price: "",
                  discount_percentage: 0,
                  price_after_discount: "",
                  stock_quantity: "",
                  isStock: true,
                },
              ],
        );
      })
      .catch(() => toast.error("Failed to load product"))
      .finally(() => setLoading(false));
  }, [id, router]);

  // Load sub-categories when category changes
  useEffect(() => {
    if (!form.category) {
      setSubCategories([]);
      return;
    }
    fetch(`${API}/admin/sub-category/${form.category}`)
      .then((r) => r.json())
      .then((d) => setSubCategories(d.subcategories || []))
      .catch(() => {});
  }, [form.category]);

  // ── Image handling ────────────────────────────────────────
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => {
      setNewImages((p) => [...p, f]);
      const reader = new FileReader();
      reader.onload = (e) =>
        setNewPreviews((p) => [...p, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };
  const removeNewImage = (i: number) => {
    setNewImages((p) => p.filter((_, j) => j !== i));
    setNewPreviews((p) => p.filter((_, j) => j !== i));
  };

  // ── Variant helpers ───────────────────────────────────────
  const updateVariant = (i: number, key: string, val: string | boolean) => {
    setVariants((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [key]: val };
      // Auto-calculate price after discount
      if ((key === "price" || key === "discount_percentage") && next[i].price) {
        const p = parseFloat(next[i].price) || 0;
        const d = parseFloat(next[i].discount_percentage) || 0;
        next[i].price_after_discount = parseFloat(
          (p - (p * d) / 100).toFixed(2),
        );
      }
      return next;
    });
  };
  const addVariant = () =>
    setVariants((p) => [
      ...p,
      {
        quantity: "",
        price: "",
        discount_percentage: 0,
        price_after_discount: "",
        stock_quantity: "",
        isStock: true,
      },
    ]);
  const removeVariant = (i: number) => {
    if (variants.length > 1) setVariants((p) => p.filter((_, j) => j !== i));
  };

  // ── Save ─────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_name?.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (form.isVarient && variants.some((v) => !v.quantity || !v.price)) {
      toast.error("Fill all variant fields");
      return;
    }

    setSaving(true);
    const token = sessionStorage.getItem("admin_token");
    try {
      const fd = new FormData();
      newImages.forEach((img) => fd.append("images", img));
      // Append form fields
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, String(v));
      });
      fd.set("Varient", JSON.stringify(variants));

      const res = await fetch(`${API}/update-product/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // No Content-Type — multipart
        body: fd,
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success("Product updated successfully!");
        router.push("/admin/products");
      } else {
        toast.error(data.message || "Failed to update product");
      }
    } catch {
      toast.error("Server error while saving");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#81190B] border-t-transparent" />
      </div>
    );
  if (!product)
    return (
      <div className="text-center py-16 text-gray-500">
        <p>Product not found</p>
        <Link
          href="/admin/products"
          className="text-[#81190B] hover:underline mt-2 inline-block"
        >
          ← Back to Products
        </Link>
      </div>
    );

  const existingImages = [
    product.ProductMainImage,
    product.SecondImage,
    product.ThirdImage,
    product.FourthImage,
    product.FifthImage,
  ].filter((img) => img?.url);
  const inputClass =
    "w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#81190B] text-sm transition-colors";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/products"
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Products
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900 truncate">
          {product.product_name}
        </h1>
      </div>

      <form onSubmit={handleSave} className="max-w-5xl space-y-5">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-900 border-b pb-2">
            Basic Information
          </h2>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Product Name *
            </label>
            <input
              value={form.product_name}
              onChange={(e) =>
                setForm((p: any) => ({ ...p, product_name: e.target.value }))
              }
              required
              className={inputClass}
              placeholder="Product name"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Description *
            </label>
            <textarea
              value={form.product_description}
              onChange={(e) =>
                setForm((p: any) => ({
                  ...p,
                  product_description: e.target.value,
                }))
              }
              required
              rows={4}
              className={inputClass + " resize-none"}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Extra Description
            </label>
            <textarea
              value={form.extra_description}
              onChange={(e) =>
                setForm((p: any) => ({
                  ...p,
                  extra_description: e.target.value,
                }))
              }
              rows={2}
              className={inputClass + " resize-none"}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((p: any) => ({
                    ...p,
                    category: e.target.value,
                    sub_category: "",
                  }))
                }
                className={inputClass}
              >
                <option value="">No Category</option>
                {categories.map((c: any) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Sub-category
              </label>
              <select
                value={form.sub_category}
                onChange={(e) =>
                  setForm((p: any) => ({ ...p, sub_category: e.target.value }))
                }
                disabled={!subCategories.length}
                className={`${inputClass} ${!subCategories.length ? "opacity-50" : ""}`}
              >
                <option value="">None</option>
                {subCategories.map((s: any) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Tag
              </label>
              <input
                value={form.tag}
                onChange={(e) =>
                  setForm((p: any) => ({ ...p, tag: e.target.value }))
                }
                placeholder="bestseller, organic"
                className={inputClass}
              />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isShowOnHomeScreen}
              onChange={(e) =>
                setForm((p: any) => ({
                  ...p,
                  isShowOnHomeScreen: e.target.checked,
                }))
              }
              className="w-4 h-4 accent-[#81190B]"
            />
            <span className="text-sm font-semibold text-gray-700">
              Show on Home Screen
            </span>
          </label>
        </div>

        {/* Images */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-gray-900 border-b pb-2 mb-4">
            Product Images
          </h2>

          {/* Existing images */}
          {existingImages.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Current Images
              </p>
              <div className="flex gap-3 flex-wrap">
                {existingImages.map((img: any, i: number) => (
                  <div
                    key={i}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 ${i === 0 ? "border-amber-400" : "border-gray-200"}`}
                  >
                    <Image
                      src={img.url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                    {i === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 text-[9px] font-bold bg-amber-400 text-white text-center py-0.5">
                        MAIN
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload new */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-[#81190B] transition-colors"
          >
            <Upload size={24} className="text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 font-medium">
              Click to add new images
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              New images will be appended to existing ones
            </p>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {newPreviews.length > 0 && (
            <div className="flex gap-3 mt-3 flex-wrap">
              {newPreviews.map((src, i) => (
                <div
                  key={i}
                  className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-green-300 group"
                >
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    className="absolute inset-0 bg-red-500/70 text-white hidden group-hover:flex items-center justify-center"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pricing & Variants */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <h2 className="font-bold text-gray-900">Pricing & Variants</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isVarient}
                onChange={(e) =>
                  setForm((p: any) => ({ ...p, isVarient: e.target.checked }))
                }
                className="w-4 h-4 accent-[#81190B]"
              />
              <span className="text-sm font-semibold text-gray-700">
                Has Variants (multiple sizes/weights)
              </span>
            </label>
          </div>

          {form.isVarient ? (
            <div className="space-y-3">
              {variants.map((v: any, i: number) => (
                <div
                  key={i}
                  className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-gray-50 rounded-xl p-4 relative group"
                >
                  {[
                    ["Size / Qty", "quantity", "text"],
                    ["MRP (₹)", "price", "number"],
                    ["Discount %", "discount_percentage", "number"],
                    ["Sale Price", "price_after_discount", "number"],
                    ["Stock", "stock_quantity", "number"],
                  ].map(([label, key, type]) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        {label}
                      </label>
                      <input
                        type={type}
                        value={v[key] ?? ""}
                        onChange={(e) => updateVariant(i, key, e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#81190B]"
                        placeholder={key === "quantity" ? "250g" : "0"}
                      />
                    </div>
                  ))}
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-2 text-[#81190B] text-sm font-semibold hover:text-[#5a1008] transition-colors"
              >
                <Plus size={16} /> Add Variant
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {[
                ["MRP (₹)", "price"],
                ["Discount %", "discount"],
                ["Sale Price (₹)", "afterDiscountPrice"],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {label}
                  </label>
                  <input
                    type="number"
                    value={form[key] ?? ""}
                    onChange={(e) =>
                      setForm((p: any) => ({ ...p, [key]: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#81190B] hover:bg-[#5a1008] text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors text-base"
        >
          {saving ? (
            <>
              <RefreshCw size={18} className="animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save size={18} /> Save Changes
            </>
          )}
        </button>
      </form>
    </div>
  );
}
