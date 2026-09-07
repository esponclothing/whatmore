"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Phone,
  Tag,
  CheckCircle2,
  Clock,
  RefreshCw,
  Plus,
  Send,
  X,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Filter,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import {
  getWhatsAppContactsListAction,
  toggleContactCrmStatusAction,
  updateContactTagsAction,
  createWhatsAppContactAction,
  getOrCreateWhatsAppConversationForContactAction
} from "@/app/actions/whatsAppPlatformActions";
import { formatWhatsAppPhone } from "@/lib/phoneUtils";

export default function WhatsAppContactsComponent() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, done: 0, notDone: 0 });
  const [isCrmConnected, setIsCrmConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Search and Filter states
  const [search, setSearch] = useState("");
  const [crmFilter, setCrmFilter] = useState<"ALL" | "DONE" | "NOT_DONE">("ALL");
  const [tagFilter, setTagFilter] = useState("ALL");
  const [allAvailableTags, setAllAvailableTags] = useState<string[]>([]);

  // Action states
  const [togglingCrmId, setTogglingCrmId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openingChatId, setOpeningChatId] = useState<string | null>(null);

  // Add Contact Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [selectedNewContactTags, setSelectedNewContactTags] = useState<string[]>([]);
  const [newCustomTagText, setNewCustomTagText] = useState("");
  const [newPushToCrm, setNewPushToCrm] = useState(true);
  const [savingContact, setSavingContact] = useState(false);

  // Edit Tag Modal
  const [tagModalContact, setTagModalContact] = useState<any | null>(null);
  const [editTagsList, setEditTagsList] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [savingTags, setSavingTags] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Load system-wide tags on mount
  useEffect(() => {
    fetch("/api/whatsapp/tags")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.tags) {
          const names = d.tags.map((t: any) => t.name);
          setAllAvailableTags((prev) => Array.from(new Set([...prev, ...names])));
        }
      })
      .catch(() => {});
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    const res = await getWhatsAppContactsListAction({
      search,
      crmFilter,
      tag: tagFilter !== "ALL" ? tagFilter : undefined
    });

    if (res.success) {
      setContacts(res.contacts || []);
      if (res.stats) setStats(res.stats);
      if (res.isCrmConnected !== undefined) {
        setIsCrmConnected(Boolean(res.isCrmConnected));
      }

      // Collect all unique tags for filter dropdown
      const tagsSet = new Set<string>();
      (res.contacts || []).forEach((c: any) => {
        (c.tags || []).forEach((t: string) => tagsSet.add(t));
      });
      setAllAvailableTags((prev) => Array.from(new Set([...prev, ...Array.from(tagsSet)])));
    } else {
      showToast(res.error || "Failed to load contacts", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContacts();
  }, [search, crmFilter, tagFilter]);

  const handleToggleCrm = async (contact: any) => {
    setTogglingCrmId(contact.id);
    const nextStatus = !contact.pushedToCrm;
    const res = await toggleContactCrmStatusAction(contact.id, nextStatus);
    setTogglingCrmId(null);

    if (res.success) {
      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, pushedToCrm: nextStatus } : c))
      );
      setStats((prev) => ({
        ...prev,
        done: nextStatus ? prev.done + 1 : Math.max(0, prev.done - 1),
        notDone: nextStatus ? Math.max(0, prev.notDone - 1) : prev.notDone + 1
      }));
      showToast(
        nextStatus
          ? `✓ Contact "${contact.name}" pushed to CRM (Status: DONE)!`
          : `✓ CRM status for "${contact.name}" reset to NOT DONE.`
      );
    } else {
      showToast(res.error || "Failed to update CRM status", "error");
    }
  };

  const handleOpenChat = async (contact: any) => {
    setOpeningChatId(contact.id);
    try {
      let convId = contact.conversationId;
      if (!convId) {
        const res = await getOrCreateWhatsAppConversationForContactAction(contact.id);
        if (res.success && res.conversationId) {
          convId = res.conversationId;
        }
      }

      const phoneParam = contact.mobile || contact.whatsappNumber || "";
      if (convId) {
        router.push(`/whatsapp/inbox?convId=${convId}&phone=${encodeURIComponent(phoneParam)}`);
      } else {
        router.push(`/whatsapp/inbox?phone=${encodeURIComponent(phoneParam)}`);
      }
    } catch (err: any) {
      router.push(`/whatsapp/inbox?phone=${encodeURIComponent(contact.mobile)}`);
    } finally {
      setOpeningChatId(null);
    }
  };

  const handleCopyPhone = (id: string, phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast("Phone number copied to clipboard!");
  };

  const openAddModal = () => {
    setNewName("");
    setNewMobile("");
    setSelectedNewContactTags([]);
    setNewCustomTagText("");
    setNewPushToCrm(true);
    setShowAddModal(true);
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newMobile.trim()) {
      showToast("Name and mobile number are required.", "error");
      return;
    }

    setSavingContact(true);
    const res = await createWhatsAppContactAction({
      name: newName.trim(),
      mobile: newMobile.trim(),
      tags: selectedNewContactTags,
      pushToCrm: isCrmConnected ? newPushToCrm : false
    });
    setSavingContact(false);

    if (res.success) {
      showToast(`Contact "${newName}" created successfully!`);
      setShowAddModal(false);
      setNewName("");
      setNewMobile("");
      setSelectedNewContactTags([]);
      setNewCustomTagText("");
      setNewPushToCrm(true);
      fetchContacts();
    } else {
      showToast(res.error || "Failed to create contact.", "error");
    }
  };

  const openTagModal = (contact: any) => {
    setTagModalContact(contact);
    setEditTagsList([...(contact.tags || [])]);
    setCustomTagInput("");
  };

  const handleAddCustomTag = () => {
    if (!customTagInput.trim()) return;
    const clean = customTagInput.trim();
    if (!editTagsList.includes(clean)) {
      setEditTagsList([...editTagsList, clean]);
    }
    if (!allAvailableTags.includes(clean)) {
      setAllAvailableTags([...allAvailableTags, clean]);
    }
    setCustomTagInput("");
  };

  const handleRemoveTag = (tagName: string) => {
    setEditTagsList(editTagsList.filter((t) => t !== tagName));
  };

  const handleSaveTags = async () => {
    if (!tagModalContact) return;
    setSavingTags(true);
    const res = await updateContactTagsAction(tagModalContact.id, editTagsList);
    setSavingTags(false);

    if (res.success) {
      setContacts((prev) =>
        prev.map((c) => (c.id === tagModalContact.id ? { ...c, tags: editTagsList } : c))
      );
      setTagModalContact(null);
      showToast("Tags updated successfully!");
    } else {
      showToast(res.error || "Failed to save tags", "error");
    }
  };

  const formatDateTime = (dateVal: any) => {
    if (!dateVal) return "N/A";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const getInitials = (name: string) => {
    if (!name) return "WA";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Toast Notification */}
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
          {toastMsg.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {toastMsg.text}
        </div>
      )}

      {/* Top Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={22} className="text-indigo-600" />
            WhatsApp Contacts Directory
          </h2>
          <p className="text-gray-500 text-sm">
            Manage customer names, mobile numbers, creation timestamps, custom tags{isCrmConnected ? ", and CRM push status" : ""}.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={fetchContacts}
            disabled={loading}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition flex items-center gap-2 shadow-sm"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} /> Add Contact
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className={`grid grid-cols-1 ${isCrmConnected ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-4`}>
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Contacts</div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{stats.total}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>

        {isCrmConnected ? (
          <>
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Pushed to CRM (Done)
                </div>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{stats.done}</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Not Pushed (Pending)
                </div>
                <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{stats.notDone}</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock size={24} />
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                Total Tags Applied
              </div>
              <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
                {allAvailableTags.length}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Tag size={24} />
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, mobile number, tag, or city..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* CRM Status Filter - only if CRM connected */}
          {isCrmConnected && (
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700">
              <span className="text-xs font-bold text-gray-500">CRM:</span>
              <select
                value={crmFilter}
                onChange={(e) => setCrmFilter(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-gray-700 dark:text-gray-200 outline-none cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="DONE">✅ Done (Pushed)</option>
                <option value="NOT_DONE">⏳ Not Done (Pending)</option>
              </select>
            </div>
          )}

          {/* Tag Filter */}
          {allAvailableTags.length > 0 && (
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700">
              <Tag size={13} className="text-gray-400" />
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-gray-700 dark:text-gray-200 outline-none cursor-pointer"
              >
                <option value="ALL">All Tags</option>
                {allAvailableTags.map((t) => (
                  <option key={t} value={t}>
                    🏷️ {t}
                  </option>
                ))}
              </select>
            </div>
          )}

          <span className="text-xs text-gray-500 font-medium ml-2">
            {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="py-3.5 px-5">Name & Customer</th>
                <th className="py-3.5 px-5">Mobile Number</th>
                <th className="py-3.5 px-5">Created Time & Date</th>
                <th className="py-3.5 px-5">Tags Applied</th>
                {isCrmConnected && <th className="py-3.5 px-5">Pushed to CRM</th>}
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={isCrmConnected ? 6 : 5} className="py-12 text-center text-gray-400">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading contacts list...
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={isCrmConnected ? 6 : 5} className="py-16 text-center text-gray-400">
                    <Users size={40} className="mx-auto mb-3 opacity-30" />
                    <div className="font-bold text-gray-700 dark:text-gray-300">No contacts found</div>
                    <div className="text-xs mt-1">Try adjusting your search or create a new contact.</div>
                    <button
                      onClick={openAddModal}
                      className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm"
                    >
                      + Add First Contact
                    </button>
                  </td>
                </tr>
              ) : (
                contacts.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50/70 dark:hover:bg-slate-700/30 transition-colors group"
                  >
                    {/* 1. Name */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-sm flex-shrink-0">
                          {getInitials(c.name)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white leading-tight">
                            {c.name}
                          </div>
                          {c.businessName && c.businessName !== c.name && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {c.businessName}
                            </div>
                          )}
                          {c.city && (
                            <div className="text-[11px] text-gray-400 mt-0.5">📍 {c.city}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 2. Mobile Number */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                          {formatWhatsAppPhone(c.mobile)}
                        </span>
                        <button
                          onClick={() => handleCopyPhone(c.id, c.mobile)}
                          title="Copy phone"
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition"
                        >
                          {copiedId === c.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </td>

                    {/* 3. Created Time & Date */}
                    <td className="py-3.5 px-5">
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {formatDateTime(c.createdAt)}
                      </div>
                    </td>

                    {/* 4. Tags Applied - only show 1 tag and a "+N more" badge if more exist */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5 flex-nowrap">
                        {c.tags && c.tags.length > 0 ? (
                          <>
                            {/* First Tag */}
                            <span
                              className="inline-flex items-center px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-md text-[11px] font-bold truncate max-w-[150px]"
                              title={c.tags[0]}
                            >
                              🏷️ {c.tags[0]}
                            </span>

                            {/* +N More button */}
                            {c.tags.length > 1 && (
                              <button
                                onClick={() => openTagModal(c)}
                                className="px-1.5 py-0.5 bg-gray-100 hover:bg-indigo-100 dark:bg-slate-700 dark:hover:bg-indigo-900/60 text-gray-600 hover:text-indigo-700 dark:text-gray-300 dark:hover:text-indigo-300 border border-gray-200 dark:border-slate-600 rounded-md text-[11px] font-extrabold transition shadow-2xs"
                                title={`Click to view all ${c.tags.length} tags: ${c.tags.join(', ')}`}
                              >
                                +{c.tags.length - 1} more
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No tags</span>
                        )}

                        <button
                          onClick={() => openTagModal(c)}
                          className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition text-[11px] font-semibold"
                          title="Manage Tags"
                        >
                          <Tag size={12} />
                        </button>
                      </div>
                    </td>

                    {/* 5. Pushed to CRM Status (DONE / NOT DONE) - only rendered if CRM connected */}
                    {isCrmConnected && (
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleCrm(c)}
                            disabled={togglingCrmId === c.id}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold transition shadow-sm border ${
                              c.pushedToCrm
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                                : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                            }`}
                            title="Click to toggle CRM push status"
                          >
                            {togglingCrmId === c.id ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : c.pushedToCrm ? (
                              <CheckCircle2 size={13} className="text-emerald-600" />
                            ) : (
                              <Clock size={13} className="text-amber-600" />
                            )}
                            <span>{c.pushedToCrm ? "DONE" : "NOT DONE"}</span>
                          </button>

                          {!c.pushedToCrm && (
                            <button
                              onClick={() => handleToggleCrm(c)}
                              disabled={togglingCrmId === c.id}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                              title="Push contact directly to connected CRM webhook"
                            >
                              Push to CRM
                            </button>
                          )}
                        </div>
                      </td>
                    )}

                    {/* 6. Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenChat(c)}
                          disabled={openingChatId === c.id}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                          title="Open in WhatsApp Inbox"
                        >
                          {openingChatId === c.id ? (
                            <RefreshCw size={13} className="animate-spin text-indigo-600" />
                          ) : (
                            <MessageSquare size={13} />
                          )}
                          <span>{openingChatId === c.id ? "Opening..." : "Chat"}</span>
                        </button>

                        <button
                          onClick={() => openTagModal(c)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
                          title="Edit Tags"
                        >
                          <Tag size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Contact */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-base flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                Add New WhatsApp Contact
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">
                  Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newMobile}
                  onChange={(e) => setNewMobile(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              {/* Selectable Tags Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                    Select Tags
                  </label>
                  <span className="text-[11px] text-indigo-600 font-semibold">
                    {selectedNewContactTags.length} selected
                  </span>
                </div>

                {/* Selectable Tag Chips */}
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl min-h-[50px] max-h-[140px] overflow-y-auto">
                  {allAvailableTags.length === 0 && selectedNewContactTags.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">No tags created yet. Add one below.</span>
                  ) : (
                    Array.from(new Set([...allAvailableTags, ...selectedNewContactTags])).map((t) => {
                      const isSelected = selectedNewContactTags.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedNewContactTags(selectedNewContactTags.filter((tag) => tag !== t));
                            } else {
                              setSelectedNewContactTags([...selectedNewContactTags, t]);
                            }
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs border ${
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                              : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600"
                          }`}
                        >
                          <span>🏷️ {t}</span>
                          {isSelected && <Check size={12} className="stroke-[3]" />}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Optional + Create New Tag inline */}
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newCustomTagText}
                    onChange={(e) => setNewCustomTagText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newCustomTagText.trim()) {
                          const clean = newCustomTagText.trim();
                          if (!selectedNewContactTags.includes(clean)) {
                            setSelectedNewContactTags([...selectedNewContactTags, clean]);
                          }
                          if (!allAvailableTags.includes(clean)) {
                            setAllAvailableTags([...allAvailableTags, clean]);
                          }
                          setNewCustomTagText("");
                        }
                      }
                    }}
                    placeholder="Create a new tag..."
                    className="flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newCustomTagText.trim()) {
                        const clean = newCustomTagText.trim();
                        if (!selectedNewContactTags.includes(clean)) {
                          setSelectedNewContactTags([...selectedNewContactTags, clean]);
                        }
                        if (!allAvailableTags.includes(clean)) {
                          setAllAvailableTags([...allAvailableTags, clean]);
                        }
                        setNewCustomTagText("");
                      }
                    }}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 hover:bg-indigo-50 hover:text-indigo-600 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg border border-gray-200 dark:border-slate-600 transition"
                  >
                    + Add Tag
                  </button>
                </div>
              </div>

              {isCrmConnected && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-indigo-950 dark:text-indigo-300">
                      Push to CRM Immediately
                    </div>
                    <div className="text-[11px] text-indigo-700 dark:text-indigo-400">
                      Set CRM Status to DONE and sync to webhook.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={newPushToCrm}
                    onChange={(e) => setNewPushToCrm(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer accent-indigo-600"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingContact}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition flex items-center gap-2"
                >
                  {savingContact ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                  {savingContact ? "Saving..." : "Create Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manage Tags */}
      {tagModalContact && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-base flex items-center gap-2">
                  <Tag size={16} className="text-indigo-600" />
                  Manage Tags
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Contact: {tagModalContact.name}</p>
              </div>
              <button
                onClick={() => setTagModalContact(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Active Tags */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase">
                  Applied Tags
                </label>
                <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
                  {editTagsList.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">No tags applied yet.</span>
                  ) : (
                    editTagsList.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 rounded-lg text-xs font-bold"
                      >
                        🏷️ {t}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="hover:text-red-500 transition"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Add Custom Tag */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">
                  Add Tag
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomTag();
                      }
                    }}
                    placeholder="Type tag name and press Enter..."
                    className="flex-1 px-3.5 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className="px-4 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Quick Suggest Tags */}
              {allAvailableTags.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    Quick Suggestions:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {allAvailableTags
                      .filter((t) => !editTagsList.includes(t))
                      .slice(0, 8)
                      .map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setEditTagsList([...editTagsList, t])}
                          className="px-2 py-1 bg-gray-100 dark:bg-slate-700 hover:bg-indigo-50 text-gray-600 dark:text-gray-300 text-[11px] font-semibold rounded-md transition"
                        >
                          + {t}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTagModalContact(null)}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTags}
                  disabled={savingTags}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition flex items-center gap-2"
                >
                  {savingTags ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  {savingTags ? "Saving..." : "Save Tags"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
