import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessageAction } from "@/app/actions/whatsAppPlatformActions";

/**
 * WhatsApp Chatbot Flow Engine
 * Executes workflows created by the React Flow Builder
 */

// Interpolate {{variable}} placeholders with values
function interpolate(str: string, vars: Record<string, string>) {
  if (!str) return '';
  let s = str;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replace(new RegExp(`{{${k}}}`, 'g'), v || '');
  }
  return s;
}

// Dispatch a single flow node as a WhatsApp message
async function dispatchNode(toPhone: string, node: any, vars: Record<string, string>, conversationId?: string) {
  const inter = (s: string) => interpolate(s, vars);
  const type = (node.type || '').toUpperCase();

  try {
    const creds = await getCreds();
    if (!creds) return;

    const url = `https://graph.facebook.com/v20.0/${creds.phoneId}/messages`;
    const headers = { 'Authorization': `Bearer ${creds.token}`, 'Content-Type': 'application/json' };
    let payload: any = { messaging_product: 'whatsapp', recipient_type: 'individual', to: toPhone };

    let resolvedConvId = conversationId;
    if (!resolvedConvId) {
      const cleanPhone = toPhone.replace(/\D/g, '').slice(-10);
      const conv = await prisma.whatsAppConversation.findFirst({
        where: { customer: { OR: [{ mobile: { contains: cleanPhone } }, { whatsappNumber: { contains: cleanPhone } }] } },
        orderBy: { updatedAt: 'desc' }
      });
      if (conv) resolvedConvId = conv.id;
    }

    if (type === 'TEXT' || type === 'START' || type === 'TRIGGER') {
      if (!node.text) return; // Skip if no text
      payload.type = 'text';
      payload.text = { body: inter(node.text) };

    } else if (type === 'END' || type === 'LINK') {
      if (!node.text) return;
      const bodyText = inter(node.text);
      if (node.buttonText && node.url) {
        payload.type = 'interactive';
        payload.interactive = {
          type: 'cta_url',
          body: { text: bodyText },
          action: {
            name: 'cta_url',
            parameters: {
              display_text: String(inter(node.buttonText)).slice(0, 20),
              url: inter(node.url)
            }
          }
        };
      } else {
        payload.type = 'text';
        payload.text = { body: bodyText };
      }

    } else if (type === 'IMAGE') {
      payload.type = 'image';
      payload.image = { link: inter(node.imageUrl || '') };
      if (node.text) payload.image.caption = inter(node.text);

    } else if (type === 'VIDEO') {
      payload.type = 'video';
      payload.video = { link: inter(node.videoUrl || '') };
      if (node.text) payload.video.caption = inter(node.text);

    } else if (type === 'DOCUMENT') {
      payload.type = 'document';
      payload.document = { link: inter(node.docUrl || ''), filename: node.fileName || 'Document' };

    } else if (type === 'CHOICE' || type === 'BUTTONS' || type === 'LIST_MENU') {
      const choices = node.choices || [];
      if (choices.length === 0) return;
      
      payload.type = 'interactive';
      
      if (choices.length <= 3) {
        // Use Buttons
        payload.interactive = {
          type: 'button',
          body: { text: inter(node.text || 'Please select an option:') },
          action: {
            buttons: choices.map((c: any) => ({
              type: 'reply',
              reply: { id: `flow_btn_${node.id}_${c.id}`, title: String(c.text).slice(0, 20) }
            }))
          }
        };
        if (node.imageUrl) {
          payload.interactive.header = {
            type: 'image',
            image: { link: inter(node.imageUrl) }
          };
        }
      } else {
        // Use List
        payload.interactive = {
          type: 'list',
          header: { type: 'text', text: String(node.title || 'Options').slice(0, 60) },
          body: { text: inter(node.text || 'Please choose:') },
          action: {
            button: 'Menu',
            sections: [{ title: 'Options', rows: choices.map((c: any) => ({ id: `flow_list_${node.id}_${c.id}`, title: String(c.text).slice(0, 24) })) }]
          }
        };
      }

    } else if (type === 'CATALOG') {
      // Dynamic Catalog Dispatch
      const category = node.categoryName;
      const products = await prisma.product.findMany({
        where: {
          status: "Active",
          ...(category ? { category } : {})
        },
        take: 3 // Max 3 items
      });
      
      if (products.length === 0) {
        payload.type = 'text';
        payload.text = { body: "Sorry, no products available in this category." };
        await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
        return;
      }
      
      // Dispatch introductory text first
      const introPayload = { ...payload, type: 'text', text: { body: inter(node.text || "Here are our products:") } };
      const introRes = await fetch(url, { method: 'POST', headers, body: JSON.stringify(introPayload) });
      const introData = await introRes.json().catch(() => ({}));
      
      if (introRes.ok && resolvedConvId) {
        await prisma.whatsAppMessage.create({
          data: {
            conversationId: resolvedConvId,
            senderType: 'BOT',
            senderName: 'Chatbot',
            messageType: 'TEXT',
            content: inter(node.text || "Here are our products:"),
            status: 'SENT',
            metaMessageId: introData?.messages?.[0]?.id || null,
            sentAt: new Date()
          }
        });
      }

      // Dispatch up to 3 images
      for (const p of products) {
        if (p.images && p.images.length > 0) {
          const pPayload = {
             messaging_product: 'whatsapp', recipient_type: 'individual', to: toPhone,
             type: 'image',
             image: { 
               link: p.images[0],
               caption: `${p.name} - ₹${p.sellingPrice}`
             }
          };
          const pRes = await fetch(url, { method: 'POST', headers, body: JSON.stringify(pPayload) });
          const pData = await pRes.json().catch(() => ({}));
          if (pRes.ok && resolvedConvId) {
            await prisma.whatsAppMessage.create({
              data: {
                conversationId: resolvedConvId,
                senderType: 'BOT',
                senderName: 'Chatbot',
                messageType: 'IMAGE',
                content: `${p.name} - ₹${p.sellingPrice}`,
                mediaUrl: p.images[0],
                status: 'SENT',
                metaMessageId: pData?.messages?.[0]?.id || null,
                sentAt: new Date()
              }
            });
          }
        } else {
          const pPayload = {
             messaging_product: 'whatsapp', recipient_type: 'individual', to: toPhone,
             type: 'text',
             text: { body: `${p.name} - ₹${p.sellingPrice}` }
          };
          const pRes = await fetch(url, { method: 'POST', headers, body: JSON.stringify(pPayload) });
          const pData = await pRes.json().catch(() => ({}));
          if (pRes.ok && resolvedConvId) {
            await prisma.whatsAppMessage.create({
              data: {
                conversationId: resolvedConvId,
                senderType: 'BOT',
                senderName: 'Chatbot',
                messageType: 'TEXT',
                content: `${p.name} - ₹${p.sellingPrice}`,
                status: 'SENT',
                metaMessageId: pData?.messages?.[0]?.id || null,
                sentAt: new Date()
              }
            });
          }
        }
      }

      if (resolvedConvId) {
        await prisma.whatsAppConversation.update({
          where: { id: resolvedConvId },
          data: {
            lastMessageText: 'Products Catalog Sent',
            lastMessageAt: new Date()
          }
        });
      }
      return; // Handled

    } else if (type === 'DELAY') {
      const ms = Math.min((parseInt(node.seconds) || 1) * 1000, 4000);
      await new Promise(r => setTimeout(r, ms));
      return; 

    } else {
      return; // Logic node, nothing to dispatch
    }

    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
    const responseData = await response.json().catch(() => ({}));
    const wasSuccess = response.ok;
    const metaMessageId = responseData?.messages?.[0]?.id || null;
    if (wasSuccess && resolvedConvId) {
      let textToSend = '';
      let mType = 'TEXT';
      let mediaUrlVal: string | null = null;
      let metaJsonStr: string | null = null;

      if (type === 'TEXT' || type === 'START' || type === 'TRIGGER' || type === 'END' || type === 'LINK') {
        textToSend = inter(node.text || '');
        if (node.buttonText && node.url) {
          textToSend += `\n\n🔗 *${inter(node.buttonText)}*: ${inter(node.url)}`;
        }
        mType = 'TEXT';
      } else if (type === 'IMAGE') {
        textToSend = inter(node.caption || node.text || '');
        mType = 'IMAGE';
        mediaUrlVal = inter(node.imageUrl || '');
      } else if (type === 'VIDEO') {
        textToSend = inter(node.caption || node.text || '');
        mType = 'VIDEO';
        mediaUrlVal = inter(node.videoUrl || '');
      } else if (type === 'DOCUMENT') {
        textToSend = inter(node.fileName || '');
        mType = 'DOCUMENT';
        mediaUrlVal = inter(node.docUrl || '');
      } else if (type === 'CHOICE' || type === 'BUTTONS' || type === 'LIST_MENU') {
        const choices = node.choices || [];
        textToSend = inter(node.text || 'Please select an option:');
        mType = choices.length <= 3 ? 'BUTTONS' : 'LIST';
        if (node.imageUrl) {
          mediaUrlVal = inter(node.imageUrl);
        }
        metaJsonStr = JSON.stringify(choices.map((c: any) => c.text));
      }

      if (textToSend || mediaUrlVal) {
        await prisma.whatsAppMessage.create({
          data: {
            conversationId: resolvedConvId,
            senderType: 'BOT',
            senderName: 'Chatbot',
            messageType: mType,
            content: textToSend,
            mediaUrl: mediaUrlVal,
            metadata: metaJsonStr,
            status: 'SENT',
            metaMessageId,
            sentAt: new Date()
          }
        });

        await prisma.whatsAppConversation.update({
          where: { id: resolvedConvId },
          data: {
            lastMessageText: textToSend || 'Interactive Message',
            lastMessageAt: new Date()
          }
        });
      }
    }
  } catch (e: any) {
    console.error(`[Flow Engine] Dispatch error for node ${node.id}:`, e.message);
  }
}

