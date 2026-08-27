"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare, LayoutDashboard, Bot, ShoppingBag, Key, Activity, Box
} from "lucide-react";
import "./WhatsAppHeaderNav.css";
import { getWhatsAppDashboardMetrics } from "@/app/actions/whatsAppPlatformActions";

const subNavItems = [
  { name: "Dashboard", path: "/whatsapp/dashboard", icon: LayoutDashboard },
  { name: "Inbox", path: "/whatsapp/inbox", icon: MessageSquare },
  { name: "AI Automation", path: "/whatsapp/ai-automation", icon: Bot, highlight: true },
  { name: "Products & Prices", path: "/whatsapp/commerce", icon: Box },
  { name: "Settings", path: "/whatsapp/api-settings", icon: Key },
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
      </div>

      <nav className="whatmore-nav">
        {subNavItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-item ${active ? "active" : ""} ${item.highlight ? "highlight" : ""}`}
            >
              <Icon size={16} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
