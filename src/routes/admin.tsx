import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import {
  IndianRupee,
  Package,
  Sparkles,
  Plus,
  X,
  Download,
  FileText,
  Edit,
  Trash2,
  Tag,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle,
  Eye,
  Percent,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { MultiImageUploader } from "@/components/ui/MultiImageUploader";

import { useAuth } from "@/hooks/use-auth";
import {
  getAdminStats,
  listAllOrders,
  updateOrderStatus,
  createProduct,
  updateProduct,
  deleteProduct,
  listAdminProducts,
  getCategorySuggestions,
  getSignedAdminDesignUrl,
  listPromoCodes,
  createPromoCode,
  togglePromoCodeStatus,
  deletePromoCode,
  bootstrapAdmin,
} from "@/lib/admin.functions";
import { generateTrackingId } from "@/lib/shipping";
import { formatPrice } from "@/lib/format";
import { exportOrderToPdf } from "@/lib/OrderPdfExporter";

type Order = Awaited<ReturnType<typeof listAllOrders>>[number];
type AdminProduct = Awaited<ReturnType<typeof listAdminProducts>>[number];

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Control Room — Weekdayz" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"catalog" | "orders" | "promos">("catalog");
  const [bootstrapSecret, setBootstrapSecret] = useState("weekdayz-secret-1337");
  const bootstrapFn = useServerFn(bootstrapAdmin);

  if (loading) {
    return <div className="py-24 text-center text-muted-foreground text-sm">Checking access credentials…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md my-24 border border-border bg-card p-8 text-center space-y-4 shadow-xl">
        <h2 className="text-xl font-bold">Admin Login Required</h2>
        <p className="text-xs text-muted-foreground">Please sign in to access the Weekdayz Control Room.</p>
        <button
          onClick={() => navigate({ to: "/auth" })}
          className="bg-accent text-accent-foreground px-6 py-2.5 text-xs uppercase tracking-widest font-bold"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md my-20 border border-border bg-card p-8 text-center space-y-4 shadow-xl">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold">Admin Activation Required</h2>
        <p className="text-xs text-muted-foreground">
          Logged in as <span className="font-semibold text-foreground">{user.email}</span>. Click below to grant Admin Control Room access to your account.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await bootstrapFn({ data: { secret: bootstrapSecret } });
              toast.success("Account promoted to Admin!");
              window.location.reload();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed to promote account");
            }
          }}
          className="space-y-3 pt-2"
        >
          <input
            type="password"
            value={bootstrapSecret}
            onChange={(e) => setBootstrapSecret(e.target.value)}
            placeholder="Bootstrap Secret"
            className="w-full bg-background border border-border px-3 py-2 text-sm text-center font-mono"
          />
          <button
            type="submit"
            className="w-full bg-accent text-accent-foreground py-2.5 text-xs uppercase tracking-widest font-bold"
          >
            ⚡ Activate Admin Access
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-border pb-6">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">Admin Panel</span>
          <h1 className="text-display text-4xl sm:text-5xl mt-1">Control Room</h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-card border border-border p-1">
          {[
            { id: "catalog", label: "Catalog & Products" },
            { id: "orders", label: "Orders & Shipping" },
            { id: "promos", label: "Promo Codes" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs uppercase tracking-widest font-semibold transition-colors ${
                activeTab === tab.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <Stats />

      {activeTab === "catalog" && <ProductCatalogSection />}
      {activeTab === "orders" && <OrdersQueue />}
      {activeTab === "promos" && <PromoCodeSection />}
    </div>
  );
}

function Stats() {
  const { data } = useQuery({ queryKey: ["admin-stats"], queryFn: () => getAdminStats() });
  const { data: products } = useQuery({ queryKey: ["admin-products"], queryFn: () => listAdminProducts() });

  const lowStockCount = (products ?? []).filter((p) => (p.inventory_count ?? 0) < 10).length;

  const cards = [
    { label: "Total Revenue", value: data ? formatPrice(data.total_revenue_cents) : "—", icon: IndianRupee },
    { label: "Pending Orders", value: data?.pending_standard_orders ?? "—", icon: Package },
    { label: "Custom Print Orders", value: data?.pending_custom_orders ?? "—", icon: Sparkles },
    { label: "Low Stock Alert (<10)", value: lowStockCount, icon: AlertTriangle, warning: lowStockCount > 0 },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`border p-5 bg-card transition-all ${
            c.warning ? "border-amber-500/50 bg-amber-500/5" : "border-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{c.label}</span>
            <c.icon className={`h-4 w-4 ${c.warning ? "text-amber-500" : "text-accent"}`} />
          </div>
          <p className="text-3xl font-semibold mt-3">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function ProductCatalogSection() {
  const qc = useQueryClient();
  const deleteFn = useServerFn(deleteProduct);
  const updateFn = useServerFn(updateProduct);

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => listAdminProducts(),
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Product removed");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateFn({ data: { id, is_active } }),
    onSuccess: () => {
      toast.success("Product status updated");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const filteredProducts = (products ?? []).filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      (p.category ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || p.category?.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set((products ?? []).map((p) => p.category?.toLowerCase()).filter(Boolean)));

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">T-Shirt & Apparel Catalog</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage products, inventory, and Amazon/Flipkart image galleries</p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-5 py-2.5 text-xs uppercase tracking-widest font-bold shadow hover:bg-accent/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add T-Shirt / Product
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 border border-border bg-card p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, slug or category…"
            className="w-full pl-9 pr-4 py-1.5 bg-background border border-border text-sm"
          />
        </div>
        <div className="flex items-center gap-2 sm:w-56">
          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-background border border-border px-3 py-1.5 text-sm uppercase tracking-wider"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border bg-secondary/20">
            <tr>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">Price</th>
              <th className="text-left px-4 py-3">Stock</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Loading catalog…
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No products found. Click "+ Add T-Shirt / Product" to create your first item.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-14 bg-muted border border-border overflow-hidden flex-shrink-0 relative">
                        {p.image_urls?.[0] ? (
                          <img src={p.image_urls[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No img</div>
                        )}
                        {p.image_urls && p.image_urls.length > 1 && (
                          <span className="absolute bottom-0 right-0 bg-black/80 text-white text-[9px] px-1 font-bold">
                            +{p.image_urls.length - 1}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-snug">{p.title}</p>
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">/{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block border border-border px-2.5 py-1 text-xs uppercase tracking-wider font-mono">
                      {p.category || "tee"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatPrice(p.price_cents)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-mono font-semibold ${
                        p.inventory_count < 10 ? "text-amber-500" : "text-foreground"
                      }`}
                    >
                      {p.inventory_count} units
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActiveMutation.mutate({ id: p.id, is_active: !p.is_active })}
                      className={`text-xs uppercase tracking-widest font-bold px-2.5 py-1 border transition-colors ${
                        p.is_active
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                          : "border-border bg-secondary/50 text-muted-foreground"
                      }`}
                    >
                      {p.is_active ? "Active" : "Draft"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setModalOpen(true);
                        }}
                        className="p-1.5 hover:bg-secondary border border-border text-xs uppercase tracking-widest inline-flex items-center gap-1"
                        title="Edit product"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${p.title}"?`)) {
                            deleteMutation.mutate(p.id);
                          }
                        }}
                        className="p-1.5 hover:bg-destructive/20 border border-destructive/40 text-destructive text-xs uppercase tracking-widest inline-flex items-center gap-1"
                        title="Delete product"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Product Modal */}
      <AnimatePresence>
        {modalOpen && (
          <ProductFormModal
            initialProduct={editingProduct}
            onClose={() => {
              setModalOpen(false);
              setEditingProduct(null);
            }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function CategoryDropdown({
  value,
  onChange,
  allCategories,
  presetCategories,
}: {
  value: string;
  onChange: (val: string) => void;
  allCategories: string[];
  presetCategories: string[];
}) {
  const [open, setOpen] = useState(false);

  const getLabel = (val: string) => {
    if (val === "other") return "+ Type Custom Category…";
    return val.toUpperCase();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm font-semibold uppercase tracking-wider text-left flex items-center justify-between"
      >
        <span>{getLabel(value)}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border max-h-48 overflow-y-auto shadow-2xl divide-y divide-border/50">
          {presetCategories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                onChange(c);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 text-xs uppercase font-semibold tracking-wider hover:bg-accent hover:text-accent-foreground transition-colors ${
                value === c ? "bg-accent/10 text-accent font-bold" : "text-foreground"
              }`}
            >
              {c.toUpperCase()}
            </button>
          ))}

          {allCategories
            .filter((c) => !presetCategories.includes(c))
            .map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 text-xs uppercase font-semibold tracking-wider hover:bg-accent hover:text-accent-foreground transition-colors ${
                  value === c ? "bg-accent/10 text-accent font-bold" : "text-foreground"
                }`}
              >
                {c.toUpperCase()}
              </button>
            ))}

          <button
            type="button"
            onClick={() => {
              onChange("other");
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-2.5 text-xs uppercase font-bold tracking-wider text-accent hover:bg-accent hover:text-accent-foreground transition-colors ${
              value === "other" ? "bg-accent/20 font-bold" : ""
            }`}
          >
            + Type Custom Category…
          </button>
        </div>
      )}
    </div>
  );
}

function ProductFormModal({
  initialProduct,
  onClose,
}: {
  initialProduct: AdminProduct | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const createFn = useServerFn(createProduct);
  const updateFn = useServerFn(updateProduct);
  const { data: categorySuggestions } = useQuery({
    queryKey: ["category-suggestions"],
    queryFn: () => getCategorySuggestions(),
  });

  const presetCategories = ["hoodie", "tshirt", "shirt", "pant", "cargo"];
  const allCategoryList = Array.from(
    new Set([...presetCategories, ...(categorySuggestions ?? [])])
  );

  const isEditing = Boolean(initialProduct);

  const [form, setForm] = useState({
    title: initialProduct?.title ?? "",
    slug: initialProduct?.slug ?? "",
    description: initialProduct?.description ?? "",
    price: initialProduct ? (initialProduct.price_cents / 100).toString() : "1899",
    inventory: initialProduct ? initialProduct.inventory_count.toString() : "100",
    categorySelect: initialProduct?.category && allCategoryList.includes(initialProduct.category.toLowerCase())
      ? initialProduct.category.toLowerCase()
      : initialProduct?.category
      ? "other"
      : "tshirt",
    customCategory: initialProduct?.category && !allCategoryList.includes(initialProduct.category.toLowerCase())
      ? initialProduct.category
      : "",
    sizes: initialProduct?.sizes?.join(", ") ?? "S, M, L, XL, XXL",
  });

  const [imageUrls, setImageUrls] = useState<string[]>(initialProduct?.image_urls ?? []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const finalCategory =
        form.categorySelect === "other"
          ? form.customCategory.trim().toLowerCase()
          : form.categorySelect;

      if (!finalCategory) throw new Error("Please select or enter a product category");
      if (!form.title.trim()) throw new Error("Title is required");

      const slug =
        form.slug.trim() ||
        form.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

      const payload = {
        slug,
        title: form.title.trim(),
        description: form.description.trim(),
        price_cents: Math.round(Number(form.price) * 100),
        inventory_count: Number(form.inventory),
        image_urls: imageUrls,
        sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
        colors: [],
        category: finalCategory,
      };

      if (isEditing && initialProduct) {
        return updateFn({ data: { id: initialProduct.id, ...payload } });
      } else {
        return createFn({ data: payload });
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? "Product updated successfully" : "Product created successfully");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["category-suggestions"] });
      onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save product"),
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <span className="text-xs uppercase tracking-widest text-accent font-semibold">
              {isEditing ? "Edit Product" : "Amazon / Flipkart Style Entry"}
            </span>
            <h2 className="text-xl font-bold">{isEditing ? `Edit "${initialProduct?.title}"` : "Add New T-Shirt / Product"}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="p-6 space-y-6"
        >
          {/* Multi-Photo Amazon/Flipkart Uploader Section */}
          <div className="border border-border bg-background/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-widest font-bold text-accent">
                Product Image Gallery (Upload 4–8 Photos)
              </label>
              <span className="text-xs text-muted-foreground">First image is Main Cover</span>
            </div>
            <MultiImageUploader
              initialUrls={imageUrls}
              onUrlsChange={setImageUrls}
              maxFiles={8}
            />
          </div>

          {/* Form Fields */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. WEEKDAYZ OVERSIZED HEAVYWEIGHT TEE"
                className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Slug (Optional)</label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="weekdayz-oversized-heavyweight-tee"
                className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm font-mono"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Category *</label>
              <CategoryDropdown
                value={form.categorySelect}
                onChange={(val) => setForm({ ...form, categorySelect: val })}
                presetCategories={presetCategories}
                allCategories={allCategoryList}
              />
            </div>

            {form.categorySelect === "other" && (
              <div>
                <label className="text-xs uppercase tracking-widest text-accent font-semibold">
                  Type Custom Category Name *
                </label>
                <input
                  value={form.customCategory}
                  onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
                  placeholder="e.g. Oversized Jacket, F1 Capsule, Crop Top"
                  className="mt-1 w-full bg-accent/5 border border-accent px-3 py-2 text-sm font-semibold uppercase tracking-wider"
                  required
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Will be saved in database for future suggestions.
                </p>
              </div>
            )}

            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Price (₹) *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm font-mono"
                required
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Stock Inventory *</label>
              <input
                type="number"
                value={form.inventory}
                onChange={(e) => setForm({ ...form, inventory: e.target.value })}
                className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm font-mono"
                required
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Available Sizes (Comma Separated)</label>
              <input
                value={form.sizes}
                onChange={(e) => setForm({ ...form, sizes: e.target.value })}
                placeholder="S, M, L, XL, XXL"
                className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Heavyweight 240 GSM 100% Terry Cotton Tee with high-density print."
                className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs uppercase tracking-widest border border-border hover:bg-secondary font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="bg-accent text-accent-foreground px-6 py-2.5 text-xs uppercase tracking-widest font-bold disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving Product…" : isEditing ? "Save Changes" : "Publish Product"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function OrdersQueue() {
  const { data: orders } = useQuery({ queryKey: ["admin-orders"], queryFn: () => listAllOrders() });
  const [selected, setSelected] = useState<Order | null>(null);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Fulfillment & Orders Queue</h2>
          <p className="text-sm text-muted-foreground">Manage customer shipments, custom print designs, and export PDF manifests</p>
        </div>
      </div>

      <div className="border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border bg-secondary/20">
            <tr>
              <th className="text-left px-4 py-3">Order ID</th>
              <th className="text-left px-4 py-3">Total Amount</th>
              <th className="text-left px-4 py-3">Payment</th>
              <th className="text-left px-4 py-3">Fulfillment</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders?.map((o) => (
              <tr key={o.id} className="hover:bg-secondary/20 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-semibold">#{o.id.slice(0, 8).toUpperCase()}</td>
                <td className="px-4 py-3 font-semibold">{formatPrice(o.total_cents)}</td>
                <td className="px-4 py-3"><Badge label={o.payment_status} /></td>
                <td className="px-4 py-3"><Badge label={o.fulfillment_status} /></td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => exportOrderToPdf(o)}
                      className="inline-flex items-center gap-1 border border-border px-2.5 py-1 text-xs uppercase tracking-widest hover:bg-secondary font-semibold"
                      title="Export Order PDF"
                    >
                      <FileText className="h-3.5 w-3.5 text-accent" /> PDF Export
                    </button>
                    <button
                      onClick={() => setSelected(o)}
                      className="inline-flex items-center gap-1 bg-accent text-accent-foreground px-2.5 py-1 text-xs uppercase tracking-widest font-bold"
                    >
                      Manage
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!orders?.length && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">No customer orders placed yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selected && <OrderModal order={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </section>
  );
}

function PromoCodeSection() {
  const qc = useQueryClient();
  const createFn = useServerFn(createPromoCode);
  const toggleFn = useServerFn(togglePromoCodeStatus);
  const deleteFn = useServerFn(deletePromoCode);

  const { data: promoCodes, isLoading } = useQuery({
    queryKey: ["admin-promos"],
    queryFn: () => listPromoCodes(),
  });

  const [form, setForm] = useState({
    code: "",
    discountType: "percent" as "percent" | "fixed",
    discountValue: "15",
    minOrderValue: "999",
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          code: form.code,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          minOrderValue: Number(form.minOrderValue),
        },
      }),
    onSuccess: () => {
      toast.success(`Promo code "${form.code.toUpperCase()}" added`);
      qc.invalidateQueries({ queryKey: ["admin-promos"] });
      setForm({ code: "", discountType: "percent", discountValue: "15", minOrderValue: "999" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to create promo code"),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => toggleFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-promos"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Promo code deleted");
      qc.invalidateQueries({ queryKey: ["admin-promos"] });
    },
  });

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Promo Code Management</h2>
        <p className="text-sm text-muted-foreground">Manually specify custom promo codes, discount percentages, and minimum cart thresholds</p>
      </div>

      {/* Create Promo Code Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
        className="border border-border bg-card p-5 grid sm:grid-cols-4 gap-3 items-end"
      >
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Promo Code String *</label>
          <input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="e.g. WEEKDAYZ20"
            className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm font-mono font-bold uppercase tracking-wider"
            required
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Discount Type</label>
          <select
            value={form.discountType}
            onChange={(e) => setForm({ ...form, discountType: e.target.value as any })}
            className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm uppercase tracking-wider"
          >
            <option value="percent">Percentage (%)</option>
            <option value="fixed">Fixed Flat (₹)</option>
          </select>
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            {form.discountType === "percent" ? "Discount Percentage (%)" : "Flat Discount (₹)"}
          </label>
          <input
            type="number"
            value={form.discountValue}
            onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
            className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm font-mono"
            required
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Min Order Value (₹)</label>
          <input
            type="number"
            value={form.minOrderValue}
            onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
            className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm font-mono"
          />
        </div>

        <div className="sm:col-span-4 flex justify-end">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-accent text-accent-foreground px-6 py-2.5 text-xs uppercase tracking-widest font-bold disabled:opacity-50"
          >
            {createMutation.isPending ? "Adding Promo…" : "+ Add Custom Promo Code"}
          </button>
        </div>
      </form>

      {/* Active Promos List */}
      <div className="border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border bg-secondary/20">
            <tr>
              <th className="text-left px-4 py-3">Code</th>
              <th className="text-left px-4 py-3">Discount</th>
              <th className="text-left px-4 py-3">Min Cart</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Loading promo codes…
                </td>
              </tr>
            ) : (promoCodes ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No promo codes created yet.
                </td>
              </tr>
            ) : (
              (promoCodes ?? []).map((p: any) => (
                <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-accent text-sm">{p.code}</td>
                  <td className="px-4 py-3 font-semibold">
                    {p.discountType === "percent" ? `${p.discountValue}% OFF` : `₹${p.discountValue} FLAT OFF`}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">₹{p.minOrderValue}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleMutation.mutate(p.id)}
                      className={`text-xs uppercase tracking-widest font-bold px-2.5 py-1 border transition-colors ${
                        p.isActive
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                          : "border-border bg-secondary/50 text-muted-foreground"
                      }`}
                    >
                      {p.isActive ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteMutation.mutate(p.id)}
                      className="p-1.5 hover:bg-destructive/20 border border-destructive/40 text-destructive text-xs uppercase tracking-widest"
                      title="Delete promo code"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-block border border-border px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-widest bg-secondary/30">
      {label}
    </span>
  );
}

const STATUSES = ["processing", "printed", "shipped", "delivered", "cancelled"] as const;
type Status = typeof STATUSES[number];

function OrderModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const qc = useQueryClient();
  const updateFn = useServerFn(updateOrderStatus);
  const signFn = useServerFn(getSignedAdminDesignUrl);
  const [status, setStatus] = useState<Status>(order.fulfillment_status as Status);
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [signed, setSigned] = useState<Record<string, string>>({});

  useEffect(() => {
    order.order_items?.forEach((it) => {
      const path = it.custom_designs?.design_file_url;
      if (!path || signed[path]) return;
      signFn({ data: { path } })
        .then((r) => setSigned((m) => ({ ...m, [path]: r.url })))
        .catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id]);

  const m = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          id: order.id,
          fulfillment_status: status,
          tracking_number: tracking || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Order status updated");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update order"),
  });

  const shipping = (order.shipping_details as Record<string, string>) ?? {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Order Details</p>
            <p className="font-mono text-lg font-bold">#{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportOrderToPdf(order)}
              className="inline-flex items-center gap-1 border border-border px-3 py-1.5 text-xs uppercase tracking-widest hover:bg-secondary font-semibold"
            >
              <FileText className="h-3.5 w-3.5 text-accent" /> PDF Export
            </button>
            <button onClick={onClose} className="p-2 hover:bg-secondary">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <section className="border border-border p-4 bg-background/40">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Shipping Information</h3>
            <div className="text-sm space-y-1">
              <p className="font-semibold">{shipping.full_name || "Customer"} · {shipping.phone || "No phone"}</p>
              <p>{shipping.line1} {shipping.line2}</p>
              <p>{shipping.city}, {shipping.state} {shipping.postal_code}, {shipping.country}</p>
            </div>
          </section>

          <section>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Order Items</h3>
            <ul className="divide-y divide-border border border-border">
              {order.order_items?.map((it) => {
                const path = it.custom_designs?.design_file_url;
                const url = path ? signed[path] : null;
                const placement = it.custom_designs?.placement_settings as Record<string, number> | null;
                return (
                  <li key={it.id} className="p-3 flex gap-3 items-start">
                    <div className="w-14 h-16 bg-muted overflow-hidden flex-shrink-0 border border-border">
                      {it.image_snapshot && <img src={it.image_snapshot} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-semibold">{it.title_snapshot || "Item"}</p>
                      <p className="text-xs text-muted-foreground">
                        Size {it.size} · Qty {it.quantity} · {formatPrice(it.unit_price_cents)}
                      </p>
                      {it.custom_designs && (
                        <div className="mt-2 border border-accent/40 bg-accent/5 p-2 text-xs space-y-1">
                          <p className="text-accent uppercase tracking-widest font-bold">Custom Print Asset</p>
                          <p>Base Color: <span className="font-mono">{it.custom_designs.base_color}</span></p>
                          {placement && (
                            <p>
                              Placement: scale {placement.scale?.toFixed?.(2)}, rotate {placement.rotate}°, x {Math.round(placement.x ?? 0)}, y {Math.round(placement.y ?? 0)}
                            </p>
                          )}
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-accent font-semibold underline mt-1"
                            >
                              <Download className="h-3.5 w-3.5" /> Download High-Res Graphic
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-xs">Generating high-res download link…</span>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="grid sm:grid-cols-2 gap-4 border-t border-border pt-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Update Order Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm uppercase tracking-wider font-semibold"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Shiprocket Tracking Number</label>
              <div className="mt-1 flex gap-2">
                <input
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="Enter tracking ID…"
                  className="flex-1 bg-background border border-border px-3 py-2 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setTracking(generateTrackingId())}
                  className="text-xs uppercase tracking-widest border border-border px-3 font-semibold hover:bg-secondary"
                >
                  Generate
                </button>
              </div>
            </div>
          </section>

          <button
            onClick={() => m.mutate()}
            disabled={m.isPending}
            className="w-full bg-accent text-accent-foreground py-3 text-xs uppercase tracking-widest font-bold disabled:opacity-50 shadow"
          >
            {m.isPending ? "Saving Order Status…" : "Save Order Changes"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
