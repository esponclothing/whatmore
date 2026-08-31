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
async function dispatchNode(toPhone: string, node: any, vars: Record<string, string>) {
  const inter = (s: string) => interpolate(s, vars);
  const type = (node.type || '').toUpperCase();

  try {
    const creds = await getCreds();
    if (!creds) return;

    const url = `https://graph.facebook.com/v20.0/${creds.phoneId}/messages`;
    const headers = { 'Authorization': `Bearer ${creds.token}`, 'Content-Type': 'application/json' };
    let payload: any = { messaging_product: 'whatsapp', recipient_type: 'individual', to: toPhone };

    if (type === 'TEXT' || type === 'START' || type === 'TRIGGER') {
      if (!node.text) return; // Skip if no text
      payload.type = 'text';
      payload.text = { body: inter(node.text) };

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
      await fetch(url, { method: 'POST', headers, body: JSON.stringify(introPayload) });

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
          await fetch(url, { method: 'POST', headers, body: JSON.stringify(pPayload) });
        } else {
          const pPayload = {
             messaging_product: 'whatsapp', recipient_type: 'individual', to: toPhone,
             type: 'text',
             text: { body: `${p.name} - ₹${p.sellingPrice}` }
          };
          await fetch(url, { method: 'POST', headers, body: JSON.stringify(pPayload) });
        }
      }
      return; // Handled

    } else if (type === 'DELAY') {
      const ms = Math.min((parseInt(node.seconds) || 1) * 1000, 4000);
      await new Promise(r => setTimeout(r, ms));
      return; 

    } else {
      return; // Logic node, nothing to dispatch
    }

    await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
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
async function runNodes(nodes: any[], startNodeId: string, vars: Record<string, string>, toPhone: string) {
  let nextNodeId: string | null = startNodeId;

  while (nextNodeId) {
    const node = nodes.find((n: any) => n.id === nextNodeId);
    if (!node) break;

    await dispatchNode(toPhone, node, vars);

    const type = (node.type || '').toUpperCase();

    // CRM Logic
    if (type === 'CRM_CONTACT' || type === 'CRM_LEAD') {
        try {
          const customer = await prisma.customer.findFirst({
            where: { OR: [{ mobile: { contains: toPhone } }, { whatsappNumber: { contains: toPhone } }] }
          });
          if (customer) {
            let updateData: any = {};
            if (node.leadStage) updateData.leadStage = node.leadStage;
            if (node.priority) updateData.priority = node.priority;
            if (node.tags) {
              let existingTags = (customer.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean);
              if (!existingTags.includes(node.tags)) { existingTags.push(node.tags); updateData.tags = existingTags.join(', '); }
            }
            if (Object.keys(updateData).length > 0) {
              await prisma.customer.update({ where: { id: customer.id }, data: updateData });
            }
            if (updateData.tags) {
              const conv = await prisma.whatsAppConversation.findFirst({ where: { phone: { contains: toPhone } }, orderBy: { updatedAt: 'desc' } });
              if (conv) await prisma.whatsAppConversation.update({ where: { id: conv.id }, data: { tags: updateData.tags } });
            }
          }
        } catch (e) {
          console.error("CRM Update Node Error:", e);
        }
    } else if (type === 'CRM_ROUNDROBIN' || type === 'START') {
        try {
          const conv = await prisma.whatsAppConversation.findFirst({ where: { phone: { contains: toPhone } }, orderBy: { updatedAt: 'desc' } });
          if (conv) {
            if (node.agentId) {
              await prisma.whatsAppConversation.update({ where: { id: conv.id }, data: { assignedEmployeeId: node.agentId, status: 'OPEN' } });
            } else {
              const activeAgents = await prisma.employee.findMany({ where: { employmentStatus: 'Active' }, take: 1 });
              if (activeAgents.length > 0) {
                await prisma.whatsAppConversation.update({ where: { id: conv.id }, data: { assignedEmployeeId: activeAgents[0].id, status: 'OPEN' } });
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
export async function executeFlowEngine(senderPhone: string, userText: string, conversationId: string): Promise<boolean> {
  try {
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
      if (type === 'CHOICE') {
        const choices = currentNode.choices || [];
        const matchIndex = choices.findIndex((c: any) =>
          c.text && userText.toLowerCase().includes(String(c.text).toLowerCase())
        );

        if (matchIndex !== -1) {
          nextNodeId = choices[matchIndex].targetNode;
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

      const result = await runNodes(nodes, nextNodeId, vars, senderPhone);

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

    // 2. User NOT in a flow - check triggers
    const activeFlows = await prisma.whatsAppChatbotFlow.findMany({
      where: { isActive: true }
    });

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
        if (!triggerNode || !triggerNode.outputPort) continue;
        
        const nextNodeId = triggerNode.outputPort;

        await prisma.whatsAppFlowState.upsert({
          where: { phone: senderPhone },
          update: { flowId: flowRecord.id, currentNodeId: nextNodeId, variables: '{}' },
          create: { phone: senderPhone, flowId: flowRecord.id, currentNodeId: nextNodeId, variables: '{}' }
        });

        const result = await runNodes(nodes, nextNodeId, {}, senderPhone);

        if (result.status === 'ended') {
          await prisma.whatsAppFlowState.deleteMany({ where: { phone: senderPhone } });
        } else {
          await prisma.whatsAppFlowState.update({
            where: { phone: senderPhone },
            data: { currentNodeId: result.nodeId! }
          });
        }

        await prisma.whatsAppChatbotFlow.update({
          where: { id: flowRecord.id },
          data: { executionCount: { increment: 1 } }
        });

        return true; 
      }
    }

    return false;
  } catch (err: any) {
    console.error('[Flow Engine Error]:', err.message);
    return false;
  }
}
