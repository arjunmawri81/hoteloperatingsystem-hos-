const express = require("express");
const AIConversation = require("../models/AIConversation");
const AIKnowledge = require("../models/AIKnowledge");
const AIToolsService = require("../services/aiTools.service");
const ExecutiveBriefingService = require("../services/executiveBriefing.service");
const { identifyTenant } = require("../middleware/tenant");
const Complaint = require("../models/Complaint");
const Lead = require("../models/Lead");
const Hotel = require("../models/Hotel");

const router = express.Router();

/**
 * GET /api/ai/conversations
 */
router.get("/conversations", async (req, res) => {
  const { channel, status } = req.query;
  const filter = {};
  if (channel) filter.channel = channel;
  if (status) filter.status = status;

  try {
    const conversations = await AIConversation.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: conversations.length, data: conversations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/ai/conversations/:id/messages
 */
router.post("/conversations/:id/messages", async (req, res) => {
  const { message } = req.body;

  try {
    const conv = await AIConversation.findOne({ id: req.params.id });
    if (!conv) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    const reply = `Aura AI: Request acknowledged. "${message}" has been forwarded to guest care.`;
    conv.lastMessage = message;
    conv.timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    await conv.save();

    return res.status(200).json({ success: true, reply, timestamp: conv.timestamp });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/ai/chat
 * Intelligent AI Receptionist with Multi-Property Platform & Hotel-Specific Context
 */
router.post("/chat", async (req, res) => {
  try {
    const { message, bookingId, guestPhone, hotelId, history = [] } = req.body;
    const lower = (message || "").toLowerCase();

    // 0. Fetch all active platform hotels
    const allHotels = await Hotel.find({}).lean();
    let currentHotel = null;

    if (hotelId) {
      currentHotel = allHotels.find((h) => h.id === hotelId) || null;
    }

    // Build context text from message and recent chat history
    const historyText = Array.isArray(history)
      ? history.slice(-4).map((h) => (typeof h === "string" ? h : h.text || "")).join(" ").toLowerCase()
      : "";
    const combinedContext = `${historyText} ${lower}`;

    // If no hotel specified yet, check if current message or recent history mentions any city or hotel name
    if (!currentHotel && allHotels.length > 0) {
      // Direct check on current message first
      currentHotel = allHotels.find((h) => {
        const hotelName = h.name.toLowerCase();
        const cityName = h.city.toLowerCase();
        const orgName = (h.orgName || "").toLowerCase();

        if (lower.includes(hotelName) || (orgName && lower.includes(orgName))) return true;

        const nameWords = hotelName.split(/\s+/).filter((w) => w.length > 3);
        if (nameWords.some((w) => lower.includes(w))) return true;

        const cityWords = cityName.split(/\s+/).filter((w) => w.length > 2);
        if (cityWords.some((w) => lower.includes(w))) return true;

        return false;
      }) || null;

      // Fallback: Check recent conversational history for city/hotel context
      if (!currentHotel && historyText) {
        currentHotel = allHotels.find((h) => {
          const cityName = h.city.toLowerCase();
          const cityWords = cityName.split(/\s+/).filter((w) => w.length > 2);
          return cityWords.some((w) => historyText.includes(w));
        }) || null;
      }
    }

    // 1. Check if user is asking to lookup a booking
    if (bookingId || guestPhone || lower.includes("booking") || lower.includes("reservation") || lower.includes("res-")) {
      const match = message.match(/res-[\w\d-]+/i);
      const queryId = bookingId || (match ? match[0].toUpperCase() : null);
      if (queryId || guestPhone) {
        const lookup = await AIToolsService.lookupBooking({ bookingId: queryId, guestPhone });
        if (lookup.found) {
          const b = lookup.booking;
          return res.json({
            success: true,
            hotelId: b.hotelId,
            reply: `Namaste **${b.guestName}**! Here are the details for your reservation at **${b.hotelName || "LuckNexa"}**:\n\n• **Booking ID**: ${b.id}\n• **Room**: ${b.roomNumber || "Assigned at Check-in"} (${b.roomType})\n• **Dates**: ${b.checkIn} to ${b.checkOut}\n• **Status**: ${b.status.toUpperCase()}\n• **Total Bill**: ₹${b.totalAmount} (Paid: ₹${b.paidAmount})\n\nYou can proceed with 1-click Express Digital Pre-Check-In to skip the front desk counter upon arrival!`,
            toolUsed: "lookupBooking",
            data: b,
          });
        } else {
          return res.json({
            success: true,
            reply: `We could not find an active reservation for **${queryId || guestPhone}**. Please verify your booking ID (e.g. RES-101) or registered phone number, or let me know if you would like to make a new booking!`,
            toolUsed: "lookupBooking",
          });
        }
      }
    }

    // 2. Check if message contains an inquiry with contact info or group/event inquiry (Auto-Capture Lead)
    const phoneMatch = message.match(/(?:\+?91[\s-]?)?[6-9]\d{9}/);
    const hasInquiryKeywords =
      lower.includes("wedding") ||
      lower.includes("banquet") ||
      lower.includes("event") ||
      lower.includes("conference") ||
      lower.includes("group") ||
      lower.includes("call me") ||
      lower.includes("quote") ||
      lower.includes("enquiry") ||
      lower.includes("inquiry") ||
      lower.includes("rooms for");

    if (phoneMatch || (hasInquiryKeywords && (guestPhone || phoneMatch))) {
      const extractedPhone = phoneMatch ? phoneMatch[0].replace(/[\s-]/g, "") : guestPhone || "+91 98000 00000";
      const testLeadId = `lead-chat-${Date.now().toString().slice(-4)}`;

      const targetHotel = currentHotel || allHotels[0];
      const targetHotelId = targetHotel ? targetHotel.id : "hotel-taj-delhi";
      const targetOrgId = targetHotel ? targetHotel.orgId : "";

      const newLead = await Lead.create({
        id: testLeadId,
        name: `Guest Inquiry (${extractedPhone.slice(-4)})`,
        phone: extractedPhone,
        email: "guest.chat@inquiry.com",
        source: "Website",
        requirement: message,
        budget: lower.includes("wedding") || lower.includes("banquet") ? 250000 : lower.includes("group") ? 100000 : 35000,
        stage: "New",
        aiSummary: `[AI Web Chat Captured]: ${message}`,
        nextFollowUp: "Today, within 2 hours",
        hotelId: targetHotelId,
        orgId: targetOrgId,
        leadType: "hotel_guest",
      });

      return res.json({
        success: true,
        hotelId: targetHotel ? targetHotel.id : undefined,
        reply: `🙏 Thank you! Your inquiry has been registered with our team${targetHotel ? ` for **${targetHotel.name}**` : ""}.\n\n📋 **Inquiry ID**: ${newLead.id}\n📞 **Contact**: ${extractedPhone}\n💼 **Status**: Assigned to Reservations Desk.\n\nOur hospitality executive will contact you shortly with a personalized quote!`,
        toolUsed: "captureLead",
        data: newLead,
      });
    }

    // 3. Check if user is asking about Room Availability / Rates / Hotel Discovery
    const isHotelDiscoveryOrRates =
      lower.includes("hotel") ||
      lower.includes("properties") ||
      lower.includes("property") ||
      lower.includes("available") ||
      lower.includes("room") ||
      lower.includes("rate") ||
      lower.includes("price") ||
      lower.includes("cost") ||
      lower.includes("stay") ||
      lower.includes("book") ||
      lower.includes("udaipur") ||
      lower.includes("delhi") ||
      lower.includes("mumbai") ||
      lower.includes("kolkata");

    if (isHotelDiscoveryOrRates) {
      if (currentHotel) {
        const avail = await AIToolsService.checkAvailability({ hotelId: currentHotel.id });
        const summary =
          avail.roomTypes.length > 0
            ? avail.roomTypes.map((t) => `• **${t.type}**: ₹${t.rate}/night (${t.count} available)`).join("\n")
            : "• **Deluxe Rooms & Suites**: Available on request";

        return res.json({
          success: true,
          hotelId: currentHotel.id,
          hotelName: currentHotel.name,
          reply: `In **${currentHotel.city}**, we proudly feature **${currentHotel.name}** 🌟 (5★ Luxury Hospitality):\n\n📍 **Location**: ${currentHotel.address || currentHotel.city}\n📞 **Concierge**: ${currentHotel.phone || "+91 11 2611 0202"}\n\n🏨 **Available Rooms & Rates Today**:\n${summary}\n\nWould you like me to assist you with booking a room here, or do you have any specific requirements?`,
          toolUsed: "checkAvailability",
          data: { hotel: currentHotel, availability: avail },
        });
      } else {
        // Multi-hotel overview across all destinations
        const propertyList = allHotels
          .map((h) => `• **${h.name}** (${h.city}) — 5★ Luxury stay | Contact: ${h.phone || "+91 11 2611 0202"}`)
          .join("\n");
        return res.json({
          success: true,
          reply: `Welcome to **LuckNexa Hotels & Resorts**! We feature luxury properties across top destinations in India:\n\n${propertyList}\n\nWhich destination (Delhi, Mumbai, Kolkata, Udaipur) would you like to check room availability or book for?`,
          toolUsed: "listProperties",
          data: allHotels,
        });
      }
    }

    // 4. Search Knowledge Base (Hotel-specific or global platform policies)
    const kbAnswer = await AIToolsService.searchKnowledgeBase(message, currentHotel ? currentHotel.id : undefined);
    if (kbAnswer) {
      return res.json({
        success: true,
        hotelId: currentHotel ? currentHotel.id : undefined,
        reply: kbAnswer,
        toolUsed: "searchKnowledgeBase",
      });
    }

    // 5. Call Live Google Gemini AI Model (with multi-model fallback)
    const geminiReply = await askGemini(message, currentHotel, allHotels, history);
    if (geminiReply) {
      return res.json({
        success: true,
        hotelId: currentHotel ? currentHotel.id : undefined,
        reply: geminiReply,
        toolUsed: "Google Gemini AI",
      });
    }

    // 6. Intelligent Fallback (handles policy/timings/facilities if LLM was unavailable)
    const hName = currentHotel ? currentHotel.name : "LuckNexa Hotels";
    if (
      lower.includes("check-in") ||
      lower.includes("check in") ||
      lower.includes("check out") ||
      lower.includes("timing") ||
      lower.includes("time") ||
      lower.includes("policy") ||
      lower.includes("policies")
    ) {
      return res.json({
        success: true,
        hotelId: currentHotel ? currentHotel.id : undefined,
        reply: `At **${hName}**, standard Check-in begins at **02:00 PM** and Check-out is until **11:00 AM**. Early check-in and express checkout are available via our 1-click Digital Pre-Check-In counter.`,
        toolUsed: "policyKnowledge",
      });
    }

    if (lower.includes("wifi") || lower.includes("wi-fi") || lower.includes("internet") || lower.includes("breakfast")) {
      return res.json({
        success: true,
        hotelId: currentHotel ? currentHotel.id : undefined,
        reply: `High-speed Wi-Fi is complimentary for all staying guests across **${hName}**. Complimentary buffet breakfast is served daily from **07:00 AM to 10:30 AM** at the All-Day Dining restaurant.`,
        toolUsed: "amenityKnowledge",
      });
    }

    if (lower.includes("cancel") || lower.includes("refund")) {
      return res.json({
        success: true,
        hotelId: currentHotel ? currentHotel.id : undefined,
        reply: `Direct bookings at **${hName}** can be cancelled free of charge up to **24 hours** prior to your scheduled check-in date.`,
        toolUsed: "cancellationPolicy",
      });
    }

    if (lower.includes("pool") || lower.includes("gym") || lower.includes("fitness") || lower.includes("spa")) {
      return res.json({
        success: true,
        hotelId: currentHotel ? currentHotel.id : undefined,
        reply: `The swimming pool and fitness wellness center at **${hName}** are open daily from **06:00 AM to 09:00 PM** complimentary for all resident guests.`,
        toolUsed: "facilityKnowledge",
      });
    }

    if (currentHotel) {
      return res.json({
        success: true,
        hotelId: currentHotel.id,
        reply: `I am your 24/7 AI Concierge for **${currentHotel.name}** (${currentHotel.city}). I can check live room availability, lookup your stay, or connect you with our front desk staff. How may I assist you?`,
      });
    }

    return res.json({
      success: true,
      reply: `Namaste & Welcome to **LuckNexa Hotels & Resorts**! I am your 24/7 Hospitality Assistant. I can help you discover luxury hotels across India (Delhi, Mumbai, Kolkata, Udaipur), check live room availability, or look up your reservation. How may I assist you today?`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

async function askGemini(prompt, currentHotel = null, allHotels = [], history = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    let systemPrompt = "";

    if (currentHotel) {
      systemPrompt = `You are "Aura", the intelligent 24/7 AI Concierge for "${currentHotel.name}" in ${currentHotel.city} on the LuckNexa Hospitality Platform.
You are warm, polite, professional, and hospitable. You can communicate fluently in both English and Hindi/Hinglish based on the guest's language.
Hotel Details:
- Name: ${currentHotel.name}
- City: ${currentHotel.city}
- Address: ${currentHotel.address || currentHotel.city}
- Phone: ${currentHotel.phone || "+91 11 2611 0202"}
- Check-in: 02:00 PM, Check-out: 11:00 AM
- Amenities: 24/7 Room Service, High-speed Wi-Fi, Breakfast Buffet, Swimming Pool & Spa
- Banquets & Events: Available for weddings, conferences, and parties.`;
    } else {
      const hotelDescriptions = allHotels
        .map((h, i) => `${i + 1}. ${h.name} in ${h.city} (${h.address || h.city}, Phone: ${h.phone || ""})`)
        .join("\n");

      systemPrompt = `You are "Aura", the intelligent 24/7 AI Concierge for LuckNexa Hotels & Resorts Platform.
LuckNexa is a premier multi-hotel portal featuring luxury partner hotels across India:
${hotelDescriptions}

CRITICAL INSTRUCTIONS:
- When a guest inquires about any city (e.g. Udaipur, Delhi, Mumbai, Kolkata) or asks for recommendations, warmly introduce the specific LuckNexa property in that city (e.g. The Oberoi Udaivilas in Udaipur, Taj Palace in Delhi) with its key highlights, location, and luxury experience.
- If the guest greets (e.g. "hlo", "hi", "namaste"), welcome them to LuckNexa and ask which destination (Delhi, Mumbai, Kolkata, Udaipur) they wish to visit, or if they have an existing booking ID (e.g. RES-...).
- Be warm, hospitable, and descriptive. You speak fluent English and Hindi/Hinglish.`;
    }

    const conversationTurns = [];
    if (Array.isArray(history) && history.length > 0) {
      history.slice(-4).forEach((h) => {
        if (h.sender && h.text) {
          conversationTurns.push(`${h.sender === "user" ? "Guest" : "Aura"}: ${h.text}`);
        }
      });
    }

    const fullPrompt = conversationTurns.length > 0
      ? `${systemPrompt}\n\nRecent Conversation:\n${conversationTurns.join("\n")}\n\nGuest Query: ${prompt}`
      : `${systemPrompt}\n\nGuest Query: ${prompt}`;

    const candidateModels = [
      process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.7-flash",
    ];

    for (const modelName of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: fullPrompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 350,
            },
          }),
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }
      } catch (err) {
        console.warn(`Model ${modelName} failed, trying next...`);
      }
    }
  } catch (err) {
    console.error("Gemini API call failed:", err.message);
  }
  return null;
}

// --- AI Knowledge Base CRUD ---
router.get("/knowledge", async (req, res) => {
  try {
    const items = await AIKnowledge.find().sort({ category: 1 });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/knowledge", async (req, res) => {
  try {
    const item = await AIKnowledge.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete("/knowledge/:id", async (req, res) => {
  try {
    await AIKnowledge.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Knowledge base item deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// --- Human Escalation Request ---
router.post("/escalate", async (req, res) => {
  try {
    const { guestName, phone, roomNumber, reason } = req.body;
    const ticket = await Complaint.create({
      ticketNumber: `ESC-${Date.now().toString().slice(-4)}`,
      guestName: guestName || "Inquiring Guest",
      roomNumber: roomNumber || "Online AI Chat",
      category: "Human Agent Escalation",
      description: reason || "Guest requested live staff assistance via AI Chat",
      priority: "urgent",
      status: "open",
    });

    res.json({
      success: true,
      message: "Your request has been escalated. A duty manager has been notified and will contact you shortly.",
      ticket,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- AI Calling Agent Webhook (Vapi / OmniDimension) ---
router.post("/calls/webhook", async (req, res) => {
  try {
    const { leadPhone, transcript, summary, interestLevel, budget, preferredDates } = req.body;
    if (leadPhone) {
      await Lead.findOneAndUpdate(
        { phone: leadPhone },
        {
          status: interestLevel === "High" ? "Qualified" : "Contacted",
          notes: `[AI Call Summary]: ${summary || "Call completed"} (Interest: ${interestLevel || "Normal"})`,
        }
      );
    }

    res.json({ success: true, message: "AI Call recording and transcript ingested successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// --- Executive AI Business Assistant Briefing Suite ---
// ==========================================

/**
 * GET /api/ai/briefing/snapshot
 * Generates verified, multi-module business metrics snapshot
 */
router.get("/briefing/snapshot", identifyTenant, async (req, res) => {
  try {
    const orgId = req.tenant?.orgId || req.user?.orgId || "org-1";
    const orgName = req.user?.orgName || "Meridian Hotel Group";
    const period = req.query.period || "today";

    let hotelIds = [];
    if (req.query.hotelId) {
      hotelIds = [req.query.hotelId];
    } else if (req.user?.assignedHotelIds && req.user.assignedHotelIds.length > 0) {
      hotelIds = req.user.assignedHotelIds;
    } else if (req.tenant?.hotelId) {
      hotelIds = [req.tenant.hotelId];
    }

    const snapshot = await ExecutiveBriefingService.getExecutiveBriefingSnapshot({
      orgId,
      hotelIds,
      period,
      orgName,
    });

    return res.status(200).json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    console.error("Executive briefing snapshot error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/ai/briefing/narrate
 * Generates chapter-by-chapter voice narration script in Hindi/Hinglish/English
 */
router.post("/briefing/narrate", identifyTenant, async (req, res) => {
  try {
    const { language = "hinglish", period = "today" } = req.body;
    let snapshot = req.body.snapshot;

    if (!snapshot) {
      const orgId = req.tenant?.orgId || req.user?.orgId || "org-1";
      const orgName = req.user?.orgName || "Meridian Hotel Group";
      let hotelIds = req.user?.assignedHotelIds || (req.tenant?.hotelId ? [req.tenant.hotelId] : []);
      snapshot = await ExecutiveBriefingService.getExecutiveBriefingSnapshot({
        orgId,
        hotelIds,
        period,
        orgName,
      });
    }

    const narration = await ExecutiveBriefingService.generateBriefingNarration({
      snapshot,
      language,
    });

    return res.status(200).json({
      success: true,
      narration,
      snapshot,
    });
  } catch (error) {
    console.error("Executive briefing narration error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/ai/briefing/ask
 * Resolves mid-briefing voice/text questions grounded solely on verified snapshot
 */
router.post("/briefing/ask", identifyTenant, async (req, res) => {
  try {
    const { question, language = "hinglish", conversationHistory = [] } = req.body;
    let snapshot = req.body.snapshot;

    if (!question) {
      return res.status(400).json({ success: false, message: "Question is required" });
    }

    if (!snapshot) {
      const orgId = req.tenant?.orgId || req.user?.orgId || "org-1";
      const orgName = req.user?.orgName || "Meridian Hotel Group";
      let hotelIds = req.user?.assignedHotelIds || (req.tenant?.hotelId ? [req.tenant.hotelId] : []);
      snapshot = await ExecutiveBriefingService.getExecutiveBriefingSnapshot({
        orgId,
        hotelIds,
        period: "today",
        orgName,
      });
    }

    const result = await ExecutiveBriefingService.answerBriefingQuery({
      snapshot,
      query: question,
      language,
      conversationHistory,
    });

    return res.status(200).json({
      success: true,
      answer: result.answer,
      action: result.action,
      category: result.category,
      data: result.data,
    });
  } catch (error) {
    console.error("Executive briefing Q&A error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
