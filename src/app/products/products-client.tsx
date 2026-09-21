"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  CreditCard,
  QrCode,
  ShieldCheck,
  Terminal,
  Globe,
  FileText,
  CheckCircle2,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  X,
  Check,
  Building,
  Sparkles,
  DollarSign,
  Upload,
} from "lucide-react";
import { Product } from "@/db/schema";
import { createProductAction, updateProductAction, deleteProductAction } from "./actions";
import { useToast } from "@/components/toast-context";

const CATEGORIES = [
  "All",
  "Point of Sale",
  "Payment Gateway",
  "Corporate Cards",
  "Merchant SaaS",
  "Enterprise Banking",
];

const CATEGORY_ICONS: Record<string, any> = {
  "Point of Sale": Terminal,
  "Payment Gateway": Globe,
  "Corporate Cards": CreditCard,
  "Merchant SaaS": FileText,
  "Enterprise Banking": ShieldCheck,
};

export function ProductsClient({
  initialProducts,
  deals = [],
}: {
  initialProducts: Product[];
  deals: any[];
}) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [productsList, setProductsList] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [timeframe, setTimeframe] = useState<"WEEK" | "MONTH" | "YEAR">("MONTH");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [assignProduct, setAssignProduct] = useState<Product | null>(null);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return productsList.filter((p) => {
      const matchCat = selectedCategory === "All" || p.category === selectedCategory;
      const matchSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [productsList, selectedCategory, search]);

  const featuredProducts = productsList.slice(0, 5);

  function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    startTransition(async () => {
      try {
        await deleteProductAction(id);
        setProductsList((prev) => prev.filter((p) => p.id !== id));
        toast.success("Product deleted successfully");
      } catch (err: any) {
        toast.error(err.message || "Failed to delete product");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Header Controls (Modeled after Image 4) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Products & Solutions
          </h2>
          <p className="text-xs text-slate-500">
            Enterprise hardware, payment APIs, card programs, and SaaS modules.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Timeframe pill toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200/80 text-xs font-medium">
            {(["WEEK", "MONTH", "YEAR"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 rounded-full transition-all capitalize ${
                  timeframe === t
                    ? "bg-white text-slate-900 font-bold shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {t.toLowerCase()}
              </button>
            ))}
          </div>

          {/* "+ New Product" button */}
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-[#4361ee] hover:bg-[#3a56d4] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-300/30 active:scale-[0.98] transition-all"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>+ New product</span>
          </button>
        </div>
      </div>

      {/* Featured Products Carousel Row (Modeled after Image 4) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Most Used Solutions & Hardware
          </p>
          <span className="text-xs text-[#4361ee] font-semibold hover:underline cursor-pointer">
            View analytics ↗
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {featuredProducts.map((product) => {
            const IconComponent = CATEGORY_ICONS[product.category] || Package;
            return (
              <div
                key={product.id}
                className="group relative flex flex-col justify-between rounded-2xl bg-white border border-slate-200/80 p-4 shadow-2xs hover:shadow-md hover:border-indigo-200 transition-all duration-200"
              >
                <Link href={`/products/${product.id}`} className="block">
                  {/* Product Image Box */}
                  <div className="relative aspect-16/10 w-full rounded-xl overflow-hidden bg-slate-100 mb-3 border border-slate-100 flex items-center justify-center">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-slate-50 to-indigo-50/50">
                        <IconComponent size={28} className="text-[#4361ee] group-hover:scale-110 transition-transform" />
                      </div>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-[#4361ee] transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {product.category}
                  </p>
                  <p className="text-xs font-mono font-bold text-slate-800 mt-2">
                    SAR {product.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </Link>

                {/* Actions: View Details & Assign */}
                <div className="mt-4 flex items-center gap-1.5 pt-2 border-t border-slate-100">
                  <Link
                    href={`/products/${product.id}`}
                    className="flex-1 flex items-center justify-center gap-1 rounded-full border border-slate-200/90 bg-slate-50/80 hover:bg-indigo-50 hover:border-indigo-200 hover:text-[#4361ee] py-1.5 text-[11px] font-bold text-slate-700 shadow-2xs transition-colors"
                  >
                    <span>Details</span>
                    <ChevronRight size={12} />
                  </Link>

                  <button
                    onClick={() => setAssignProduct(product)}
                    className="flex items-center justify-center p-1.5 rounded-full border border-slate-200/90 bg-slate-50/80 hover:bg-indigo-50 hover:border-indigo-200 hover:text-[#4361ee] text-slate-600 transition-colors shadow-2xs"
                    title="Assign to Deal"
                  >
                    <Sparkles size={13} className="text-[#4361ee]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Catalog & Inventory Table Section */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by title, SKU, or category..."
              className="w-full rounded-full border border-border bg-surface pl-9 pr-4 py-2 text-xs text-text placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-all shadow-2xs"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-brand text-white shadow-2xs font-bold"
                    : "bg-surface border border-border text-text-muted hover:text-text hover:bg-surface-2"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                <th className="py-3 px-4">Solution / Product</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Unit Price</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const IconComp = CATEGORY_ICONS[product.category] || Package;
                  return (
                    <tr
                      key={product.id}
                      className="group hover:bg-surface-2/60 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Link href={`/products/${product.id}`} className="flex items-center gap-3 group/item">
                          <div className="relative h-10 w-12 shrink-0 rounded-xl overflow-hidden bg-surface-2 border border-border flex items-center justify-center">
                            {product.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-full w-full object-cover group-hover/item:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-brand/10 text-brand">
                                <IconComp size={18} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-text group-hover/item:text-brand transition-colors">
                              {product.name}
                            </p>
                            <p className="text-[11px] text-text-muted line-clamp-1 max-w-xs">
                              {product.description || "Enterprise financial solution"}
                            </p>
                          </div>
                        </Link>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-text-muted">
                        {product.sku}
                      </td>

                      <td className="py-3 px-4">
                        <span className="rounded-full bg-surface-2 border border-border px-2.5 py-1 text-[10.5px] font-semibold text-text">
                          {product.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-text">
                        SAR {product.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${
                            product.status === "ACTIVE"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : product.status === "DRAFT"
                              ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                              : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/products/${product.id}`}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-text-muted hover:text-brand hover:bg-surface-2 transition-colors"
                            title="Open dedicated product page"
                          >
                            <span>Open Page</span>
                            <ExternalLink size={11} />
                          </Link>
                          <button
                            onClick={() => setEditProduct(product)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-surface-2 transition-colors cursor-pointer"
                            title="Edit product"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* "+ New Product" Modal */}
      {createModalOpen && (
        <ProductFormModal
          title="Create New Product"
          onClose={() => setCreateModalOpen(false)}
          onSave={(newProd) => {
            setProductsList((prev) => [newProd, ...prev]);
            setCreateModalOpen(false);
          }}
        />
      )}

      {/* Edit Product Modal */}
      {editProduct && (
        <ProductFormModal
          title="Edit Product"
          initialData={editProduct}
          onClose={() => setEditProduct(null)}
          onSave={(updated) => {
            setProductsList((prev) =>
              prev.map((p) => (p.id === updated.id ? updated : p))
            );
            setEditProduct(null);
          }}
        />
      )}

      {/* Assign Product to Deal Modal */}
      {assignProduct && (
        <AssignToDealModal
          product={assignProduct}
          deals={deals}
          onClose={() => setAssignProduct(null)}
        />
      )}
    </div>
  );
}

function ProductFormModal({
  title,
  initialData,
  onClose,
  onSave,
}: {
  title: string;
  initialData?: Product;
  onClose: () => void;
  onSave: (product: Product) => void;
}) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(initialData?.name || "");
  const [sku, setSku] = useState(initialData?.sku || "");
  const [category, setCategory] = useState(initialData?.category || "Point of Sale");
  const [price, setPrice] = useState(initialData ? String(initialData.price) : "");
  const [currency] = useState("SAR");
  const [status, setStatus] = useState(initialData?.status || "ACTIVE");
  const [description, setDescription] = useState(initialData?.description || "");
  const [features, setFeatures] = useState(initialData?.features || "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [imageTab, setImageTab] = useState<"upload" | "url">("upload");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
      toast.success("Image selected from computer");
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) {
      toast.error("Name and SKU are required");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("sku", sku);
      formData.append("category", category);
      formData.append("price", price || "0");
      formData.append("currency", currency);
      formData.append("status", status);
      formData.append("description", description);
      formData.append("features", features);
      formData.append("imageUrl", imageUrl);

      try {
        if (initialData) {
          await updateProductAction(initialData.id, formData);
          onSave({
            ...initialData,
            name,
            sku,
            category,
            price: parseFloat(price || "0"),
            currency,
            status,
            description,
            features,
            imageUrl: imageUrl || null,
            updatedAt: new Date(),
          });
          toast.success("Product updated successfully");
        } else {
          const res = await createProductAction(formData);
          onSave({
            id: res.id,
            name,
            sku,
            category,
            price: parseFloat(price || "0"),
            currency,
            status,
            description,
            features,
            imageUrl: imageUrl || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          toast.success("Product created successfully");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to save product");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Product Image Chooser */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Product Image
            </label>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <button
                type="button"
                onClick={() => setImageTab("upload")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  imageTab === "upload"
                    ? "bg-[#4361ee] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Upload from Computer
              </button>
              <button
                type="button"
                onClick={() => setImageTab("url")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  imageTab === "url"
                    ? "bg-[#4361ee] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Paste Web Address
              </button>
            </div>

            {imageTab === "upload" ? (
              <div className="space-y-1.5">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-[#4361ee] hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>
            ) : (
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or image web address"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              />
            )}

            {imageUrl && (
              <div className="flex items-center gap-3 pt-2">
                <div className="h-14 w-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Remove Image
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MYTM Smart POS X990"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                SKU / Identifier *
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. MYTM-POS-990"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Price (SAR) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1850.00"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="DRAFT">DRAFT</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed commercial description..."
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Features (comma separated)
            </label>
            <input
              type="text"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="Mada Certified, Instant Settlement, NFC, 4G"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-[#4361ee] hover:bg-[#3a56d4] px-5 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-300/30 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignToDealModal({
  product,
  deals = [],
  onClose,
}: {
  product: Product;
  deals: any[];
  onClose: () => void;
}) {
  const toast = useToast();
  const [selectedDealId, setSelectedDealId] = useState(deals[0]?.id || "");
  const [units, setUnits] = useState("1");

  function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    const deal = deals.find((d) => d.id === selectedDealId);
    toast.success(
      `Assigned ${units}x ${product.name} (SAR ${(product.price * parseInt(units || "1")).toLocaleString()}) to ${deal ? deal.title : "Deal"}`
    );
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-[#4361ee]">
              <Package size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Assign to Deal Quote</h3>
              <p className="text-[11px] text-slate-500">{product.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleAssign} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Select Active Deal
            </label>
            <select
              value={selectedDealId}
              onChange={(e) => setSelectedDealId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
            >
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} (SAR {d.value?.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Quantity / Licenses
            </label>
            <input
              type="number"
              min="1"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100 p-3 flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">Estimated Add-On Value:</span>
            <span className="font-mono font-bold text-[#4361ee] text-sm">
              SAR {(product.price * parseInt(units || "1")).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-[#4361ee] hover:bg-[#3a56d4] px-5 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-300/30"
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
