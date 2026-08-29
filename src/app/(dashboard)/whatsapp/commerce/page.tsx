"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, ArrowUpRight, CheckCircle2, AlertTriangle, MessageSquare, Download, RefreshCw, Plus, Store, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getShopifyCredentialsAction, syncShopifyProductsAction, getProductsAction, createProductAction } from "@/app/actions/whatsAppPlatformActions";

// Mock Data
const MOCK_PRODUCTS = [
  { id: 1, name: "Premium Cotton T-Shirt", sku: "TS-PCT-01", price: 899, compareAt: 1299, cost: 450, inventory: 342, status: "Active" },
  { id: 2, name: "Slim Fit Denim Jeans", sku: "DN-SFJ-04", price: 1999, compareAt: 2499, cost: 950, inventory: 128, status: "Active" },
  { id: 3, name: "Casual Linen Button-Down", sku: "SH-CLB-12", price: 1499, compareAt: 1899, cost: 700, inventory: 45, status: "Low Stock" },
  { id: 4, name: "Heavyweight Pullover Hoodie", sku: "HD-HPH-02", price: 2299, compareAt: 2999, cost: 1100, inventory: 0, status: "Out of Stock" },
  { id: 5, name: "Athletic Performance Shorts", sku: "SH-APS-09", price: 799, compareAt: 1099, cost: 350, inventory: 512, status: "Active" },
];

