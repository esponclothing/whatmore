"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare, LayoutDashboard, Bot, ShoppingBag, Key, Activity, Box, GitBranch, FileCode, Zap
} from "lucide-react";
import "./WhatsAppHeaderNav.css";
import { getWhatsAppDashboardMetrics } from "@/app/actions/whatsAppPlatformActions";

const subNavItems = [
  { name: "Dashboard", path: "/whatsapp/dashboard", icon: LayoutDashboard },
  { name: "Inbox", path: "/whatsapp/inbox", icon: MessageSquare },
  { name: "AI Automation", path: "/whatsapp/ai-automation", icon: Bot, highlight: true },
  { name: "Chatbot Builder", path: "/whatsapp/chatbot-builder", icon: GitBranch },
  { name: "Meta Flows", path: "/whatsapp/flows", icon: Zap },
  { name: "Templates", path: "/whatsapp/templates", icon: FileCode },
  { name: "Products & Prices", path: "/whatsapp/commerce", icon: Box },
  { name: "Settings", path: "/whatsapp/api-settings", icon: Key },
  { name: "Logs", path: "/whatsapp/logs", icon: Activity },
];

export default function WhatsAppHeaderNav() {
  const pathname = usePathname();
  const [accountInfo, setAccountInfo] = React.useState<any>({
    status: "NOT CONNECTED",
    phoneNumber: "Not Configured",
    isConnected: false
  });

  React.useEffect(() => {
    getWhatsAppDashboardMetrics().then((res) => {
      if (res.success && res.account) {
        setAccountInfo({
          status: res.account.status || "NOT CONNECTED",
          phoneNumber: res.account.phoneNumber || "Not Configured",
          isConnected: res.isConnected || false
        });
      }
    });
  }, []);

  const isItemActive = (path: string) => {
    if (path === "/whatsapp/inbox" && (pathname === "/whatsapp" || pathname === "/whatsapp/inbox")) {
      return true;
    }
    return pathname.startsWith(path);
  };

  const [userName, setUserName] = React.useState("");
  const [userRole, setUserRole] = React.useState("");
  React.useEffect(() => {
    try {
      const u = document.cookie.split(";").find(c => c.trim().startsWith("wm_user="));
      if (u) { 
        const v = decodeURIComponent(u.split("=")[1]); 
        const parsed = JSON.parse(v);
        setUserName(parsed.name || ""); 
        setUserRole(parsed.role || "");
      }
    } catch {}
  }, []);
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <header className="whatmore-header">
      <div className="whatmore-header-top">
        <div className="whatmore-brand">
          <div className="brand-logo">
            <ShoppingBag size={24} strokeWidth={2.5} />
          </div>
          <div className="brand-text">
            <h1>Whatmore</h1>
            <p>Unified Commerce & Automation</p>
          </div>
        </div>
        
        <Link
          href="/whatsapp/api-settings"
          className={`status-badge ${accountInfo.isConnected ? "active" : "inactive"}`}
        >
          <span className="pulse-dot"></span>
          <span>WhatsApp API: {accountInfo.status}</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "12px" }}>
          {userName && <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{userName}</span>}
          <button onClick={handleLogout} style={{ padding: "5px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#f87171", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Sign Out</button>
        </div>
      </div>

      <nav className="whatmore-nav">
        {subNavItems.map((item) => {
          if (userRole === "AGENT" && item.name !== "Inbox" && item.name !== "Settings") return null;
          const Icon = item.icon;
          const active = isItemActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-item ${active ? "active" : ""} ${item.highlight ? "highlight" : ""}`}
            >
              <Icon size={16} />
              <span>{userRole === "AGENT" && item.name === "Settings" ? "My Profile" : item.name}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

