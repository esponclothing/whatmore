"use client";

import React, { useState, useEffect } from "react";
import {
  GitBranch, Plus, Search, RefreshCw, CheckCircle2, Clock, AlertCircle,
  X, Send, Trash2, Eye, Info, HelpCircle
} from "lucide-react";
import { getWhatsAppMetaFlows, saveWhatsAppMetaFlowAction, deleteWhatsAppMetaFlowAction, sendWhatsAppFlowMessageAction } from "@/app/actions/whatsAppPlatformActions";

const PREBUILT_TEMPLATES = [
  {
    name: "Jersey Size Finder",
    flowId: "jersey_size_finder_flow",
    description: "Get the perfect jersey fit by answering 3 simple questions.",
    screenName: "SIZE_SCREEN",
    ctaText: "Find Your Size",
    formSchema: JSON.stringify([
      { label: "What is your chest size (in inches)?", type: "select", options: ["36 - Small", "38 - Medium", "40 - Large", "42 - XL", "44 - XXL"] },
      { label: "What is your height (in cm)?", type: "number", placeholder: "e.g. 175" },
      { label: "Preferred Fit Style", type: "radio", options: ["Slim Fit", "Regular Fit", "Loose / Baggy Fit"] }
    ])
  },
  {
    name: "Customer Feedback Survey",
    flowId: "customer_feedback_survey_flow",
    description: "Tell us about your shopping experience with Espon Sports.",
    screenName: "FEEDBACK_SCREEN",
    ctaText: "Share Feedback",
    formSchema: JSON.stringify([
      { label: "Overall Satisfaction Rating", type: "radio", options: ["⭐⭐⭐⭐⭐ Excellent", "⭐⭐⭐⭐ Good", "⭐⭐⭐ Average", "⭐⭐ Fair / Poor"] },
      { label: "Would you recommend Espon to others?", type: "radio", options: ["Definitely Yes", "Maybe", "No"] },
      { label: "What can we improve?", type: "textarea", placeholder: "Any comments or suggestions..." }
    ])
  },
  {
    name: "Custom Booking / Appointment",
    flowId: "custom_booking_flow",
    description: "Book an appointment for a personalized sizing & apparel consultation.",
    screenName: "BOOKING_SCREEN",
    ctaText: "Book Appointment",
    formSchema: JSON.stringify([
      { label: "Preferred Date", type: "date" },
      { label: "Select Service Type", type: "select", options: ["Wholesale Catalog Review", "Bulk Sports Uniform Order", "Sizing Trial Consultation"] },
      { label: "Preferred Time Slot", type: "radio", options: ["Morning (10 AM - 1 PM)", "Afternoon (1 PM - 5 PM)", "Evening (5 PM - 8 PM)"] }
    ])
  }
];

