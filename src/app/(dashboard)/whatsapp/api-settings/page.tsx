"use client";

import React, { useState, useEffect } from "react";
import { Key, ShieldCheck, RefreshCw, CheckCircle2, AlertTriangle, Eye, EyeOff, Send, Save, ArrowRight, Store, MessageSquare } from "lucide-react";
import Link from "next/link";
import { getWhatsAppApiCredentialsAction, saveWhatsAppApiCredentialsAction, getShopifyCredentialsAction, saveShopifyCredentialsAction, sendWhatsAppHelloWorldAction, registerWhatsAppPhoneNumberAction } from "@/app/actions/whatsAppPlatformActions";

export default function WhatsAppAPISettingsPage() {
  const [wabaId, setWabaId] = useState("");
  const [phoneId, setPhoneId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [token, setToken] = useState("");
  const [webhookToken, setWebhookToken] = useState("espon_whatsapp_secure_webhook_token_2026");
  const [showToken, setShowToken] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

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

  useEffect(() => {
    Promise.all([
      getWhatsAppApiCredentialsAction(),
      getShopifyCredentialsAction()
    ]).then(([resWA, resShopify]) => {
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
      setLoading(false);
    });
  }, []);

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
    
    // Clean domain
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
    
    setSendingTest(true);
    setTestResultMsg(null);
    const res = await sendWhatsAppHelloWorldAction(testPhone);
    if (res.success) {
      setTestResultMsg({ success: true, text: "Test message sent successfully!" });
    } else {
      setTestResultMsg({ success: false, text: res.error || "Failed to send test message." });
    }
    setSendingTest(false);
  };

  const [registering, setRegistering] = useState(false);
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

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-8 w-full">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-1">Integrations & API Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Configure your Meta WhatsApp API credentials and external eCommerce platforms.</p>
      </div>

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
            <span className={`px-3 py-2 text-xs font-bold rounded-lg ${isConnected ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              Ã¢€”Â {isConnected ? "CONNECTED" : "NOT CONNECTED"}
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
          <p className="text-sm text-gray-500 mb-4">Send a "hello_world" test template to verify your Meta API connection is working properly.</p>
          
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
  );
}
