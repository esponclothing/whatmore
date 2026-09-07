"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileCode, Plus, Search, RefreshCw, CheckCircle2, Clock, AlertCircle,
  X, Send, Trash2, Eye, Info, Calendar, Zap, TrendingUp, Filter, Sparkles,
  ArrowUpDown, CheckCheck, Radio, Check, ArrowLeft, Layers, ShoppingBag,
  Tag, ChevronLeft, ChevronRight, Image as ImageIcon, Link as LinkIcon,
  Phone, Copy, Smartphone, Upload, Clipboard, CheckSquare, PackageCheck,
  Truck, CreditCard, BellRing, FileText, Video, FileCheck
} from "lucide-react";
import {
  getWhatsAppTemplates,
  saveWhatsAppTemplateAction,
  deleteWhatsAppTemplateAction,
  sendWhatsAppTemplateAction,
  getWhatsAppBrandDetailsAction
} from "@/app/actions/whatsAppPlatformActions";

// Meta API Constraints
const META_LIMITS = {
  NAME_MAX: 512,
  HEADER_MAX: 60,
  BODY_MAX: 1024,
  FOOTER_MAX: 60,
  BUTTON_TEXT_MAX: 25,
  BUTTON_URL_MAX: 2000,
  MAX_QUICK_REPLIES: 3,
  MAX_CTA_BUTTONS: 2,
  TOTAL_BUTTONS_MAX: 3,
  MAX_CAROUSEL_CARDS: 10,
};

const LANGUAGES = [
  { code: "en_US", label: "English (US)" },
  { code: "en", label: "English" },
  { code: "en_GB", label: "English (UK)" },
  { code: "hi", label: "Hindi (हिंदी)" },
  { code: "mr", label: "Marathi (मराठी)" },
  { code: "gu", label: "Gujarati (ગુજરાતી)" },
  { code: "ta", label: "Tamil (தமிழ்)" },
  { code: "te", label: "Telugu (తెలుగు)" },
  { code: "bn", label: "Bengali (বাংলা)" },
  { code: "pa", label: "Punjabi (ਪੰਜਾਬੀ)" },
  { code: "ur", label: "Urdu (اردو)" },
  { code: "ar", label: "Arabic (عربي)" },
];

const CATEGORIES = [
  { value: "MARKETING", label: "📢 Marketing", desc: "Promotions, product showcases, seasonal offers, and re-engagement" },
  { value: "UTILITY", label: "⚙️ Utility", desc: "Order confirmation, shipping status, payment receipts, and critical account alerts" },
  { value: "AUTHENTICATION", label: "🔐 Authentication", desc: "One-time passwords (OTP) and login account verification codes" },
];

const getUtilityPresetsList = (brand: string, domain: string) => [
  {
    id: "ORDER_CONFIRMATION",
    label: "📦 Order Confirmation",
    header: "Order Confirmed!",
    body: `Hi {{1}}, thank you for shopping with ${brand}! Your order #{{2}} of ₹{{3}} has been confirmed and is being packed with care.`,
    footer: `${brand} | Need help? Reply to this chat`
  },
  {
    id: "SHIPPING_UPDATE",
    label: "🚚 Shipping & Tracking",
    header: "Your Order is on the Way!",
    body: `Hi {{1}}, great news! Your order #{{2}} from ${brand} has been dispatched via {{3}}. Track your delivery live here: {{4}}`,
    footer: `${brand} Logistics`
  },
  {
    id: "PAYMENT_RECEIPT",
    label: "💳 Payment Receipt",
    header: "Payment Received",
    body: `Hi {{1}}, we have received your payment of ₹{{2}} for invoice #{{3}}. Thank you for choosing ${brand}!`,
    footer: `${brand} Accounts`
  },
  {
    id: "ACCOUNT_ALERT",
    label: "🔔 Account Alert",
    header: "Security Notice",
    body: `Hi {{1}}, this is an important update regarding your ${brand} account: {{2}}. If this was not you, please reply immediately.`,
    footer: `${brand} Security Desk`
  },
  {
    id: "CUSTOM_UTILITY",
    label: "📝 Custom Utility",
    header: "",
    body: "",
    footer: ""
  }
];

interface CarouselCardItem {
  id: string;
  mediaUrl: string;
  headerType: "IMAGE" | "VIDEO";
  title: string;
  bodyText: string;
  buttons: { type: "URL" | "QUICK_REPLY"; text: string; url?: string }[];
}

