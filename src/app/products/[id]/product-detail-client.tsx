"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  ArrowLeft,
  Edit2,
  Trash2,
  Plus,
  FileText,
  DollarSign,
  TrendingUp,
  Layers,
  Sparkles,
  ExternalLink,
  Upload,
  Link as LinkIcon,
  Check,
  X,
  FileDown,
  Clock,
  Building,
  Terminal,
  Globe,
  CreditCard,
  ShieldCheck,
  Tag,
  CheckCircle2,
  Calendar,
  Eye,
  AlertCircle,
} from "lucide-react";
import { Product, ProductDocument } from "@/db/schema";
import {
  updateProductAction,
  deleteProductAction,
  quickUpdateProductImageAction,
  assignDealToProductAction,
  removeDealFromProductAction,
  addProductDocumentAction,
  deleteProductDocumentAction,
} from "../actions";
import { useToast } from "@/components/toast-context";

const CATEGORIES = [
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

export function ProductDetailClient({
  initialProduct,
  availableDeals = [],
}: {
  initialProduct: any;
  availableDeals: any[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [product, setProduct] = useState<any>(initialProduct);
  const [activeTab, setActiveTab] = useState<"deals" | "documents" | "specs">("deals");

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [assignDealModalOpen, setAssignDealModalOpen] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);

  const assignedDeals: any[] = product.deals || [];
  const documents: ProductDocument[] = product.documents || [];

  // Metrics
  const totalPipelineValue = assignedDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const wonDealsValue = assignedDeals
    .filter((d) => d.stage?.name?.toLowerCase().includes("won") || d.status === "WON")
    .reduce((sum, d) => sum + (d.value || 0), 0);

  const IconComp = CATEGORY_ICONS[product.category] || Package;

  function handleDelete() {
    if (!confirm(`Are you sure you want to permanently delete "${product.name}"?`)) return;
    startTransition(async () => {
      try {
        await deleteProductAction(product.id);
        toast.success("Product deleted successfully");
        router.push("/products");
      } catch (err: any) {
        toast.error(err.message || "Failed to delete product");
      }
    });
  }

  function handleUnassignDeal(dealId: string) {
    if (!confirm("Remove this deal from the product?")) return;
    startTransition(async () => {
      try {
        await removeDealFromProductAction(dealId, product.id);
        setProduct((prev: any) => ({
          ...prev,
          deals: prev.deals.filter((d: any) => d.id !== dealId),
        }));
        toast.success("Deal unassigned from product");
      } catch (err: any) {
        toast.error(err.message || "Failed to unassign deal");
      }
    });
  }

  function handleDeleteDocument(docId: string) {
    if (!confirm("Are you sure you want to delete this document?")) return;
    startTransition(async () => {
      try {
        await deleteProductDocumentAction(docId, product.id);
        setProduct((prev: any) => ({
          ...prev,
          documents: prev.documents.filter((doc: any) => doc.id !== docId),
        }));
        toast.success("Document deleted");
      } catch (err: any) {
        toast.error(err.message || "Failed to delete document");
      }
    });
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link
            href="/products"
            className="flex items-center gap-1 font-bold text-slate-600 hover:text-[#4361ee] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Products &amp; Solutions</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-400">{product.category}</span>
          <span>/</span>
          <span className="font-bold text-slate-800 truncate max-w-xs">{product.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAssignDealModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-colors"
          >
            <Sparkles size={14} className="text-[#4361ee]" />
            <span>Assign Deal</span>
          </button>

          <button
            onClick={() => setDocumentModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-colors"
          >
            <Upload size={14} className="text-slate-500" />
            <span>Add Document</span>
          </button>

          <button
            onClick={() => setEditModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-[#4361ee] hover:bg-[#3a56d4] px-4 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors"
          >
            <Edit2 size={13} />
            <span>Edit Product</span>
          </button>

          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Product"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Product Hero Showcase */}
      <div className="rounded-3xl bg-white border border-slate-200/90 shadow-2xs p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Product Image Showcase */}
          <div className="lg:col-span-5 space-y-3">
            <div className="group relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-[#4361ee] mb-3 border border-indigo-100">
                    <IconComp size={36} />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">No Product Image</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Upload a photo or paste an image URL</p>
                </div>
              )}

              {/* Hover Quick Change Overlay */}
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => setImageModalOpen(true)}
                  className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-slate-900 shadow-lg hover:bg-white active:scale-95 transition-all"
                >
                  <Upload size={14} className="text-[#4361ee]" />
                  <span>{product.imageUrl ? "Change Product Image" : "Upload Product Image"}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] text-slate-400">
                Supports computer file upload &amp; direct web URLs
              </span>
              <button
                onClick={() => setImageModalOpen(true)}
                className="text-[11px] font-bold text-[#4361ee] hover:underline"
              >
                Manage Image
              </button>
            </div>
          </div>

          {/* Right Column: Commercial Overview & Metrics */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100/80 px-2.5 py-0.5 text-[11px] font-bold text-[#4361ee]">
                  <IconComp size={12} />
                  {product.category}
                </span>

                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${
                    product.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                      : product.status === "DRAFT"
                      ? "bg-blue-50 text-blue-700 border border-blue-200/70"
                      : "bg-rose-50 text-rose-700 border border-rose-200/70"
                  }`}
                >
                  {product.status}
                </span>

                <span className="font-mono text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  SKU: {product.sku}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {product.name}
              </h1>

              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  SAR {product.price?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  per unit / license
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-600 leading-relaxed">
              {product.description ||
                "Enterprise solution tailored for financial workflows, transaction volume scaling, and seamless merchant deployment."}
            </p>

            {/* Features Cloud */}
            {product.features && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Included Features &amp; Capabilities
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {product.features.split(",").map((feat: string, i: number) => {
                    const clean = feat.trim();
                    if (!clean) return null;
                    return (
                      <span
                        key={i}
                        className="flex items-center gap-1 rounded-lg bg-slate-100/90 border border-slate-200/80 px-2.5 py-1 text-xs font-medium text-slate-700"
                      >
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        {clean}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Financial Performance KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Assigned Deals
                </span>
                <p className="text-xl font-bold text-slate-900">{assignedDeals.length}</p>
                <span className="text-[10px] text-slate-500">Active quotes</span>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Pipeline Value
                </span>
                <p className="text-lg font-bold font-mono text-indigo-600">
                  SAR {totalPipelineValue.toLocaleString()}
                </p>
                <span className="text-[10px] text-slate-500">Total pipeline</span>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Won Revenue
                </span>
                <p className="text-lg font-bold font-mono text-emerald-600">
                  SAR {wonDealsValue.toLocaleString()}
                </p>
                <span className="text-[10px] text-slate-500">Realized revenue</span>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Documents
                </span>
                <p className="text-xl font-bold text-slate-900">{documents.length}</p>
                <span className="text-[10px] text-slate-500">Specs &amp; Guides</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("deals")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "deals"
              ? "bg-[#4361ee] text-white shadow-2xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Sparkles size={14} />
          <span>Deals Assigned to Product ({assignedDeals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("documents")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "documents"
              ? "bg-[#4361ee] text-white shadow-2xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <FileText size={14} />
          <span>Product Documents &amp; Specs ({documents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("specs")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "specs"
              ? "bg-[#4361ee] text-white shadow-2xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Layers size={14} />
          <span>Technical Specifications</span>
        </button>
      </div>

      {/* TAB CONTENT: DEALS */}
      {activeTab === "deals" && (
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Deals Featuring this Product</h3>
              <p className="text-xs text-slate-500">
                All customer opportunities and proposals where {product.name} is quoted.
              </p>
            </div>
            <button
              onClick={() => setAssignDealModalOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 px-3.5 py-1.5 text-xs font-bold text-[#4361ee] hover:bg-indigo-100/70 transition-colors shadow-2xs"
            >
              <Plus size={14} />
              <span>+ Assign Deal</span>
            </button>
          </div>

          {assignedDeals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-[#4361ee]">
                <Package size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">No deals assigned yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Attach active CRM deals to this product to track pipeline revenue, quote status, and sales velocity.
                </p>
              </div>
              <button
                onClick={() => setAssignDealModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[#4361ee] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#3a56d4] transition-all"
              >
                <Plus size={14} />
                <span>Assign a Deal Now</span>
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Deal Title</th>
                    <th className="py-3 px-4">Account / Client</th>
                    <th className="py-3 px-4">Value</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4">Expected Close</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignedDeals.map((deal: any) => (
                    <tr key={deal.id} className="group hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          href="/deals"
                          className="font-bold text-slate-900 group-hover:text-[#4361ee] transition-colors"
                        >
                          {deal.title}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {deal.account?.name || "Independent Client"}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        SAR {deal.value?.toLocaleString() || "0"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10.5px] font-semibold text-slate-700">
                          {deal.stage?.name || deal.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {deal.expectedClose
                          ? new Date(deal.expectedClose).toLocaleDateString()
                          : "TBD"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleUnassignDeal(deal.id)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                        >
                          Unassign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: DOCUMENTS */}
      {activeTab === "documents" && (
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Product Documents &amp; Collateral</h3>
              <p className="text-xs text-slate-500">
                Brochures, API specifications, compliance certificates, and integration guides.
              </p>
            </div>
            <button
              onClick={() => setDocumentModalOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 px-3.5 py-1.5 text-xs font-bold text-[#4361ee] hover:bg-indigo-100/70 transition-colors shadow-2xs"
            >
              <Plus size={14} />
              <span>+ Upload Document</span>
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-[#4361ee]">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">No documents uploaded yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Upload PDF specs, hardware brochures, or paste document URLs for this product.
                </p>
              </div>
              <button
                onClick={() => setDocumentModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[#4361ee] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#3a56d4] transition-all"
              >
                <Upload size={14} />
                <span>Upload First Document</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 hover:bg-white hover:shadow-sm hover:border-indigo-200 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[#4361ee]">
                        <FileText size={18} />
                      </div>
                      <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                        {doc.fileType}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#4361ee] transition-colors">
                      {doc.title}
                    </h4>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      {doc.fileSize && <span>{doc.fileSize}</span>}
                      {doc.fileSize && <span>•</span>}
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-bold text-[#4361ee] hover:underline"
                    >
                      <Eye size={12} />
                      <span>View Document</span>
                    </a>

                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SPECS */}
      {activeTab === "specs" && (
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-2xs p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Technical Specifications &amp; Metadata</h3>
            <p className="text-xs text-slate-500">
              Database properties, unique identifiers, and catalog indexing details.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                System Product ID
              </span>
              <p className="font-mono text-xs font-bold text-slate-800 break-all">{product.id}</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Catalog SKU
              </span>
              <p className="font-mono text-xs font-bold text-slate-800">{product.sku}</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Billing Currency
              </span>
              <p className="text-xs font-bold text-slate-800">{product.currency || "SAR"}</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Base Unit Price
              </span>
              <p className="font-mono text-xs font-bold text-slate-800">
                SAR {product.price?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Created Timestamp
              </span>
              <p className="text-xs font-semibold text-slate-700">
                {new Date(product.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Last Updated
              </span>
              <p className="text-xs font-semibold text-slate-700">
                {new Date(product.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: EDIT PRODUCT MODAL */}
      {editModalOpen && (
        <ProductEditModal
          product={product}
          onClose={() => setEditModalOpen(false)}
          onSaved={(updated) => {
            setProduct((prev: any) => ({ ...prev, ...updated }));
            setEditModalOpen(false);
          }}
        />
      )}

      {/* MODAL 2: QUICK IMAGE UPDATE MODAL */}
      {imageModalOpen && (
        <ProductImageUploadModal
          productId={product.id}
          currentImageUrl={product.imageUrl}
          onClose={() => setImageModalOpen(false)}
          onSuccess={(newUrl) => {
            setProduct((prev: any) => ({ ...prev, imageUrl: newUrl }));
            setImageModalOpen(false);
          }}
        />
      )}

      {/* MODAL 3: ASSIGN DEAL MODAL */}
      {assignDealModalOpen && (
        <AssignDealModal
          productId={product.id}
          availableDeals={availableDeals.filter(
            (d) => !assignedDeals.some((ad) => ad.id === d.id)
          )}
          onClose={() => setAssignDealModalOpen(false)}
          onAssigned={(newlyAssignedDeal) => {
            setProduct((prev: any) => ({
              ...prev,
              deals: [newlyAssignedDeal, ...(prev.deals || [])],
            }));
            setAssignDealModalOpen(false);
          }}
        />
      )}

      {/* MODAL 4: ADD DOCUMENT MODAL */}
      {documentModalOpen && (
        <AddProductDocumentModal
          productId={product.id}
          onClose={() => setDocumentModalOpen(false)}
          onAdded={(newDoc) => {
            setProduct((prev: any) => ({
              ...prev,
              documents: [newDoc, ...(prev.documents || [])],
            }));
            setDocumentModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ---------- MODAL COMPONENTS ----------

function ProductEditModal({
  product,
  onClose,
  onSaved,
}: {
  product: any;
  onClose: () => void;
  onSaved: (updated: any) => void;
}) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(product.name || "");
  const [sku, setSku] = useState(product.sku || "");
  const [category, setCategory] = useState(product.category || "Point of Sale");
  const [price, setPrice] = useState(String(product.price || "0"));
  const [status, setStatus] = useState(product.status || "ACTIVE");
  const [description, setDescription] = useState(product.description || "");
  const [features, setFeatures] = useState(product.features || "");
  const [imageUrl, setImageUrl] = useState(product.imageUrl || "");
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
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("sku", sku);
      formData.append("category", category);
      formData.append("price", price);
      formData.append("currency", product.currency || "SAR");
      formData.append("status", status);
      formData.append("description", description);
      formData.append("features", features);
      formData.append("imageUrl", imageUrl);

      try {
        await updateProductAction(product.id, formData);
        onSaved({
          name,
          sku,
          category,
          price: parseFloat(price || "0"),
          status,
          description,
          features,
          imageUrl,
          updatedAt: new Date(),
        });
        toast.success("Product updated successfully");
      } catch (err: any) {
        toast.error(err.message || "Failed to update product");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-base font-bold text-slate-900">Edit Product: {product.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Image Chooser */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Product Image
            </label>

            {/* Toggle between Upload & URL */}
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
                Paste Image URL
              </button>
            </div>

            {imageTab === "upload" ? (
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-[#4361ee] hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>
            ) : (
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or web URL"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              />
            )}

            {imageUrl && (
              <div className="flex items-center gap-3 pt-2">
                <div className="h-12 w-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Product Title *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                SKU *
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Price (SAR) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="DRAFT">DRAFT</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Features (comma separated)
            </label>
            <input
              type="text"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="e.g. Mada Certified, Instant Settlement, NFC"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
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
              className="rounded-full bg-[#4361ee] hover:bg-[#3a56d4] px-5 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProductImageUploadModal({
  productId,
  currentImageUrl,
  onClose,
  onSuccess,
}: {
  productId: string;
  currentImageUrl?: string;
  onClose: () => void;
  onSuccess: (url: string) => void;
}) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [url, setUrl] = useState(currentImageUrl || "");
  const [preview, setPreview] = useState(currentImageUrl || "");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      setUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await quickUpdateProductImageAction(productId, url);
        onSuccess(url);
        toast.success("Product image updated!");
      } catch (err: any) {
        toast.error(err.message || "Failed to update image");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Manage Product Image</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex rounded-full bg-slate-100 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={`flex-1 py-1.5 rounded-full transition-all text-center ${
              tab === "upload" ? "bg-white font-bold text-slate-900 shadow-2xs" : "text-slate-500"
            }`}
          >
            Upload from Computer
          </button>
          <button
            type="button"
            onClick={() => setTab("url")}
            className={`flex-1 py-1.5 rounded-full transition-all text-center ${
              tab === "url" ? "bg-white font-bold text-slate-900 shadow-2xs" : "text-slate-500"
            }`}
          >
            Paste Web Address
          </button>
        </div>

        {tab === "upload" ? (
          <div className="space-y-3">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-2xl p-6 cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-all">
              <Upload size={24} className="text-[#4361ee] mb-2" />
              <span className="text-xs font-bold text-slate-700">Click to choose image file</span>
              <span className="text-[11px] text-slate-400 mt-1">PNG, JPG, WebP up to 5MB</span>
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Image URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setPreview(e.target.value);
              }}
              placeholder="https://..."
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
        )}

        {preview && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Image Preview</span>
            <div className="h-32 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="h-full w-full object-cover" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending || !preview}
            onClick={handleSave}
            className="rounded-full bg-[#4361ee] hover:bg-[#3a56d4] px-5 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50"
          >
            {isPending ? "Updating..." : "Save Image"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignDealModal({
  productId,
  availableDeals,
  onClose,
  onAssigned,
}: {
  productId: string;
  availableDeals: any[];
  onClose: () => void;
  onAssigned: (deal: any) => void;
}) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedDealId, setSelectedDealId] = useState(availableDeals[0]?.id || "");

  function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDealId) return;

    startTransition(async () => {
      try {
        await assignDealToProductAction(productId, selectedDealId);
        const assignedDeal = availableDeals.find((d) => d.id === selectedDealId);
        onAssigned(assignedDeal);
        toast.success("Deal assigned to product successfully!");
      } catch (err: any) {
        toast.error(err.message || "Failed to assign deal");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#4361ee]" />
            <h3 className="text-sm font-bold text-slate-900">Assign Deal to this Product</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        {availableDeals.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500">
            All deals are currently assigned or no open deals exist.
          </div>
        ) : (
          <form onSubmit={handleAssign} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Choose Deal
              </label>
              <select
                value={selectedDealId}
                onChange={(e) => setSelectedDealId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-indigo-500 focus:outline-none"
              >
                {availableDeals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} (SAR {d.value?.toLocaleString() || "0"} - {d.stage?.name || "Open"})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
                className="rounded-full bg-[#4361ee] hover:bg-[#3a56d4] px-5 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50"
              >
                {isPending ? "Assigning..." : "Assign Deal"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function AddProductDocumentModal({
  productId,
  onClose,
  onAdded,
}: {
  productId: string;
  onClose: () => void;
  onAdded: (doc: any) => void;
}) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [title, setTitle] = useState("");
  const [fileType, setFileType] = useState("pdf");
  const [fileUrl, setFileUrl] = useState("");
  const [fileSize, setFileSize] = useState("");

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!title) {
      setTitle(file.name);
    }
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setFileSize(`${sizeMb} MB`);

    // Determine type
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") setFileType("pdf");
    else if (ext === "doc" || ext === "docx") setFileType("doc");
    else if (ext === "xls" || ext === "xlsx") setFileType("sheet");
    else setFileType("spec");

    const reader = new FileReader();
    reader.onload = () => {
      setFileUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !fileUrl.trim()) {
      toast.error("Document title and file/URL are required");
      return;
    }

    startTransition(async () => {
      try {
        const res = await addProductDocumentAction(productId, title, fileType, fileUrl, fileSize);
        onAdded({
          id: res.id,
          productId,
          title,
          fileType,
          fileUrl,
          fileSize,
          createdAt: new Date(),
        });
        toast.success("Document added successfully");
      } catch (err: any) {
        toast.error(err.message || "Failed to add document");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-[#4361ee]" />
            <h3 className="text-sm font-bold text-slate-900">Add Product Document</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex rounded-full bg-slate-100 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={`flex-1 py-1.5 rounded-full transition-all text-center ${
              tab === "upload" ? "bg-white font-bold text-slate-900 shadow-2xs" : "text-slate-500"
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setTab("url")}
            className={`flex-1 py-1.5 rounded-full transition-all text-center ${
              tab === "url" ? "bg-white font-bold text-slate-900 shadow-2xs" : "text-slate-500"
            }`}
          >
            Web URL Link
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Document Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Smart POS Architecture & Security Spec.pdf"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Document Type
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="pdf">PDF Document</option>
                <option value="doc">Word / Spec Doc</option>
                <option value="sheet">Spreadsheet / Pricing</option>
                <option value="spec">Technical Guide</option>
                <option value="link">Online Portal Link</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                File Size / Note
              </label>
              <input
                type="text"
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value)}
                placeholder="e.g. 2.4 MB"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {tab === "upload" ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Select File from Computer *
              </label>
              <input
                type="file"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-[#4361ee] hover:file:bg-indigo-100 cursor-pointer"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Document URL *
              </label>
              <input
                type="url"
                required
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://docs.mytm.sa/specs/pos-v2.pdf"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
              className="rounded-full bg-[#4361ee] hover:bg-[#3a56d4] px-5 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50"
            >
              {isPending ? "Uploading..." : "Add Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

