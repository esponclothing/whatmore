import { PrismaClient } from '@prisma/client';
import { sendWhatsAppMessageAction } from '@/app/actions/whatsAppPlatformActions';

const prisma = new PrismaClient();

const SHOPIFY_STORE_URL = process.env.VITE_SHOPIFY_STORE_URL || 'i2tu0d-jc.myshopify.com';
const SHOPIFY_ACCESS_TOKEN = process.env.VITE_SHOPIFY_ACCESS_TOKEN || '';
const GROQ_API_KEY = process.env.VITE_GROQ_API_KEY || '';

// Mock AI call (You can use @google/genai or fetch in real app)
async function callAIEngine(messages: any[], model: string, jsonMode = false, maxTokens = 600) {
  const apiKey = process.env.GROQ_API_KEY || GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");
  
  const payload: any = {
    model: model === 'gpt-4o' ? 'llama-3.3-70b-versatile' : model,
    messages,
    temperature: 0.4,
    max_tokens: maxTokens,
  };
  if (jsonMode) payload.response_format = { type: "json_object" };
  
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (data?.choices?.[0]?.message?.content) {
    return data.choices[0].message.content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  }
  throw new Error('AI Model failed');
}

export async function lookupOrder(orderNumber: string, senderPhone = '', userText = '', history = '') {
  const pureNum = String(orderNumber || '').replace(/[^0-9]/g, '');
  const cleanSender = String(senderPhone || '').replace(/\D/g, '').slice(-10);

  try {
    let order: any = null;

    if (pureNum) {
      const url = `https://${SHOPIFY_STORE_URL}/admin/api/2024-10/orders.json?status=any&name=${pureNum}`;
      const res = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      const orders = data.orders || [];
      if (orders.length > 0) order = orders[0];
    }

    if (!order) {
      return { error: `No matching order found in store for ${pureNum ? '#' + pureNum : cleanSender}.` };
    }

    const registeredPhone = order.phone || order.customer?.phone || order.shipping_address?.phone || cleanSender || '';
    const order10Digits = String(registeredPhone).replace(/[^0-9]/g, '').slice(-10);

    const destination_location = `${order.shipping_address?.city || 'India'}, ${order.shipping_address?.province || ''} - ${order.shipping_address?.zip || ''}`.replace(/^[,\s-]+|[,\s-]+$/g, '') || 'India';
    const courier_company = order.fulfillments?.[0]?.tracking_company || 'Express Delivery';
    const tracking_url = order.fulfillments?.[0]?.tracking_url || order.fulfillments?.[0]?.tracking_urls?.[0] || 'https://www.icarry.in';
    const rawStatus = order.fulfillment_status || 'unfulfilled';
    const readableStatus = rawStatus === 'fulfilled' ? 'FULFILLED / SHIPPED (In Transit)' : rawStatus.toUpperCase();

    const finStatus = (order.financial_status || '').toLowerCase();
    const totalAmount = `₹${order.total_price || 0}`;
    const payment_status = finStatus === 'paid'
      ? `💳 PAID ONLINE (Prepaid - ${totalAmount})`
      : finStatus === 'partially_paid'
      ? `🪙 PARTIALLY PAID (Advance Paid | Balance to Pay on COD: ${totalAmount})`
      : `💵 CASH ON DELIVERY (COD | Please Pay ${totalAmount} on Delivery)`;

    return {
      order_number: order.name,
      registered_mobile_10_digits: order10Digits || 'No mobile registered',
      status: readableStatus,
      payment_status,
      financial_status: order.financial_status,
      total_price: totalAmount,
      destination_location,
      courier_company,
      tracking_url,
      CRITICAL_INSTRUCTION_TO_AI: `You MUST compare Customer ka Current WhatsApp Number or Customer ka bataya hua 10-digit number with registered_mobile_10_digits (${order10Digits}). If they DO NOT MATCH exactly, DO NOT reveal status or tracking_url! When answering order status, ALWAYS clearly state the payment_status (${payment_status}) and order status. Never output JSON in your reply!`
    };
  } catch (err: any) {
    return { error: err.message };
  }
}

function extractProductKeyword(text: string) {
  if (/combo|trio|pack|offer|deal|discount/i.test(text)) {
    if (!/short|oversize|t\-?i?shirt|shirt|tee|pant|track/i.test(text)) return '';
  }
  const terms = [];
  if (/short/i.test(text)) terms.push('shorts');
  if (/oversize|t\-?i?shirt|shirt|tee/i.test(text)) terms.push('shirt');
  if (/pant|track|lower|trouser/i.test(text)) terms.push('pant');
  return terms.join(' ');
}

