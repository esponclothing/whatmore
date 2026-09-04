"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  MapPin,
  User,
  Link as LinkIcon,
  Layers,
  HelpCircle,
  List,
  Mail,
  Phone,
  Calendar,
  Star,
  Sliders,
  GitBranch,
  Clock,
  Shuffle,
  CornerDownRight,
  CreditCard,
  QrCode,
  DollarSign,
  ShoppingBag,
  ShoppingCart,
  Globe,
  UserPlus, Target, Users,
  UserCheck,
  Bot,
  Sparkles,
  Play,
  CheckCircle2,
  RotateCcw,
  RotateCw,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  X,
  Save,
  ChevronDown,
  ChevronRight,
  Trash2,
  Copy,
  Focus,
  Hand,
  Check,
  Plus,
  Radio,
  Settings,
  FolderOpen,
  Power,
  GripVertical,
  ExternalLink,
  ShieldCheck,
  Tag
} from "lucide-react";
import {
  getWhatsAppChatbotFlows,
  saveWhatsAppChatbotFlowAction,
  deleteWhatsAppChatbotFlowAction,
  duplicateWhatsAppChatbotFlowAction,
  toggleWhatsAppChatbotFlowStatusAction,
  getAllEmployeesAndTeams,
  getTeamsWithMembersAction,
  getProductsAction,
  getWhatsAppTemplates
} from "@/app/actions/whatsAppPlatformActions";
import { getWhatsAppIntegrationsAction } from "@/app/actions/whatsAppIntegrationActions";
import "@/components/whatsapp/ChatbotBuilder.css";

// Block Library Categories
const blockCategories = [
  {
    name: "Messages",
    count: 11,
    blocks: [
      { id: "text", name: "Text", icon: MessageSquare },
      { id: "image", name: "Image", icon: ImageIcon },
      { id: "video", name: "Video", icon: Video },
      { id: "youtube", name: "YouTube", icon: Video },
      { id: "file", name: "File / PDF", icon: FileText },
      { id: "audio", name: "Audio", icon: Music },
      { id: "location", name: "Location", icon: MapPin },
      { id: "contact", name: "Contact", icon: User },
      { id: "link", name: "Link", icon: LinkIcon },
      { id: "carousel", name: "Media Carousel", icon: Layers },
      { id: "request", name: "Request", icon: HelpCircle }
    ]
  },
  {
    name: "Choices",
    count: 2,
    blocks: [
      { id: "buttons", name: "Buttons", icon: List },
      { id: "list_menu", name: "List Menu", icon: Layers }
    ]
  },
  {
    name: "Inputs",
    count: 5,
    blocks: [
      { id: "input_name", name: "Name Input", icon: User },
      { id: "input_email", name: "Email Input", icon: Mail },
      { id: "input_phone", name: "Phone Input", icon: Phone },
      { id: "input_date", name: "Date Input", icon: Calendar },
      { id: "input_rating", name: "Rating Input", icon: Star }
    ]
  },
  {
    name: "Logic",
    count: 5,
    blocks: [
      { id: "set_var", name: "Set Variable", icon: Sliders },
      { id: "condition", name: "Condition (If/Else)", icon: GitBranch },
      { id: "delay", name: "Delay / Wait", icon: Clock },
      { id: "split_test", name: "Split Test (A/B)", icon: Shuffle },
      { id: "jump", name: "Jump to Block", icon: CornerDownRight }
    ]
  },
  {
    name: "Payments",
    count: 3,
    blocks: [
      { id: "pay_link", name: "Payment Link", icon: CreditCard },
      { id: "pay_qr", name: "UPI QR Code", icon: QrCode },
      { id: "pay_collect", name: "Collect Payment", icon: DollarSign }
    ]
  },
  {
    name: "E-Commerce",
    count: 2,
    blocks: [
      { id: "catalog", name: "Product Catalog", icon: ShoppingBag },
      { id: "order", name: "Multi-Item Order", icon: ShoppingCart }
    ]
  },
  {
    name: "API & Live Data",
    count: 1,
    blocks: [
      { id: "webhook", name: "Webhook Fetch", icon: Globe }
    ]
  },
  {
    name: "Connect (CRM)",
    count: 3,
    blocks: [
      { id: "crm_contact", name: "Update CRM Contact", icon: UserCheck },
      { id: "crm_lead", name: "Create Lead", icon: UserPlus },
      { id: "crm_roundrobin", name: "Assign Sales Rep", icon: Shuffle }
    ]
  },
  {
    name: "Meta Suite & Ads",
    count: 4,
    blocks: [
      { id: "meta_capi", name: "Meta CAPI Event", icon: Target },
      { id: "meta_ctwa_ad", name: "CTWA Ad Attribution", icon: Sparkles },
      { id: "meta_custom_audience", name: "Meta Audience Sync", icon: Users },
      { id: "meta_template", name: "Send Meta Template", icon: Bot }
    ]
  },
  {
    name: "AI Automation",
    count: 1,
    blocks: [
      { id: "ai_bot", name: "AI GPT Intent", icon: Bot }
    ]
  }
];

// Pre-built WATI & Galabox Templates
const BOT_TEMPLATES = [
  {
    id: "wati_lead_gen",
    name: "WATI Style Lead Qualification & Menu Bot",
    platform: "WATI",
    description: "Inquiry router that auto-categorizes incoming messages into Retailer/Wholesaler, tags contacts in CRM, and assigns agents via Round-Robin.",
    triggerKeyword: "HI, HELLO, INQUIRY, PRICING",
    nodes: [
      {
        id: "node_trigger",
        type: "TRIGGER",
        category: "trigger",
        title: "FLOW TRIGGER",
        x: 30,
        y: 100,
        text: "Incoming Message matches: HI, HELLO, INQUIRY",
        outputPort: "node_start"
      },
      {
        id: "node_start",
        type: "START",
        category: "start",
        title: "Start / Auto Assign",
        x: 330,
        y: 100,
        text: "Assign via Round-Robin distribution to Sales Team",
        outputPort: "node_menu"
      },
      {
        id: "node_menu",
        type: "CHOICE",
        category: "choice",
        title: "Inquiry Menu",
        x: 630,
        y: 100,
        imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500",
        text: "Welcome to Espon Clothing Wholesale! Please select your inquiry category below:",
        choices: [
          { id: "c1", text: "1. Retailer / Shop Owner", targetNode: "node_crm_retail" },
          { id: "c2", text: "2. Wholesaler / Bulk Buyer", targetNode: "node_crm_wholesale" },
          { id: "c3", text: "3. Personal Inquiry", targetNode: "node_end_personal" }
        ]
      },
      {
        id: "node_crm_retail",
        type: "CRM_CONTACT",
        category: "crm",
        title: "Update CRM Contact (Retailer)",
        x: 970,
        y: 40,
        leadStage: "Qualified Retailer",
        temperature: "WARM",
        tags: "Retailer, Qualified",
        text: "Update CRM Contact:\n• Lead Stage: Qualified Retailer\n• Priority: MEDIUM",
        outputPort: "node_end_b2b"
      },
      {
        id: "node_crm_wholesale",
        type: "CRM_CONTACT",
        category: "crm",
        title: "Update CRM Contact (Wholesale)",
        x: 970,
        y: 200,
        leadStage: "Wholesale Inquiry",
        temperature: "HOT",
        tags: "Wholesale, Hot Lead",
        text: "Update CRM Contact:\n• Lead Stage: Wholesale Inquiry\n• Priority: HIGH",
        outputPort: "node_end_b2b"
      },
      {
        id: "node_end_personal",
        type: "END",
        category: "end",
        title: "Personal Store Link",
        x: 970,
        y: 360,
        text: "For personal use, visit our online retail store directly:",
        buttonText: "Visit Online Store 🛍️",
        url: "https://espon.in/shop"
      },
      {
        id: "node_end_b2b",
        type: "END",
        category: "end",
        title: "Confirmation & Callback",
        x: 1300,
        y: 120,
        text: "Thank you! Our wholesale specialist will call you shortly with catalog & pricing details.",
        buttonText: "View Catalog 📄",
        url: "https://espon.in/catalog.pdf"
      }
    ]
  },
  {
    id: "galabox_ecom",
    name: "Galabox E-Commerce & Order Tracking Bot",
    platform: "Galabox",
    description: "Multi-option e-commerce bot supporting product catalog browsing, live order tracking by AWB, and quick UPI payment collection.",
    triggerKeyword: "CATALOG, ORDER, TRACK, PAYMENT",
    nodes: [
      {
        id: "node_trigger",
        type: "TRIGGER",
        category: "trigger",
        title: "FLOW TRIGGER",
        x: 30,
        y: 100,
        text: "Incoming Message matches: CATALOG, ORDER, TRACK",
        outputPort: "node_welcome"
      },
      {
        id: "node_welcome",
        type: "CHOICE",
        category: "choice",
        title: "E-Commerce Main Menu",
        x: 330,
        y: 100,
        text: "Welcome to Espon Apparel Direct! How can we assist your order today?",
        choices: [
          { id: "g1", text: "🛍️ Browse Apparel Catalog", targetNode: "node_catalog" },
          { id: "g2", text: "🚚 Track Existing Order", targetNode: "node_track_input" },
          { id: "g3", text: "💳 Pay Pending Invoice", targetNode: "node_payment_qr" }
        ]
      },
      {
        id: "node_catalog",
        type: "CATALOG",
        category: "choice",
        title: "Product Catalog Carousel",
        x: 680,
        y: 40,
        categoryName: "Wholesale Activewear",
        text: "Here are our top trending wholesale categories for 2026. Select item to request quotation.",
        outputPort: "node_catalog_end"
      },
      {
        id: "node_track_input",
        type: "INPUT_PHONE",
        category: "input",
        title: "Order ID / Mobile Input",
        x: 680,
        y: 200,
        variableName: "customer_mobile",
        retryMessage: "Invalid mobile number. Enter 10 digits.",
        text: "Please reply with your 10-digit registered mobile number or Order ID (e.g. ORD-1092).",
        outputPort: "node_track_result"
      },
      {
        id: "node_payment_qr",
        type: "PAY_QR",
        category: "payment",
        title: "Instant UPI QR Code",
        x: 680,
        y: 360,
        amount: 2500,
        upiId: "7206066678@OKBIZAXIS",
        payeeName: "Espon Clothing Pvt Ltd",
        text: "Scan QR code or click payment link below to complete payment instantly via GooglePay / PhonePe:",
        outputPort: "node_pay_end"
      },
      {
        id: "node_catalog_end",
        type: "END",
        category: "end",
        title: "Catalog Request Shared",
        x: 1000,
        y: 40,
        text: "Catalog PDF downloaded. Our representative will contact you for custom manufacturing orders."
      },
      {
        id: "node_track_result",
        type: "END",
        category: "end",
        title: "Tracking Details",
        x: 1000,
        y: 200,
        text: "Your order status: IN TRANSIT (Delhivery Courier AWB #7890123). Expected Delivery: Tomorrow 5 PM."
      },
      {
        id: "node_pay_end",
        type: "END",
        category: "end",
        title: "Payment Receipt Sent",
        x: 1000,
        y: 360,
        text: "Once payment is completed, your invoice receipt will be sent here automatically."
      }
    ]
  },
  {
    id: "blank",
    name: "Blank Canvas Bot Flow",
    platform: "Custom",
    description: "Start with a clean canvas containing only standard Flow Trigger and Start nodes.",
    triggerKeyword: "HI, START",
    nodes: [
      {
        id: "node_trigger",
        type: "TRIGGER",
        category: "trigger",
        title: "FLOW TRIGGER",
        x: 30,
        y: 100,
        triggerKeywords: "HI, HELLO",
        text: "Incoming Message matches: HI, HELLO",
        outputPort: "node_start"
      },
      {
        id: "node_start",
        type: "START",
        category: "start",
        title: "Start Node",
        x: 330,
        y: 100,
        text: "Start building your customized chatbot flow..."
      }
    ]
  }
];

