"use client";

import React, { useState, useEffect } from "react";
import { Key, ShieldCheck, RefreshCw, CheckCircle2, AlertTriangle, Eye, EyeOff, Send, Save, ArrowRight, Store, MessageSquare, Users, Bot, Layers, BookOpen } from "lucide-react";
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
  getCRMCustomersAction,
  createCRMCustomerAction
} from "@/app/actions/whatsAppPlatformActions";

export default function WhatsAppAPISettingsPage() {
  const [activeTab, setActiveTab] = useState("integrations");

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
  const [activeModel, setActiveModel] = useState("gemini-2.5-flash");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [savingAI, setSavingAI] = useState(false);
  const [aiResultMsg, setAiResultMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Team & SLA States
  const [workingHoursStart, setWorkingHoursStart] = useState("09:00");
  const [workingHoursEnd, setWorkingHoursEnd] = useState("19:00");
  const [slaMinutes, setSlaMinutes] = useState(15);
  const [autoAssignStrategy, setAutoAssignStrategy] = useState("ROUND_ROBIN");
  const [savingSLA, setSavingSLA] = useState(false);
  const [slaResultMsg, setSlaResultMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // CRM Contacts States
  const [crmContacts, setCrmContacts] = useState<any[]>([]);
  const [crmSearch, setCrmSearch] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactType, setNewContactType] = useState("Retailer");
  const [savingCRM, setSavingCRM] = useState(false);
  const [crmResultMsg, setCrmResultMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Facebook Register state
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = () => {
    Promise.all([
      getWhatsAppApiCredentialsAction(),
      getShopifyCredentialsAction(),
      getWhatsAppSettingsAction(),
      getTeamMembersAction(),
      getCRMCustomersAction()
    ]).then(([resWA, resShopify, resSettings, resTeam, resCRM]) => {
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
        setActiveModel(resSettings.settings.aiModel || "gemini-2.5-flash");
        setSystemPrompt(resSettings.settings.aiSystemPrompt || "");
        setWorkingHoursStart(resSettings.settings.workingHoursStart || "09:00");
        setWorkingHoursEnd(resSettings.settings.workingHoursEnd || "19:00");
        setSlaMinutes(resSettings.settings.slaWarningMinutes || 15);
        setAutoAssignStrategy(resSettings.settings.autoAssignStrategy || "ROUND_ROBIN");
      }
      if (resTeam.success && resTeam.employees) {
        setTeamMembers(resTeam.employees);
      }
      if (resCRM.success && resCRM.customers) {
        setCrmContacts(resCRM.customers);
      }
      setLoading(false);
    });
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
      setAiResultMsg({ success: true, text: "✓ Gemini AI parameters configured successfully!" });
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
      setSlaResultMsg({ success: true, text: "✓ SLA and Work hours targets configured!" });
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
      setCrmResultMsg({ success: true, text: `✓ Customer "${newContactName}" registered successfully!` });
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

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading settings directory...</div>;
  }

  return (
    <div className="p-8 w-full max-w-none flex flex-col gap-8">
      {/* Header title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-1">Settings & Directory</h1>
        <p className="text-gray-500 dark:text-gray-400">Configure core external APIs, Gemini LLM cascades, team members auto-routing and CRM contact list.</p>
      </div>

      {/* Tabs list bar */}
      <div className="flex border-b border-gray-200 dark:border-slate-700 gap-1">
        <button
          onClick={() => setActiveTab("integrations")}
          className={`px-5 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "integrations" 
              ? "border-indigo-600 text-indigo-600" 
              : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300"
          }`}
        >
          <Layers size={16} />
          <span>🔌 Integrations</span>
        </button>

        <button
          onClick={() => setActiveTab("gemini-ai")}
          className={`px-5 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "gemini-ai" 
              ? "border-indigo-600 text-indigo-600" 
              : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300"
          }`}
        >
          <Bot size={16} />
          <span>✨ Gemini AI API</span>
        </button>

        <button
          onClick={() => setActiveTab("team-sla")}
          className={`px-5 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "team-sla" 
              ? "border-indigo-600 text-indigo-600" 
              : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300"
          }`}
        >
          <Users size={16} />
          <span>👥 Team & SLA</span>
        </button>

        <button
          onClick={() => setActiveTab("crm-contacts")}
          className={`px-5 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "crm-contacts" 
              ? "border-indigo-600 text-indigo-600" 
              : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300"
          }`}
        >
          <BookOpen size={16} />
          <span>📒 CRM Contacts</span>
        </button>
      </div>

      {/* 1. Integrations tab */}
      {activeTab === "integrations" && (
        <div className="flex flex-col gap-8 w-full max-w-4xl">
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

      {/* 2. Gemini AI API Tab */}
      {activeTab === "gemini-ai" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 flex flex-col gap-6 w-full max-w-4xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">✨ Gemini AI Configuration</h2>
            <p className="text-sm text-gray-500">Configure your Google Gemini API Key and system prompts to guide your AI responder chatbot.</p>
          </div>

          {aiResultMsg && (
            <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${aiResultMsg.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              <CheckCircle2 size={18} />
              <span>{aiResultMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveAISettings} className="flex flex-col gap-5">
            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Gemini API Key</label>
              <input 
                type="password" 
                value={geminiKey} 
                onChange={(e) => setGeminiKey(e.target.value)} 
                placeholder="AIzaSy..." 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
              <p className="text-xs text-gray-400 mt-1">If blank, the system fallback environment variable will be used.</p>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">AI Welcome Message</label>
              <input 
                type="text" 
                value={welcomeMsg} 
                onChange={(e) => setWelcomeMsg(e.target.value)} 
                placeholder="Welcome! How can we help you today?" 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">AI Model Selection</label>
              <select 
                value={activeModel} 
                onChange={(e) => setActiveModel(e.target.value)} 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="gemini-3.6-flash">Gemini 3.6 Flash (Primary - Fastest)</option>
                <option value="gemini-3.5-flash">Gemini 3.5 Flash (Fallback 1)</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Fallback 2)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">AI Agent System Prompts / Instructions</label>
              <textarea 
                value={systemPrompt} 
                onChange={(e) => setSystemPrompt(e.target.value)} 
                rows={6}
                placeholder="e.g. You are a helpful sales assistant for Espon Sports..." 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
              />
            </div>

            <div>
              <button type="submit" disabled={savingAI} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-xl text-sm font-bold shadow-md transition-all">
                {savingAI ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                {savingAI ? "Saving..." : "Save AI Configuration"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Team & SLA Tab */}
      {activeTab === "team-sla" && (
        <div className="flex flex-col gap-6 w-full max-w-4xl">
          {/* SLA Settings Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">⏰ Work Hours & SLA Targets</h2>
            <p className="text-sm text-gray-500 mb-6">Configure SLA breach thresholds, assignment strategies, and working hours.</p>

            {slaResultMsg && (
              <div className={`mb-4 p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${slaResultMsg.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                <CheckCircle2 size={18} />
                <span>{slaResultMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveSLASettings} className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Working Hours Start</label>
                  <input type="time" value={workingHoursStart} onChange={(e) => setWorkingHoursStart(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Working Hours End</label>
                  <input type="time" value={workingHoursEnd} onChange={(e) => setWorkingHoursEnd(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">SLA Response Threshold (Minutes)</label>
                  <input type="number" value={slaMinutes} onChange={(e) => setSlaMinutes(parseInt(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Auto Assignment Strategy</label>
                  <select value={autoAssignStrategy} onChange={(e) => setAutoAssignStrategy(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="ROUND_ROBIN">Round Robin (Equal distribution among active reps)</option>
                    <option value="LEAST_ASSIGNED">Least Assigned (Assign to agent with fewest open chats)</option>
                    <option value="MANUAL">Manual Routing (Self-assign in inbox)</option>
                  </select>
                </div>
              </div>

              <div>
                <button type="submit" disabled={savingSLA} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-xl text-sm font-bold shadow-md transition-all">
                  {savingSLA ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                  {savingSLA ? "Saving..." : "Save SLA Configuration"}
                </button>
              </div>
            </form>
          </div>

          {/* Team Members List Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">👥 Team Directory</h2>
            <p className="text-sm text-gray-500 mb-6">Manage organization agents and reps assigned to WhatsApp ticket routing.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700 text-gray-500 font-semibold">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700 bg-white dark:bg-slate-900">
                  {teamMembers.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                      <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">{m.user?.name || "Agent"}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{m.user?.email || "N/A"}</td>
                      <td className="py-3 px-4 text-gray-500">{m.designation || "Support Rep"}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${m.employmentStatus === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {m.employmentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {teamMembers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400">No agents registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. CRM Contacts Tab */}
      {activeTab === "crm-contacts" && (
        <div className="flex flex-col gap-6 w-full max-w-4xl">
          {/* Add Contact Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">📝 Add CRM Customer</h2>
            <p className="text-sm text-gray-500 mb-6">Create new profile contacts to automatically map WhatsApp inbox sender identities.</p>

            {crmResultMsg && (
              <div className={`mb-4 p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${crmResultMsg.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                <CheckCircle2 size={18} />
                <span>{crmResultMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateCRMContact} className="grid grid-cols-3 gap-5">
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Customer Name</label>
                <input type="text" value={newContactName} onChange={(e) => setNewContactName(e.target.value)} required placeholder="e.g. Ashish Goyal" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Phone Number</label>
                <input type="text" value={newContactPhone} onChange={(e) => setNewContactPhone(e.target.value)} required placeholder="e.g. 919876543210" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Customer Type</label>
                <select value={newContactType} onChange={(e) => setNewContactType(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="Retailer">Retailer</option>
                  <option value="Wholesaler">Wholesaler</option>
                  <option value="VIP">VIP Customer</option>
                </select>
              </div>
              <div className="col-span-3 flex justify-end">
                <button type="submit" disabled={savingCRM} className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-xl text-sm font-bold shadow-md transition-all">
                  {savingCRM ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                  Add CRM Customer
                </button>
              </div>
            </form>
          </div>

          {/* Contacts Directory List Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white m-0">📒 CRM Contact List</h2>
                <p className="text-sm text-gray-500 m-0">Search customer details synced inside Whatmore database.</p>
              </div>
              <input 
                type="text" 
                value={crmSearch} 
                onChange={(e) => setCrmSearch(e.target.value)} 
                placeholder="Search contact person, phone..." 
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-72" 
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700 text-gray-500 font-semibold">
                    <th className="py-3 px-4">Contact Name</th>
                    <th className="py-3 px-4">Mobile</th>
                    <th className="py-3 px-4">Customer Type</th>
                    <th className="py-3 px-4">City</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700 bg-white dark:bg-slate-900">
                  {crmContacts
                    .filter(c => 
                      String(c.contactPerson || '').toLowerCase().includes(crmSearch.toLowerCase()) || 
                      String(c.mobile || '').includes(crmSearch)
                    )
                    .map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                        <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">{c.contactPerson}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{c.mobile}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            c.customerType === "Wholesaler" ? "bg-amber-100 text-amber-700" :
                            c.customerType === "VIP" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {c.customerType || "Retailer"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500">{c.city || "Not set"}</td>
                      </tr>
                    ))}
                  {crmContacts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400">No CRM contacts found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
