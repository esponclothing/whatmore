"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, CheckCircle2, AlertTriangle, RefreshCw, Plus, Store, ExternalLink, 
  Eye, EyeOff, ShoppingBag, Sparkles, X, Image as ImageIcon, Tag, Layers, ArrowUpRight 
} from "lucide-react";
import Link from "next/link";
import { 
  getShopifyCredentialsAction, 
  syncShopifyProductsAction, 
  getProductsAction, 
  toggleProductVisibilityAction,
  getMetaCatalogStatusAction,
  syncMetaCatalogProductsAction,
  createAndPushCatalogProductAction,
  pushSingleProductToMetaAction
} from "@/app/actions/whatsAppPlatformActions";

// Default preset chips for quick addition
const PRESET_COLORS = ["Black", "White", "Navy Blue", "Olive Green", "Charcoal", "Royal Blue", "Maroon", "Heather Grey"];
const PRESET_SIZES = ["S", "M", "L", "XL", "2XL", "3XL", "Free Size"];
const PRESET_CATEGORIES = ["T-Shirts", "Activewear", "Track Pants", "Shorts", "Hoodies & Sweatshirts", "Compression Wear", "Polos", "Jackets"];

export default function ProductsCommercePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  
  // Shopify Integration State
  const [isShopifyConnected, setIsShopifyConnected] = useState(false);
  const [isFetchingShopify, setIsFetchingShopify] = useState(false);
  const [shopifyDomain, setShopifyDomain] = useState("");

  // Meta Catalog Integration State
  const [metaCatalog, setMetaCatalog] = useState<{
    isConnected: boolean;
    catalogId?: string;
    catalogName?: string;
    productCount?: number;
  }>({ isConnected: false });
  const [isSyncingMeta, setIsSyncingMeta] = useState(false);
  const [pushingProductId, setPushingProductId] = useState<string | null>(null);

  // Toast / Status notification banner
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  
  // Catalog Maker Modal State
  const [showCatalogMaker, setShowCatalogMaker] = useState(false);
  const [isSubmittingCatalog, setIsSubmittingCatalog] = useState(false);

  // Form State
  const [productForm, setProductForm] = useState({
    title: "",
    baseSku: "",
    description: "",
    category: "T-Shirts",
    brand: "Esponsports",
    sellingPrice: "",
    compareAtPrice: "",
    costPrice: "",
    imageUrl: "",
    pushToMeta: true,
    colors: [] as string[],
    sizes: [] as string[],
    colorInput: "",
    sizeInput: ""
  });

  // Generated variant matrix
  const [variantsMatrix, setVariantsMatrix] = useState<Array<{
    id: string;
    color?: string;
    size?: string;
    sku: string;
    price: number;
    compareAt: number;
    inventory: number;
    imageUrl?: string;
  }>>([]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 6000);
  };

  const handleToggleVisibility = async (dbId: string, currentStatus: string) => {
    if (!dbId) return;
    const targetStatus = currentStatus === "Active" ? "Inactive" : "Active";
    const res = await toggleProductVisibilityAction(dbId, targetStatus);
    if (res.success) {
      await fetchProducts();
    } else {
      showToast("Failed to update visibility: " + res.error, "error");
    }
  };

  const handleToggleAllVisibility = async (variantsList: any[]) => {
    if (variantsList.length === 0) return;
    const anyActive = variantsList.some(v => v.status === "Active");
    const targetStatus = anyActive ? "Inactive" : "Active";
    
    for (const v of variantsList) {
      if (v.dbId) {
        await toggleProductVisibilityAction(v.dbId, targetStatus);
      }
    }
    await fetchProducts();
  };

  const toggleGroup = (baseName: string) => {
    if (expandedGroups.includes(baseName)) {
      setExpandedGroups(expandedGroups.filter(g => g !== baseName));
    } else {
      setExpandedGroups([...expandedGroups, baseName]);
    }
  };

  const fetchProducts = async () => {
    const res = await getProductsAction();
    if (res.success && res.products && res.products.length > 0) {
      const mapped = res.products.map((p: any, idx: number) => ({
        id: idx + 1,
        dbId: p.id,
        name: p.name,
        sku: p.sku || "",
        articleNumber: p.articleNumber || "",
        price: p.sellingPrice || 0,
        compareAt: p.mrp || 0,
        cost: p.purchasePrice || 0,
        inventory: p.stockQuantity || 0,
        status: p.status || "Active",
        image: p.images?.[0] || "",
        description: p.description || "",
        collection: p.category || p.fabric || "General",
        color: p.color || "",
        size: p.size || ""
      }));
      setProducts(mapped);
    }
  };

  const checkIntegrations = async () => {
    getShopifyCredentialsAction().then((res) => {
      if (res.success && res.credentials?.shopifyAccessToken) {
        setIsShopifyConnected(true);
        setShopifyDomain(res.credentials.shopifyStoreDomain || "Connected Store");
      }
    });

    getMetaCatalogStatusAction().then((res) => {
      if (res.success && res.isConnected) {
        setMetaCatalog({
          isConnected: true,
          catalogId: res.catalogId,
          catalogName: res.catalogName,
          productCount: res.productCount
        });
      } else {
        setMetaCatalog({ isConnected: false });
      }
    });
  };

  useEffect(() => {
    checkIntegrations();
    fetchProducts();
  }, []);

  const handleEditChange = (id: number, field: string, value: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: Number(value) || 0 } : p));
  };

  const calculateMargin = (price: number, cost: number) => {
    if (!price || !cost) return "0%";
    return (((price - cost) / price) * 100).toFixed(1) + "%";
  };
  
  // Sync live from Meta Catalog
  const handleSyncMetaCatalog = async () => {
    setIsSyncingMeta(true);
    setToast(null);
    try {
      const res = await syncMetaCatalogProductsAction();
      if (res.success) {
        showToast(res.message || `Successfully synced ${res.count} products from Meta!`, "success");
        await fetchProducts();
        await checkIntegrations();
      } else {
        showToast("Meta Catalog Sync Failed: " + res.error, "error");
      }
    } catch (e: any) {
      showToast("Error syncing from Meta: " + e.message, "error");
    } finally {
      setIsSyncingMeta(false);
    }
  };

  // Sync from Shopify
  const handleFetchShopify = async () => {
    setIsFetchingShopify(true);
    const res = await syncShopifyProductsAction();
    if (res.success) {
      showToast(res.message || "Shopify synced successfully!", "success");
      await fetchProducts();
    } else {
      showToast("Shopify Sync Failed: " + res.error, "error");
    }
    setIsFetchingShopify(false);
  };

  // Push single product/variant to Meta Catalog
  const handlePushSingleToMeta = async (productId: string) => {
    if (!productId) return;
    setPushingProductId(productId);
    try {
      const res = await pushSingleProductToMetaAction(productId);
      if (res.success) {
        showToast(res.message || "Product pushed to Meta Catalog!", "success");
      } else {
        showToast("Meta Push Error: " + res.error, "error");
      }
    } catch (e: any) {
      showToast("Failed to push to Meta: " + e.message, "error");
    } finally {
      setPushingProductId(null);
    }
  };

  // -------------------------------------------------------------
  // Variant Matrix Generator for Catalog Maker Modal
  // -------------------------------------------------------------
  const recomputeVariantsMatrix = (
    colors: string[],
    sizes: string[],
    baseSku: string,
    sPrice: number,
    cPrice: number
  ) => {
    const cleanSku = (baseSku || "PROD").trim().toUpperCase();
    const cleanPrice = sPrice || 0;
    const cleanCompare = cPrice || cleanPrice;

    if (colors.length === 0 && sizes.length === 0) {
      setVariantsMatrix([
        {
          id: cleanSku,
          sku: cleanSku,
          price: cleanPrice,
          compareAt: cleanCompare,
          inventory: 20
        }
      ]);
      return;
    }

    const newMatrix: Array<{
      id: string;
      color?: string;
      size?: string;
      sku: string;
      price: number;
      compareAt: number;
      inventory: number;
      imageUrl?: string;
    }> = [];

    const colorList = colors.length > 0 ? colors : [undefined];
    const sizeList = sizes.length > 0 ? sizes : [undefined];

    for (const color of colorList) {
      for (const size of sizeList) {
        const parts = [cleanSku];
        if (color) {
          const colorCode = color.slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, "");
          parts.push(colorCode);
        }
        if (size) {
          const sizeCode = size.toUpperCase().replace(/[^A-Z0-9]/g, "");
          parts.push(sizeCode);
        }
        const variantSku = parts.join("-");
        
        const existing = variantsMatrix.find(v => v.sku === variantSku);

        newMatrix.push({
          id: variantSku,
          color,
          size,
          sku: variantSku,
          price: existing?.price ?? cleanPrice,
          compareAt: existing?.compareAt ?? cleanCompare,
          inventory: existing?.inventory ?? 20
        });
      }
    }

    setVariantsMatrix(newMatrix);
  };

  const handleAddColor = (colorName: string) => {
    const trimmed = colorName.trim();
    if (!trimmed || productForm.colors.includes(trimmed)) return;
    const updated = [...productForm.colors, trimmed];
    setProductForm({ ...productForm, colors: updated, colorInput: "" });
    recomputeVariantsMatrix(
      updated,
      productForm.sizes,
      productForm.baseSku,
      Number(productForm.sellingPrice) || 0,
      Number(productForm.compareAtPrice) || 0
    );
  };

  const handleRemoveColor = (colorToRemove: string) => {
    const updated = productForm.colors.filter(c => c !== colorToRemove);
    setProductForm({ ...productForm, colors: updated });
    recomputeVariantsMatrix(
      updated,
      productForm.sizes,
      productForm.baseSku,
      Number(productForm.sellingPrice) || 0,
      Number(productForm.compareAtPrice) || 0
    );
  };

  const handleAddSize = (sizeName: string) => {
    const trimmed = sizeName.trim();
    if (!trimmed || productForm.sizes.includes(trimmed)) return;
    const updated = [...productForm.sizes, trimmed];
    setProductForm({ ...productForm, sizes: updated, sizeInput: "" });
    recomputeVariantsMatrix(
      productForm.colors,
      updated,
      productForm.baseSku,
      Number(productForm.sellingPrice) || 0,
      Number(productForm.compareAtPrice) || 0
    );
  };

  const handleRemoveSize = (sizeToRemove: string) => {
    const updated = productForm.sizes.filter(s => s !== sizeToRemove);
    setProductForm({ ...productForm, sizes: updated });
    recomputeVariantsMatrix(
      productForm.colors,
      updated,
      productForm.baseSku,
      Number(productForm.sellingPrice) || 0,
      Number(productForm.compareAtPrice) || 0
    );
  };

  const handleMatrixVariantChange = (sku: string, field: string, value: any) => {
    setVariantsMatrix(variantsMatrix.map(v => v.sku === sku ? { ...v, [field]: value } : v));
  };

  const handleRemoveVariantRow = (sku: string) => {
    setVariantsMatrix(variantsMatrix.filter(v => v.sku !== sku));
  };

  // Submit Catalog Maker Form
  const handleSaveCatalogProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.title.trim() || !productForm.baseSku.trim()) {
      showToast("Product title and Base SKU are required", "error");
      return;
    }

    setIsSubmittingCatalog(true);
    try {
      const res = await createAndPushCatalogProductAction({
        title: productForm.title,
        baseSku: productForm.baseSku,
        description: productForm.description,
        category: productForm.category,
        brand: productForm.brand,
        imageUrl: productForm.imageUrl,
        sellingPrice: Number(productForm.sellingPrice) || 0,
        compareAtPrice: Number(productForm.compareAtPrice) || Number(productForm.sellingPrice) || 0,
        costPrice: Number(productForm.costPrice) || 0,
        variants: variantsMatrix.map(v => ({
          color: v.color,
          size: v.size,
          sku: v.sku,
          price: Number(v.price) || Number(productForm.sellingPrice) || 0,
          compareAt: Number(v.compareAt) || Number(productForm.compareAtPrice) || 0,
          inventory: Number(v.inventory) || 20
        })),
        pushToMeta: productForm.pushToMeta
      });

      if (res.success) {
        const pushMsg = res.metaResult?.message ? ` (${res.metaResult.message})` : "";
        showToast(`Product created successfully!${pushMsg}`, "success");
        await fetchProducts();
        setShowCatalogMaker(false);
        setProductForm({
          title: "",
          baseSku: "",
          description: "",
          category: "T-Shirts",
          brand: "Esponsports",
          sellingPrice: "",
          compareAtPrice: "",
          costPrice: "",
          imageUrl: "",
          pushToMeta: true,
          colors: [],
          sizes: [],
          colorInput: "",
          sizeInput: ""
        });
        setVariantsMatrix([]);
      } else {
        showToast("Error creating product: " + res.error, "error");
      }
    } catch (err: any) {
      showToast("Failed to save product: " + err.message, "error");
    } finally {
      setIsSubmittingCatalog(false);
    }
  };

  const allCollections = Array.from(
    new Set(
      products
        .map(p => p.collection)
        .flatMap(c => String(c || '').split(',').map(s => s.trim()))
        .filter(Boolean)
    )
  );

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCollection = selectedCollection === "all" || 
      String(p.collection || '').split(',').map(s => s.trim().toLowerCase()).includes(selectedCollection.toLowerCase());
    return matchesSearch && matchesCollection;
  });

  // Group products by base name
  const groupedProducts: {
    baseName: string;
    image: string;
    collection: string;
    description: string;
    variants: any[];
  }[] = [];

  filteredProducts.forEach(p => {
    const parts = p.name.split(' - ');
    const baseName = parts[0];
    const variantTitle = parts.slice(1).join(' - ');

    let group = groupedProducts.find(g => g.baseName === baseName);
    if (!group) {
      group = {
        baseName,
        image: p.image,
        collection: p.collection,
        description: p.description,
        variants: []
      };
      groupedProducts.push(group);
    }
    group.variants.push({
      ...p,
      variantTitle: variantTitle || (p.color || p.size ? `${p.color || ''} ${p.size || ''}`.trim() : "Default Variant")
    });
  });

  return (
    <div className="p-8 w-full max-w-none flex flex-col gap-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`p-4 rounded-xl shadow-lg border flex items-center justify-between transition-all animate-in fade-in slide-in-from-top-3 duration-200 ${
          toast.type === "success" 
            ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800" 
            : toast.type === "error"
            ? "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-800"
            : "bg-blue-50 text-blue-900 border-blue-200"
        }`}>
          <div className="flex items-center gap-2 font-medium text-sm">
            {toast.type === "success" ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertTriangle size={18} className="text-rose-600" />}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-700">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Products & Pricing</h1>
            {metaCatalog.isConnected && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-2xs">
                <ShoppingBag size={12} /> Meta Catalog Live ({metaCatalog.productCount} items)
              </span>
            )}
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your store inventory, variant matrix, WhatsApp catalog, and sync products live with Meta Commerce Manager.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Live Meta Catalog Sync Button */}
          <button 
            onClick={handleSyncMetaCatalog}
            disabled={isSyncingMeta || !metaCatalog.isConnected}
            title={metaCatalog.isConnected ? "Sync live items directly from Meta Catalog" : "Connect Meta Catalog in Integrations first"}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
          >
            <RefreshCw size={16} className={isSyncingMeta ? "animate-spin" : ""} />
            {isSyncingMeta ? "Syncing Meta Catalog..." : "Sync from Meta Catalog"}
          </button>

          {/* Shopify Sync Button */}
          {isShopifyConnected ? (
            <button 
              onClick={handleFetchShopify}
              disabled={isFetchingShopify}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-gray-50 text-gray-800 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-bold shadow-2xs transition-all"
            >
              <RefreshCw size={15} className={isFetchingShopify ? "animate-spin" : ""} />
              {isFetchingShopify ? "Syncing..." : "Sync Shopify"}
            </button>
          ) : (
            <Link 
              href="/whatsapp/api-settings"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl border border-emerald-200 text-sm font-bold shadow-2xs transition-all"
            >
              <Store size={15} /> Connect Shopify
            </Link>
          )}
          
          {/* Open Multi-Variant Catalog Maker */}
          <button 
            onClick={() => {
              setShowCatalogMaker(true);
              recomputeVariantsMatrix(
                productForm.colors,
                productForm.sizes,
                productForm.baseSku,
                Number(productForm.sellingPrice) || 0,
                Number(productForm.compareAtPrice) || 0
              );
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus size={18} /> Catalog Maker
          </button>
        </div>
      </div>

      {/* Meta Catalog Banner Info if connected */}
      {metaCatalog.isConnected && (
        <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent border border-purple-200/80 dark:border-purple-800/40 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
              <ShoppingBag size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>{metaCatalog.catalogName || "Meta Product Catalog"}</span>
                <span className="text-[11px] font-mono text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-md font-semibold">
                  ID: {metaCatalog.catalogId}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Connected with Meta Commerce Manager. Products added here automatically push to your WhatsApp Catalog.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              href="/whatsapp/integrations" 
              className="text-xs font-bold text-purple-700 dark:text-purple-300 hover:underline flex items-center gap-1"
            >
              Manage Catalog Credentials <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-3 bg-gray-50 dark:bg-slate-800/50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search products, SKU, color..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-xs font-bold text-gray-800 dark:text-gray-200 outline-none cursor-pointer"
            >
              <option value="all">📁 All Categories ({allCollections.length})</option>
              {allCollections.map(col => (
                <option key={col} value={col.toLowerCase()}>{col}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-100/70 dark:bg-slate-700/50 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3.5">Product & Variant</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Stock</th>
                <th className="px-6 py-3.5">Price</th>
                <th className="px-6 py-3.5">Compare-at (MRP)</th>
                <th className="px-6 py-3.5">Cost</th>
                <th className="px-6 py-3.5 text-right">Margin</th>
                <th className="px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {groupedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    <ShoppingBag size={32} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                    <p className="font-semibold">No products found</p>
                    <p className="text-xs mt-1">Click "Sync from Meta Catalog" or "Catalog Maker" to add products.</p>
                  </td>
                </tr>
              ) : null}

              {groupedProducts.map((group) => {
                const isExpanded = expandedGroups.includes(group.baseName);
                const totalInventory = group.variants.reduce((sum, v) => sum + v.inventory, 0);
                const minPrice = Math.min(...group.variants.map(v => v.price));
                const maxPrice = Math.max(...group.variants.map(v => v.price));
                const minCompare = Math.min(...group.variants.map(v => v.compareAt));
                const maxCompare = Math.max(...group.variants.map(v => v.compareAt));
                const minCost = Math.min(...group.variants.map(v => v.cost));
                const maxCost = Math.max(...group.variants.map(v => v.cost));
                const hasActiveVariant = group.variants.some(v => v.status === "Active");

                return (
                  <React.Fragment key={group.baseName}>
                    <tr className="hover:bg-gray-50/80 dark:hover:bg-slate-750 border-b border-gray-100 dark:border-slate-800 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => toggleGroup(group.baseName)}
                            className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                            title={isExpanded ? "Collapse variants" : "Expand variants"}
                          >
                            <span className="text-base font-mono">{isExpanded ? "▼" : "▶"}</span>
                          </button>
                          <div className="w-11 h-11 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200 dark:border-slate-700 shrink-0">
                            {group.image ? (
                              <img src={group.image} alt={group.baseName} className="w-full h-full object-cover" />
                            ) : (
                              <Store size={20} className="text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              {group.baseName}
                              <span className="text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-semibold border border-indigo-100 dark:border-indigo-900/30">
                                {group.variants.length} variant{group.variants.length > 1 ? "s" : ""}
                              </span>
                            </p>
                            {group.description && (
                              <p className="text-xs text-gray-400 max-w-[400px] truncate mt-0.5" title={group.description.replace(/<[^>]*>/g, '').trim()}>
                                {group.description.replace(/<[^>]*>/g, '').trim()}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                          hasActiveVariant ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                        }`}>
                          {hasActiveVariant ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-gray-700 dark:text-gray-300">
                        {totalInventory}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                        {group.variants.length > 1 ? `₹${minPrice.toLocaleString()} - ₹${maxPrice.toLocaleString()}` : `₹${minPrice.toLocaleString()}`}
                      </td>
                      <td className="px-6 py-4 text-gray-400 line-through">
                        {group.variants.length > 1 ? `₹${minCompare.toLocaleString()} - ₹${maxCompare.toLocaleString()}` : `₹${minCompare.toLocaleString()}`}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {group.variants.length > 1 ? `₹${minCost.toLocaleString()} - ₹${maxCost.toLocaleString()}` : `₹${minCost.toLocaleString()}`}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-gray-600 dark:text-gray-400">
                          {calculateMargin(
                            group.variants.reduce((sum, v) => sum + v.price, 0) / group.variants.length,
                            group.variants.reduce((sum, v) => sum + v.cost, 0) / group.variants.length
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleToggleAllVisibility(group.variants)}
                            className="text-xs bg-white hover:bg-indigo-50 hover:text-indigo-600 text-gray-700 dark:text-gray-300 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 transition-colors font-bold shadow-2xs"
                            title="Hide or Unhide all variants in this product"
                          >
                            Toggle All
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Variants Child Rows */}
                    {isExpanded && group.variants.map((v) => (
                      <tr key={v.id} className="bg-slate-50/20 dark:bg-slate-900/30 hover:bg-indigo-50/10 dark:hover:bg-slate-800/20 border-b border-gray-100 dark:border-slate-800 transition-colors group">
                        <td className="px-6 py-3 pl-14">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{v.variantTitle}</p>
                                {v.color && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                    {v.color}
                                  </span>
                                )}
                                {v.size && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    {v.size}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-400 font-mono">SKU: {v.sku || "N/A"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                            v.status === "Active" ? "bg-green-100 text-green-700" :
                            v.status === "Low Stock" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-700"
                          }`}>
                            {v.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-mono text-gray-600 dark:text-gray-400">
                          {v.inventory}
                        </td>
                        <td className="px-6 py-3">
                          {editingId === v.id ? (
                            <input 
                              type="number" 
                              value={v.price} 
                              onChange={(e) => handleEditChange(v.id, 'price', e.target.value)}
                              className="w-20 px-2 py-1 border border-indigo-500 rounded text-sm outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                            />
                          ) : (
                            <span className="text-gray-700 dark:text-gray-300 cursor-pointer hover:text-indigo-600 font-medium" onClick={() => setEditingId(v.id)}>
                              ₹{v.price.toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-gray-400 line-through">
                          {editingId === v.id ? (
                            <input 
                              type="number" 
                              value={v.compareAt} 
                              onChange={(e) => handleEditChange(v.id, 'compareAt', e.target.value)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm outline-none line-through bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                            />
                          ) : (
                            <span className="cursor-pointer hover:text-indigo-600" onClick={() => setEditingId(v.id)}>
                              ₹{v.compareAt.toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-gray-400">
                          {editingId === v.id ? (
                            <input 
                              type="number" 
                              value={v.cost} 
                              onChange={(e) => handleEditChange(v.id, 'cost', e.target.value)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                            />
                          ) : (
                            <span className="cursor-pointer hover:text-indigo-600" onClick={() => setEditingId(v.id)}>
                              ₹{v.cost.toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right text-gray-500 font-medium">
                          {calculateMargin(v.price, v.cost)}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {editingId === v.id && (
                              <button onClick={() => setEditingId(null)} className="p-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-md">
                                <CheckCircle2 size={14} />
                              </button>
                            )}
                            
                            {/* Push Single Variant to Meta Catalog */}
                            {metaCatalog.isConnected && (
                              <button
                                onClick={() => handlePushSingleToMeta(v.dbId)}
                                disabled={pushingProductId === v.dbId}
                                className="p-1.5 rounded-md text-purple-600 hover:bg-purple-50 hover:text-purple-800 transition-colors"
                                title="Push this item to Meta Catalog"
                              >
                                {pushingProductId === v.dbId ? <RefreshCw size={14} className="animate-spin text-purple-600" /> : <ShoppingBag size={14} />}
                              </button>
                            )}

                            {/* Visibility Toggle */}
                            <button
                              onClick={() => handleToggleVisibility(v.dbId, v.status)}
                              className={`p-1.5 rounded-md transition-colors ${v.status === "Active" ? "text-gray-500 hover:bg-red-50 hover:text-red-600" : "text-gray-400 hover:bg-green-50 hover:text-green-600"}`}
                              title={v.status === "Active" ? "Hide Variant" : "Unhide Variant"}
                            >
                              {v.status === "Active" ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex justify-between items-center text-sm text-gray-500">
          <span>Showing {products.length} catalog items across {groupedProducts.length} product groups</span>
          {editingId !== null && <span className="text-indigo-600 font-semibold animate-pulse">Unsaved changes in table...</span>}
        </div>
      </div>
      
      {/* ------------------------------------------------------------- */}
      {/* REDESIGNED MULTI-VARIANT META CATALOG MAKER MODAL */}
      {/* ------------------------------------------------------------- */}
      {showCatalogMaker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-purple-50/50 via-indigo-50/30 to-transparent dark:from-purple-950/20 dark:to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/20">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Meta Catalog Product Maker</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Build multi-variant products with colors, sizes, and pricing to push live to Meta Commerce Manager & WhatsApp.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowCatalogMaker(false)} 
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveCatalogProduct} className="p-6 flex flex-col gap-6 max-h-[80vh] overflow-y-auto">
              {/* Section 1: Basic Information */}
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <Tag size={13} /> 1. Product Core Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Product Title <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={productForm.title} 
                      onChange={e => setProductForm({ ...productForm, title: e.target.value })} 
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white dark:bg-slate-800 font-medium" 
                      placeholder="e.g. 4-Way Lycra Compression Activewear T-Shirt" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Base SKU / Style Code <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={productForm.baseSku} 
                      onChange={e => {
                        const val = e.target.value.toUpperCase();
                        setProductForm({ ...productForm, baseSku: val });
                        recomputeVariantsMatrix(
                          productForm.colors,
                          productForm.sizes,
                          val,
                          Number(productForm.sellingPrice) || 0,
                          Number(productForm.compareAtPrice) || 0
                        );
                      }} 
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white dark:bg-slate-800 font-mono" 
                      placeholder="e.g. ESP-TSH-01" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                    <select
                      value={productForm.category}
                      onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white dark:bg-slate-800 font-medium"
                    >
                      {PRESET_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Description for Meta Catalog & WhatsApp
                    </label>
                    <textarea 
                      rows={3}
                      value={productForm.description} 
                      onChange={e => setProductForm({ ...productForm, description: e.target.value })} 
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white dark:bg-slate-800 leading-relaxed" 
                      placeholder="Highlight fabric composition, GSM, wholesale MOQ, 4-way stretch, fit, and delivery details..." 
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Pricing & Margins */}
              <div className="flex flex-col gap-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                    <span>₹</span> 2. Base Pricing & Margins
                  </h3>
                  {productForm.sellingPrice && productForm.costPrice && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Profit: ₹{(Number(productForm.sellingPrice) - Number(productForm.costPrice)).toFixed(0)} ({calculateMargin(Number(productForm.sellingPrice), Number(productForm.costPrice))})
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Selling Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="number" 
                      required 
                      value={productForm.sellingPrice} 
                      onChange={e => {
                        const val = e.target.value;
                        setProductForm({ ...productForm, sellingPrice: val });
                        recomputeVariantsMatrix(
                          productForm.colors,
                          productForm.sizes,
                          productForm.baseSku,
                          Number(val) || 0,
                          Number(productForm.compareAtPrice) || 0
                        );
                      }} 
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white dark:bg-slate-800 font-bold text-emerald-600" 
                      placeholder="e.g. 799" 
                    />
                    <span className="text-[11px] text-gray-400 mt-1 block">Actual customer checkout price</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Compare-at Price / MRP (₹)
                    </label>
                    <input 
                      type="number" 
                      value={productForm.compareAtPrice} 
                      onChange={e => {
                        const val = e.target.value;
                        setProductForm({ ...productForm, compareAtPrice: val });
                        recomputeVariantsMatrix(
                          productForm.colors,
                          productForm.sizes,
                          productForm.baseSku,
                          Number(productForm.sellingPrice) || 0,
                          Number(val) || 0
                        );
                      }} 
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white dark:bg-slate-800 font-medium line-through text-gray-500" 
                      placeholder="e.g. 1299" 
                    />
                    <span className="text-[11px] text-gray-400 mt-1 block">Strikethrough MRP on catalog</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Cost Price (₹)
                    </label>
                    <input 
                      type="number" 
                      value={productForm.costPrice} 
                      onChange={e => setProductForm({ ...productForm, costPrice: e.target.value })} 
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white dark:bg-slate-800 font-medium" 
                      placeholder="e.g. 350" 
                    />
                    <span className="text-[11px] text-gray-400 mt-1 block">Factory manufacturing cost</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Media & Image Preview */}
              <div className="flex flex-col gap-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <ImageIcon size={13} /> 3. Primary Product Image
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                  <div className="md:col-span-3 flex flex-col gap-2">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                      Image URL (CDN / HTTPS)
                    </label>
                    <input 
                      type="url" 
                      value={productForm.imageUrl} 
                      onChange={e => setProductForm({ ...productForm, imageUrl: e.target.value })} 
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white dark:bg-slate-800" 
                      placeholder="https://cdn.shopify.com/.../product.jpg" 
                    />
                    <p className="text-[11px] text-gray-400">
                      Meta Catalog requires publicly accessible HTTPS images (square format 1080x1080 recommended).
                    </p>
                  </div>

                  {/* Preview Thumbnail */}
                  <div className="w-full aspect-square max-w-[120px] rounded-2xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 overflow-hidden flex items-center justify-center relative shadow-inner">
                    {productForm.imageUrl ? (
                      <img src={productForm.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as any).style.display = 'none'; }} />
                    ) : (
                      <div className="text-center text-gray-400 p-2">
                        <ImageIcon size={24} className="mx-auto mb-1 opacity-50" />
                        <span className="text-[10px] block">Preview</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 4: Variants Builder (Colors & Sizes) */}
              <div className="flex flex-col gap-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                    <Layers size={13} /> 4. Variants Builder (Colors & Sizes)
                  </h3>
                  <span className="text-xs font-semibold text-gray-500">
                    {variantsMatrix.length} variant{variantsMatrix.length !== 1 ? "s" : ""} generated
                  </span>
                </div>

                {/* Color Selector */}
                <div className="bg-gray-50/60 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-gray-200/70 dark:border-slate-700/60 flex flex-col gap-2.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Colors (e.g. Black, Navy Blue, Olive)
                  </label>
                  
                  {/* Preset Quick Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleAddColor(c)}
                        disabled={productForm.colors.includes(c)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                          productForm.colors.includes(c)
                            ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                            : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-purple-400"
                        }`}
                      >
                        + {c}
                      </button>
                    ))}
                  </div>

                  {/* Selected Color Tags */}
                  {productForm.colors.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200/50">
                      {productForm.colors.map(c => (
                        <span key={c} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200">
                          <span>{c}</span>
                          <button type="button" onClick={() => handleRemoveColor(c)} className="hover:text-red-600">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Size Selector */}
                <div className="bg-gray-50/60 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-gray-200/70 dark:border-slate-700/60 flex flex-col gap-2.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Sizes (e.g. S, M, L, XL, XXL)
                  </label>
                  
                  {/* Preset Quick Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_SIZES.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleAddSize(s)}
                        disabled={productForm.sizes.includes(s)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                          productForm.sizes.includes(s)
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                            : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-indigo-400"
                        }`}
                      >
                        + {s}
                      </button>
                    ))}
                  </div>

                  {/* Selected Size Tags */}
                  {productForm.sizes.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200/50">
                      {productForm.sizes.map(s => (
                        <span key={s} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                          <span>{s}</span>
                          <button type="button" onClick={() => handleRemoveSize(s)} className="hover:text-red-600">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Generated Variants Table */}
                {variantsMatrix.length > 0 && (
                  <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 font-bold uppercase">
                        <tr>
                          <th className="p-3">Variant SKU</th>
                          <th className="p-3">Color</th>
                          <th className="p-3">Size</th>
                          <th className="p-3">Price (₹)</th>
                          <th className="p-3">MRP (₹)</th>
                          <th className="p-3">Stock</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                        {variantsMatrix.map((v) => (
                          <tr key={v.sku} className="hover:bg-gray-50/50">
                            <td className="p-3 font-mono font-bold text-gray-800 dark:text-gray-200">
                              {v.sku}
                            </td>
                            <td className="p-3">
                              {v.color ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  {v.color}
                                </span>
                              ) : <span className="text-gray-400">-</span>}
                            </td>
                            <td className="p-3">
                              {v.size ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  {v.size}
                                </span>
                              ) : <span className="text-gray-400">-</span>}
                            </td>
                            <td className="p-3">
                              <input 
                                type="number" 
                                value={v.price} 
                                onChange={e => handleMatrixVariantChange(v.sku, "price", Number(e.target.value))}
                                className="w-20 px-2 py-1 border border-gray-300 dark:border-slate-600 rounded text-xs font-bold outline-none" 
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="number" 
                                value={v.compareAt} 
                                onChange={e => handleMatrixVariantChange(v.sku, "compareAt", Number(e.target.value))}
                                className="w-20 px-2 py-1 border border-gray-300 dark:border-slate-600 rounded text-xs line-through text-gray-500 outline-none" 
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="number" 
                                value={v.inventory} 
                                onChange={e => handleMatrixVariantChange(v.sku, "inventory", Number(e.target.value))}
                                className="w-16 px-2 py-1 border border-gray-300 dark:border-slate-600 rounded text-xs font-mono outline-none" 
                              />
                            </td>
                            <td className="p-3 text-center">
                              <button 
                                type="button" 
                                onClick={() => handleRemoveVariantRow(v.sku)} 
                                className="text-gray-400 hover:text-red-600 p-1"
                                title="Remove this variant"
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Section 5: Meta Push Switch & Footer */}
              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex flex-col gap-4">
                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/40 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={productForm.pushToMeta} 
                    onChange={e => setProductForm({ ...productForm, pushToMeta: e.target.checked })} 
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                      <ShoppingBag size={14} className="text-purple-600" />
                      Push directly to Meta Commerce Catalog & WhatsApp Store
                    </span>
                    <span className="text-[11px] text-purple-700 dark:text-purple-400">
                      Creates grouped items in your Meta Catalog so customers can browse styles and pick color/size in WhatsApp chats.
                    </span>
                  </div>
                </label>

                <div className="flex justify-end gap-3 items-center">
                  <button 
                    type="button" 
                    onClick={() => setShowCatalogMaker(false)} 
                    className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmittingCatalog}
                    className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-600/20 transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmittingCatalog ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                    {isSubmittingCatalog ? "Saving & Syncing to Meta..." : "Save & Publish to Meta Catalog"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}