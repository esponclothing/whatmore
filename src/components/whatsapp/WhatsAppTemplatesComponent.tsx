"use client";

import React, { useState, useEffect } from "react";
import {
  FileCode, Plus, Search, RefreshCw, CheckCircle2, Clock, AlertCircle,
  X, Send, Trash2, Eye, Info, Calendar, Zap, TrendingUp, Filter, Sparkles,
  ArrowUpDown, CheckCheck, Radio, Check
} from "lucide-react";
import {
  getWhatsAppTemplates,
  saveWhatsAppTemplateAction,
  deleteWhatsAppTemplateAction,
  sendWhatsAppTemplateAction
} from "@/app/actions/whatsAppPlatformActions";

// Meta API Constraints
const META_LIMITS = {
  NAME_MAX: 512,        // name: lowercase, underscores only
  HEADER_MAX: 60,       // header text
  BODY_MAX: 1024,       // body text
  FOOTER_MAX: 60,       // footer text
  BUTTON_TEXT_MAX: 25,  // each button label
  BUTTON_URL_MAX: 2000, // URL button url
  MAX_QUICK_REPLIES: 3,
  MAX_CTA_BUTTONS: 2,
  TOTAL_BUTTONS_MAX: 3,
};

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "en_US", label: "English (US)" },
  { code: "en_GB", label: "English (UK)" },
  { code: "hi", label: "Hindi (हिंदी)" },
  { code: "mr", label: "Marathi (मराठी)" },
  { code: "gu", label: "Gujarati (ગુજરાતી)" },
  { code: "ta", label: "Tamil (தமிழ்)" },
  { code: "te", label: "Telugu (తెలుగు)" },
  { code: "bn", label: "Bengali (বাংলা)" },
  { code: "pa", label: "Punjabi (ਪੰਜਾਬੀ)" },
  { code: "ur", label: "Urdu (اردو)" },
  { code: "ar", label: "Arabic (عربي)" },
];

const CATEGORIES = [
  { value: "MARKETING", label: "📢 Marketing", desc: "Promotions, offers, product announcements" },
  { value: "UTILITY", label: "⚙️ Utility", desc: "Order updates, shipping, account alerts" },
  { value: "AUTHENTICATION", label: "🔐 Authentication", desc: "OTPs and verification codes" },
];