// Get Meta API credentials from DB
async function getCreds() {
  const account = await prisma.whatsAppAccount.findFirst({
    where: { accessToken: { not: null } }
  });
  if (!account?.accessToken || !account?.phoneId) return null;
  return { token: account.accessToken, phoneId: account.phoneId };
}

// Run nodes sequentially until a pause point or end
async function runNodes(nodes: any[], startNodeId: string, vars: Record<string, string>, toPhone: string, conversationId?: string, wasClosed: boolean = false) {
  let nextNodeId: string | null = startNodeId;

  while (nextNodeId) {
    const node = nodes.find((n: any) => n.id === nextNodeId);
    if (!node) break;

    await dispatchNode(toPhone, node, vars, conversationId);

    const type = (node.type || '').toUpperCase();

    // CRM Logic
    if (type === 'CRM_CONTACT' || type === 'CRM_LEAD') {
        try {
          const cleanPhone = toPhone.replace(/\D/g, '').slice(-10);
          console.log(`[CRM Node] toPhone="${toPhone}" cleanPhone="${cleanPhone}" node.tags="${node.tags}"`);
          let conv = conversationId 
            ? await prisma.whatsAppConversation.findUnique({ where: { id: conversationId }, include: { customer: true } })
            : null;
          let customer = conv?.customer;

          if (!customer) {
            customer = await prisma.customer.findFirst({
              where: { OR: [{ mobile: { contains: cleanPhone } }, { whatsappNumber: { contains: cleanPhone } }] }
            });
          }

          if (customer) {
            let customerUpdate: any = {};
            if (node.leadStage) customerUpdate.leadStage = node.leadStage;
            if (node.customerType) customerUpdate.customerType = node.customerType;
            if (node.tags) {
              let existingTags = (customer.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean);
              if (!existingTags.includes(node.tags)) { existingTags.push(node.tags); }
              customerUpdate.tags = existingTags.join(', ');
            }
            if (Object.keys(customerUpdate).length > 0) {
              await prisma.customer.update({ where: { id: customer.id }, data: customerUpdate });
            }

            if (!conv) {
              conv = await prisma.whatsAppConversation.findFirst({ 
                where: { customerId: customer.id }, 
                orderBy: { updatedAt: 'desc' } 
              });
            }

            if (conv) {
              let convUpdate: any = {};
              if (node.temperature) convUpdate.temperature = node.temperature;
              if (node.leadStage) convUpdate.leadStatus = node.leadStage;
              if (node.tags) {
                let convTags = (conv.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean);
                if (!convTags.includes(node.tags)) convTags.push(node.tags);
                convUpdate.tags = convTags.join(', ');
              }
              if (Object.keys(convUpdate).length > 0) {
                await prisma.whatsAppConversation.update({ where: { id: conv.id }, data: convUpdate });
                console.log(`[CRM Node] Conversation ${conv.id} updated with tags="${convUpdate.tags}" leadStatus="${convUpdate.leadStatus}"`);
              }
            }
          } else {
            console.error(`[CRM Node] Customer NOT FOUND for phone: ${toPhone}`);
          }
        } catch (e) {
          console.error("CRM Update Node Error:", e);
        }
    } else if (type === 'CRM_ROUNDROBIN' || type === 'START') {
        try {
          const cleanPhone = toPhone.replace(/\D/g, '').slice(-10);
          let conv = conversationId 
            ? await prisma.whatsAppConversation.findUnique({ where: { id: conversationId } })
            : null;

          if (!conv) {
            const customer = await prisma.customer.findFirst({
              where: { OR: [{ mobile: { contains: cleanPhone } }, { whatsappNumber: { contains: cleanPhone } }] }
            });
            if (customer) {
              conv = await prisma.whatsAppConversation.findFirst({ 
                where: { customerId: customer.id }, 
                orderBy: { updatedAt: 'desc' } 
              });
            }
          }

          if (conv) {
            // If the chat is already OPEN and actively assigned to an agent, do not reassign it.
            // We use wasClosed to check if it was actively OPEN *before* this message arrived.
            if (!wasClosed && conv.assignedEmployeeId) {
              console.log(`[Flow Assign] Chat ${conv.id} is actively OPEN and assigned to ${conv.assignedEmployeeId}. Skipping reassignment.`);
            } else if (node.assignmentMode === 'DIRECT' && node.agentId) {
              await prisma.whatsAppConversation.update({ 
                where: { id: conv.id }, 
                data: { assignedEmployeeId: node.agentId, status: 'OPEN' } 
              });
              await prisma.whatsAppMessage.create({
                data: {
                  conversationId: conv.id,
                  senderType: "SYSTEM",
                  senderName: "System",
                  messageType: "TEXT",
                  content: `Internal Note: Conversation auto-assigned to agent ID ${node.agentId} by Chatbot Flow.`,
                  status: "SENT",
                  sentAt: new Date(),
                  isInternalNote: true
                }
              });
              console.log(`[Flow Assign] Direct assigned chat ${conv.id} to agent ${node.agentId}`);
            } else {
              let agentQuery: any = { 
                chatAvailable: { not: false } 
              };

              const targetType = node.roundRobinTarget || 'TEAM';
              if (targetType === 'TEAM' && node.teamId) {
                agentQuery.teamId = node.teamId;
              } else if (targetType === 'AGENTS' && Array.isArray(node.agentIds) && node.agentIds.length > 0) {
                agentQuery.id = { in: node.agentIds };
              }

              const activeAgents = await prisma.employee.findMany({ 
                where: agentQuery,
                include: {
                  user: true,
                  assignedWhatsAppConversations: {
                    orderBy: { updatedAt: 'desc' },
                    take: 1,
                    select: { updatedAt: true }
                  },
                  _count: {
                    select: {
                      assignedWhatsAppConversations: {
                        where: { status: 'OPEN' }
                      }
                    }
                  }
                }
              });

              console.log(`[Round Robin] Method: ${node.distributionMethod || 'WORKLOAD_BALANCE'} Query:`, JSON.stringify(agentQuery), `Found agents: ${activeAgents.length}`);

              if (activeAgents.length > 0) {
                if (node.distributionMethod === 'EQUAL_DISTRIBUTION') {
                  // Pure cyclic round robin: Agent with the oldest (or no) recent chat assignment gets next
                  activeAgents.sort((a: any, b: any) => {
                    const timeA = a.assignedWhatsAppConversations?.[0]?.updatedAt 
                      ? new Date(a.assignedWhatsAppConversations[0].updatedAt).getTime() 
                      : 0;
                    const timeB = b.assignedWhatsAppConversations?.[0]?.updatedAt 
                      ? new Date(b.assignedWhatsAppConversations[0].updatedAt).getTime() 
                      : 0;
                    return timeA - timeB;
                  });
                } else {
                  // Workload balancing (default): Agent with lowest number of currently OPEN chats gets next
                  activeAgents.sort((a: any, b: any) => (a._count?.assignedWhatsAppConversations || 0) - (b._count?.assignedWhatsAppConversations || 0));
                }

                const selectedAgent = activeAgents[0];
                await prisma.whatsAppConversation.update({ 
                  where: { id: conv.id }, 
                  data: { assignedEmployeeId: selectedAgent.id, status: 'OPEN' } 
                });
                await prisma.whatsAppMessage.create({
                  data: {
                    conversationId: conv.id,
                    senderType: "SYSTEM",
                    senderName: "System",
                    messageType: "TEXT",
                    content: `Internal Note: Conversation auto-assigned to ${selectedAgent.user?.name || 'Agent'} by Chatbot Flow.`,
                    status: "SENT",
                    sentAt: new Date(),
                    isInternalNote: true
                  }
                });
                console.log(`[Round Robin] Successfully assigned chat ${conv.id} to agent ${selectedAgent.user?.name || selectedAgent.id} (Method: ${node.distributionMethod || 'WORKLOAD_BALANCE'}, Open load: ${selectedAgent._count?.assignedWhatsAppConversations || 0})`);
              } else {
                console.log(`[Round Robin] No agents matched query:`, agentQuery);
                await prisma.whatsAppConversation.update({ 
                  where: { id: conv.id }, 
                  data: { assignedEmployeeId: null, status: 'OPEN' } 
                });
                await prisma.whatsAppMessage.create({
                  data: {
                    conversationId: conv.id,
                    senderType: "SYSTEM",
                    senderName: "System",
                    messageType: "TEXT",
                    content: `Internal Note: Chatbot tried to assign conversation but no agents were available. Moved to Unassigned queue.`,
                    status: "SENT",
                    sentAt: new Date(),
                    isInternalNote: true
                  }
                });
              }
            }
          }
        } catch (e) {
          console.error("Round Robin Node Error:", e);
        }
    }

    // Pause at interactive nodes
    const isPause = ['CHOICE', 'INPUT_PHONE', 'INPUT_NAME', 'INPUT_EMAIL', 'INPUT_DATE'].includes(type);
    if (isPause) {
      return { status: 'paused', nodeId: node.id };
    }

    // Routing Logic for Next Node
    nextNodeId = node.outputPort || null; 
  }

  return { status: 'ended' };
}

