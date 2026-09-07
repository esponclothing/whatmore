"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FileCode, Radio, Zap, Bot, Users } from "lucide-react";
import WhatsAppTemplatesComponent from "@/components/whatsapp/WhatsAppTemplatesComponent";
import WhatsAppBroadcastsComponent from "@/components/whatsapp/WhatsAppBroadcastsComponent";
import WhatsAppFlowsComponent from "@/components/whatsapp/WhatsAppFlowsComponent";
import WhatsAppChatbotsComponent from "@/components/whatsapp/WhatsAppChatbotsComponent";
import WhatsAppContactsComponent from "@/components/whatsapp/WhatsAppContactsComponent";

interface WhatsAppHubProps {
  initialTab?: "templates" | "broadcasts" | "flows" | "chatbots" | "contacts";
}

function WhatsAppHubContent({ initialTab = "templates" }: WhatsAppHubProps) {
  const searchParams = useSearchParams();
  const tabFromQuery = searchParams.get("tab") as "templates" | "broadcasts" | "flows" | "chatbots" | "contacts" | null;

  const validTabs = ["templates", "broadcasts", "flows", "chatbots", "contacts"];

  const [activeTab, setActiveTab] = useState<"templates" | "broadcasts" | "flows" | "chatbots" | "contacts">(
    tabFromQuery && validTabs.includes(tabFromQuery)
      ? tabFromQuery
      : initialTab
  );

  useEffect(() => {
    if (tabFromQuery && validTabs.includes(tabFromQuery)) {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery]);

  const handleTabChange = (tab: "templates" | "broadcasts" | "flows" | "chatbots" | "contacts") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  };

  return (
    <div className="p-8 w-full max-w-none flex flex-col gap-6">
      {/* Header title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-1">
          WhatsApp Hub
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Manage Meta-approved templates, broadcast campaigns, interactive flows, automated chatbots, and CRM contacts.
        </p>
      </div>

      {/* Tabs list bar */}
      <nav className="-mb-px flex space-x-8 overflow-x-auto border-b border-gray-200 dark:border-slate-700">
        <button
          onClick={() => handleTabChange("templates")}
          className={`px-5 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "templates"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <FileCode size={16} /> Templates
        </button>

        <button
          onClick={() => handleTabChange("broadcasts")}
          className={`px-5 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "broadcasts"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <Radio size={16} /> Broadcasts
        </button>

        <button
          onClick={() => handleTabChange("flows")}
          className={`px-5 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "flows"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <Zap size={16} /> Meta Flows
        </button>

        <button
          onClick={() => handleTabChange("chatbots")}
          className={`px-5 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "chatbots"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <Bot size={16} /> Chatbots
        </button>

        <button
          onClick={() => handleTabChange("contacts")}
          className={`px-5 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "contacts"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <Users size={16} /> Contacts
        </button>
      </nav>

      {/* Tab Panels */}
      <div className="w-full">
        {activeTab === "templates" && <WhatsAppTemplatesComponent />}
        {activeTab === "broadcasts" && <WhatsAppBroadcastsComponent />}
        {activeTab === "flows" && <WhatsAppFlowsComponent />}
        {activeTab === "chatbots" && <WhatsAppChatbotsComponent />}
        {activeTab === "contacts" && <WhatsAppContactsComponent />}
      </div>
    </div>
  );
}

export default function WhatsAppHubComponent(props: WhatsAppHubProps) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading WhatsApp Hub...</div>}>
      <WhatsAppHubContent {...props} />
    </Suspense>
  );
}
