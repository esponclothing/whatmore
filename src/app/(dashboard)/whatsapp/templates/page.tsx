"use client";

import React, { useState, useEffect } from "react";
import {
  FileCode, Plus, Search, RefreshCw, CheckCircle2, Clock, AlertCircle,
  X, Send, Trash2, Eye, Info, Plus as PlusIcon
} from "lucide-react";
import { getWhatsAppTemplates, saveWhatsAppTemplateAction, deleteWhatsAppTemplateAction, sendWhatsAppTemplateAction } from "@/app/actions/whatsAppPlatformActions";

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

export default function WhatsAppTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Create Template State
  const [templateName, setTemplateName] = useState("");
  const [category, setCategory] = useState("MARKETING");
  const [language, setLanguage] = useState("en");
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

  useEffect(() => { fetchTemplates(); }, []);

  // Meta name validation: only lowercase, digits, underscores, max 512 chars
  const validateName = (name: string) => {
    if (!name) return "Template name is required.";
    if (!/^[a-z0-9_]+$/.test(name)) return "Name must be lowercase letters, numbers, and underscores only. No spaces or special chars.";
    if (name.length > META_LIMITS.NAME_MAX) return `Name too long (max ${META_LIMITS.NAME_MAX} chars).`;
    return "";
  };

  const handleNameChange = (val: string) => {
    // Auto-sanitize: lowercase, replace spaces with underscore, remove invalid chars
    const sanitized = val.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    setTemplateName(sanitized);
    setNameError(validateName(sanitized));
  };

  const addButton = (type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER") => {
    const quickReplies = buttons.filter(b => b.type === "QUICK_REPLY").length;
    const ctaButtons = buttons.filter(b => b.type !== "QUICK_REPLY").length;
    if (buttons.length >= META_LIMITS.TOTAL_BUTTONS_MAX) { showToast("Max 3 buttons allowed.", "error"); return; }
    if (type === "QUICK_REPLY" && quickReplies >= META_LIMITS.MAX_QUICK_REPLIES) { showToast("Max 3 Quick Reply buttons.", "error"); return; }
    if (type !== "QUICK_REPLY" && ctaButtons >= META_LIMITS.MAX_CTA_BUTTONS) { showToast("Max 2 CTA buttons.", "error"); return; }
    // Cannot mix quick replies and CTA
    const hasQR = buttons.some(b => b.type === "QUICK_REPLY");
    const hasCTA = buttons.some(b => b.type !== "QUICK_REPLY");
    if (type === "QUICK_REPLY" && hasCTA) { showToast("Cannot mix Quick Reply and CTA buttons.", "error"); return; }
    if (type !== "QUICK_REPLY" && hasQR) { showToast("Cannot mix Quick Reply and CTA buttons.", "error"); return; }
    setButtons(prev => [...prev, { type, text: "", url: "", phone_number: "" }]);
  };

  const updateButton = (idx: number, field: string, val: string) => {
    setButtons(prev => prev.map((b, i) => i === idx ? { ...b, [field]: val } : b));
  };

  const removeButton = (idx: number) => setButtons(prev => prev.filter((_, i) => i !== idx));

  const insertVariable = () => {
    const nextVar = (bodyText.match(/\{\{(\d+)\}\}/g)?.length || 0) + 1;
    setBodyText(prev => prev + `{{${nextVar}}}`);
  };

  const resetForm = () => {
    setTemplateName(""); setCategory("MARKETING"); setLanguage("en");
    setHeaderType("NONE"); setHeaderContent(""); setBodyText(""); setFooterText("");
    setButtons([]); setNameError("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateName(templateName);
    if (err) { setNameError(err); return; }
    if (!bodyText.trim()) { showToast("Body text is required.", "error"); return; }
    if (bodyText.length > META_LIMITS.BODY_MAX) { showToast(`Body too long (max ${META_LIMITS.BODY_MAX} chars).`, "error"); return; }
    if (headerContent.length > META_LIMITS.HEADER_MAX) { showToast(`Header too long (max ${META_LIMITS.HEADER_MAX} chars).`, "error"); return; }
    if (footerText.length > META_LIMITS.FOOTER_MAX) { showToast(`Footer too long (max ${META_LIMITS.FOOTER_MAX} chars).`, "error"); return; }
    const invalidBtn = buttons.find(b => !b.text || b.text.length > META_LIMITS.BUTTON_TEXT_MAX);
    if (invalidBtn) { showToast(`Button text required and max ${META_LIMITS.BUTTON_TEXT_MAX} chars.`, "error"); return; }

    setSaving(true);
    const res = await saveWhatsAppTemplateAction({ name: templateName, category, language, headerType, headerContent, bodyText, footerText, buttons, variables: [] });
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
    if (res.success) { showToast("Template deleted."); fetchTemplates(); }
    else showToast(res.error || "Delete failed.", "error");
  };

  const handleTest = async (t: any) => {
    if (!testPhone) { showToast("Enter a test phone number first.", "error"); return; }
    setTestingTemplate(t.name);
    const res = await sendWhatsAppTemplateAction(testPhone, t.name, t.language || "en", []);
    setTestingTemplate(null);
    if (res.success) showToast("Test template sent successfully!");
    else showToast(res.error || "Send failed.", "error");
  };

  const filtered = templates.filter(t => {
    if (categoryFilter !== "ALL" && t.category !== categoryFilter) return false;
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    if (searchQuery && !t.name?.toLowerCase().includes(searchQuery.toLowerCase()) && !t.bodyText?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const statusBadge = (status: string) => {
    const cfg: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
      APPROVED: { bg: "rgba(16,185,129,0.1)", color: "#10b981", icon: <CheckCircle2 size={12}/> },
      PENDING: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", icon: <Clock size={12}/> },
      REJECTED: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", icon: <AlertCircle size={12}/> },
    };
    const c = cfg[status] || cfg.PENDING;
    return <span style={{ display:"inline-flex", alignItems:"center", gap:"4px", padding:"3px 8px", background:c.bg, color:c.color, borderRadius:"6px", fontSize:"11px", fontWeight:700 }}>{c.icon} {status}</span>;
  };

  return (
    <div className="p-8 w-full max-w-none flex flex-col gap-6">
      {/* Toast */}
      {toastMsg && (
        <div style={{ position:"fixed", top:"20px", right:"20px", zIndex:9999, padding:"12px 18px", borderRadius:"10px", background: toastMsg.type === "error" ? "#ef4444" : "#10b981", color:"white", fontWeight:700, fontSize:"13px", boxShadow:"0 8px 24px rgba(0,0,0,0.15)", display:"flex", alignItems:"center", gap:"8px", maxWidth:"400px" }}>
          {toastMsg.type === "error" ? <AlertCircle size={16}/> : <CheckCircle2 size={16}/>} {toastMsg.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-1">📄 WhatsApp Templates</h1>
          <p className="text-gray-500 text-sm">Create and manage Meta-approved message templates for campaigns, broadcasts, and customer outreach.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input 
            value={testPhone} 
            onChange={e => setTestPhone(e.target.value)} 
            placeholder="Test phone (91XXXXXXXXXX)" 
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
          />
          <button 
            onClick={fetchTemplates} 
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync from Meta
          </button>
          <button 
            onClick={() => { resetForm(); setShowCreateModal(true); }} 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"
          >
            <Plus size={16}/> New Template
          </button>
        </div>
      </div>

      {/* Meta Compliance Info */}
      <div style={{ background:"rgba(59,130,246,0.06)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:"12px", padding:"12px 16px", marginBottom:"20px", display:"flex", alignItems:"flex-start", gap:"10px" }}>
        <Info size={16} style={{ color:"#3b82f6", marginTop:"1px", flexShrink:0 }}/>
        <div style={{ fontSize:"12px", color:"#3b5a8a" }}>
          <strong>Meta Template Rules:</strong> Names must be lowercase with underscores only · Body max 1024 chars · Header max 60 chars · Footer max 60 chars · Max 3 buttons total · Cannot mix Quick Reply and CTA buttons · Templates go to <strong>PENDING</strong> review before becoming <strong>APPROVED</strong>.
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:"10px", marginBottom:"20px", flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ position:"relative" }}>
          <Search size={14} style={{ position:"absolute", left:"10px", top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }}/>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search templates..." style={{ padding:"8px 12px 8px 30px", border:"1px solid #e2e8f0", borderRadius:"8px", fontSize:"13px", width:"220px" }}/>
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding:"8px 12px", border:"1px solid #e2e8f0", borderRadius:"8px", fontSize:"13px" }}>
          <option value="ALL">All Categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding:"8px 12px", border:"1px solid #e2e8f0", borderRadius:"8px", fontSize:"13px" }}>
          <option value="ALL">All Statuses</option>
          <option value="APPROVED">✅ Approved</option>
          <option value="PENDING">⏳ Pending</option>
          <option value="REJECTED">❌ Rejected</option>
        </select>
        <span style={{ fontSize:"12px", color:"#6b7280", marginLeft:"auto" }}>{filtered.length} template{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Template Cards Grid */}
      {loading ? (
        <div style={{ textAlign:"center", padding:"60px", color:"#9ca3af" }}><RefreshCw size={24} style={{ animation:"spin 1s linear infinite", marginBottom:"12px" }}/><br/>Loading templates from Meta...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"80px 20px", color:"#9ca3af" }}>
          <FileCode size={40} style={{ marginBottom:"16px", opacity:0.4 }}/>
          <h3 style={{ fontWeight:700, marginBottom:"8px", color:"#374151" }}>No templates found</h3>
          <p style={{ fontSize:"14px" }}>Create your first WhatsApp template to get started.</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ marginTop:"16px" }}>+ Create Template</button>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(340px, 1fr))", gap:"16px" }}>
          {filtered.map(t => (
            <div key={t.id || t.name} style={{ background:"white", border:"1px solid #e5e7eb", borderRadius:"16px", padding:"20px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)", display:"flex", flexDirection:"column", gap:"12px" }}>
              {/* Template Header */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:"14px", color:"#111827", marginBottom:"4px" }}>{t.name}</div>
                  <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                    {statusBadge(t.status)}
                    <span style={{ fontSize:"11px", color:"#6b7280", background:"#f3f4f6", padding:"2px 8px", borderRadius:"6px", fontWeight:600 }}>{t.category}</span>
                    <span style={{ fontSize:"11px", color:"#6b7280", background:"#f3f4f6", padding:"2px 8px", borderRadius:"6px" }}>{t.language || "en"}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(t.name)} disabled={deleting === t.name} style={{ background:"rgba(239,68,68,0.08)", border:"none", borderRadius:"8px", padding:"6px", cursor:"pointer", color:"#ef4444" }} title="Delete Template">
                  {deleting === t.name ? <RefreshCw size={14} style={{ animation:"spin 1s linear infinite" }}/> : <Trash2 size={14}/>}
                </button>
              </div>

              {/* Preview Bubble */}
              <div style={{ background:"#e2ffc7", borderRadius:"10px 10px 3px 10px", padding:"10px 12px", fontSize:"12px", lineHeight:1.6, color:"#1c1c1e" }}>
                {t.headerContent && <div style={{ fontWeight:800, marginBottom:"4px", fontSize:"13px" }}>{t.headerContent}</div>}
                <div style={{ whiteSpace:"pre-wrap" }}>{t.bodyText?.slice(0, 200)}{t.bodyText?.length > 200 ? "..." : ""}</div>
                {t.footerText && <div style={{ color:"#8696a0", fontSize:"11px", marginTop:"4px" }}>{t.footerText}</div>}
              </div>

              {/* Buttons Preview */}
              {t.buttons && t.buttons !== "[]" && (() => {
                try {
                  const btns = JSON.parse(t.buttons);
                  if (btns.length > 0) return (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                      {btns.map((b: any, i: number) => (
                        <span key={i} style={{ padding:"4px 10px", background:"rgba(79,70,229,0.08)", color:"#4f46e5", borderRadius:"6px", fontSize:"11px", fontWeight:600, border:"1px solid rgba(79,70,229,0.2)" }}>
                          {b.type === "URL" ? "🔗 " : b.type === "PHONE_NUMBER" ? "📞 " : "↩ "}{b.text}
                        </span>
                      ))}
                    </div>
                  );
                } catch {}
                return null;
              })()}

              {/* Test Send */}
              {t.status === "APPROVED" && (
                <button onClick={() => handleTest(t)} disabled={testingTemplate === t.name} style={{ width:"100%", padding:"8px", background:"linear-gradient(135deg, #4f46e5, #7c3aed)", color:"white", border:"none", borderRadius:"8px", fontSize:"12px", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
                  {testingTemplate === t.name ? <RefreshCw size={13} style={{ animation:"spin 1s linear infinite" }}/> : <Send size={13}/>}
                  {testingTemplate === t.name ? "Sending..." : "Send Test"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(4px)", zIndex:9998, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
          <div style={{ background:"white", borderRadius:"20px", width:"100%", maxWidth:"780px", maxHeight:"92vh", display:"flex", flexDirection:"column", boxShadow:"0 30px 70px rgba(0,0,0,0.25)", overflow:"hidden" }}>
            {/* Modal Header */}
            <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid #f3f4f6", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <h2 style={{ fontWeight:900, fontSize:"18px", color:"#111827", margin:0 }}>📄 Create WhatsApp Template</h2>
                <p style={{ fontSize:"13px", color:"#6b7280", margin:"4px 0 0" }}>Submitted directly to Meta for review. Status will be PENDING until approved.</p>
              </div>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} style={{ background:"#f3f4f6", border:"none", borderRadius:"10px", padding:"8px", cursor:"pointer" }}><X size={18} color="#6b7280"/></button>
            </div>

            <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
              {/* Left: Form */}
              <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
                <form onSubmit={handleCreate} style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
                  {/* Name */}
                  <div>
                    <label style={{ display:"block", fontSize:"12px", fontWeight:700, color:"#374151", marginBottom:"6px" }}>
                      TEMPLATE NAME <span style={{ color:"#ef4444" }}>*</span>
                      <span style={{ fontWeight:400, color:"#9ca3af", marginLeft:"6px" }}>lowercase + underscores only</span>
                    </label>
                    <input value={templateName} onChange={e => handleNameChange(e.target.value)} required placeholder="e.g. festive_offer_2026" style={{ width:"100%", padding:"10px 12px", border:`1px solid ${nameError ? "#ef4444" : "#d1d5db"}`, borderRadius:"10px", fontSize:"14px", outline:"none", boxSizing:"border-box" }}/>
                    {nameError && <p style={{ color:"#ef4444", fontSize:"12px", margin:"4px 0 0" }}>{nameError}</p>}
                  </div>

                  {/* Category + Language */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                    <div>
                      <label style={{ display:"block", fontSize:"12px", fontWeight:700, color:"#374151", marginBottom:"6px" }}>CATEGORY <span style={{ color:"#ef4444" }}>*</span></label>
                      <select value={category} onChange={e => setCategory(e.target.value)} style={{ width:"100%", padding:"10px 12px", border:"1px solid #d1d5db", borderRadius:"10px", fontSize:"14px", outline:"none" }}>
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display:"block", fontSize:"12px", fontWeight:700, color:"#374151", marginBottom:"6px" }}>LANGUAGE <span style={{ color:"#ef4444" }}>*</span></label>
                      <select value={language} onChange={e => setLanguage(e.target.value)} style={{ width:"100%", padding:"10px 12px", border:"1px solid #d1d5db", borderRadius:"10px", fontSize:"14px", outline:"none" }}>
                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Header */}
                  <div>
                    <label style={{ display:"block", fontSize:"12px", fontWeight:700, color:"#374151", marginBottom:"6px" }}>HEADER (optional)</label>
                    <div style={{ display:"flex", gap:"8px", marginBottom:"8px" }}>
                      {["NONE","TEXT","IMAGE","VIDEO","DOCUMENT"].map(ht => (
                        <button key={ht} type="button" onClick={() => setHeaderType(ht)} style={{ padding:"5px 10px", borderRadius:"8px", fontSize:"11px", fontWeight:700, border:"none", cursor:"pointer", background: headerType===ht ? "#4f46e5" : "#f3f4f6", color: headerType===ht ? "white" : "#374151" }}>{ht}</button>
                      ))}
                    </div>
                    {headerType === "TEXT" && (
                      <div>
                        <input value={headerContent} onChange={e => setHeaderContent(e.target.value)} placeholder="Header text (max 60 chars)" maxLength={60} style={{ width:"100%", padding:"10px 12px", border:"1px solid #d1d5db", borderRadius:"10px", fontSize:"14px", outline:"none", boxSizing:"border-box" }}/>
                        <p style={{ fontSize:"11px", color: headerContent.length > 55 ? "#ef4444" : "#9ca3af", margin:"4px 0 0", textAlign:"right" }}>{headerContent.length}/{META_LIMITS.HEADER_MAX}</p>
                      </div>
                    )}
                    {["IMAGE","VIDEO","DOCUMENT"].includes(headerType) && (
                      <div style={{ padding:"10px 14px", background:"#f3f4f6", borderRadius:"10px", fontSize:"12px", color:"#6b7280" }}>
                        📎 {headerType} header — upload will be handled when sending. Meta requires the media handle to be passed at send time.
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
                      <label style={{ fontSize:"12px", fontWeight:700, color:"#374151" }}>BODY TEXT <span style={{ color:"#ef4444" }}>*</span></label>
                      <button type="button" onClick={insertVariable} style={{ padding:"4px 10px", background:"rgba(79,70,229,0.08)", border:"1px solid rgba(79,70,229,0.2)", borderRadius:"6px", fontSize:"11px", fontWeight:700, color:"#4f46e5", cursor:"pointer" }}>
                        + Insert Variable {{n}}
                      </button>
                    </div>
                    <textarea value={bodyText} onChange={e => setBodyText(e.target.value)} required rows={5} maxLength={META_LIMITS.BODY_MAX} placeholder="Hi {{1}}, your order {{2}} has been shipped! Track it here: {{3}}" style={{ width:"100%", padding:"10px 12px", border:`1px solid ${bodyText.length > 900 ? "#f59e0b" : "#d1d5db"}`, borderRadius:"10px", fontSize:"14px", outline:"none", resize:"vertical", boxSizing:"border-box", lineHeight:1.6 }}/>
                    <p style={{ fontSize:"11px", color: bodyText.length > 900 ? "#f59e0b" : "#9ca3af", margin:"4px 0 0", textAlign:"right" }}>{bodyText.length}/{META_LIMITS.BODY_MAX}</p>
                  </div>

                  {/* Footer */}
                  <div>
                    <label style={{ display:"block", fontSize:"12px", fontWeight:700, color:"#374151", marginBottom:"6px" }}>FOOTER (optional, max 60 chars)</label>
                    <input value={footerText} onChange={e => setFooterText(e.target.value)} placeholder="e.g. Espon Sports | Unsubscribe reply STOP" maxLength={60} style={{ width:"100%", padding:"10px 12px", border:"1px solid #d1d5db", borderRadius:"10px", fontSize:"14px", outline:"none", boxSizing:"border-box" }}/>
                  </div>

                  {/* Buttons */}
                  <div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                      <label style={{ fontSize:"12px", fontWeight:700, color:"#374151" }}>BUTTONS (max 3 total)</label>
                      <div style={{ display:"flex", gap:"6px" }}>
                        <button type="button" onClick={() => addButton("QUICK_REPLY")} style={{ padding:"5px 10px", background:"rgba(79,70,229,0.08)", border:"1px solid rgba(79,70,229,0.2)", borderRadius:"6px", fontSize:"11px", fontWeight:700, color:"#4f46e5", cursor:"pointer" }}>+ Quick Reply</button>
                        <button type="button" onClick={() => addButton("URL")} style={{ padding:"5px 10px", background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:"6px", fontSize:"11px", fontWeight:700, color:"#10b981", cursor:"pointer" }}>+ URL Button</button>
                        <button type="button" onClick={() => addButton("PHONE_NUMBER")} style={{ padding:"5px 10px", background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:"6px", fontSize:"11px", fontWeight:700, color:"#f59e0b", cursor:"pointer" }}>+ Phone</button>
                      </div>
                    </div>
                    {buttons.map((btn, idx) => (
                      <div key={idx} style={{ display:"flex", gap:"8px", marginBottom:"8px", alignItems:"flex-start" }}>
                        <span style={{ padding:"6px 8px", background: btn.type==="QUICK_REPLY" ? "rgba(79,70,229,0.1)" : btn.type==="URL" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", borderRadius:"6px", fontSize:"11px", fontWeight:700, color: btn.type==="QUICK_REPLY" ? "#4f46e5" : btn.type==="URL" ? "#10b981" : "#f59e0b", whiteSpace:"nowrap" }}>
                          {btn.type === "QUICK_REPLY" ? "↩ QR" : btn.type === "URL" ? "🔗 URL" : "📞 Tel"}
                        </span>
                        <input value={btn.text} onChange={e => updateButton(idx, "text", e.target.value)} placeholder="Button label (max 25 chars)" maxLength={25} style={{ flex:1, padding:"8px 10px", border:"1px solid #d1d5db", borderRadius:"8px", fontSize:"13px", outline:"none" }}/>
                        {btn.type === "URL" && <input value={btn.url} onChange={e => updateButton(idx, "url", e.target.value)} placeholder="https://yourstore.com/..." style={{ flex:2, padding:"8px 10px", border:"1px solid #d1d5db", borderRadius:"8px", fontSize:"13px", outline:"none" }}/>}
                        {btn.type === "PHONE_NUMBER" && <input value={btn.phone_number} onChange={e => updateButton(idx, "phone_number", e.target.value)} placeholder="+919876543210" style={{ flex:1, padding:"8px 10px", border:"1px solid #d1d5db", borderRadius:"8px", fontSize:"13px", outline:"none" }}/>}
                        <button type="button" onClick={() => removeButton(idx)} style={{ padding:"8px", background:"rgba(239,68,68,0.08)", border:"none", borderRadius:"8px", cursor:"pointer", color:"#ef4444" }}><X size={14}/></button>
                      </div>
                    ))}
                  </div>

                  <button type="submit" disabled={saving || !!nameError} style={{ width:"100%", padding:"13px", background: saving ? "#9ca3af" : "linear-gradient(135deg, #4f46e5, #7c3aed)", color:"white", border:"none", borderRadius:"12px", fontWeight:800, fontSize:"15px", cursor: saving ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
                    {saving ? <><RefreshCw size={16} style={{ animation:"spin 1s linear infinite" }}/> Submitting to Meta...</> : "Submit Template →"}
                  </button>
                </form>
              </div>

              {/* Right: Live Preview */}
              <div style={{ width:"280px", borderLeft:"1px solid #f3f4f6", padding:"20px", background:"#f8fafc", overflowY:"auto", flexShrink:0 }}>
                <div style={{ fontSize:"11px", fontWeight:700, color:"#6b7280", marginBottom:"12px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Live Preview</div>
                <div style={{ background:"#e5ddd5", borderRadius:"12px", padding:"12px", minHeight:"200px" }}>
                  <div style={{ background:"white", borderRadius:"8px 8px 2px 8px", padding:"10px 12px", boxShadow:"0 1px 2px rgba(0,0,0,0.1)", maxWidth:"90%" }}>
                    {headerContent && <div style={{ fontWeight:800, fontSize:"13px", marginBottom:"4px", color:"#111" }}>{headerContent}</div>}
                    {!bodyText && <div style={{ color:"#9ca3af", fontSize:"12px", fontStyle:"italic" }}>Start typing body text...</div>}
                    <div style={{ fontSize:"12px", lineHeight:1.6, whiteSpace:"pre-wrap", color:"#1c1c1e" }}>{bodyText}</div>
                    {footerText && <div style={{ fontSize:"10px", color:"#8696a0", marginTop:"6px" }}>{footerText}</div>}
                    <div style={{ fontSize:"10px", color:"#8696a0", textAlign:"right", marginTop:"4px" }}>11:42 AM ✓✓</div>
                  </div>
                  {buttons.length > 0 && (
                    <div style={{ marginTop:"6px", display:"flex", flexDirection:"column", gap:"4px" }}>
                      {buttons.map((b, i) => (
                        <div key={i} style={{ background:"white", borderRadius:"6px", padding:"8px", textAlign:"center", fontSize:"12px", fontWeight:700, color:"#0a8dff", boxShadow:"0 1px 2px rgba(0,0,0,0.1)" }}>
                          {b.text || "Button Label"}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ marginTop:"16px", fontSize:"11px", color:"#6b7280", lineHeight:1.6 }}>
                  <strong>Meta Approval:</strong><br/>
                  Templates go PENDING after submission. Usually approved within minutes to 24 hours.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