/**
 * Main Flow Engine Entry Point
 */
export async function executeFlowEngine(senderPhone: string, userText: string, conversationId: string, wasClosed: boolean = false): Promise<boolean> {
  try {
    // 1. Check active flow triggers first to see if a flow matches the keyword!
    const activeFlows = await prisma.whatsAppChatbotFlow.findMany({
      where: { isActive: true }
    });

    let matchedFlow = null;
    let matchedTriggerNode = null;
    let matchedNextNodeId = null;

    for (const flowRecord of activeFlows) {
      if (!flowRecord.nodesJson) continue;

      let nodes: any[] = [];
      try { nodes = JSON.parse(flowRecord.nodesJson); } catch (_) { continue; }
      if (!Array.isArray(nodes)) continue;

      const triggerKeyword = flowRecord.triggerKeyword?.toLowerCase().trim();
      if (!triggerKeyword) continue;

      const keywords = triggerKeyword.split(',').map(k => k.trim());
      const isMatch = keywords.some(k => k && (userText.toLowerCase().trim() === k || userText.toLowerCase().includes(k)));

      if (isMatch) {
        const triggerNode = nodes.find((n: any) => (n.type || '').toUpperCase() === 'TRIGGER');
        if (triggerNode && triggerNode.outputPort) {
          matchedFlow = flowRecord;
          matchedTriggerNode = triggerNode;
          matchedNextNodeId = triggerNode.outputPort;
          break;
        }
      }
    }

    if (matchedFlow && matchedNextNodeId) {
      // Clear any existing/stuck flow states for this phone so it triggers fresh!
      await prisma.whatsAppFlowState.deleteMany({
        where: { phone: senderPhone }
      });

      // Insert new flow state
      await prisma.whatsAppFlowState.create({
        data: {
          phone: senderPhone,
          flowId: matchedFlow.id,
          currentNodeId: matchedNextNodeId,
          variables: '{}'
        }
      });

      const nodes = JSON.parse(matchedFlow.nodesJson);
      
      // Load customer profile variables for interpolation
      const cleanPhoneForVars = senderPhone.replace(/\D/g, '').slice(-10);
      const customerForVars = await prisma.customer.findFirst({
        where: { OR: [{ mobile: { contains: cleanPhoneForVars } }, { whatsappNumber: { contains: cleanPhoneForVars } }] }
      });
      const convForVars = customerForVars ? await prisma.whatsAppConversation.findFirst({
        where: { customerId: customerForVars.id }, orderBy: { updatedAt: 'desc' }
      }) : null;
      const profileVars: Record<string, string> = {
        name: customerForVars?.contactPerson || customerForVars?.businessName || '',
        businessName: customerForVars?.businessName || '',
        mobile: customerForVars?.mobile || senderPhone,
        whatsappNumber: customerForVars?.whatsappNumber || senderPhone,
        email: customerForVars?.email || '',
        city: customerForVars?.city || '',
        state: customerForVars?.state || '',
        tags: customerForVars?.tags || '',
        leadStage: customerForVars?.leadStage || '',
        customerType: customerForVars?.customerType || '',
      };
      
      const result = await runNodes(nodes, matchedNextNodeId, profileVars, senderPhone, conversationId, wasClosed);

      if (result.status === 'ended') {
        await prisma.whatsAppFlowState.deleteMany({ where: { phone: senderPhone } });
      } else {
        await prisma.whatsAppFlowState.update({
          where: { phone: senderPhone },
          data: { currentNodeId: result.nodeId! }
        });
      }

      await prisma.whatsAppChatbotFlow.update({
        where: { id: matchedFlow.id },
        data: { executionCount: { increment: 1 } }
      });

      return true;
    }

    // 2. If it is NOT a trigger keyword, process existing flow state if present
    const userState = await prisma.whatsAppFlowState.findUnique({
      where: { phone: senderPhone }
    });

    if (userState) {
      const flowRecord = await prisma.whatsAppChatbotFlow.findUnique({
        where: { id: userState.flowId }
      });

      if (!flowRecord?.nodesJson) {
        await prisma.whatsAppFlowState.delete({ where: { phone: senderPhone } });
        return false;
      }

      let nodes: any[] = [];
      try { nodes = JSON.parse(flowRecord.nodesJson); } catch (_) { return false; }
      if (!Array.isArray(nodes)) return false;

      const vars: Record<string, string> = JSON.parse(userState.variables || '{}');
      const currentNode = nodes.find((n: any) => n.id === userState.currentNodeId);

      if (!currentNode) {
        await prisma.whatsAppFlowState.delete({ where: { phone: senderPhone } });
        return false;
      }

      const type = (currentNode.type || '').toUpperCase();

      // Save user input
      if (['INPUT_NAME', 'INPUT_EMAIL', 'INPUT_PHONE', 'INPUT_DATE'].includes(type)) {
        if (currentNode.variableName) {
          vars[currentNode.variableName] = userText;
        }
      }

      // Route based on interactive choice clicked
      let nextNodeId = null;
      if (type === 'CHOICE' || type === 'BUTTONS' || type === 'LIST_MENU') {
        const choices = currentNode.choices || [];
        const matchIndex = choices.findIndex((c: any) =>
          c.text &&
          (
            userText.toLowerCase().includes(String(c.text).toLowerCase()) ||
            String(c.text).toLowerCase().includes(userText.toLowerCase()) ||
            String(c.text).toLowerCase().slice(0, 20) === userText.toLowerCase()
          )
        );

        if (matchIndex !== -1) {
          nextNodeId = choices[matchIndex].targetNode;
        } else {
          // Unrecognized input on a CHOICE node — hand off to AI
          await prisma.whatsAppFlowState.delete({ where: { phone: senderPhone } });
          return false; // Let AI handle this
        }
      }

      // If no interactive match, follow default output port
      if (!nextNodeId) {
        nextNodeId = currentNode.outputPort || null;
      }

      if (!nextNodeId) {
        // Flow ended
        await prisma.whatsAppFlowState.delete({ where: { phone: senderPhone } });
        return true; 
      }

      const result = await runNodes(nodes, nextNodeId, vars, senderPhone, conversationId);

      if (result.status === 'ended') {
        await prisma.whatsAppFlowState.delete({ where: { phone: senderPhone } });
      } else {
        await prisma.whatsAppFlowState.update({
          where: { phone: senderPhone },
          data: { currentNodeId: result.nodeId!, variables: JSON.stringify(vars) }
        });
      }

      return true; 
    }

    return false;
  } catch (err: any) {
    console.error('[Flow Engine Error]:', err.message);
    return false;
  }
}
