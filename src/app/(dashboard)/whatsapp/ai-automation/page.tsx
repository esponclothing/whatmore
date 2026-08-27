"use client";

import React, { useState, useEffect } from "react";
import { Bot, Save, Sparkles, AlertCircle, Database, Book, Globe, Settings2, Cpu } from "lucide-react";

export default function WhatsAppAIAutomationPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    aiModel: "gemini-1.5-flash",
    aiFallbackLanguage: "English",
    aiSystemPrompt: "You are a helpful and polite customer service assistant.",
    aiKnowledgeBase: "",
    aiConfidenceThreshold: 85
  });

  const [testMessage, setTestMessage] = useState("");
  const [testResponse, setTestResponse] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/whatsapp/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(prev => ({ ...prev, ...data.settings }));
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/whatsapp/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        alert("Settings saved successfully!");
      } else {
        alert("Failed to save: " + data.error);
      }
    } catch (error) {
      alert("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  // Mock test function since we don't have a specific conversation ID for testing
  const testAiPrompt = async () => {
    if (!testMessage.trim()) return;
    setTesting(true);
    setTestResponse("");
    try {
      // In a real app, you'd send this to a dedicated /test-ai route
      // Here we just mock the latency and show a notice.
      setTimeout(() => {
        setTestResponse(`[Testing Mode] Using ${settings.aiModel}. Assuming the knowledge base rules were applied to: "${testMessage}"`);
        setTesting(false);
      }, 1000);
    } catch (error) {
      setTestResponse("Error testing AI.");
      setTesting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading AI Settings...</div>;
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px 32px", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <Bot size={28} color="#6d28d9" />
            AI Assistant Configuration
          </h1>
          <p style={{ color: "#6b7280", margin: "4px 0 0 0", fontSize: "14px" }}>Manage how Google Gemini interacts with your customers via WhatsApp.</p>
        </div>
        <button 
          onClick={saveSettings}
          disabled={saving}
          style={{ 
            background: saving ? "#9ca3af" : "#111827", 
            color: "white", 
            border: "none", 
            padding: "8px 16px", 
            borderRadius: "8px", 
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: saving ? "not-allowed" : "pointer",
            transition: "all 0.2s"
          }}
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}>
        {/* Main Editor Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Card: Knowledge Base */}
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <Database size={18} color="#3b82f6" /> Business Knowledge Base
            </h2>
            <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "16px" }}>
              Provide facts, pricing, policies, and FAQs. The AI will strictly use this information to answer customer queries.
            </p>
            <textarea 
              value={settings.aiKnowledgeBase}
              onChange={(e) => setSettings({...settings, aiKnowledgeBase: e.target.value})}
              placeholder="e.g. Our return policy is 30 days. We offer free shipping on orders over $50..."
              style={{ 
                width: "100%", 
                minHeight: "240px", 
                padding: "12px", 
                border: "1px solid #d1d5db", 
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "13px",
                resize: "vertical"
              }}
            />
          </div>

          {/* Card: System Prompt */}
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <Settings2 size={18} color="#10b981" /> AI Persona & System Rules
            </h2>
            <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "16px" }}>
              Define how the AI should behave, its tone of voice, and strict rules it must follow.
            </p>
            <textarea 
              value={settings.aiSystemPrompt}
              onChange={(e) => setSettings({...settings, aiSystemPrompt: e.target.value})}
              placeholder="e.g. You are Alex, a friendly sales rep. Keep answers under 2 sentences. Use emojis."
              style={{ 
                width: "100%", 
                minHeight: "120px", 
                padding: "12px", 
                border: "1px solid #d1d5db", 
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "13px",
                resize: "vertical"
              }}
            />
          </div>

        </div>

        {/* Sidebar Configuration Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Card: Model Settings */}
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <Cpu size={18} color="#8b5cf6" /> Model Configuration
            </h2>
            
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>Gemini AI Model</label>
              <select 
                value={settings.aiModel}
                onChange={(e) => setSettings({...settings, aiModel: e.target.value})}
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
              >
                <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
                <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                <option value="gemini-3.1-pro">Gemini 3.1 Pro</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </select>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                <Globe size={14} /> Fallback Language
              </label>
              <input 
                type="text"
                value={settings.aiFallbackLanguage}
                onChange={(e) => setSettings({...settings, aiFallbackLanguage: e.target.value})}
                placeholder="e.g. English, Hindi"
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
              />
              <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>Language to use if user intent is unclear.</p>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
                Confidence Threshold: {settings.aiConfidenceThreshold}%
              </label>
              <input 
                type="range"
                min="50" max="99"
                value={settings.aiConfidenceThreshold}
                onChange={(e) => setSettings({...settings, aiConfidenceThreshold: parseInt(e.target.value)})}
                style={{ width: "100%", accentColor: "#6d28d9" }}
              />
            </div>
          </div>

          {/* Card: Test AI */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={18} color="#f59e0b" /> Simulator
            </h2>
            <textarea 
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Simulate a customer message here..."
              style={{ width: "100%", minHeight: "80px", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", marginBottom: "8px" }}
            />
            <button 
              onClick={testAiPrompt}
              disabled={testing || !testMessage.trim()}
              style={{ width: "100%", padding: "8px", background: "white", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
            >
              {testing ? "Generating..." : "Test AI Response"}
            </button>

            {testResponse && (
              <div style={{ marginTop: "12px", padding: "10px", background: "#f1f5f9", borderRadius: "6px", fontSize: "12.5px", color: "#334155", borderLeft: "3px solid #6d28d9" }}>
                <strong>AI:</strong> {testResponse}
              </div>
            )}
          </div>

          {/* Setup Warning */}
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "16px", display: "flex", gap: "12px" }}>
            <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: "12.5px", color: "#991b1b" }}>
              <strong>API Key Required:</strong> Ensure that <code style={{ background: "#fee2e2", padding: "2px 4px", borderRadius: "4px" }}>GEMINI_API_KEY</code> is set in your Vercel Environment Variables.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
