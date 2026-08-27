"use client";

import React, { useState } from "react";
import { Package, Send, Filter, Download, ArrowUpRight, CheckCircle2, TrendingUp, TrendingDown, Percent, DollarSign } from "lucide-react";

export default function WhatmoreCommerceEditor() {
  const [products, setProducts] = useState([
    { id: "ESP-902", title: "Premium Cotton Polo T-Shirt", sku: "POLO-M-NVY", inventory: 450, cost: 120, price: 290, compareAt: 499, status: "Active" },
    { id: "ESP-404", title: "Slim Fit Stretch Chino Pants", sku: "CHINO-32-KHK", inventory: 280, cost: 250, price: 450, compareAt: 799, status: "Active" },
    { id: "ESP-108", title: "Fleece Casual Tracksuit Set", sku: "TRK-L-BLK", inventory: 12, cost: 400, price: 890, compareAt: 1299, status: "Low Stock" },
    { id: "ESP-205", title: "Waterproof Winter Jacket", sku: "JKT-XL-GRY", inventory: 0, cost: 800, price: 1599, compareAt: 2499, status: "Out of Stock" },
  ]);

  const handlePriceChange = (id: string, field: string, value: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: Number(value) } : p));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6 w-full">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">Products & Pricing</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Bulk edit Shopify prices and generate instant WhatsApp catalog links.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-semibold shadow-sm hover:bg-gray-50 transition-colors">
            <Filter size={16} /> Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-colors">
            <CheckCircle2 size={16} /> Sync to Shopify
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-2">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1 flex justify-between">Total Products <Package size={16}/></div>
          <div className="text-2xl font-bold">{products.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1 flex justify-between">Active on WhatsApp <Send size={16}/></div>
          <div className="text-2xl font-bold">3</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-xl shadow-md text-white">
          <div className="text-sm font-medium text-indigo-100 mb-1 flex justify-between">Avg. Profit Margin <TrendingUp size={16}/></div>
          <div className="text-2xl font-bold">58%</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[35%]">Product</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Inventory</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Compare At</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">{p.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5 flex gap-2">
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">{p.sku}</span>
                    <span>•</span>
                    <span className={`${p.status === 'Active' ? 'text-green-600' : p.status === 'Low Stock' ? 'text-orange-500' : 'text-red-500'}`}>{p.status}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${p.inventory > 50 ? 'bg-green-50 text-green-700' : p.inventory > 0 ? 'bg-orange-50 text-orange-700' : 'bg-red-50 text-red-700'}`}>
                    {p.inventory} in stock
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-gray-400 text-sm">₹</span>
                    <input type="number" value={p.cost} onChange={(e) => handlePriceChange(p.id, 'cost', e.target.value)} className="w-24 pl-6 pr-2 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-md bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" />
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-gray-400 text-sm">₹</span>
                    <input type="number" value={p.price} onChange={(e) => handlePriceChange(p.id, 'price', e.target.value)} className="w-24 pl-6 pr-2 py-1.5 text-sm border border-indigo-200 dark:border-indigo-500/50 rounded-md bg-indigo-50/30 dark:bg-indigo-500/10 focus:ring-2 focus:ring-indigo-500 outline-none font-semibold transition-shadow" />
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-gray-400 text-sm">₹</span>
                    <input type="number" value={p.compareAt} onChange={(e) => handlePriceChange(p.id, 'compareAt', e.target.value)} className="w-24 pl-6 pr-2 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-md bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-gray-500 line-through transition-shadow" />
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <button className="inline-flex items-center justify-center w-8 h-8 rounded-md text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors" title="Send WhatsApp Catalog">
                    <Send size={16} />
                  </button>
                  <button className="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ml-1" title="View in Shopify">
                    <ArrowUpRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