export async function searchProducts(userText: string) {
  const cleanKeyword = extractProductKeyword(userText);
  const isComboSearch = /combo|trio|pack|offer|deal|discount/i.test(userText);

  const dbCombos = await prisma.shopifyCombo.findMany({ where: { is_active: true } });

  const query = `
    query SearchProducts($query: String!) {
      products(first: 50, query: $query) {
        edges {
          node {
            id title handle featuredImage { url }
            variants(first: 1) { edges { node { price } } }
          }
        }
      }
    }
  `;
  try {
    const res = await fetch(`https://${SHOPIFY_STORE_URL}/admin/api/2024-10/graphql.json`, {
      method: 'POST',
      headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { query: `status:active ${cleanKeyword}` } })
    });
    const data = await res.json();
    let edges = data?.data?.products?.edges || [];

    edges.sort((a: any, b: any) => {
      const aId = String(a.node.id).replace(/\D/g, '');
      const bId = String(b.node.id).replace(/\D/g, '');
      const aCombo = dbCombos.find(c => String(c.product_id) === aId || (c.product_title && a.node.title.toLowerCase().includes(c.product_title.toLowerCase())));
      const bCombo = dbCombos.find(c => String(c.product_id) === bId || (c.product_title && b.node.title.toLowerCase().includes(c.product_title.toLowerCase())));
      return (bCombo ? 1 : 0) - (aCombo ? 1 : 0);
    });

    const productLines: string[] = [];
    const carouselCards: any[] = [];
    
    edges.slice(0, 10).forEach((e: any, idx: number) => {
      const p = e.node;
      const rawId = String(p.id).replace(/\D/g, '');
      const singlePrice = p.variants.edges[0]?.node?.price || 'N/A';
      
      const matchingCombo = dbCombos.find(c => String(c.product_id) === rawId || (c.product_title && p.title.toLowerCase().includes(c.product_title.toLowerCase())));
      let comboLine = '';
      let cardPrice = `₹${singlePrice}`;
      let productUrl = `https://${SHOPIFY_STORE_URL}/products/${p.handle}`;
      
      if (matchingCombo && Number(matchingCombo.combo_count) > 0) {
        comboLine = ` | 🔥 *COMBO OFFER:* Pack of ${matchingCombo.combo_count} @ *₹${matchingCombo.combo_price}* (Coupon: *${matchingCombo.discount_code}*)`;
        cardPrice = `COMBO: Pack of ${matchingCombo.combo_count} @ ₹${matchingCombo.combo_price}`;
        productUrl = `https://${SHOPIFY_STORE_URL}/products/${p.handle}?discount=${matchingCombo.discount_code}`;
      }

      if (idx < 5) {
        productLines.push(`Product: ${p.title} - Price: ₹${singlePrice} ${comboLine}`);
        carouselCards.push({
          title: p.title.slice(0, 60),
          price: cardPrice.slice(0, 160),
          image_url: p.featuredImage?.url || '',
          url: productUrl
        });
      }
    });

    let textLines = productLines;
    if (isComboSearch && dbCombos.length > 0) {
      const summaryList = dbCombos.map(c => `🔥 *${c.product_title}* — Pack of ${c.combo_count} @ *₹${c.combo_price}* (Coupon: *${c.discount_code}*)`);
      textLines = [...summaryList, '', ...productLines];
    }
    return { textLines, carouselCards };
  } catch (err: any) {
    return { error: err.message };
  }
}

