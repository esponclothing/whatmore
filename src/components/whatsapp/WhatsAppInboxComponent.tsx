"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  MessageSquare,
  UserCheck,
  UserX,
  Users,
  Star,
  CheckCheck,
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  ChevronRight,
  ChevronLeft,
  Tag,
  Clock,
  DollarSign,
  FileText,
  ShoppingBag,
  Calendar,
  AlertCircle,
  ShieldCheck,
  Bot,
  Zap,
  MoreVertical,
  PlusCircle,
  FileCode,
  CreditCard,
  Edit3,
  Check,
  ArrowRight,
  Building,
  MapPin,
  Mail,
  User,
  Sparkles,
  RefreshCw,
  X,
  BookOpen,
  Maximize2,
  Minimize2,
  ExternalLink,
  ImageIcon,
  PlayCircle,
  Volume2,
  VideoIcon,
  Mic,
  Download,
  Terminal,
  Activity,
  XCircle,
  CheckCircle2,
  Pause,
  Settings
} from "lucide-react";
import {
  getWhatsAppConversations,
  getWhatsAppConversationById,
  sendWhatsAppMessageAction,
  updateCRMProfileFromWhatsApp,
  createWhatsAppQuotation,
  generateWhatsAppPaymentLinkAction,
  assignWhatsAppLeadAction,
  getAllEmployeesAndTeams,
  toggleConversationAIAction,
  createFollowUpTaskAction,
  uploadMediaToMetaAction,
  getWhatsAppCannedResponsesAction
} from "@/app/actions/whatsAppPlatformActions";
import { useWhatsAppStore } from "@/store/whatsappStore";
import "./WhatsAppInbox.css";

const EMOJI_LIST = ["👍", "🙏", "✅", "📦", "📄", "💰", "📞", "❤️", "🔥", "💯", "🏷️", "🚚"];

