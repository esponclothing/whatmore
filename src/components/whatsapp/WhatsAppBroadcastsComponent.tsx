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
  FileText
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
    const defaultName = `Broadcast Campaign - ${new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" })} ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
    setCampaignName(defaultName);
    setAudienceType("ALL");
    setSelectedTags([]);
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
    return searchedPreviewContacts.slice(0, 50);
  }, [searchedPreviewContacts]);

  // Estimated audience counter helper
  const getEstimatedAudienceCount = () => {
    return filteredAudienceContacts.length;
  };

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.templateId && c.templateId.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (statusFilter === "ALL") return true;
    return c.status === statusFilter;
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
  const avgDeliveryRate = totalDispatched > 0 ? Math.round((totalDelivered / totalDispatched) * 100) : 0;
  const avgReadRate = totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0;

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
          {toastMsg.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {toastMsg.text}
        </div>
      )}

      {/* Top Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Radio size={22} className="text-indigo-600 animate-pulse" />
            WhatsApp Broadcast Campaigns
          </h2>
          <p className="text-gray-500 text-sm">
            Launch Meta-approved message campaigns, target segmented audiences by tags or leads, and track real-time delivery & read rates.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={fetchCampaignsAndTemplates}
            disabled={loading}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition flex items-center gap-2 shadow-sm"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync
          </button>
          <button
            onClick={openNewBroadcastWizard}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} /> Create Broadcast
          </button>
        </div>
      </div>

      {/* Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Campaigns</div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{campaigns.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Radio size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Total Messages Sent
            </div>
            <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
              {totalDispatched.toLocaleString()}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Send size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Avg. Delivery Rate
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {avgDeliveryRate}%
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
              Read Rate (Blue Ticks)
            </div>
            <div className="text-2xl font-extrabold text-cyan-600 dark:text-cyan-400 mt-1">{avgReadRate}%</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Eye size={24} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaigns by name or template..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">✅ Completed</option>
            <option value="PROCESSING">⏳ Processing / Running</option>
            <option value="SCHEDULED">📅 Scheduled</option>
            <option value="FAILED">❌ Failed</option>
          </select>

          <span className="text-xs text-gray-500 font-medium ml-2">
            {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="py-3.5 px-5">Campaign Name</th>
                <th className="py-3.5 px-5">Template</th>
                <th className="py-3.5 px-5">Audience & Reach</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Dispatch Date</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading broadcast campaigns...
                  </td>
                </tr>
              ) : filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    <Radio size={40} className="mx-auto mb-3 opacity-30 text-indigo-400" />
                    <div className="font-bold text-gray-700 dark:text-gray-300">No broadcast campaigns found</div>
                    <div className="text-xs mt-1">Create your first broadcast to reach your audience directly on WhatsApp.</div>
                    <button
                      onClick={openNewBroadcastWizard}
                      className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm"
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

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-slate-700/30 transition-colors group"
                    >
                      {/* 1. Campaign Name */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Radio size={14} className="text-indigo-600 flex-shrink-0" />
                          <span>{c.name}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          ID: <span className="font-mono">{c.id.slice(0, 8)}...</span>
                        </div>
                      </td>

                      {/* 2. Template */}
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-md text-xs font-bold font-mono">
                          <FileCode size={12} /> {c.templateId}
                        </span>
                      </td>

                      {/* 3. Audience & Reach */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-gray-900 dark:text-white text-sm">
                            {c.totalAudience?.toLocaleString() || 0}
                          </span>
                          <span className="text-xs text-gray-400">recipients</span>
                        </div>
                        {c.sentCount > 0 && (
                          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                            ✓ {c.sentCount} sent ({c.deliveredCount} delivered)
                          </div>
                        )}
                      </td>

                      {/* 4. Status Badge */}
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold border ${
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

                      {/* 5. Date */}
                      <td className="py-3.5 px-5 text-xs text-gray-600 dark:text-gray-300 font-semibold">
                        {c.scheduledAt
                          ? new Date(c.scheduledAt).toLocaleString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })
                          : new Date(c.createdAt).toLocaleDateString("en-IN")}
                      </td>

                      {/* 6. Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenAnalytics(c)}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                            title="View Broadcast Performance & Analytics"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden my-6 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between bg-gray-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                  <Radio size={20} className="text-indigo-600" />
                  Launch WhatsApp Broadcast Campaign
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Step {currentStep} of 4:{" "}
                  {currentStep === 1
                    ? "Select Meta Template"
                    : currentStep === 2
                    ? "Target Audience Segments"
                    : currentStep === 3
                    ? "Map Dynamic Variables"
                    : "Review & Dispatch"}
                </p>
              </div>
              <button
                onClick={() => setShowWizard(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Step Progress Indicators */}
            <div className="grid grid-cols-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
              {[
                { step: 1, label: "1. Template" },
                { step: 2, label: "2. Audience" },
                { step: 3, label: "3. Variables" },
                { step: 4, label: "4. Review" }
              ].map((s) => (
                <button
                  key={s.step}
                  onClick={() => setCurrentStep(s.step)}
                  className={`py-2.5 text-xs font-bold text-center transition border-b-2 ${
                    currentStep === s.step
                      ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800"
                      : currentStep > s.step
                      ? "border-emerald-500 text-emerald-600"
                      : "border-transparent text-gray-400"
                  }`}
                >
                  {s.label}
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
                        placeholder="e.g. Festive Sale Broadcast"
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">
                        Select Meta Template
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={templateSearch}
                          onChange={(e) => setTemplateSearch(e.target.value)}
                          placeholder="Search templates..."
                          className="flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
                        {filteredTemplates.length === 0 ? (
                          <div className="text-xs text-gray-400 italic p-3 text-center">
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
                                className={`p-3 rounded-xl text-left transition border flex items-center justify-between ${
                                  isSelected
                                    ? "bg-indigo-50/80 dark:bg-indigo-900/30 border-indigo-600 shadow-sm"
                                    : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-indigo-300"
                                }`}
                              >
                                <div>
                                  <div className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                                    <FileCode size={13} className="text-indigo-600" />
                                    <span>{t.name}</span>
                                  </div>
                                  <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                                    {t.bodyText}
                                  </div>
                                </div>
                                {isSelected && <Check size={16} className="text-indigo-600 stroke-[3]" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Live WhatsApp Preview Box */}
                  <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-200 dark:border-slate-700 flex flex-col items-center">
                    <span className="text-[11px] font-bold text-gray-500 uppercase mb-3 flex items-center gap-1">
                      <Phone size={12} /> WhatsApp Live Mockup Preview
                    </span>

                    <div className="w-full max-w-[280px] bg-[#EFEAE2] dark:bg-[#121b22] rounded-2xl p-3 shadow-md border border-gray-300 dark:border-slate-700">
                      <div className="bg-white dark:bg-[#1f2c34] rounded-xl p-3 shadow-sm text-xs text-gray-800 dark:text-gray-200 relative">
                        {/* Header preview if any */}
                        {selectedTemplate?.headerType && selectedTemplate.headerType !== "NONE" && (
                          <div className="mb-2 p-2 bg-gray-100 dark:bg-slate-800 rounded-lg text-center text-[10px] text-gray-500 font-bold uppercase">
                            🖼️ {selectedTemplate.headerType} Header
                          </div>
                        )}

                        <div className="whitespace-pre-wrap leading-relaxed">{getRenderedPreviewBody()}</div>

                        {selectedTemplate?.footerText && (
                          <div className="text-[10px] text-gray-400 mt-2 border-t border-gray-100 dark:border-slate-700 pt-1">
                            {selectedTemplate.footerText}
                          </div>
                        )}

                        <div className="text-[9px] text-gray-400 text-right mt-1">12:30 PM ✓✓</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* STEP 2: SELECT AUDIENCE */}
              {/* ----------------------------------------------------------------- */}
              {currentStep === 2 && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">
                      Choose Broadcast Audience Segment
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { type: "ALL", label: "All Contacts", icon: <Users size={16} /> },
                        { type: "TAGS", label: "Filter by Tags 🏷️", icon: <Tag size={16} /> },
                        { type: "CUSTOM", label: "Paste Numbers / CSV", icon: <UploadCloud size={16} /> }
                      ].map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => setAudienceType(item.type as any)}
                          className={`p-3.5 rounded-xl border text-left flex items-center gap-2.5 transition font-bold text-xs ${
                            audienceType === item.type
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                              : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-indigo-400"
                          }`}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tag Multi-Select Mode */}
                  {audienceType === "TAGS" && (
                    <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
                      <div className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">
                        Select Target Contact Tags:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tagSegments.length === 0 ? (
                          <span className="text-xs text-gray-400 italic">No tags created yet on contacts.</span>
                        ) : (
                          tagSegments.map((t) => {
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
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                                  isSelected
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                    : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-indigo-300"
                                }`}
                              >
                                <span>{t.label}</span>
                                <span className="text-[10px] opacity-75 font-mono">({t.count})</span>
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
                    <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
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
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-800/30 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                        Estimated Audience Reach
                      </div>
                      <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {filteredAudienceContacts.length.toLocaleString()} Contacts
                      </div>
                    </div>
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold px-3 py-1 bg-white dark:bg-slate-800 rounded-lg shadow-2xs border border-emerald-100 dark:border-emerald-900/40">
                      100% Opt-in Direct Delivery
                    </span>
                  </div>

                  {/* Filtered Customer List Preview */}
                  <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                    <div className="px-3.5 py-2.5 bg-gray-50/90 dark:bg-slate-800/90 border-b border-gray-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                          Target Customers Preview
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full font-mono">
                          {filteredAudienceContacts.length} contacts
                        </span>
                      </div>
                      {filteredAudienceContacts.length > 5 && (
                        <div className="relative w-44 sm:w-52">
                          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={previewSearchQuery}
                            onChange={(e) => setPreviewSearchQuery(e.target.value)}
                            placeholder="Filter in preview..."
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
                      <div className="max-h-52 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800 text-xs">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-gray-50/80 dark:bg-slate-800/80 text-[10px] font-bold text-gray-500 uppercase sticky top-0 backdrop-blur-sm z-10 border-b border-gray-100 dark:border-slate-800">
                            <tr>
                              <th className="py-2 px-3">Customer Name</th>
                              <th className="py-2 px-3">Mobile / WhatsApp</th>
                              <th className="py-2 px-3">City</th>
                              <th className="py-2 px-3">Tags</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
                            {visiblePreviewContacts.map((contact, idx) => (
                              <tr key={contact.id || idx} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition">
                                <td className="py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">
                                  {contact.contactPerson || contact.businessName || "Customer"}
                                  {contact.businessName && contact.contactPerson && contact.businessName !== contact.contactPerson && (
                                    <span className="block text-[10px] font-normal text-gray-400 font-sans">
                                      {contact.businessName}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 font-mono text-gray-600 dark:text-gray-300">
                                  {contact.mobile || contact.whatsappNumber || "-"}
                                </td>
                                <td className="py-2 px-3 text-gray-500 dark:text-gray-400">
                                  {contact.city || "-"}
                                </td>
                                <td className="py-2 px-3">
                                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                                    {contact.tags ? (
                                      contact.tags
                                        .split(",")
                                        .slice(0, 2)
                                        .map((t: string, ti: number) => (
                                          <span
                                            key={ti}
                                            className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded text-[10px] font-medium"
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
                        {searchedPreviewContacts.length > 50 && (
                          <div className="p-2 text-center text-[11px] text-gray-500 bg-gray-50/50 dark:bg-slate-800/30 border-t border-gray-100 dark:border-slate-800 font-medium">
                            Showing first 50 of {searchedPreviewContacts.length} contacts
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* STEP 3: MAP VARIABLES */}
              {/* ----------------------------------------------------------------- */}
              {currentStep === 3 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                      Dynamic Personalization Variables
                    </h4>
                    <p className="text-xs text-gray-500">
                      Map message parameters to recipient fields (e.g. Customer Name, City, Tag, or Custom Text).
                    </p>
                  </div>

                  {variableMappings.length === 0 ? (
                    <div className="p-5 bg-gray-50 dark:bg-slate-900 rounded-xl text-center text-xs text-gray-500">
                      ✨ This template has no dynamic variables (static text broadcast).
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {variableMappings.map((vm, idx) => (
                        <div
                          key={vm.varIndex}
                          className="p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center gap-3"
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
                            className="px-3 py-2 text-xs font-bold bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg outline-none cursor-pointer"
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
                              className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg outline-none font-semibold"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Optional Media Header URL */}
                  {selectedTemplate?.headerType && selectedTemplate.headerType !== "NONE" && (
                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                      <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-300 uppercase mb-1.5">
                        Header Media URL ({selectedTemplate.headerType}):
                      </label>
                      <input
                        type="url"
                        value={headerMediaUrl}
                        onChange={(e) => setHeaderMediaUrl(e.target.value)}
                        placeholder="https://example.com/banner.jpg"
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded-xl text-xs outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* STEP 4: REVIEW & DISPATCH */}
              {/* ----------------------------------------------------------------- */}
              {currentStep === 4 && (
                <div className="flex flex-col gap-5">
                  <div className="p-5 bg-indigo-50/70 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 flex flex-col gap-3">
                    <div className="text-xs font-bold text-indigo-950 dark:text-indigo-300 uppercase">
                      Campaign Summary Recap
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500 block">Name:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{campaignName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Template:</span>
                        <span className="font-bold font-mono text-indigo-600">{selectedTemplate?.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Audience Reach:</span>
                        <span className="font-bold text-emerald-600">{getEstimatedAudienceCount()} Contacts</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Est. Cost:</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          ₹{(getEstimatedAudienceCount() * 0.72).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Scheduling Toggle */}
                  <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-gray-900 dark:text-white">
                          Schedule Broadcast for Later
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Optionally queue messages to dispatch at a specific date and time.
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isScheduled}
                        onChange={(e) => setIsScheduled(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded cursor-pointer accent-indigo-600"
                      />
                    </div>

                    {isScheduled && (
                      <div className="mt-2">
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                          Select Date & Time (IST):
                        </label>
                        <input
                          type="datetime-local"
                          value={scheduledAt}
                          onChange={(e) => setScheduledAt(e.target.value)}
                          className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Wizard Navigation Footer */}
            <div className="p-5 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between bg-gray-50/50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => {
                  if (currentStep > 1) setCurrentStep(currentStep - 1);
                  else setShowWizard(false);
                }}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl"
              >
                {currentStep === 1 ? "Cancel" : "Back"}
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <span>Next Step</span>
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLaunchBroadcast}
                  disabled={launching}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2"
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
      {/* CAMPAIGN ANALYTICS DRAWER / MODAL */}
      {/* ========================================================================= */}
      {selectedCampaignForAnalytics && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden my-6 flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-base flex items-center gap-2">
                  <BarChart2 size={18} className="text-indigo-600" />
                  Broadcast Analytics: {selectedCampaignForAnalytics.name}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Template: {selectedCampaignForAnalytics.templateId}</p>
              </div>
              <button
                onClick={() => setSelectedCampaignForAnalytics(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-5">
              {loadingAnalytics ? (
                <div className="py-12 text-center text-gray-400">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-500" />
                  Loading real-time campaign performance...
                </div>
              ) : analyticsData?.stats ? (
                <>
                  {/* Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 text-center">
                      <div className="text-[11px] font-bold text-gray-500 uppercase">Target Audience</div>
                      <div className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
                        {analyticsData.stats.total}
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-800/30 text-center">
                      <div className="text-[11px] font-bold text-blue-600 uppercase">Sent</div>
                      <div className="text-xl font-extrabold text-blue-600 mt-1">{analyticsData.stats.sent}</div>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-800/30 text-center">
                      <div className="text-[11px] font-bold text-emerald-600 uppercase">Delivered</div>
                      <div className="text-xl font-extrabold text-emerald-600 mt-1">
                        {analyticsData.stats.delivered}
                      </div>
                    </div>
                    <div className="p-3 bg-cyan-50 dark:bg-cyan-500/10 rounded-xl border border-cyan-200 dark:border-cyan-800/30 text-center">
                      <div className="text-[11px] font-bold text-cyan-600 uppercase">Read Rate</div>
                      <div className="text-xl font-extrabold text-cyan-600 mt-1">
                        {analyticsData.stats.readRate}%
                      </div>
                    </div>
                  </div>

                  {/* Recipient Logs Table */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">
                      Recent Delivery Log ({analyticsData.recentRecipients?.length || 0} entries)
                    </h4>
                    <div className="bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden max-h-[220px] overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-slate-700 text-gray-500 font-bold">
                            <th className="p-2.5">Phone Number</th>
                            <th className="p-2.5">Name</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                          {analyticsData.recentRecipients?.map((r: any) => (
                            <tr key={r.id}>
                              <td className="p-2.5 font-mono font-bold text-gray-800 dark:text-gray-200">
                                +{r.toPhone}
                              </td>
                              <td className="p-2.5 text-gray-600 dark:text-gray-400">{r.customerName || "Customer"}</td>
                              <td className="p-2.5">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                    r.status === "SENT" || r.status === "DELIVERED" || r.status === "READ"
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                                      : r.status === "PENDING"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {r.status}
                                </span>
                              </td>
                            </tr>
                          ))}
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
