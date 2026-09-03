"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Settings, ShieldCheck, Clock, Users, Bell, Key, CheckCircle2, Link2, Plus, Edit3, Trash2, Webhook, Activity, X } from "lucide-react";
import { getWhatsAppSettingsAction, saveWhatsAppSettingsAction } from "@/app/actions/whatsAppPlatformActions";
import { 
  getWhatsAppIntegrationsAction, 
  createWhatsAppIntegrationAction,
  updateWhatsAppIntegrationAction,
  deleteWhatsAppIntegrationAction
} from "@/app/actions/whatsAppIntegrationActions";

export default function WhatsAppSettingsPage() {
  const [activeTab, setActiveTab] = useState<"platform" | "integrations">("platform");
  
  // Platform Settings State
  const [workingHoursStart, setWorkingHoursStart] = useState("09:00");
  const [workingHoursEnd, setWorkingHoursEnd] = useState("19:00");
  const [slaMinutes, setSlaMinutes] = useState(15);
  const [autoAssignStrategy, setAutoAssignStrategy] = useState("ROUND_ROBIN");
  const [aiModel, setAiModel] = useState("gpt-4o");
  const [saved, setSaved] = useState(false);
  const [loadingPlatform, setLoadingPlatform] = useState(true);

  // Integrations State
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    token: "",
    type: "CRM_LEAD"
  });

  useEffect(() => {
    fetchSettings();
    fetchIntegrations();
  }, []);

  const fetchSettings = async () => {
    const res = await getWhatsAppSettingsAction();
    if (res.success && res.settings) {
      setWorkingHoursStart(res.settings.workingHoursStart || "09:00");
      setWorkingHoursEnd(res.settings.workingHoursEnd || "19:00");
      setSlaMinutes(res.settings.slaWarningMinutes || 15);
      setAutoAssignStrategy(res.settings.autoAssignStrategy || "ROUND_ROBIN");
      setAiModel(res.settings.aiModel || "gpt-4o");
    }
    setLoadingPlatform(false);
  };

  const fetchIntegrations = async () => {
    setLoadingIntegrations(true);
    const res = await getWhatsAppIntegrationsAction();
    if (res.success && res.integrations) {
      setIntegrations(res.integrations);
    }
    setLoadingIntegrations(false);
  };

  const handleSavePlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await saveWhatsAppSettingsAction({
      workingHoursStart,
      workingHoursEnd,
      slaWarningMinutes: slaMinutes,
      autoAssignStrategy,
      aiModel
    });
    
    if (res.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  // Integration Handlers
  const handleOpenModal = (integration?: any) => {
    if (integration) {
      setEditingId(integration.id);
      setFormData({
        name: integration.name,
        url: integration.url,
        token: integration.token || "",
        type: integration.type || "CRM_LEAD"
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", url: "", token: "", type: "CRM_LEAD" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: "", url: "", token: "", type: "CRM_LEAD" });
  };

  const handleSubmitIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.url) return alert("Name and URL are required.");

    if (editingId) {
      const res = await updateWhatsAppIntegrationAction(editingId, formData);
      if (res.success) {
        fetchIntegrations();
        handleCloseModal();
      } else {
        alert(res.error);
      }
    } else {
      const res = await createWhatsAppIntegrationAction(formData);
      if (res.success) {
        fetchIntegrations();
        handleCloseModal();
      } else {
        alert(res.error);
      }
    }
  };

  const handleDeleteIntegration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this integration? Flows using it might break.')) return;
    const res = await deleteWhatsAppIntegrationAction(id);
    if (res.success) {
      fetchIntegrations();
    } else {
      alert(res.error);
    }
  };

  const filteredIntegrations = useMemo(() => {
    if (activeCategoryTab === "ALL") return integrations;
    return integrations.filter(i => i.type === activeCategoryTab);
  }, [integrations, activeCategoryTab]);

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
        <button
          onClick={() => setActiveTab("platform")}
          style={{ background: activeTab === "platform" ? "#eff6ff" : "transparent", color: activeTab === "platform" ? "#2563eb" : "#64748b", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Settings size={18} /> Platform Settings
        </button>
        <button
          onClick={() => setActiveTab("integrations")}
          style={{ background: activeTab === "integrations" ? "#eff6ff" : "transparent", color: activeTab === "integrations" ? "#2563eb" : "#64748b", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Link2 size={18} /> Integrations Hub
        </button>
      </div>

      {activeTab === "platform" && (
        <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px", maxWidth: "750px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 4px 0" }}>WhatsApp Platform & SLA Settings</h2>
          <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 20px 0" }}>Configure working hours, automatic team routing rules, SLA breach warning thresholds & security controls.</p>

          {saved && (
            <div style={{ background: "#dcfce7", border: "1px solid #86efac", color: "#166534", padding: "10px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle2 size={16} /> WhatsApp Settings saved successfully!
            </div>
          )}

          {loadingPlatform ? (
            <div style={{ padding: "20px" }}>Loading settings...</div>
          ) : (
            <form onSubmit={handleSavePlatform} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12.5px", fontWeight: 700, display: "block", marginBottom: "6px" }}>Working Hours Start</label>
                  <input type="time" value={workingHoursStart} onChange={(e) => setWorkingHoursStart(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13.5px" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12.5px", fontWeight: 700, display: "block", marginBottom: "6px" }}>Working Hours End</label>
                  <input type="time" value={workingHoursEnd} onChange={(e) => setWorkingHoursEnd(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13.5px" }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12.5px", fontWeight: 700, display: "block", marginBottom: "6px" }}>SLA Response Time Warning Threshold (Minutes)</label>
                <input type="number" value={slaMinutes} onChange={(e) => setSlaMinutes(parseInt(e.target.value))} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13.5px" }} />
                <p style={{ fontSize: "11.5px", color: "#6b7280", margin: "4px 0 0 0" }}>Conversations un-responded after {slaMinutes} mins show an Orange alert; after {slaMinutes * 2} mins turn Red (SLA Breached).</p>
              </div>

              <div>
                <label style={{ fontSize: "12.5px", fontWeight: 700, display: "block", marginBottom: "6px" }}>Auto Assignment Strategy</label>
                <select value={autoAssignStrategy} onChange={(e) => setAutoAssignStrategy(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13.5px" }}>
                  <option value="ROUND_ROBIN">Round Robin (Equal distribution among active reps)</option>
                  <option value="LEAST_ASSIGNED">Least Assigned (Assign to agent with fewest open chats)</option>
                  <option value="LOCATION_BASED">Territory & State Based Routing</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12.5px", fontWeight: 700, display: "block", marginBottom: "6px" }}>AI Engine / LLM Router</label>
                <select value={aiModel} onChange={(e) => setAiModel(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13.5px" }}>
                  <option value="gpt-4o">OpenAI (GPT-4o) - Recommended</option>
                  <option value="claude-3-5-sonnet">Anthropic (Claude 3.5 Sonnet)</option>
                  <option value="gemini-1.5-pro">Google (Gemini 1.5 Pro)</option>
                </select>
                <p style={{ fontSize: "11.5px", color: "#6b7280", margin: "4px 0 0 0" }}>Select the active AI Model to use for the WhatsApp Chatbot. Requires correct API Keys configured in your environment.</p>
              </div>

              <button type="submit" style={{ background: "#10b981", color: "#ffffff", border: "none", padding: "12px", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: "pointer", marginTop: "10px" }}>
                Save WhatsApp Settings
              </button>
            </form>
          )}
        </div>
      )}

      {activeTab === "integrations" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "#0f172a" }}>Integrations Hub</h2>
            <button 
              onClick={() => handleOpenModal()}
              style={{ background: "#3b82f6", color: "white", padding: "10px 20px", borderRadius: "8px", border: "none", fontWeight: 600, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 6px rgba(59, 130, 246, 0.2)" }}
            >
              <Plus size={16} /> Add Integration
            </button>
          </div>
          
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            {['ALL', 'CRM_LEAD', 'ERP', 'PAYMENT', 'ZAPIER'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategoryTab(cat)}
                style={{ 
                  background: activeCategoryTab === cat ? "#1e293b" : "white", 
                  color: activeCategoryTab === cat ? "white" : "#475569", 
                  border: "1px solid #cbd5e1", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" 
                }}
              >
                {cat === 'ALL' ? 'All Integrations' : cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "16px", color: "#64748b", fontWeight: 600, fontSize: "13px" }}>Name</th>
                  <th style={{ padding: "16px", color: "#64748b", fontWeight: 600, fontSize: "13px" }}>Category</th>
                  <th style={{ padding: "16px", color: "#64748b", fontWeight: 600, fontSize: "13px" }}>Webhook URL</th>
                  <th style={{ padding: "16px", color: "#64748b", fontWeight: 600, fontSize: "13px" }}>Auth Token</th>
                  <th style={{ padding: "16px", color: "#64748b", fontWeight: 600, fontSize: "13px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingIntegrations ? (
                  <tr><td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>Loading integrations...</td></tr>
                ) : filteredIntegrations.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                      <Webhook size={40} style={{ opacity: 0.2, marginBottom: "16px" }} />
                      <div>No {activeCategoryTab !== "ALL" ? activeCategoryTab : ""} integrations found.</div>
                    </td>
                  </tr>
                ) : (
                  filteredIntegrations.map(integration => (
                    <tr key={integration.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "16px", fontWeight: 600, color: "#0f172a" }}>{integration.name}</td>
                      <td style={{ padding: "16px" }}>
                        <span style={{ background: "#e0e7ff", color: "#4f46e5", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>
                          {integration.type}
                        </span>
                      </td>
                      <td style={{ padding: "16px", color: "#475569", fontFamily: "monospace", fontSize: "12px" }}>
                        {integration.url}
                      </td>
                      <td style={{ padding: "16px", color: "#475569", fontFamily: "monospace", fontSize: "12px" }}>
                        {integration.token ? "••••••••••••" : "None"}
                      </td>
                      <td style={{ padding: "16px", textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button onClick={() => handleOpenModal(integration)} style={{ background: "#eff6ff", color: "#2563eb", border: "none", padding: "6px", borderRadius: "6px", cursor: "pointer" }}><Edit3 size={16} /></button>
                        <button onClick={() => handleDeleteIntegration(integration.id)} style={{ background: "#fef2f2", color: "#dc2626", border: "none", padding: "6px", borderRadius: "6px", cursor: "pointer" }}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {isModalOpen && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
              <div style={{ background: "white", width: "100%", maxWidth: "500px", borderRadius: "16px", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", borderBottom: "1px solid #e2e8f0" }}>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>{editingId ? "Edit Integration" : "Add Integration"}</h2>
                  <button onClick={handleCloseModal} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer" }}><X size={20} /></button>
                </div>
                
                <form onSubmit={handleSubmitIntegration} style={{ padding: "20px" }}>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Category</label>
                    <select 
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", outline: "none" }}
                    >
                      <option value="CRM_LEAD">CRM (Lead Webhook)</option>
                      <option value="ERP">ERP</option>
                      <option value="PAYMENT">Payment</option>
                      <option value="ZAPIER">Zapier / Webhook</option>
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Integration Name</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      placeholder="e.g. ERP Lead Webhook"
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", outline: "none" }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Webhook / API URL</label>
                    <input 
                      type="url" 
                      value={formData.url} 
                      onChange={e => setFormData({...formData, url: e.target.value})} 
                      placeholder="https://api.yourcrm.com/v1/leads"
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", outline: "none", fontFamily: "monospace" }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: "24px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Authorization Token (Optional)</label>
                    <input 
                      type="text" 
                      value={formData.token} 
                      onChange={e => setFormData({...formData, token: e.target.value})} 
                      placeholder="Bearer xxxxx..."
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", outline: "none", fontFamily: "monospace" }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                    <button type="button" onClick={handleCloseModal} style={{ padding: "10px 16px", background: "white", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#475569", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                    <button type="submit" style={{ padding: "10px 16px", background: "#3b82f6", border: "none", borderRadius: "8px", color: "white", fontWeight: 600, cursor: "pointer" }}>Save Integration</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