export default function WhatsAppTemplatesComponent() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [timeRangeFilter, setTimeRangeFilter] = useState<"ALL" | "TODAY" | "7D" | "30D">("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "most_used" | "highest_read" | "alphabetical">("newest");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Live Clock for Preview Bubbles
  const [liveCurrentTime, setLiveCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveCurrentTime(
        now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Create Template State
  const [templateName, setTemplateName] = useState("");
  const [category, setCategory] = useState("MARKETING");
  const [language, setLanguage] = useState("en_US");
  const [headerType, setHeaderType] = useState("NONE");
  const [headerContent, setHeaderContent] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [buttons, setButtons] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState("");

  // Test send state
  const [testPhone, setTestPhone] = useState("");
  const [testingTemplate, setTestingTemplate] = useState<string | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchTemplates = async () => {
    setLoading(true);
    const res = await getWhatsAppTemplates();
    if (res.success) setTemplates(res.templates || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Meta name validation: only lowercase, digits, underscores, max 512 chars
  const validateName = (name: string) => {
    if (!name) return "Template name is required.";
    if (!/^[a-z0-9_]+$/.test(name)) return "Name must be lowercase letters, numbers, and underscores only. No spaces or special chars.";
    if (name.length > META_LIMITS.NAME_MAX) return `Name too long (max ${META_LIMITS.NAME_MAX} chars).`;
    return "";
  };

  const handleNameChange = (val: string) => {
    const sanitized = val.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    setTemplateName(sanitized);
    setNameError(validateName(sanitized));
  };

  const addButton = (type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER") => {
    const quickReplies = buttons.filter((b) => b.type === "QUICK_REPLY").length;
    const ctaButtons = buttons.filter((b) => b.type !== "QUICK_REPLY").length;
    if (buttons.length >= META_LIMITS.TOTAL_BUTTONS_MAX) {
      showToast("Max 3 buttons allowed.", "error");
      return;
    }
    if (type === "QUICK_REPLY" && quickReplies >= META_LIMITS.MAX_QUICK_REPLIES) {
      showToast("Max 3 Quick Reply buttons.", "error");
      return;
    }
    if (type !== "QUICK_REPLY" && ctaButtons >= META_LIMITS.MAX_CTA_BUTTONS) {
      showToast("Max 2 CTA buttons.", "error");
      return;
    }
    const hasQR = buttons.some((b) => b.type === "QUICK_REPLY");
    const hasCTA = buttons.some((b) => b.type !== "QUICK_REPLY");
    if (type === "QUICK_REPLY" && hasCTA) {
      showToast("Cannot mix Quick Reply and CTA buttons.", "error");
      return;
    }
    if (type !== "QUICK_REPLY" && hasQR) {
      showToast("Cannot mix Quick Reply and CTA buttons.", "error");
      return;
    }
    setButtons((prev) => [...prev, { type, text: "", url: "", phone_number: "" }]);
  };

  const updateButton = (idx: number, field: string, val: string) => {
    setButtons((prev) => prev.map((b, i) => (i === idx ? { ...b, [field]: val } : b)));
  };

  const removeButton = (idx: number) => setButtons((prev) => prev.filter((_, i) => i !== idx));

  const insertVariable = () => {
    const nextVar = (bodyText.match(/\{\{(\d+)\}\}/g)?.length || 0) + 1;
    setBodyText((prev) => prev + `{{${nextVar}}}`);
  };

  const resetForm = () => {
    setTemplateName("");
    setCategory("MARKETING");
    setLanguage("en_US");
    setHeaderType("NONE");
    setHeaderContent("");
    setBodyText("");
    setFooterText("");
    setButtons([]);
    setNameError("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateName(templateName);
    if (err) {
      setNameError(err);
      return;
    }
    if (!bodyText.trim()) {
      showToast("Body text is required.", "error");
      return;
    }
    if (bodyText.length > META_LIMITS.BODY_MAX) {
      showToast(`Body too long (max ${META_LIMITS.BODY_MAX} chars).`, "error");
      return;
    }
    if (headerContent.length > META_LIMITS.HEADER_MAX) {
      showToast(`Header too long (max ${META_LIMITS.HEADER_MAX} chars).`, "error");
      return;
    }
    if (footerText.length > META_LIMITS.FOOTER_MAX) {
      showToast(`Footer too long (max ${META_LIMITS.FOOTER_MAX} chars).`, "error");
      return;
    }
    const invalidBtn = buttons.find((b) => !b.text || b.text.length > META_LIMITS.BUTTON_TEXT_MAX);
    if (invalidBtn) {
      showToast(`Button text required and max ${META_LIMITS.BUTTON_TEXT_MAX} chars.`, "error");
      return;
    }

    setSaving(true);
    const res = await saveWhatsAppTemplateAction({
      name: templateName,
      category,
      language,
      headerType,
      headerContent,
      bodyText,
      footerText,
      buttons,
      variables: []
    });
    setSaving(false);
    if (res.success) {
      showToast(res.submitted ? "Template submitted to Meta for review! Status: PENDING" : "Template saved locally.", "success");
      setShowCreateModal(false);
      resetForm();
      fetchTemplates();
    } else {
      showToast(res.error || "Failed to create template.", "error");
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete template "${name}"? This will also remove it from Meta.`)) return;
    setDeleting(name);
    const res = await deleteWhatsAppTemplateAction(name);
    setDeleting(null);
    if (res.success) {
      showToast("Template deleted.");
      fetchTemplates();
    } else {
      showToast(res.error || "Delete failed.", "error");
    }
  };

  const handleTest = async (t: any) => {
    if (!testPhone) {
      showToast("Enter a test phone number first.", "error");
      return;
    }
    setTestingTemplate(t.name);
    const res = await sendWhatsAppTemplateAction(testPhone, t.name, t.language || "en_US", []);
    setTestingTemplate(null);
    if (res.success) showToast("Test template sent successfully!");
    else showToast(res.error || "Send failed.", "error");
  };

  // Filter & Sort Logic
  const filtered = templates
    .filter((t) => {
      if (categoryFilter !== "ALL" && t.category !== categoryFilter) return false;
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (
        searchQuery &&
        !t.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !t.bodyText?.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      if (timeRangeFilter !== "ALL") {
        const now = Date.now();
        const createdTime = t.createdAt ? new Date(t.createdAt).getTime() : now;
        if (timeRangeFilter === "TODAY") {
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          if (createdTime < startOfDay.getTime()) return false;
        } else if (timeRangeFilter === "7D") {
          if (now - createdTime > 7 * 24 * 3600 * 1000) return false;
        } else if (timeRangeFilter === "30D") {
          if (now - createdTime > 30 * 24 * 3600 * 1000) return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortBy === "most_used") {
        return (b.totalSent || 0) - (a.totalSent || 0);
      }
      if (sortBy === "highest_read") {
        return (b.readRate || 0) - (a.readRate || 0);
      }
      if (sortBy === "alphabetical") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  const statusBadge = (status: string) => {
    const cfg: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
      APPROVED: { bg: "rgba(16,185,129,0.1)", color: "#10b981", icon: <CheckCircle2 size={12} /> },
      PENDING: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", icon: <Clock size={12} /> },
      REJECTED: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", icon: <AlertCircle size={12} /> },
      PAUSED: { bg: "rgba(107,114,128,0.1)", color: "#6b7280", icon: <Clock size={12} /> }
    };
    const c = cfg[status] || cfg.PENDING;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "3px 8px",
          background: c.bg,
          color: c.color,
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: 700
        }}
      >
        {c.icon} {status}
      </span>
    );
  };

  // Live preview text with variable replacement preview
  const getRenderedPreviewText = (rawText: string) => {
    if (!rawText) return "";
    return rawText
      .replace(/\{\{1\}\}/g, "John Doe")
      .replace(/\{\{2\}\}/g, "ORD-8921")
      .replace(/\{\{3\}\}/g, "https://11fit.in/track")
      .replace(/\{\{(\d+)\}\}/g, "[Var $1]");
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Toast */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            padding: "12px 18px",
            borderRadius: "10px",
            background: toastMsg.type === "error" ? "#ef4444" : "#10b981",
            color: "white",
            fontWeight: 700,
            fontSize: "13px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            maxWidth: "400px"
          }}
        >
          {toastMsg.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />} {toastMsg.text}
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <FileCode size={22} className="text-indigo-600" />
            Meta Message Templates & Live Preview
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">
            Meta Cloud API verified templates. Track delivery timestamps, read rates, and interactive CTA button clicks.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="Test phone (91XXXXXXXXXX)"
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 shadow-2xs"
          />
          <button
            onClick={fetchTemplates}
            disabled={loading}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition flex items-center gap-2 shadow-2xs"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-indigo-600" : ""} />
            <span>Sync Meta</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-md shadow-indigo-500/20 active:scale-95"
          >
            <Plus size={15} />
            <span>New Template</span>
          </button>
        </div>
      </div>

      {/* Filter & Sort Toolbar */}
      <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates or body text..."
              className="pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500 w-56"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">✅ Approved</option>
            <option value="PENDING">⏳ Pending</option>
            <option value="REJECTED">❌ Rejected</option>
          </select>

          {/* Time Range Filter */}
          <select
            value={timeRangeFilter}
            onChange={(e) => setTimeRangeFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none cursor-pointer text-indigo-600 dark:text-indigo-400"
          >
            <option value="ALL">🕒 All Time</option>
            <option value="TODAY">📅 Created Today</option>
            <option value="7D">⚡ Last 7 Days</option>
            <option value="30D">📊 Last 30 Days</option>
          </select>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
            <ArrowUpDown size={12} /> Sort By:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-black outline-none cursor-pointer"
          >
            <option value="newest">🕒 Newest Created</option>
            <option value="oldest">⏳ Oldest First</option>
            <option value="most_used">🚀 Most Sent / Dispatched</option>
            <option value="highest_read">👁️ Highest Read Rate</option>
            <option value="alphabetical">🔤 Name (A-Z)</option>
          </select>

          <span className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-[11px] font-bold text-gray-600 dark:text-gray-300">
            {filtered.length} {filtered.length === 1 ? "Template" : "Templates"}
          </span>
        </div>
      </div>

      {/* Template Cards Grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">
          <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-indigo-500" />
          <div className="font-bold text-xs">Syncing templates from Meta Cloud API...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-gray-50/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
          <FileCode size={44} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <h3 className="font-black text-gray-800 dark:text-white text-base mb-1">No message templates found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
            Create your first Meta WhatsApp template to launch targeted broadcasts and sales campaigns.
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            + Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => {
            const createdFormatted = t.createdAt
              ? new Date(t.createdAt).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true
                })
              : "Synchronized";

            const previewTime = t.createdAt
              ? new Date(t.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
              : liveCurrentTime;

            return (
              <div
                key={t.id || t.name}
                className="bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-3xl p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between gap-3.5"
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-black text-sm text-gray-900 dark:text-white tracking-tight break-all">
                        {t.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {statusBadge(t.status)}
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                          {t.category}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-500">
                          {t.language || "en_US"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(t.name)}
                      disabled={deleting === t.name}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
                      title="Delete Template from Meta"
                    >
                      {deleting === t.name ? <RefreshCw size={14} className="animate-spin text-red-500" /> : <Trash2 size={15} />}
                    </button>
                  </div>

                  {/* Creation Timestamp Badge */}
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1 mb-2.5">
                    <Calendar size={11} className="text-gray-400" />
                    <span>Created: {createdFormatted}</span>
                  </div>

                  {/* WhatsApp Chat Preview Bubble */}
                  <div className="bg-[#e2ffc7] dark:bg-emerald-950/40 border border-[#c6f0a4] dark:border-emerald-800/50 rounded-2xl rounded-tr-xs p-3.5 text-xs text-gray-900 dark:text-gray-100 shadow-2xs">
                    {t.headerContent && (
                      <div className="font-black text-xs text-gray-900 dark:text-white mb-1.5 pb-1 border-b border-emerald-300/40 dark:border-emerald-700/40">
                        {t.headerContent}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap leading-relaxed font-sans text-xs">
                      {t.bodyText?.slice(0, 220)}
                      {t.bodyText?.length > 220 ? "..." : ""}
                    </div>
                    {t.footerText && (
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 italic">
                        {t.footerText}
                      </div>
                    )}

                    {/* Dynamic Message Time with Blue Double Ticks */}
                    <div className="flex items-center justify-end gap-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-1">
                      <span>{previewTime}</span>
                      <CheckCheck size={13} className="text-sky-500 inline stroke-[2.5]" />
                    </div>
                  </div>

                  {/* Buttons preview */}
                  {t.buttons && t.buttons !== "[]" && (() => {
                    try {
                      const btns = JSON.parse(t.buttons);
                      if (btns.length > 0) {
                        return (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {btns.map((b: any, i: number) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-[10px] font-bold flex items-center gap-1"
                              >
                                {b.type === "URL" ? "🔗" : b.type === "PHONE_NUMBER" ? "📞" : "↩️"} {b.text}
                              </span>
                            ))}
                          </div>
                        );
                      }
                    } catch {}
                    return null;
                  })()}
                </div>

                {/* Bottom Analytics & Actions */}
                <div className="pt-3 border-t border-gray-100 dark:border-slate-700 flex flex-col gap-2.5">
                  {/* Performance stats mini-strip */}
                  <div className="grid grid-cols-4 gap-1.5 p-2 bg-gray-50/80 dark:bg-slate-900/60 rounded-xl text-center border border-gray-100 dark:border-slate-800">
                    <div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase">Broadcasts</div>
                      <div className="text-xs font-black text-gray-800 dark:text-white mt-0.5">{t.campaignsCount || 0}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase">Sent</div>
                      <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{t.totalSent || 0}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase">Read Rate</div>
                      <div className="text-xs font-black text-cyan-600 dark:text-cyan-400 mt-0.5">{t.readRate || 0}%</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase">CTR</div>
                      <div className="text-xs font-black text-purple-600 dark:text-purple-400 mt-0.5">{t.clickRate || 0}%</div>
                    </div>
                  </div>

                  {/* Test Send Button */}
                  {t.status === "APPROVED" && (
                    <button
                      onClick={() => handleTest(t)}
                      disabled={testingTemplate === t.name}
                      className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                    >
                      {testingTemplate === t.name ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Send size={13} />
                      )}
                      <span>{testingTemplate === t.name ? "Sending Test..." : "Send Test to Phone"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 px-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/40">
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <FileCode size={18} className="text-indigo-600" />
                  Create WhatsApp Message Template
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Submitted directly to Meta Cloud API for approval.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              {/* Left Form */}
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleCreate} className="flex flex-col gap-4">
                  {/* Template Name */}
                  <div>
                    <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase mb-1.5">
                      Template Name <span className="text-red-500">*</span>
                      <span className="font-medium text-gray-400 lowercase ml-2">(lowercase + underscores only)</span>
                    </label>
                    <input
                      value={templateName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required
                      placeholder="e.g. festive_offer_2026"
                      className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border ${
                        nameError ? "border-red-500" : "border-gray-200 dark:border-slate-700"
                      } rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500`}
                    />
                    {nameError && <p className="text-red-500 text-[11px] mt-1">{nameError}</p>}
                  </div>

                  {/* Category + Language */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase mb-1.5">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none cursor-pointer"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase mb-1.5">
                        Language <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none cursor-pointer"
                      >
                        {LANGUAGES.map((l) => (
                          <option key={l.code} value={l.code}>
                            {l.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Header Type */}
                  <div>
                    <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase mb-1.5">
                      Header (Optional)
                    </label>
                    <div className="flex gap-2 mb-2 flex-wrap">
                      {["NONE", "TEXT", "IMAGE", "VIDEO", "DOCUMENT"].map((ht) => (
                        <button
                          key={ht}
                          type="button"
                          onClick={() => setHeaderType(ht)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition border ${
                            headerType === ht
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-indigo-400"
                          }`}
                        >
                          {ht}
                        </button>
                      ))}
                    </div>

                    {headerType === "TEXT" && (
                      <div>
                        <input
                          value={headerContent}
                          onChange={(e) => setHeaderContent(e.target.value)}
                          placeholder="Header text (max 60 chars)"
                          maxLength={60}
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-[10px] text-gray-400 text-right mt-1">
                          {headerContent.length}/{META_LIMITS.HEADER_MAX}
                        </p>
                      </div>
                    )}
                    {["IMAGE", "VIDEO", "DOCUMENT"].includes(headerType) && (
                      <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-800/50">
                        📎 {headerType} header: Media attachment URL will be provided when launching a broadcast campaign.
                      </div>
                    )}
                  </div>

                  {/* Body Text */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase">
                        Body Text <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={insertVariable}
                        className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-bold transition hover:bg-indigo-100 flex items-center gap-1"
                      >
                        <Sparkles size={12} />
                        <span>Insert Variable {"{{n}}"}</span>
                      </button>
                    </div>
                    <textarea
                      value={bodyText}
                      onChange={(e) => setBodyText(e.target.value)}
                      required
                      rows={5}
                      maxLength={META_LIMITS.BODY_MAX}
                      placeholder="Hi {{1}}, your order {{2}} has been shipped! Track it here: {{3}}"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-sans outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                    />
                    <p className="text-[10px] text-gray-400 text-right mt-1">
                      {bodyText.length}/{META_LIMITS.BODY_MAX}
                    </p>
                  </div>

                  {/* Footer Text */}
                  <div>
                    <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase mb-1.5">
                      Footer (Optional, max 60 chars)
                    </label>
                    <input
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      placeholder="e.g. 11FIT | Reply STOP to unsubscribe"
                      maxLength={60}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Buttons */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase">
                        Buttons (Max 3)
                      </label>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => addButton("QUICK_REPLY")}
                          className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-bold"
                        >
                          + Quick Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => addButton("URL")}
                          className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold"
                        >
                          + URL Button
                        </button>
                        <button
                          type="button"
                          onClick={() => addButton("PHONE_NUMBER")}
                          className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold"
                        >
                          + Phone
                        </button>
                      </div>
                    </div>

                    {buttons.map((btn, idx) => (
                      <div key={idx} className="flex gap-2 mb-2 items-center">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold">
                          {btn.type === "QUICK_REPLY" ? "↩️ QR" : btn.type === "URL" ? "🔗 URL" : "📞 Call"}
                        </span>
                        <input
                          value={btn.text}
                          onChange={(e) => updateButton(idx, "text", e.target.value)}
                          placeholder="Button label (max 25 chars)"
                          maxLength={25}
                          className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs outline-none"
                        />
                        {btn.type === "URL" && (
                          <input
                            value={btn.url}
                            onChange={(e) => updateButton(idx, "url", e.target.value)}
                            placeholder="https://11fit.in/..."
                            className="flex-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs outline-none font-mono"
                          />
                        )}
                        {btn.type === "PHONE_NUMBER" && (
                          <input
                            value={btn.phone_number}
                            onChange={(e) => updateButton(idx, "phone_number", e.target.value)}
                            placeholder="+917404388242"
                            className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs outline-none font-mono"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeButton(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={saving || !!nameError}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>{saving ? "Submitting to Meta API..." : "Submit Template to Meta →"}</span>
                  </button>
                </form>
              </div>

              {/* Right Live Preview */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-100 dark:border-slate-800 p-5 bg-gray-50/70 dark:bg-slate-900/70 flex flex-col justify-between overflow-y-auto">
                <div>
                  <div className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Eye size={13} className="text-indigo-600" />
                    Live WhatsApp Preview
                  </div>

                  <div className="bg-[#efeae2] dark:bg-slate-950 p-3.5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-inner">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tr-xs p-3.5 shadow-sm text-xs text-gray-900 dark:text-gray-100 flex flex-col gap-1.5">
                      {headerContent && (
                        <div className="font-black text-xs text-gray-900 dark:text-white pb-1 border-b border-gray-100 dark:border-slate-700">
                          {headerContent}
                        </div>
                      )}
                      {!bodyText ? (
                        <div className="text-gray-400 italic text-xs">Start typing template body text...</div>
                      ) : (
                        <div className="whitespace-pre-wrap leading-relaxed text-xs">
                          {getRenderedPreviewText(bodyText)}
                        </div>
                      )}
                      {footerText && (
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 italic">
                          {footerText}
                        </div>
                      )}

                      {/* Live Clock Time with Blue Ticks */}
                      <div className="flex items-center justify-end gap-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-1">
                        <span>{liveCurrentTime}</span>
                        <CheckCheck size={13} className="text-sky-500 inline stroke-[2.5]" />
                      </div>
                    </div>

                    {/* Preview Buttons */}
                    {buttons.length > 0 && (
                      <div className="flex flex-col gap-1.5 mt-2">
                        {buttons.map((b, i) => (
                          <div
                            key={i}
                            className="bg-white dark:bg-slate-800 rounded-xl py-2 px-3 text-center text-xs font-bold text-sky-600 dark:text-sky-400 shadow-2xs border border-gray-100 dark:border-slate-700 flex items-center justify-center gap-1.5"
                          >
                            {b.type === "URL" ? "🔗" : b.type === "PHONE_NUMBER" ? "📞" : "↩️"}
                            <span>{b.text || "Button Label"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl text-[11px] text-indigo-950 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-800/40 leading-relaxed">
                  <strong>Meta Approval SLA:</strong>
                  <br />
                  Submitted templates are reviewed by Meta AI. Usually approved in 2-15 minutes.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