export default function WhatsAppFlowsPage() {
  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [flowId, setFlowId] = useState("");
  const [description, setDescription] = useState("");
  const [screenName, setScreenName] = useState("SCREEN_NAME");
  const [ctaText, setCtaText] = useState("Open Form");
  const [formFields, setFormFields] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Test state
  const [testPhone, setTestPhone] = useState("");
  const [testingFlow, setTestingFlow] = useState<string | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchFlows = async () => {
    setLoading(true);
    const res = await getWhatsAppMetaFlows();
    if (res.success) setFlows(res.flows || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchFlows();
  }, []);

  const selectPrebuiltTemplate = (tpl: typeof PREBUILT_TEMPLATES[0]) => {
    setName(tpl.name);
    setFlowId(tpl.flowId);
    setDescription(tpl.description);
    setScreenName(tpl.screenName);
    setCtaText(tpl.ctaText);
    setFormFields(JSON.parse(tpl.formSchema));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !flowId || !ctaText) {
      showToast("Flow name, ID, and Button CTA text are required.", "error");
      return;
    }

    setSaving(true);
    const res = await saveWhatsAppMetaFlowAction({
      name,
      flowId,
      description,
      screenName,
      ctaText,
      formSchema: JSON.stringify(formFields)
    });
    setSaving(false);

    if (res.success) {
      showToast("Meta Flow registered successfully!", "success");
      setShowCreateModal(false);
      fetchFlows();
      resetForm();
    } else {
      showToast(res.error || "Failed to register Flow.", "error");
    }
  };

  const handleDelete = async (id: string, flowName: string) => {
    if (!confirm(`Are you sure you want to delete Flow "${flowName}"?`)) return;
    setDeleting(id);
    const res = await deleteWhatsAppMetaFlowAction(id);
    setDeleting(null);
    if (res.success) {
      showToast("Flow deleted.");
      fetchFlows();
    } else {
      showToast(res.error || "Delete failed.", "error");
    }
  };

  const handleTestSend = async (flowIdVal: string) => {
    if (!testPhone) {
      showToast("Enter a test phone number first (including country code, e.g., 91XXXXXXXXXX).", "error");
      return;
    }
    setTestingFlow(flowIdVal);
    const res = await sendWhatsAppFlowMessageAction(testPhone, flowIdVal);
    setTestingFlow(null);
    if (res.success) {
      showToast("Test Flow sent successfully!");
    } else {
      showToast(res.error || "Failed to send Flow message.", "error");
    }
  };

  const resetForm = () => {
    setName("");
    setFlowId("");
    setDescription("");
    setScreenName("SCREEN_NAME");
    setCtaText("Open Form");
    setFormFields([]);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 32px", fontFamily: "Inter, sans-serif" }}>
      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          padding: "12px 18px", borderRadius: "10px",
          background: toastMsg.type === "error" ? "#ef4444" : "#10b981",
          color: "white", fontWeight: 700, fontSize: "13px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          display: "flex", alignItems: "center", gap: "8px"
        }}>
          {toastMsg.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {toastMsg.text}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", gap: "20px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            ⚡ Interactive Meta Flows
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", marginTop: "6px", lineHeight: 1.5, maxWidth: "700px" }}>
            Build customized form questionnaires, size calculators, surveys, and bookings that customers open directly inside their WhatsApp screen.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexShrink: 0 }}>
          <input
            value={testPhone}
            onChange={e => setTestPhone(e.target.value)}
            placeholder="Test Phone (91XXXXXXXXXX)"
            style={{ padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "10px", fontSize: "13px", width: "200px", outline: "none", transition: "all 0.2s" }}
          />
          <button onClick={fetchFlows} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", background: "white", border: "1px solid #cbd5e1", borderRadius: "10px", fontSize: "13.5px", fontWeight: 700, color: "#475569", cursor: "pointer", transition: "all 0.2s" }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => { resetForm(); setShowCreateModal(true); }} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", background: "#6d28d9", border: "none", borderRadius: "10px", fontSize: "13.5px", fontWeight: 700, color: "white", cursor: "pointer", boxShadow: "0 4px 12px rgba(109,40,217,0.2)", transition: "all 0.2s" }}>
            <Plus size={16} /> Create Flow
          </button>
        </div>
      </div>

      {/* List of Flows */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#9ca3af" }}>
          <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", marginBottom: "12px" }} /><br />
          Loading Flows...
        </div>
      ) : flows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", color: "#9ca3af" }}>
          <GitBranch size={48} style={{ marginBottom: "16px", opacity: 0.3 }} />
          <h3 style={{ fontWeight: 700, marginBottom: "8px", color: "#374151" }}>No Flows registered yet</h3>
          <p style={{ fontSize: "14px", maxWidth: "420px", margin: "0 auto 16px" }}>Add your Meta Flow configuration to enable in-chat custom surveys, bookings, and size finders.</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">+ Register Flow</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
          {flows.map(f => (
            <div key={f.id} style={{
              background: "white", border: "1px solid #e5e7eb", borderRadius: "16px",
              padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              display: "flex", flexDirection: "column", gap: "12px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: "15px", color: "#111827", margin: 0 }}>{f.name}</h3>
                  <code style={{ fontSize: "11px", color: "#6b7280", background: "#f3f4f6", padding: "2px 6px", borderRadius: "4px", marginTop: "4px", display: "inline-block" }}>ID: {f.flowId}</code>
                </div>
                <button onClick={() => handleDelete(f.id, f.name)} disabled={deleting === f.id} style={{ background: "rgba(239,68,68,0.08)", border: "none", borderRadius: "6px", padding: "6px", cursor: "pointer", color: "#ef4444" }}>
                  {deleting === f.id ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={12} />}
                </button>
              </div>

              <p style={{ fontSize: "12.5px", color: "#4b5563", margin: 0, minHeight: "36px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                {f.description || "No description provided."}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#6b7280" }}>
                <span>CTA: <strong>{f.ctaText}</strong></span>
                <span>•</span>
                <span>Screen: <strong>{f.screenName}</strong></span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button
                  onClick={() => handleTestSend(f.flowId)}
                  disabled={testingFlow === f.flowId}
                  style={{
                    flex: 1, padding: "8px 12px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    color: "white", border: "none", borderRadius: "8px", fontSize: "12px",
                    fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                  }}
                >
                  {testingFlow === f.flowId ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={12} />}
                  Send Test Message
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Flow Modal */}
      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "white", borderRadius: "20px", width: "100%", maxWidth: "800px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>
            
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontWeight: 900, fontSize: "18px", color: "#111827", margin: 0 }}>⚡ Create Interactive WhatsApp Flow</h2>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0" }}>Register a Meta Flow ID or configure one using a pre-built template.</p>
              </div>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} style={{ background: "#f3f4f6", border: "none", borderRadius: "8px", padding: "6px", cursor: "pointer" }}><X size={18} color="#6b7280" /></button>
            </div>

            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
              {/* Left Column: Form config */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                
                {/* Prebuilt Quick selector */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4b5563", marginBottom: "6px", textTransform: "uppercase" }}>Quick Start Templates</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {PREBUILT_TEMPLATES.map(t => (
                      <button
                        key={t.name}
                        type="button"
                        onClick={() => selectPrebuiltTemplate(t)}
                        style={{
                          padding: "6px 10px", borderRadius: "8px", border: "1px solid #e2e8f0",
                          fontSize: "12px", background: "#f8fafc", cursor: "pointer", fontWeight: 600,
                          color: "#374151"
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "#4f46e5"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>FLOW NAME *</label>
                      <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Size Calculator" style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>META FLOW ID *</label>
                      <input value={flowId} onChange={e => setFlowId(e.target.value)} required placeholder="e.g. 9876543210123" style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>BODY DESCRIPTION TEXT (Sent in WhatsApp message)</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Please answer these quick fit questions so we can get your custom sizing perfect." style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>STARTING SCREEN NAME *</label>
                      <input value={screenName} onChange={e => setScreenName(e.target.value)} required placeholder="e.g. SIZE_SCREEN" style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>CTA BUTTON TEXT *</label>
                      <input value={ctaText} onChange={e => setCtaText(e.target.value)} required placeholder="e.g. Open Size Finder" style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                    </div>
                  </div>

                  {/* Visual Fields Builder */}
                  <div style={{ border: "1px solid #e2e8f0", padding: "14px", borderRadius: "12px", background: "#f8fafc", marginTop: "10px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#1e293b", marginBottom: "8px", textTransform: "uppercase" }}>Form Questionnaire Fields</label>
                    
                    {/* Render current fields */}
                    {formFields.length === 0 ? (
                      <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 10px 0" }}>No fields added yet. Add custom fields below or choose a template above.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
                        {formFields.map((f, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "8px 10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>{f.label}</span>
                              <span style={{ fontSize: "10px", color: "#64748b" }}>Type: {f.type} {f.options ? `(${f.options.join(", ")})` : ''}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setFormFields(formFields.filter((_, i) => i !== idx))}
                              style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "2px" }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add new field form row */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px dashed #cbd5e1", paddingTop: "10px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>➕ ADD NEW QUESTION FIELD</span>
                      <input
                        type="text"
                        placeholder="e.g. Enter your jersey size"
                        id="new-field-label"
                        style={{ padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12.5px", outline: "none" }}
                      />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <select
                          id="new-field-type"
                          defaultValue="text"
                          onChange={e => {
                            const optEl = document.getElementById("new-field-options-row");
                            if (optEl) {
                              optEl.style.display = (e.target.value === 'select' || e.target.value === 'radio') ? 'block' : 'none';
                            }
                          }}
                          style={{ padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12.5px" }}
                        >
                          <option value="text">Text Input</option>
                          <option value="number">Number Input</option>
                          <option value="select">Dropdown Select</option>
                          <option value="radio">Radio Options</option>
                          <option value="date">Date Selector</option>
                          <option value="textarea">Multi-line Text</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const labelEl = document.getElementById("new-field-label") as HTMLInputElement;
                            const typeEl = document.getElementById("new-field-type") as HTMLSelectElement;
                            const optionsEl = document.getElementById("new-field-options") as HTMLInputElement;
                            
                            if (labelEl && labelEl.value.trim()) {
                              const newField: any = {
                                label: labelEl.value.trim(),
                                type: typeEl.value
                              };
                              if ((typeEl.value === 'select' || typeEl.value === 'radio') && optionsEl && optionsEl.value.trim()) {
                                newField.options = optionsEl.value.split(",").map(s => s.trim()).filter(Boolean);
                              }
                              setFormFields([...formFields, newField]);
                              labelEl.value = "";
                              if (optionsEl) optionsEl.value = "";
                            } else {
                              alert("Please enter a field label first.");
                            }
                          }}
                          style={{ padding: "6px", background: "#4f46e5", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                        >
                          Add Field
                        </button>
                      </div>
                      <div id="new-field-options-row" style={{ display: "none" }}>
                        <label style={{ display: "block", fontSize: "10.5px", color: "#64748b", marginBottom: "2px" }}>OPTIONS (separated by commas)</label>
                        <input
                          type="text"
                          id="new-field-options"
                          placeholder="e.g. Small, Medium, Large"
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={saving} style={{ width: "100%", padding: "10px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "14px", cursor: "pointer", marginTop: "8px" }}>
                    {saving ? "Registering..." : "⚡ Register Meta Flow Configuration"}
                  </button>
                </form>
              </div>

              {/* Right Column: Visual Mockup Render */}
              <div style={{ width: "300px", borderLeft: "1px solid #f3f4f6", padding: "20px", background: "#f8fafc", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", flexShrink: 0 }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Flow Preview inside Chat</div>
                
                {/* Chat Bubble Message */}
                <div style={{ background: "#e5ddd5", borderRadius: "10px", padding: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ background: "white", borderRadius: "6px", padding: "8px", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
                    <div style={{ fontWeight: 700, fontSize: "13px", color: "#111827", borderBottom: "1px solid #f3f4f6", paddingBottom: "4px", marginBottom: "4px" }}>{name || "Flow Header"}</div>
                    <div style={{ fontSize: "12px", color: "#374151" }}>{description || "Please tap the button to open the form."}</div>
                    <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "4px", textAlign: "right" }}>Powered by Whatmore</div>
                  </div>
                  {/* CTA button mock */}
                  <div style={{ background: "white", borderRadius: "6px", padding: "8px", textAlign: "center", fontSize: "12.5px", fontWeight: 700, color: "#00a5f4", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
                    {ctaText || "Open Form"}
                  </div>
                </div>

                {/* Form fields mockup render */}
                {formFields.length > 0 && (
                  <div style={{ marginTop: "12px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: "8px" }}>Form Fields Mockup</div>
                    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px" }}>
                      {formFields.map((f, i) => (
                        <div key={i} style={{ marginBottom: "10px" }}>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4b5563", marginBottom: "4px" }}>{f.label}</label>
                          {f.type === "textarea" ? (
                            <textarea readOnly placeholder={f.placeholder} style={{ width: "100%", padding: "6px", fontSize: "11.5px", border: "1px solid #e2e8f0", borderRadius: "6px", outline: "none", boxSizing: "border-box" }} />
                          ) : f.type === "select" ? (
                            <select disabled style={{ width: "100%", padding: "6px", fontSize: "11.5px", border: "1px solid #e2e8f0", borderRadius: "6px", outline: "none" }}>
                              <option>{f.options?.[0] || "Select option..."}</option>
                            </select>
                          ) : f.type === "radio" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              {f.options?.slice(0, 2).map((opt: string) => (
                                <label key={opt} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#374151" }}>
                                  <input type="radio" disabled checked={opt === f.options[0]} /> {opt}
                                </label>
                              ))}
                            </div>
                          ) : (
                            <input readOnly type={f.type} placeholder={f.placeholder} style={{ width: "100%", padding: "6px", fontSize: "11.5px", border: "1px solid #e2e8f0", borderRadius: "6px", outline: "none", boxSizing: "border-box" }} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
