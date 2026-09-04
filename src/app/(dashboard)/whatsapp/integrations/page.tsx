"use client";

import React, { useState, useEffect } from "react";
import { Key, ShieldCheck, RefreshCw, CheckCircle2, AlertTriangle, Eye, EyeOff, Send, Save, ArrowRight, Store, MessageSquare, Users, Bot, Layers, BookOpen, Edit3, X, Plus, Trash2, UserCheck, UserX, Shield, ExternalLink, Sparkles, HelpCircle } from "lucide-react";
import { 
  getWhatsAppApiCredentialsAction, 
  saveWhatsAppApiCredentialsAction, 
  getShopifyCredentialsAction, 
  saveShopifyCredentialsAction, 
  sendWhatsAppHelloWorldAction, 
  registerWhatsAppPhoneNumberAction,
  getWhatsAppSettingsAction,
  saveWhatsAppSettingsAction,
  getTeamMembersAction,
  getTeamsWithMembersAction,
  createTeamAction,
  deleteTeamAction,
  addAgentToTeamAction,
  removeAgentFromTeamAction,
  toggleAgentChatAvailabilityAction,
  getAllAgentsAction
} from "@/app/actions/whatsAppPlatformActions";
import { getPaymentGatewaySettings, savePaymentGatewaySettings } from "@/app/actions/paymentGatewayActions";
import { getWhatsAppIntegrationsAction, createWhatsAppIntegrationAction, updateWhatsAppIntegrationAction, deleteWhatsAppIntegrationAction } from "@/app/actions/whatsAppIntegrationActions";