export default function WhatsAppTemplatesComponent() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [timeRangeFilter, setTimeRangeFilter] = useState<"ALL" | "TODAY" | "7D" | "30D">("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "most_used" | "highest_read" | "alphabetical">("newest");
  
  // Dynamic Brand Details from Database
  const [brandName, setBrandName] = useState("Espon Sports");
  const [brandDomain, setBrandDomain] = useState("esponsports.com");

  // Page View Mode: 'LIST' or 'CREATE'
  const [viewMode, setViewMode] = useState<"LIST" | "CREATE">("LIST");

  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Live Clock
  const [liveCurrentTime, setLiveCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveCurrentTime(
        now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch brand details on component mount
  useEffect(() => {
    getWhatsAppBrandDetailsAction().then((res) => {
      if (res && res.brandName) {
        setBrandName(res.brandName);
        if (res.brandDomain) setBrandDomain(res.brandDomain);
        // Also update initial carousel cards with real brand name & domain
        setCarouselCards([
          {
            id: "card_1",
            mediaUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80",
            headerType: "IMAGE",
            title: `${res.brandName} Performance Tee`,
            bodyText: "₹899 • Breathable 4-way stretch fabric",
            buttons: [
              { type: "URL", text: "Buy Now", url: `https://${res.brandDomain || "esponsports.com"}/products/tee` },
              { type: "QUICK_REPLY", text: "View Sizes" }
            ]
          },
          {
            id: "card_2",
            mediaUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=80",
            headerType: "IMAGE",
            title: `${res.brandName} Pro Shorts`,
            bodyText: "₹1,199 • Zipper pockets & sweat-wicking",
            buttons: [
              { type: "URL", text: "Buy Now", url: `https://${res.brandDomain || "esponsports.com"}/products/shorts` },
              { type: "QUICK_REPLY", text: "More Colors" }
            ]
          }
        ]);
      }
    });
  }, []);

  // -------------------------------------------------------------
  // Full-Page Template Studio State
  // -------------------------------------------------------------
  const [category, setCategory] = useState<"MARKETING" | "UTILITY" | "AUTHENTICATION">("MARKETING");
  const [templateType, setTemplateType] = useState<
    "STANDARD" | "CAROUSEL" | "CATALOGUE" | "FLOWS" | "ORDER_DETAILS" | "ORDER_STATUS" | "CALL_PERMISSIONS" | "LTO_COUPON" | "AUTHENTICATION"
  >("STANDARD");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [utilityPreset, setUtilityPreset] = useState<string>("ORDER_CONFIRMATION");
  
  const [templateName, setTemplateName] = useState("");
  const [language, setLanguage] = useState("en_US");
  
  // Header configuration
  const [headerType, setHeaderType] = useState<"NONE" | "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT">("NONE");
  const [headerContent, setHeaderContent] = useState("");
  const [headerMediaPreview, setHeaderMediaPreview] = useState<string | null>(null);
  
  // Body & Footer
  const [bodyText, setBodyText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [buttons, setButtons] = useState<any[]>([]);
  
  // Coupon State
  const [couponCode, setCouponCode] = useState("FLAT30");

  // Meta Official Extension States
  const [catalogueFormat, setCatalogueFormat] = useState<"CATALOGUE_MESSAGE" | "MULTI_PRODUCT">("CATALOGUE_MESSAGE");
  const [flowButtonText, setFlowButtonText] = useState("View Flow");
  const [authCodeDelivery, setAuthCodeDelivery] = useState<"COPY_CODE" | "ONE_TAP" | "ZERO_TAP">("COPY_CODE");
  const [authSecurityRecommendation, setAuthSecurityRecommendation] = useState(true);
  const [authExpiryTime, setAuthExpiryTime] = useState(false);
  const [authExpiryMinutes, setAuthExpiryMinutes] = useState(10);
  const [authPackageName, setAuthPackageName] = useState("com.esponsports.app");
  const [authAppSignatureHash, setAuthAppSignatureHash] = useState("K4w8v9N2q1P");
  const [enableValidityPeriod, setEnableValidityPeriod] = useState(false);
  const [messageValidityPeriod, setMessageValidityPeriod] = useState(10);

  // Carousel Cards State (up to 10 product cards)
  const [carouselCards, setCarouselCards] = useState<CarouselCardItem[]>([
    {
      id: "card_1",
      mediaUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80",
      headerType: "IMAGE",
      title: "Espon Performance Tee",
      bodyText: "₹899 • Breathable 4-way stretch fabric",
      buttons: [
        { type: "URL", text: "Buy Now", url: "https://esponsports.com/products/tee" },
        { type: "QUICK_REPLY", text: "View Sizes" }
      ]
    },
    {
      id: "card_2",
      mediaUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=80",
      headerType: "IMAGE",
      title: "Espon Pro Shorts",
      bodyText: "₹1,199 • Zipper pockets & sweat-wicking",
      buttons: [
        { type: "URL", text: "Buy Now", url: "https://esponsports.com/products/shorts" },
        { type: "QUICK_REPLY", text: "More Colors" }
      ]
    }
  ]);
  const [activeCarouselCardIndex, setActiveCarouselCardIndex] = useState(0);

  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState("");

  // Test send state
  const [testPhone, setTestPhone] = useState("");
  const [testingTemplate, setTestingTemplate] = useState<string | null>(null);

  const headerFileInputRef = useRef<HTMLInputElement>(null);
  const cardFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchTemplates = async () => {
    setLoading(true);
    const res = await getWhatsAppTemplates();
    if (res.success) setTemplates(res.templates || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Utility Preset Handler
  const applyUtilityPreset = (presetId: string, activeBrand = brandName, activeDomain = brandDomain) => {
    setUtilityPreset(presetId);
    const presets = getUtilityPresetsList(activeBrand, activeDomain);
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      if (preset.header) {
        setHeaderType("TEXT");
        setHeaderContent(preset.header);
      } else {
        setHeaderType("NONE");
        setHeaderContent("");
      }
      setBodyText(preset.body);
      setFooterText(preset.footer);
      if (presetId === "ORDER_CONFIRMATION" || presetId === "SHIPPING_UPDATE") {
        setButtons([{ type: "URL", text: "Track Order", url: `https://${activeDomain}/account/orders` }]);
      } else {
        setButtons([]);
      }
    }
  };

  // Template Type Switch Handler with Meta Presets
  const handleTemplateTypeSelect = (type: typeof templateType) => {
    setTemplateType(type);
    if (type === "CAROUSEL") {
      if (!bodyText) setBodyText(`Check out our top ${brandName} collections this season:`);
    } else if (type === "CATALOGUE") {
      setBodyText(`Hello {{1}}, explore our full ${brandName} catalogue directly on WhatsApp!`);
      setFooterText(`${brandName} Store`);
      setHeaderType("NONE");
      setButtons([{ type: "CATALOG", text: "View catalog" }]);
    } else if (type === "FLOWS") {
      setBodyText(`Hello {{1}}, please fill out this quick form so our ${brandName} team can assist you:`);
      setFooterText(`${brandName} Support`);
      setButtons([{ type: "FLOW", text: flowButtonText || "View Flow" }]);
    } else if (type === "ORDER_DETAILS") {
      setBodyText(`Hello {{1}}, your order details are ready. Tap below to review and pay securely:`);
      setFooterText(`${brandName} Pay`);
      setButtons([{ type: "ORDER_DETAILS", text: "Review and Pay" }]);
    } else if (type === "ORDER_STATUS") {
      setBodyText(`Good news! Your order #{{1}} from ${brandName} has been dispatched! Track your shipment below:`);
      setFooterText(`${brandName} Logistics`);
      setButtons([{ type: "URL", text: "Track shipment", url: `https://${brandDomain}/account/orders` }]);
    } else if (type === "CALL_PERMISSIONS") {
      setBodyText(`Hello {{1}}`);
      setFooterText(`${brandName} Support`);
      setButtons([{ type: "CALL_PERMISSION", text: "Choose preference" }]);
    } else if (type === "LTO_COUPON") {
      setBodyText(`Special offer! Get FLAT 30% OFF on all ${brandName} gear. Use coupon code below at checkout:`);
      setFooterText(`Limited time only | Valid this week`);
      setButtons([{ type: "COPY_CODE", text: "Copy Code", code: couponCode || "FLAT30" }]);
    } else if (type === "AUTHENTICATION") {
      setBodyText(`{{1}} is your ${brandName} verification code. For your security, do not share this code.`);
      setFooterText("Code expires in 10 minutes");
      setButtons([{ type: "COPY_CODE", text: "Copy Code", code: "{{1}}" }]);
    }
  };

  // Category Switch Handler
  const handleCategorySelect = (selectedCat: "MARKETING" | "UTILITY" | "AUTHENTICATION") => {
    setCategory(selectedCat);
    if (selectedCat === "UTILITY") {
      setTemplateType("STANDARD");
      applyUtilityPreset("ORDER_CONFIRMATION", brandName, brandDomain);
    } else if (selectedCat === "AUTHENTICATION") {
      setTemplateType("AUTHENTICATION");
      setHeaderType("NONE");
      setHeaderContent("");
      setHeaderMediaPreview(null);
      setBodyText(`{{1}} is your ${brandName} verification code. For your security, do not share this code.`);
      setFooterText("Code expires in 10 minutes");
      setButtons([{ type: "COPY_CODE", text: "Copy Code", code: "{{1}}" }]);
    } else {
      // Marketing
      setTemplateType("STANDARD");
      setBodyText("");
      setFooterText(`${brandName} | Reply STOP to unsubscribe`);
    }
  };

  // Image Upload and Paste Handlers
  const handleFileProcess = (file: File, target: "HEADER" | "CAROUSEL_CARD", cardIdx?: number) => {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/") && !file.type.startsWith("application/pdf")) {
      showToast("Please upload a valid image, video, or PDF file.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (target === "HEADER") {
        if (file.type.startsWith("video/")) {
          setHeaderType("VIDEO");
        } else if (file.type.startsWith("application/pdf")) {
          setHeaderType("DOCUMENT");
        } else {
          setHeaderType("IMAGE");
        }
        setHeaderContent(dataUrl);
        setHeaderMediaPreview(dataUrl);
        showToast("Header media uploaded successfully!");
      } else if (target === "CAROUSEL_CARD") {
        const idx = cardIdx !== undefined ? cardIdx : activeCarouselCardIndex;
        setCarouselCards((prev) =>
          prev.map((c, i) => (i === idx ? { ...c, mediaUrl: dataUrl } : c))
        );
        showToast(`Card #${idx + 1} image uploaded successfully!`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePasteEvent = (e: React.ClipboardEvent, target: "HEADER" | "CAROUSEL_CARD", cardIdx?: number) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handleFileProcess(file, target, cardIdx);
          e.preventDefault();
          break;
        }
      }
    }
  };

  const validateName = (name: string) => {
    if (!name) return "Template name is required.";
    if (!/^[a-z0-9_]+$/.test(name)) return "Name must be lowercase letters, numbers, and underscores only. No spaces or special chars.";
    if (name.length > META_LIMITS.NAME_MAX) return `Name too long (max ${META_LIMITS.NAME_MAX} chars).`;
    return "";
  };

  const handleNameChange = (val: string) => {
    const sanitized = val.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    setTemplateName(sanitized);
    setNameError(validateName(sanitized));
  };

  const addCarouselCard = () => {
    if (carouselCards.length >= META_LIMITS.MAX_CAROUSEL_CARDS) {
      showToast("Meta allows maximum 10 carousel cards.", "error");
      return;
    }
    const newIdx = carouselCards.length + 1;
    const newCard: CarouselCardItem = {
      id: `card_${Date.now()}`,
      mediaUrl: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=500&auto=format&fit=crop&q=80",
      headerType: "IMAGE",
      title: `${brandName} Item ${newIdx}`,
      bodyText: "₹999 • Premium Collection",
      buttons: [
        { type: "URL", text: "Buy Now", url: `https://${brandDomain}` },
        { type: "QUICK_REPLY", text: "Inquire" }
      ]
    };
    setCarouselCards([...carouselCards, newCard]);
    setActiveCarouselCardIndex(carouselCards.length);
  };

  const removeCarouselCard = (index: number) => {
    if (carouselCards.length <= 2) {
      showToast("Meta requires at least 2 cards in a Carousel template.", "error");
      return;
    }
    const updated = carouselCards.filter((_, i) => i !== index);
    setCarouselCards(updated);
    if (activeCarouselCardIndex >= updated.length) {
      setActiveCarouselCardIndex(Math.max(0, updated.length - 1));
    }
  };

  const updateActiveCard = (field: keyof CarouselCardItem, val: any) => {
    setCarouselCards((prev) =>
      prev.map((c, i) => (i === activeCarouselCardIndex ? { ...c, [field]: val } : c))
    );
  };

  const addCardButton = () => {
    const card = carouselCards[activeCarouselCardIndex];
    if (!card) return;
    if (card.buttons.length >= 2) {
      showToast("Meta Carousel cards support up to 2 CTA buttons per card.", "error");
      return;
    }
    const updatedButtons = [...card.buttons, { type: "URL" as const, text: "Buy Now", url: `https://${brandDomain}` }];
    updateActiveCard("buttons", updatedButtons);
  };

  const removeCardButton = (btnIdx: number) => {
    const card = carouselCards[activeCarouselCardIndex];
    if (!card) return;
    const updatedButtons = card.buttons.filter((_, i) => i !== btnIdx);
    updateActiveCard("buttons", updatedButtons);
  };

  const updateCardButton = (btnIdx: number, field: string, val: string) => {
    const card = carouselCards[activeCarouselCardIndex];
    if (!card) return;
    const updatedButtons = card.buttons.map((b, i) => (i === btnIdx ? { ...b, [field]: val } : b));
    updateActiveCard("buttons", updatedButtons);
  };

  // Standard Buttons
  const addButton = (type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | "COPY_CODE") => {
    if (buttons.length >= META_LIMITS.TOTAL_BUTTONS_MAX) {
      showToast("Max 3 buttons allowed.", "error");
      return;
    }
    setButtons((prev) => [...prev, { type, text: type === "COPY_CODE" ? "Copy Code" : "", url: "", phone_number: "", code: couponCode }]);
  };

  const updateButton = (idx: number, field: string, val: string) => {
    setButtons((prev) => prev.map((b, i) => (i === idx ? { ...b, [field]: val } : b)));
  };

  const removeButton = (idx: number) => setButtons((prev) => prev.filter((_, i) => i !== idx));

  const insertVariable = () => {
    const nextVar = (bodyText.match(/\{\{(\d+)\}\}/g)?.length || 0) + 1;
    setBodyText((prev) => prev + `{{${nextVar}}}`);
  };

  const resetForm = () => {
    setCategory("MARKETING");
    setTemplateType("STANDARD");
    setTemplateName("");
    setLanguage("en_US");
    setHeaderType("NONE");
    setHeaderContent("");
    setHeaderMediaPreview(null);
    setBodyText("");
    setFooterText(`${brandName} | Reply STOP to unsubscribe`);
    setButtons([]);
    setNameError("");
    setCouponCode("FLAT30");
    setCatalogueFormat("CATALOGUE_MESSAGE");
    setFlowButtonText("View Flow");
    setAuthCodeDelivery("COPY_CODE");
    setAuthSecurityRecommendation(true);
    setAuthExpiryTime(false);
    setAuthExpiryMinutes(10);
    setEnableValidityPeriod(false);
    setMessageValidityPeriod(10);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateName(templateName);
    if (err) {
      setNameError(err);
      showToast(err, "error");
      return;
    }

    if (!bodyText.trim() && templateType !== "CAROUSEL") {
      showToast("Body text is required for the message template.", "error");
      return;
    }

    if (templateType === "CAROUSEL" && carouselCards.length < 2) {
      showToast("Meta Image Carousel requires at least 2 cards.", "error");
      return;
    }

    setSaving(true);
    const payload = {
      name: templateName,
      category,
      language,
      templateType,
      headerType: templateType === "CATALOGUE" ? "NONE" : headerType,
      headerContent: templateType === "CATALOGUE" ? null : headerContent,
      bodyText,
      footerText,
      buttons: templateType === "LTO_COUPON" 
        ? [{ type: "COPY_CODE", text: couponCode || "FLAT30", code: couponCode || "FLAT30" }]
        : templateType === "CATALOGUE"
        ? [{ type: "CATALOG", text: "View catalog" }]
        : templateType === "FLOWS"
        ? [{ type: "FLOW", text: flowButtonText || "View Flow" }]
        : templateType === "ORDER_DETAILS"
        ? [{ type: "ORDER_DETAILS", text: "Review and Pay" }]
        : templateType === "ORDER_STATUS"
        ? [{ type: "URL", text: "Track shipment", url: `https://${brandDomain}/account/orders` }]
        : templateType === "CALL_PERMISSIONS"
        ? [{ type: "CALL_PERMISSION", text: "Choose preference" }]
        : templateType === "AUTHENTICATION"
        ? [{ type: "COPY_CODE", text: "Copy code", code: "{{1}}" }]
        : buttons,
      carouselCards: templateType === "CAROUSEL" ? carouselCards : null
    };

    const res = await saveWhatsAppTemplateAction(payload);
    setSaving(false);
    if (res.success) {
      showToast(
        res.submitted
          ? "🎉 Template submitted directly to Meta Cloud API! Status: PENDING review"
          : "✅ Template successfully configured and saved!",
        "success"
      );
      resetForm();
      setViewMode("LIST");
      fetchTemplates();
    } else {
      showToast(res.error || "Failed to create template.", "error");
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete template "${name}"? This will also remove it from Meta.`)) return;
    setDeleting(name);
    const res = await deleteWhatsAppTemplateAction(name);
    setDeleting(null);
    if (res.success) {
      showToast("Template deleted.");
      fetchTemplates();
    } else {
      showToast(res.error || "Delete failed.", "error");
    }
  };

  const handleTest = async (t: any) => {
    if (!testPhone) {
      showToast("Enter a test phone number first.", "error");
      return;
    }
    setTestingTemplate(t.name);
    const res = await sendWhatsAppTemplateAction(testPhone, t.name, t.language || "en_US", []);
    setTestingTemplate(null);
    if (res.success) showToast("Test template sent successfully!");
    else showToast(res.error || "Send failed.", "error");
  };

  // Filter & Sort
  const filtered = templates
    .filter((t) => {
      if (categoryFilter !== "ALL" && t.category !== categoryFilter) return false;
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (
        searchQuery &&
        !t.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !t.bodyText?.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (timeRangeFilter !== "ALL") {
        const now = Date.now();
        const createdTime = t.createdAt ? new Date(t.createdAt).getTime() : now;
        if (timeRangeFilter === "TODAY") {
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          if (createdTime < startOfDay.getTime()) return false;
        } else if (timeRangeFilter === "7D") {
          if (now - createdTime > 7 * 24 * 3600 * 1000) return false;
        } else if (timeRangeFilter === "30D") {
          if (now - createdTime > 30 * 24 * 3600 * 1000) return false;
        }
      }
      if (typeFilter !== "ALL") {
        const tType = t.templateType || "STANDARD";
        if (typeFilter === "CAROUSEL" && tType !== "CAROUSEL" && tType !== "IMAGE_CAROUSEL") return false;
        if (typeFilter === "CATALOGUE" && tType !== "CATALOGUE" && tType !== "CATALOG") return false;
        if (typeFilter !== "CAROUSEL" && typeFilter !== "CATALOGUE" && tType !== typeFilter) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      if (sortBy === "most_used") return (b.totalSent || 0) - (a.totalSent || 0);
      if (sortBy === "highest_read") return (b.readRate || 0) - (a.readRate || 0);
      if (sortBy === "alphabetical") return a.name.localeCompare(b.name);
      return 0;
    });

  const statusBadge = (status: string) => {
    const cfg: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
      APPROVED: { bg: "rgba(16,185,129,0.1)", color: "#10b981", icon: <CheckCircle2 size={12} /> },
      PENDING: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", icon: <Clock size={12} /> },
      REJECTED: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", icon: <AlertCircle size={12} /> },
      PAUSED: { bg: "rgba(107,114,128,0.1)", color: "#6b7280", icon: <Clock size={12} /> }
    };
    const c = cfg[status] || cfg.PENDING;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "3px 8px",
          background: c.bg,
          color: c.color,
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: 700
        }}
      >
        {c.icon} {status}
      </span>
    );
  };

  const formatBadge = (tType?: string) => {
    if (tType === "CAROUSEL" || tType === "IMAGE_CAROUSEL") {
      return (
        <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 text-[10px] font-black uppercase flex items-center gap-1">
          <Layers size={11} /> Image Carousel
        </span>
      );
    }
    if (tType === "CATALOGUE" || tType === "CATALOG") {
      return (
        <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 text-[10px] font-black uppercase flex items-center gap-1">
          <ShoppingBag size={11} /> Catalogue
        </span>
      );
    }
    if (tType === "FLOWS") {
      return (
        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase flex items-center gap-1">
          <CheckSquare size={11} /> Flows
        </span>
      );
    }
    if (tType === "ORDER_DETAILS") {
      return (
        <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase flex items-center gap-1">
          <CreditCard size={11} /> Order Details
        </span>
      );
    }
    if (tType === "ORDER_STATUS") {
      return (
        <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase flex items-center gap-1">
          <Truck size={11} /> Order Status
        </span>
      );
    }
    if (tType === "CALL_PERMISSIONS") {
      return (
        <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 text-[10px] font-black uppercase flex items-center gap-1">
          <Phone size={11} /> Call Permissions
        </span>
      );
    }
    if (tType === "LTO_COUPON") {
      return (
        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase flex items-center gap-1">
          <Tag size={11} /> LTO Coupon
        </span>
      );
    }
    if (tType === "AUTHENTICATION") {
      return (
        <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 text-[10px] font-black uppercase flex items-center gap-1">
          <Copy size={11} /> Authentication
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-[10px] font-extrabold uppercase">
        Default
      </span>
    );
  };

  const getRenderedPreviewText = (rawText: string) => {
    if (!rawText) return "";
    return rawText
      .replace(/\{\{1\}\}/g, "Alex")
      .replace(/\{\{2\}\}/g, "ORD-8921")
      .replace(/\{\{3\}\}/g, "₹1,499")
      .replace(/\{\{4\}\}/g, `https://${brandDomain}/track`)
      .replace(/\{\{(\d+)\}\}/g, "[Var $1]");
  };

  // Utility Presets List for active brand
  const utilityPresets = getUtilityPresetsList(brandName, brandDomain);

  // -------------------------------------------------------------
  // RENDER: FULL-PAGE CREATE STUDIO
  // -------------------------------------------------------------
  if (viewMode === "CREATE") {
    return (
      <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={headerFileInputRef}
          accept="image/*,video/*,application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileProcess(file, "HEADER");
          }}
          className="hidden"
        />
        <input
          type="file"
          ref={cardFileInputRef}
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileProcess(file, "CAROUSEL_CARD");
          }}
          className="hidden"
        />

        {/* Toast */}
        {toastMsg && (
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              zIndex: 9999,
              padding: "12px 18px",
              borderRadius: "10px",
              background: toastMsg.type === "error" ? "#ef4444" : "#10b981",
              color: "white",
              fontWeight: 700,
              fontSize: "13px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              maxWidth: "400px"
            }}
          >
            {toastMsg.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />} {toastMsg.text}
          </div>
        )}

        {/* Studio Top Navigation Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                resetForm();
                setViewMode("LIST");
              }}
              className="p-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-2xl transition shadow-2xs flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back to Templates</span>
            </button>

            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <FileCode size={22} className="text-indigo-600" />
                WhatsApp Template Creation Studio
              </h2>
              <p className="text-gray-500 text-xs mt-0.5">
                Brand Account: <span className="font-bold text-indigo-600 dark:text-indigo-400">{brandName}</span> ({brandDomain}) • Drag-and-drop media & live smartphone preview.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition cursor-pointer"
            >
              Reset Form
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !!nameError || !templateName}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-md shadow-indigo-500/25 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              <span>{saving ? "Submitting to Meta..." : "Submit Template to Meta →"}</span>
            </button>
          </div>
        </div>

        {/* 2-Column Full-Page Studio Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Editor Controls (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* STEP 1: CATEGORY SELECTION (MARKETING vs UTILITY vs AUTHENTICATION) */}
            <div className="bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xs">
              <label className="block text-xs font-black uppercase text-gray-500 tracking-wider mb-3">
                1. Select Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => handleCategorySelect(c.value as any)}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between h-28 cursor-pointer ${
                      category === c.value
                        ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/30"
                        : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-indigo-300"
                    }`}
                  >
                    <div className="font-black text-sm">{c.label}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                      {c.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 2: AVAILABLE MESSAGE TYPES FOR SELECTED CATEGORY (Official Meta WhatsApp Manager layout) */}
            <div className="bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-black uppercase text-gray-500 tracking-wider">
                  2. Choose Template Type ({category})
                </label>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  {category === "MARKETING"
                    ? "Official Meta Formats"
                    : category === "UTILITY"
                    ? "Transactional & Customer Lifecycle"
                    : "Secure One-Time Passcode"}
                </span>
              </div>

              {/* A) When MARKETING is selected */}
              {category === "MARKETING" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Default */}
                  <button
                    type="button"
                    onClick={() => handleTemplateTypeSelect("STANDARD")}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between min-h-[92px] cursor-pointer ${
                      templateType === "STANDARD"
                        ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/30 shadow-2xs"
                        : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileCode size={18} className={templateType === "STANDARD" ? "text-indigo-600" : "text-gray-400"} />
                      <div className="font-black text-xs">Default</div>
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                      Send messages with media and customised buttons to engage your customers.
                    </div>
                  </button>

                  {/* Image Carousel (Named exactly as requested: "name it image carsule") */}
                  <button
                    type="button"
                    onClick={() => handleTemplateTypeSelect("CAROUSEL")}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between min-h-[92px] relative overflow-hidden cursor-pointer ${
                      templateType === "CAROUSEL"
                        ? "border-purple-600 bg-purple-50/70 dark:bg-purple-950/50 text-purple-950 dark:text-purple-200 ring-2 ring-purple-500/30 shadow-2xs"
                        : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-purple-300"
                    }`}
                  >
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-purple-500 text-white text-[9px] font-black uppercase">
                      Swipeable
                    </span>
                    <div className="flex items-center gap-2">
                      <Layers size={18} className={templateType === "CAROUSEL" ? "text-purple-600" : "text-gray-400"} />
                      <div className="font-black text-xs">Image Carousel</div>
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                      Send up to 10 swipeable cards with images, body text, and interactive buttons.
                    </div>
                  </button>

                  {/* Catalogue */}
                  <button
                    type="button"
                    onClick={() => handleTemplateTypeSelect("CATALOGUE")}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between min-h-[92px] cursor-pointer ${
                      templateType === "CATALOGUE"
                        ? "border-sky-600 bg-sky-50/70 dark:bg-sky-950/50 text-sky-950 dark:text-sky-200 ring-2 ring-sky-500/30 shadow-2xs"
                        : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-sky-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={18} className={templateType === "CATALOGUE" ? "text-sky-600" : "text-gray-400"} />
                      <div className="font-black text-xs">Catalogue</div>
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                      Send messages that drive sales by connecting your product catalogue.
                    </div>
                  </button>

                  {/* Flows */}
                  <button
                    type="button"
                    onClick={() => handleTemplateTypeSelect("FLOWS")}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between min-h-[92px] cursor-pointer ${
                      templateType === "FLOWS"
                        ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/30 shadow-2xs"
                        : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckSquare size={18} className={templateType === "FLOWS" ? "text-emerald-600" : "text-gray-400"} />
                      <div className="font-black text-xs">Flows</div>
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                      Send a form to collect customer interests, appointment requests or run surveys.
                    </div>
                  </button>

                  {/* Order details */}
                  <button
                    type="button"
                    onClick={() => handleTemplateTypeSelect("ORDER_DETAILS")}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between min-h-[92px] cursor-pointer ${
                      templateType === "ORDER_DETAILS"
                        ? "border-amber-600 bg-amber-50/70 dark:bg-amber-950/50 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500/30 shadow-2xs"
                        : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-amber-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard size={18} className={templateType === "ORDER_DETAILS" ? "text-amber-600" : "text-gray-400"} />
                      <div className="font-black text-xs">Order details</div>
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                      Send messages through which customers can pay you.
                    </div>
                  </button>

                  {/* Calling permissions request */}
                  <button
                    type="button"
                    onClick={() => handleTemplateTypeSelect("CALL_PERMISSIONS")}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between min-h-[92px] cursor-pointer ${
                      templateType === "CALL_PERMISSIONS"
                        ? "border-rose-600 bg-rose-50/70 dark:bg-rose-950/50 text-rose-950 dark:text-rose-200 ring-2 ring-rose-500/30 shadow-2xs"
                        : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-rose-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Phone size={18} className={templateType === "CALL_PERMISSIONS" ? "text-rose-600" : "text-gray-400"} />
                      <div className="font-black text-xs">Calling permissions request</div>
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                      Ask customers if you can call them on WhatsApp.
                    </div>
                  </button>

                  {/* LTO / Discount Coupon */}
                  <button
                    type="button"
                    onClick={() => handleTemplateTypeSelect("LTO_COUPON")}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between min-h-[92px] cursor-pointer sm:col-span-2 ${
                      templateType === "LTO_COUPON"
                        ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/30 shadow-2xs"
                        : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Tag size={18} className={templateType === "LTO_COUPON" ? "text-emerald-600" : "text-gray-400"} />
                      <div className="font-black text-xs">LTO / Discount Coupon</div>
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                      Special promotional offer with 1-tap Copy Coupon Code banner.
                    </div>
                  </button>
                </div>
              )}

              {/* B) When UTILITY is selected */}
              {category === "UTILITY" && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Default */}
                    <button
                      type="button"
                      onClick={() => handleTemplateTypeSelect("STANDARD")}
                      className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between min-h-[92px] cursor-pointer ${
                        templateType === "STANDARD"
                          ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/30 shadow-2xs"
                          : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <PackageCheck size={18} className={templateType === "STANDARD" ? "text-indigo-600" : "text-gray-400"} />
                        <div className="font-black text-xs">Default</div>
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                        Send messages about an existing order or account.
                      </div>
                    </button>

                    {/* Order status */}
                    <button
                      type="button"
                      onClick={() => handleTemplateTypeSelect("ORDER_STATUS")}
                      className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between min-h-[92px] cursor-pointer ${
                        templateType === "ORDER_STATUS"
                          ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-950 dark:text-blue-200 ring-2 ring-blue-500/30 shadow-2xs"
                          : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Truck size={18} className={templateType === "ORDER_STATUS" ? "text-blue-600" : "text-gray-400"} />
                        <div className="font-black text-xs">Order status</div>
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                        Send messages to tell customers about the progress of their orders.
                      </div>
                    </button>

                    {/* Order details */}
                    <button
                      type="button"
                      onClick={() => handleTemplateTypeSelect("ORDER_DETAILS")}
                      className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between min-h-[92px] cursor-pointer ${
                        templateType === "ORDER_DETAILS"
                          ? "border-amber-600 bg-amber-50/70 dark:bg-amber-950/50 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500/30 shadow-2xs"
                          : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-amber-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard size={18} className={templateType === "ORDER_DETAILS" ? "text-amber-600" : "text-gray-400"} />
                        <div className="font-black text-xs">Order details</div>
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                        Send messages through which customers can pay you.
                      </div>
                    </button>

                    {/* Flows */}
                    <button
                      type="button"
                      onClick={() => handleTemplateTypeSelect("FLOWS")}
                      className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between min-h-[92px] cursor-pointer ${
                        templateType === "FLOWS"
                          ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/30 shadow-2xs"
                          : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-emerald-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckSquare size={18} className={templateType === "FLOWS" ? "text-emerald-600" : "text-gray-400"} />
                        <div className="font-black text-xs">Flows</div>
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                        Send a form to collect feedback, send reminders or manage orders.
                      </div>
                    </button>

                    {/* Calling permissions request */}
                    <button
                      type="button"
                      onClick={() => handleTemplateTypeSelect("CALL_PERMISSIONS")}
                      className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between min-h-[92px] cursor-pointer sm:col-span-2 ${
                        templateType === "CALL_PERMISSIONS"
                          ? "border-rose-600 bg-rose-50/70 dark:bg-rose-950/50 text-rose-950 dark:text-rose-200 ring-2 ring-rose-500/30 shadow-2xs"
                          : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-rose-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Phone size={18} className={templateType === "CALL_PERMISSIONS" ? "text-rose-600" : "text-gray-400"} />
                        <div className="font-black text-xs">Calling permissions request</div>
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                        Ask customers if you can call them on WhatsApp.
                      </div>
                    </button>
                  </div>

                  {/* Pre-approved Library when Default is selected */}
                  {templateType === "STANDARD" && (
                    <div className="p-3.5 bg-gray-50 dark:bg-slate-750 rounded-2xl border border-gray-200 dark:border-slate-700 flex flex-col gap-2">
                      <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        ⚡ Apply Instant Pre-approved Notification Template:
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {utilityPresets.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => applyUtilityPreset(p.id, brandName, brandDomain)}
                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer text-xs ${
                              utilityPreset === p.id
                                ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-black shadow-2xs"
                                : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-medium hover:border-indigo-300"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* C) When AUTHENTICATION is selected */}
              {category === "AUTHENTICATION" && (
                <div className="flex flex-col gap-4">
                  <div className="text-xs text-gray-600 dark:text-gray-300 font-bold">
                    Code delivery setup:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Copy code */}
                    <button
                      type="button"
                      onClick={() => setAuthCodeDelivery("COPY_CODE")}
                      className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        authCodeDelivery === "COPY_CODE"
                          ? "border-orange-500 bg-orange-50/70 dark:bg-orange-950/40 text-orange-950 dark:text-orange-200 ring-2 ring-orange-500/30 font-bold"
                          : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-orange-300"
                      }`}
                    >
                      <div className="font-black text-xs">Copy code</div>
                      <div className="text-[10px] text-gray-500 mt-1 leading-tight">
                        Basic authentication with quick setup. Customers copy and paste the code into your app.
                      </div>
                    </button>

                    {/* One-tap auto-fill */}
                    <button
                      type="button"
                      onClick={() => setAuthCodeDelivery("ONE_TAP")}
                      className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        authCodeDelivery === "ONE_TAP"
                          ? "border-orange-500 bg-orange-50/70 dark:bg-orange-950/40 text-orange-950 dark:text-orange-200 ring-2 ring-orange-500/30 font-bold"
                          : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-orange-300"
                      }`}
                    >
                      <div className="font-black text-xs">One-tap auto-fill</div>
                      <div className="text-[10px] text-gray-500 mt-1 leading-tight">
                        Code sends to your app when customers tap the button. Fallback to copy code if not supported.
                      </div>
                    </button>

                    {/* Zero-tap auto-fill */}
                    <button
                      type="button"
                      onClick={() => setAuthCodeDelivery("ZERO_TAP")}
                      className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                        authCodeDelivery === "ZERO_TAP"
                          ? "border-orange-500 bg-orange-50/70 dark:bg-orange-950/40 text-orange-950 dark:text-orange-200 ring-2 ring-orange-500/30 font-bold"
                          : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-orange-300"
                      }`}
                    >
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-orange-500 text-white text-[9px] font-black uppercase">
                        Recommended
                      </span>
                      <div className="font-black text-xs">Zero-tap auto-fill</div>
                      <div className="text-[10px] text-gray-500 mt-1 leading-tight">
                        Easiest option for customers. Zero-tap automatically sends code without requiring any tap.
                      </div>
                    </button>
                  </div>

                  {/* App Setup */}
                  <div className="p-4 bg-orange-50/50 dark:bg-orange-950/30 rounded-2xl border border-orange-200/80 dark:border-orange-900/40 flex flex-col gap-3">
                    <div className="text-xs font-black text-orange-900 dark:text-orange-200">
                      App Setup & Signature
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                          Package Name
                        </label>
                        <input
                          value={authPackageName}
                          onChange={(e) => setAuthPackageName(e.target.value)}
                          placeholder="com.example.myapplication"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                          App Signature Hash (11 chars)
                        </label>
                        <input
                          value={authAppSignatureHash}
                          onChange={(e) => setAuthAppSignatureHash(e.target.value)}
                          maxLength={11}
                          placeholder="e.g. K4w8v9N2q1P"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none"
                        />
                      </div>
                    </div>

                    {/* Content Options */}
                    <div className="pt-2 border-t border-orange-200/60 dark:border-orange-900/40 flex flex-col gap-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={authSecurityRecommendation}
                          onChange={(e) => setAuthSecurityRecommendation(e.target.checked)}
                          className="rounded text-orange-600 cursor-pointer"
                        />
                        <span>Add security recommendation ("For your security, do not share this code.")</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={authExpiryTime}
                          onChange={(e) => setAuthExpiryTime(e.target.checked)}
                          className="rounded text-orange-600 cursor-pointer"
                        />
                        <span>Add expiry time for the code (e.g. "Code expires in 10 minutes.")</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 3: TEMPLATE NAME & LANGUAGE */}
            <div className="bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xs flex flex-col gap-4">
              <label className="block text-xs font-black uppercase text-gray-500 tracking-wider">
                3. Template Identity
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase mb-1.5">
                    Template Name <span className="text-red-500">*</span>
                    <span className="font-normal text-gray-400 lowercase ml-1">(lowercase + underscores)</span>
                  </label>
                  <input
                    value={templateName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    placeholder={`e.g. ${brandName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_order_dispatch`}
                    className={`w-full px-4 py-2.5 bg-white dark:bg-slate-800 border ${
                      nameError ? "border-red-500" : "border-gray-200 dark:border-slate-700"
                    } rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                  {nameError && <p className="text-red-500 text-[11px] mt-1">{nameError}</p>}
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase mb-1.5">
                    Language <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none cursor-pointer"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* STEP 4: PROMINENT HEADER SECTION (AVAILABLE ACROSS ALL TEMPLATE TYPES!) */}
            <div className="bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-200 tracking-wider">
                  4. Header (Optional)
                </label>
                <span className="text-[11px] text-gray-400">
                  Select header type: Text or Direct Image/Media Upload
                </span>
              </div>

              {/* Header Type Selector Buttons */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { type: "NONE", label: "None" },
                  { type: "TEXT", label: "📝 Text" },
                  { type: "IMAGE", label: "🖼️ Image (Upload / Paste)" },
                  { type: "VIDEO", label: "🎥 Video" },
                  { type: "DOCUMENT", label: "📄 Document / PDF" }
                ].map((ht) => (
                  <button
                    key={ht.type}
                    type="button"
                    onClick={() => {
                      setHeaderType(ht.type as any);
                      if (ht.type === "NONE") {
                        setHeaderContent("");
                        setHeaderMediaPreview(null);
                      }
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition border cursor-pointer ${
                      headerType === ht.type
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-indigo-300"
                    }`}
                  >
                    {ht.label}
                  </button>
                ))}
              </div>

              {/* If Header is TEXT */}
              {headerType === "TEXT" && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase mb-1">
                    Header Text (Max 60 chars)
                  </label>
                  <input
                    value={headerContent}
                    onChange={(e) => setHeaderContent(e.target.value)}
                    placeholder={`e.g. ${brandName} Exclusive Sale!`}
                    maxLength={60}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* If Header is IMAGE / VIDEO / DOCUMENT - DIRECT DRAG & DROP / CLICK UPLOAD / PASTE DIRECTLY */}
              {(headerType === "IMAGE" || headerType === "VIDEO" || headerType === "DOCUMENT") && (
                <div
                  onPaste={(e) => handlePasteEvent(e, "HEADER")}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileProcess(file, "HEADER");
                  }}
                  className="p-5 border-2 border-dashed border-indigo-300 dark:border-indigo-800/80 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl flex flex-col items-center justify-center gap-3 text-center transition hover:border-indigo-500 cursor-pointer relative"
                  onClick={() => headerFileInputRef.current?.click()}
                >
                  {headerMediaPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={headerMediaPreview}
                        alt="Header preview"
                        className="max-h-40 rounded-xl object-contain shadow-md border border-gray-200 dark:border-slate-700"
                      />
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={14} /> Media Ready
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHeaderContent("");
                            setHeaderMediaPreview(null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300 text-xs font-bold hover:bg-red-200 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Upload size={24} />
                      </div>
                      <div>
                        <div className="text-xs font-black text-gray-800 dark:text-white">
                          Click to Upload, Drag & Drop, or Paste Directly (Ctrl+V)
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          Supports PNG, JPG, WEBP, MP4, and PDF
                        </div>
                      </div>
                      <button
                        type="button"
                        className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm"
                      >
                        Choose File
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* STEP 5: MESSAGE BODY CONTENT */}
            <div className="bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-gray-700 dark:text-gray-300">
                  5. {templateType === "CAROUSEL" ? "Carousel Introductory Message" : "Message Body Text"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={insertVariable}
                  className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-bold transition hover:bg-indigo-100 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles size={12} />
                  <span>Insert Variable {"{{n}}"}</span>
                </button>
              </div>

              <textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                rows={4}
                maxLength={META_LIMITS.BODY_MAX}
                placeholder={
                  category === "UTILITY"
                    ? `Hi {{1}}, thank you for shopping with ${brandName}! Your order #{{2}} of ₹{{3}} is confirmed and packed.`
                    : `Hi {{1}}, get FLAT 30% OFF on all ${brandName} collections today only! Use code: {{2}}`
                }
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-xs font-sans outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
              <p className="text-[10px] text-gray-400 text-right">
                {bodyText.length}/{META_LIMITS.BODY_MAX}
              </p>

              {/* Coupon Code Input for LTO */}
              {templateType === "LTO_COUPON" && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex flex-col gap-2">
                  <label className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase flex items-center gap-1.5">
                    <Tag size={13} />
                    Offer Discount / Coupon Code
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                      placeholder="e.g. FLAT30"
                      className="px-4 py-2 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-mono font-black text-emerald-700 dark:text-emerald-300 outline-none w-48 uppercase"
                    />
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      Recipients get a 1-tap "Copy Code" button in WhatsApp!
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 6: CAROUSEL CARDS STUDIO (Only when Carousel is selected) */}
            {templateType === "CAROUSEL" && (
              <div className="bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xs flex flex-col gap-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <label className="block text-xs font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider flex items-center gap-1.5">
                      <Layers size={14} />
                      6. Carousel Product Cards ({carouselCards.length}/10)
                    </label>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Upload or paste product images directly for each card with custom titles and buttons.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addCarouselCard}
                    disabled={carouselCards.length >= META_LIMITS.MAX_CAROUSEL_CARDS}
                    className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Add Card</span>
                  </button>
                </div>

                {/* Card Selector Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-100 dark:border-slate-700">
                  {carouselCards.map((c, idx) => (
                    <button
                      key={c.id || idx}
                      type="button"
                      onClick={() => setActiveCarouselCardIndex(idx)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                        activeCarouselCardIndex === idx
                          ? "bg-purple-600 text-white shadow-sm"
                          : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                      }`}
                    >
                      <span>Card {idx + 1}</span>
                      {carouselCards.length > 2 && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCarouselCard(idx);
                          }}
                          className="hover:text-red-300"
                        >
                          <X size={12} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Active Card Configuration */}
                {carouselCards[activeCarouselCardIndex] && (
                  <div className="p-4 bg-purple-50/40 dark:bg-purple-950/20 rounded-2xl border border-purple-100 dark:border-purple-900/50 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-purple-900 dark:text-purple-200">
                        Editing Card #{activeCarouselCardIndex + 1}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Meta allows 2-10 cards per carousel
                      </span>
                    </div>

                    {/* DIRECT DRAG & DROP / CLICK UPLOAD / PASTE FOR CAROUSEL CARD IMAGE */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase mb-1">
                        Card Product Image (Upload or Paste Directly)
                      </label>
                      <div
                        onPaste={(e) => handlePasteEvent(e, "CAROUSEL_CARD", activeCarouselCardIndex)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleFileProcess(file, "CAROUSEL_CARD", activeCarouselCardIndex);
                        }}
                        onClick={() => cardFileInputRef.current?.click()}
                        className="p-4 border-2 border-dashed border-purple-300 dark:border-purple-800 rounded-2xl bg-white dark:bg-slate-800 flex items-center gap-4 cursor-pointer hover:border-purple-500 transition"
                      >
                        {carouselCards[activeCarouselCardIndex].mediaUrl ? (
                          <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-700">
                            <img
                              src={carouselCards[activeCarouselCardIndex].mediaUrl}
                              alt="Card media"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 flex items-center justify-center flex-shrink-0">
                            <ImageIcon size={24} />
                          </div>
                        )}

                        <div className="flex-1 text-left">
                          <div className="text-xs font-black text-gray-800 dark:text-white">
                            Click to Upload or Paste Image (Ctrl+V)
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            Auto-fit to 1:1 square for WhatsApp carousels
                          </div>
                          <span className="inline-block mt-2 px-2.5 py-1 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-lg text-[10px] font-bold border border-purple-200 dark:border-purple-800">
                            Change Image
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Product Title / Header */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase mb-1">
                        Product Title / Card Header
                      </label>
                      <input
                        value={carouselCards[activeCarouselCardIndex].title}
                        onChange={(e) => updateActiveCard("title", e.target.value)}
                        placeholder={`e.g. ${brandName} Performance Tee`}
                        maxLength={80}
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>

                    {/* Product Description / Price */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase mb-1">
                        Card Body / Price / Description
                      </label>
                      <textarea
                        value={carouselCards[activeCarouselCardIndex].bodyText}
                        onChange={(e) => updateActiveCard("bodyText", e.target.value)}
                        rows={2}
                        placeholder="₹899 • Breathable 4-way stretch fabric"
                        maxLength={160}
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                      />
                    </div>

                    {/* Card CTA Buttons */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase">
                          Card Action Buttons (Max 2)
                        </label>
                        <button
                          type="button"
                          onClick={addCardButton}
                          disabled={carouselCards[activeCarouselCardIndex].buttons.length >= 2}
                          className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
                        >
                          + Add Button
                        </button>
                      </div>

                      <div className="flex flex-col gap-2">
                        {carouselCards[activeCarouselCardIndex].buttons.map((b, bIdx) => (
                          <div key={bIdx} className="flex gap-2 items-center">
                            <select
                              value={b.type}
                              onChange={(e) => updateCardButton(bIdx, "type", e.target.value)}
                              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              <option value="URL">🔗 URL</option>
                              <option value="QUICK_REPLY">↩️ Quick Reply</option>
                            </select>
                            <input
                              value={b.text}
                              onChange={(e) => updateCardButton(bIdx, "text", e.target.value)}
                              placeholder="Button Label"
                              className="w-32 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                            />
                            {b.type === "URL" && (
                              <input
                                value={b.url || ""}
                                onChange={(e) => updateCardButton(bIdx, "url", e.target.value)}
                                placeholder={`https://${brandDomain}/...`}
                                className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => removeCardButton(bIdx)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 7: PROMINENT FOOTER SECTION (AVAILABLE ACROSS ALL TEMPLATE TYPES!) */}
            <div className="bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300">
                  7. Footer (Optional)
                </label>
                <span className="text-[10px] text-gray-400">
                  {footerText.length}/{META_LIMITS.FOOTER_MAX} chars
                </span>
              </div>
              <input
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder={`e.g. ${brandName} | Reply STOP to opt out`}
                maxLength={META_LIMITS.FOOTER_MAX}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            {/* STEP 8: INTERACTIVE BUTTONS (FOR STANDARD & UTILITY TEMPLATES) */}
            {templateType !== "CAROUSEL" && (
              <div className="bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xs flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-gray-500 tracking-wider">
                    8. Interactive Buttons (Max 3)
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => addButton("QUICK_REPLY")}
                      className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      + Quick Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => addButton("URL")}
                      className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      + URL
                    </button>
                    <button
                      type="button"
                      onClick={() => addButton("PHONE_NUMBER")}
                      className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      + Call
                    </button>
                  </div>
                </div>

                {buttons.map((btn, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold">
                      {btn.type === "QUICK_REPLY" ? "↩️ QR" : btn.type === "URL" ? "🔗 URL" : btn.type === "COPY_CODE" ? "🏷️ Code" : "📞 Call"}
                    </span>
                    <input
                      value={btn.text}
                      onChange={(e) => updateButton(idx, "text", e.target.value)}
                      placeholder="Button Label"
                      maxLength={25}
                      className="w-36 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                    />
                    {btn.type === "URL" && (
                      <input
                        value={btn.url}
                        onChange={(e) => updateButton(idx, "url", e.target.value)}
                        placeholder={`https://${brandDomain}/...`}
                        className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                      />
                    )}
                    {btn.type === "PHONE_NUMBER" && (
                      <input
                        value={btn.phone_number}
                        onChange={(e) => updateButton(idx, "phone_number", e.target.value)}
                        placeholder="+917404388242"
                        className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeButton(idx)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Live Interactive Smartphone Simulator (5 Cols) */}
          <div className="lg:col-span-5 sticky top-6">
            <div className="bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-3xl p-5 shadow-lg flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Smartphone size={16} className="text-indigo-600" />
                  <span className="text-xs font-black uppercase text-gray-700 dark:text-gray-200">
                    Live WhatsApp Simulator
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase">
                  {category} • Meta View
                </span>
              </div>

              {/* Realistic Phone Frame */}
              <div className="w-full max-w-[340px] mx-auto bg-[#efeae2] dark:bg-slate-950 rounded-3xl border-4 border-gray-800 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col">
                {/* WhatsApp Chat Header with Dynamic Brand Name & Avatar */}
                <div className="bg-[#075e54] text-white p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white/20 text-white font-black text-xs flex items-center justify-center uppercase">
                      {brandName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-black flex items-center gap-1">
                        {brandName} Official
                        <CheckCircle2 size={11} className="text-emerald-300 fill-emerald-300 text-[#075e54]" />
                      </div>
                      <div className="text-[9px] text-emerald-200">Verified Business Account</div>
                    </div>
                  </div>
                  <div className="text-[10px] opacity-80">{liveCurrentTime}</div>
                </div>

                {/* WhatsApp Chat Area */}
                <div className="p-3 flex flex-col gap-3 min-h-[380px] max-h-[500px] overflow-y-auto">
                  {/* Chat Message Bubble */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tr-xs p-3 shadow-sm text-xs text-gray-900 dark:text-gray-100 max-w-[95%] flex flex-col gap-2 self-start">
                    
                    {/* Header Display */}
                    {headerType === "TEXT" && headerContent && (
                      <div className="font-black text-xs pb-1.5 border-b border-gray-100 dark:border-slate-700 text-gray-900 dark:text-white">
                        {headerContent}
                      </div>
                    )}

                    {headerType === "IMAGE" && headerMediaPreview && (
                      <div className="rounded-xl overflow-hidden max-h-40 bg-gray-100 dark:bg-slate-700">
                        <img
                          src={headerMediaPreview}
                          alt="Header media preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {headerType === "VIDEO" && (
                      <div className="h-32 rounded-xl bg-gray-900 text-white flex items-center justify-center gap-2 text-xs font-bold">
                        <Video size={20} />
                        <span>Video Header</span>
                      </div>
                    )}

                    {headerType === "DOCUMENT" && (
                      <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center gap-2 text-xs font-bold">
                        <FileCheck size={18} className="text-indigo-600" />
                        <span>Attached Document / PDF</span>
                      </div>
                    )}

                    {/* Message Body */}
                    <div className="whitespace-pre-wrap leading-relaxed text-xs">
                      {getRenderedPreviewText(bodyText) || (
                        <span className="text-gray-400 italic">Enter message body...</span>
                      )}
                    </div>

                    {/* Footer */}
                    {footerText && (
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 italic">
                        {footerText}
                      </div>
                    )}

                    {/* Catalogue Action Preview */}
                    {templateType === "CATALOGUE" && (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700 flex flex-col gap-2">
                        <div className="p-2.5 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800 text-[11px] text-sky-900 dark:text-sky-200 flex items-center gap-2">
                          <ShoppingBag size={14} className="text-sky-600 flex-shrink-0" />
                          <span className="font-bold">Catalog items connected from Meta Commerce</span>
                        </div>
                        <div className="bg-[#00a884] text-white rounded-xl py-2 px-3 text-center text-xs font-black flex items-center justify-center gap-1.5 shadow-sm">
                          <ShoppingBag size={13} />
                          <span>View catalog</span>
                        </div>
                      </div>
                    )}

                    {/* Flows Action Preview */}
                    {templateType === "FLOWS" && (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700 flex flex-col gap-2">
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                          <CheckSquare size={14} className="text-emerald-600 flex-shrink-0" />
                          <span className="font-bold">Interactive Meta Flow Form</span>
                        </div>
                        <div className="bg-emerald-600 text-white rounded-xl py-2 px-3 text-center text-xs font-black flex items-center justify-center gap-1.5 shadow-sm">
                          <FileCode size={13} />
                          <span>{flowButtonText || "View Flow"}</span>
                        </div>
                      </div>
                    )}

                    {/* Order Details Preview */}
                    {templateType === "ORDER_DETAILS" && (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700 flex flex-col gap-2">
                        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 flex flex-col gap-1 text-[11px]">
                          <div className="flex justify-between font-bold text-amber-950 dark:text-amber-200">
                            <span>Order #ESP-8834</span>
                            <span className="text-emerald-600 dark:text-emerald-400">Total: ₹1,499</span>
                          </div>
                          <div className="text-[10px] text-gray-500">1x Pro Dry-Fit Performance Tee</div>
                        </div>
                        <div className="bg-[#00a884] text-white rounded-xl py-2 px-3 text-center text-xs font-black flex items-center justify-center gap-1.5 shadow-sm">
                          <CreditCard size={13} />
                          <span>Review and Pay</span>
                        </div>
                      </div>
                    )}

                    {/* Order Status Preview */}
                    {templateType === "ORDER_STATUS" && (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700 flex flex-col gap-2">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-200">
                            <Truck size={14} className="text-blue-600" />
                            <span>Shipped via Bluedart</span>
                          </div>
                          <span className="text-[10px] text-blue-600 font-black">Out for delivery</span>
                        </div>
                        <div className="bg-blue-600 text-white rounded-xl py-2 px-3 text-center text-xs font-black flex items-center justify-center gap-1.5 shadow-sm">
                          <ExternalLink size={13} />
                          <span>Track shipment</span>
                        </div>
                      </div>
                    )}

                    {/* Calling Permissions Preview */}
                    {templateType === "CALL_PERMISSIONS" && (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700 flex flex-col gap-2">
                        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 text-[11px] text-rose-950 dark:text-rose-200">
                          {brandName} would like to call you on WhatsApp regarding your order inquiry.
                        </div>
                        <div className="bg-rose-600 text-white rounded-xl py-2 px-3 text-center text-xs font-black flex items-center justify-center gap-1.5 shadow-sm">
                          <Phone size={13} />
                          <span>Choose preference</span>
                        </div>
                      </div>
                    )}

                    {/* Authentication Preview */}
                    {category === "AUTHENTICATION" && (
                      <div className="mt-2 pt-2 border-t border-orange-100 dark:border-orange-950 flex flex-col gap-2">
                        {authSecurityRecommendation && (
                          <div className="text-[10px] text-gray-500 italic">
                            For your security, do not share this code.
                          </div>
                        )}
                        <div className="p-3 bg-orange-50 dark:bg-orange-950/50 rounded-xl border border-dashed border-orange-300 text-center flex flex-col gap-1.5">
                          <div className="text-[10px] font-bold text-orange-800 dark:text-orange-300 uppercase">
                            Verification Code:
                          </div>
                          <div className="py-1 px-4 bg-white dark:bg-slate-800 rounded-lg font-mono font-black text-lg text-orange-600 tracking-widest self-center shadow-2xs">
                            583 920
                          </div>
                          {authExpiryTime && (
                            <div className="text-[9px] text-orange-700 dark:text-orange-400">
                              ⏱️ Code expires in {authExpiryMinutes} minutes
                            </div>
                          )}
                        </div>
                        <div className="bg-orange-600 text-white rounded-xl py-2 px-3 text-center text-xs font-black flex items-center justify-center gap-1.5 shadow-sm">
                          <Copy size={13} />
                          <span>{authCodeDelivery === "ZERO_TAP" ? "Auto-filling in App..." : authCodeDelivery === "ONE_TAP" ? "One-Tap Verify" : "Copy code"}</span>
                        </div>
                      </div>
                    )}

                    {/* Standard CTA Buttons inside bubble */}
                    {templateType !== "CAROUSEL" && templateType !== "CATALOGUE" && templateType !== "FLOWS" && templateType !== "ORDER_DETAILS" && templateType !== "ORDER_STATUS" && templateType !== "CALL_PERMISSIONS" && category !== "AUTHENTICATION" && buttons.length > 0 && (
                      <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                        {buttons.map((b, i) => (
                          <div
                            key={i}
                            className="bg-gray-50 dark:bg-slate-700 rounded-xl py-1.5 px-3 text-center text-xs font-bold text-sky-600 dark:text-sky-400 border border-gray-200 dark:border-slate-600 flex items-center justify-center gap-1.5"
                          >
                            {b.type === "URL" ? "🔗" : b.type === "PHONE_NUMBER" ? "📞" : "↩️"}
                            <span>{b.text || "Action"}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* LTO Coupon Button */}
                    {templateType === "LTO_COUPON" && (
                      <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-dashed border-emerald-300 text-center flex flex-col gap-1">
                        <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-200">
                          COUPON DISCOUNT CODE:
                        </div>
                        <div className="py-1.5 px-3 bg-white dark:bg-slate-800 rounded-lg font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-center gap-1.5 shadow-2xs">
                          <Copy size={12} />
                          <span>{couponCode || "FLAT30"}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1 text-[9px] text-gray-400 mt-1">
                      <span>{liveCurrentTime}</span>
                      <CheckCheck size={12} className="text-sky-500 stroke-[2.5]" />
                    </div>
                  </div>

                  {/* CAROUSEL SWIPEABLE PREVIEW */}
                  {templateType === "CAROUSEL" && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-purple-700 dark:text-purple-300">
                        <span>Swipeable Cards Preview ({carouselCards.length}):</span>
                        <span>← Scroll Horizontally →</span>
                      </div>

                      {/* Scroll container */}
                      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                        {carouselCards.map((card, cIdx) => (
                          <div
                            key={cIdx}
                            className="w-[200px] flex-shrink-0 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col justify-between"
                          >
                            <div>
                              {/* Media */}
                              <div className="h-28 bg-gray-100 dark:bg-slate-700 relative overflow-hidden">
                                {card.mediaUrl ? (
                                  <img
                                    src={card.mediaUrl}
                                    alt={card.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <ImageIcon size={24} />
                                  </div>
                                )}
                                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-bold">
                                  #{cIdx + 1}
                                </span>
                              </div>

                              {/* Card Content */}
                              <div className="p-2.5 flex flex-col gap-1">
                                <div className="font-black text-xs text-gray-900 dark:text-white leading-snug">
                                  {card.title || "Product Title"}
                                </div>
                                <div className="text-[10px] text-gray-600 dark:text-gray-300 leading-tight">
                                  {card.bodyText || "Price and description"}
                                </div>
                              </div>
                            </div>

                            {/* Card Buttons */}
                            <div className="p-2 pt-0 flex flex-col gap-1 border-t border-gray-100 dark:border-slate-700 mt-2">
                              {card.buttons.map((b, bi) => (
                                <div
                                  key={bi}
                                  className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg py-1 px-2 text-center text-[10px] font-bold border border-indigo-200 dark:border-indigo-800"
                                >
                                  {b.type === "URL" ? "🔗 " : "↩️ "}
                                  {b.text || "Action"}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Meta Approval SLA Box */}
              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 text-[11px] text-indigo-900 dark:text-indigo-200 leading-relaxed">
                <strong>Meta Approval Rules:</strong>
                <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[10px]">
                  <li>Utility messages must NOT contain marketing or promotional content.</li>
                  <li>Carousel cards must have between 2 and 10 cards.</li>
                  <li>Images are verified automatically by Meta AI within 2-15 minutes.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: TEMPLATES LIST PAGE
  // -------------------------------------------------------------
  return (
    <div className="w-full flex flex-col gap-6">
      {/* Toast */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            padding: "12px 18px",
            borderRadius: "10px",
            background: toastMsg.type === "error" ? "#ef4444" : "#10b981",
            color: "white",
            fontWeight: 700,
            fontSize: "13px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            maxWidth: "400px"
          }}
        >
          {toastMsg.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />} {toastMsg.text}
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <FileCode size={22} className="text-indigo-600" />
            Meta Message Templates & Live Preview
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">
            Connected Brand: <span className="font-bold text-indigo-600 dark:text-indigo-400">{brandName}</span> • Standard, Product Carousel (Swipeable), and Coupon templates.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="Test phone (91XXXXXXXXXX)"
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 shadow-2xs"
          />
          <button
            onClick={fetchTemplates}
            disabled={loading}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-indigo-600" : ""} />
            <span>Sync Meta</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              setViewMode("CREATE");
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-md shadow-indigo-500/20 active:scale-95 cursor-pointer"
          >
            <Plus size={15} />
            <span>New Template Studio</span>
          </button>
        </div>
      </div>

      {/* Filter & Sort Toolbar */}
      <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates or body text..."
              className="pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500 w-56"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Type / Format Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none cursor-pointer text-purple-600 dark:text-purple-400"
          >
            <option value="ALL">All Message Types</option>
            <option value="STANDARD">📄 Default</option>
            <option value="CAROUSEL">🖼️ Image Carousel</option>
            <option value="CATALOGUE">🛍️ Catalogue</option>
            <option value="FLOWS">📋 Flows</option>
            <option value="ORDER_DETAILS">💳 Order details</option>
            <option value="ORDER_STATUS">🚚 Order status</option>
            <option value="CALL_PERMISSIONS">📞 Call permissions</option>
            <option value="LTO_COUPON">🏷️ LTO Coupon</option>
            <option value="AUTHENTICATION">🔐 Authentication</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">✅ Approved</option>
            <option value="PENDING">⏳ Pending</option>
            <option value="REJECTED">❌ Rejected</option>
          </select>

          {/* Time Range Filter */}
          <select
            value={timeRangeFilter}
            onChange={(e) => setTimeRangeFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none cursor-pointer text-indigo-600 dark:text-indigo-400"
          >
            <option value="ALL">🕒 All Time</option>
            <option value="TODAY">📅 Created Today</option>
            <option value="7D">⚡ Last 7 Days</option>
            <option value="30D">📊 Last 30 Days</option>
          </select>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
            <ArrowUpDown size={12} /> Sort By:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-black outline-none cursor-pointer"
          >
            <option value="newest">🕒 Newest Created</option>
            <option value="oldest">⏳ Oldest First</option>
            <option value="most_used">🚀 Most Sent / Dispatched</option>
            <option value="highest_read">👁️ Highest Read Rate</option>
            <option value="alphabetical">🔤 Name (A-Z)</option>
          </select>

          <span className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-[11px] font-bold text-gray-600 dark:text-gray-300">
            {filtered.length} {filtered.length === 1 ? "Template" : "Templates"}
          </span>
        </div>
      </div>

      {/* Template Cards Grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">
          <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-indigo-500" />
          <div className="font-bold text-xs">Syncing templates from Meta Cloud API...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-gray-50/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
          <FileCode size={44} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <h3 className="font-black text-gray-800 dark:text-white text-base mb-1">No message templates found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
            Create your first Meta WhatsApp template using the dedicated Template Studio.
          </p>
          <button
            onClick={() => {
              resetForm();
              setViewMode("CREATE");
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            + Open Template Studio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => {
            const createdFormatted = t.createdAt
              ? new Date(t.createdAt).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true
                })
              : "Synchronized";

            const previewTime = t.createdAt
              ? new Date(t.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
              : liveCurrentTime;

            let parsedCards: CarouselCardItem[] = [];
            if (t.carouselCards) {
              try {
                parsedCards = JSON.parse(t.carouselCards);
              } catch {}
            }

            return (
              <div
                key={t.id || t.name}
                className="bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-3xl p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between gap-3.5"
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-black text-sm text-gray-900 dark:text-white tracking-tight break-all">
                        {t.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {statusBadge(t.status)}
                        {formatBadge(t.templateType)}
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                          {t.category}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-500">
                          {t.language || "en_US"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(t.name)}
                      disabled={deleting === t.name}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition cursor-pointer"
                      title="Delete Template from Meta"
                    >
                      {deleting === t.name ? <RefreshCw size={14} className="animate-spin text-red-500" /> : <Trash2 size={15} />}
                    </button>
                  </div>

                  {/* Creation Timestamp Badge */}
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1 mb-2.5">
                    <Calendar size={11} className="text-gray-400" />
                    <span>Created: {createdFormatted}</span>
                  </div>

                  {/* WhatsApp Chat Preview Bubble */}
                  <div className="bg-[#e2ffc7] dark:bg-emerald-950/40 border border-[#c6f0a4] dark:border-emerald-800/50 rounded-2xl rounded-tr-xs p-3.5 text-xs text-gray-900 dark:text-gray-100 shadow-2xs">
                    {t.headerContent && (
                      <div className="font-black text-xs text-gray-900 dark:text-white mb-1.5 pb-1 border-b border-emerald-300/40 dark:border-emerald-700/40">
                        {t.headerContent}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap leading-relaxed font-sans text-xs">
                      {t.bodyText?.slice(0, 200)}
                      {t.bodyText?.length > 200 ? "..." : ""}
                    </div>
                    {t.footerText && (
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 italic">
                        {t.footerText}
                      </div>
                    )}

                    {/* Carousel indicator snippet */}
                    {t.templateType === "CAROUSEL" && parsedCards.length > 0 && (
                      <div className="mt-2.5 p-2 bg-purple-100/70 dark:bg-purple-950/60 rounded-xl border border-purple-200 dark:border-purple-800 text-[10px] text-purple-900 dark:text-purple-200 font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Layers size={12} />
                          {parsedCards.length} Product Cards
                        </span>
                        <span className="text-[9px] uppercase font-black">Swipeable</span>
                      </div>
                    )}

                    {/* Dynamic Message Time with Blue Double Ticks */}
                    <div className="flex items-center justify-end gap-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-1">
                      <span>{previewTime}</span>
                      <CheckCheck size={13} className="text-sky-500 inline stroke-[2.5]" />
                    </div>
                  </div>

                  {/* Buttons preview */}
                  {t.buttons && t.buttons !== "[]" && (() => {
                    try {
                      const btns = JSON.parse(t.buttons);
                      if (btns.length > 0) {
                        return (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {btns.map((b: any, i: number) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-[10px] font-bold flex items-center gap-1"
                              >
                                {b.type === "URL" ? "🔗" : b.type === "PHONE_NUMBER" ? "📞" : b.type === "COPY_CODE" ? "🏷️" : "↩️"} {b.text}
                              </span>
                            ))}
                          </div>
                        );
                      }
                    } catch {}
                    return null;
                  })()}
                </div>

                {/* Bottom Analytics & Actions */}
                <div className="pt-3 border-t border-gray-100 dark:border-slate-700 flex flex-col gap-2.5">
                  {/* Performance stats mini-strip */}
                  <div className="grid grid-cols-4 gap-1.5 p-2 bg-gray-50/80 dark:bg-slate-900/60 rounded-xl text-center border border-gray-100 dark:border-slate-800">
                    <div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase">Broadcasts</div>
                      <div className="text-xs font-black text-gray-800 dark:text-white mt-0.5">{t.campaignsCount || 0}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase">Sent</div>
                      <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{t.totalSent || 0}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase">Read Rate</div>
                      <div className="text-xs font-black text-cyan-600 dark:text-cyan-400 mt-0.5">{t.readRate || 0}%</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase">CTR</div>
                      <div className="text-xs font-black text-purple-600 dark:text-purple-400 mt-0.5">{t.clickRate || 0}%</div>
                    </div>
                  </div>

                  {/* Test Send Button */}
                  {t.status === "APPROVED" && (
                    <button
                      onClick={() => handleTest(t)}
                      disabled={testingTemplate === t.name}
                      className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                    >
                      {testingTemplate === t.name ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Send size={13} />
                      )}
                      <span>{testingTemplate === t.name ? "Sending Test..." : "Send Test to Phone"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
