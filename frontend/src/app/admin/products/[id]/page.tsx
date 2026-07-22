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
  GripVertical,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { use } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

type ImageItem = {
  id: string;
  type: "existing" | "new";
  url: string; // preview URL (cloudinary url OR base64 data url)
  public_id?: string; // only for existing images
  file?: File; // only for new images
};

const MAX_IMAGES = 5;

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
  const [variants, setVariants] = useState<any[]>([]);
  const [form, setForm] = useState<any>({});

  // ── Unified image state (existing + new, in display/save order) ──
  const [images, setImages] = useState<ImageItem[]>([]);
  const originalPublicIdsRef = useRef<string[]>([]); // to compute removedImages on save

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

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
        const p = prodData.data;
        if (!p) {
          toast.error("Product not found");
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

        // Build initial unified images array from the 5 fixed slots
        const slots = [
          p.ProductMainImage,
          p.SecondImage,
          p.ThirdImage,
          p.FourthImage,
          p.FifthImage,
        ].filter((img) => img?.url);

        const initialImages: ImageItem[] = slots.map((img: any) => ({
          id: img.public_id,
          type: "existing",
          url: img.url,
          public_id: img.public_id,
        }));

        setImages(initialImages);
        originalPublicIdsRef.current = initialImages.map(
          (img) => img.public_id as string,
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
    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    Array.from(files).forEach((f) => {
      const id = `new-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages((prev) => [
          ...prev,
          {
            id,
            type: "new",
            url: e.target?.result as string,
            file: f,
          },
        ]);
      };
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (imgId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imgId));
  };
  const handlePointerDown = (i: number) => (e: React.PointerEvent) => {
    setDraggedIndex(i);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggedIndex === null) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const card = el?.closest("[data-drag-index]") as HTMLElement | null;
    if (card) {
      const idx = Number(card.dataset.dragIndex);
      if (!Number.isNaN(idx) && idx !== hoverIndex) setHoverIndex(idx);
    }
  };

  const handlePointerUp = () => {
    if (
      draggedIndex !== null &&
      hoverIndex !== null &&
      draggedIndex !== hoverIndex
    ) {
      setImages((prev) => {
        const next = [...prev];
        const [moved] = next.splice(draggedIndex, 1);
        next.splice(hoverIndex, 0, moved);
        return next;
      });
    }
    setDraggedIndex(null);
    setHoverIndex(null);
  };

  // ── Variant helpers ───────────────────────────────────────
  const updateVariant = (i: number, key: string, val: string | boolean) => {
    setVariants((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [key]: val };
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
    if (images.length === 0) {
      toast.error("At least one product image is required");
      return;
    }

    setSaving(true);
    const token = sessionStorage.getItem("admin_token");
    try {
      const fd = new FormData();

      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, String(v));
      });
      fd.set("Varient", JSON.stringify(variants));

      // Describe the final image order — backend uses this to rebuild
      // ProductMainImage..FifthImage in the exact order shown here.
      const imageOrder = images.map((img) =>
        img.type === "existing"
          ? { type: "existing", public_id: img.public_id, url: img.url }
          : { type: "new" },
      );
      fd.append("imageOrder", JSON.stringify(imageOrder));

      // Existing images that were removed by the user — backend can
      // clean these up from Cloudinary.
      const keptExistingIds = images
        .filter((img) => img.type === "existing")
        .map((img) => img.public_id);
      const removedImages = originalPublicIdsRef.current.filter(
        (pid) => !keptExistingIds.includes(pid),
      );
      fd.append("removedImages", JSON.stringify(removedImages));

      // New files, appended in the same order they appear in imageOrder
      images
        .filter((img) => img.type === "new")
        .forEach((img) => fd.append("images", img.file as File));

      const res = await fetch(`${API}/update-product/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
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
        {/* Basic Info — unchanged, omitted here for brevity, keep as-is */}
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

        {/* Images — unified, drag to reorder, first = Main */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <h2 className="font-bold text-gray-900">Product Images</h2>
            <span className="text-xs text-gray-400">
              Drag to reorder · first image is the Main Image
            </span>
          </div>

          {images.length > 0 && (
            <div className="flex gap-3 flex-wrap mb-4">
              {images.map((img, i) => (
                <div
                  key={img.id}
                  data-drag-index={i}
                  onPointerDown={handlePointerDown(i)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  style={{ touchAction: "none" }} // stops mobile scroll from hijacking the drag
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 cursor-move group select-none transition-all ${
                    i === 0 ? "border-amber-400" : "border-gray-200"
                  } ${draggedIndex === i ? "opacity-40 scale-95" : ""} ${
                    hoverIndex === i &&
                    draggedIndex !== null &&
                    draggedIndex !== i
                      ? "ring-2 ring-[#81190B] ring-offset-1"
                      : ""
                  }`}
                >
                  <img
                    src={img.url}
                    alt=""
                    draggable={false}
                    className="w-full h-full object-cover pointer-events-none"
                  />

                  {i === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 text-[9px] font-bold bg-amber-400 text-white text-center py-0.5 pointer-events-none">
                      MAIN
                    </span>
                  )}

                  <div className="absolute top-1 left-1 p-0.5 rounded bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <GripVertical size={12} />
                  </div>

                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()} // so clicking X doesn't start a drag
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length < MAX_IMAGES && (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-[#81190B] transition-colors"
            >
              <Upload size={24} className="text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">
                Click to add new images
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {MAX_IMAGES - images.length} slot(s) remaining
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
          )}
        </div>

        {/* Pricing & Variants — unchanged */}
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
