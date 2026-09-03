"use client";

import React, { useState, useEffect } from "react";
import { Link2, Plus, Edit3, Trash2, Webhook, Activity, X } from "lucide-react";
import { 
  getWhatsAppIntegrationsAction, 
  createWhatsAppIntegrationAction,
  updateWhatsAppIntegrationAction,
  deleteWhatsAppIntegrationAction
} from "@/app/actions/whatsAppIntegrationActions";

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    token: ""
  });

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setLoading(true);
    const res = await getWhatsAppIntegrationsAction();
    if (res.success && res.integrations) {
      setIntegrations(res.integrations);
    }
    setLoading(false);
  };

  const handleOpenModal = (integration?: any) => {
    if (integration) {
      setEditingId(integration.id);
      setFormData({
        name: integration.name,
        url: integration.url,
        token: integration.token || ""
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", url: "", token: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: "", url: "", token: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this integration? Flows using it might break.')) return;
    const res = await deleteWhatsAppIntegrationAction(id);
    if (res.success) {
      fetchIntegrations();
    } else {
      alert(res.error);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <Link2 size={28} color="#3b82f6" /> Integrations Hub
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>Manage your webhooks and API connections centrally.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          style={{ background: "#3b82f6", color: "white", padding: "10px 20px", borderRadius: "8px", border: "none", fontWeight: 600, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 6px rgba(59, 130, 246, 0.2)" }}
        >
          <Plus size={16} /> Add Integration
        </button>
      </div>

      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
              <th style={{ padding: "16px", color: "#64748b", fontWeight: 600, fontSize: "13px" }}>Name</th>
              <th style={{ padding: "16px", color: "#64748b", fontWeight: 600, fontSize: "13px" }}>Webhook URL</th>
              <th style={{ padding: "16px", color: "#64748b", fontWeight: 600, fontSize: "13px" }}>Auth Token</th>
              <th style={{ padding: "16px", color: "#64748b", fontWeight: 600, fontSize: "13px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>Loading integrations...</td></tr>
            ) : integrations.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                  <Webhook size={40} style={{ opacity: 0.2, marginBottom: "16px" }} />
                  <div>No integrations configured yet.</div>
                </td>
              </tr>
            ) : (
              integrations.map(integration => (
                <tr key={integration.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px", fontWeight: 600, color: "#0f172a" }}>{integration.name}</td>
                  <td style={{ padding: "16px", color: "#475569", fontFamily: "monospace", fontSize: "12px" }}>
                    {integration.url}
                  </td>
                  <td style={{ padding: "16px", color: "#475569", fontFamily: "monospace", fontSize: "12px" }}>
                    {integration.token ? "••••••••••••" : "None"}
                  </td>
                  <td style={{ padding: "16px", textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                    <button onClick={() => handleOpenModal(integration)} style={{ background: "#eff6ff", color: "#2563eb", border: "none", padding: "6px", borderRadius: "6px", cursor: "pointer" }}><Edit3 size={16} /></button>
                    <button onClick={() => handleDelete(integration.id)} style={{ background: "#fef2f2", color: "#dc2626", border: "none", padding: "6px", borderRadius: "6px", cursor: "pointer" }}><Trash2 size={16} /></button>
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
            
            <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
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
  );
}
