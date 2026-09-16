async function testErpWebhook() {
  const url = "https://erp.esponsports.com/api/webhooks/whatsapp/leads";
  const token = "Bearer 2b7b4bea-5737-4a50-b96c-f9354d132ee8";
  
  const payload = {
    name: "Test Customer",
    whatsappNumber: "919876543210",
    mobile: "919876543210",
    shopName: "Test Shop",
    agentEmail: "esponclothing103@gmail.com",
    tags: "WhatsApp Lead",
    city: "Delhi",
    source: "WhatsApp Inbox"
  };

  console.log("Sending POST to:", url);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token
      },
      body: JSON.stringify(payload)
    });

    console.log("Status:", res.status, res.statusText);
    const body = await res.text();
    console.log("Response body:", body);
  } catch (err: any) {
    console.error("Fetch error:", err);
  }
}

testErpWebhook();
