{activeSubTab === 'inbox' && (
        <div className="relative flex-1 min-h-0 lg:grid lg:grid-cols-12 lg:gap-6 lg:p-6">
          {/* LEFT PANE: CHAT LIST - full height on mobile, grid col on desktop */}
          <div className={`lg:col-span-3 bg-slate-900/90 lg:rounded-2xl border-r lg:border border-slate-800 flex flex-col overflow-hidden shadow-xl h-full ${selectedChat ? 'hidden lg:flex' : 'flex'}`}>
            {/* SEARCH BOX & COLLAPSIBLE FILTER BUTTON */}
            <div className="p-2.5 border-b border-slate-800 bg-slate-950/40 space-y-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search phone, name or message..."
                    value={inboxSearch}
                    onChange={(e) => setInboxSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowChatFilters(p => !p)}
                  className={`px-2.5 py-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    showChatFilters || chatStatusFilter !== 'open' || orderStatusFilter !== 'all'
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                  }`}
                  title="Toggle Filters"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Filters</span>
                  {(chatStatusFilter !== 'open' || orderStatusFilter !== 'all') && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => fetchChats(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 border border-slate-800 transition-colors shrink-0"
                  title="Refresh chats"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingChats ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* COLLAPSIBLE FILTERS MENU */}
              {showChatFilters && (
                <div className="pt-2 space-y-2 border-t border-slate-800/80 animate-[fadeIn_0.15s_ease]">
                  {/* Chat Status Filter Pills */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setChatStatusFilter('open')}
                      className={`py-1 rounded-md transition-all flex items-center justify-center gap-1 ${
                        chatStatusFilter === 'open'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>Open ({openChatsCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChatStatusFilter('closed')}
                      className={`py-1 rounded-md transition-all flex items-center justify-center gap-1 ${
                        chatStatusFilter === 'closed'
                          ? 'bg-slate-700 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>Closed ({closedChatsCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChatStatusFilter('all')}
                      className={`py-1 rounded-md transition-all flex items-center justify-center gap-1 ${
                        chatStatusFilter === 'all'
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>All ({chats.length})</span>
                    </button>
                  </div>

                  {/* Row 2: Order Shipment Status Filters */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setOrderStatusFilter('all')}
                      className={`px-2 py-1 rounded-md transition-all whitespace-nowrap ${
                        orderStatusFilter === 'all'
                          ? 'bg-slate-700 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      🛍️ All
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderStatusFilter('in_transit')}
                      className={`px-2 py-1 rounded-md transition-all whitespace-nowrap ${
                        orderStatusFilter === 'in_transit'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-900 text-blue-400 hover:text-blue-300 border border-slate-800'
                      }`}
                    >
                      🚚 Transit ({transitCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderStatusFilter('out_for_delivery')}
                      className={`px-2 py-1 rounded-md transition-all whitespace-nowrap ${
                        orderStatusFilter === 'out_for_delivery'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-slate-900 text-amber-400 hover:text-amber-300 border border-slate-800'
                      }`}
                    >
                      🛵 Out ({outForDeliveryCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderStatusFilter('delivered')}
                      className={`px-2 py-1 rounded-md transition-all whitespace-nowrap ${
                        orderStatusFilter === 'delivered'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-900 text-emerald-400 hover:text-emerald-300 border border-slate-800'
                      }`}
                    >
                      📦 Delivered ({deliveredCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderStatusFilter('cancelled')}
                      className={`px-2 py-1 rounded-md transition-all whitespace-nowrap ${
                        orderStatusFilter === 'cancelled'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-slate-900 text-rose-400 hover:text-rose-300 border border-slate-800'
                      }`}
                    >
                      ❌ Cancelled ({cancelledCount})
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* CHAT LIST */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {filteredChats.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No WhatsApp conversations found
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const isSelected = selectedChat?.phone === chat.phone;
                  return (
                    <div
                      key={chat.phone}
                      onClick={() => setSelectedChat(chat)}
                      className={`p-4 cursor-pointer transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-emerald-500/10 border-l-4 border-emerald-500'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                            <div className="flex flex-col text-left min-w-0 truncate">
                              <span className="font-bold text-sm text-white truncate">
                                {chat.customer_name || formatPhone(chat.phone)}
                              </span>
                              {chat.customer_name && (
                                <span className="text-[10px] text-slate-400 font-normal truncate">
                                  {formatPhone(chat.phone)}
                                </span>
                              )}
                              {chat.tags && chat.tags.length > 0 && (
                                <div className="flex gap-1 mt-0.5 flex-wrap">
                                  {chat.tags.map(t => (
                                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap font-bold">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            {chat.has_order && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleOpenCustomerOrders(chat.phone); }}
                                className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                                title="Click to view Customer Orders"
                              >
                                <ShoppingBag className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span className="hidden sm:inline">Orders</span>
                                {chat.order_count ? <span>({chat.order_count})</span> : null}
                              </button>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 whitespace-nowrap">
                            {new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate mb-2">
                          {chat.last_role === 'assistant' ? '🤖: ' : '👤: '}
                          {chat.last_message}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {chat.is_within_24h ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="24-hour window open">
                              <Unlock className="w-3 h-3 shrink-0" />
                              <span className="hidden sm:inline">24h Open</span>
                              <span className="sm:hidden">24h</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20" title={`24-hour customer service window has expired (${chat.hours_elapsed}h elapsed)`}>
                              <Lock className="w-3 h-3 shrink-0" />
                              <span className="hidden sm:inline">Window Closed ({chat.hours_elapsed}h)</span>
                              <span className="sm:hidden">{chat.hours_elapsed}h</span>
                            </span>
                          )}
                          {chat.chat_status === 'closed' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                              ✓ <span className="hidden sm:inline">Solved</span>
                            </span>
                          )}
                          {chat.chat_status === 'urgent' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_8px_rgba(225,29,72,0.3)] animate-pulse">
                              🚨 <span className="hidden sm:inline">Urgent</span>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleAI(chat.phone, !chat.ai_paused);
                            }}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all cursor-pointer ${
                              chat.ai_paused
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                            }`}
                            title={chat.ai_paused ? "AI auto-reply is currently PAUSED. Click to enable AI." : "AI is automatically replying. Click to pause AI."}
                          >
                            {chat.ai_paused ? (
                              <>
                                <Pause className="w-3 h-3 text-rose-400 shrink-0" />
                                <span className="hidden sm:inline">AI Paused</span>
                              </>
                            ) : (
                              <>
                                <Bot className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span className="hidden sm:inline">AI Active</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOutboundCall({ phone: chat.phone, customerName: chat.customer_name || '' });
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-700 transition-colors ml-auto"
                            title={`WhatsApp Call ${formatPhone(chat.phone)}`}
                          >
                            <Phone className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANE: ACTIVE CHAT THREAD */}
          <div className={`lg:col-span-6 bg-slate-900/90 lg:rounded-2xl border-l lg:border border-slate-800 flex flex-col overflow-hidden shadow-xl h-full ${!selectedChat ? 'hidden lg:flex' : 'flex'}`}>
            {selectedChat ? (
              <>
                {/* ACTIVE CHAT HEADER (COMPACT ON MOBILE: ICONS ONLY TO SAVE SPACE) */}
                <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2 shrink-0">
                  {/* LEFT: BACK BUTTON + CUSTOMER NAME */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setSelectedChat(null)}
                      className="lg:hidden p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
                      title="Back to Customer List"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="flex flex-col min-w-0">
                      <h4
                        onClick={() => handleOpenCustomerOrders(selectedChat.phone)}
                        className="font-bold text-white text-sm sm:text-base truncate hover:text-emerald-400 transition-colors cursor-pointer"
                        title="Click customer name to view Shopify Orders"
                      >
                        {selectedChat.customer_name ? `${selectedChat.customer_name} (${formatPhone(selectedChat.phone)})` : formatPhone(selectedChat.phone)}
                      </h4>
                      {selectedChat.tags && selectedChat.tags.length > 0 && (
                        <div className="flex gap-1 mt-0.5">
                          {selectedChat.tags.map(t => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap font-bold">
                              🏷️ {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: ICON BUTTONS ON MOBILE, ICON+TEXT ON DESKTOP */}
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 relative">
                    {/* 1. Orders Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenCustomerOrders(selectedChat.phone)}
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition-all shrink-0 shadow-sm"
                      title="View Customer Shopify Orders"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="hidden sm:inline">Orders</span>
                    </button>

                    {/* 2. Call Customer Button */}
                    <button
                      onClick={() => setOutboundCall({ phone: selectedChat.phone, customerName: selectedChat.customer_name || '' })}
                      className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-all shrink-0"
                      title="WhatsApp Call Customer (via API)"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>

                    {/* 3. Clickable 24H Lock pill with popup */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowLockInfo(v => !v)}
                        className={`inline-flex items-center gap-1 px-2 py-1.5 sm:py-1 rounded-lg text-xs font-bold border cursor-pointer transition-all shrink-0 ${
                          status24h.isOpen
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900'
                            : 'bg-rose-950/80 text-rose-300 border-rose-500/40 hover:bg-rose-900'
                        }`}
                        title="24H Window Status"
                      >
                        {status24h.isOpen ? (
                          <Unlock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        )}
                        <span className="hidden sm:inline">{status24h.isOpen ? '24H Open' : '24H Closed'}</span>
                      </button>

                      {/* Time-remaining popup */}
                      {showLockInfo && (
                        <div
                          className="absolute top-8 right-0 z-50 w-64 bg-[#1a2733] border border-slate-700 rounded-xl shadow-2xl p-3 text-xs"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-white text-[11px] uppercase tracking-wider">24-Hour Window</span>
                            <button onClick={() => setShowLockInfo(false)} className="text-slate-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>
                          </div>
                          <div className={`flex items-start gap-2 p-2 rounded-lg ${status24h.isOpen ? 'bg-emerald-950/60 border border-emerald-500/20' : 'bg-rose-950/60 border border-rose-500/20'}`}>
                            {status24h.isOpen ? (
                              <Unlock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            )}
                            <p className={`leading-relaxed ${status24h.isOpen ? 'text-emerald-200' : 'text-rose-200'}`}>
                              {status24h.text}
                            </p>
                          </div>
                          {!status24h.isOpen && (
                            <p className="mt-2 text-slate-400 leading-relaxed">
                              Window re-opens automatically when the customer sends a new message.
                            </p>
                          )}
                        </div>
                      )}
                    </div>{/* end relative wrapper */}

                    {/* 4. Mark Solved / Close Chat OR Reopen Chat toggle */}
                    {selectedChat.chat_status === 'closed' ? (
                      <button
                        type="button"
                        onClick={() => handleSetChatStatus(selectedChat, 'open')}
                        className="inline-flex items-center gap-1 px-2 py-1.5 sm:py-1 rounded-lg text-xs font-bold border bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900 transition-all cursor-pointer shadow-md shrink-0"
                        title="Re-open this chat into your active inbox"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="hidden sm:inline">Reopen</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetChatStatus(selectedChat, 'closed')}
                        className="inline-flex items-center gap-1 px-2 py-1.5 sm:py-1 rounded-lg text-xs font-bold border bg-amber-950/80 text-amber-300 border-amber-500/40 hover:bg-amber-900 transition-all cursor-pointer shadow-md shrink-0"
                        title="Mark customer query solved & close chat"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="hidden sm:inline">Close</span>
                      </button>
                    )}

                    {/* 5. AI auto-reply toggle */}
                    <button
                      onClick={() => handleToggleAIPause(selectedChat)}
                      className={`inline-flex items-center gap-1 px-2 py-1.5 sm:py-1 rounded-lg font-bold text-xs transition-all shadow-md shrink-0 ${
                        selectedChat.ai_paused
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white'
                      }`}
                      title={selectedChat.ai_paused ? "AI is Paused (Click to Resume)" : "AI is Active (Click to Pause)"}
                    >
                      {selectedChat.ai_paused ? (
                        <>
                          <Pause className="w-3.5 h-3.5 shrink-0" />
                          <span className="hidden sm:inline">AI PAUSED</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-3.5 h-3.5 shrink-0" />
                          <span className="hidden sm:inline">AI ACTIVE</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* WHATSAPP-STYLE MESSAGE BUBBLES AREA (SMOOTH BOTTOM ANCHOR) */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#0b141a]">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                      <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                      Loading WhatsApp history...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-slate-500 text-xs py-12">
                      No message history found
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isAI = msg.role === 'assistant';
                      const isInternalNote = msg.role === 'internal_note';
                      const isOutgoing = isAI || isInternalNote;
                      
                      // WhatsApp-style tick status for AI/manual messages
                      const getMsgStatus = () => {
                        if (msg._sending) return 'sending'; // clock icon, grey
                        if (isInternalNote) return 'sent'; // notes don't get read receipts
                        // Did any user message come AFTER this one?
                        const userRepliedAfter = messages.slice(i + 1).some(m => m.role === 'user');
                        if (userRepliedAfter) return 'read';        // 2 blue ticks
                        if (i === messages.length - 1) return 'sent'; // 1 grey tick (newest)
                        return 'delivered';                           // 2 grey ticks
                      };
                      const msgStatus = isOutgoing ? getMsgStatus() : null;
                      return (
                        <div
                          key={msg.id || i}
                          className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[92%] sm:max-w-[78%] rounded-xl px-3.5 py-2.5 shadow-md relative ${
                              isAI
                                ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                                : isInternalNote
                                ? 'bg-amber-900/60 border border-amber-500/50 text-amber-200 rounded-tr-none'
                                : 'bg-[#202c33] text-[#e9edef] rounded-tl-none border border-[#2a3942]'
                            } ${msg._sending ? 'opacity-70' : ''}`}
                          >
                            <div className="flex items-center justify-between gap-4 mb-1">
                              <span className={`text-[10px] font-bold opacity-75 uppercase ${isInternalNote ? 'text-amber-400' : 'text-emerald-300'}`}>
                                {isInternalNote ? '🔒 Private Note (Invisible to Customer)' : isAI ? '🤖 11FIT Assistant / Manual' : `👤 ${formatPhone(msg.phone)}`}
                              </span>
                            </div>
                            <div className="my-0.5">
                              {renderMessageContent(msg.content)}
                            </div>
                            <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                              <span className="text-[10px]">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {/* WhatsApp-style ticks */}
                              {msgStatus === 'sending' && (
                                <Clock className="w-3 h-3 text-slate-400 animate-pulse" title="Sending..." />
                              )}
                              {msgStatus === 'sent' && (
                                <Check className="w-3.5 h-3.5 text-slate-400" title="Sent" />
                              )}
                              {msgStatus === 'delivered' && (
                                <CheckCheck className="w-3.5 h-3.5 text-slate-400" title="Delivered" />
                              )}
                              {msgStatus === 'read' && (
                                <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" title="Read" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* MEDIA CAPTURE PREVIEW BANNER (IF PHOTO OR AUDIO WAS CAPTURED) */}
                {mediaPreviewBase64 && (
                  <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {mediaPreviewType === 'image' ? (
                        <img src={mediaPreviewBase64} alt="Captured" className="w-12 h-12 rounded-lg object-cover border border-emerald-500" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                          🎙️ MP3
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-emerald-400">
                          {mediaPreviewType === 'image' ? '📸 Photo Ready to Send' : '🎙️ Voice Note Ready to Send'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Will upload directly to WhatsApp Meta Media API
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setMediaPreviewBase64(null); setMediaPreviewType(null); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* MANUAL REPLY SENDER BAR WITH DIRECT CAMERA & VOICE RECORDER */}
                <form onSubmit={handleSendManualReply} className="p-3 border-t border-slate-800 bg-[#202c33] space-y-2 shrink-0">
                  {/* MEDIA CONTROLS BAR (PHOTO & AUDIO RECORDER) */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => { setReplyType('text'); setMediaPreviewBase64(null); }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          replyType === 'text' && !mediaPreviewBase64
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Text
                      </button>

                      {/* CAMERA OR PHOTO LIBRARY INPUT */}
                      <label className="cursor-pointer px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all">
                        <Camera className="w-3.5 h-3.5 text-emerald-400" />
                        Camera / Gallery
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />
                      </label>

                      {/* VOICE / MICROPHONE RECORDER BUTTON */}
                      {isRecording ? (
                        <button
                          type="button"
                          onClick={stopAudioRecord}
                          className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 animate-pulse"
                        >
                          <StopCircle className="w-3.5 h-3.5" />
                          Stop Recording...
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={startAudioRecord}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <Mic className="w-3.5 h-3.5 text-emerald-400" />
                          Record Voice Note
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => { setReplyType('template'); setMediaPreviewBase64(null); }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          replyType === 'template'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Template
                      </button>
                      
                      {/* PRIVATE NOTE TOGGLE */}
                      <div className="h-6 w-[1px] bg-slate-700 mx-1"></div>
                      <button
                        type="button"
                        onClick={() => setIsPrivateNote(prev => !prev)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
                          isPrivateNote
                            ? 'bg-amber-600/30 text-amber-400 border border-amber-500/50'
                            : 'bg-slate-800 text-slate-400 hover:text-white border border-transparent'
                        }`}
                        title="Toggle Private Note Mode"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Private Note
                      </button>
                    </div>
                  </div>

                  {/* LOCKED WINDOW OVERLAY — when 24h window is closed */}
                  {!status24h.isOpen && !mediaPreviewBase64 && (
                    <div className="mx-4 mb-3 rounded-xl bg-rose-950/60 border border-rose-500/50 shadow-lg flex items-center gap-3 px-4 py-3">
                      <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                        <Lock className="w-5 h-5 text-rose-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-rose-300 tracking-wide uppercase">24-Hour Window Closed</p>
                        <p className="text-[11px] text-rose-400/80 mt-0.5 leading-snug">Text & media replies are disabled by Meta. Wait for the customer to reply, or use a <span className="font-bold text-rose-300">Template</span> to re-engage.</p>
                      </div>
                    </div>
                  )}

                  {/* INPUT FIELDS BASED ON TYPE */}
                  {replyType === 'template' ? (
                    <div className="space-y-2">
                      {/* Template Selector */}
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedTemplate}
                          onChange={(e) => setSelectedTemplate(e.target.value)}
                          className="flex-1 bg-[#0b141a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        >
                          {templatesList.map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          disabled={sendingReply}
                          className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 shrink-0"
                        >
                          {sendingReply
                            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            : <Send className="w-3.5 h-3.5" />}
                          Send
                        </button>
                      </div>
                      {/* Variable Preview — auto-filled from customer context */}
                      {(() => {
                        const tpl = templatesList.find(t => t.id === selectedTemplate);
                        
                        // Smartly extract the active chat's orders
                        const customerOrders = (elevenFitData?.orders || []).filter(o => {
                          const cp = String(o.customer?.phone || o.shipping_address?.phone || '').replace(/\D/g,'').slice(-10);
                          const sp = String(selectedChat?.phone || '').replace(/\D/g,'').slice(-10);
                          return cp === sp;
                        }).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

                        const customerCarts = (elevenFitData?.abandonedCarts || []).filter(c => {
                          const cp = String(c.phone || c.customer_phone || '').replace(/\D/g,'').slice(-10);
                          const sp = String(selectedChat?.phone || '').replace(/\D/g,'').slice(-10);
                          return cp === sp;
                        }) || [];
                        const params = tpl ? getAutoParams(selectedTemplate, selectedChat, customerOrders, customerCarts) : [];
                        if (!tpl || params.length === 0) return null;
                        return (
                          <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-2.5 space-y-1">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Auto-filled Variables</p>
                            {tpl.params.map((label, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 w-28 shrink-0">{`{{${i+1}}} ${label}:`}</span>
                                <span className={`text-[11px] font-medium truncate ${params[i] ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {params[i] || '— not found'}
                                </span>
                              </div>
                            ))}
                            {selectedTemplate === 'abandoned_cart_v4' && customerCarts.length > 1 && (
                              <p className="text-[10px] text-amber-400 mt-1">⚠️ {customerCarts.length} carts found — using most recent</p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {/* ZERO-COST SMART SUGGESTIONS / ON-DEMAND AI SUGGESTER */}
                      {!isPrivateNote && replyType === 'text' && status24h.isOpen && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                          <div className="flex items-center gap-1 px-2 py-1 bg-fuchsia-500/10 text-fuchsia-400 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 border border-fuchsia-500/20">
                            <Bot className="w-3 h-3" /> Co-Pilot
                          </div>
                          
                          {aiSuggestions.length > 0 ? (
                            <>
                              {aiSuggestions.map((sug, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setReplyText(sug)}
                                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> {sug.length > 30 ? sug.substring(0, 30) + '...' : sug}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => setAiSuggestions([])}
                                className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-full text-[10px] font-bold transition-colors shrink-0"
                              >
                                Clear
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={handleGenerateSuggestions}
                              disabled={isGeneratingSuggestions}
                              className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                            >
                              {isGeneratingSuggestions ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                              {isGeneratingSuggestions ? 'Reading chat...' : '💡 Suggest Replies'}
                            </button>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 relative w-full">
                        <input
                          type="text"
                          placeholder={
                            !status24h.isOpen && !isPrivateNote
                              ? '🔒 Locked — customer must message first to reopen'
                              : isPrivateNote
                              ? '🔒 Type a private internal note (invisible to customer)...'
                              : mediaPreviewType === 'image'
                              ? 'Photo caption (optional)...'
                              : mediaPreviewType === 'audio'
                              ? 'Ready to send audio message...'
                              : 'Type manual WhatsApp reply...'
                          }
                          value={replyText}
                          onChange={(e) => {
                            setReplyText(e.target.value);
                          }}
                          disabled={!status24h.isOpen && !mediaPreviewBase64 && !isPrivateNote}
                          className={`flex-1 bg-[#0b141a] border rounded-xl pl-4 pr-2 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                            !status24h.isOpen && !mediaPreviewBase64 && !isPrivateNote
                              ? 'border-rose-700/50 opacity-50 cursor-not-allowed'
                              : isPrivateNote
                              ? 'border-amber-500/50 focus:border-amber-400 bg-amber-950/20'
                              : 'border-slate-700 focus:border-emerald-500'
                          }`}
                        />
                        
                        {!isPrivateNote && replyType === 'text' && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={handleRewrite}
                              disabled={!replyText || isRewriting}
                              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white border border-indigo-500 rounded-lg px-2.5 py-2 text-xs font-bold transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 h-full"
                              title="Rewrite professionally with AI"
                            >
                              {isRewriting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                              <span className="hidden xl:inline">Rewrite</span>
                            </button>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  if (e.target.value === 'ADD_NEW') {
                                    setShowQuickRepliesModal(true);
                                    e.target.value = '';
                                  } else {
                                    setReplyText(e.target.value);
                                    e.target.value = ''; // Reset selector
                                  }
                                }
                              }}
                              className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg px-2.5 py-2 text-xs font-bold appearance-none cursor-pointer focus:outline-none focus:border-emerald-500 transition-colors w-[100px] sm:w-[120px] h-full"
                              title="Insert Quick Reply"
                            >
                              <option value="">⚡ Quick</option>
                              {cannedResponses.map((r, i) => (
                                <option key={i} value={r.text}>{r.label}</option>
                              ))}
                              <option value="ADD_NEW">+ Add New...</option>
                            </select>
                          </div>
                        )}
                        
                        <button
                          type="submit"
                          disabled={sendingReply || (!status24h.isOpen && !mediaPreviewBase64 && replyType === 'text' && !isPrivateNote)}
                          className={`px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shrink-0 disabled:opacity-50 transition-colors h-full ${
                            isPrivateNote ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                          }`}
                        >
                        {sendingReply
                          ? <RefreshCw className="w-4 h-4 animate-spin" />
                          : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  )}
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <MessageSquare className="w-12 h-12 mb-3 text-slate-700" />
                <h4 className="text-sm font-bold text-slate-400">No Chat Selected</h4>
                <p className="text-xs text-slate-600 max-w-sm mt-1">
                  Select a customer conversation from the list to view chat history, call directly, or take over manually.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT PANE: PERSISTENT CUSTOMER PROFILE (Col 3) */}
          <div className={`lg:col-span-3 bg-slate-900/90 lg:rounded-2xl border-l lg:border border-slate-800 flex flex-col overflow-hidden shadow-xl h-full hidden lg:flex`}>
            {selectedChat ? (
              <div className="flex flex-col h-full bg-[#080e1a]">
                <div className="p-4 border-b border-slate-800/80 bg-[#111c30]">
                  <h3 className="font-extrabold text-white text-base">Customer Profile</h3>
                  <p className="text-xs font-mono text-emerald-400 mt-1">{formatPhone(selectedChat.phone)}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Quick Tags Section */}
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3">
                    <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5"><Tags className="w-3.5 h-3.5" /> AI Tags</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedChat.tags || []).length > 0 ? selectedChat.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-700 text-slate-300">{t}</span>
                      )) : <span className="text-xs text-slate-500 italic">No tags assigned</span>}
                    </div>
                  </div>
                  
                  {/* Notes / Context */}
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3">
                    <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Contact Name</h4>
                    <p className="text-sm font-semibold text-white">{selectedChat.customer_name || 'Unknown'}</p>
                  </div>
                  
                  <button 
                    onClick={() => handleOpenCustomerOrders(selectedChat.phone)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" /> View Shopify Orders
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <p className="text-xs text-slate-600">Select a chat to view profile</p>
              </div>
            )}
          </div>
        </div>
      )}