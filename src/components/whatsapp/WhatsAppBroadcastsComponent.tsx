"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Send,
  Plus,
  Search,
  RefreshCw,
  BarChart2,
  CheckCircle2,
  Clock,
  ChevronRight,
  FileCode,
  Users,
  Sliders,
  Calendar,
  Sparkles,
  X,
  Bot,
  ArrowRight,
  Check,
  AlertCircle,
  Tag,
  Trash2,
  Phone,
  Eye,
  Radio,
  ExternalLink,
  MessageSquare,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  CalendarDays,
  Zap,
  MousePointerClick,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Percent,
  Filter,
  CheckCheck,
  CornerDownRight,
  MessageCircle
} from "lucide-react";
import {
  getWhatsAppCampaigns,
  getWhatsAppTemplates,
  getWhatsAppAudienceSegments,
  launchWhatsAppBroadcastAction,
  getBroadcastCampaignAnalyticsAction,
  deleteWhatsAppBroadcastCampaignAction
} from "@/app/actions/whatsAppPlatformActions";

export default function WhatsAppBroadcastsComponent() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [tagSegments, setTagSegments] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Wizard Modal State
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Wizard Form State
  const [campaignName, setCampaignName] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [templateSearch, setTemplateSearch] = useState<string>("");
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>("ALL");

  // Audience State
  const [audienceType, setAudienceType] = useState<"ALL" | "TAGS" | "CUSTOM">("ALL");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearchQuery, setTagSearchQuery] = useState<string>("");
  const [customPhonesInput, setCustomPhonesInput] = useState<string>("");
  const [previewSearchQuery, setPreviewSearchQuery] = useState<string>("");

  // Variable Mappings & Media State
  const [variableMappings, setVariableMappings] = useState<Array<{ varIndex: number; mappedTo: string; staticValue: string }>>([]);
  const [headerMediaUrl, setHeaderMediaUrl] = useState<string>("");

  // Schedule & Dispatch State
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [launching, setLaunching] = useState<boolean>(false);

  // Analytics Modal State
  const [selectedCampaignForAnalytics, setSelectedCampaignForAnalytics] = useState<any | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);
  const [analyticsTab, setAnalyticsTab] = useState<"ALL" | "CLICKED" | "READ" | "REPLIED" | "DELIVERED" | "FAILED">("ALL");
  const [recipientSearchQuery, setRecipientSearchQuery] = useState<string>("");

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchCampaignsAndTemplates = async () => {
    setLoading(true);
    try {
      const [campRes, tempRes, segRes] = await Promise.all([
        getWhatsAppCampaigns(),
        getWhatsAppTemplates(),
        getWhatsAppAudienceSegments()
      ]);

      if (campRes.success && campRes.campaigns) setCampaigns(campRes.campaigns);
      if (tempRes.success && tempRes.templates) {
        setTemplates(tempRes.templates);
        if (tempRes.templates.length > 0 && !selectedTemplate) {
          const approved = tempRes.templates.find((t: any) => t.status === "APPROVED") || tempRes.templates[0];
          setSelectedTemplate(approved);
        }
      }
      if (segRes.success) {
        if (segRes.segments) setSegments(segRes.segments);
        if (segRes.tagSegments) setTagSegments(segRes.tagSegments);
        if (segRes.contacts) setContacts(segRes.contacts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignsAndTemplates();
  }, []);

  // Detect template body variables {{1}}, {{2}} when template changes
  useEffect(() => {
    if (selectedTemplate?.bodyText) {
      const matches = selectedTemplate.bodyText.match(/\{\{(\d+)\}\}/g);
      if (matches) {
        const uniqueIndices = Array.from(new Set(matches.map((m: string) => parseInt(m.replace(/\D/g, ""), 10)))).sort((a: any, b: any) => a - b);
        setVariableMappings(
          uniqueIndices.map((idx: any, i: number) => ({
            varIndex: idx,
            mappedTo: i === 0 ? "contactPerson" : i === 1 ? "city" : "static",
            staticValue: ""
          }))
        );
      } else {
        setVariableMappings([]);
      }
    }
  }, [selectedTemplate]);

  const openNewBroadcastWizard = () => {
    const defaultName = `Broadcast - ${new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" })} ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
    setCampaignName(defaultName);
    setAudienceType("ALL");
    setSelectedTags([]);
    setTagSearchQuery("");
    setCustomPhonesInput("");
    setPreviewSearchQuery("");
    setIsScheduled(false);
    setScheduledAt("");
    setHeaderMediaUrl("");
    setCurrentStep(1);
    setShowWizard(true);
  };

  const handleLaunchBroadcast = async () => {
    if (!selectedTemplate) {
      showToast("Please select a message template first.", "error");
      return;
    }
    if (!campaignName.trim()) {
      showToast("Please enter a campaign name.", "error");
      return;
    }

    let customPhonesList: string[] = [];
    if (audienceType === "CUSTOM") {
      customPhonesList = customPhonesInput
        .split(/[\n,]+/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (customPhonesList.length === 0) {
        showToast("Please enter at least one valid phone number.", "error");
        return;
      }
    }

    if (audienceType === "TAGS" && selectedTags.length === 0) {
      showToast("Please select at least one contact tag.", "error");
      return;
    }

    if (isScheduled && !scheduledAt) {
      showToast("Please select a valid scheduled date & time.", "error");
      return;
    }

    setLaunching(true);

    const formattedMappings = variableMappings.map((vm) => ({
      varIndex: vm.varIndex,
      mappedTo: vm.mappedTo === "static" ? `static:${vm.staticValue}` : vm.mappedTo
    }));

    const res = await launchWhatsAppBroadcastAction({
      name: campaignName.trim(),
      templateName: selectedTemplate.name,
      languageCode: selectedTemplate.language || "en_US",
      audienceType,
      selectedTags: audienceType === "TAGS" ? selectedTags : undefined,
      customPhones: audienceType === "CUSTOM" ? customPhonesList : undefined,
      scheduledAt: isScheduled && scheduledAt ? scheduledAt : undefined,
      variablesMap: JSON.stringify(formattedMappings),
      headerMediaUrl: headerMediaUrl.trim() || undefined,
      category: selectedTemplate.category || "MARKETING"
    });

    setLaunching(false);

    if (res.success) {
      setShowWizard(false);
      showToast(
        isScheduled
          ? `✓ Broadcast scheduled successfully for ${new Date(scheduledAt).toLocaleString()}!`
          : `🚀 Broadcast launched successfully to ${res.totalAudience || 0} contacts!`
      );
      fetchCampaignsAndTemplates();
    } else {
      showToast(res.error || "Failed to launch broadcast", "error");
    }
  };

  const handleOpenAnalytics = async (campaign: any) => {
    setSelectedCampaignForAnalytics(campaign);
    setLoadingAnalytics(true);
    setAnalyticsTab("ALL");
    setRecipientSearchQuery("");
    const res = await getBroadcastCampaignAnalyticsAction(campaign.id);
    setLoadingAnalytics(false);
    if (res.success) {
      setAnalyticsData(res);
    } else {
      showToast(res.error || "Failed to load campaign analytics", "error");
    }
  };

  const handleDeleteCampaign = async (campaignId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete campaign "${name}"?`)) return;
    const res = await deleteWhatsAppBroadcastCampaignAction(campaignId);
    if (res.success) {
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
      showToast(`Campaign "${name}" deleted.`);
    } else {
      showToast(res.error || "Failed to delete campaign", "error");
    }
  };

  // Filtered contacts based on audience selection
  const filteredAudienceContacts = useMemo(() => {
    if (audienceType === "ALL") {
      return contacts;
    }
    if (audienceType === "TAGS") {
      if (selectedTags.length === 0) return [];
      return contacts.filter((c) => {
        if (!c.tags) return false;
        const cTags = c.tags.split(",").map((t: string) => t.trim().toLowerCase());
        return selectedTags.some((st) => cTags.includes(st.toLowerCase()));
      });
    }
    if (audienceType === "CUSTOM") {
      const rawPhones = customPhonesInput
        .split(/[\n,]+/)
        .map((p) => p.replace(/\D/g, ""))
        .filter((p) => p.length >= 10);
      return rawPhones.map((p, idx) => {
        const match = contacts.find((c) => (c.mobile || "").replace(/\D/g, "").endsWith(p.slice(-10)));
        return {
          id: match?.id || `custom-${idx}`,
          contactPerson: match?.contactPerson || "Custom Recipient",
          businessName: match?.businessName || "",
          mobile: p,
          city: match?.city || "-",
          tags: match?.tags || "Manual Entry"
        };
      });
    }
    return [];
  }, [audienceType, selectedTags, customPhonesInput, contacts]);

  // Preview search filtering
  const searchedPreviewContacts = useMemo(() => {
    if (!previewSearchQuery.trim()) return filteredAudienceContacts;
    const q = previewSearchQuery.toLowerCase().trim();
    return filteredAudienceContacts.filter(
      (c) =>
        (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
        (c.businessName && c.businessName.toLowerCase().includes(q)) ||
        (c.mobile && c.mobile.includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.tags && c.tags.toLowerCase().includes(q))
    );
  }, [filteredAudienceContacts, previewSearchQuery]);

  const visiblePreviewContacts = useMemo(() => {
    return searchedPreviewContacts.slice(0, 60);
  }, [searchedPreviewContacts]);

  // Filtered tag segments for Step 2
  const filteredTagSegments = useMemo(() => {
    if (!tagSearchQuery.trim()) return tagSegments;
    const q = tagSearchQuery.toLowerCase().trim();
    return tagSegments.filter((t) => t.label.toLowerCase().includes(q) || t.tagName.toLowerCase().includes(q));
  }, [tagSegments, tagSearchQuery]);

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.templateId && c.templateId.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (categoryFilter !== "ALL" && (c.category || "MARKETING") !== categoryFilter) return false;
    return true;
  });

  // Filtered templates for wizard
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
      (t.bodyText && t.bodyText.toLowerCase().includes(templateSearch.toLowerCase()));
    if (!matchesSearch) return false;
    if (templateCategoryFilter === "ALL") return true;
    return t.category === templateCategoryFilter;
  });

  // Render live preview body text with variable replacements
  const getRenderedPreviewBody = () => {
    if (!selectedTemplate?.bodyText) return "Select a template to view preview...";
    let text = selectedTemplate.bodyText;
    variableMappings.forEach((vm) => {
      const sampleVal =
        vm.mappedTo === "contactPerson"
          ? "{{Customer Name}}"
          : vm.mappedTo === "city"
          ? "{{City}}"
          : vm.staticValue || `{{${vm.varIndex}}}`;
      text = text.replace(new RegExp(`\\{\\{${vm.varIndex}\\}\\}`, "g"), sampleVal);
    });
    return text;
  };

  // Overall aggregate stats calculated purely from real campaigns
  const totalDispatched = campaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0);
  const totalDelivered = campaigns.reduce((acc, c) => acc + (c.deliveredCount || 0), 0);
  const totalRead = campaigns.reduce((acc, c) => acc + (c.readCount || 0), 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicksCount || 0), 0);
  const totalRevenue = campaigns.reduce((acc, c) => acc + (c.revenueGenerated || 0), 0);

  const avgDeliveryRate = totalDispatched > 0 ? Math.round((totalDelivered / totalDispatched) * 100) : 0;
  const avgReadRate = totalDispatched > 0 ? Math.round((totalRead / totalDispatched) * 100) : 0;
  const avgClickRate = totalDispatched > 0 ? Math.round((totalClicks / totalDispatched) * 100) : 0;

  // Recipient activity log filter in Analytics Modal
  const filteredRecipients = useMemo(() => {
    if (!analyticsData?.recentRecipients) return [];
    let list = analyticsData.recentRecipients;

    if (analyticsTab === "CLICKED") {
      list = list.filter((r: any) => r.status === "CLICKED" || r.clickedAt || r.buttonClicked);
    } else if (analyticsTab === "READ") {
      list = list.filter((r: any) => r.status === "READ" || r.readAt);
    } else if (analyticsTab === "REPLIED") {
      list = list.filter((r: any) => r.status === "REPLIED" || r.repliedAt || r.replyText);
    } else if (analyticsTab === "DELIVERED") {
      list = list.filter((r: any) => r.status === "DELIVERED" || r.deliveredAt);
    } else if (analyticsTab === "FAILED") {
      list = list.filter((r: any) => r.status === "FAILED");
    }

    if (recipientSearchQuery.trim()) {
      const q = recipientSearchQuery.toLowerCase().trim();
      list = list.filter((r: any) =>
        (r.toPhone && r.toPhone.includes(q)) ||
        (r.customerName && r.customerName.toLowerCase().includes(q)) ||
        (r.customerCity && r.customerCity.toLowerCase().includes(q)) ||
        (r.buttonClicked && r.buttonClicked.toLowerCase().includes(q)) ||
        (r.replyText && r.replyText.toLowerCase().includes(q))
      );
    }

    return list;
  }, [analyticsData, analyticsTab, recipientSearchQuery]);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: "12px",
            background: toastMsg.type === "error" ? "#ef4444" : "#10b981",
            color: "white",
            fontWeight: 700,
            fontSize: "13px",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            maxWidth: "420px"
          }}
        >
          {toastMsg.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Top Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
              <Radio size={19} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                WhatsApp Broadcast & Sales Campaigns
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-md border border-emerald-300 dark:border-emerald-800">
                  Live Analytics
                </span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                Target segmented audiences by tags, track read rates (blue ticks), button CTR, inbound replies & sales ROI.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={fetchCampaignsAndTemplates}
            disabled={loading}
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition flex items-center gap-2 shadow-2xs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-indigo-600" : "text-gray-500"} />
            <span>Sync Stats</span>
          </button>
          <button
            onClick={openNewBroadcastWizard}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-2 shadow-md shadow-indigo-500/20 active:scale-95"
          >
            <Plus size={16} />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Hero Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Total Campaigns */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 rounded-2xl p-4.5 flex items-center justify-between shadow-2xs hover:border-indigo-200 transition">
          <div>
            <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Campaigns</div>
            <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">{campaigns.length}</div>
            <div className="text-[10px] text-gray-400 mt-0.5 font-medium">All-time launched</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Radio size={22} />
          </div>
        </div>

        {/* 2. Dispatched Messages */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 rounded-2xl p-4.5 flex items-center justify-between shadow-2xs hover:border-blue-200 transition">
          <div>
            <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Sent Messages</div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {totalDispatched.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5 font-medium">Meta Verified Dispatch</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Send size={22} />
          </div>
        </div>

        {/* 3. Delivery Rate */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 rounded-2xl p-4.5 flex items-center justify-between shadow-2xs hover:border-emerald-200 transition">
          <div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Delivery Rate</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {avgDeliveryRate}%
            </div>
            <div className="text-[10px] text-emerald-600/90 font-semibold mt-0.5">
              {totalDelivered.toLocaleString()} of {totalDispatched.toLocaleString()} delivered
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCheck size={22} />
          </div>
        </div>

        {/* 4. Read Rate (Blue Ticks) */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 rounded-2xl p-4.5 flex items-center justify-between shadow-2xs hover:border-cyan-200 transition">
          <div>
            <div className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Read Rate 👁️</div>
            <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
              {avgReadRate}%
            </div>
            <div className="text-[10px] text-cyan-600/90 font-semibold mt-0.5">
              {totalRead.toLocaleString()} of {totalDispatched.toLocaleString()} read ticks
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Eye size={22} />
          </div>
        </div>

        {/* 5. Click-Through Rate (CTR) */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 rounded-2xl p-4.5 flex items-center justify-between shadow-2xs hover:border-purple-200 transition">
          <div>
            <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Button CTR 👆</div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
              {avgClickRate}%
            </div>
            <div className="text-[10px] text-purple-600/90 font-semibold mt-0.5">
              {totalClicks.toLocaleString()} of {totalDispatched.toLocaleString()} CTA clicks
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <MousePointerClick size={22} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xs">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaigns by name, template ID..."
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">✅ Completed</option>
            <option value="PROCESSING">⏳ Running / Processing</option>
            <option value="SCHEDULED">📅 Scheduled</option>
            <option value="FAILED">❌ Failed</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="MARKETING">🎯 Marketing</option>
            <option value="UTILITY">🔔 Utility</option>
          </select>

          <span className="text-xs text-gray-500 font-bold px-2 py-1 bg-gray-100 dark:bg-slate-900 rounded-lg">
            {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-slate-900/60 border-b border-gray-200 dark:border-slate-700 text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="py-3.5 px-5">Campaign Name</th>
                <th className="py-3.5 px-4">Template</th>
                <th className="py-3.5 px-4">Funnel & Engagement</th>
                <th className="py-3.5 px-4">Sales ROI</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-gray-400">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading broadcast campaigns...
                  </td>
                </tr>
              ) : filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                      <Radio size={28} />
                    </div>
                    <div className="font-extrabold text-sm text-gray-800 dark:text-gray-200">No broadcast campaigns found</div>
                    <div className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                      Launch your first marketing or utility campaign to connect with customers directly on WhatsApp.
                    </div>
                    <button
                      onClick={openNewBroadcastWizard}
                      className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                    >
                      + Launch First Broadcast
                    </button>
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((c) => {
                  const isCompleted = c.status === "COMPLETED";
                  const isProcessing = c.status === "PROCESSING" || c.status === "RUNNING";
                  const isScheduledStatus = c.status === "SCHEDULED";

                  const sent = c.sentCount || 0;
                  const delivered = c.deliveredCount || 0;
                  const read = c.readCount || 0;
                  const clicks = c.clicksCount || 0;
                  const revenue = c.revenueGenerated || 0;

                  const delPct = sent > 0 ? Math.round((delivered / sent) * 100) : 0;
                  const readPct = sent > 0 ? Math.round((read / sent) * 100) : 0;
                  const clickPct = sent > 0 ? Math.round((clicks / sent) * 100) : 0;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-indigo-50/30 dark:hover:bg-slate-700/30 transition-colors group"
                    >
                      {/* 1. Campaign Name */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-xs">
                          <Radio size={14} className="text-indigo-600 flex-shrink-0" />
                          <span className="truncate max-w-[200px]">{c.name}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
                          ID: {c.id.slice(0, 8)}...
                        </div>
                      </td>

                      {/* 2. Template */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[11px] font-bold font-mono">
                          <FileCode size={12} /> {c.templateId}
                        </span>
                      </td>

                      {/* 3. Funnel & Engagement */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 text-[11px] flex-wrap">
                            <span className="font-black text-gray-900 dark:text-white">
                              {c.totalAudience?.toLocaleString() || sent || 0} <span className="text-[10px] text-gray-400 font-normal">recipients</span>
                            </span>
                            {sent > 0 && (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                                {delPct}% Del. ({delivered}/{sent})
                              </span>
                            )}
                            {sent > 0 && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${read > 0 ? "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/40" : "text-gray-400 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700"}`}>
                                {readPct}% Read 👁️ ({read}/{sent})
                              </span>
                            )}
                            {clicks > 0 && (
                              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800/40">
                                {clickPct}% Clicks 👆 ({clicks})
                              </span>
                            )}
                          </div>

                          {/* Mini visual progress bar */}
                          {sent > 0 && (
                            <div className="w-44 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                              <div style={{ width: `${delPct}%` }} className="bg-emerald-500 h-full" title={`Delivered: ${delPct}% (${delivered}/${sent})`} />
                              <div style={{ width: `${readPct}%` }} className="bg-cyan-500 h-full" title={`Read: ${readPct}% (${read}/${sent})`} />
                              <div style={{ width: `${clickPct}%` }} className="bg-purple-500 h-full" title={`Clicked: ${clickPct}% (${clicks}/${sent})`} />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 4. Sales ROI */}
                      <td className="py-3.5 px-4">
                        {revenue > 0 ? (
                          <div className="inline-flex flex-col">
                            <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">
                              ₹{revenue.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">
                              {c.ordersGenerated || 1} order{(c.ordersGenerated || 1) !== 1 ? "s" : ""}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 font-mono">
                            Cost: ₹{((c.sentCount || c.totalAudience || 0) * 0.72).toFixed(1)}
                          </span>
                        )}
                      </td>

                      {/* 5. Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                            isCompleted
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800"
                              : isProcessing
                              ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-800"
                              : isScheduledStatus
                              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-800"
                              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-800"
                          }`}
                        >
                          {isProcessing ? (
                            <RefreshCw size={11} className="animate-spin" />
                          ) : isCompleted ? (
                            <CheckCircle2 size={11} />
                          ) : isScheduledStatus ? (
                            <Clock size={11} />
                          ) : (
                            <AlertCircle size={11} />
                          )}
                          {c.status}
                        </span>
                      </td>

                      {/* 6. Date */}
                      <td className="py-3.5 px-4 text-[11px] text-gray-600 dark:text-gray-300 font-semibold">
                        {c.scheduledAt
                          ? new Date(c.scheduledAt).toLocaleString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })
                          : new Date(c.createdAt).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })}
                      </td>

                      {/* 7. Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAnalytics(c)}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs active:scale-95"
                            title="View Broadcast Performance, Click Rate & ROI"
                          >
                            <BarChart2 size={13} />
                            <span>Analytics</span>
                          </button>

                          <button
                            onClick={() => handleDeleteCampaign(c.id, c.name)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                            title="Delete Campaign"
                          >
                            <Trash2 size={14} />
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

      {/* ========================================================================= */}
      {/* 4-STEP BROADCAST CREATION WIZARD MODAL */}
      {/* ========================================================================= */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden my-6 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between bg-gray-50/70 dark:bg-slate-900/70">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <Radio size={16} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white text-base tracking-tight">
                    Launch WhatsApp Broadcast Campaign
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Step {currentStep} of 4:{" "}
                    {currentStep === 1
                      ? "Select Meta Template"
                      : currentStep === 2
                      ? "Target Audience Segments & Tags"
                      : currentStep === 3
                      ? "Map Dynamic Variables & Media"
                      : "Review & Dispatch"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWizard(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Step Progress Indicators */}
            <div className="grid grid-cols-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50">
              {[
                { step: 1, label: "1. Template" },
                { step: 2, label: "2. Audience & Tags" },
                { step: 3, label: "3. Variables & Media" },
                { step: 4, label: "4. Review & Schedule" }
              ].map((s) => (
                <button
                  key={s.step}
                  onClick={() => setCurrentStep(s.step)}
                  className={`py-3 text-xs font-black text-center transition border-b-2 flex items-center justify-center gap-1.5 ${
                    currentStep === s.step
                      ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800"
                      : currentStep > s.step
                      ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                      : "border-transparent text-gray-400"
                  }`}
                >
                  <span>{s.label}</span>
                </button>
              ))}
            </div>

            {/* Wizard Body (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* ----------------------------------------------------------------- */}
              {/* STEP 1: SELECT TEMPLATE */}
              {/* ----------------------------------------------------------------- */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">
                        Campaign Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        placeholder="e.g. VIP Festive Flash Sale"
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                          Select Meta Template
                        </label>
                        <span className="text-[11px] text-gray-400 font-bold">
                          {filteredTemplates.length} templates
                        </span>
                      </div>

                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={templateSearch}
                          onChange={(e) => setTemplateSearch(e.target.value)}
                          placeholder="Search templates..."
                          className="flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
                        {filteredTemplates.length === 0 ? (
                          <div className="text-xs text-gray-400 italic p-4 text-center bg-gray-50 dark:bg-slate-900 rounded-xl">
                            No templates found. Create one in the Templates tab first.
                          </div>
                        ) : (
                          filteredTemplates.map((t) => {
                            const isSelected = selectedTemplate?.id === t.id || selectedTemplate?.name === t.name;
                            return (
                              <button
                                key={t.id || t.name}
                                type="button"
                                onClick={() => setSelectedTemplate(t)}
                                className={`p-3 rounded-2xl text-left transition border flex items-center justify-between ${
                                  isSelected
                                    ? "bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-600 shadow-sm ring-1 ring-indigo-500"
                                    : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-indigo-300"
                                }`}
                              >
                                <div>
                                  <div className="font-extrabold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                                    <FileCode size={13} className="text-indigo-600" />
                                    <span>{t.name}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-gray-500 uppercase font-mono">
                                      {t.category || "MARKETING"}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-1 font-normal">
                                    {t.bodyText}
                                  </div>
                                </div>
                                {isSelected && <Check size={16} className="text-indigo-600 stroke-[3] shrink-0 ml-2" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Live WhatsApp Mockup Preview */}
                  <div className="bg-slate-100 dark:bg-slate-900/80 rounded-3xl p-4 border border-gray-200 dark:border-slate-700 flex flex-col items-center justify-center">
                    <span className="text-[11px] font-black text-gray-500 uppercase mb-3 flex items-center gap-1.5">
                      <Phone size={13} className="text-emerald-500" /> WhatsApp Live Mockup
                    </span>

                    <div className="w-full max-w-[280px] bg-[#EFEAE2] dark:bg-[#121b22] rounded-3xl p-3.5 shadow-xl border border-gray-300 dark:border-slate-700">
                      <div className="bg-white dark:bg-[#1f2c34] rounded-2xl p-3 shadow-md text-xs text-gray-800 dark:text-gray-200 relative">
                        {/* Header preview */}
                        {selectedTemplate?.headerType && selectedTemplate.headerType !== "NONE" && (
                          selectedTemplate.headerType.toUpperCase() === "TEXT" ? (
                            <div className="font-bold text-xs text-gray-900 dark:text-white mb-1.5 pb-1 border-b border-gray-100 dark:border-slate-700 leading-snug">
                              {selectedTemplate.headerContent || selectedTemplate.headerText || selectedTemplate.name}
                            </div>
                          ) : (
                            <div className="mb-2.5 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                              {headerMediaUrl && selectedTemplate.headerType.toUpperCase() === "IMAGE" ? (
                                <img
                                  src={headerMediaUrl}
                                  alt="Header"
                                  className="w-full h-28 object-cover"
                                  onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                                />
                              ) : (
                                <div className="p-3 text-center flex flex-col items-center justify-center gap-1 text-gray-500 dark:text-gray-400">
                                  {selectedTemplate.headerType.toUpperCase() === "IMAGE" && <ImageIcon size={18} className="text-indigo-500" />}
                                  {selectedTemplate.headerType.toUpperCase() === "VIDEO" && <VideoIcon size={18} className="text-indigo-500" />}
                                  {selectedTemplate.headerType.toUpperCase() === "DOCUMENT" && <FileText size={18} className="text-indigo-500" />}
                                  <span className="text-[10px] font-bold uppercase tracking-wider">
                                    {selectedTemplate.headerType} Header {headerMediaUrl ? "Attached" : ""}
                                  </span>
                                </div>
                              )}
                            </div>
                          )
                        )}

                        <div className="whitespace-pre-wrap leading-relaxed font-sans">{getRenderedPreviewBody()}</div>

                        {selectedTemplate?.footerText && (
                          <div className="text-[10px] text-gray-400 mt-2 border-t border-gray-100 dark:border-slate-700 pt-1">
                            {selectedTemplate.footerText}
                          </div>
                        )}

                        <div className="text-[9px] text-gray-400 text-right mt-1 font-mono">12:30 PM ✓✓</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* STEP 2: SELECT AUDIENCE & TAGS */}
              {/* ----------------------------------------------------------------- */}
              {currentStep === 2 && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">
                      Choose Broadcast Audience Segment
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { type: "ALL", label: "All Contacts", icon: <Users size={16} />, desc: "Blast to complete CRM address book" },
                        { type: "TAGS", label: "Filter by Tags 🏷️", icon: <Tag size={16} />, desc: "Target specific VIPs, buyers, leads" },
                        { type: "CUSTOM", label: "Paste Numbers / CSV", icon: <UploadCloud size={16} />, desc: "Direct phone number list" }
                      ].map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => setAudienceType(item.type as any)}
                          className={`p-3.5 rounded-2xl border text-left transition flex flex-col gap-1 ${
                            audienceType === item.type
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/30"
                              : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-indigo-400"
                          }`}
                        >
                          <div className="flex items-center gap-2 font-black text-xs">
                            {item.icon}
                            <span>{item.label}</span>
                          </div>
                          <span className={`text-[10px] ${audienceType === item.type ? "text-indigo-100" : "text-gray-400"}`}>
                            {item.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Professional Tag Multi-Select Mode */}
                  {audienceType === "TAGS" && (
                    <div className="p-4 bg-gray-50/90 dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Tag size={15} className="text-indigo-600" />
                          <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                            Select Target Contact Tags
                          </span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full">
                            {selectedTags.length} selected
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {tagSegments.length > 0 && (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedTags(tagSegments.map((t) => t.tagName))}
                                className="text-[11px] font-bold text-indigo-600 hover:underline"
                              >
                                Select All
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                type="button"
                                onClick={() => setSelectedTags([])}
                                className="text-[11px] font-bold text-gray-500 hover:underline"
                              >
                                Clear
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Tag Search Bar */}
                      {tagSegments.length > 5 && (
                        <div className="relative">
                          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={tagSearchQuery}
                            onChange={(e) => setTagSearchQuery(e.target.value)}
                            placeholder="Filter tags..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none"
                          />
                        </div>
                      )}

                      {/* Tag Pills Grid */}
                      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                        {filteredTagSegments.length === 0 ? (
                          <span className="text-xs text-gray-400 italic p-2">
                            {tagSegments.length === 0 ? "No tags created yet on contacts." : "No tags match your search."}
                          </span>
                        ) : (
                          filteredTagSegments.map((t) => {
                            const isSelected = selectedTags.includes(t.tagName);
                            return (
                              <button
                                key={t.tagName}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedTags(selectedTags.filter((tag) => tag !== t.tagName));
                                  } else {
                                    setSelectedTags([...selectedTags, t.tagName]);
                                  }
                                }}
                                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                                  isSelected
                                    ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-600 shadow-sm"
                                    : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/40"
                                }`}
                              >
                                <span>{t.label}</span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                                    isSelected
                                      ? "bg-indigo-800/80 text-white"
                                      : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400"
                                  }`}
                                >
                                  {t.count}
                                </span>
                                {isSelected && <Check size={12} className="stroke-[3]" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Custom Number Paste Mode */}
                  {audienceType === "CUSTOM" && (
                    <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">
                        Paste Mobile Numbers (Comma or Newline Separated):
                      </label>
                      <textarea
                        rows={3}
                        value={customPhonesInput}
                        onChange={(e) => setCustomPhonesInput(e.target.value)}
                        placeholder="919876543210&#10;918888877777&#10;919999900000"
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                      />
                    </div>
                  )}

                  {/* Audience Reach Calculation Banner */}
                  <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                        Estimated Audience Reach
                      </div>
                      <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {filteredAudienceContacts.length.toLocaleString()} Contacts
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold px-3 py-1 bg-white dark:bg-slate-800 rounded-xl shadow-2xs border border-emerald-200 dark:border-emerald-800/40 inline-block">
                        ₹{(filteredAudienceContacts.length * 0.72).toFixed(2)} Est. Cost
                      </span>
                    </div>
                  </div>

                  {/* Filtered Customer List Preview Table */}
                  <div className="border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                    <div className="px-4 py-2.5 bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-indigo-600" />
                        <span className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                          Target Recipient Preview
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full font-mono">
                          {filteredAudienceContacts.length} contacts
                        </span>
                      </div>
                      {filteredAudienceContacts.length > 5 && (
                        <div className="relative w-48">
                          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={previewSearchQuery}
                            onChange={(e) => setPreviewSearchQuery(e.target.value)}
                            placeholder="Search in preview..."
                            className="w-full pl-7 pr-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {filteredAudienceContacts.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-xs">
                        {audienceType === "TAGS" && selectedTags.length === 0
                          ? "Select at least one tag above to view matching contacts."
                          : "No contacts match the selected audience filter."}
                      </div>
                    ) : (
                      <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800 text-xs">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-gray-50/90 dark:bg-slate-800/90 text-[10px] font-black text-gray-500 uppercase sticky top-0 backdrop-blur-sm z-10 border-b border-gray-100 dark:border-slate-800">
                            <tr>
                              <th className="py-2.5 px-4">Customer</th>
                              <th className="py-2.5 px-4">Phone / WhatsApp</th>
                              <th className="py-2.5 px-4">City</th>
                              <th className="py-2.5 px-4">Tags</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 font-medium">
                            {visiblePreviewContacts.map((contact, idx) => (
                              <tr key={contact.id || idx} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/50 transition">
                                <td className="py-2 px-4 font-bold text-gray-900 dark:text-gray-100">
                                  {contact.contactPerson || contact.businessName || "Customer"}
                                  {contact.businessName && contact.contactPerson && contact.businessName !== contact.contactPerson && (
                                    <span className="block text-[10px] font-normal text-gray-400">
                                      {contact.businessName}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-4 font-mono text-gray-600 dark:text-gray-300">
                                  {contact.mobile || contact.whatsappNumber || "-"}
                                </td>
                                <td className="py-2 px-4 text-gray-500 dark:text-gray-400">
                                  {contact.city || "-"}
                                </td>
                                <td className="py-2 px-4">
                                  <div className="flex flex-wrap gap-1 max-w-[220px]">
                                    {contact.tags ? (
                                      contact.tags
                                        .split(",")
                                        .slice(0, 3)
                                        .map((t: string, ti: number) => (
                                          <span
                                            key={ti}
                                            className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-md text-[10px] font-bold"
                                          >
                                            {t.trim()}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-gray-400 text-[10px]">-</span>
                                      )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {searchedPreviewContacts.length > 60 && (
                          <div className="p-2 text-center text-[11px] text-gray-500 bg-gray-50/60 dark:bg-slate-800/40 border-t border-gray-100 dark:border-slate-800 font-medium">
                            Showing first 60 of {searchedPreviewContacts.length} matching recipients
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* STEP 3: MAP VARIABLES & MEDIA */}
              {/* ----------------------------------------------------------------- */}
              {currentStep === 3 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wide mb-1">
                      Dynamic Personalization Variables
                    </h4>
                    <p className="text-xs text-gray-500">
                      Map message parameters to recipient fields (e.g. Customer Name, City, or Custom Promo Code).
                    </p>
                  </div>

                  {variableMappings.length === 0 ? (
                    <div className="p-5 bg-gray-50 dark:bg-slate-900 rounded-2xl text-center text-xs text-gray-500">
                      ✨ This template has no dynamic variables (static text broadcast).
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {variableMappings.map((vm, idx) => (
                        <div
                          key={vm.varIndex}
                          className="p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center gap-3"
                        >
                          <div className="w-24 font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            <Sparkles size={13} /> {`{{${vm.varIndex}}}`}
                          </div>

                          <select
                            value={vm.mappedTo}
                            onChange={(e) => {
                              const updated = [...variableMappings];
                              updated[idx].mappedTo = e.target.value;
                              setVariableMappings(updated);
                            }}
                            className="px-3 py-2 text-xs font-bold bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none cursor-pointer"
                          >
                            <option value="contactPerson">👤 Contact / Customer Name</option>
                            <option value="city">📍 City</option>
                            <option value="static">✍️ Static Custom Value / Code</option>
                          </select>

                          {vm.mappedTo === "static" && (
                            <input
                              type="text"
                              value={vm.staticValue}
                              onChange={(e) => {
                                const updated = [...variableMappings];
                                updated[idx].staticValue = e.target.value;
                                setVariableMappings(updated);
                              }}
                              placeholder="e.g. FLAT20 / Sale Link"
                              className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none font-semibold"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Optional Media Header URL */}
                  {selectedTemplate?.headerType &&
                    ["IMAGE", "VIDEO", "DOCUMENT"].includes(selectedTemplate.headerType.toUpperCase()) && (
                      <div className="p-4.5 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-800/40 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-indigo-950 dark:text-indigo-200 uppercase flex items-center gap-2">
                            {selectedTemplate.headerType.toUpperCase() === "IMAGE" && <ImageIcon size={15} className="text-indigo-600" />}
                            {selectedTemplate.headerType.toUpperCase() === "VIDEO" && <VideoIcon size={15} className="text-indigo-600" />}
                            {selectedTemplate.headerType.toUpperCase() === "DOCUMENT" && <FileText size={15} className="text-indigo-600" />}
                            Header Media Attachment ({selectedTemplate.headerType.toUpperCase()})
                          </label>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-md">
                            {selectedTemplate.headerType.toUpperCase() === "IMAGE" ? "JPG / PNG" : selectedTemplate.headerType.toUpperCase() === "VIDEO" ? "MP4" : "PDF"}
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 items-center">
                          <input
                            type="url"
                            value={headerMediaUrl}
                            onChange={(e) => setHeaderMediaUrl(e.target.value)}
                            placeholder={
                              selectedTemplate.headerType.toUpperCase() === "IMAGE"
                                ? "https://yourdomain.com/banners/festive-offer.jpg"
                                : selectedTemplate.headerType.toUpperCase() === "VIDEO"
                                ? "https://yourdomain.com/promo.mp4"
                                : "https://yourdomain.com/catalog.pdf"
                            }
                            className="flex-1 w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700/60 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          {headerMediaUrl && selectedTemplate.headerType.toUpperCase() === "IMAGE" && (
                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-indigo-200 dark:border-indigo-700 shrink-0 bg-white shadow-xs">
                              <img src={headerMediaUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>

                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Direct public HTTPS URL to be dispatched with each message.
                        </p>
                      </div>
                    )}
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* STEP 4: REVIEW & SCHEDULE */}
              {/* ----------------------------------------------------------------- */}
              {currentStep === 4 && (
                <div className="flex flex-col gap-4">
                  {/* Campaign Summary Recap */}
                  <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-800/40 flex flex-col gap-3">
                    <div className="text-xs font-black text-indigo-950 dark:text-indigo-300 uppercase">
                      Campaign Summary Recap
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500 block text-[11px]">Campaign Name:</span>
                        <span className="font-extrabold text-gray-900 dark:text-white truncate block">{campaignName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[11px]">Meta Template:</span>
                        <span className="font-bold font-mono text-indigo-600 truncate block">{selectedTemplate?.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[11px]">Audience Reach:</span>
                        <span className="font-extrabold text-emerald-600">{filteredAudienceContacts.length} Contacts</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[11px]">Est. Meta Cost:</span>
                        <span className="font-extrabold text-gray-900 dark:text-white">
                          ₹{(filteredAudienceContacts.length * 0.72).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dispatch Timing & Calendar Section */}
                  <div className="p-4 sm:p-5 bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xs flex flex-col gap-4">
                    <div>
                      <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
                        <Clock size={15} className="text-indigo-600" />
                        Dispatch Timing & Delivery Schedule
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Choose whether to blast this campaign immediately or schedule for automated queue dispatch.
                      </p>
                    </div>

                    {/* Mode Switch Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsScheduled(false);
                          setScheduledAt("");
                        }}
                        className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                          !isScheduled
                            ? "bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-600 shadow-2xs text-indigo-950 dark:text-white ring-1 ring-indigo-500"
                            : "bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${!isScheduled ? "bg-indigo-600 text-white" : "bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300"}`}>
                            ⚡
                          </div>
                          <div>
                            <div className="text-xs font-black">Send Immediately</div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">Instant dispatch to WhatsApp queue</div>
                          </div>
                        </div>
                        {!isScheduled && <Check size={16} className="text-indigo-600 stroke-[3]" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsScheduled(true);
                          if (!scheduledAt) {
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            tomorrow.setHours(10, 0, 0, 0);
                            const localIso = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
                              .toISOString()
                              .slice(0, 16);
                            setScheduledAt(localIso);
                          }
                        }}
                        className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                          isScheduled
                            ? "bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-600 shadow-2xs text-indigo-950 dark:text-white ring-1 ring-indigo-500"
                            : "bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${isScheduled ? "bg-indigo-600 text-white" : "bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300"}`}>
                            📅
                          </div>
                          <div>
                            <div className="text-xs font-black">Schedule for Later</div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">Automated timed queue dispatch</div>
                          </div>
                        </div>
                        {isScheduled && <Check size={16} className="text-indigo-600 stroke-[3]" />}
                      </button>
                    </div>

                    {/* Schedule Picker & Quick Presets */}
                    {isScheduled && (
                      <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 flex flex-col gap-3.5">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5">
                            Quick Schedule Presets:
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              {
                                label: "Today 6:00 PM",
                                getDate: () => {
                                  const d = new Date();
                                  d.setHours(18, 0, 0, 0);
                                  if (d.getTime() < Date.now()) d.setHours(d.getHours() + 2);
                                  return d;
                                }
                              },
                              {
                                label: "Tomorrow 10:00 AM",
                                getDate: () => {
                                  const d = new Date();
                                  d.setDate(d.getDate() + 1);
                                  d.setHours(10, 0, 0, 0);
                                  return d;
                                }
                              },
                              {
                                label: "Tomorrow 3:00 PM",
                                getDate: () => {
                                  const d = new Date();
                                  d.setDate(d.getDate() + 1);
                                  d.setHours(15, 0, 0, 0);
                                  return d;
                                }
                              },
                              {
                                label: "In 2 Days 11:00 AM",
                                getDate: () => {
                                  const d = new Date();
                                  d.setDate(d.getDate() + 2);
                                  d.setHours(11, 0, 0, 0);
                                  return d;
                                }
                              }
                            ].map((preset, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => {
                                  const d = preset.getDate();
                                  const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                                    .toISOString()
                                    .slice(0, 16);
                                  setScheduledAt(localIso);
                                }}
                                className="px-2.5 py-2 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-gray-200 dark:border-slate-700 hover:border-indigo-400 rounded-xl text-[11px] font-bold text-gray-700 dark:text-gray-300 transition text-center"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Interactive Styled DateTime Picker */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                              Custom Date & Time:
                            </label>
                            <input
                              type="datetime-local"
                              value={scheduledAt}
                              min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                              onChange={(e) => setScheduledAt(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
                            />
                          </div>

                          <div className="p-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                            <div>
                              <span className="font-bold text-gray-700 dark:text-gray-300">Timezone:</span> India Standard Time (IST / UTC+5:30)
                            </div>
                          </div>
                        </div>

                        {scheduledAt && (
                          <div className="p-3 bg-indigo-50/90 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800/40 flex items-center gap-2.5">
                            <CalendarDays size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <div className="text-xs">
                              <span className="text-indigo-950 dark:text-indigo-200">Broadcast will dispatch on: </span>
                              <strong className="text-indigo-700 dark:text-indigo-400 font-black block sm:inline">
                                {new Date(scheduledAt).toLocaleString("en-IN", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true
                                })} (IST)
                              </strong>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Wizard Navigation Footer */}
            <div className="p-5 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between bg-gray-50/70 dark:bg-slate-900/70">
              <button
                type="button"
                onClick={() => {
                  if (currentStep > 1) setCurrentStep(currentStep - 1);
                  else setShowWizard(false);
                }}
                className="px-4 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-200 transition"
              >
                {currentStep === 1 ? "Cancel" : "Back"}
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
                >
                  <span>Next Step</span>
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLaunchBroadcast}
                  disabled={launching}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-lg transition flex items-center gap-2 active:scale-95"
                >
                  {launching ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : isScheduled ? (
                    <Calendar size={14} />
                  ) : (
                    <Send size={14} />
                  )}
                  <span>
                    {launching
                      ? "Launching Queue..."
                      : isScheduled
                      ? "📅 Confirm & Schedule Broadcast"
                      : "🚀 Launch WhatsApp Broadcast Now"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMPREHENSIVE SALES & ENGAGEMENT CAMPAIGN ANALYTICS MODAL */}
      {/* ========================================================================= */}
      {selectedCampaignForAnalytics && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden my-6 flex flex-col max-h-[88vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between bg-gray-50/70 dark:bg-slate-900/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
                  <BarChart2 size={18} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white text-base flex items-center gap-2">
                    <span>{selectedCampaignForAnalytics.name}</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-md">
                      {selectedCampaignForAnalytics.templateId}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Live Performance, Blue Ticks, CTA Click Rates & Sales Conversion Funnel
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenAnalytics(selectedCampaignForAnalytics)}
                  disabled={loadingAnalytics}
                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition"
                  title="Refresh Analytics"
                >
                  <RefreshCw size={15} className={loadingAnalytics ? "animate-spin text-indigo-600" : ""} />
                </button>
                <button
                  onClick={() => setSelectedCampaignForAnalytics(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              {loadingAnalytics ? (
                <div className="py-16 text-center text-gray-400">
                  <RefreshCw size={28} className="animate-spin mx-auto mb-2 text-indigo-500" />
                  <div className="font-bold text-xs">Computing real-time campaign performance & sales ROI...</div>
                </div>
              ) : analyticsData?.stats ? (
                <>
                  {/* HERO SALES & ROI DASHBOARD */}
                  <div className="p-5 bg-gradient-to-br from-indigo-900/10 via-purple-900/5 to-slate-900/10 dark:from-indigo-950/60 dark:to-purple-950/40 rounded-3xl border border-indigo-200/80 dark:border-indigo-800/40 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-emerald-500" />
                        <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                          Sales ROI & Revenue Attribution
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-700">
                        {analyticsData.stats.roas !== "0.0" ? `${analyticsData.stats.roas}x ROAS` : "Live Tracking"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-gray-200/80 dark:border-slate-700 shadow-2xs">
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Revenue Generated</div>
                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                          ₹{analyticsData.stats.revenue?.toLocaleString() || 0}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Direct customer orders</div>
                      </div>

                      <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-gray-200/80 dark:border-slate-700 shadow-2xs">
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Orders Placed</div>
                        <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                          {analyticsData.stats.orders || 0}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Conv. Rate: {analyticsData.stats.conversionRate}%</div>
                      </div>

                      <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-gray-200/80 dark:border-slate-700 shadow-2xs">
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Avg Order Value (AOV)</div>
                        <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">
                          ₹{analyticsData.stats.aov?.toLocaleString() || 0}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Per converted order</div>
                      </div>

                      <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-gray-200/80 dark:border-slate-700 shadow-2xs">
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Meta Campaign Cost</div>
                        <div className="text-xl font-black text-gray-800 dark:text-gray-200 mt-1">
                          ₹{analyticsData.stats.cost?.toFixed(2) || "0.00"}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">₹0.72 / delivered message</div>
                      </div>
                    </div>
                  </div>

                  {/* ENGAGEMENT & FUNNEL METRICS GRID */}
                  <div>
                    <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Zap size={14} className="text-indigo-600" />
                      Message Delivery & Interactive Click Funnel
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                      {/* Target */}
                      <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 text-center">
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Target Audience</div>
                        <div className="text-lg font-black text-gray-900 dark:text-white mt-1">
                          {analyticsData.stats.total}
                        </div>
                        <span className="text-[9px] text-gray-400 font-bold">100% Target</span>
                      </div>

                      {/* Sent */}
                      <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800/40 text-center">
                        <div className="text-[10px] font-bold text-blue-600 uppercase">Dispatched</div>
                        <div className="text-lg font-black text-blue-600 mt-1">
                          {analyticsData.stats.sent}
                        </div>
                        <span className="text-[9px] text-blue-500 font-bold">
                          {analyticsData.stats.total > 0 ? Math.round((analyticsData.stats.sent / analyticsData.stats.total) * 100) : 0}% Sent
                        </span>
                      </div>

                      {/* Delivered */}
                      <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 text-center">
                        <div className="text-[10px] font-bold text-emerald-600 uppercase">Delivered</div>
                        <div className="text-lg font-black text-emerald-600 mt-1">
                          {analyticsData.stats.delivered}
                        </div>
                        <span className="text-[9px] text-emerald-600 font-bold">
                          {analyticsData.stats.deliveryRate}% Delivery
                        </span>
                      </div>

                      {/* Read Rate */}
                      <div className="p-3 bg-cyan-50/70 dark:bg-cyan-950/30 rounded-2xl border border-cyan-200 dark:border-cyan-800/40 text-center">
                        <div className="text-[10px] font-bold text-cyan-600 uppercase">Read 👁️</div>
                        <div className="text-lg font-black text-cyan-600 mt-1">
                          {analyticsData.stats.read}
                        </div>
                        <span className="text-[9px] text-cyan-600 font-bold">
                          {analyticsData.stats.readRate}% Read Rate
                        </span>
                      </div>

                      {/* Button Clicks */}
                      <div className="p-3 bg-purple-50/70 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800/40 text-center ring-2 ring-purple-500/20">
                        <div className="text-[10px] font-bold text-purple-600 uppercase">CTA Clicks 👆</div>
                        <div className="text-lg font-black text-purple-600 mt-1">
                          {analyticsData.stats.clicks}
                        </div>
                        <span className="text-[9px] text-purple-600 font-bold">
                          {analyticsData.stats.clickRate}% CTR
                        </span>
                      </div>

                      {/* Inbound Replies */}
                      <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/40 text-center">
                        <div className="text-[10px] font-bold text-amber-600 uppercase">Replies 💬</div>
                        <div className="text-lg font-black text-amber-600 mt-1">
                          {analyticsData.stats.replied}
                        </div>
                        <span className="text-[9px] text-amber-600 font-bold">
                          {analyticsData.stats.replyRate}% Reply Rate
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* VISUAL CONVERSION FUNNEL BAR */}
                  <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-700 dark:text-gray-300">Conversion Funnel Visualizer</span>
                      <span className="text-gray-400 font-mono text-[11px]">
                        Sent ({analyticsData.stats.sent}) ➔ Read ({analyticsData.stats.read}) ➔ Clicked ({analyticsData.stats.clicks}) ➔ Orders ({analyticsData.stats.orders})
                      </span>
                    </div>

                    <div className="w-full h-3 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      <div style={{ width: `${analyticsData.stats.deliveryRate}%` }} className="bg-emerald-500 h-full" title="Delivered" />
                      <div style={{ width: `${analyticsData.stats.readRate}%` }} className="bg-cyan-500 h-full" title="Read (Blue Ticks)" />
                      <div style={{ width: `${analyticsData.stats.clickRate}%` }} className="bg-purple-500 h-full" title="Button Clicked" />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold mt-1">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Delivered ({analyticsData.stats.deliveryRate}%)</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500"></span> Read Ticks ({analyticsData.stats.readRate}%)</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Button Clicks ({analyticsData.stats.clickRate}%)</span>
                    </div>
                  </div>

                  {/* RECIPIENT ACTIVITY LOG & SEARCH */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Users size={14} className="text-indigo-600" />
                        Recipient Activity Stream ({filteredRecipients.length} entries)
                      </h4>

                      <div className="relative w-full sm:w-56">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={recipientSearchQuery}
                          onChange={(e) => setRecipientSearchQuery(e.target.value)}
                          placeholder="Search recipient, button, text..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none"
                        />
                      </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2">
                      {[
                        { id: "ALL", label: "All Logs" },
                        { id: "CLICKED", label: `Clicked 👆 (${analyticsData.stats.clicks})` },
                        { id: "READ", label: `Read 👁️ (${analyticsData.stats.read})` },
                        { id: "REPLIED", label: `Replied 💬 (${analyticsData.stats.replied})` },
                        { id: "DELIVERED", label: `Delivered 📥 (${analyticsData.stats.delivered})` },
                        { id: "FAILED", label: `Failed ⚠️ (${analyticsData.stats.failed})` }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setAnalyticsTab(tab.id as any)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                            analyticsTab === tab.id
                              ? "bg-indigo-600 text-white shadow-2xs"
                              : "bg-gray-100 dark:bg-slate-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Recipient Table */}
                    <div className="bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden max-h-[260px] overflow-y-auto shadow-2xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 bg-gray-100 dark:bg-slate-800 text-[10px] font-black text-gray-500 uppercase border-b border-gray-200 dark:border-slate-700 backdrop-blur-sm z-10">
                          <tr>
                            <th className="p-3">Recipient</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Action / Button Click</th>
                            <th className="p-3">Engagement Log</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800 font-medium">
                          {filteredRecipients.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-6 text-center text-gray-400 text-xs">
                                No recipients match the selected filter.
                              </td>
                            </tr>
                          ) : (
                            filteredRecipients.map((r: any) => {
                              const isClicked = r.status === "CLICKED" || r.clickedAt || r.buttonClicked;
                              const isReplied = r.status === "REPLIED" || r.repliedAt || r.replyText;
                              const isRead = r.status === "READ" || r.readAt;
                              const isDelivered = r.status === "DELIVERED" || r.deliveredAt;
                              const isFailed = r.status === "FAILED";

                              return (
                                <tr key={r.id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/50 transition">
                                  <td className="p-3">
                                    <div className="font-bold text-gray-900 dark:text-white">
                                      {r.customerName || "Customer"}
                                    </div>
                                    <div className="font-mono text-[11px] text-gray-500">
                                      +{r.toPhone}
                                    </div>
                                  </td>

                                  <td className="p-3">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                                        isClicked
                                          ? "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                                          : isReplied
                                          ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                                          : isRead
                                          ? "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800"
                                          : isDelivered
                                          ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                          : isFailed
                                          ? "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800"
                                          : "bg-gray-100 text-gray-800 border-gray-300"
                                      }`}
                                    >
                                      {isClicked ? "CLICKED 👆" : isReplied ? "REPLIED 💬" : isRead ? "READ 👁️" : isDelivered ? "DELIVERED 📥" : isFailed ? "FAILED ❌" : r.status}
                                    </span>
                                  </td>

                                  <td className="p-3">
                                    {r.buttonClicked ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-md font-mono text-[10px] font-bold">
                                        <MousePointerClick size={11} /> {r.buttonClicked}
                                      </span>
                                    ) : r.replyText ? (
                                      <span className="text-[11px] text-gray-700 dark:text-gray-300 italic line-clamp-1">
                                        "{r.replyText}"
                                      </span>
                                    ) : r.errorMsg ? (
                                      <span className="text-[10px] text-red-500 font-semibold">
                                        {r.errorMsg}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 text-[10px]">-</span>
                                    )}
                                  </td>

                                  <td className="p-3 text-[10px] text-gray-500 font-mono">
                                    {r.clickedAt ? (
                                      <span className="text-purple-600 font-bold">
                                        Clicked: {new Date(r.clickedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    ) : r.readAt ? (
                                      <span className="text-cyan-600 font-bold">
                                        Read: {new Date(r.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    ) : r.deliveredAt ? (
                                      <span className="text-emerald-600">
                                        Delivered: {new Date(r.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    ) : (
                                      <span>Sent</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
