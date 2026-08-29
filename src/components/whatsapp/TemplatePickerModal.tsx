"use client";
import React, { useState, useEffect } from "react";
import { X, Search, CheckCircle2, Clock, AlertCircle, Send, ChevronRight } from "lucide-react";

interface Template {
  id?: string; name: string; category: string; status: string;
  bodyText: string; headerContent?: string; footerText?: string;
  buttons?: string; language?: string;
}
interface Props {
  onClose: () => void;
  onSendTemplate: (templateName: string, language: string, components: any[]) => Promise<void>;
}

export default function TemplatePickerModal({ onClose, onSendTemplate }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Template | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/whatsapp/templates")
      .then(r => r.json())
      .then(data => {
        setTemplates((data.templates || []).filter((t: Template) => t.status === "APPROVED"));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Extract {{n}} variable placeholders from body text
  const extractVariables = (text: string): string[] => {
    const matches = text?.match(/\{\{(\d+)\}\}/g) || [];
    return [...new Set(matches)].sort();
  };

  const bodyVars = selected ? extractVariables(selected.bodyText) : [];

  const previewBody = (text: string) => {
    if (!text) return "";
    return text.replace(/\{\{(\d+)\}\}/g, (match) => variables[match] || match);
  };

  const handleSend = async () => {
    if (!selected) return;
    setSending(true);
    const components: any[] = [];
    if (bodyVars.length > 0) {
      components.push({
        type: "body",
        parameters: bodyVars.map(v => ({ type: "text", text: variables[v] || v }))
      });
    }
    await onSendTemplate(selected.name, selected.language || "en", components);
    setSending(false);
    onClose();
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      APPROVED: { bg: "rgba(16,185,129,0.1)", color: "#10b981" },
      PENDING: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" },
      REJECTED: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
    };
    const c = colors[status] || colors.PENDING;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", padding: "2px 7px", background: c.bg, color: c.color, borderRadius: "4px", fontSize: "10px", fontWeight: 700 }}>
        {status}
      </span>
    );
  };

  const filtered = templates.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.bodyText?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "white", borderRadius: "16px", width: "100%", maxWidth: "720px", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: "16px", color: "#111827", margin: 0 }}>📄 Send Template Message</h3>
            <p style={{ fontSize: "13px", color: "#6b7280", margin: "2px 0 0 0" }}>Choose an approved template to send</p>
          </div>
          <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", borderRadius: "8px", cursor: "pointer", padding: "6px" }}><X size={16} color="#6b7280" /></button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left: Template List */}
          <div style={{ width: "55%", borderRight: "1px solid #f3f4f6", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..."
                  style={{ width: "100%", padding: "7px 10px 7px 30px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {loading ? (
                <div style={{ padding: "24px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>Loading templates...</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
                  No approved templates found.<br/>
                  <span style={{ fontSize: "12px" }}>Create templates in the Templates page.</span>
                </div>
              ) : (
                filtered.map(t => (
                  <div key={t.name} onClick={() => { setSelected(t); setVariables({}); }}
                    style={{ padding: "12px 16px", borderBottom: "1px solid #f9fafb", cursor: "pointer",
                      background: selected?.name === t.name ? "#f0f0ff" : "white",
                      borderLeft: selected?.name === t.name ? "3px solid #4f46e5" : "3px solid transparent",
                      display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "13px", color: "#111827", marginBottom: "3px" }}>{t.name}</div>
                      <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.bodyText?.slice(0, 60)}...
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {statusBadge(t.status)}
                        <span style={{ fontSize: "10px", color: "#9ca3af" }}>{t.category}</span>
                      </div>
                    </div>
                    <ChevronRight size={14} color="#9ca3af" style={{ flexShrink: 0, marginTop: "2px" }} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Preview + Variables */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {selected ? (
              <>
                <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
                  {/* WhatsApp Bubble Preview */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Preview</div>
                    <div style={{ background: "#e2ffc7", borderRadius: "12px 12px 3px 12px", padding: "12px 14px", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
                      {selected.headerContent && <div style={{ fontWeight: 800, fontSize: "14px", color: "#111827", marginBottom: "6px" }}>{selected.headerContent}</div>}
                      <div style={{ fontSize: "13px", color: "#1c1c1e", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                        {previewBody(selected.bodyText)}
                      </div>
                      {selected.footerText && <div style={{ fontSize: "11px", color: "#8696a0", marginTop: "6px" }}>{selected.footerText}</div>}
                    </div>
                  </div>

                  {/* Variable Inputs */}
                  {bodyVars.length > 0 && (
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Fill Variables</div>
                      {bodyVars.map(v => (
                        <div key={v} style={{ marginBottom: "10px" }}>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>{v}</label>
                          <input
                            value={variables[v] || ""}
                            onChange={e => setVariables(prev => ({ ...prev, [v]: e.target.value }))}
                            placeholder={`Value for ${v}`}
                            style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ padding: "12px 16px", borderTop: "1px solid #f3f4f6" }}>
                  <button onClick={handleSend} disabled={sending}
                    style={{ width: "100%", padding: "12px", background: sending ? "#9ca3af" : "#4f46e5", color: "white", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "14px", cursor: sending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <Send size={15} />
                    {sending ? "Sending..." : "Send Template"}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "13px", padding: "24px", textAlign: "center" }}>
                ← Select a template to preview and send
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
