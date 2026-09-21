const express = require("express");
const AIConversation = require("../models/AIConversation");
const AIKnowledge = require("../models/AIKnowledge");
const AIToolsService = require("../services/aiTools.service");
const Complaint = require("../models/Complaint");
const Lead = require("../models/Lead");

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
 * Intelligent AI Receptionist with Live Database Tool Calling
 */
router.post("/chat", async (req, res) => {
  try {
    const { message, bookingId, guestPhone, hotelId = "hotel-101" } = req.body;
    const lower = (message || "").toLowerCase();

    // 1. Check if user is asking to lookup a booking
    if (bookingId || guestPhone || lower.includes("booking") || lower.includes("reservation") || lower.includes("res-")) {
      const match = message.match(/res-\d+/i);
      const queryId = bookingId || (match ? match[0].toUpperCase() : null);
      if (queryId || guestPhone) {
        const lookup = await AIToolsService.lookupBooking({ bookingId: queryId, guestPhone });
        if (lookup.found) {
          const b = lookup.booking;
          return res.json({
            success: true,
            reply: `Here are the details for Reservation **${b.id}**:\n- **Guest**: ${b.guestName}\n- **Room**: ${b.roomNumber} (${b.roomType})\n- **Dates**: ${b.checkIn} to ${b.checkOut}\n- **Status**: ${b.status.toUpperCase()}\n- **Total Bill**: ₹${b.totalAmount} (Paid: ₹${b.paidAmount})`,
            toolUsed: "lookupBooking",
            data: b,
          });
        }
      }
    }

    // 2. Check if message contains an inquiry with contact info or group/event inquiry (Auto-Capture Lead)
    const phoneMatch = message.match(/(?:\+?91[\s-]?)?[6-9]\d{9}/);
    const hasInquiryKeywords = lower.includes("wedding") || lower.includes("banquet") || lower.includes("event") || lower.includes("conference") || lower.includes("group") || lower.includes("call me") || lower.includes("quote") || lower.includes("enquiry") || lower.includes("inquiry") || lower.includes("rooms for");

    if (phoneMatch || (hasInquiryKeywords && (guestPhone || phoneMatch))) {
      const extractedPhone = phoneMatch ? phoneMatch[0].replace(/[\s-]/g, "") : (guestPhone || "+91 98000 00000");
      const testLeadId = `lead-chat-${Date.now().toString().slice(-4)}`;
      
      const newLead = await Lead.create({
        id: testLeadId,
        name: `Guest Inquiry (${extractedPhone.slice(-4)})`,
        phone: extractedPhone,
        email: "guest.chat@inquiry.com",
        source: "Website",
        requirement: message,
        budget: lower.includes("wedding") || lower.includes("banquet") ? 250000 : (lower.includes("group") ? 100000 : 35000),
        stage: "New",
        aiSummary: `[AI Web Chat Captured]: ${message}`,
        nextFollowUp: "Today, within 2 hours",
        hotelId: hotelId || "hotel-taj-delhi",
      });

      return res.json({
        success: true,
        reply: `🙏 Thank you! Your inquiry has been successfully captured and registered with our sales desk.\n\n📋 **Inquiry ID**: ${newLead.id}\n📞 **Contact**: ${extractedPhone}\n💼 **Status**: Assigned to Reservations Team.\n\nA reservations manager will contact you shortly with the best custom quote!`,
        toolUsed: "captureLead",
        data: newLead,
      });
    }

    // 3. Check if user is asking about Room Availability / Rates
    if (lower.includes("available") || lower.includes("room") || lower.includes("rate") || lower.includes("price") || lower.includes("book")) {
      const avail = await AIToolsService.checkAvailability({ hotelId });
      const summary = avail.roomTypes.map((t) => `• **${t.type}**: ₹${t.rate}/night (${t.count} available)`).join("\n");
      return res.json({
        success: true,
        reply: `We currently have **${avail.totalAvailable} rooms** available:\n${summary}\n\nWould you like me to reserve a room or send a quote? (Share your phone number for instant booking assistance!)`,
        toolUsed: "checkAvailability",
        data: avail,
      });
    }

    // 4. Search Knowledge Base
    const kbAnswer = await AIToolsService.searchKnowledgeBase(message, hotelId);
    if (kbAnswer) {
      return res.json({
        success: true,
        reply: kbAnswer,
        toolUsed: "searchKnowledgeBase",
      });
    }

    // 5. Fallback contextual reply
    return res.json({
      success: true,
      reply: `I am your 24/7 AI Concierge for Meridian Hotels. I can check live room availability, lookup your reservation, capture your booking requirement, or connect you with front desk staff. How may I assist you?`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

module.exports = router;