export default function WhatsAppChatbotBuilderPage() {
  // DB Saved Flow State
  const [savedFlows, setSavedFlows] = useState<any[]>([]);

  // Shopify-style Unsaved Tracking State
  const [lastSavedNodesJson, setLastSavedNodesJson] = useState<string>("");
  const [lastSavedFlowName, setLastSavedFlowName] = useState<string>("");
  const [lastSavedTriggerKeyword, setLastSavedTriggerKeyword] = useState<string>("");
  const [lastSavedIsBotActive, setLastSavedIsBotActive] = useState<boolean>(true);
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(null);
  const [flowName, setFlowName] = useState<string>("Default Chatbot Flow");
  const [triggerKeyword, setTriggerKeyword] = useState<string>("HI, HELLO, CATALOG");
  const [isBotActive, setIsBotActive] = useState<boolean>(true);
  const [isLoadingFlows, setIsLoadingFlows] = useState<boolean>(true);

  // Live Data for Dropdowns
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [availableCollections, setAvailableCollections] = useState<string[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);

  // JSON File Import/Export Ref
  const jsonFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showManageModal, setShowManageModal] = useState<boolean>(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("wati_lead_gen");
  const [drawerTab, setDrawerTab] = useState<"basic" | "advanced">("basic");
  const [newBotNameInput, setNewBotNameInput] = useState<string>("");
  const [newBotKeywordInput, setNewBotKeywordInput] = useState<string>("");

  // Canvas Node State
  const [nodes, setNodes] = useState<any[]>(BOT_TEMPLATES[0].nodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [openCategories, setOpenCategories] = useState<{ [key: string]: boolean }>({ Messages: true, Choices: true });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [blockSearch, setBlockSearch] = useState<string>("");

  // Dragging Node state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

  // Interactive Drag-to-Connect Wire State
  const [connectingFrom, setConnectingFrom] = useState<{
    sourceNodeId: string;
    choiceId?: string;
    choiceIndex?: number;
    startX: number;
    startY: number;
  } | null>(null);
  const [connectingMousePos, setConnectingMousePos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredTargetNodeId, setHoveredTargetNodeId] = useState<string | null>(null);

  // Full Screen Studio State
  const [isFullScreenStudio, setIsFullScreenStudio] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [historyStack, setHistoryStack] = useState<any[]>([BOT_TEMPLATES[0].nodes]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState("builder"); 

  // Zoom & Pan State
  const [zoom, setZoom] = useState<number>(0.75);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [portCoords, setPortCoords] = useState<{[key: string]: {x: number, y: number}}>({});

  const updatePortCoords = () => {
    if (typeof window === "undefined") return;
    const coords: {[key: string]: {x: number, y: number}} = {};
    const ports = document.querySelectorAll('.node-input-port, .node-output-port, .choice-option-port');
    ports.forEach(el => {
      if (!el.id) return;
      let x = el.offsetWidth / 2;
      let y = el.offsetHeight / 2;
      let current: HTMLElement | null = el as HTMLElement;
      while (current && !current.classList.contains("canvas-pan-zoom-container")) {
        x += current.offsetLeft;
        y += current.offsetTop;
        current = current.offsetParent as HTMLElement;
      }
      if (current) {
        coords[el.id] = { x, y };
      }
    });
    setPortCoords(coords);
  };

  const getPortCoords = (portId: string, fallback: { x: number; y: number }) => {
    return portCoords[portId] || fallback;
  };

  // Simulator Modal State
  const [showSimModal, setShowSimModal] = useState<boolean>(false);
  const [simMessages, setSimMessages] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  useEffect(() => {
    // Recalculate port coordinates after DOM layout updates
    updatePortCoords();
  }, [nodes, currentFlowId, zoom]);

  // Discard unsaved changes handler
  const handleDiscardChanges = () => {
    setFlowName(lastSavedFlowName);
    setTriggerKeyword(lastSavedTriggerKeyword);
    setIsBotActive(lastSavedIsBotActive);
    if (lastSavedNodesJson) {
      try {
        const parsed = JSON.parse(lastSavedNodesJson);
        if (Array.isArray(parsed)) {
          setNodes(parsed);
          setHistoryStack([parsed]);
          setHistoryIndex(0);
          setSelectedNodeId(null);
          setSelectedNodeIds(new Set());
          setIsDrawerOpen(false);
          setToastMsg("✓ Discarded unsaved changes");
          setTimeout(() => setToastMsg(null), 3000);
        }
      } catch (e) {
        console.error("Discard failed:", e);
      }
    }
  };
  // Import Flow by JSON file
  const handleImportJsonFlow = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        let importedNodes = null;
        let importedName = null;
        let importedKeyword = null;

        // Support for ShopLinx chatbot flow export format mapping
        if (parsed.kind === "shoplinx_whatsapp_chatbot_flow_export" && parsed.flow?.graph) {
          console.log("[Import JSON] Parsing ShopLinx graph format...");
          const graph = parsed.flow.graph;
          const groups = graph.groups || [];
          const edges = graph.edges || [];
          
          const mappedNodes = [];

          // Helper to resolve the first block ID of a group
          const getGroupFirstBlockId = (groupId) => {
            const grp = groups.find((g) => g.id === groupId);
            if (grp && grp.blocks && grp.blocks.length > 0) {
              return grp.blocks[0].id;
            }
            return null;
          };

          // Step 1: Create flat nodes from groups and blocks
          groups.forEach((group) => {
            const gx = group.position?.x || 100;
            const gy = group.position?.y || 100;

            (group.blocks || []).forEach((block) => {
              const node = {
                id: block.id,
                x: gx,
                y: gy,
                title: group.name || "Block",
                category: "message",
                text: ""
              };

              // Map properties based on ShopLinx block type classifications
              if (block.type === "conversation_action") {
                node.type = "START";
                node.category = "start";
                node.title = "Auto Assign / Start";
                node.text = `Assign via ${block.config?.actionType || 'Round Robin'}`;
              } else if (block.type === "interactive_buttons") {
                node.type = "CHOICE";
                node.category = "choice";
                node.title = "Buttons Option";
                node.text = block.config?.body?.text || "Options:";
                node.choices = (block.config?.buttons || []).map((btn) => ({
                  id: btn.id,
                  text: btn.title
                }));
              } else if (block.type === "update_contact") {
                node.type = "crm_contact";
                node.category = "crm";
                node.title = "Update CRM Tags";
                node.text = `Add tag IDs: ${(block.config?.addTagIds || []).join(", ")}`;
              } else if (block.type === "interactive_cta_url") {
                node.type = "link";
                node.category = "message";
                node.title = block.config?.buttonText || "Link Button";
                node.text = block.config?.bodyText || "Visit website:";
                node.url = block.config?.url || "";
              } else {
                node.type = "TEXT";
                node.category = "message";
                node.text = block.config?.text || "Unsupported custom block";
              }

              mappedNodes.push(node);
            });
          });

          // Step 2: Route edges to output ports
          mappedNodes.forEach((node) => {
            if (node.type === "CHOICE" && node.choices) {
              node.choices = node.choices.map((choice) => {
                const matchingEdge = edges.find((edge) => 
                  edge.from?.blockId === node.id && 
                  (edge.from?.portKey === `button:${choice.id}` || edge.from?.portKey === choice.id)
                );
                if (matchingEdge) {
                  const targetBlockId = getGroupFirstBlockId(matchingEdge.to?.groupId);
                  if (targetBlockId) {
                    return { ...choice, outputPort: targetBlockId };
                  }
                }
                return choice;
              });
            } else {
              const matchingEdge = edges.find((edge) => edge.from?.blockId === node.id);
              if (matchingEdge) {
                const targetBlockId = getGroupFirstBlockId(matchingEdge.to?.groupId);
                if (targetBlockId) {
                  node.outputPort = targetBlockId;
                }
              }
            }
          });

          // Step 3: Insert Trigger block at front if missing
          const hasTrigger = mappedNodes.some(n => n.type === "TRIGGER");
          if (!hasTrigger) {
            const startNode = mappedNodes.find(n => n.type === "START");
            const entryValues = parsed.flow?.entryRules?.[0]?.values || ["Hi"];
            const triggerNode = {
              id: "node_imported_trigger",
              type: "TRIGGER",
              category: "trigger",
              title: "FLOW TRIGGER",
              x: startNode ? startNode.x - 250 : 30,
              y: startNode ? startNode.y : 100,
              text: `Incoming Message matches: ${entryValues.join(", ")}`,
              outputPort: startNode ? startNode.id : undefined
            };
            mappedNodes.unshift(triggerNode);
          }

          importedNodes = mappedNodes;
          importedName = parsed.flow?.name || "Imported ShopLinx Flow";
          importedKeyword = (parsed.flow?.entryRules?.[0]?.values || []).join(", ");
        } else if (Array.isArray(parsed)) {
          importedNodes = parsed;
        } else if (parsed && typeof parsed === "object") {
          if (Array.isArray(parsed.nodes)) {
            importedNodes = parsed.nodes;
          }
          if (typeof parsed.name === "string") {
            importedName = parsed.name;
          }
          if (typeof parsed.triggerKeyword === "string") {
            importedKeyword = parsed.triggerKeyword;
          }
        }

        if (!importedNodes || !importedNodes.every((n: any) => n.id && n.type)) {
          alert("Invalid chatbot flow JSON structure. Missing nodes, node IDs, or node types.");
          return;
        }

        setNodes(importedNodes);
        setHistoryStack([importedNodes]);
        setHistoryIndex(0);
        setSelectedNodeId(null);
        setSelectedNodeIds(new Set());
        setIsDrawerOpen(false);

        if (importedName) setFlowName(importedName);
        if (importedKeyword) setTriggerKeyword(importedKeyword);

        setToastMsg("✓ Chatbot flow imported successfully! Click Save to publish.");
        setTimeout(() => setToastMsg(null), 4000);
      } catch (err: any) {
        alert("Failed to parse JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExportJsonFlow = () => {
    if (nodes.length === 0) return;
    const exportData = {
      name: flowName,
      triggerKeyword: triggerKeyword,
      nodes: nodes
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `${flowName.toLowerCase().replace(/\s+/g, "_")}_flow.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setToastMsg("✅ Chatbot flow exported successfully!");
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopyJsonFlow = async () => {
    if (nodes.length === 0) return;
    const exportData = {
      name: flowName,
      triggerKeyword: triggerKeyword,
      nodes: nodes
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      setToastMsg("📋 JSON copied to clipboard!");
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      console.error("Failed to copy JSON:", err);
      setToastMsg("❌ Failed to copy JSON");
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

    // Fetch Saved Chatbot Flows from DB
  const fetchFlows = async () => {
    setIsLoadingFlows(true);
    const res = await getWhatsAppChatbotFlows();
    if (res.success && res.flows) {
      setSavedFlows(res.flows);
      if (res.flows.length > 0) {
        const target = res.flows.find((f: any) => f.id === currentFlowId) || res.flows[0];
        setCurrentFlowId(target.id);
        setFlowName(target.name);
        setTriggerKeyword(target.triggerKeyword || "HI, HELLO, CATALOG");
        setIsBotActive(target.isActive);
        // Set last saved Shopify states
        setLastSavedFlowName(target.name);
        setLastSavedTriggerKeyword(target.triggerKeyword || "HI, HELLO, CATALOG");
        setLastSavedIsBotActive(target.isActive);
        try {
          const parsedNodes = JSON.parse(target.nodesJson);
          if (Array.isArray(parsedNodes)) {
            setNodes(parsedNodes);
            setHistoryStack([parsedNodes]);
            setHistoryIndex(0);
            setLastSavedNodesJson(JSON.stringify(parsedNodes));
          }
        } catch (e) {
          console.error("Failed to parse nodesJson:", e);
        }
      } else {
        setCurrentFlowId(null);
        setFlowName("No Active Chatbot");
        setTriggerKeyword("");
        setIsBotActive(false);
        setNodes([]);
      }
    }
    setIsLoadingFlows(false);
  };

  // Fetch Live Data for Dropdowns
  const fetchLiveData = async () => {
      // Fetch WhatsApp Templates for Meta block
      const tRes = await getWhatsAppTemplates();
      if (tRes.success && tRes.templates) {
        setTemplates(tRes.templates);
      }
      
      // Fetch Integrations for CRM blocks
      const iRes = await getWhatsAppIntegrationsAction();
      if (iRes.success && iRes.integrations) {
        setIntegrations(iRes.integrations);
      }

      try {
      const agentsRes = await getAllEmployeesAndTeams();
      if (agentsRes.success && agentsRes.employees) setAvailableAgents(agentsRes.employees);

      const teamsRes = await getTeamsWithMembersAction();
      if (teamsRes.success && teamsRes.teams) setAvailableTeams(teamsRes.teams);

      const tagsRes = await fetch('/api/whatsapp/tags');
      const tagsData = await tagsRes.json();
      if (tagsData.success && tagsData.tags) setAvailableTags(tagsData.tags);

      const prodRes = await getProductsAction();
      if (prodRes.success && prodRes.products) {
        const uniqueCats = Array.from(new Set(prodRes.products.map((p: any) => p.category))).filter(Boolean) as string[];
        setAvailableCollections(uniqueCats);
      }
    } catch (err) {
      console.error("Failed to load live data for chatbot builder", err);
    }
  };

  const handleCreateTag = async () => {
    const tagName = window.prompt("Enter new tag name:");
    if (!tagName || !tagName.trim()) return;
    try {
      const res = await fetch('/api/whatsapp/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName.trim(), color: '#6366f1' })
      });
      const data = await res.json();
      if (data.success) {
        fetchLiveData(); // Refresh tags
      } else {
        alert(data.error || "Failed to create tag.");
      }
    } catch (e) {
      alert("Error creating tag.");
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchFlows();
    fetchLiveData();
  }, []);

  const handleSelectFlow = (flowId: string) => {
    const target = savedFlows.find((f) => f.id === flowId);
    if (!target) return;
    setCurrentFlowId(target.id);
    setFlowName(target.name);
    setTriggerKeyword(target.triggerKeyword || "HI, HELLO, CATALOG");
    setIsBotActive(target.isActive);
    // Set last saved Shopify states
    setLastSavedFlowName(target.name);
    setLastSavedTriggerKeyword(target.triggerKeyword || "HI, HELLO, CATALOG");
    setLastSavedIsBotActive(target.isActive);
    try {
      const parsedNodes = JSON.parse(target.nodesJson);
      if (Array.isArray(parsedNodes)) {
        setNodes(parsedNodes);
        setHistoryStack([parsedNodes]);
        setHistoryIndex(0);
        setSelectedNodeId(null);
        setSelectedNodeIds(new Set());
        setIsDrawerOpen(false);
        setLastSavedNodesJson(JSON.stringify(parsedNodes));
      }
    } catch (e) {
      console.error("Error loading selected flow nodes:", e);
    }
  };

  const handleConfirmCreateNewBot = async () => {
    const template = BOT_TEMPLATES.find((t) => t.id === selectedTemplateId) || BOT_TEMPLATES[0];
    const botName = newBotNameInput.trim() || template.name;
    const botKeyword = newBotKeywordInput.trim() || template.triggerKeyword;

    setIsSaving(true);
    const res = await saveWhatsAppChatbotFlowAction({
      name: botName,
      triggerKeyword: botKeyword,
      nodesJson: JSON.stringify(template.nodes),
      isActive: true
    });

    if (res.success && res.flow) {
      setToastMsg(`✓ New Chatbot "${botName}" created successfully!`);
      setShowCreateModal(false);
      setNewBotNameInput("");
      setNewBotKeywordInput("");
      await fetchFlows();
      handleSelectFlow(res.flow.id);
    } else {
      setToastMsg(`Error creating chatbot: ${res.error}`);
    }
    setIsSaving(false);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleDeleteFlowById = async (flowIdToDelete: string) => {
    setIsSaving(true);
    const targetFlow = savedFlows.find((f) => f.id === flowIdToDelete);
    const flowTitle = targetFlow ? targetFlow.name : "Chatbot";

    const res = await deleteWhatsAppChatbotFlowAction(flowIdToDelete);
    if (res.success) {
      setToastMsg(`✓ Chatbot "${flowTitle}" permanently deleted.`);
      setShowDeleteModal(false);

      const remaining = savedFlows.filter((f) => f.id !== flowIdToDelete);
      setSavedFlows(remaining);

      if (flowIdToDelete === currentFlowId) {
        if (remaining.length > 0) {
          const next = remaining[0];
          setCurrentFlowId(next.id);
          setFlowName(next.name);
          setTriggerKeyword(next.triggerKeyword || "HI, HELLO, CATALOG");
          setIsBotActive(next.isActive);
          try {
            const parsed = JSON.parse(next.nodesJson);
            if (Array.isArray(parsed)) {
              setNodes(parsed);
              setHistoryStack([parsed]);
              setHistoryIndex(0);
            }
          } catch (e) {
            console.error(e);
          }
        } else {
          setCurrentFlowId(null);
          setFlowName("No Active Chatbot");
          setTriggerKeyword("");
          setIsBotActive(false);
          setNodes([]);
          setSelectedNodeId(null);
          setSelectedNodeIds(new Set());
          setIsDrawerOpen(false);
        }
      }
    } else {
      setToastMsg(`Error deleting bot: ${res.error}`);
    }
    setIsSaving(false);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleConfirmDeleteBot = async () => {
    if (!currentFlowId) return;
    await handleDeleteFlowById(currentFlowId);
  };

  const handleDuplicateCurrentBot = async () => {
    if (!currentFlowId) return;
    setIsSaving(true);
    const res = await duplicateWhatsAppChatbotFlowAction(currentFlowId);
    if (res.success && res.flow) {
      setToastMsg(`✓ Cloned bot "${res.flow.name}" created!`);
      await fetchFlows();
      handleSelectFlow(res.flow.id);
    } else {
      setToastMsg(`Error cloning bot: ${res.error}`);
    }
    setIsSaving(false);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleToggleActiveStatus = async (flowId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    // If activating a flow, validate its configurations first
    if (newStatus) {
      const flowToToggle = savedFlows.find((f) => f.id === flowId);
      if (flowToToggle) {
        let flowNodes: any[] = [];
        try { flowNodes = JSON.parse(flowToToggle.nodesJson); } catch (_) {}
        const triggerNode = flowNodes.find((n: any) => (n.type || '').toUpperCase() === "TRIGGER");
        const hasTrigger = !!triggerNode;
        const hasKeyword = !!flowToToggle.triggerKeyword?.trim();
        const isTriggerConnected = !!triggerNode?.outputPort;

        if (!hasTrigger || !hasKeyword || !isTriggerConnected) {
          let error = "Cannot activate this chatbot: ";
          if (!hasTrigger) error += "No trigger block found. ";
          else if (!hasKeyword) error += "Trigger keywords are empty. ";
          else if (!isTriggerConnected) error += "Trigger block is not connected to any starting block. ";
          alert(error + "\nPlease open and edit this flow to configure it before publishing.");
          return;
        }
      }
    }

    const res = await toggleWhatsAppChatbotFlowStatusAction(flowId, newStatus);
    if (res.success) {
      if (flowId === currentFlowId) {
        setIsBotActive(newStatus);
      }
      setSavedFlows((prev) => prev.map((f) => (f.id === flowId ? { ...f, isActive: newStatus } : f)));
      setToastMsg(`Chatbot status changed to ${newStatus ? 'ACTIVE' : 'DRAFT'}`);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleDeleteConnection = (sourceId: string, targetId: string, choiceId?: string) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== sourceId) return n;

        // If it's a choice option connection
        if (choiceId && n.choices) {
          const updatedChoices = n.choices.map((c: any) =>
            c.id === choiceId ? { ...c, targetNode: null } : c
          );
          return { ...n, choices: updatedChoices };
        }

        // If it's the direct outputPort connection
        if (n.outputPort === targetId) {
          return { ...n, outputPort: null };
        }

        return n;
      })
    );
    setToastMsg("✓ Connection deleted successfully!");
    setTimeout(() => setToastMsg(null), 3000);
  };

  const validateWorkflow = () => {
    const errors: string[] = [];
    const triggerNode = nodes.find((n) => (n.type || '').toUpperCase() === "TRIGGER");
    
    if (!triggerNode) {
      errors.push("Missing 'Flow Trigger' block. You must have a trigger block to start the flow.");
    } else {
      if (!triggerKeyword || !triggerKeyword.trim()) {
        errors.push("Flow Trigger keywords cannot be empty. Please configure keywords in the top bar.");
      }
      if (!triggerNode.outputPort) {
        errors.push("Flow Trigger block is not connected to any starting block. Drag a wire from its output.");
      }
    }

    // Node-specific validation
    nodes.forEach(node => {
      if (node.type === "TEXT" && (!node.text || !node.text.trim())) {
        errors.push(`Text block "${node.title || 'Text'}" has no message content.`);
      }
      if (node.type === "IMAGE" || node.type === "VIDEO" || node.type === "FILE" || node.type === "AUDIO") {
        if (!node.mediaUrl || !node.mediaUrl.trim()) {
          errors.push(`Media block "${node.title || node.type}" is missing a valid URL.`);
        }
      }
      if (node.type === "CHOICE" || node.type === "BUTTONS" || node.type === "LIST_MENU") {
        if (!node.choices || node.choices.length === 0) {
          errors.push(`Interactive block "${node.title || 'Choices'}" has no options configured.`);
        } else {
          node.choices.forEach((choice: any, index: number) => {
            if (!choice.text || !choice.text.trim()) {
              errors.push(`Option ${index + 1} in "${node.title}" has empty text.`);
            }
            if (!choice.targetNode) {
              errors.push(`Option "${choice.text || 'Unnamed'}" in "${node.title}" is not connected to any next step.`);
            }
          });
        }
      }
      const type = (node.type || "").toUpperCase();
      if (type === "CRM_LEAD" || type === "CRM_CONTACT") {
        if (!node.integrationId && !integrations.some(i => i.type === "CRM_LEAD" && i.isActive)) {
          errors.push(`CRM node "${node.title || 'Create Lead'}" requires an active CRM/Webhook integration. Save integration settings first.`);
        }
      }
      if (type === "META_CAPI") {
        if (!node.integrationId && !integrations.some(i => i.type === "META_CAPI" && i.isActive)) {
          errors.push(`Meta CAPI node "${node.title || 'Meta CAPI Event'}" requires an active Meta integration. Save Meta credentials in Integrations first.`);
        }
      }
    });

    return errors;
  };
          <div className="node-editor-drawer">
            <div className="drawer-header-row">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Settings size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    {selectedNode.title}
                  </h3>
                  <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                    Configure block parameters & logic connections.
                  </span>
                </div>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div className="drawer-tabs-bar">
              <button
                className={`drawer-tab-btn ${drawerTab === "basic" ? "active" : ""}`}
                onClick={() => setDrawerTab("basic")}
              >
                Basic Settings
              </button>
              <button
                className={`drawer-tab-btn ${drawerTab === "advanced" ? "active" : ""}`}
                onClick={() => setDrawerTab("advanced")}
              >
                Advanced Logic
              </button>
            </div>

            <div className="drawer-section-block">
              <span className="drawer-section-title">BLOCK CONFIGURATION</span>
              <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Block Title</label>
                  <input
                    type="text"
                    value={selectedNode.title}
                    onChange={(e) =>
                      setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, title: e.target.value } : n)))
                    }
                    style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px" }}
                  />
                </div>

                {/* --- META CAPI EVENT PANEL (TOP OF DRAWER) --- */}
                {((selectedNode.type || "").toUpperCase() === "META_CAPI" || (selectedNode.type || "").toLowerCase() === "meta_capi" || (selectedNode.title || "").toLowerCase().includes("meta capi")) && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: "10px", padding: "14px", marginTop: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Target size={16} style={{ color: "#2563eb" }} />
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>Meta CAPI Event Configuration</span>
                    </div>

                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Select Meta CAPI Event to Fire</label>
                      <select
                        value={selectedNode.eventName || "Lead"}
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, eventName: e.target.value } : n)))}
                        style={{ width: "100%", padding: "8px 10px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", background: "#fff", fontWeight: 700 }}
                      >
                        <option value="Lead">🎯 Lead (CTWA Lead Conversion)</option>
                        <option value="Purchase">💰 Purchase (Order Placed)</option>
                        <option value="Contact">💬 Contact (New Inquiry)</option>
                        <option value="SubmitApplication">📝 Submit Application</option>
                        <option value="Schedule">📅 Schedule Appointment</option>
                        <option value="CompleteRegistration">✅ Complete Registration</option>
                        <option value="AddToCart">🛒 Add To Cart</option>
                        <option value="ViewContent">👁️ View Content / Catalog</option>
                      </select>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>Event Currency</label>
                        <select
                          value={selectedNode.currency || "INR"}
                          onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, currency: e.target.value } : n)))}
                          style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", background: "#fff" }}
                        >
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>Event Value (Optional)</label>
                        <input
                          type="number"
                          placeholder="e.g. 5000"
                          value={selectedNode.eventValue || ""}
                          onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, eventValue: parseFloat(e.target.value) || 0 } : n)))}
                          style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px" }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Meta Integration (Pixel & Token)</label>
                      <select
                        value={selectedNode.integrationId || ""}
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, integrationId: e.target.value } : n)))}
                        style={{ width: "100%", padding: "8px 10px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", background: "#fff" }}
                      >
                        <option value="">-- Select Meta Integration --</option>
                        {integrations.filter(i => i.type === "META_CAPI").map(int => (
                          <option key={int.id} value={int.id}>{int.name} (Pixel: {int.url})</option>
                        ))}
                      </select>
                      <div style={{ marginTop: "6px" }}>
                        <a
                          href="/whatsapp/integrations"
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: "11px", color: "#2563eb", fontWeight: 600, textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          + Add or Manage Meta Pixel Credentials in Integrations ↗
                        </a>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Meta Test Event Code (For Real-Time Testing)</label>
                      <input
                        type="text"
                        placeholder="e.g. TEST12345"
                        value={selectedNode.testEventCode || ""}
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, testEventCode: e.target.value } : n)))}
                        style={{ width: "100%", padding: "7px 10px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", fontFamily: "monospace" }}
                      />
                      <p style={{ fontSize: "10.5px", color: "#64748b", marginTop: "4px" }}>
                        Copy from <strong>Meta Events Manager → Test Events tab</strong> to see instant live hits.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        setToastMsg("⚡ Sending Test Event to Meta Pixel...");
                        try {
                          const res = await fetch("/api/whatsapp/test-meta-capi", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              integrationId: selectedNode.integrationId,
                              eventName: selectedNode.eventName || "Lead",
                              testEventCode: selectedNode.testEventCode
                            })
                          });
                          const data = await res.json();
                          if (data.success) {
                            alert(`✅ VERIFIED WITH META!\n\n${data.message}\nPixel ID: ${data.pixelId}\nEvent: ${data.eventName}\nTrace ID: ${data.fbtraceId || 'N/A'}`);
                            setToastMsg("✓ Meta Event verified successfully!");
                          } else {
                            alert(`❌ META TEST ERROR:\n\n${data.error}`);
                            setToastMsg(`Error: ${data.error}`);
                          }
                        } catch (e: any) {
                          alert(`❌ Network Error: ${e.message}`);
                        }
                        setTimeout(() => setToastMsg(null), 4000);
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: "12.5px",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(37,99,235,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        marginTop: "4px"
                      }}
                    >
                      ⚡ Test & Verify Event Fire to Meta Now
                    </button>
                  </div>
                )}

                {/* --- META CTWA AD ATTRIBUTION PANEL (TOP OF DRAWER) --- */}
                {((selectedNode.type || "").toUpperCase() === "META_CTWA_AD" || (selectedNode.title || "").toLowerCase().includes("ctwa ad")) && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "10px", padding: "14px", marginTop: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Sparkles size={16} style={{ color: "#166534" }} />
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "#14532d" }}>CTWA Ad Attribution Settings</span>
                    </div>
                    <p style={{ fontSize: "11px", color: "#166534" }}>
                      Reads incoming referral data from Meta Click-to-WhatsApp Ads (Ad ID, Campaign Name, Headline) and binds it to conversation.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "11.5px", display: "flex", alignItems: "center", gap: "6px", color: "#14532d", fontWeight: 600 }}>
                        <input type="checkbox" checked={selectedNode.captureAdId !== false} onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, captureAdId: e.target.checked } : n)))} />
                        Capture Meta Ad ID & Adset ID
                      </label>
                      <label style={{ fontSize: "11.5px", display: "flex", alignItems: "center", gap: "6px", color: "#14532d", fontWeight: 600 }}>
                        <input type="checkbox" checked={selectedNode.captureCampaignName !== false} onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, captureCampaignName: e.target.checked } : n)))} />
                        Capture Campaign Name & Source
                      </label>
                      <label style={{ fontSize: "11.5px", display: "flex", alignItems: "center", gap: "6px", color: "#14532d", fontWeight: 600 }}>
                        <input type="checkbox" checked={selectedNode.captureHeadline !== false} onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, captureHeadline: e.target.checked } : n)))} />
                        Capture Ad Headline & Image Thumbnail
                      </label>
                    </div>
                  </div>
                )}

                {/* --- META AUDIENCE SYNC PANEL (TOP OF DRAWER) --- */}
                {((selectedNode.type || "").toUpperCase() === "META_CUSTOM_AUDIENCE" || (selectedNode.title || "").toLowerCase().includes("meta audience")) && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: "10px", padding: "14px", marginTop: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Users size={16} style={{ color: "#1d4ed8" }} />
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "#1e3a8a" }}>Meta Custom Audience Retargeting Sync</span>
                    </div>

                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#1e3a8a" }}>Audience Action</label>
                      <select
                        value={selectedNode.audienceMode || "EXISTING"}
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, audienceMode: e.target.value } : n)))}
                        style={{ width: "100%", padding: "7px 10px", fontSize: "12px", border: "1px solid #93c5fd", borderRadius: "6px", marginTop: "4px", background: "#fff", fontWeight: 700 }}
                      >
                        <option value="EXISTING">🔗 Add to Existing Meta Custom Audience</option>
                        <option value="NEW">➕ Create New Meta Custom Audience</option>
                      </select>
                    </div>

                    {selectedNode.audienceMode === "NEW" ? (
                      <div>
                        <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#1e3a8a" }}>New Custom Audience Name</label>
                        <input
                          type="text"
                          placeholder="e.g. WhatsApp Wholesale Buyers 2026"
                          value={selectedNode.audienceName || ""}
                          onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, audienceName: e.target.value } : n)))}
                          style={{ width: "100%", padding: "7px 10px", fontSize: "12px", border: "1px solid #93c5fd", borderRadius: "6px", marginTop: "4px" }}
                        />
                      </div>
                    ) : (
                      <div>
                        <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#1e3a8a" }}>Existing Meta Custom Audience ID</label>
                        <input
                          type="text"
                          placeholder="e.g. 23859201938"
                          value={selectedNode.existingAudienceId || ""}
                          onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, existingAudienceId: e.target.value } : n)))}
                          style={{ width: "100%", padding: "7px 10px", fontSize: "12px", border: "1px solid #93c5fd", borderRadius: "6px", marginTop: "4px", fontFamily: "monospace" }}
                        />
                        <p style={{ fontSize: "10.5px", color: "#3b82f6", marginTop: "4px" }}>
                          Found in <strong>Meta Ads Manager → Audiences tab</strong>.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* --- META TEMPLATE PANEL (TOP OF DRAWER) --- */}
                {((selectedNode.type || "").toUpperCase() === "META_TEMPLATE" || (selectedNode.title || "").toLowerCase().includes("meta template")) && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#fdf4ff", border: "1.5px solid #f5d0fe", borderRadius: "10px", padding: "14px", marginTop: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Bot size={16} style={{ color: "#a21caf" }} />
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "#701a75" }}>Send Approved Meta WhatsApp Template</span>
                    </div>
                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#701a75" }}>Template Name</label>
                      <input
                        type="text"
                        placeholder="e.g. order_confirmation_v2"
                        value={selectedNode.templateName || ""}
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, templateName: e.target.value } : n)))}
                        style={{ width: "100%", padding: "7px 10px", fontSize: "12px", border: "1px solid #f0abfc", borderRadius: "6px", marginTop: "4px", fontFamily: "monospace" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#701a75" }}>Language Code</label>
                      <input
                        type="text"
                        placeholder="en_US or hi_IN"
                        value={selectedNode.language || "en_US"}
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, language: e.target.value } : n)))}
                        style={{ width: "100%", padding: "7px 10px", fontSize: "12px", border: "1px solid #f0abfc", borderRadius: "6px", marginTop: "4px" }}
                      />
                    </div>
                  </div>
                )}

                {selectedNode.type === "TRIGGER" ? (
                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Trigger Keywords (Comma Separated)</label>
                      <textarea
                        rows={3}
                        value={triggerKeyword}
                        onChange={(e) => {
                          setTriggerKeyword(e.target.value.toUpperCase());
                          setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, text: `Incoming Message matches: ${e.target.value.toUpperCase()}` } : n)));
                        }}
                        style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", resize: "none" }}
                      />
                    </div>
                  ) : (selectedNode.type !== "CRM_LEAD" && !["META_CAPI", "META_CTWA_AD", "META_CUSTOM_AUDIENCE", "META_TEMPLATE"].includes((selectedNode.type || "").toUpperCase()) && !(selectedNode.title || "").toLowerCase().includes("meta")) ? (
                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Message / Description</label>
                      <textarea
                        rows={3}
                        value={selectedNode.text || ""}
                        onChange={(e) =>
                          setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, text: e.target.value } : n)))
                        }
                        style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", resize: "none" }}
                      />
                      <div style={{ marginTop: '8px' }}>
                        <label style={{ fontSize: "10px", fontWeight: 700, color: "#64748b" }}>Insert Variable</label>
                        <select 
                          style={{ width: "100%", padding: "4px 8px", fontSize: "11px", border: "1px dashed #cbd5e1", borderRadius: "6px", marginTop: "2px", background: "#f8fafc" }}
                          value=""
                          onChange={(e) => {
                             if (!e.target.value) return;
                             const varTag = `{{${e.target.value}}}`;
                             setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, text: (n.text || '') + varTag } : n)));
                          }}
                        >
                           <option value="">-- Select Variable --</option>
                           <option value="name">Customer Name</option>
                           <option value="businessName">Business Name</option>
                           <option value="mobile">Mobile Number</option>
                           <option value="whatsappNumber">WhatsApp Number</option>
                           <option value="email">Email</option>
                           <option value="city">City</option>
                           <option value="state">State</option>
                           <option value="tags">Tags</option>
                           <option value="leadStage">Lead Stage</option>
                           <option value="customerType">Customer Type</option>
                        </select>
                      </div>
                    </div>
                  ) : null}

                {(selectedNode.type || "").toUpperCase() === "CATALOG" && (
                  <div>
                    <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Select Product Collection</label>
                    <select
                      value={selectedNode.categoryName || ""}
                      onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, categoryName: e.target.value } : n)))}
                      style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", background: "#fff" }}
                    >
                      <option value="">-- All Collections --</option>
                      {availableCollections.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* TYPE-SPECIFIC CONFIGURATION FIELDS WITH DIRECT FILE UPLOADER */}
                {(selectedNode.type === "IMAGE" || selectedNode.type === "CHOICE" || selectedNode.type === "BUTTONS" || selectedNode.type === "LIST_MENU") && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>
                      Upload Image File or Enter Image URL
                    </label>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <label
                        className="studio-btn primary"
                        style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        <ImageIcon size={14} /> Upload Image File
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                const result = evt.target?.result as string;
                                setNodes((prev) =>
                                  prev.map((n) => (n.id === selectedNode.id ? { ...n, imageUrl: result } : n))
                                );
                                setToastMsg(`✓ Image "${file.name}" uploaded successfully!`);
                                setTimeout(() => setToastMsg(null), 3000);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      {selectedNode.imageUrl && (
                        <button
                          className="studio-btn danger"
                          style={{ padding: "6px 10px", fontSize: "11.5px" }}
                          onClick={() =>
                            setNodes((prev) =>
                              prev.map((n) => (n.id === selectedNode.id ? { ...n, imageUrl: "" } : n))
                            )
                          }
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Or paste image URL or CTRL+V to paste image file directly..."
                      value={selectedNode.imageUrl || ""}
                      onChange={(e) =>
                        setNodes((prev) =>
                          prev.map((n) => (n.id === selectedNode.id ? { ...n, imageUrl: e.target.value } : n))
                        )
                      }
                      onPaste={(e) => {
                        const items = e.clipboardData?.items;
                        if (!items) return;
                        
                        for (let i = 0; i < items.length; i++) {
                          if (items[i].type.indexOf("image") !== -1) {
                            e.preventDefault(); // Prevent pasting the filename string
                            const file = items[i].getAsFile();
                            if (!file) continue;
                            
                            if (file.size > 5 * 1024 * 1024) {
                              setToastMsg("❌ Image size must be less than 5MB");
                              setTimeout(() => setToastMsg(null), 3000);
                              return;
                            }

                            const reader = new FileReader();
                            reader.onload = () => {
                              const result = reader.result as string;
                              setNodes((prev) =>
                                prev.map((n) => (n.id === selectedNode.id ? { ...n, imageUrl: result } : n))
                              );
                              setToastMsg(`✓ Image pasted successfully!`);
                              setTimeout(() => setToastMsg(null), 3000);
                            };
                            reader.readAsDataURL(file);
                            return; // Stop after first image
                          }
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        fontSize: "12px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px"
                      }}
                    />

                    <div>
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                        Or Select Sample Product Banner:
                      </span>
                      <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>
                        {[
                          { title: "Apparel Banner", url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500" },
                          { title: "Activewear", url: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=500" },
                          { title: "Wholesale Polo", url: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500" },
                          { title: "QR Deposit", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500" }
                        ].map((samp, idx) => (
                          <img
                            key={idx}
                            src={samp.url}
                            alt={samp.title}
                            title={samp.title}
                            onClick={() =>
                              setNodes((prev) =>
                                prev.map((n) => (n.id === selectedNode.id ? { ...n, imageUrl: samp.url } : n))
                              )
                            }
                            style={{
                              width: "48px",
                              height: "36px",
                              objectFit: "cover",
                              borderRadius: "4px",
                              cursor: "pointer",
                              border: selectedNode.imageUrl === samp.url ? "2px solid #10b981" : "1px solid #cbd5e1"
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {selectedNode.imageUrl && (
                      <div style={{ marginTop: "4px", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "6px", background: "#f8fafc" }}>
                        <span style={{ fontSize: "10.5px", color: "#64748b", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                          Live Uploaded Image Preview:
                        </span>
                        <img
                          src={selectedNode.imageUrl}
                          alt="Uploaded Preview"
                          style={{ width: "100%", maxHeight: "140px", objectFit: "cover", borderRadius: "6px" }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {(selectedNode.type === "VIDEO" || selectedNode.type === "YOUTUBE") && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>
                      Upload Video File or Enter Video URL
                    </label>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <label
                        className="studio-btn primary"
                        style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        <Video size={14} /> Upload Video File
                        <input
                          type="file"
                          accept="video/*"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                const result = evt.target?.result as string;
                                setNodes((prev) =>
                                  prev.map((n) => (n.id === selectedNode.id ? { ...n, videoUrl: result } : n))
                                );
                                setToastMsg(`✓ Video "${file.name}" uploaded successfully!`);
                                setTimeout(() => setToastMsg(null), 3000);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      placeholder="Or paste video URL (https://...)"
                      value={selectedNode.videoUrl || selectedNode.youtubeUrl || ""}
                      onChange={(e) =>
                        setNodes((prev) =>
                          prev.map((n) =>
                            n.id === selectedNode.id ? { ...n, videoUrl: e.target.value, youtubeUrl: e.target.value } : n
                          )
                        )
                      }
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        fontSize: "12px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px"
                      }}
                    />
                  </div>
                )}

                {selectedNode.type === "FILE" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Document File Name</label>
                      <input
                        type="text"
                        value={selectedNode.filename || ""}
                        onChange={(e) =>
                          setNodes((prev) =>
                            prev.map((n) => (n.id === selectedNode.id ? { ...n, filename: e.target.value } : n))
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          fontSize: "12px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          marginTop: "4px"
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>
                        Upload Document File / PDF
                      </label>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                        <label
                          className="studio-btn primary"
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          <FileText size={14} /> Upload File / PDF
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.xlsx,.zip"
                            style={{ display: "none" }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                  const result = evt.target?.result as string;
                                  setNodes((prev) =>
                                    prev.map((n) =>
                                      n.id === selectedNode.id
                                        ? { ...n, fileUrl: result, filename: file.name }
                                        : n
                                    )
                                  );
                                  setToastMsg(`✓ Document "${file.name}" uploaded successfully!`);
                                  setTimeout(() => setToastMsg(null), 3000);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>

                      <input
                        type="text"
                        placeholder="Or paste document URL (https://...)"
                        value={selectedNode.fileUrl || ""}
                        onChange={(e) =>
                          setNodes((prev) =>
                            prev.map((n) => (n.id === selectedNode.id ? { ...n, fileUrl: e.target.value } : n))
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          fontSize: "12px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          marginTop: "6px"
                        }}
                      />
                    </div>
                  </div>
                )}

                {selectedNode.type === "LOCATION" && (
                  <>
                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Location Name</label>
                      <input
                        type="text"
                        value={selectedNode.locationName || ""}
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, locationName: e.target.value } : n)))}
                        style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Address</label>
                      <input
                        type="text"
                        value={selectedNode.address || ""}
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, address: e.target.value } : n)))}
                        style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px" }}
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === "LINK" && (
                  <>
                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Button Text</label>
                      <input
                        type="text"
                        value={selectedNode.buttonText || ""}
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, buttonText: e.target.value } : n)))}
                        style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Target Website URL</label>
                      <input
                        type="text"
                        value={selectedNode.url || ""}
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, url: e.target.value } : n)))}
                        style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px" }}
                      />
                    </div>
                  </>
                )}

                {selectedNode.type.startsWith("INPUT_") && (
                  <>
                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Save Variable Name</label>
                      <input
                        type="text"
                        value={selectedNode.variableName || ""}
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, variableName: e.target.value } : n)))}
                        style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Retry Error Message</label>
                      <input
                        type="text"
                        value={selectedNode.retryMessage || ""}
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, retryMessage: e.target.value } : n)))}
                        style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px" }}
                      />
                    </div>
                  </>
                )}

                {selectedNode.type.startsWith("PAY_") && (
                  <>
                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Payment Amount (₹)</label>
                      <input
                        type="number"
                        value={selectedNode.amount || 0}
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, amount: parseFloat(e.target.value) || 0 } : n)))}
                        style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>UPI ID</label>
                      <input
                        type="text"
                        value={selectedNode.upiId || "7206066678@OKBIZAXIS"}
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, upiId: e.target.value } : n)))}
                        style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px" }}
                      />
                    </div>
                  </>
                )}

                {(selectedNode.type || "").toUpperCase().startsWith("CRM_") && (
                  <>
                    {(selectedNode.type || "").toUpperCase() === "CRM_CONTACT" && (
                      <>
                        <div>
                          <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>CRM Lead Stage</label>
                          <select
                            value={selectedNode.leadStage || "New Lead"}
                            onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, leadStage: e.target.value } : n)))}
                            style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", background: "#fff" }}
                          >
                            <option value="New Lead">New Lead</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Qualified Lead">Qualified Lead</option>
                            <option value="Wholesale Inquiry">Wholesale Inquiry</option>
                            <option value="Negotiation">Negotiation</option>
                            <option value="Won">Won / Customer</option>
                          </select>
                        </div>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Assign Tags</label>
                            <button onClick={handleCreateTag} style={{ fontSize: "10px", color: "#4f46e5", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>+ Create New</button>
                          </div>
                          <select
                            value={selectedNode.tags || ""}
                            onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, tags: e.target.value } : n)))}
                            style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", background: "#fff" }}
                          >
                            <option value="">No tag assigned</option>
                            {availableTags.map((tag: any) => (
                              <option key={tag.id} value={tag.name}>{tag.name}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    {(selectedNode.type || "").toUpperCase() === "CRM_LEAD" && (
                      <>
                        <div style={{ marginTop: "12px" }}>
                          <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>CRM Integration</label>
                          <select
                            value={selectedNode.integrationId || ""}
                            onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, integrationId: e.target.value } : n)))}
                            style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", background: "#fff" }}
                          >
                            <option value="">-- Select Integration --</option>
                            {integrations.map(int => (
                              <option key={int.id} value={int.id}>{int.name}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    {((selectedNode.type || "").toUpperCase() === "META_CAPI" || (selectedNode.type || "").toLowerCase() === "meta_capi" || (selectedNode.title || "").toLowerCase().includes("meta capi")) && (
                      <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Target size={16} style={{ color: "#2563eb" }} />
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>Meta CAPI Event Setup</span>
                        </div>

                        <div>
                          <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Meta CAPI Event Type</label>
                          <select
                            value={selectedNode.eventName || "Lead"}
                            onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, eventName: e.target.value } : n)))}
                            style={{ width: "100%", padding: "7px 10px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", background: "#fff", fontWeight: 600 }}
                          >
                            <option value="Lead">🎯 Lead (CTWA Conversion)</option>
                            <option value="Purchase">💰 Purchase (Order Placed)</option>
                            <option value="Contact">💬 Contact (New Inquiry)</option>
                            <option value="SubmitApplication">📝 Submit Application</option>
                            <option value="Schedule">📅 Schedule Appointment</option>
                            <option value="CompleteRegistration">✅ Complete Registration</option>
                            <option value="AddToCart">🛒 Add To Cart</option>
                            <option value="ViewContent">👁️ View Content / Catalog</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Meta Integration (Pixel ID & Access Token)</label>
                          <select
                            value={selectedNode.integrationId || ""}
                            onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, integrationId: e.target.value } : n)))}
                            style={{ width: "100%", padding: "7px 10px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", background: "#fff" }}
                          >
                            <option value="">-- Select Meta Integration --</option>
                            {integrations.filter(i => i.type === "META_CAPI").map(int => (
                              <option key={int.id} value={int.id}>{int.name} (Pixel: {int.url})</option>
                            ))}
                          </select>
                          <div style={{ marginTop: "6px" }}>
                            <a
                              href="/whatsapp/integrations"
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: "11px", color: "#2563eb", fontWeight: 600, textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            >
                              + Add or Manage Meta Pixel Credentials in Integrations ↗
                            </a>
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Meta Test Event Code (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. TEST12345"
                            value={selectedNode.testEventCode || ""}
                            onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, testEventCode: e.target.value } : n)))}
                            style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", fontFamily: "monospace" }}
                          />
                          <p style={{ fontSize: "10.5px", color: "#64748b", marginTop: "4px" }}>
                            Found in <strong>Meta Events Manager → Test Events tab</strong> for real-time live testing.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            setToastMsg("⚡ Sending Test Event to Meta Pixel...");
                            try {
                              const res = await fetch("/api/whatsapp/test-meta-capi", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  integrationId: selectedNode.integrationId,
                                  eventName: selectedNode.eventName || "Lead",
                                  testEventCode: selectedNode.testEventCode
                                })
                              });
                              const data = await res.json();
                              if (data.success) {
                                alert(`✅ VERIFIED WITH META!\n\n${data.message}\nPixel ID: ${data.pixelId}\nEvent: ${data.eventName}\nTrace ID: ${data.fbtraceId || 'N/A'}`);
                                setToastMsg("✓ Meta Event verified successfully!");
                              } else {
                                alert(`❌ META TEST ERROR:\n\n${data.error}`);
                                setToastMsg(`Error: ${data.error}`);
                              }
                            } catch (e: any) {
                              alert(`❌ Network Error: ${e.message}`);
                            }
                            setTimeout(() => setToastMsg(null), 4000);
                          }}
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "12px",
                            border: "none",
                            borderRadius: "7px",
                            cursor: "pointer",
                            boxShadow: "0 2px 4px rgba(37,99,235,0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            marginTop: "4px"
                          }}
                        >
                          ⚡ Test & Verify Event Fire to Meta Now
                        </button>
                      </div>
                    )}

                    {((selectedNode.type || "").toUpperCase() === "CRM_ROUNDROBIN" || (selectedNode.type || "").toUpperCase() === "START") && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Assignment Mode</label>
                          <select
                            value={selectedNode.assignmentMode || "ROUND_ROBIN"}
                            onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, assignmentMode: e.target.value } : n)))}
                            style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", background: "#fff" }}
                          >
                            <option value="DIRECT">Direct Assign (1 Agent)</option>
                            <option value="ROUND_ROBIN">Auto (Round Robin)</option>
                          </select>
                        </div>
                        
                        {selectedNode.assignmentMode === "DIRECT" && (
                          <div>
                            <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Assign To Agent</label>
                            <select
                              value={selectedNode.agentId || ""}
                              onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, agentId: e.target.value } : n)))}
                              style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", background: "#fff" }}
                            >
                              <option value="">Select an agent</option>
                              {availableAgents.map((ag: any) => (
                                <option key={ag.id} value={ag.id}>{ag.user?.name || "Agent"}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {selectedNode.assignmentMode !== "DIRECT" && (
                          <>
                            <div>
                              <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Round Robin Target</label>
                              <select
                                value={selectedNode.roundRobinTarget || "TEAM"}
                                onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, roundRobinTarget: e.target.value, teamId: "", agentIds: [] } : n)))}
                                style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", background: "#fff" }}
                              >
                                <option value="TEAM">Specific Team</option>
                                <option value="AGENTS">Multiple Agents</option>
                              </select>
                            </div>
                            
                            {(!selectedNode.roundRobinTarget || selectedNode.roundRobinTarget === "TEAM") && (
                              <div>
                                <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Select Team</label>
                                <select
                                  value={selectedNode.teamId || ""}
                                  onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, teamId: e.target.value } : n)))}
                                  style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", background: "#fff" }}
                                >
                                  <option value="">Any Active Agent (Global)</option>
                                  {availableTeams.map((team: any) => (
                                    <option key={team.id} value={team.id}>{team.name} ({team.members?.length || 0} agents)</option>
                                  ))}
                                </select>
                                <span style={{ fontSize: "10px", color: "#64748b", marginTop: "4px", display: "block" }}>
                                  Chats will be routed to active, available agents in this team.
                                </span>
                              </div>
                            )}

                            {selectedNode.roundRobinTarget === "AGENTS" && (
                              <div>
                                <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Select Multiple Agents</label>
                                <div style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "6px", marginTop: "4px", background: "#f8fafc", display: "flex", flexDirection: "column", gap: "6px" }}>
                                  {availableAgents.map((ag: any) => {
                                    const isSelected = (selectedNode.agentIds || []).includes(ag.id);
                                    return (
                                      <label key={ag.id} style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                                        <input 
                                          type="checkbox" 
                                          checked={isSelected}
                                          onChange={(e) => {
                                            const checked = e.target.checked;
                                            setNodes(prev => prev.map(n => {
                                              if (n.id !== selectedNode.id) return n;
                                              const existing = n.agentIds || [];
                                              return { ...n, agentIds: checked ? [...existing, ag.id] : existing.filter((id: string) => id !== ag.id) };
                                            }));
                                          }}
                                        />
                                        <span>{ag.user?.name || "Agent"} <span style={{opacity: 0.5}}>- {ag.team?.name || 'No team'}</span></span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div>
                              <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Distribution Method</label>
                              <select
                                value={selectedNode.distributionMethod || "WORKLOAD_BALANCE"}
                                onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, distributionMethod: e.target.value } : n)))}
                                style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", background: "#fff" }}
                              >
                                <option value="WORKLOAD_BALANCE">Workload Balance (Lowest Open Chats)</option>
                                <option value="EQUAL_DISTRIBUTION">Equal Distribution (Turn-by-Turn Sequential)</option>
                              </select>
                              <span style={{ fontSize: "10px", color: "#64748b", marginTop: "4px", display: "block" }}>
                                {selectedNode.distributionMethod === "EQUAL_DISTRIBUTION" 
                                  ? "Chats are evenly rotated turn-by-turn among agents."
                                  : "Assigns to whoever currently has the lowest active open chat load."}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}

                {selectedNode.type === "CONDITION" && (
                  <>
                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Variable to Test</label>
                      <input
                        type="text"
                        value={selectedNode.variableName || "customer_type"}
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, variableName: e.target.value } : n)))}
                        style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Operator</label>
                      <select
                        value={selectedNode.operator || "EQUALS"}
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, operator: e.target.value } : n)))}
                        style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", background: "#fff" }}
                      >
                        <option value="EQUALS">EQUALS</option>
                        <option value="CONTAINS">CONTAINS</option>
                        <option value="GREATER_THAN">GREATER_THAN</option>
                        <option value="LESS_THAN">LESS_THAN</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Comparison Value</label>
                      <input
                        type="text"
                        value={selectedNode.compareValue || "Wholesaler"}
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, compareValue: e.target.value } : n)))}
                        style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px" }}
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === "DELAY" && (
                  <div>
                    <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Delay Duration</label>
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      <input
                        type="number"
                        value={selectedNode.delayValue || 5}
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, delayValue: parseInt(e.target.value) || 1 } : n)))}
                        style={{ width: "70px", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                      />
                      <select
                        value={selectedNode.delayUnit || "MINUTES"}
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, delayUnit: e.target.value } : n)))}
                        style={{ flex: 1, padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#fff" }}
                      >
                        <option value="SECONDS">Seconds</option>
                        <option value="MINUTES">Minutes</option>
                        <option value="HOURS">Hours</option>
                      </select>
                    </div>
                  </div>
                )}

                {selectedNode.type === "SET_VAR" && (
                  <>
                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Variable Name</label>
                      <input
                        type="text"
                        value={selectedNode.variableName || ""}
                        placeholder="e.g. lead_status"
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, variableName: e.target.value } : n)))}
                        style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Variable Value</label>
                      <input
                        type="text"
                        value={selectedNode.variableValue || ""}
                        placeholder="e.g. Qualified"
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, variableValue: e.target.value } : n)))}
                        style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px" }}
                      />
                    </div>
                    <p style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>This stores a value in a flow variable for use in Condition nodes.</p>
                  </>
                )}

                {selectedNode.type === "SPLIT_TEST" && (
                  <>
                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Split Ratio (A/B)</label>
                      <select
                        value={selectedNode.splitRatio || "50/50"}
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, splitRatio: e.target.value } : n)))}
                        style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", background: "#fff" }}
                      >
                        <option value="50/50">50% / 50%</option>
                        <option value="70/30">70% / 30%</option>
                        <option value="80/20">80% / 20%</option>
                        <option value="30/70">30% / 70%</option>
                      </select>
                    </div>
                    <p style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Randomly routes customers between Branch A and Branch B to A/B test messages.</p>
                  </>
                )}

                {selectedNode.type === "JUMP" && (
                  <>
                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Jump to Block</label>
                      <select
                        value={selectedNode.targetNodeId || ""}
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, targetNodeId: e.target.value } : n)))}
                        style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", background: "#fff" }}
                      >
                        <option value="">— Select a block —</option>
                        {nodes.filter((n: any) => n.id !== selectedNode.id).map((n: any) => (
                          <option key={n.id} value={n.id}>{n.title || n.type} ({n.id.slice(-6)})</option>
                        ))}
                      </select>
                    </div>
                    <p style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Redirects the flow to another block anywhere in the canvas.</p>
                  </>
                )}

                {selectedNode.type === "WEBHOOK" && (
                  <>
                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Webhook API URL</label>
                      <input
                        type="text"
                        value={selectedNode.webhookUrl || ""}
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, webhookUrl: e.target.value } : n)))}
                        style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>HTTP Method</label>
                      <select
                        value={selectedNode.method || "POST"}
                        onChange={(e) => setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, method: e.target.value } : n)))}
                        style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", background: "#fff" }}
                      >
                        <option value="POST">POST</option>
                        <option value="GET">GET</option>
                      </select>
                    </div>
                  </>
                )}

                {selectedNode.type !== "END" && (
                  <div>
                    <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>Direct Next Node Link</label>
                    <select
                      value={selectedNode.outputPort || ""}
                      onChange={(e) => {
                        const target = e.target.value;
                        setNodes((prev) =>
                          prev.map((n) => (n.id === selectedNode.id ? { ...n, outputPort: target } : n))
                        );
                      }}
                      style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", background: "#fff" }}
                    >
                      <option value="">No direct link (or use choices below)...</option>
                      {nodes.filter(n => n.id !== selectedNode.id).map((targetCandidate) => (
                        <option key={targetCandidate.id} value={targetCandidate.id}>
                          ➔ Connect to: {targetCandidate.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Choice Option List */}
                {selectedNode.choices && (
                  <div>
                    <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569" }}>
                      Option Links <span style={{ color: "#64748b", fontWeight: 500 }}>(Max 20 chars each)</span>
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                      {selectedNode.choices.map((c: any, index: number) => {
                        const isLimitExceeded = (c.text || "").length >= 20;
                        return (
                          <div key={c.id} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f8fafc", padding: "6px 8px", borderRadius: "6px", border: isLimitExceeded ? "1px solid #ef4444" : "1px solid #e2e8f0" }}>
                              <span className="choice-num-badge">{index + 1}</span>
                              <input
                                type="text"
                                value={c.text}
                                maxLength={20}
                                onChange={(e) => handleUpdateOptionText(selectedNode.id, c.id, e.target.value)}
                                style={{ flex: 1, padding: "5px 7px", fontSize: "12px", border: isLimitExceeded ? "1px solid #ef4444" : "1px solid #cbd5e1", borderRadius: "4px", background: "#ffffff" }}
                              />
                              <select
                                value={c.targetNode || ""}
                                onChange={(e) => {
                                  const target = e.target.value;
                                  setNodes((prev) =>
                                    prev.map((n) => {
                                      if (n.id !== selectedNode.id) return n;
                                      const updatedChoices = [...n.choices];
                                      updatedChoices[index].targetNode = target;
                                      return { ...n, choices: updatedChoices };
                                    })
                                  );
                                }}
                                style={{ width: "110px", padding: "5px", fontSize: "11px", border: "1px solid #cbd5e1", borderRadius: "4px", background: "#fff" }}
                              >
                                <option value="">Connect to...</option>
                                {nodes.map((targetCandidate) => (
                                  <option key={targetCandidate.id} value={targetCandidate.id}>
                                    {targetCandidate.title}
                                  </option>
                                ))}
                              </select>
                              <span
                                title="Delete Option"
                                onClick={(e) => handleDeleteOptionFromNode(selectedNode.id, c.id, e)}
                                style={{ cursor: "pointer", color: "#ef4444", padding: "3px" }}
                              >
                                <Trash2 size={13} />
                              </span>
                            </div>
                            {isLimitExceeded && (
                              <span style={{ color: "#ef4444", fontSize: "10px", fontWeight: 700, marginLeft: "28px" }}>
                                ⚠️ Max 20 characters allowed for WhatsApp reply buttons!
                              </span>
                            )}
                          </div>
                        );
                      })}

                      <button
                        className="add-card-option-btn"
                        onClick={(e) => handleAddOptionToNode(selectedNode.id, e)}
                        style={{ marginTop: "4px" }}
                      >
                        <span>+ Add option</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS 1, 2, 3, 4 */}
      {showCreateModal && (
        <div className="bot-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="bot-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="bot-modal-header">
              <div>
                <h3 className="bot-modal-title">Create New Chatbot</h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Select a pre-built template from WATI or Galabox, or start from scratch.
                </span>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div className="bot-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Chatbot Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Summer Sales Inquiry Bot"
                    value={newBotNameInput}
                    onChange={(e) => setNewBotNameInput(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", fontSize: "12.5px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Trigger Keywords</label>
                  <input
                    type="text"
                    placeholder="e.g. HI, HELLO, CATALOG, OFFERS"
                    value={newBotKeywordInput}
                    onChange={(e) => setNewBotKeywordInput(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", fontSize: "12.5px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px" }}
                  />
                </div>
              </div>

              <strong style={{ fontSize: "13px", color: "#0f172a" }}>Select Popular Chatbot Template:</strong>

              <div className="templates-grid">
                {BOT_TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className={`template-card-tile ${selectedTemplateId === tmpl.id ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedTemplateId(tmpl.id);
                      if (!newBotNameInput) setNewBotNameInput(tmpl.name);
                      if (!newBotKeywordInput) setNewBotKeywordInput(tmpl.triggerKeyword);
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span className={`template-tag ${tmpl.platform.toLowerCase()}`}>{tmpl.platform}</span>
                        {selectedTemplateId === tmpl.id && <Check size={16} color="#10b981" />}
                      </div>
                      <strong style={{ fontSize: "13px", color: "#0f172a", display: "block" }}>{tmpl.name}</strong>
                      <p style={{ fontSize: "11.5px", color: "#64748b", margin: "4px 0 0 0", lineHeight: 1.3 }}>{tmpl.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bot-modal-footer">
              <button className="studio-btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="studio-btn primary" onClick={handleConfirmCreateNewBot} disabled={isSaving}>
                {isSaving ? "Creating..." : "Create Chatbot Flow"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="bot-modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="bot-modal-card" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="bot-modal-header" style={{ background: "#fef2f2" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Trash2 size={18} color="#dc2626" />
                <h3 className="bot-modal-title" style={{ color: "#991b1b" }}>Delete Chatbot Flow?</h3>
              </div>
              <button onClick={() => setShowDeleteModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div className="bot-modal-body">
              <p style={{ fontSize: "13px", color: "#334155", margin: 0 }}>
                Are you sure you want to permanently delete <strong>"{flowName}"</strong>? This will remove all triggers, node graphs and automation rules associated with this chatbot flow.
              </p>
            </div>

            <div className="bot-modal-footer">
              <button className="studio-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="studio-btn danger" onClick={handleConfirmDeleteBot} disabled={isSaving}>
                {isSaving ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showManageModal && (
        <div className="bot-modal-backdrop" onClick={() => setShowManageModal(false)}>
          <div className="bot-modal-card" style={{ maxWidth: "750px" }} onClick={(e) => e.stopPropagation()}>
            <div className="bot-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FolderOpen size={18} color="#10b981" />
                <h3 className="bot-modal-title">All Chatbot Flows ({savedFlows.length})</h3>
              </div>
              <button onClick={() => setShowManageModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div className="bot-modal-body" style={{ padding: 0 }}>
              <table className="bot-manage-table">
                <thead>
                  <tr>
                    <th>Flow Name</th>
                    <th>Triggers</th>
                    <th>Status</th>
                    <th>Executions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {savedFlows.map((f) => (
                    <tr key={f.id} style={{ background: f.id === currentFlowId ? "#f0fdf4" : "transparent" }}>
                      <td>
                        <strong style={{ fontSize: "13px", display: "block" }}>{f.name}</strong>
                        {f.id === currentFlowId && <span style={{ fontSize: "10px", color: "#10b981", fontWeight: 700 }}>Currently Editing</span>}
                      </td>
                      <td style={{ fontSize: "11.5px", color: "#64748b" }}>{f.triggerKeyword || "HI, HELLO"}</td>
                      <td>
                        <button
                          onClick={() => handleToggleActiveStatus(f.id, f.isActive)}
                          style={{
                            border: "none",
                            background: f.isActive ? "#dcfce7" : "#f1f5f9",
                            color: f.isActive ? "#166534" : "#475569",
                            padding: "4px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <Power size={11} /> {f.isActive ? "ACTIVE" : "DRAFT"}
                        </button>
                      </td>
                      <td>{f.executionCount || 0} runs</td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            className="studio-btn"
                            style={{ padding: "3px 8px", fontSize: "11px" }}
                            onClick={() => {
                              handleSelectFlow(f.id);
                              setShowManageModal(false);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="studio-btn danger"
                            style={{ padding: "3px 8px", fontSize: "11px" }}
                            onClick={() => handleDeleteFlowById(f.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bot-modal-footer">
              <button className="studio-btn" onClick={() => setShowManageModal(false)}>Close</button>
              <button className="studio-btn primary" onClick={() => { setShowManageModal(false); setShowCreateModal(true); }}>
                ＋ Create Another Bot
              </button>
            </div>
          </div>
        </div>
      )}

      {showSimModal && (
        <div className="phone-sim-backdrop" onClick={() => setShowSimModal(false)}>
          <div className="phone-mockup-frame" onClick={(e) => e.stopPropagation()}>
            <div className="phone-screen">
              <div className="sim-wa-header">
                <div className="sim-wa-avatar">
                  <Bot size={18} color="#fff" />
                </div>
                <div>
                  <strong style={{ fontSize: "13px", display: "block" }}>Espon AI Assistant</strong>
                  <span style={{ fontSize: "10.5px", opacity: 0.9 }}>Online · Live Flow Simulator</span>
                </div>
                <button onClick={() => setShowSimModal(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#fff", fontSize: "18px", cursor: "pointer" }}>×</button>
              </div>

              <div className="sim-chat-body">
                {simMessages.map((msg, idx) => (
                  <div key={idx} className={`sim-msg-row ${msg.sender}`}>
                    <div className="sim-bubble">
                      {msg.imageUrl && (
                        <img src={msg.imageUrl} alt="Bot Header" style={{ width: "100%", borderRadius: "6px", marginBottom: "6px" }} />
                      )}
                      <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.text}</p>

                      {msg.choices && (
                        <div className="sim-buttons-list">
                          {msg.choices.map((c: any) => (
                            <button key={c.id} className="sim-choice-btn" onClick={() => handleSimChoiceSelect(c)}>
                              {c.text}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