export function recommendSize(userText: string) {
  const weightMatch = userText.match(/(?:weight\s*is\s*|weight\s*|wt\s*|@\s*|^|\D)(\d{2,3})\s*(?:kg|kilo|k)\b/i) || userText.match(/\b(\d{2,3})\s*(?:kg|kilo)\b/i);
  const waistMatch = userText.match(/(?:waist|kamar)\s*(?:is\s*|of\s*|=|-|:)?\s*(\d{2})\b/i) || userText.match(/\b(\d{2})\s*(?:waist|kamar|inch|in)\b/i);

  if (weightMatch) {
    const kg = parseInt(weightMatch[1], 10);
    let teeSize = 'M (Medium)'; let teeChest = '44"'; let bottomSize = 'L (30-32" waist)';
    if (kg < 60) { teeSize = 'S (Small)'; teeChest = '42"'; bottomSize = 'M (28-30" waist)'; }
    else if (kg <= 72) { teeSize = 'M (Medium)'; teeChest = '44"'; bottomSize = 'M or L (29-31" waist)'; }
    else if (kg <= 84) { teeSize = 'L (Large)'; teeChest = '46"'; bottomSize = 'L or XL (31-33" waist)'; }
    else if (kg <= 95) { teeSize = 'XL (Extra Large)'; teeChest = '48"'; bottomSize = 'XL or XXL (33-35" waist)'; }
    else { teeSize = 'XXL (Double XL)'; teeChest = '50"'; bottomSize = 'XXL (35-37" waist)'; }

    return `[11FIT SIZE RECOMMENDATION FOR WEIGHT ~${kg} KG]:\n` +
      `👕 Oversized T-Shirts: Recommended Size **${teeSize}** (Chest ${teeChest} | Premium Boxy Fit)\n` +
      `🩳 Shorts & Track Pants: Recommended Size **${bottomSize}**\n` +
      `💡 Note: Our tees already have a stylish drop-shoulder oversized streetwear cut — no need to size up!`;
  }
  if (waistMatch) {
    const waist = parseInt(waistMatch[1], 10);
    let bottomSize = 'M (Medium - 28-30")';
    if (waist >= 35) bottomSize = 'XXL (Double XL - 34-36"+)';
    else if (waist >= 33) bottomSize = 'XL (Extra Large - 32-34")';
    else if (waist >= 31) bottomSize = 'L (Large - 30-32")';

    return `[11FIT SIZE RECOMMENDATION FOR ~${waist}" WAIST]:\n` +
      `🩳 Recommended Bottom Size: **${bottomSize}**\n` +
      `👕 For Oversized Tees: Choose based on chest/weight (M for 65-75kg, L for 75-85kg).`;
  }
  return `[11FIT GENERAL SIZE & FIT GUIDE]:\n` +
    `👕 Oversized T-Shirts:\n` +
    `   • S: Chest 42" (~50-63 kg)\n   • M: Chest 44" (~63-73 kg)\n   • L: Chest 46" (~74-84 kg)\n   • XL: Chest 48" (~85-95 kg)\n   • XXL: Chest 50" (~96-110 kg)\n` +
    `🩳 Shorts/Tracks: M (28-30"), L (30-32"), XL (32-34"), XXL (34-36"+)`;
}

export async function sendWhatsAppProductCards(toPhone: string, cards: any[]) {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || '1189183190949431';
  let token = process.env.WHATSAPP_TOKEN || '';
  const settings = await prisma.whatsAppLegacySetting.findFirst();
  if (settings?.whatsapp_token) token = settings.whatsapp_token;

  if (!token) return;

  const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
  const cardsToSend = cards.slice(0, 5);
  
  for (const c of cardsToSend) {
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: toPhone,
      type: "interactive",
      interactive: {
        type: "cta_url",
        header: { type: "image", image: { link: c.image_url } },
        body: { text: `*${c.title}*\nPrice: ${c.price}`.slice(0, 160) },
        action: { name: "cta_url", parameters: { display_text: "🛍️ Buy Now", url: c.url } }
      }
    };
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {}
  }
}

