"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Zap,
  MessageSquare,
  Bot,
  Package,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  ShoppingBag,
  TrendingUp,
  Cpu,
  Layers,
  Send,
  Phone,
  Mail,
  Building2,
  Users,
  Clock,
  ChevronDown,
  Globe,
  Radio,
  Sliders,
  Check,
  Percent,
  Star,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Lock,
  Headphones,
  Smartphone,
  Flame,
  Award,
  BarChart3
} from "lucide-react";
import { getActiveBrand, BrandConfig } from "@/lib/brandConfig";
import { submitPlatformLeadAction } from "@/app/actions/leadActions";

export default function LandingPageClient({ brandOverride }: { brandOverride?: BrandConfig }) {
  const brand = brandOverride || getActiveBrand();
  const isWhatIn = brand.code === "WHATIN";

  // Billing toggle (Monthly vs Annual with 20% discount)
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUALLY">("MONTHLY");

  // Interactive 3D Simulator Tab
  const [simulatorTab, setSimulatorTab] = useState<"AI_ORDER" | "PINCODE_FETCH" | "CATALOG_FLOW" | "PAYMENT_UPI">("AI_ORDER");

  // Lead Capture Form State
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    mobile: "",
    email: "",
    selectedPlan: "GROWTH",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<{ id: string; name: string } | null>(null);
  const [formError, setFormError] = useState("");

  // FAQ Accordion State (open question index)
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSelectPlan = (planId: string) => {
    setForm(prev => ({ ...prev, selectedPlan: planId }));
    const element = document.getElementById("lead-capture-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    const res = await submitPlatformLeadAction({
      name: form.name,
      businessName: form.businessName,
      mobile: form.mobile,
      email: form.email,
      platform: brand.code,
      selectedPlan: form.selectedPlan,
      message: form.message
    });

    setSubmitting(false);

    if (res.success && res.leadId) {
      setSubmittedLead({ id: res.leadId, name: res.name || form.name });
    } else {
      setFormError(res.error || "Failed to submit inquiry. Please try again.");
    }
  };

  const pricingTiers = [
    {
      id: "BASIC",
      name: "Basic",
      badge: "Starter Launch Offer",
      monthlyPrice: 1999,
      annualPrice: 1499,
      couponNote: "Use code SAVE500 for ₹500 OFF",
      description: "Perfect for emerging retailers & support teams launching multi-agent WhatsApp chat & visual chatbots.",
      messages: "5,000",
      aiReplies: "Included in Growth",
      agents: "5 Agents (incl. Admin)",
      features: [
        "Official Meta Cloud API v21.0 WABA",
        "5 Multi-Agent Unified Team Inbox",
        "Visual Drag-and-Drop Chatbot Builder",
        "Keyword Triggers & Auto-Replies",
        "Canned Responses & Quick Shortcuts",
        "Meta Approved Template Messaging"
      ],
      popular: false
    },
    {
      id: "GROWTH",
      name: "Growth",
      badge: "Most Popular 🔥",
      monthlyPrice: 3499,
      annualPrice: 2799,
      couponNote: "All-in-one Commerce & AI",
      description: "Complete WhatsApp E-Commerce powerhouse with autonomous AI sales agent, catalog checkout, and Shopify sync.",
      messages: "25,000",
      aiReplies: "2,500 AI Replies",
      agents: "10 Agents",
      features: [
        "Everything in Basic, plus:",
        "Smart AI Auto-Pilot Sales Agent (Gemini 3.8)",
        "Real-Time Shopify Bi-Directional Store Sync",
        "Native WhatsApp Interactive Catalog Checkout",
        "Cashfree & Razorpay In-Chat UPI QR & Links",
        "Automated Token Advance Partial COD Engine",
        "Hyper-Targeted Bulk Broadcast Campaigns",
        "AI Message Copilot & Suggestion Engine"
      ],
      popular: true
    },
    {
      id: "ENTERPRISE",
      name: "Enterprise VIP",
      badge: "Custom Scale & VIP 🚀",
      monthlyPrice: 0,
      annualPrice: 0,
      isCustomQuote: true,
      couponNote: "Client-Specific Tailored Setup",
      description: "Full scale for high-growth brands with server-side Meta CAPI, live website tracking, screen co-browsing, and developer APIs.",
      messages: "Custom / High Volume",
      aiReplies: "Custom AI Quotas",
      agents: "100 / Unlimited Agents",
      features: [
        "Everything in Growth, plus:",
        "Live Website Tracking & Embeddable Chat Widget",
        "Live Screen Co-Browsing & Real-Time Visitor Assist",
        "Meta Pixel & Conversions API (CAPI) Tracking",
        "Developer REST API & Outbound Webhooks",
        "Automated Meta Custom Audience Sync",
        "Custom CRM & ERP Webhook Integrations",
        "Dedicated Account Manager & Priority 24/7 SLA"
      ],
      popular: false
    }
  ];

  const faqs = [
    {
      q: "Do I need Meta Embedded Signup or can I use my existing WhatsApp Business Account?",
      a: "You do NOT need Meta Embedded Signup. Our platform connects directly to your Meta Cloud API credentials (WABA ID, Phone ID, and System User Token) in 2 minutes. We isolate your tenant credentials safely with end-to-end token encryption."
    },
    {
      q: "How does the Indian Pincode & Delivery Address Auto-Fetch work?",
      a: "When customers text their address in messy formats (e.g. in Hindi or English without clear line breaks), our Gemini AI extracts the person name, phone, street, landmark, city, state, and 6-digit postal code. It automatically verifies serviceability to prevent COD courier return rejections."
    },
    {
      q: "Can I connect my Shopify product catalog and live inventory?",
      a: "Yes! We provide full bi-directional Shopify sync. Products, stock quantities, and prices sync automatically into WhatsApp. Orders placed on WhatsApp are instantly created in your Shopify admin panel with tags, customer details, and shipping address."
    },
    {
      q: "How does the Partial COD Advance Payment work?",
      a: "You can automatically prompt customers to pay a small advance token deposit (e.g. ₹100 or 10%) via UPI or Razorpay link before dispatching COD. If paid, it deducts from the total bill and drastically reduces fake order cancellations and RTO returns."
    },
    {
      q: "Can multiple team members manage the WhatsApp inbox at once?",
      a: "Yes! All plans include multi-agent team inbox access. You can assign conversations to specific sales reps, add internal private notes, configure canned responses, and monitor real-time conversation metrics."
    }
  ];

  return (
    <div
      style={{ colorScheme: "light" }}
      className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-indigo-500 selection:text-white antialiased overflow-x-hidden font-sans relative"
    >
      {/* 🌈 Ambient 3D Mesh Gradients & Lighting */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Architectural Subtle Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:28px_28px] opacity-70 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_60%,transparent_100%)]" />

        {/* 3D Radiant Atmospheric Light Spheres */}
        <div
          className={`absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] ${
            isWhatIn ? "bg-gradient-to-b from-emerald-200/40 via-teal-100/30 to-transparent" : "bg-gradient-to-b from-indigo-200/45 via-purple-100/35 to-transparent"
          } rounded-full blur-[140px] opacity-80`}
        />
        <div className="absolute top-[35%] -left-48 w-[600px] h-[600px] bg-gradient-to-tr from-sky-200/40 via-indigo-100/30 to-transparent rounded-full blur-[130px] opacity-70" />
        <div className="absolute top-[50%] -right-48 w-[600px] h-[600px] bg-gradient-to-bl from-pink-200/35 via-purple-100/25 to-transparent rounded-full blur-[140px] opacity-70" />
        <div className="absolute bottom-20 left-1/3 w-[700px] h-[500px] bg-gradient-to-tr from-amber-100/30 via-indigo-100/25 to-transparent rounded-full blur-[150px] opacity-60" />
      </div>

      {/* 🧭 3D Floating Glassmorphic Top Navigation */}
      <header className="sticky top-3 z-50 px-4 sm:px-6 lg:px-10 transition-all">
        <div className="max-w-7xl mx-auto">
          <div className="h-17 px-4 sm:px-6 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04),0_1px_3px_rgb(0,0,0,0.03)] flex items-center justify-between gap-4 transition-all">
            
            {/* Brand Logo & 3D Jewel Pill */}
            <Link href="/" className="flex items-center gap-3 group focus:outline-none">
              <div
                className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${
                  isWhatIn
                    ? "from-emerald-500 via-teal-500 to-cyan-500 shadow-emerald-500/30"
                    : "from-indigo-600 via-purple-600 to-indigo-500 shadow-indigo-500/30"
                } flex items-center justify-center text-white shadow-lg group-hover:scale-105 group-hover:rotate-1 transition-all duration-300 ring-2 ring-white/80`}
              >
                <Sparkles size={20} className="text-amber-300 drop-shadow-sm" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xl tracking-tight bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 bg-clip-text text-transparent">
                    {brand.name}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isWhatIn
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs"
                        : "bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-xs"
                    }`}
                  >
                    AI Commerce
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-slate-500 hidden sm:block">
                  WhatsApp Business Cloud OS
                </p>
              </div>
            </Link>

            {/* Center Navigation Links */}
            <nav className="hidden lg:flex items-center gap-8 text-xs font-bold text-slate-600">
              <a href="#features" className="hover:text-indigo-600 transition-colors">
                Platform Features
              </a>
              <a href="#pincode-address" className="hover:text-indigo-600 transition-colors">
                Pincode & Address AI
              </a>
              <a href="#shopify-catalog" className="hover:text-indigo-600 transition-colors">
                Catalog & Shopify
              </a>
              <a href="#pricing" className="hover:text-indigo-600 transition-colors">
                Pricing Plans
              </a>
              <a href="#faq" className="hover:text-indigo-600 transition-colors">
                FAQ
              </a>
            </nav>

            {/* Action CTAs */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 border border-slate-200/80 transition-all cursor-pointer shadow-xs hover:shadow-sm"
              >
                Client Login
              </Link>

              <a
                href="#lead-capture-section"
                className={`px-4.5 py-2.2 rounded-xl text-xs font-black text-white bg-gradient-to-r ${
                  isWhatIn
                    ? "from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 shadow-emerald-500/25"
                    : "from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/25"
                } shadow-[0_8px_20px_-4px_rgba(79,70,229,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center gap-1.5`}
              >
                <span>Get Started</span>
                <ArrowRight size={13} />
              </a>
            </div>

          </div>
        </div>
      </header>

      {/* 🌟 3D HERO SECTION */}
      <section className="relative pt-10 pb-20 sm:pt-16 sm:pb-28 px-4 sm:px-6 lg:px-10 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          
          {/* Top 3D Pill Badge */}
          <div className="text-center mb-6">
            <span
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold ${
                isWhatIn
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-[0_4px_16px_rgba(16,185,129,0.12)]"
                  : "bg-white text-indigo-700 border border-indigo-100 shadow-[0_4px_16px_rgba(99,102,241,0.12)]"
              } backdrop-blur-md`}
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="tracking-wide">{brand.heroBadge}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-100/80 text-indigo-700 font-mono font-bold">
                v21.0
              </span>
            </span>
          </div>

          {/* Main 3D High-Contrast Headline */}
          <div className="text-center max-w-4xl mx-auto space-y-5 mb-9">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.12]">
              Turn WhatsApp Into Your Highest-Converting{" "}
              <span
                className={`bg-gradient-to-r ${
                  isWhatIn
                    ? "from-emerald-600 via-teal-600 to-cyan-600"
                    : "from-indigo-600 via-purple-600 to-pink-600"
                } bg-clip-text text-transparent drop-shadow-xs`}
              >
                Autonomous Sales Machine
              </span>
            </h1>
            <p className="text-sm sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
              {brand.subheadline}
            </p>
          </div>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <a
              href="#lead-capture-section"
              className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-black text-white bg-gradient-to-r ${
                isWhatIn
                  ? "from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 shadow-emerald-500/30"
                  : "from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/30"
              } shadow-[0_12px_28px_-6px_rgba(79,70,229,0.4),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer ring-1 ring-white/50`}
            >
              <Sparkles size={16} className="text-amber-300" />
              <span>Start 7-Day Free Trial</span>
              <ArrowRight size={15} />
            </a>

            <a
              href="#interactive-demo"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm font-bold text-slate-750 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Radio size={15} className="text-indigo-600 animate-pulse" />
              <span>Explore Interactive 3D Demo</span>
            </a>
          </div>

          {/* 3D Telemetry Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto text-center mb-16">
            <div className="p-4 sm:p-5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.02)] backdrop-blur-md hover:-translate-y-1 transition-all group">
              <div className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                4.2M+
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">Messages Delivered</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.02)] backdrop-blur-md hover:-translate-y-1 transition-all group">
              <div className="text-xl sm:text-2xl font-black text-emerald-600 group-hover:scale-105 transition-transform">
                1.1s Avg
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">Gemini AI Speed</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.02)] backdrop-blur-md hover:-translate-y-1 transition-all group">
              <div className="text-xl sm:text-2xl font-black text-sky-600 group-hover:scale-105 transition-transform">
                99.98%
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">Meta Graph SLA</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.02)] backdrop-blur-md hover:-translate-y-1 transition-all group">
              <div className="text-xl sm:text-2xl font-black text-purple-600 group-hover:scale-105 transition-transform">
                35% Less
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">COD RTO Rate</div>
            </div>
          </div>

          {/* 📱 3D ISOMETRIC INTERACTIVE CHAT SIMULATOR MOCKUP */}
          <div id="interactive-demo" className="relative max-w-5xl mx-auto">
            {/* Ambient 3D Glow under simulator */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-teal-500/10 rounded-3xl blur-2xl transform scale-95 pointer-events-none -z-10" />

            {/* 3D Glass Stage Container */}
            <div className="p-4 sm:p-8 rounded-3xl bg-white/95 border border-slate-200/90 shadow-[0_30px_70px_rgba(79,70,229,0.12),0_10px_20px_rgba(0,0,0,0.04)] backdrop-blur-xl relative overflow-hidden transition-all duration-500">
              
              {/* Header Simulator Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-400" />
                    <span className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider">
                      Live Autonomous Interaction
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    Simulate WhatsApp AI Customer Journey
                  </h3>
                </div>

                {/* 3D Tab Segment Pills */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 overflow-x-auto scrollbar-none shadow-inner">
                  {[
                    { id: "AI_ORDER", label: "🤖 AI Order & Sizing" },
                    { id: "PINCODE_FETCH", label: "📍 Pincode & Address AI" },
                    { id: "CATALOG_FLOW", label: "📦 Catalog Checkout" },
                    { id: "PAYMENT_UPI", label: "💳 UPI Payment Link" }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSimulatorTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        simulatorTab === tab.id
                          ? `${
                              isWhatIn ? "bg-emerald-600" : "bg-indigo-600"
                            } text-white shadow-[0_4px_12px_rgba(79,70,229,0.25)]`
                          : "text-slate-600 hover:text-slate-950 hover:bg-white/50"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Simulation Area */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                
                {/* Left: Authentic WhatsApp Device Mockup (7 cols) */}
                <div className="lg:col-span-7 bg-[#efeae2] rounded-2xl border border-slate-300/80 p-4 sm:p-5 shadow-[0_12px_30px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(0,0,0,0.05)] space-y-3 font-sans relative overflow-hidden">
                  
                  {/* Subtle WhatsApp chat background doodle feel */}
                  <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                  {/* WhatsApp Chat Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 bg-white/90 -m-4 -sm:m-5 mb-4 p-3.5 px-4 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#128c7e] to-[#25d366] flex items-center justify-center text-white font-black text-sm shadow-sm ring-2 ring-emerald-100">
                        {brand.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                          <span>{brand.name} Official</span>
                          <CheckCircle2 size={13} className="text-emerald-600 fill-emerald-100" />
                        </div>
                        <div className="text-[10px] text-emerald-600 font-medium">
                          ● Online • AI Auto-Pilot Active
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                      Cloud API v21.0
                    </span>
                  </div>

                  {/* Tab 1: AI Natural Chat Simulation */}
                  {simulatorTab === "AI_ORDER" && (
                    <div className="space-y-3 text-xs">
                      {/* Customer Msg */}
                      <div className="flex justify-end">
                        <div className="max-w-[85%] p-3 rounded-2xl rounded-tr-xs bg-[#d9fdd3] text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
                          Bhaiya, L size me 3 Round Neck T-shirts aur 2 Bermudas ka Cash on Delivery order confirm kardo please. Best colors pack karna.
                          <div className="text-[10px] text-emerald-800 text-right mt-1 font-mono">13:42 ✓✓</div>
                        </div>
                      </div>

                      {/* AI Agent Reply */}
                      <div className="flex justify-start">
                        <div className="max-w-[88%] p-3 rounded-2xl rounded-tl-xs bg-white text-slate-900 shadow-[0_2px_6px_rgba(0,0,0,0.08)] border border-slate-100 space-y-2">
                          <p className="font-medium text-slate-800">
                            सुरेश जी, आपका 5-पीस कॉम्बो ऑर्डर नोट कर लिया गया है! 📦
                          </p>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] space-y-1">
                            <div className="font-bold text-slate-900">🛍️ Order Summary:</div>
                            <div className="text-slate-700">• 3x Round Neck Combed Cotton T-Shirt (Size: L)</div>
                            <div className="text-slate-700">• 2x Heavy GSM Sports Bermudas (Size: L)</div>
                            <div className="font-bold text-emerald-700 pt-1">Total COD Amount: ₹1,499 (Pay on Delivery)</div>
                          </div>
                          <p className="text-slate-700">
                            कृपया अपना पूरा डिलीवरी पता और पिनकोड शेयर कर दीजिए ताकि पार्सल आज ही छिंदवाड़ा के लिए डिस्पैच हो सके! 📍
                          </p>
                          <div className="text-[10px] text-slate-400 text-right mt-1 font-mono">13:42 • AI Latency: 1.1s</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Pincode AI Extraction Simulation */}
                  {simulatorTab === "PINCODE_FETCH" && (
                    <div className="space-y-3 text-xs">
                      {/* Customer Unstructured Text */}
                      <div className="flex justify-end">
                        <div className="max-w-[85%] p-3 rounded-2xl rounded-tr-xs bg-[#d9fdd3] text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
                          सुरेश साहू, कुमकुम ब्यूटी पार्लर के पास, पुराना पंजाब भवन, नरसिंहपुर रोड, छिंदवाड़ा म.प्र. पिन कोड 480001. फोन 7987132429
                          <div className="text-[10px] text-emerald-800 text-right mt-1 font-mono">13:43 ✓✓</div>
                        </div>
                      </div>

                      {/* AI Structured Verification Card */}
                      <div className="flex justify-start">
                        <div className="max-w-[88%] p-3 rounded-2xl rounded-tl-xs bg-white text-slate-900 shadow-[0_2px_6px_rgba(0,0,0,0.08)] border border-indigo-100 space-y-2">
                          <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs">
                            <MapPin size={14} />
                            <span>Pincode & Delivery Address Verified</span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] space-y-1 text-slate-700">
                            <div><b className="text-slate-900">Customer:</b> Suresh Sahu (+91 7987132429)</div>
                            <div><b className="text-slate-900">Address:</b> Near Kumkum Beauty Parlour, Old Punjab Bhawan, Narsinghpur Road</div>
                            <div><b className="text-slate-900">City & State:</b> Chhindwara, Madhya Pradesh</div>
                            <div className="font-mono text-emerald-700 font-bold">📍 Pincode: 480001 [Serviceable • BlueDart / Delhivery]</div>
                          </div>

                          <p className="text-[11px] text-slate-700">
                            सुरेश जी, आपका डिलीवरी पता सत्यापित हो गया है! पार्सल आज शाम 5 बजे डिस्पैच कर दिया जाएगा।
                          </p>
                          <div className="text-[10px] text-slate-400 text-right mt-1 font-mono">13:43 • Auto-Parsed in 0.8s</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Catalog Checkout Simulation */}
                  {simulatorTab === "CATALOG_FLOW" && (
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-start">
                        <div className="max-w-[90%] p-3 rounded-2xl rounded-tl-xs bg-white text-slate-900 shadow-[0_2px_6px_rgba(0,0,0,0.08)] border border-purple-100 space-y-2.5">
                          <div className="font-bold text-slate-900 flex items-center justify-between">
                            <span>Catalog Collection 2026</span>
                            <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 font-bold">
                              Shopify Synced
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-xl shadow-xs">
                              👕
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900">Classic Combed Round-Neck Tee</div>
                              <div className="text-[11px] text-slate-500">₹499 • 100% Cotton • 220 GSM</div>
                            </div>
                          </div>

                          <div className="w-full py-2.5 rounded-xl text-center font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm cursor-pointer flex items-center justify-center gap-1.5 transition-all">
                            <ShoppingBag size={13} />
                            <span>Confirm Delivery & Address Flow 📍</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 4: Prepayment & UPI Simulation */}
                  {simulatorTab === "PAYMENT_UPI" && (
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-start">
                        <div className="max-w-[90%] p-3 rounded-2xl rounded-tl-xs bg-white text-slate-900 shadow-[0_2px_6px_rgba(0,0,0,0.08)] border border-emerald-100 space-y-2.5">
                          <div className="font-bold text-slate-900 flex items-center justify-between">
                            <span>Smart Prepayment Link</span>
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-bold">
                              Cashfree / Razorpay
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                            <div className="text-slate-600">Order #WM-88219 (₹1,499)</div>
                            <div className="text-emerald-700 font-bold">✨ Pay Online & Save ₹75 (5% Instant Discount)</div>
                          </div>

                          <div className="w-full py-2.5 rounded-xl text-center font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm cursor-pointer flex items-center justify-center gap-1.5 transition-all">
                            <CreditCard size={13} />
                            <span>1-Click UPI / Card Payment (₹1,424)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Right: 3D Technical Architecture Highlights (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-4.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2 shadow-xs hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold">
                      <Cpu size={16} />
                      <span>Zero-Latency AI Agent Engine</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900">Autonomous Natural Language Ordering</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Powered by Gemini 3.8 Flash, trained on your exact brand knowledge base, inventory quantities, sizing tables, and Hindi/Hinglish Indian dialect nuances.
                    </p>
                  </div>

                  <div className="p-4.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2 shadow-xs hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                      <MapPin size={16} />
                      <span>Smart Pincode & Postal Lookup</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900">100% Automated Address Extraction</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Customers send messy, voice-to-text Hindi addresses. Our NLP instantly isolates Name, Phone, Street, City, and 6-Digit Pincode to prevent RTO courier rejections.
                    </p>
                  </div>

                  <div className="p-4.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2 shadow-xs hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 text-purple-700 text-xs font-bold">
                      <ShieldCheck size={16} />
                      <span>Verified Meta Cloud Infrastructure</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900">Official WhatsApp Business API v21.0</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Multi-tenant isolated credentials with background sentinel token testers, automated webhook recovery, and 99.98% uptime SLA.
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 🚀 COMPREHENSIVE 3D PLATFORM FEATURES SHOWCASE */}
      <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-10 border-t border-slate-200/80 bg-white relative">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span
              className={`text-xs font-black uppercase tracking-widest ${
                isWhatIn ? "text-emerald-700" : "text-indigo-700"
              }`}
            >
              Full-Stack Platform Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
              Engineered For Modern E-Commerce & High-Volume WhatsApp Sales
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Every feature you need to automate conversations, recover lost checkouts, verify COD orders, and empower human support teams.
            </p>
          </div>

          {/* 6-Card 3D Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Feature 1: Pincode & Address Auto-Fetch */}
            <div
              id="pincode-address"
              className="p-7 rounded-3xl bg-slate-50/70 border border-slate-200/90 hover:border-indigo-300 hover:bg-white transition-all duration-300 space-y-3.5 group hover:shadow-[0_20px_40px_rgba(79,70,229,0.08)] hover:-translate-y-1.5"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-110 group-hover:rotate-2 transition-all">
                <MapPin size={22} />
              </div>
              <h3 className="text-base font-black text-slate-900">Indian Pincode & Address Auto-Fetch</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automatically extracts complete delivery addresses, landmarks, and 6-digit Indian postal codes from unstructured Hindi or English chat text. Validates courier serviceability before booking.
              </p>
              <div className="pt-2 text-[11px] font-bold text-indigo-700 flex items-center gap-1">
                <span>Prevents 85% of COD address failures</span>
                <Check size={14} />
              </div>
            </div>

            {/* Feature 2: WhatsApp Catalog & Order Automation */}
            <div
              id="shopify-catalog"
              className="p-7 rounded-3xl bg-slate-50/70 border border-slate-200/90 hover:border-emerald-300 hover:bg-white transition-all duration-300 space-y-3.5 group hover:shadow-[0_20px_40px_rgba(16,185,129,0.08)] hover:-translate-y-1.5"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-110 group-hover:rotate-2 transition-all">
                <Package size={22} />
              </div>
              <h3 className="text-base font-black text-slate-900">WhatsApp Catalog Order Automation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sync your complete product catalog into WhatsApp. Customers can browse multi-item carousels, pick colors and sizes, add to cart, and checkout in a single tap inside WhatsApp.
              </p>
              <div className="pt-2 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <span>Native Meta Catalog API Sync</span>
                <Check size={14} />
              </div>
            </div>

            {/* Feature 3: AI Auto-Pilot Sales Rep */}
            <div className="p-7 rounded-3xl bg-slate-50/70 border border-slate-200/90 hover:border-purple-300 hover:bg-white transition-all duration-300 space-y-3.5 group hover:shadow-[0_20px_40px_rgba(168,85,247,0.08)] hover:-translate-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-violet-600 text-white flex items-center justify-center shadow-md shadow-purple-500/25 group-hover:scale-110 group-hover:rotate-2 transition-all">
                <Bot size={22} />
              </div>
              <h3 className="text-base font-black text-slate-900">Gemini 3.8 AI Auto-Pilot Copilot</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                An intelligent autonomous sales rep that understands inventory availability, sizing recommendations, wash care, return policies, and negotiates sample bundles 24/7.
              </p>
              <div className="pt-2 text-[11px] font-bold text-purple-700 flex items-center gap-1">
                <span>Sub-1.2s instant customer replies</span>
                <Check size={14} />
              </div>
            </div>

            {/* Feature 4: Shopify Bi-Directional Sync */}
            <div className="p-7 rounded-3xl bg-slate-50/70 border border-slate-200/90 hover:border-sky-300 hover:bg-white transition-all duration-300 space-y-3.5 group hover:shadow-[0_20px_40px_rgba(14,165,233,0.08)] hover:-translate-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/25 group-hover:scale-110 group-hover:rotate-2 transition-all">
                <ShoppingBag size={22} />
              </div>
              <h3 className="text-base font-black text-slate-900">Real-Time Shopify Commerce Sync</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bi-directional live integration. When an order is placed on WhatsApp, it instantly creates an unfulfilled order in Shopify. Abandoned Shopify checkouts automatically trigger recovery sequences.
              </p>
              <div className="pt-2 text-[11px] font-bold text-sky-700 flex items-center gap-1">
                <span>Auto-syncs stock, prices & variants</span>
                <Check size={14} />
              </div>
            </div>

            {/* Feature 5: Native Meta WhatsApp Flows */}
            <div className="p-7 rounded-3xl bg-slate-50/70 border border-slate-200/90 hover:border-amber-300 hover:bg-white transition-all duration-300 space-y-3.5 group hover:shadow-[0_20px_40px_rgba(245,158,11,0.08)] hover:-translate-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/25 group-hover:scale-110 group-hover:rotate-2 transition-all">
                <Sliders size={22} />
              </div>
              <h3 className="text-base font-black text-slate-900">Native Meta Flows (In-Chat Forms)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Zero external browser redirects. Customers open sleek native forms inside WhatsApp to confirm their delivery address, select prepaid discounts, or submit KYC details seamlessly.
              </p>
              <div className="pt-2 text-[11px] font-bold text-amber-700 flex items-center gap-1">
                <span>High-converting in-app experience</span>
                <Check size={14} />
              </div>
            </div>

            {/* Feature 6: In-Chat UPI & Payment Links */}
            <div className="p-7 rounded-3xl bg-slate-50/70 border border-slate-200/90 hover:border-rose-300 hover:bg-white transition-all duration-300 space-y-3.5 group hover:shadow-[0_20px_40px_rgba(244,63,94,0.08)] hover:-translate-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-md shadow-rose-500/25 group-hover:scale-110 group-hover:rotate-2 transition-all">
                <CreditCard size={22} />
              </div>
              <h3 className="text-base font-black text-slate-900">Instant UPI & Partial COD Recovery</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Collect prepaid payments via Cashfree and Razorpay UPI intents. Offer a 5% instant discount to convert COD buyers, or collect ₹100 advance deposit to eliminate fake courier returns.
              </p>
              <div className="pt-2 text-[11px] font-bold text-rose-700 flex items-center gap-1">
                <span>Razorpay, Cashfree & UPI QR support</span>
                <Check size={14} />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 🏷️ 3D TRANSPARENT PRICING & PLANS */}
      <section id="pricing" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-10 border-t border-slate-200/80 bg-gradient-to-b from-[#f8fafc] via-white to-[#f8fafc] relative">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span
              className={`text-xs font-black uppercase tracking-widest ${
                isWhatIn ? "text-emerald-700" : "text-indigo-700"
              }`}
            >
              Transparent Subscription Tiers
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
              Predictable Pricing Built For Every Stage
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              No hidden fees. All plans include official Meta Cloud API v21.0 integration and dedicated onboarding.
            </p>

            {/* 3D Monthly / Annual Billing Toggle */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <span className={`text-xs font-bold ${billingCycle === "MONTHLY" ? "text-slate-900" : "text-slate-500"}`}>
                Monthly Billing
              </span>
              <button
                type="button"
                onClick={() => setBillingCycle(billingCycle === "MONTHLY" ? "ANNUALLY" : "MONTHLY")}
                className="w-14 h-7 rounded-full bg-slate-200 border border-slate-300 p-0.5 transition-colors relative cursor-pointer shadow-inner"
              >
                <div
                  className={`w-6 h-6 rounded-full bg-indigo-600 shadow-md transition-transform duration-300 ${
                    billingCycle === "ANNUALLY" ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
              <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === "ANNUALLY" ? "text-slate-900" : "text-slate-500"}`}>
                <span>Annual Billing</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                  Save 20%
                </span>
              </span>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {pricingTiers.map((tier) => {
              const price = billingCycle === "ANNUALLY" ? tier.annualPrice : tier.monthlyPrice;
              return (
                <div
                  key={tier.id}
                  className={`p-7 rounded-3xl bg-white flex flex-col justify-between transition-all duration-300 relative ${
                    tier.popular
                      ? `${
                          isWhatIn
                            ? "border-2 border-emerald-500 shadow-[0_20px_50px_rgba(16,185,129,0.15)] ring-4 ring-emerald-50"
                            : "border-2 border-indigo-600 shadow-[0_20px_50px_rgba(79,70,229,0.15)] ring-4 ring-indigo-50"
                        } md:-translate-y-2`
                      : "border border-slate-200/90 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-1"
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 shadow-md shadow-indigo-500/30 ring-2 ring-white">
                      {tier.badge}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-black text-slate-900">{tier.name}</h3>
                      <span className="text-xs font-bold text-indigo-700 font-mono bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200/80">
                        {tier.agents}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mb-4 min-h-[36px] leading-relaxed">
                      {tier.description}
                    </p>

                    <div className="mb-6 pb-4 border-b border-slate-100">
                      {(tier as any).isCustomQuote ? (
                        <div>
                          <div className="text-3xl sm:text-4xl font-black text-slate-900 flex items-baseline gap-2">
                            <span>Custom</span>
                            <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-lg">
                              Client-Specific
                            </span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-700 mt-2">
                            💼 Tailored to Your Scale, Features & Custom Volume
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            Includes <b>Custom / Unlimited</b> messages & <b>AI Quotas</b>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-3xl sm:text-4xl font-black text-slate-900">
                            ₹{price.toLocaleString()}
                            <span className="text-xs font-normal text-slate-500">/month</span>
                          </div>
                          {tier.id === "BASIC" && (
                            <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl mt-2 inline-block">
                              🎟️ Launch Offer: Use <b>SAVE500</b> for ₹500 OFF (₹1,499)
                            </div>
                          )}
                          <div className="text-[11px] text-slate-500 mt-1.5">
                            Includes <b>{tier.messages}</b> messages & <b>{tier.aiReplies}</b>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2.5 text-xs text-slate-700 mb-6">
                      {tier.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-snug">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectPlan(tier.id)}
                    className={`w-full py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                      tier.popular
                        ? `${
                            isWhatIn
                              ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25"
                              : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25"
                          } text-white shadow-md hover:-translate-y-0.5`
                        : (tier as any).isCustomQuote
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md border border-purple-500/30 hover:-translate-y-0.5"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 hover:-translate-y-0.5"
                    }`}
                  >
                    <span>{(tier as any).isCustomQuote ? "Talk to Us for Custom Plan" : `Choose ${tier.name}`}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 🎯 3D LEAD CAPTURE & CONTACT FORM */}
      <section id="lead-capture-section" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-10 border-t border-slate-200/80 bg-white relative">
        <div className="max-w-4xl mx-auto">
          
          <div className="p-6 sm:p-10 rounded-3xl bg-slate-50/70 border border-slate-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.06)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-200/30 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
              <span
                className={`text-xs font-black uppercase tracking-widest ${
                  isWhatIn ? "text-emerald-700" : "text-indigo-700"
                }`}
              >
                Quick Onboarding & Free Consultation
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
                Launch Your Autonomous WhatsApp Store
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Enter your details below. Our onboarding team will configure your Meta WABA credentials and AI knowledge base within 2 business hours.
              </p>
            </div>

            {submittedLead ? (
              <div className="p-8 text-center bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  Inquiry Received, {submittedLead.name}!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your lead profile has been registered in our Super-Admin queue. Our solutions architect is reviewing your business requirements.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={`https://wa.me/${brand.supportWhatsApp.replace(/[^0-9]/g, "")}?text=Hi%20${brand.name}%2C%20I%20just%20submitted%20an%20inquiry%20for%20my%20business.`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <MessageSquare size={14} />
                    <span>Connect Instantly on WhatsApp</span>
                  </a>
                  <button
                    onClick={() => setSubmittedLead(null)}
                    className="text-xs text-slate-500 hover:text-slate-900 underline cursor-pointer"
                  >
                    Submit another response
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitLead} className="space-y-4">
                
                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Your Full Name *
                    </label>
                    <div className="relative">
                      <Users size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Suresh Sahu"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Business Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Company / Brand Name *
                    </label>
                    <div className="relative">
                      <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Espon Clothing Pvt Ltd"
                        value={form.businessName}
                        onChange={e => setForm({ ...form, businessName: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  {/* WhatsApp / Mobile Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      WhatsApp / Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 9896507407"
                        value={form.mobile}
                        onChange={e => setForm({ ...form, mobile: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Work Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Work Email *
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. admin@yourbrand.com"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all shadow-xs"
                      />
                    </div>
                  </div>

                </div>

                {/* Selected Plan */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Interested Subscription Plan
                  </label>
                  <select
                    value={form.selectedPlan}
                    onChange={e => setForm({ ...form, selectedPlan: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer shadow-xs"
                  >
                    <option value="BASIC">Basic Plan (₹1,999/mo • 5,000 Messages • 5 Agents)</option>
                    <option value="GROWTH">Growth Plan (₹3,499/mo • 25,000 Messages • 10 Agents • AI + Shopify)</option>
                    <option value="ENTERPRISE">Enterprise VIP (Custom Quote • Live Tracking • Co-Browsing • APIs)</option>
                    <option value="CUSTOM">Custom High-Volume Consultation</option>
                  </select>
                </div>

                {/* Message / Requirements */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    What specific features are you looking for? (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. We get 1,000 WhatsApp chats daily from Facebook ads. We want AI order confirmation and address auto-validation for our Shopify store..."
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all shadow-xs"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full py-3.5 rounded-2xl font-black text-sm text-white bg-gradient-to-r ${
                      isWhatIn
                        ? "from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 shadow-emerald-500/25"
                        : "from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/25"
                    } shadow-[0_12px_28px_-6px_rgba(79,70,229,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0`}
                  >
                    {submitting ? (
                      <RefreshCw size={16} className="animate-spin text-white" />
                    ) : (
                      <Send size={15} />
                    )}
                    <span>{submitting ? "Registering Lead..." : "Submit Inquiry & Get Free Onboarding"}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 text-center pt-1 font-mono">
                  🔒 Zero spam guarantee • Official Meta BSP Cloud Architecture
                </p>

              </form>
            )}

          </div>

        </div>
      </section>

      {/* ❓ FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-10 border-t border-slate-200/80 bg-[#f8fafc]">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-600">Everything you need to know about setting up your WhatsApp store.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
                  >
                    <span className="text-sm font-bold text-slate-900">{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-slate-500 shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-indigo-600" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                      <p className="pt-2">{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 💼 3D LIGHT FOOTER */}
      <footer className="py-12 px-4 sm:px-6 lg:px-10 border-t border-slate-200/80 bg-white text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${
                isWhatIn ? "from-emerald-600 to-teal-500" : "from-indigo-600 to-purple-600"
              } flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20`}
            >
              {brand.name.charAt(0)}
            </div>
            <div>
              <div className="font-black text-slate-900 text-sm">{brand.name} Cloud Platform</div>
              <div className="text-[11px] text-slate-500">© 2026 {brand.name} Inc. All rights reserved.</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-semibold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">
              Pricing
            </a>
            <Link href="/login" className="hover:text-indigo-600 transition-colors">
              Client Portal
            </Link>
            <Link href="/owner/login" className="hover:text-indigo-600 transition-colors text-indigo-600">
              Super-Admin Console
            </Link>
          </div>

        </div>
      </footer>

    </div>
  );
}