export default function ProductsCommercePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Shopify Integration State
  const [isShopifyConnected, setIsShopifyConnected] = useState(false);
  const [isFetchingShopify, setIsFetchingShopify] = useState(false);
  const [shopifyDomain, setShopifyDomain] = useState("");
  
  // Catalog Maker Modal State
  const [showCatalogMaker, setShowCatalogMaker] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", sku: "", price: "", compareAt: "", cost: "", inventory: "10" });

  const fetchProducts = async () => {
    const res = await getProductsAction();
    if (res.success && res.products && res.products.length > 0) {
      const mapped = res.products.map((p: any, idx: number) => ({
        id: idx + 1,
        dbId: p.id,
        name: p.name,
        sku: p.sku || "",
        price: p.sellingPrice || 0,
        compareAt: p.mrp || 0,
        cost: p.purchasePrice || 0,
        inventory: p.stockQuantity || 0,
        status: p.status || "Active",
        image: p.images?.[0] || "",
        description: p.description || ""
      }));
      setProducts(mapped);
    }
  };

  useEffect(() => {
    getShopifyCredentialsAction().then((res) => {
      if (res.success && res.credentials?.shopifyAccessToken) {
        setIsShopifyConnected(true);
        setShopifyDomain(res.credentials.shopifyStoreDomain || "Connected Store");
      }
    });
    fetchProducts();
  }, []);

  const handleEditChange = (id: number, field: string, value: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: Number(value) || 0 } : p));
  };

  const calculateMargin = (price: number, cost: number) => {
    if (!price || !cost) return "0%";
    return (((price - cost) / price) * 100).toFixed(1) + "%";
  };
  
  const handleFetchShopify = async () => {
    setIsFetchingShopify(true);
    const res = await syncShopifyProductsAction();
    if (res.success) {
      alert(res.message);
      await fetchProducts();
    } else {
      alert("Shopify Sync Failed: " + res.error);
    }
    setIsFetchingShopify(false);
  };
  
  const handleSaveCatalogProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createProductAction({
      name: newProduct.name,
      sku: newProduct.sku,
      price: Number(newProduct.price) || 0,
      compareAt: Number(newProduct.compareAt) || 0,
      cost: Number(newProduct.cost) || 0,
      inventory: Number(newProduct.inventory) || 0
    });
    if (res.success) {
      await fetchProducts();
      setShowCatalogMaker(false);
      setNewProduct({ name: "", sku: "", price: "", compareAt: "", cost: "", inventory: "10" });
    } else {
      alert("Failed to save product: " + res.error);
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto flex flex-col gap-8 w-full">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-1">Products & Pricing</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your catalog, adjust pricing, and sync with WhatsApp.</p>
        </div>
        
        <div className="flex gap-3">
          {isShopifyConnected ? (
            <button 
              onClick={handleFetchShopify}
              disabled={isFetchingShopify}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-800 rounded-xl border border-gray-200 text-sm font-bold shadow-sm transition-all"
            >
              <RefreshCw size={16} className={isFetchingShopify ? "animate-spin" : ""} />
              {isFetchingShopify ? "Syncing..." : "Sync from Shopify"}
            </button>
          ) : (
            <Link 
              href="/whatsapp/api-settings"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl border border-emerald-200 text-sm font-bold shadow-sm transition-all"
            >
              <Store size={16} /> Connect Shopify
            </Link>
          )}
          
          <button 
            onClick={() => setShowCatalogMaker(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus size={18} /> Catalog Maker
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search products, SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"><Filter size={18} /></button>
            <button className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"><Download size={18} /></button>
          </div>
        </div>

        {/* Dense Data Table (Shopify Style) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Inventory</th>
                <th className="px-6 py-4">Price (₹)</th>
                <th className="px-6 py-4 text-gray-400">Compare at (₹)</th>
                <th className="px-6 py-4 text-gray-400">Cost per item (₹)</th>
                <th className="px-6 py-4 text-right">Margin</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 dark:border-slate-700">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Store size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5" style={{ flexWrap: "wrap" }}>
                          <span className="text-xs text-gray-500 font-mono">SKU: {p.sku || "N/A"}</span>
                          {p.description && (
                            <span 
                              className="text-xs text-gray-400 max-w-[250px] truncate" 
                              title={p.description.replace(/<[^>]*>/g, '').trim()}
                              style={{ display: "inline-block", borderLeft: "1px solid #e2e8f0", paddingLeft: "8px" }}
                            >
                              {p.description.replace(/<[^>]*>/g, '').trim()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                      p.status === "Active" ? "bg-green-100 text-green-700" :
                      p.status === "Low Stock" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-700"
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-gray-700 dark:text-gray-300">
                    {p.inventory}
                  </td>
                  
                  <td className="px-6 py-4">
                    {editingId === p.id ? (
                       <input 
                         type="number" 
                         value={p.price} 
                         onChange={(e) => handleEditChange(p.id, 'price', e.target.value)}
                         className="w-20 px-2 py-1 border border-indigo-500 rounded text-sm outline-none"
                       />
                    ) : (
                      <span className="font-semibold text-gray-900 dark:text-white" onClick={() => setEditingId(p.id)}>₹{p.price.toLocaleString()}</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-gray-500 line-through">
                    {editingId === p.id ? (
                       <input 
                         type="number" 
                         value={p.compareAt} 
                         onChange={(e) => handleEditChange(p.id, 'compareAt', e.target.value)}
                         className="w-20 px-2 py-1 border border-gray-300 rounded text-sm outline-none line-through"
                       />
                    ) : (
                      <span onClick={() => setEditingId(p.id)}>₹{p.compareAt.toLocaleString()}</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-gray-500">
                    {editingId === p.id ? (
                       <input 
                         type="number" 
                         value={p.cost} 
                         onChange={(e) => handleEditChange(p.id, 'cost', e.target.value)}
                         className="w-20 px-2 py-1 border border-gray-300 rounded text-sm outline-none"
                       />
                    ) : (
                      <span onClick={() => setEditingId(p.id)}>₹{p.cost.toLocaleString()}</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-right">
                    <span className={`font-semibold ${parseFloat(calculateMargin(p.price, p.cost)) > 40 ? 'text-green-600' : 'text-gray-600'}`}>
                      {calculateMargin(p.price, p.cost)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingId === p.id ? (
                        <button onClick={() => setEditingId(null)} className="p-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-md">
                          <CheckCircle2 size={16} />
                        </button>
                      ) : null}
                      <button className="p-1.5 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors" title="Send Catalog Link via WhatsApp">
                        <MessageSquare size={16} />
                      </button>
                      {isShopifyConnected && (
                         <button className="p-1.5 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 rounded-md transition-colors" title="Open in Shopify">
                           <ExternalLink size={16} />
                         </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex justify-between items-center text-sm text-gray-500">
          <span>Showing {products.length} products</span>
          {editingId !== null && <span className="text-indigo-600 font-semibold animate-pulse">Unsaved changes...</span>}
        </div>
      </div>
      
      {/* Catalog Maker Modal */}
      {showCatalogMaker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
               <div>
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white">Meta Catalog Maker</h2>
                 <p className="text-sm text-gray-500 mt-1">Create a product to instantly push to your WhatsApp Catalog.</p>
               </div>
               <button onClick={() => setShowCatalogMaker(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                 &times;
               </button>
             </div>
             
             <form onSubmit={handleSaveCatalogProduct} className="p-6 flex flex-col gap-5">
               <div className="grid grid-cols-2 gap-5">
                 <div className="col-span-2">
                   <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Product Title</label>
                   <input type="text" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800" placeholder="e.g. Classic White T-Shirt" />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">SKU</label>
                   <input type="text" required value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800" placeholder="TSH-001" />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Inventory Quantity</label>
                   <input type="number" required value={newProduct.inventory} onChange={e => setNewProduct({...newProduct, inventory: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800" />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Selling Price (₹)</label>
                   <input type="number" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800" placeholder="999" />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Compare-at Price (₹)</label>
                   <input type="number" value={newProduct.compareAt} onChange={e => setNewProduct({...newProduct, compareAt: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800" placeholder="1499" />
                 </div>
               </div>
               
               <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3 mt-2">
                 <button type="button" onClick={() => setShowCatalogMaker(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
                 <button type="submit" className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2">
                   <Plus size={16} /> Save & Push to Meta
                 </button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}