export async function handleIncomingAILogic(senderPhone: string, userText: string, historyLines: string[]) {
  const history = historyLines.join('\n');
  let toolContext = '';
  let carouselCards: any[] = [];
  
  const digitsOnly = userText.replace(/[^0-9]/g, '');
  let orderNumToLookup = null;
  if (digitsOnly.length >= 10) {
    const historyOrderMatch = history.match(/(?:#|order\s*)([12]\d{3})\b/i) || history.match(/\b([12]\d{3})\b/);
    if (historyOrderMatch) orderNumToLookup = historyOrderMatch[1];
  } else {
    const explicitOrderMatch = userText.match(/(?:order|#)\s*([12]\d{3})\b/i);
    if (explicitOrderMatch) orderNumToLookup = explicitOrderMatch[1];
    else {
      const standaloneMatch = userText.match(/(?:^|\D)([12]\d{3})(?:\D|$)/);
      if (standaloneMatch) orderNumToLookup = standaloneMatch[1];
    }
  }

  if (orderNumToLookup) {
    const orderInfo = await lookupOrder(orderNumToLookup, senderPhone, userText, history);
    toolContext += `\n[SHOPIFY ORDER RESULT FOR #${orderNumToLookup}]: ${JSON.stringify(orderInfo)}`;
  }

  const productKeywords = /short|combo|trio|pack|t\-?shirt|shirt|oversize|tee|pant|track|lower|trouser|clothes|dikhao|price|offer|deal|discount|buy|link|item|product|collection|catalog|sell|shop|store|show/i;
  if (productKeywords.test(userText)) {
    const productsInfo = await searchProducts(userText);
    if (productsInfo && productsInfo.textLines) {
      toolContext += `\n[SHOPIFY GRAPHQL PRODUCTS RESULT]: ${JSON.stringify(productsInfo.textLines)}`;
      carouselCards = productsInfo.carouselCards || [];
    }
  }

  if (/size|fit|height|weight|wt\b|lamba|inch|cm|kg|kilo|medium|large|small|xl|xxl|5['']?\d|6['']?\d|waist|kamar|seena|chest/i.test(userText)) {
    const sizeInfo = recommendSize(userText);
    toolContext += `\n${sizeInfo}`;
  }

  const legacySettings = await prisma.whatsAppLegacySetting.findFirst();

  const systemPrompt = `Tum "11FIT AI Stylist & Sales Assistant" ho!
=== 🗣️ DYNAMIC LANGUAGE & TONE MIRRORING ===
${legacySettings?.inst_language || `- AUTOMATIC LANGUAGE SWITCHING: Customer jis language mein message kare, ussi language mein reply karo!
- SHORT & CRISP REPLIES: Max 2-4 lines. Never write long essays.`}

=== 🔐 CUSTOMER LIVE WHATSAPP NUMBER ===
Customer ka Current WhatsApp Number: ${senderPhone}

=== 🚨 CRITICAL CHAT RULE: NEVER PRINT TOOL LOGS OR BRACKETED TEXT ===
- KABHI BHI "[SHOPIFY ORDER RESULT...]" ya koi JSON bracket text customer ko MAT bhejna.
- Agar products mile hain, toh exactly yeh tag end mein lagao: [SEND_PRODUCT_CAROUSEL].

=== 🔐 SECURITY & 10-DIGIT VERIFICATION FLOW ===
${legacySettings?.inst_order_security || `- ALWAYS verify 10-digit number before giving order details!`}

=== 📏 11FIT AI SIZE & FIT ADVISOR RULE ===
${legacySettings?.inst_size_advisor || `- Oversized tees have drop shoulder fit, take normal size.`}

=== 📚 KNOWLEDGE BASE ===
${legacySettings?.inst_brand_policies || ''}
${legacySettings?.knowledge_base || ''}
${legacySettings?.inst_custom || ''}

RECENT CONVERSATION HISTORY:
${history}

TOOLS DATA (USE THIS TO ANSWER):
${toolContext}

CUSTOMER NEW MESSAGE:
${userText}`;

  try {
    let aiReply = await callAIEngine(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText }
      ],
      "llama-3.3-70b-versatile", false, 600
    );

    let sendCarousel = carouselCards.length > 0;
    if (aiReply.includes('[SEND_PRODUCT_CAROUSEL]')) {
       aiReply = aiReply.replace(/\[SEND_PRODUCT_CAROUSEL\]/g, '').trim();
       sendCarousel = true;
    }

    if (aiReply) {
      await sendWhatsAppMessageAction({
        conversationId: "internal-ai-hook",
        senderId: "system",
        senderType: "AGENT", 
        messageType: "TEXT",
        content: aiReply,
        senderName: "AI Assistant",
        isInternalNote: false
      }).catch(e => {});
    }

    if (sendCarousel && carouselCards.length > 0) {
      await sendWhatsAppProductCards(senderPhone, carouselCards);
    }
    
    // Background Tagging Task
    callAIEngine([{ role: 'system', content: 'Output exactly one tag describing the customer intent: [VIP, Angry, Inquiry, Looking to Buy]' }, { role: 'user', content: userText }], "llama-3.1-8b-instant", false, 15)
      .then(async tag => {
        // Tagging logic can be attached to Customer or Conversation 
      }).catch(()=>{});

    return aiReply;
  } catch (err: any) {
    console.error("AI Generation failed:", err.message);
    return null;
  }
}