export default function WhatsAppInboxComponent() {
  const { conversations, setConversations, activeConvDetail, setActiveConvDetail } = useWhatsAppStore();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [loadingConvs, setLoadingConvs] = useState<boolean>(conversations.length === 0);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);


  // Full Screen & Sidebar Collapse States
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Voice Note Recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const lastScrollConvIdRef = useRef<string | null>(null);

  // Attachment File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [aiToggleLoading, setAiToggleLoading] = useState<boolean>(false);
  const [cannedResponses, setCannedResponses] = useState<any[]>([]);
  const [showCannedResponses, setShowCannedResponses] = useState<boolean>(false);
  
  // Mentions Autocomplete State
  const [showMentionsMenu, setShowMentionsMenu] = useState<boolean>(false);
  const [mentionSearch, setMentionSearch] = useState<string>("");

  // Toggle Full Screen Mode (Overlay + Native Fullscreen API)
  const toggleFullScreenMode = () => {
    if (!isFullScreen) {
      setIsFullScreen(true);
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      setIsFullScreen(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isFullScreen]);

  // Filtering & Search States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeNavTab, setActiveNavTab] = useState<string>("all");
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>("");
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>("");
  const [employeesList, setEmployeesList] = useState<any[]>([]);

  // Messaging Input State
  const [messageInput, setMessageInput] = useState<string>("");
  const [isInternalNote, setIsInternalNote] = useState<boolean>(false);
  const [sendingMsg, setSendingMsg] = useState<boolean>(false);
  const [aiSuggesting, setAiSuggesting] = useState<boolean>(false);

  // Modals
  const [showReplyLibraryModal, setShowReplyLibraryModal] = useState<boolean>(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState<boolean>(false);
  const [showQuoteModal, setShowQuoteModal] = useState<boolean>(false);
  const [followUpDays, setFollowUpDays] = useState<number>(3);
  const [followUpNotes, setFollowUpNotes] = useState<string>("");

  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [assigningLead, setAssigningLead] = useState<boolean>(false);

  // Quote Form State
  const [quoteItems, setQuoteItems] = useState([
    { name: "Cotton Polo T-Shirt (ESP-902)", quantity: 200, rate: 290 },
    { name: "Slim Fit Chino Pants (ESP-404)", quantity: 100, rate: 450 }
  ]);

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState<number>(45000);
  const [paymentDesc, setPaymentDesc] = useState<string>("Advance Payment for Order #ORD-1092");

  // CRM Inline Edit States
  const [isEditingCRM, setIsEditingCRM] = useState<boolean>(false);
  const [crmEditData, setCrmEditData] = useState<any>({});

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Fetch Employees List for Filtering & Assignment
  useEffect(() => {
    const fetchEmps = async () => {
      const res = await getAllEmployeesAndTeams();
      if (res.success && res.employees) {
        setEmployeesList(res.employees);
      }
    };
    fetchEmps();
    
    // Fetch Canned Responses
    const fetchCanned = async () => {
      const res = await getWhatsAppCannedResponsesAction();
      if (res.success && res.responses) {
        setCannedResponses(res.responses);
      }
    };
    fetchCanned();
  }, []);

  // Fetch Conversations List — uses /api/whatsapp/inbox
  const fetchConversationsList = async (silent = false) => {
    if (!silent) setLoadingConvs(true);
    try {
      const params = new URLSearchParams({ action: 'chats' });
      if (searchQuery) params.set('search', searchQuery);
      const res = await fetch('/api/whatsapp/inbox?' + params.toString());
      if (!res.ok) throw new Error('API error ' + res.status);
      const data = await res.json();

      if (data.success && data.chats) {
        const mapped = data.chats.map((c) => ({
          id: c.id,
          status: c.chat_status === 'open' ? 'OPEN' : 'CLOSED',
          priority: c.priority || 'MEDIUM',
          unreadCount: c.unreadCount || 0,
          lastMessageText: c.last_message,
          lastMessageAt: c.created_at,
          aiHandled: !c.ai_paused,
          tags: Array.isArray(c.tags) ? c.tags.join(', ') : (c.tags || ''),
          customer: {
            id: c.customerId,
            contactPerson: c.customer_name,
            businessName: c.customer_name,
            mobile: c.phone,
            whatsappNumber: c.phone,
            totalOrders: c.order_count || 0,
            leadStage: '',
            temperature: '',
          },
          _raw: c
        }));

        // Apply Tab Filter (All, Assigned, Unassigned)
        let filtered = mapped;
        if (activeNavTab === 'assigned_to_me' || activeNavTab === 'assigned') {
          filtered = mapped.filter((c) => c._raw.assignedEmployeeId !== null);
        } else if (activeNavTab === 'unassigned') {
          filtered = mapped.filter((c) => c._raw.assignedEmployeeId === null);
        }

        // Apply Lead Status Filter
        if (leadStatusFilter) {
          filtered = filtered.filter((c) => c.leadStatus === leadStatusFilter);
        }

        // Apply Unread Only Filter
        if (unreadOnly) {
          filtered = filtered.filter((c) => c.unreadCount > 0);
        }

        setConversations(filtered);
        
        if (filtered.length > 0) {
          const isCurrentInList = filtered.some((c) => c.id === selectedConvId);
          if (!selectedConvId || !isCurrentInList) {
            setSelectedConvId(filtered[0].id);
          }
        } else {
          setSelectedConvId(null);
          setActiveConvDetail(null);
        }
      } else {
        setConversations([]);
        setSelectedConvId(null);
        setActiveConvDetail(null);
      }
    } catch (err) {
      console.error("Failed to fetch conversations", err);
      setConversations([]);
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    fetchConversationsList(conversations.length > 0);
  }, [searchQuery, activeNavTab, unreadOnly, leadStatusFilter, filterEmployeeId]);

  // Fetch Selected Conversation Detail
  const fetchConversationDetail = async (id: string, silent = false) => {
    if (!silent) setLoadingDetail(true);
    try {
      const params = new URLSearchParams({ action: 'detail', convId: id });
      const apiRes = await fetch('/api/whatsapp/inbox?' + params.toString());
      if (!apiRes.ok) throw new Error('API error ' + apiRes.status);
      const res = await apiRes.json();
      if (res.success && res.conversation) {
        setActiveConvDetail(res.conversation);
        setCrmEditData({
          businessName: res.conversation.customer?.businessName || "",
          contactPerson: res.conversation.customer?.contactPerson || "",
          mobile: res.conversation.customer?.mobile || "",
          email: res.conversation.customer?.email || "",
          city: res.conversation.customer?.city || "",
          state: res.conversation.customer?.state || "",
          customerType: res.conversation.customer?.customerType || "Wholesaler",
          leadStage: res.conversation.leadStatus || "New Lead",
          priority: res.conversation.priority || "MEDIUM",
          tags: res.conversation.tags || ""
        });
      } else {
        console.error("Failed to fetch conversation details", res.error);
        setToastMsg(`Error opening chat: ${res.error || "Unknown Error"}`);
        setTimeout(() => setToastMsg(null), 5000);
        setActiveConvDetail(null);
      }
    } catch (err: any) {
      console.error("Failed to fetch conversation details", err);
      setToastMsg(`Error: ${err?.message || "Failed to load chat"}`);
      setTimeout(() => setToastMsg(null), 5000);
      setActiveConvDetail(null);
    } finally {
      if (!silent) setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (selectedConvId) {
      fetchConversationDetail(selectedConvId, activeConvDetail !== null);
    }
  }, [selectedConvId]);

  // Real-time Auto Polling (Every 3 seconds)
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchConversationsList(true);
      if (selectedConvId) {
        fetchConversationDetail(selectedConvId, true);
      }
    }, 3000);
    return () => clearInterval(intervalId);
  }, [searchQuery, activeNavTab, unreadOnly, leadStatusFilter, filterEmployeeId, selectedConvId]);


  useEffect(() => {
    if (!activeConvDetail?.messages) return;
    const isNewConv = lastScrollConvIdRef.current !== selectedConvId;
    chatBottomRef.current?.scrollIntoView({ behavior: isNewConv ? "auto" : "smooth" });
    lastScrollConvIdRef.current = selectedConvId;
  }, [activeConvDetail?.messages, selectedConvId]);

  // Handle Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !selectedConvId) return;

    setSendingMsg(true);
    const textToSend = messageInput;
    const isInternal = isInternalNote;
    setMessageInput("");

    // --- Optimistic UI Update ---
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      content: textToSend,
      senderType: "AGENT",
      senderName: "Sales Rep",
      messageType: "TEXT",
      isInternalNote: isInternal,
      sentAt: new Date().toISOString(),
      status: "SENDING"
    };

    setActiveConvDetail((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...(prev.messages || []), optimisticMessage],
        lastMessageText: textToSend,
        lastMessageAt: optimisticMessage.sentAt
      };
    });

    setConversations((prev: any[]) => {
      return prev.map(c => {
        if (c.id === selectedConvId) {
          return { ...c, lastMessageText: textToSend, lastMessageAt: optimisticMessage.sentAt };
        }
        return c;
      }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    });
    // ---------------------------

    const res = await sendWhatsAppMessageAction({
      conversationId: selectedConvId,
      content: textToSend,
      isInternalNote: isInternal,
      senderType: "AGENT",
      senderName: "Sales Rep"
    });

    if (res.success) {
      await fetchConversationDetail(selectedConvId, true);
      await fetchConversationsList(true);
    } else {
      setToastMsg(`Failed to send: ${res.error || "Unknown Error"}`);
      setTimeout(() => setToastMsg(null), 3000);
      await fetchConversationDetail(selectedConvId, true);
    }
    setSendingMsg(false);
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      // Determine a mimeType supported by both the browser and Meta API
      let selectedMime = 'audio/ogg; codecs=opus';
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported(selectedMime)) {
          selectedMime = 'audio/mp4';
        }
        if (!MediaRecorder.isTypeSupported(selectedMime)) {
          selectedMime = 'audio/aac';
        }
      }
      
      const recorder = new MediaRecorder(stream, { mimeType: selectedMime });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: selectedMime });
        
        // Convert Blob to base64 Data URL to feed to upload-media
        const reader = new FileReader();
        reader.onloadend = async () => {
          const fileDataUrl = reader.result as string;
          setSendingMsg(true);
          
          // Determine extension and clean mimeType
          const ext = selectedMime.includes('ogg') ? 'ogg' : selectedMime.includes('mp4') ? 'm4a' : 'aac';
          const cleanMime = selectedMime.split(';')[0];
          
          try {
            const apiRes = await fetch('/api/whatsapp/upload-media', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fileDataUrl, filename: `voice-note.${ext}`, mimeType: cleanMime })
            });
            const uploadRes = await apiRes.json();
            
            if (uploadRes.success && uploadRes.mediaId) {
              const res = await sendWhatsAppMessageAction({
                conversationId: selectedConvId!,
                content: '[AUDIO]',
                mediaUrl: uploadRes.mediaId,
                mediaFilename: `voice-note.${ext}`,
                messageType: 'AUDIO',
                senderType: 'AGENT',
                senderName: 'Sales Rep'
              });
              
              if (res.success) {
                setToastMsg('✓ Voice note sent to customer!');
                setTimeout(() => setToastMsg(null), 3000);
                await fetchConversationDetail(selectedConvId!, true);
                await fetchConversationsList(true);
              }
            } else {
              setToastMsg(`❌ Failed to upload voice note: ${uploadRes.error}`);
              setTimeout(() => setToastMsg(null), 4000);
            }
          } catch (err: any) {
            console.error('Failed to send voice note:', err);
          } finally {
            setSendingMsg(false);
          }
        };
        reader.readAsDataURL(audioBlob);

        // Turn off microphone streams
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start(200);
      setIsRecording(true);
      setRecordingDuration(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Microphone access denied or error starting recorder!");
      console.error(err);
    }
  };

  // Stop and send voice note
  const stopAndSendRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  // Cancel/Discard voice recording
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Discard recorded chunks
      mediaRecorderRef.current.onstop = () => {
        // Discard hook implementation - stop tracks
        mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
      setToastMsg('🗑 Voice note discarded');
      setTimeout(() => setToastMsg(null), 2000);
    }
  };


    // Direct File Attachment Upload Handler
  const handleDirectFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConvId) return;

    setSendingMsg(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const fileDataUrl = evt.target?.result as string;
      const fileType = file.type.startsWith("image/")
        ? "IMAGE"
        : file.type.startsWith("video/")
        ? "VIDEO"
        : file.type.startsWith("audio/")
        ? "AUDIO"
        : "DOCUMENT";

      const apiRes = await fetch('/api/whatsapp/upload-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileDataUrl, filename: file.name, mimeType: file.type })
      });
      if (!apiRes.ok) throw new Error('Upload API error ' + apiRes.status);
      const uploadRes = await apiRes.json();
      if (!uploadRes.success || !uploadRes.mediaId) {
        setToastMsg(`❌ Upload Failed: ${uploadRes.error}`);
        setSendingMsg(false);
        setTimeout(() => setToastMsg(null), 4000);
        return;
      }

      const res = await sendWhatsAppMessageAction({
        conversationId: selectedConvId,
        content: fileType === "IMAGE" ? "[IMAGE]" : fileType === "DOCUMENT" ? "[DOCUMENT]" : fileType === "VIDEO" ? "[VIDEO]" : fileType === "AUDIO" ? "[AUDIO]" : `Attached file: ${file.name}`,
        mediaUrl: uploadRes.mediaId, // passing the ID to Meta API
        mediaFilename: file.name,
        messageType: fileType,
        senderType: "AGENT",
        senderName: "Sales Rep"
      });

      if (res.success) {
        setToastMsg(`✓ Direct attachment "${file.name}" sent to customer!`);
        setTimeout(() => setToastMsg(null), 3000);
        await fetchConversationDetail(selectedConvId, true);
        await fetchConversationsList(true);
      }
      setSendingMsg(false);
    };
    reader.readAsDataURL(file);
  };

  // Delete selected conversation handler
  const handleDeleteConversation = async () => {
    if (!selectedConvId) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this conversation and all its messages? This action cannot be undone.");
    if (!confirmDelete) return;
    
    try {
      const res = await fetch(`/api/whatsapp/inbox?convId=${selectedConvId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setToastMsg("✓ Conversation deleted successfully");
        setTimeout(() => setToastMsg(null), 3000);
        setSelectedConvId(null);
        setActiveConvDetail(null);
        fetchConversationsList(false);
      } else {
        alert("Failed to delete conversation: " + data.error);
      }
    } catch (err: any) {
      alert("Error deleting conversation: " + err.message);
    }
  };


    // Handle Quick Command Shortcut Insert
  const applyQuickShortcut = (text: string) => {
    setMessageInput((prev) => (prev ? `${prev} ${text}` : text));
    setShowReplyLibraryModal(false);
  };

  const handleInsertEmoji = (emoji: string) => {
    setMessageInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Suggest AI Reply
  const handleSuggestReply = async () => {
    if (!selectedConvId) return;
    setAiSuggesting(true);
    setToastMsg("Generating AI reply based on Knowledge Base...");
    try {
      const res = await fetch('/api/whatsapp/ai-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selectedConvId })
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setMessageInput(data.reply);
        setToastMsg(`AI generated reply using ${data.modelUsed}. Review before sending!`);
      } else {
        setToastMsg(`AI Suggestion Failed: ${data.error}`);
      }
    } catch (error) {
      setToastMsg("Error generating AI reply.");
    } finally {
      setAiSuggesting(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  // Save CRM Inline Profile Edits
  const handleSaveCRMProfile = async () => {
    if (!selectedConvId || !activeConvDetail?.customer?.id) return;
    const res = await updateCRMProfileFromWhatsApp({
      conversationId: selectedConvId,
      customerId: activeConvDetail.customer.id,
      ...crmEditData
    });
    if (res.success) {
      setIsEditingCRM(false);
      await fetchConversationDetail(selectedConvId, true);
      await fetchConversationsList(true);
    }
  };

  // Handle Create Quotation Submit
  const handleCreateQuoteSubmit = async () => {
    if (!selectedConvId || !activeConvDetail?.customer?.id) return;
    const res = await createWhatsAppQuotation({
      conversationId: selectedConvId,
      customerId: activeConvDetail.customer.id,
      items: quoteItems
    });
    if (res.success) {
      setShowQuoteModal(false);
      await fetchConversationDetail(selectedConvId, true);
      await fetchConversationsList(true);
    }
  };

  // Handle Send Payment Link Submit
  const handleSendPaymentSubmit = async () => {
    if (!selectedConvId || !activeConvDetail?.customer?.id) return;
    const res = await generateWhatsAppPaymentLinkAction({
      conversationId: selectedConvId,
      customerId: activeConvDetail.customer.id,
      amount: paymentAmount,
      description: paymentDesc
    });
    if (res.success) {
      setShowPaymentModal(false);
      await fetchConversationDetail(selectedConvId, true);
      await fetchConversationsList(true);
    }
  };

  // Handle Create FollowUp Submit
  const handleCreateFollowUpSubmit = async () => {
    if (!activeConvDetail?.customer?.id) return;
    const res = await createFollowUpTaskAction({
      customerId: activeConvDetail.customer.id,
      notes: followUpNotes,
      days: followUpDays
    });
    if (res.success) {
      setShowFollowUpModal(false);
      setToastMsg(`Follow-up scheduled for ${followUpDays} days from now.`);
      setTimeout(() => setToastMsg(null), 3000);
      await fetchConversationDetail(selectedConvId!, true);
    } else {
      setToastMsg(`Failed to schedule follow-up.`);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  // Handle Lead Assignment (Manual or Round-Robin)
  const handleAssignLead = async (employeeId?: string, method: 'MANUAL' | 'ROUND_ROBIN' = 'MANUAL') => {
    if (!selectedConvId) return;
    setAssigningLead(true);
    const res = await assignWhatsAppLeadAction({
      conversationId: selectedConvId,
      employeeId,
      method
    });
    if (res.success) {
      setShowAssignModal(false);
      await fetchConversationDetail(selectedConvId, true);
      await fetchConversationsList(true);
    }
    setAssigningLead(false);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setActiveNavTab("all");
    setLeadStatusFilter("");
    setUnreadOnly(false);
    setFilterEmployeeId("");
  };

  return (
    <div className={`inbox-container ${isFullScreen ? "fullscreen-mode" : ""}`}>
      {toastMsg && (
        <div style={{ position: "absolute", top: "12px", right: "20px", background: "#dcfce7", border: "1px solid #86efac", color: "#166534", padding: "8px 16px", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, zIndex: 9999, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          {toastMsg}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* LEFT COLUMN: INBOX NAVIGATION & CONVERSATION LIST */}
      {/* ----------------------------------------------------------------- */}
      <div className={`inbox-left-panel ${isLeftCollapsed ? "collapsed" : ""}`}>
        {/* Navigation Sidebar Header */}
        <div className="left-panel-header">
          <div className="left-panel-title-row">
            <span className="left-panel-title">WhatsApp Inbox</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>

              <button
                className="panel-toggle-btn"
                onClick={() => {
                  fetchConversationsList(true);
                }}
                title="Refresh Chats"
                style={{ color: "#64748b" }}
              >
                <RefreshCw size={16} />
              </button>
              <button
                className="panel-toggle-btn"
                onClick={() => setShowFilters(!showFilters)}
                title="Toggle Filters"
                style={{ color: showFilters ? "#6d28d9" : "#64748b" }}
              >
                <Filter size={16} />
              </button>


            </div>
          </div>

          {!isLeftCollapsed && (
            <>
              {/* Search Bar & Folder Tabs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                {/* Search Bar */}
                <div className="inbox-search-box" style={{ margin: 0 }}>
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search chats, phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button className="clear-search-btn" onClick={() => setSearchQuery("")}>×</button>
                  )}
                </div>

                {/* Folder Tabs */}
                <div className="left-folder-tabs" style={{ margin: 0 }}>
                  <button
                    className={`folder-tab ${activeNavTab === "all" ? "active" : ""}`}
                    onClick={() => {
                      setActiveNavTab("all");
                      setFilterEmployeeId("");
                    }}
                  >
                    <span>All</span>
                  </button>
                  <button
                    className={`folder-tab ${activeNavTab === "assigned_to_me" ? "active" : ""}`}
                    onClick={() => setActiveNavTab("assigned_to_me")}
                  >
                    <span>Assigned</span>
                  </button>
                  <button
                    className={`folder-tab ${activeNavTab === "unassigned" ? "active" : ""}`}
                    onClick={() => {
                      setActiveNavTab("unassigned");
                      setFilterEmployeeId("");
                    }}
                  >
                    <span>Unassigned</span>
                  </button>
                </div>
              </div>



              {/* Filter Pills */}
              {showFilters && (
        <div className="inbox-filters-row">
                <button
                  className={`filter-pill ${unreadOnly ? "active" : ""}`}
                  onClick={() => setUnreadOnly(!unreadOnly)}
                >
                  Unread Only
                </button>
                <select
                  className="filter-select"
                  value={leadStatusFilter}
                  onChange={(e) => setLeadStatusFilter(e.target.value)}
                >
                  <option value="">All Stages</option>
                  <option value="New Lead">New Lead</option>
                  <option value="Quotation Shared">Quotation Shared</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Order Confirmed">Order Confirmed</option>
                </select>
                <select
                  className="filter-select"
                  value={filterEmployeeId}
                  onChange={(e) => setFilterEmployeeId(e.target.value)}
                >
                  <option value="">All Reps</option>
                  {employeesList.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user?.name || emp.employeeId}
                    </option>
                  ))}
                </select>
              </div>
              )}
            </>
          )}
        </div>

        {/* Conversations List */}
        <div className="conversations-scroll-list">
          {loadingConvs && conversations.length === 0 ? (
            <div className="inbox-loading-skeleton">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton-conv-card">
                  <div className="skeleton-avatar"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-line medium"></div>
                    <div className="skeleton-line long"></div>
                    <div className="skeleton-line short"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="inbox-empty-state" style={{ textAlign: "center", padding: "30px 16px" }}>
              <MessageSquare size={32} color="#9ca3af" style={{ marginBottom: "8px" }} />
              <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 12px 0" }}>No conversations found matching filters.</p>
              <button
                className="filter-pill active"
                onClick={handleResetFilters}
                style={{ padding: "6px 14px", fontSize: "12px", margin: "0 auto" }}
              >
                Reset Search & Filters
              </button>
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = conv.id === selectedConvId;
              const cust = conv.customer;
              const isUnread = conv.unreadCount > 0;

              return (
                <div
                  key={conv.id}
                  className={`conversation-card ${isSelected ? "selected" : ""} ${isUnread ? "unread" : ""}`}
                  onClick={() => setSelectedConvId(conv.id)}
                >
                  <div className="conv-avatar">
                    <span>{(cust?.contactPerson || cust?.businessName || "C").slice(0, 2).toUpperCase()}</span>
                    <span className="conv-wa-badge">
                      <MessageSquare size={10} color="#fff" />
                    </span>
                  </div>

                  {!isLeftCollapsed && (
                    <div className="conv-content-box">
                      <div className="conv-top-line">
                        <span className="conv-name">{cust?.contactPerson || cust?.businessName || cust?.whatsappNumber}</span>
                        <span className="conv-time">
                          {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <div className="conv-contact-sub">
                        <span>+91 {String(cust?.mobile || cust?.whatsappNumber || "").replace(/^91/, '').replace(/^\+91/, '').trim()}</span>
                      </div>

                      <div className="conv-snippet-line">
                        <span className="conv-last-msg">{conv.lastMessageText || "No messages yet"}</span>
                        {isUnread && <span className="unread-counter-badge">{conv.unreadCount}</span>}
                      </div>

                      <div className="conv-tags-line">
                        <span className={`stage-tag ${conv.leadStatus?.toLowerCase().replace(/\s+/g, '-')}`}>
                          {conv.leadStatus || "New Lead"}
                        </span>
                        {conv.aiHandled ? (
                          <span className="badge-ai-pill">
                            <Bot size={10} /> AI
                          </span>
                        ) : (
                          <span className="badge-human-pill">Human</span>
                        )}
                        {conv.priority === "HIGH" && <span className="badge-priority-high">HIGH</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>


      {/* ----------------------------------------------------------------- */}
      {/* CENTER COLUMN: LIVE CHAT WINDOW */}
      {/* ----------------------------------------------------------------- */}
      <div className="inbox-center-panel">
        {loadingDetail && !activeConvDetail ? (
          // Skeleton loader instead of a boring spinner
          <div className="chat-skeleton-loader">
            <div className="chat-skeleton-header">
              <div className="skeleton-avatar large"></div>
              <div className="skeleton-content">
                <div className="skeleton-line medium"></div>
                <div className="skeleton-line short"></div>
              </div>
            </div>
            <div className="chat-skeleton-messages">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`skeleton-bubble ${i % 2 === 0 ? 'left' : 'right'}`}>
                  <div className="skeleton-line" style={{ width: `${45 + (i * 13) % 40}%`, height: '14px', borderRadius: '12px' }}></div>
                </div>
              ))}
            </div>
          </div>
        ) : !activeConvDetail ? (
          <div className="chat-empty-selection">
            <MessageSquare size={48} color="#d1d5db" />
            <h3>Select a Conversation to Start Chatting</h3>
            <p>Every WhatsApp chat connects seamlessly to CRM profiles, orders, and quotes.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-header-user-info">
                <div className="chat-avatar-large">
                  <span>{(activeConvDetail.customer?.contactPerson || "C").slice(0, 2).toUpperCase()}</span>
                </div>
                <div>
                  <div className="chat-title-line">
                    <h2 className="chat-customer-name">
                      {activeConvDetail.customer?.contactPerson || activeConvDetail.customer?.businessName || activeConvDetail.customer?.whatsappNumber}
                    </h2>
                    <span className="chat-wa-connected-badge">Connected</span>
                    
                  </div>
                  <div className="chat-sub-line">
                    <span>+91 {String(activeConvDetail.customer?.mobile || activeConvDetail.customer?.whatsappNumber || "").replace(/^91/, '').replace(/^\+91/, '').trim()}</span>
                  </div>
                </div>
              </div>

              <div className="chat-header-actions">
                <a
                  href={`tel:+91${activeConvDetail.customer?.mobile}`}
                  className="chat-action-btn"
                  title="Call Customer via Phone"
                  style={{ textDecoration: "none" }}
                >
                  <Phone size={14} color="#10b981" />
                  <span>Call</span>
                </a>
                <button className="chat-action-btn highlight-assign" onClick={() => setShowAssignModal(true)} title="Assign WhatsApp Lead">
                  <UserCheck size={14} />
                  <span>Assign</span>
                </button>
                <button className="chat-action-btn" onClick={() => setShowQuoteModal(true)} title="Create Quotation">
                  <FileText size={14} />
                  <span>Quotation</span>
                </button>
                <button className="chat-action-btn" onClick={() => setShowPaymentModal(true)} title="Send Payment Link">
                  <CreditCard size={14} />
                  <span>Payment</span>
                </button>
                <button
                  className="chat-action-btn"
                  disabled={aiToggleLoading}
                  onClick={async () => {
                    if (!activeConvDetail?.id) return;
                    setAiToggleLoading(true);
                    const newVal = !activeConvDetail.aiHandled;
                    const res = await toggleConversationAIAction(activeConvDetail.id, newVal);
                    if (res.success) {
                      setActiveConvDetail((prev: any) => ({ ...prev, aiHandled: newVal }));
                      setToastMsg(newVal ? "🤖 AI Assistant turned ON for this chat" : "👤 Manual Mode — AI paused for this chat");
                      setTimeout(() => setToastMsg(null), 3000);
                    }
                    setAiToggleLoading(false);
                  }}
                  title={activeConvDetail.aiHandled ? "AI is ON — Click to switch to Manual Mode" : "AI is OFF — Click to enable AI auto-replies"}
                  style={{
                    background: activeConvDetail.aiHandled ? "#f0fdf4" : "#fef3c7",
                    border: `1px solid ${activeConvDetail.aiHandled ? "#bbf7d0" : "#fde68a"}`,
                    color: activeConvDetail.aiHandled ? "#15803d" : "#b45309"
                  }}
                >
                  <Bot size={14} />
                  <span>{aiToggleLoading ? "..." : activeConvDetail.aiHandled ? "AI: ON" : "AI: OFF"}</span>
                </button>
                <button
                  className={`chat-action-btn ${isFullScreen ? "active-fullscreen" : ""}`}
                  onClick={toggleFullScreenMode}
                  title={isFullScreen ? "Exit Full Screen Mode (Esc)" : "Full Screen WhatsApp Inbox"}
                >
                  {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  <span>{isFullScreen ? "Exit Full Screen" : "Full Screen"}</span>
                </button>
                
                <button
                  className="chat-action-btn"
                  onClick={handleDeleteConversation}
                  title="Delete Conversation"
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fee2e2",
                    color: "#ef4444"
                  }}
                >
                  <UserX size={14} />
                  <span>Delete Chat</span>
                </button>

              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="chat-messages-container">
              {activeConvDetail.messages?.map((msg: any) => {
                const isAgent = msg.senderType === "AGENT" || msg.senderType === "BOT" || msg.senderType === "AI";
                const isInternal = msg.isInternalNote;

                if (isInternal) {
                  return (
                    <div key={msg.id} className="internal-note-card">
                      <div className="internal-note-header">
                        <LockIcon size={12} />
                        <span>Internal Team Note by {msg.senderName}</span>
                        <span className="note-time">
                          {new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="internal-note-body">{msg.content}</div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`message-row ${isAgent ? "outgoing" : "incoming"} ${msg.isInternalNote ? "internal-note-row" : ""}`}>
                    <div className="message-bubble" style={msg.isInternalNote ? { background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047' } : {}}>
                      <div className="message-sender-name" style={msg.isInternalNote ? { color: '#a16207' } : {}}>
                        {msg.isInternalNote ? (
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><LockIcon size={12} /> Internal Note</span>
                        ) : (
                          msg.senderName
                        )}
                      </div>

                      {/* PDF Document Renderer */}
                      {msg.messageType === "DOCUMENT" && (
                        <div className="message-doc-box">
                          <FileText size={24} color="#ef4444" />
                          <div className="doc-info">
                            <span className="doc-filename">{msg.mediaFilename || "Document.pdf"}</span>
                            <span className="doc-filesize">Attachment Document</span>
                          </div>
                          {msg.mediaUrl && (
                            <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="doc-download-btn">
                              Download
                            </a>
                          )}
                        </div>
                      )}

                      {/* Image Message Renderer */}
                      {msg.messageType === "IMAGE" && (
                        <div style={{ marginTop: "4px" }}>
                          {msg.mediaUrl ? (
                            <img
                              src={msg.mediaUrl}
                              alt="Media Image"
                              style={{ width: "100%", maxHeight: "220px", objectFit: "cover", borderRadius: "8px", cursor: "pointer" }}
                              onClick={() => window.open(msg.mediaUrl, "_blank")}
                            />
                          ) : (
                            <div style={{ padding: "12px", background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "8px", fontSize: "11.5px", color: "#64748b", textAlign: "center" }}>
                              📷 Image expired (Stored only for 30 days)
                            </div>
                          )}
                          {msg.content && msg.content !== "[IMAGE]" && !msg.content.startsWith("Attached file:") && <p className="message-text-content" style={{ marginTop: "4px" }}>{msg.content}</p>}
                        </div>
                      )}

                      {/* Video Message Renderer */}
                      {msg.messageType === "VIDEO" && (
                        <div style={{ marginTop: "4px" }}>
                          <video src={msg.mediaUrl || ""} controls style={{ width: "100%", maxHeight: "220px", borderRadius: "8px" }} />
                          {msg.content && msg.content !== "[IMAGE]" && !msg.content.startsWith("Attached file:") && <p className="message-text-content" style={{ marginTop: "4px" }}>{msg.content}</p>}
                        </div>
                      )}

                      {/* Audio Message Renderer */}
                      {msg.messageType === "AUDIO" && (
                        <div style={{ marginTop: "4px", background: "#f3f4f6", padding: "8px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280" }}>Voice Message</span>
                          {msg.mediaUrl ? (
                            <audio src={msg.mediaUrl} controls style={{ width: "100%", height: "36px" }} />
                          ) : (
                            <div style={{ padding: "8px", background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "8px", fontSize: "11.5px", color: "#64748b", textAlign: "center" }}>
                              🎙 Voice note expired (Stored only for 30 days)
                            </div>
                          )}
                        </div>
                      )}

                      {/* Payment Link Card Renderer */}
                      {msg.messageType === "PAYMENT_LINK" && (
                        <div className="message-payment-card">
                          <div className="payment-card-header">
                            <CreditCard size={18} />
                            <span>WhatsApp Payment Link</span>
                          </div>
                          <div className="payment-card-body">
                            <p>{msg.content}</p>
                            <div className="payment-status-pill">Status: PENDING</div>
                          </div>
                        </div>
                      )}

                      {/* Standard Text Renderer */}
                      {msg.messageType !== "DOCUMENT" && msg.messageType !== "IMAGE" && msg.messageType !== "VIDEO" && msg.messageType !== "PAYMENT_LINK" && (
                        <p className="message-text-content" style={msg.isInternalNote ? { color: '#713f12' } : {}}>{msg.content}</p>
                      )}

                      <div className="message-meta-line">
                        <span className="message-timestamp" style={msg.isInternalNote ? { color: '#a16207' } : {}}>
                          {new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {isAgent && !msg.isInternalNote && (
                          <span className="msg-status-tick" style={{ display: "inline-flex", alignItems: "center" }}>
                            {msg.status?.toUpperCase() === "READ" ? (
                              <CheckCheck size={14} style={{ color: "#3b82f6", marginLeft: "4px" }} title="Read" />
                            ) : msg.status?.toUpperCase() === "DELIVERED" ? (
                              <CheckCheck size={14} style={{ color: "#94a3b8", marginLeft: "4px" }} title="Delivered" />
                            ) : msg.status?.toUpperCase() === "FAILED" ? (
                              <span style={{ color: "#ef4444", fontSize: "11px", marginLeft: "4px" }} title="Failed to send">⚠️</span>
                            ) : (
                              <Check size={14} style={{ color: "#94a3b8", marginLeft: "4px" }} title="Sent" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );

              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input & Action Bar */}
            <div className="chat-input-wrapper">
              {/* Quick Action Shortcut Buttons */}
              <div className="chat-quick-actions-bar">
                <button className="quick-chip" onClick={() => applyQuickShortcut("/catalog")}>
                  <BookOpen size={12} /> /catalog
                </button>
                <button className="quick-chip" onClick={() => applyQuickShortcut("/price")}>
                  <DollarSign size={12} /> /price
                </button>
                <button className="quick-chip" onClick={() => applyQuickShortcut("/payment")}>
                  <CreditCard size={12} /> /payment
                </button>
                <button className="quick-chip" onClick={() => setShowFollowUpModal(true)}>
                  <Calendar size={12} /> + Follow Up
                </button>
                <button className="quick-chip highlight" onClick={() => setShowReplyLibraryModal(true)}>
                  <Zap size={12} /> Reply Library
                </button>
                <button className="quick-chip ai-suggest" onClick={handleSuggestReply} disabled={aiSuggesting} style={{ background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' }}>
                  <Sparkles size={12} /> {aiSuggesting ? "Generating..." : "Suggest Reply AI"}
                </button>
                <Link href="/whatsapp/ai-automation" className="quick-chip" style={{ background: '#f8fafc', color: '#475569', borderColor: '#cbd5e1', textDecoration: 'none' }} title="AI Settings">
                  <Settings size={12} />
                </Link>
                <button
                  className={`quick-chip internal-toggle ${isInternalNote ? "active" : ""}`}
                  onClick={() => setIsInternalNote(!isInternalNote)}
                >
                  <LockIcon size={12} /> {isInternalNote ? "Internal Note ON" : "Internal Note"}
                </button>
              </div>

              {/* Hidden Direct File Upload Input */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleDirectFileUpload}
              />

              {/* Emoji Picker Popup */}
              {showEmojiPicker && (
                <div style={{ display: "flex", gap: "6px", padding: "8px 12px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", marginBottom: "6px", width: "fit-content" }}>
                  {EMOJI_LIST.map((emoji) => (
                    <span
                      key={emoji}
                      onClick={() => handleInsertEmoji(emoji)}
                      style={{ fontSize: "16px", cursor: "pointer", padding: "2px 4px", borderRadius: "4px" }}
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
              )}

              {/* Text Area Form */}
              {isRecording ? (
                <div className="voice-recorder-bar" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '24px', flex: 1, margin: '0 8px' }}>
                  <span className="record-dot-blink" style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                  <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: 600, flex: 1 }}>
                    Recording Voice Note... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={cancelRecording}
                    style={{ background: '#ef4444', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={stopAndSendRecording}
                    style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Send Voice Note
                  </button>
                </div>
              ) : (
                <form className={`chat-input-form ${isInternalNote ? "internal-mode" : ""}`} onSubmit={handleSendMessage}>
                <button
                  type="button"
                  className="input-attachment-btn"
                  title="Attach File / Image / Document"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip size={18} />
                </button>
                
                <button
                  type="button"
                  className="input-attachment-btn"
                  title="Record Voice Note"
                  onClick={startRecording}
                  style={{ color: '#ef4444' }}
                >
                  <Mic size={18} />
                </button>

                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    className="input-attachment-btn"
                    title="Quick Replies / Canned Responses"
                    onClick={() => setShowCannedResponses(!showCannedResponses)}
                  >
                    <Zap size={18} color={showCannedResponses ? "#f59e0b" : "#64748b"} />
                  </button>

                  {/* Canned Responses Popup Menu */}
                  {showCannedResponses && (
                    <div style={{ position: "absolute", bottom: "100%", left: "0", marginBottom: "8px", width: "300px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", zIndex: 10 }}>
                      <div style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0", fontSize: "12px", fontWeight: 700, color: "#64748b", background: "#f8fafc", borderRadius: "8px 8px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>Quick Replies</span>
                        <button type="button" onClick={() => setShowCannedResponses(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={14} /></button>
                      </div>
                      <div style={{ maxHeight: "250px", overflowY: "auto", padding: "4px" }}>
                        {cannedResponses.length > 0 ? (
                          cannedResponses.map(cr => (
                            <button
                              key={cr.id}
                              type="button"
                              onClick={() => {
                                setMessageInput(prev => prev ? `${prev} ${cr.content}` : cr.content);
                                setShowCannedResponses(false);
                              }}
                              style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 10px", background: "none", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12.5px" }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                              <strong style={{ color: "#0f172a", display: "block", marginBottom: "2px" }}>{cr.title} <span style={{ color: "#3b82f6", fontSize: "11px", fontWeight: "normal" }}>{cr.shortcut}</span></strong>
                              <span style={{ color: "#64748b", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cr.content}</span>
                            </button>
                          ))
                        ) : (
                          <div style={{ padding: "12px", textAlign: "center", fontSize: "12px", color: "#64748b" }}>No quick replies found.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="input-attachment-btn"
                  title="Quick Emojis"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile size={18} color={showEmojiPicker ? "#10b981" : "#64748b"} />
                </button>

                {/* Team Mentions Popup Menu */}
                {showMentionsMenu && (
                  <div style={{ position: "absolute", bottom: "100%", left: "40px", marginBottom: "8px", width: "200px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", zIndex: 10 }}>
                    <div style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0", fontSize: "12px", fontWeight: 700, color: "#64748b", background: "#f8fafc", borderRadius: "8px 8px 0 0" }}>
                      Mention Teammate
                    </div>
                    <div style={{ maxHeight: "150px", overflowY: "auto", padding: "4px" }}>
                      {employeesList.filter(emp => emp.firstName?.toLowerCase().includes(mentionSearch) || emp.name?.toLowerCase().includes(mentionSearch)).length > 0 ? (
                        employeesList.filter(emp => emp.firstName?.toLowerCase().includes(mentionSearch) || emp.name?.toLowerCase().includes(mentionSearch)).map(emp => (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => {
                              const lastAtSymbol = messageInput.lastIndexOf("@");
                              const newText = messageInput.slice(0, lastAtSymbol) + `@${emp.firstName || emp.name} `;
                              setMessageInput(newText);
                              setShowMentionsMenu(false);
                            }}
                            style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", textAlign: "left", padding: "6px 8px", background: "none", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                          >
                            <User size={14} color="#3b82f6" />
                            <strong style={{ color: "#0f172a" }}>{emp.firstName || emp.name}</strong>
                          </button>
                        ))
                      ) : (
                        <div style={{ padding: "12px", textAlign: "center", fontSize: "12px", color: "#64748b" }}>No team members found.</div>
                      )}
                    </div>
                  </div>
                )}

                <textarea
                  rows={2}
                  className="chat-textarea"
                  placeholder={
                    isInternalNote
                      ? "Add an internal note visible only to your team..."
                      : "Type a WhatsApp message or use shortcuts like /catalog, /price..."
                  }
                  value={messageInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMessageInput(val);
                    
                    // Mention Autocomplete logic
                    if (isInternalNote) {
                      const lastAtSymbol = val.lastIndexOf("@");
                      if (lastAtSymbol !== -1 && (lastAtSymbol === 0 || val[lastAtSymbol - 1] === " ")) {
                        const searchText = val.slice(lastAtSymbol + 1);
                        if (!searchText.includes(" ")) {
                          setShowMentionsMenu(true);
                          setMentionSearch(searchText.toLowerCase());
                        } else {
                          setShowMentionsMenu(false);
                        }
                      } else {
                        setShowMentionsMenu(false);
                      }
                    } else {
                      setShowMentionsMenu(false);
                    }

                    // Check if they typed a shortcut exactly
                    const match = cannedResponses.find(cr => val.endsWith(cr.shortcut + " "));
                    if (match) {
                      setMessageInput(val.replace(match.shortcut + " ", match.content + " "));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />

                <button type="submit" className="send-msg-btn" disabled={sendingMsg || !messageInput.trim()}>
                  {sendingMsg ? <RefreshCw size={16} className="spin-icon" /> : <Send size={16} />}
                  <span>{isInternalNote ? "Save Note" : "Send"}</span>
                </button>
              </form>
              )}
            </div>
          </>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* RIGHT COLUMN: CRM 360° CUSTOMER PROFILE PANEL */}
      {/* ----------------------------------------------------------------- */}
      <div className="inbox-right-panel collapsed" style={{ display: 'none' }}>
        {!isRightCollapsed && activeConvDetail && (
          <div className="crm-panel-container">
            {/* Panel Header */}
            <div className="crm-panel-header">
              <h3>CRM 360° Profile</h3>
              <div className="crm-header-btns">
                {isEditingCRM ? (
                  <button className="crm-save-btn" onClick={handleSaveCRMProfile}>
                    <Check size={14} /> Save
                  </button>
                ) : (
                  <button className="crm-edit-btn" onClick={() => setIsEditingCRM(true)}>
                    <Edit3 size={14} /> Edit
                  </button>
                )}
              </div>
            </div>

            {/* Profile Overview Card */}
            <div className="crm-profile-card">
              <div className="crm-card-avatar">
                <span>{(activeConvDetail.customer?.contactPerson || "C").slice(0, 2).toUpperCase()}</span>
              </div>

              {isEditingCRM ? (
                <div className="crm-edit-form">
                  <label>Business Name</label>
                  <input
                    type="text"
                    value={crmEditData.businessName}
                    onChange={(e) => setCrmEditData({ ...crmEditData, businessName: e.target.value })}
                  />

                  <label>Contact Person</label>
                  <input
                    type="text"
                    value={crmEditData.contactPerson}
                    onChange={(e) => setCrmEditData({ ...crmEditData, contactPerson: e.target.value })}
                  />

                  <label>Mobile Number</label>
                  <input
                    type="text"
                    value={crmEditData.mobile}
                    onChange={(e) => setCrmEditData({ ...crmEditData, mobile: e.target.value })}
                  />

                  <label>Customer Type</label>
                  <select
                    value={crmEditData.customerType}
                    onChange={(e) => setCrmEditData({ ...crmEditData, customerType: e.target.value })}
                  >
                    <option value="Wholesaler">Wholesaler</option>
                    <option value="Retailer">Retailer</option>
                    <option value="Distributor">Distributor</option>
                  </select>

                  <label>Pipeline Stage</label>
                  <select
                    value={crmEditData.leadStage}
                    onChange={(e) => setCrmEditData({ ...crmEditData, leadStage: e.target.value })}
                  >
                    <option value="New Lead">New Lead</option>
                    <option value="Quotation Shared">Quotation Shared</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Order Confirmed">Order Confirmed</option>
                    <option value="Won">Won</option>
                  </select>
                </div>
              ) : (
                <>
                  <h4 className="crm-business-title">
                    {activeConvDetail.customer?.businessName || "Unnamed Customer"}
                  </h4>
                  <p className="crm-contact-name">{activeConvDetail.customer?.contactPerson}</p>

                  <div className="crm-badges-row">
                    <span className="crm-type-badge">{activeConvDetail.customerType || "Wholesaler"}</span>
                    <span className="crm-stage-badge">{activeConvDetail.leadStatus || "New Lead"}</span>
                  </div>

                  {activeConvDetail.customer?.id && (
                    <div style={{ marginTop: "10px", textAlign: "center" }}>
                      <Link
                        href={`/customers/${activeConvDetail.customer.id}`}
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#10b981",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        View Full CRM Profile <ExternalLink size={12} />
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Financial Metrics Cards */}
            <div className="crm-metrics-grid">
              <div className="crm-metric-box">
                <span className="metric-label">Total Purchases</span>
                <span className="metric-value">
                  ₹{(activeConvDetail.customer?.totalPurchaseValue || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="crm-metric-box">
                <span className="metric-label">Total Orders</span>
                <span className="metric-value">{activeConvDetail.customer?.totalOrders || 0} Orders</span>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="crm-section-box">
              <h5 className="crm-section-title">Quick Actions</h5>
              <div className="crm-quick-btns">
                <button className="crm-action-tile" onClick={() => setShowQuoteModal(true)}>
                  <FileText size={14} /> Create Quotation
                </button>
                <button className="crm-action-tile" onClick={() => setShowPaymentModal(true)}>
                  <CreditCard size={14} /> Send Payment Link
                </button>
              </div>
            </div>

            {/* CRM Contact Information */}
            <div className="crm-section-box">
              <h5 className="crm-section-title">Contact Information</h5>
              <div className="crm-info-list">
                <div className="info-item">
                  <Phone size={14} />
                  <span>+91 {activeConvDetail.customer?.mobile}</span>
                </div>
                <div className="info-item">
                  <Mail size={14} />
                  <span>{activeConvDetail.customer?.email || "No email added"}</span>
                </div>
                <div className="info-item">
                  <MapPin size={14} />
                  <span>
                    {activeConvDetail.customer?.city || "Surat"},{" "}
                    {activeConvDetail.customer?.state || "Gujarat"}
                  </span>
                </div>
                <div className="info-item">
                  <UserCheck size={14} />
                  <span>Assigned Rep: {activeConvDetail.assignedEmployee?.user?.name || "Ikra (Sales)"}</span>
                </div>
              </div>
            </div>

            {/* Orders & Quotes History */}
            <div className="crm-section-box">
              <h5 className="crm-section-title">Recent Quotations</h5>
              {activeConvDetail.customer?.quotations?.length === 0 ? (
                <p className="no-records-text">No quotations created yet</p>
              ) : (
                <div className="records-mini-list">
                  {activeConvDetail.customer?.quotations?.map((q: any) => (
                    <div key={q.id} className="record-mini-card">
                      <div>
                        <span className="record-title">{q.quotationNumber}</span>
                        <span className="record-date">{new Date(q.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className="record-amount">₹{(q.totalValue || 0).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Timeline */}
            <div className="crm-section-box">
              <h5 className="crm-section-title">WhatsApp & CRM Timeline</h5>
              <div className="timeline-list">
                {activeConvDetail.messages && activeConvDetail.messages.length > 0 ? (
                  <div className="timeline-item">
                    <div className="timeline-dot green" />
                    <div className="timeline-content">
                      <span className="timeline-time">
                        {new Date(activeConvDetail.messages[activeConvDetail.messages.length - 1].sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <p className="timeline-text">Last interaction with customer</p>
                    </div>
                  </div>
                ) : (
                  <p className="no-records-text" style={{ paddingLeft: '20px' }}>No recent activity</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* MODALS 1, 2, 3, 4 */}
      {/* ----------------------------------------------------------------- */}
      {showReplyLibraryModal && (
        <div className="inbox-modal-backdrop" onClick={() => setShowReplyLibraryModal(false)}>
          <div className="inbox-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>WhatsApp Reply Library & Shortcuts</h3>
              <button onClick={() => setShowReplyLibraryModal(false)}>×</button>
            </div>
            <div className="reply-shortcuts-list">
              <div className="shortcut-item-card" onClick={() => applyQuickShortcut("Here is our latest 2026 Wholesale Apparel Catalog with bulk slab pricing: https://espon.in/catalog-2026.pdf. Let us know your size requirement!")}>
                <div className="shortcut-badge">/catalog</div>
                <div>
                  <strong>Send Wholesale Catalog</strong>
                  <p>Sends summer 2026 wholesale apparel catalog PDF link</p>
                </div>
              </div>
              <div className="shortcut-item-card" onClick={() => applyQuickShortcut("Our Wholesale Pricing Slabs:\n• 100 - 250 pcs: ₹290/pc\n• 251 - 500 pcs: ₹270/pc\n• 500+ pcs: ₹250/pc + Free Freight Shipping.")}>
                <div className="shortcut-badge">/price</div>
                <div>
                  <strong>Standard Wholesale Tiered Price List</strong>
                  <p>Sends 100, 250, 500+ piece wholesale slab pricing</p>
                </div>
              </div>
              <div className="shortcut-item-card" onClick={() => applyQuickShortcut("Bank Details:\nAccount Name: ESPON CLOTHING PRIVATE LIMITED\nAccount No: 016805006415\nIFSC: ICIC0000168\nUPI ID: 7206066678@OKBIZAXIS")}>
                <div className="shortcut-badge">/payment</div>
                <div>
                  <strong>Bank & UPI Payment Details</strong>
                  <p>Sends Espon Clothing official bank account & UPI ID</p>
                </div>
              </div>
              <div className="shortcut-item-card" onClick={() => applyQuickShortcut("Hi, following up on our previous conversation regarding your inquiry. Please let us know if you have any questions or need samples!")}>
                <div className="shortcut-badge">/followup</div>
                <div>
                  <strong>Friendly 24-Hour Followup</strong>
                  <p>Standard follow-up inquiry message</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showQuoteModal && (
        <div className="inbox-modal-backdrop" onClick={() => setShowQuoteModal(false)}>
          <div className="inbox-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>Create & Send WhatsApp Quotation</h3>
              <button onClick={() => setShowQuoteModal(false)}>×</button>
            </div>
            <div className="modal-form-body">
              {quoteItems.map((item, idx) => (
                <div key={idx} className="item-row-edit">
                  <input
                    type="text"
                    value={item.name}
                    placeholder="Product Item Name"
                    onChange={(e) => {
                      const updated = [...quoteItems];
                      updated[idx].name = e.target.value;
                      setQuoteItems(updated);
                    }}
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    placeholder="Qty"
                    onChange={(e) => {
                      const updated = [...quoteItems];
                      updated[idx].quantity = parseInt(e.target.value) || 0;
                      setQuoteItems(updated);
                    }}
                  />
                  <input
                    type="number"
                    value={item.rate}
                    placeholder="Rate"
                    onChange={(e) => {
                      const updated = [...quoteItems];
                      updated[idx].rate = parseFloat(e.target.value) || 0;
                      setQuoteItems(updated);
                    }}
                  />
                </div>
              ))}
              <div className="modal-total-summary">
                <span>Total Quotation Value (incl 12% GST):</span>
                <strong>
                  ₹
                  {quoteItems
                    .reduce((s, i) => s + i.quantity * i.rate * 1.12, 0)
                    .toLocaleString("en-IN")}
                </strong>
              </div>
              <button className="modal-submit-btn" onClick={handleCreateQuoteSubmit}>
                Generate & Send PDF Quotation in Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="inbox-modal-backdrop" onClick={() => setShowPaymentModal(false)}>
          <div className="inbox-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>Generate WhatsApp Payment Link</h3>
              <button onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <div className="modal-form-body">
              <label>Amount (₹)</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              />

              <label>Payment Description</label>
              <input
                type="text"
                value={paymentDesc}
                onChange={(e) => setPaymentDesc(e.target.value)}
              />

              <button className="modal-submit-btn" onClick={handleSendPaymentSubmit}>
                Send UPI / Card Payment Link in Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="inbox-modal-backdrop" onClick={() => setShowAssignModal(false)}>
          <div className="inbox-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>Assign WhatsApp Lead</h3>
              <button onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <div className="modal-form-body">
              <div
                style={{
                  background: "#f0fdf4",
                  border: "2px dashed #10b981",
                  borderRadius: "8px",
                  padding: "14px",
                  marginBottom: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#065f46", margin: 0 }}>
                    Auto-Assign via Round-Robin
                  </h4>
                  <p style={{ fontSize: "12px", color: "#047857", margin: "2px 0 0 0" }}>
                    Automatically assigns to the active sales executive with the lowest open workload.
                  </p>
                </div>
                <button
                  disabled={assigningLead}
                  onClick={() => handleAssignLead(undefined, "ROUND_ROBIN")}
                  style={{
                    background: "#10b981",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "6px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  {assigningLead ? "Assigning..." : "Run Round-Robin"}
                </button>
              </div>

              <span style={{ fontSize: "12px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>
                Or Assign Manually to Team Member
              </span>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px", maxHeight: "250px", overflowY: "auto" }}>
                {employeesList.map((emp) => (
                  <div
                    key={emp.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      background: "#ffffff"
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "13px", color: "#111827", display: "block" }}>
                        {emp.user?.name || emp.employeeId}
                      </strong>
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>
                        Open Chats: {emp.assignedWhatsAppConversations?.length || 0}
                      </span>
                    </div>

                    <button
                      disabled={assigningLead}
                      onClick={() => handleAssignLead(emp.id, "MANUAL")}
                      style={{
                        background: "#f3f4f6",
                        border: "1px solid #d1d5db",
                        color: "#374151",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      Assign Rep
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showFollowUpModal && (
        <div className="inbox-modal-backdrop" onClick={() => setShowFollowUpModal(false)}>
          <div className="inbox-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>Schedule Follow-Up Task</h3>
              <button onClick={() => setShowFollowUpModal(false)}>×</button>
            </div>
            <div className="modal-form-body">
              <label>Follow-Up In (Days)</label>
              <input
                type="number"
                min="1"
                max="90"
                value={followUpDays}
                onChange={(e) => setFollowUpDays(parseInt(e.target.value) || 3)}
              />

              <label>Follow-Up Notes / Context</label>
              <textarea
                rows={3}
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                placeholder="E.g. Check if they liked the sample shirts..."
              />

              <button className="modal-submit-btn" onClick={handleCreateFollowUpSubmit}>
                Create Follow-Up Task
              </button>
            </div>
          </div>
        </div>
      )}
      {/* End of inbox panels */}
    </div>
  );
}

function LockIcon({ size }: { size: number }) {
  return <ShieldCheck size={size} color="#f59e0b" />;
}