export default function IntegrationsHubPage() {
  const [activeTab, setActiveTab] = useState("whatsapp");

  // Payment Gateway State
  const [pgActiveGateway, setPgActiveGateway] = useState<string | null>(null);
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [razorpayKeySecret, setRazorpayKeySecret] = useState("");
  const [cashfreeAppId, setCashfreeAppId] = useState("");
  const [cashfreeSecretKey, setCashfreeSecretKey] = useState("");
  const [merchantUpiId, setMerchantUpiId] = useState("");
  const [merchantUpiName, setMerchantUpiName] = useState("");
  const [savingPg, setSavingPg] = useState(false);
  const [pgMsg, setPgMsg] = useState<string | null>(null);
  const [showRzpSecret, setShowRzpSecret] = useState(false);
  const [showCfSecret, setShowCfSecret] = useState(false);

  // Integrations states
  const [wabaId, setWabaId] = useState("");
  const [phoneId, setPhoneId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [token, setToken] = useState("");
  const [webhookToken, setWebhookToken] = useState("espon_whatsapp_secure_webhook_token_2026");
  const [showToken, setShowToken] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Shopify State
  
  // Webhooks State
  const [webhookIntegrations, setWebhookIntegrations] = useState<any[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(true);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", url: "", token: "", type: "CRM_LEAD" });

  const [shopifyDomain, setShopifyDomain] = useState("");
  const [shopifyToken, setShopifyToken] = useState("");
  const [showShopifyToken, setShowShopifyToken] = useState(false);
  const [savingShopify, setSavingShopify] = useState(false);
  const [shopifyResultMsg, setShopifyResultMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Test Message State
  const [testPhone, setTestPhone] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResultMsg, setTestResultMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Gemini AI Tab States
  const [geminiKey, setGeminiKey] = useState("");
  const [welcomeMsg, setWelcomeMsg] = useState("");
  const [activeModel, setActiveModel] = useState("gemini-2.0-flash");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [savingAI, setSavingAI] = useState(false);
  const [aiResultMsg, setAiResultMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Teams State
  const [teams, setTeams] = useState<any[]>([]);
  const [allAgents, setAllAgents] = useState<any[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [teamMsg, setTeamMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  // Agent Management States
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentEmail, setNewAgentEmail] = useState("");
  const [newAgentPassword, setNewAgentPassword] = useState("");
  const [newAgentRole, setNewAgentRole] = useState("AGENT");
  const [savingAgent, setSavingAgent] = useState(false);
  const [agentResultMsg, setAgentResultMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [editAgentData, setEditAgentData] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Facebook Register state
  const [registering, setRegistering] = useState(false);

  const [currentUserRole, setCurrentUserRole] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  useEffect(() => {
    try {
      const u = document.cookie.split(";").find(c => c.trim().startsWith("wm_user="));
      if (u) {
        const parsed = JSON.parse(decodeURIComponent(u.split("=")[1]));
        setCurrentUserRole(parsed.role || "");
        setCurrentUserEmail(parsed.email || "");
      }
    } catch {}
    loadAllSettings();
  }, []);

  const loadAllSettings = () => {
    Promise.all([
      getWhatsAppApiCredentialsAction(),
      getShopifyCredentialsAction(),
      getWhatsAppSettingsAction(),
      getTeamsWithMembersAction(),
      getAllAgentsAction(),
      getWhatsAppIntegrationsAction()
    ]).then(([resWA, resShopify, resSettings, resTeams, resAgents, resWebhooks]) => {
      if (resWA.success && resWA.credentials) {
        setWabaId(resWA.credentials.businessAccountId || "");
        setPhoneId(resWA.credentials.phoneId || "");
        setManagerId(resWA.credentials.businessManagerId || "");
        setPhoneNumber(resWA.credentials.phoneNumber || "");
        setToken(resWA.credentials.accessToken || "");
        setWebhookToken(resWA.credentials.webhookVerifyToken || "espon_whatsapp_secure_webhook_token_2026");
        setIsConnected(resWA.isConnected || false);
      }
      if (resShopify.success && resShopify.credentials) {
        setShopifyDomain(resShopify.credentials.shopifyStoreDomain || "");
        setShopifyToken(resShopify.credentials.shopifyAccessToken || "");
      }
      if (resSettings.success && resSettings.settings) {
        setGeminiKey(resSettings.settings.geminiApiKey || "");
        setWelcomeMsg(resSettings.settings.welcomeMessage || "Welcome! How can we help you today?");
        setActiveModel(resSettings.settings.aiModel || "gemini-2.0-flash");
        setSystemPrompt(resSettings.settings.aiSystemPrompt || "");
      }
      if (resTeams.success && resTeams.teams) setTeams(resTeams.teams);
      if (resAgents.success && resAgents.employees) setAllAgents(resAgents.employees);
      
      // Load client status & SaaS agents
      fetch('/api/whatsapp/client-status').then(r => r.json()).then(d => setClientInfo(d)).catch(() => {});
      fetch('/api/owner/agents').then(r => r.json()).then(d => { if (d.agents) setAgents(d.agents); }).catch(() => {});

      if (resWebhooks && resWebhooks.success) {
        setWebhookIntegrations(resWebhooks.integrations || []);
      }
      setLoadingWebhooks(false);
      setLoading(false);
    });

    // Load payment gateway settings separately
    getPaymentGatewaySettings().then(pg => {
      setPgActiveGateway(pg.activeGateway);
      setRazorpayKeyId(pg.razorpayKeyId);
      setRazorpayKeySecret(pg.razorpayKeySecret);
      setCashfreeAppId(pg.cashfreeAppId);
      setCashfreeSecretKey(pg.cashfreeSecretKey);
      setMerchantUpiId(pg.merchantUpiId);
      setMerchantUpiName(pg.merchantUpiName);
    }).catch(() => {});
  };

  
  const handleOpenModal = (integration?: any) => {
    if (integration) {
      setEditingId(integration.id);
      setFormData({ name: integration.name, url: integration.url, token: integration.token || "", type: integration.type || "CRM_LEAD" });
    } else {
      setEditingId(null);
      setFormData({ name: "", url: "", token: "", type: "CRM_LEAD" });
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => { setIsModalOpen(false); setEditingId(null); setFormData({ name: "", url: "", token: "", type: "CRM_LEAD" }); };
  
  const handleSubmitIntegration = async (e: any) => {
    e.preventDefault();
    if (!formData.name || !formData.url) return alert("Name and URL required.");
    if (editingId) {
      const res = await updateWhatsAppIntegrationAction(editingId, formData);
      if (res.success) { 
        setWebhookIntegrations(webhookIntegrations.map(h => h.id === editingId ? { ...h, ...formData } : h));
        handleCloseModal(); 
      } else alert(res.error);
    } else {
      const res = await createWhatsAppIntegrationAction(formData);
      if (res.success) { 
        setWebhookIntegrations([...webhookIntegrations, res.integration || { id: Date.now().toString(), ...formData }]);
        handleCloseModal(); 
      } else alert(res.error);
    }
  };
  
  const handleDeleteIntegration = async (id: string) => {
    if (!confirm('Delete this integration?')) return;
    const res = await deleteWhatsAppIntegrationAction(id);
    if (res.success) {
      setWebhookIntegrations(webhookIntegrations.filter(h => h.id !== id));
    } else alert(res.error);
  };

const reloadTeams = async () => {
    const [resTeams, resAgents] = await Promise.all([getTeamsWithMembersAction(), getAllAgentsAction()]);
    if (resTeams.success && resTeams.teams) setTeams(resTeams.teams);
    if (resAgents.success && resAgents.employees) setAllAgents(resAgents.employees);
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    setCreatingTeam(true);
    const res = await createTeamAction(newTeamName.trim(), newTeamDesc.trim() || undefined);
    if (res.success) {
      setNewTeamName(""); setNewTeamDesc("");
      setTeamMsg({ success: true, text: `Γ£ô Team "${res.team?.name}" created!` });
      await reloadTeams();
    } else {
      setTeamMsg({ success: false, text: res.error || "Failed to create team" });
    }
    setCreatingTeam(false);
    setTimeout(() => setTeamMsg(null), 3000);
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Delete team "${teamName}"? All agents will be unassigned.`)) return;
    const res = await deleteTeamAction(teamId);
    if (res.success) { setTeamMsg({ success: true, text: "Team deleted." }); await reloadTeams(); }
    else setTeamMsg({ success: false, text: res.error || "Failed" });
    setTimeout(() => setTeamMsg(null), 3000);
  };

  const handleToggleAgentInTeam = async (employeeId: string, currentTeamId: string | null, targetTeamId: string) => {
    if (currentTeamId === targetTeamId) {
      await removeAgentFromTeamAction(employeeId);
    } else {
      await addAgentToTeamAction(employeeId, targetTeamId);
    }
    await reloadTeams();
  };

  const handleToggleChatAvailable = async (employeeId: string, current: boolean) => {
    await toggleAgentChatAvailabilityAction(employeeId, !current);
    await reloadTeams();
  };


  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setResultMsg(null);
    const res = await saveWhatsAppApiCredentialsAction({
      wabaId, phoneId, managerId, accessToken: token, phoneNumber, webhookVerifyToken: webhookToken
    });
    if (res.success) {
      setIsConnected(Boolean(res.isConnected));
      setResultMsg({ success: Boolean(res.isConnected), text: res.message || "Credentials updated." });
    } else {
      setResultMsg({ success: false, text: res.error || "Failed to save API credentials." });
    }
    setSaving(false);
  };

  const handleSaveShopifyCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingShopify(true);
    setShopifyResultMsg(null);
    let cleanDomain = shopifyDomain.replace('https://', '').replace('http://', '').trim();
    if (cleanDomain && !cleanDomain.includes('.myshopify.com')) {
       cleanDomain = `${cleanDomain}.myshopify.com`;
    }
    setShopifyDomain(cleanDomain);

    const res = await saveShopifyCredentialsAction({
      storeDomain: cleanDomain,
      accessToken: shopifyToken
    });
    if (res.success) {
      setShopifyResultMsg({ success: true, text: res.message || "Shopify credentials saved." });
    } else {
      setShopifyResultMsg({ success: false, text: res.error || "Failed to save Shopify credentials." });
    }
    setSavingShopify(false);
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone) return;
    sendingTest || setSendingTest(true);
    setTestResultMsg(null);
    const res = await sendWhatsAppHelloWorldAction(testPhone);
    if (res.success) {
      setTestResultMsg({ success: true, text: "Test message sent successfully!" });
    } else {
      setTestResultMsg({ success: false, text: res.error || "Failed to send test message." });
    }
    setSendingTest(false);
  };

  const handleFacebookLogin = async () => {
    const pin = window.prompt("Enter the 6-digit Registration PIN to register this phone number with Meta Cloud API:");
    if (!pin) return;
    if (pin.length !== 6) {
      alert("PIN must be exactly 6 digits.");
      return;
    }
    setRegistering(true);
    const res = await registerWhatsAppPhoneNumberAction(pin);
    setRegistering(false);
    if (res.success) {
      alert(res.message);
    } else {
      alert("Registration Error: " + res.error);
    }
  };

  const handleSaveAISettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAI(true);
    setAiResultMsg(null);
    const res = await saveWhatsAppSettingsAction({
      geminiApiKey: geminiKey,
      welcomeMessage: welcomeMsg,
      aiModel: activeModel,
      aiSystemPrompt: systemPrompt
    });
    setSavingAI(false);
    if (res.success) {
      setAiResultMsg({ success: true, text: "Γ£ô Gemini AI parameters configured successfully!" });
    } else {
      setAiResultMsg({ success: false, text: "Error: " + res.error });
    }
  };

  const handleSaveSLASettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSLA(true);
    setSlaResultMsg(null);
    const res = await saveWhatsAppSettingsAction({
      workingHoursStart,
      workingHoursEnd,
      slaWarningMinutes: slaMinutes,
      autoAssignStrategy
    });
    setSavingSLA(false);
    if (res.success) {
      setSlaResultMsg({ success: true, text: "Γ£ô SLA and Work hours targets configured!" });
    } else {
      setSlaResultMsg({ success: false, text: "Error: " + res.error });
    }
  };

  const handleCreateCRMContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCRM(true);
    setCrmResultMsg(null);
    const res = await createCRMCustomerAction({
      contactPerson: newContactName,
      mobile: newContactPhone,
      customerType: newContactType
    });
    setSavingCRM(false);
    if (res.success) {
      setCrmResultMsg({ success: true, text: `Γ£ô Customer "${newContactName}" registered successfully!` });
      setNewContactName("");
      setNewContactPhone("");
      // reload contacts
      const resCRM = await getCRMCustomersAction();
      if (resCRM.success && resCRM.customers) {
        setCrmContacts(resCRM.customers);
      }
    } else {
      setCrmResultMsg({ success: false, text: "Error: " + res.error });
    }
  };

  const handleSaveEditAgent = async (agentId: string) => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/owner/agents/${agentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editAgentData)
      });
      const data = await res.json();
      if (data.success) {
        setEditingAgentId(null);
        fetch('/api/owner/agents').then(r => r.json()).then(d => { if (d.agents) setAgents(d.agents); });
      } else {
        alert(data.error || "Failed to update agent");
      }
    } catch (e) {
      alert("Connection error");
    }
    setSavingEdit(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading settings directory...</div>;
  }

  if (currentUserRole === "AGENT") {
    const myAgentInfo = agents.find(a => a.email === currentUserEmail);
    const onAgentProfileSave = async () => {
      if (!myAgentInfo) return;
      setSavingEdit(true);
      const payload = { ...myAgentInfo, ...editAgentData };
      try {
        const res = await fetch(`/api/owner/agents/${myAgentInfo.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) alert("Profile updated successfully!");
        else alert(data.error || "Failed to update profile");
      } catch (e) {
        alert("Connection error");
      }
      setSavingEdit(false);
    };

    return (
      <div className="p-8 w-full max-w-none flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-1">My Profile</h1>
          <p className="text-gray-500 dark:text-gray-400">Update your personal details and password.</p>
        </div>
        
        {myAgentInfo ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 max-w-md">
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Name</label>
                <input 
                  type="text" 
                  value={editAgentData.name !== undefined ? editAgentData.name : myAgentInfo.name} 
                  onChange={(e) => setEditAgentData({...editAgentData, name: e.target.value})} 
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Email (Read Only)</label>
                <input 
                  type="email" 
                  value={myAgentInfo.email} 
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">New Password (optional)</label>
                <input 
                  type="password" 
                  value={editAgentData.password || ""} 
                  onChange={(e) => setEditAgentData({...editAgentData, password: e.target.value})} 
                  placeholder="Enter to change password"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" 
                />
              </div>
              <div className="pt-2">
                <button 
                  onClick={onAgentProfileSave} 
                  disabled={savingEdit} 
                  className="w-full px-5 py-2.5 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2"
                >
                  {savingEdit ? <RefreshCw size={16} className="animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">Loading profile data...</div>
        )}
      </div>
    );
  }

  const filteredWebhooks = activeCategoryTab === "ALL" 
    ? webhookIntegrations 
    : webhookIntegrations.filter(h => h.type === activeCategoryTab);

  return (
    <div className="p-8 w-full max-w-none flex flex-col gap-8">
      {/* Header title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-1">Settings & Directory</h1>
        <p className="text-gray-500 dark:text-gray-400">Configure core external APIs, Gemini LLM cascades, team members auto-routing and CRM contact list.</p>
      </div>

      {/* Tabs list bar */}
      <nav className="-mb-px flex space-x-8 overflow-x-auto border-b border-gray-200 dark:border-slate-700">
        <button onClick={() => setActiveTab("whatsapp")} className={`px-5 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === "whatsapp" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
          WhatsApp API
        </button>
        <button onClick={() => setActiveTab("shopify")} className={`px-5 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === "shopify" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
          Shopify
        </button>
        <button onClick={() => setActiveTab("payment")} className={`px-5 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === "payment" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
          Payment Gateways
        </button>
        <button onClick={() => setActiveTab("webhooks")} className={`px-5 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === "webhooks" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
          Webhooks
        </button>
      </nav>

      {/* 1. Integrations tab */}
      {activeTab === "whatsapp" && (
        <div className="flex flex-col gap-8 w-full max-w-7xl">
          {!isConnected && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-full"><AlertTriangle size={24} className="text-amber-600 dark:text-amber-400" /></div>
              <div>
                <h4 className="text-base font-bold text-amber-900 dark:text-amber-300 mb-0.5">WhatsApp API Not Connected</h4>
                <p className="text-sm text-amber-700 dark:text-amber-500/80 m-0">Please enter your Meta WABA Account ID, Phone Number ID, and Access Token below to enable live messaging.</p>
              </div>
            </div>
          )}

          {/* Meta WhatsApp Integration Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 dark:border-slate-700 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50 dark:bg-slate-800/50">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white m-0">WhatsApp Business API</h2>
                <p className="text-sm text-gray-500 m-0 mt-1">Manage Meta Cloud API tokens and Webhook configuration.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                 <button onClick={handleFacebookLogin} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-lg text-sm font-bold shadow-sm transition-all">
                    {registering ? <RefreshCw size={16} className="animate-spin" /> : <MessageSquare size={16} />} {registering ? "Registering..." : "Register New Number"}
                 </button>
                <span className={`px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1 ${isConnected ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {isConnected ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />} {isConnected ? "CONNECTED" : "NOT CONNECTED"}
                </span>
              </div>
            </div>

            <div className="p-6 border-b border-gray-100 dark:border-slate-700">
              {resultMsg && (
                <div className={`mb-6 p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${resultMsg.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {resultMsg.success ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  <span>{resultMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveCredentials} className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">WhatsApp Phone Number <span className="text-red-500">*</span></label>
                    <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+91 9876543210" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Meta Phone Number ID <span className="text-red-500">*</span></label>
                    <input type="text" value={phoneId} onChange={(e) => setPhoneId(e.target.value)} placeholder="e.g. 10928374659201" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">WABA ID <span className="text-red-500">*</span></label>
                    <input type="text" value={wabaId} onChange={(e) => setWabaId(e.target.value)} placeholder="e.g. 991827364501" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Permanent Access Token <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input type={showToken ? "text" : "password"} value={token} onChange={(e) => setToken(e.target.value)} placeholder="EAAG..." required className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                      <button type="button" onClick={() => setShowToken(!showToken)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                        {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50/50 dark:bg-indigo-500/5 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                  <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-2">Webhook Configuration</h4>
                  <p className="text-xs text-indigo-700 dark:text-indigo-400/80 mb-3">Set this callback URL in your Meta App Dashboard:</p>
                  <code className="block w-full p-3 bg-white dark:bg-slate-900 rounded-lg border border-indigo-200 dark:border-indigo-500/30 text-xs font-mono font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    {typeof window !== "undefined" ? `${window.location.origin}/api/whatsapp/webhook` : "https://your-domain.com/api/whatsapp/webhook"}
                  </code>
                  <p className="text-xs text-indigo-700 dark:text-indigo-400/80">Verify Token: <strong className="text-indigo-900 dark:text-indigo-300">{webhookToken}</strong></p>
                </div>

                <div>
                  <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-xl text-sm font-bold shadow-md transition-all">
                    {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? "Saving..." : "Save Meta Credentials"}
                  </button>
                </div>
              </form>
            </div>

            {/* Test Message Section */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-md font-bold text-gray-900 dark:text-white mb-3">Test Connection</h3>
              <p className="text-sm text-gray-500 mb-4">Send a "espon_test_message" test template to verify your Meta API connection is working properly.</p>
              
              {testResultMsg && (
                <div className={`mb-4 p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${testResultMsg.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {testResultMsg.success ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  <span>{testResultMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleSendTestMessage} className="flex gap-3">
                 <input type="text" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="Recipient Phone (e.g. 919876543210)" required className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                 <button type="submit" disabled={sendingTest || !isConnected} className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 disabled:bg-gray-400 disabled:dark:bg-gray-700 rounded-xl text-sm font-bold shadow-sm transition-all">
                    {sendingTest ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                    {sendingTest ? "Sending..." : "Send Test Message"}
                 </button>
              </form>
            </div>
          </div>

                  </div>
      )}
      {activeTab === "shopify" && (
        <div className="flex flex-col gap-8 w-full max-w-7xl">
          {/* Shopify Integration Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden mt-2">
            <div className="border-b border-gray-100 dark:border-slate-700 p-6 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg"><Store size={20} /></div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white m-0">Shopify Integration</h2>
                <p className="text-sm text-gray-500 m-0 mt-0.5">Sync your Shopify catalog directly into Whatmore.</p>
              </div>
            </div>

            <div className="p-6">
              {shopifyResultMsg && (
                <div className={`mb-6 p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${shopifyResultMsg.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {shopifyResultMsg.success ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  <span>{shopifyResultMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveShopifyCredentials} className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Shopify Store Domain</label>
                    <input type="text" value={shopifyDomain} onChange={(e) => setShopifyDomain(e.target.value)} placeholder="e.g. mystore.myshopify.com" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                    <p className="text-xs text-gray-400 mt-1">Leave blank to use the manual Catalog Maker.</p>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Admin API Access Token</label>
                    <div className="relative">
                      <input type={showShopifyToken ? "text" : "password"} value={shopifyToken} onChange={(e) => setShopifyToken(e.target.value)} placeholder="shpat_..." className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                      <button type="button" onClick={() => setShowShopifyToken(!showShopifyToken)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                        {showShopifyToken ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <button type="submit" disabled={savingShopify} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-xl text-sm font-bold shadow-md transition-all">
                    {savingShopify ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                    {savingShopify ? "Connecting..." : "Connect Shopify Store"}
                  </button>
                </div>
              </form>
            </div>
          </div>

                  </div>
      )}
      {activeTab === "payment" && (
        <div className="flex flex-col gap-8 w-full max-w-7xl">
          {/* Payment Gateway Integration */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-violet-100 dark:bg-violet-500/20 rounded-xl">
                <span className="text-2xl">💳</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Payment Gateway Integration</h2>
                <p className="text-sm text-gray-500">Connect Razorpay or Cashfree. Only 1 gateway can be active at a time — it auto-syncs to all Payment blocks in the Chatbot Builder.</p>
              </div>
            </div>

            {pgMsg && (
              <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                pgMsg.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>{pgMsg}</div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Razorpay Card */}
              <div className={`rounded-2xl border-2 p-5 transition-all ${
                pgActiveGateway === 'RAZORPAY' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/5' : 'border-gray-100 dark:border-slate-700'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs">RZP</div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">Razorpay</h3>
                      <p className="text-xs text-gray-500">India's most popular gateway</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const next = pgActiveGateway === 'RAZORPAY' ? null : 'RAZORPAY';
                      setPgActiveGateway(next);
                      await savePaymentGatewaySettings({ activeGateway: next, razorpayKeyId, razorpayKeySecret, cashfreeAppId, cashfreeSecretKey });
                      setPgMsg(next ? '✅ Razorpay set as active gateway' : '✅ Gateway deactivated');
                      setTimeout(() => setPgMsg(null), 3000);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      pgActiveGateway === 'RAZORPAY' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    {pgActiveGateway === 'RAZORPAY' ? '✅ Active' : 'Set Active'}
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-1">Key ID</label>
                    <input type="text" value={razorpayKeyId} onChange={(e) => setRazorpayKeyId(e.target.value)} placeholder="rzp_live_..." className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-1">Key Secret</label>
                    <div className="relative">
                      <input type={showRzpSecret ? "text" : "password"} value={razorpayKeySecret} onChange={(e) => setRazorpayKeySecret(e.target.value)} placeholder="••••••••••••••••" className="w-full pl-3 pr-10 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      <button type="button" onClick={() => setShowRzpSecret(!showRzpSecret)} className="absolute right-3 top-2.5 text-gray-400">{showRzpSecret ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                    </div>
                  </div>
                  <button onClick={async () => { setSavingPg(true); await savePaymentGatewaySettings({ activeGateway: pgActiveGateway, razorpayKeyId, razorpayKeySecret, cashfreeAppId, cashfreeSecretKey }); setSavingPg(false); setPgMsg('✅ Razorpay credentials saved'); setTimeout(() => setPgMsg(null), 3000); }} disabled={savingPg} className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all flex items-center justify-center gap-2">
                    {savingPg ? <RefreshCw size={14} className="animate-spin"/> : <Save size={14}/>} Save Razorpay Keys
                  </button>
                </div>
              </div>

              {/* Cashfree Card */}
              <div className={`rounded-2xl border-2 p-5 transition-all ${
                pgActiveGateway === 'CASHFREE' ? 'border-green-500 bg-green-50/50 dark:bg-green-500/5' : 'border-gray-100 dark:border-slate-700'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center text-white font-bold text-xs">CF</div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">Cashfree</h3>
                      <p className="text-xs text-gray-500">Fast settlements & lower MDR</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const next = pgActiveGateway === 'CASHFREE' ? null : 'CASHFREE';
                      setPgActiveGateway(next);
                      await savePaymentGatewaySettings({ activeGateway: next, razorpayKeyId, razorpayKeySecret, cashfreeAppId, cashfreeSecretKey });
                      setPgMsg(next ? '✅ Cashfree set as active gateway' : '✅ Gateway deactivated');
                      setTimeout(() => setPgMsg(null), 3000);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      pgActiveGateway === 'CASHFREE' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-green-50 hover:text-green-600'
                    }`}
                  >
                    {pgActiveGateway === 'CASHFREE' ? '✅ Active' : 'Set Active'}
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-1">App ID</label>
                    <input type="text" value={cashfreeAppId} onChange={(e) => setCashfreeAppId(e.target.value)} placeholder="CF App ID" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-1">Secret Key</label>
                    <div className="relative">
                      <input type={showCfSecret ? "text" : "password"} value={cashfreeSecretKey} onChange={(e) => setCashfreeSecretKey(e.target.value)} placeholder="••••••••••••••••" className="w-full pl-3 pr-10 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                      <button type="button" onClick={() => setShowCfSecret(!showCfSecret)} className="absolute right-3 top-2.5 text-gray-400">{showCfSecret ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                    </div>
                  </div>
                  <button onClick={async () => { setSavingPg(true); await savePaymentGatewaySettings({ activeGateway: pgActiveGateway, razorpayKeyId, razorpayKeySecret, cashfreeAppId, cashfreeSecretKey, merchantUpiId, merchantUpiName }); setSavingPg(false); setPgMsg('✅ Cashfree credentials saved'); setTimeout(() => setPgMsg(null), 3000); }} disabled={savingPg} className="w-full py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-all flex items-center justify-center gap-2">
                    {savingPg ? <RefreshCw size={14} className="animate-spin"/> : <Save size={14}/>} Save Cashfree Keys
                  </button>
                </div>
              </div>

              {/* Direct UPI Card */}
              <div className={`rounded-2xl border-2 p-5 transition-all ${
                pgActiveGateway === 'UPI' ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-500/5' : 'border-gray-100 dark:border-slate-700'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold text-xs">UPI</div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">Direct UPI</h3>
                      <p className="text-xs text-gray-500">Zero fees via direct QR/Link</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const next = pgActiveGateway === 'UPI' ? null : 'UPI';
                      setPgActiveGateway(next);
                      await savePaymentGatewaySettings({ activeGateway: next, razorpayKeyId, razorpayKeySecret, cashfreeAppId, cashfreeSecretKey, merchantUpiId, merchantUpiName });
                      setPgMsg(next ? '✅ Direct UPI set as active gateway' : '✅ Gateway deactivated');
                      setTimeout(() => setPgMsg(null), 3000);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      pgActiveGateway === 'UPI' ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    {pgActiveGateway === 'UPI' ? '✅ Active' : 'Set Active'}
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-1">UPI ID (VPA)</label>
                    <input type="text" value={merchantUpiId} onChange={(e) => setMerchantUpiId(e.target.value)} placeholder="e.g. yourname@okicici" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-1">Payee Name</label>
                    <input type="text" value={merchantUpiName} onChange={(e) => setMerchantUpiName(e.target.value)} placeholder="e.g. Your Business Name" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                  </div>
                  <button onClick={async () => { setSavingPg(true); await savePaymentGatewaySettings({ activeGateway: pgActiveGateway, razorpayKeyId, razorpayKeySecret, cashfreeAppId, cashfreeSecretKey, merchantUpiId, merchantUpiName }); setSavingPg(false); setPgMsg('✅ Direct UPI details saved'); setTimeout(() => setPgMsg(null), 3000); }} disabled={savingPg} className="w-full py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold transition-all flex items-center justify-center gap-2">
                    {savingPg ? <RefreshCw size={14} className="animate-spin"/> : <Save size={14}/>} Save UPI Details
                  </button>
                </div>
              </div>
            </div>

            {pgActiveGateway && (
              <div className="mt-4 px-4 py-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl text-sm text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                <CheckCircle2 size={16}/>
                <span><strong>{pgActiveGateway === 'RAZORPAY' ? 'Razorpay' : pgActiveGateway === 'CASHFREE' ? 'Cashfree' : 'Direct UPI'}</strong> is the active gateway — auto-synced to all Payment blocks in the Chatbot Builder.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "webhooks" && (
        <div className="flex flex-col gap-8 w-full max-w-7xl">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Custom Webhooks</h3>
                <p className="text-sm text-slate-500">Configure webhooks to push leads or data to your CRM, ERP or Zapier.</p>
              </div>
              <button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 text-sm">
                <Plus size={16} /> Add Webhook
              </button>
            </div>

            <div className="flex gap-2 mb-6">
              {['ALL', 'CRM_LEAD', 'ERP', 'PAYMENT', 'ZAPIER', 'META_CAPI'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryTab(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${activeCategoryTab === cat ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  {cat === 'ALL' ? 'All Integrations' : cat === 'META_CAPI' ? 'Meta CAPI' : cat.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">URL</th>
                    <th className="px-4 py-3 font-semibold">Token</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingWebhooks ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
                  ) : filteredWebhooks.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No webhooks found.</td></tr>
                  ) : (
                    filteredWebhooks.map(hook => (
                      <tr key={hook.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-800">{hook.name}</td>
                        <td className="px-4 py-3">
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold">{hook.type}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">{hook.url}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                           {hook.token ? (
                             <span className="px-2 py-1 bg-green-50 text-green-700 rounded border border-green-200 text-xs font-medium">Secured</span>
                           ) : (
                             <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded border border-gray-200 text-xs">None</span>
                           )}
                        </td>
                        <td className="px-4 py-3 text-right flex justify-end gap-2">
                          <button onClick={() => handleOpenModal(hook)} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded"><Edit3 size={15} /></button>
                          <button onClick={() => handleDeleteIntegration(hook.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded"><Trash2 size={15} /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {isModalOpen && (
              <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                  <div className="flex justify-between items-center p-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">{editingId ? 'Edit Webhook' : 'Add Webhook'}</h3>
                    <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleSubmitIntegration} className="p-4 flex flex-col gap-4">
                    {formData.type === 'META_CAPI' && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3.5 text-xs text-slate-700 flex flex-col gap-2.5 shadow-sm">
                        <div className="flex items-center gap-1.5 font-bold text-blue-900 text-sm">
                          <Sparkles size={16} className="text-blue-600" />
                          <span>Meta CAPI Permanent Token & Pixel Guide</span>
                        </div>
                        <div className="space-y-2 text-[11.5px] leading-relaxed">
                          <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
                            <strong className="text-blue-950 block mb-0.5">1. Get Meta Pixel / Dataset ID:</strong>
                            Open <a href="https://business.facebook.com/events_manager2" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline hover:text-blue-800 inline-flex items-center gap-0.5">Meta Events Manager <ExternalLink size={11} /></a>, select your dataset/pixel and copy the 15-digit ID.
                          </div>
                          <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
                            <strong className="text-blue-950 block mb-0.5">2. Create System User & Connect Meta App:</strong>
                            Go to <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline hover:text-blue-800 inline-flex items-center gap-0.5">Meta Business Settings → System Users <ExternalLink size={11} /></a>
                            <ul className="list-disc list-inside text-slate-600 mt-1 space-y-0.5 text-[11px]">
                              <li>Click <strong>Add</strong> → Name: <em>WhatsApp Bot Admin</em> (Role: Admin).</li>
                              <li>If asked for a Meta App, go to <a href="https://business.facebook.com/settings/apps" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline hover:text-blue-800 inline-flex items-center gap-0.5">Business Settings → Apps <ExternalLink size={11} /></a> and click <strong>Add App</strong>.</li>
                              <li>Under System User, click <strong>Assign Assets</strong> → Assign both your <strong>Meta App</strong> and <strong>Pixel/Dataset</strong> with <em>Full Control</em>.</li>
                              <li>Click <strong>Generate New Token</strong> → Select your Meta App.</li>
                              <li>Select permissions: <code>ads_management</code> & <code>event_management</code>.</li>
                              <li>Copy the permanent token (starts with <code>EAAI...</code>).</li>
                            </ul></div>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
                      <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500">
                        <option value="CRM_LEAD">CRM (Lead Webhook)</option>
                        <option value="ERP">ERP</option>
                        <option value="PAYMENT">Payment</option>
                        <option value="ZAPIER">Zapier / Webhook</option>
                        <option value="META_CAPI">Meta Conversions API</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Name</label>
                      <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" placeholder="e.g. ERP Push / Pixel 1" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">{formData.type === 'META_CAPI' ? 'Meta Pixel ID' : 'Webhook URL'}</label>
                      <input type={formData.type === 'META_CAPI' ? 'text' : 'url'} value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 font-mono" placeholder={formData.type === 'META_CAPI' ? 'e.g. 1234567890' : 'https://...'} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">{formData.type === 'META_CAPI' ? 'Access Token' : 'Auth Token (Optional)'}</label>
                      <input type="text" value={formData.token} onChange={e => setFormData({...formData, token: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 font-mono" placeholder={formData.type === 'META_CAPI' ? 'EAAI...' : 'Bearer ...'} required={formData.type === 'META_CAPI'} />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button type="button" onClick={handleCloseModal} className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-600">Cancel</button>
                      <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700">Save</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}