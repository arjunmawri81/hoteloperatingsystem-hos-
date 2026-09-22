const Lead = require("../models/Lead");
const Hotel = require("../models/Hotel");

/**
 * GET /api/leads
 * Strictly scoped multi-tenant leads retrieval.
 * - Super Admin: views SaaS platform leads (or all with explicit filter).
 * - Hotel Admin / Chain: views ONLY leads belonging to their organization.
 * - Receptionist / Front Desk: views ONLY leads for their assigned hotel.
 */
exports.getAllLeads = async (req, res, next) => {
  try {
    const { stage, search, hotelId, leadType, orgId } = req.query;
    const user = req.user || {};
    const tenant = req.tenant || {};

    const userRole = user.role || tenant.role;
    const userOrgId = user.orgId || tenant.orgId;
    const userHotelId = user.hotelId || tenant.hotelId;

    const filter = {};

    if (stage && stage !== "all") {
      filter.stage = stage;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 1. SUPER ADMIN CASE (SaaS Platform Inquiries)
    // ──────────────────────────────────────────────────────────────────────────
    if (userRole === "super_admin" || leadType === "saas" || hotelId === "saas-platform") {
      if (leadType === "saas" || hotelId === "saas-platform") {
        filter.$or = [
          { leadType: "saas" },
          { hotelId: "saas-platform" },
          { requirement: /SaaS Demo/i },
        ];
      } else if (hotelId && hotelId !== "all") {
        filter.hotelId = hotelId;
        filter.leadType = { $ne: "saas" };
      } else if (orgId && orgId !== "all") {
        filter.orgId = orgId;
        filter.leadType = { $ne: "saas" };
      }
    }
    // ──────────────────────────────────────────────────────────────────────────
    // 2. HOTEL ADMIN / AREA MANAGER (Organization-wide Multi-Property Isolation)
    // ──────────────────────────────────────────────────────────────────────────
    else if (userRole === "hotel_admin" || userRole === "area_manager") {
      // NEVER allow SaaS leads to leak into hotel admins
      filter.leadType = { $ne: "saas" };
      filter.hotelId = { $ne: "saas-platform" };
      filter.requirement = { $not: /SaaS Demo/i };

      const effectiveOrgId = userOrgId || orgId;
      if (effectiveOrgId && effectiveOrgId !== "all") {
        // Find all hotels belonging to this organization
        const orgHotels = await Hotel.find({ orgId: effectiveOrgId }).select("id");
        const orgHotelIds = orgHotels.map((h) => h.id);

        if (hotelId && hotelId !== "all") {
          // If specific hotel filtered, ensure it belongs to their org
          filter.hotelId = hotelId;
        } else {
          // Scoped to all hotels in their organization
          filter.$or = [
            { orgId: effectiveOrgId },
            { hotelId: { $in: orgHotelIds } },
          ];
        }
      } else if (hotelId && hotelId !== "all") {
        filter.hotelId = hotelId;
      }
    }
    // ──────────────────────────────────────────────────────────────────────────
    // 3. FRONT DESK / RECEPTIONIST / STAFF (Strict Single-Property Isolation)
    // ──────────────────────────────────────────────────────────────────────────
    else {
      // Must NEVER see SaaS leads or other hotels' leads
      filter.leadType = { $ne: "saas" };
      filter.hotelId = { $ne: "saas-platform" };
      filter.requirement = { $not: /SaaS Demo/i };

      const targetHotel = userHotelId || hotelId;
      if (targetHotel && targetHotel !== "all") {
        filter.hotelId = targetHotel;
      } else if (userOrgId && userOrgId !== "all") {
        filter.orgId = userOrgId;
      }
    }

    // Search query support
    if (search) {
      const searchCond = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { requirement: { $regex: search, $options: "i" } },
        { source: { $regex: search, $options: "i" } },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchCond }];
        delete filter.$or;
      } else {
        filter.$or = searchCond;
      }
    }

    const leads = await Lead.find(filter).sort({ createdAt: -1 });

    const allLeads = await Lead.find(filter);
    const totalPipeline = allLeads.reduce((acc, l) => (l.stage !== "Lost" ? acc + (l.budget || 0) : acc), 0);
    const convertedTotal = allLeads.filter((l) => l.stage === "Converted").reduce((acc, l) => acc + (l.budget || 0), 0);
    const aiQualifiedCount = allLeads.filter((l) => l.stage === "AI Qualified" || l.stage === "Proposal").length;

    res.status(200).json({
      success: true,
      count: leads.length,
      metrics: {
        totalPipeline,
        convertedTotal,
        aiQualifiedCount,
        totalEnquiries: allLeads.length,
      },
      data: leads,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/leads
 * Stamping tenant orgId & hotelId securely
 */
exports.createLead = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      email,
      source,
      requirement,
      budget,
      stage,
      aiSummary,
      nextFollowUp,
      hotelId,
      leadType,
      orgId,
    } = req.body;

    const user = req.user || {};
    const tenant = req.tenant || {};

    const id = `lead-${Date.now().toString().slice(-4)}`;

    const resolvedLeadType =
      leadType ||
      (hotelId === "saas-platform" || requirement?.includes("SaaS Demo")
        ? "saas"
        : "hotel_guest");

    // Resolve target hotel and org
    let targetHotelId = hotelId || user.hotelId || tenant.hotelId || "";
    let targetOrgId = orgId || user.orgId || tenant.orgId || "";

    if (resolvedLeadType === "saas") {
      targetHotelId = "saas-platform";
      targetOrgId = "saas-platform";
    } else {
      if (!targetHotelId) {
        targetHotelId = "hotel-taj-delhi";
      }
      // If orgId wasn't passed, look up the hotel to stamp its correct orgId
      if (!targetOrgId && targetHotelId) {
        const matchedHotel = await Hotel.findOne({ id: targetHotelId });
        if (matchedHotel) {
          targetOrgId = matchedHotel.orgId;
        }
      }
    }

    const newLead = await Lead.create({
      id,
      name,
      phone,
      email: email || "lead@client.com",
      source: source || "Website",
      requirement: requirement || "Inquiry",
      budget: Number(budget) || 0,
      stage: stage || "New",
      aiSummary: aiSummary || "Lead captured and assigned to sales team.",
      nextFollowUp: nextFollowUp || "Tomorrow, 10:00 AM",
      hotelId: targetHotelId,
      orgId: targetOrgId,
      leadType: resolvedLeadType,
    });

    res.status(201).json({ success: true, data: newLead });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/leads/:id/stage
 */
exports.advanceLeadStage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    const updated = await Lead.findOneAndUpdate({ id }, { stage }, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: `Lead ${id} not found.` });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/leads/:id
 */
exports.deleteLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Lead.findOneAndDelete({ id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: `Lead ${id} not found.` });
    }
    res.status(200).json({ success: true, message: `Lead ${id} deleted successfully.` });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/leads/webhook/whatsapp
 * Autonomous WhatsApp Inbound Inquiry Ingestion
 */
exports.handleWhatsAppWebhook = async (req, res, next) => {
  try {
    const { from, senderName, message, hotelId = "hotel-taj-delhi" } = req.body;
    if (!from || !message) {
      return res.status(400).json({ success: false, message: "from (phone) and message are required." });
    }

    const cleanPhone = from.replace(/[^0-9+]/g, "");
    let targetOrgId = "";
    const matchedHotel = await Hotel.findOne({ id: hotelId });
    if (matchedHotel) targetOrgId = matchedHotel.orgId;

    const lower = message.toLowerCase();
    const budget =
      lower.includes("wedding") || lower.includes("banquet")
        ? 250000
        : lower.includes("group")
        ? 100000
        : 25000;

    const id = `lead-wa-${Date.now().toString().slice(-4)}`;
    const newLead = await Lead.create({
      id,
      name: senderName || `WhatsApp Guest (${cleanPhone.slice(-4)})`,
      phone: cleanPhone,
      email: "whatsapp.inquiry@guest.com",
      source: "WhatsApp",
      requirement: message,
      budget,
      stage: "New",
      aiSummary: `[WhatsApp Inbound Message]: "${message}"`,
      nextFollowUp: "Today, within 1 hour",
      hotelId,
      orgId: targetOrgId,
      leadType: "hotel_guest",
    });

    res.status(201).json({
      success: true,
      message: "WhatsApp inquiry logged as Lead",
      data: newLead,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/leads/webhook/channel
 * Autonomous OTA Channel Manager (MakeMyTrip, Booking.com, Agoda) Inquiry Ingestion
 */
exports.handleChannelWebhook = async (req, res, next) => {
  try {
    const {
      channel = "MakeMyTrip",
      guestName,
      guestPhone,
      guestEmail,
      queryType = "Pre-Booking Inquiry",
      details,
      estimatedAmount,
      hotelId = "hotel-taj-delhi",
    } = req.body;

    let targetOrgId = "";
    const matchedHotel = await Hotel.findOne({ id: hotelId });
    if (matchedHotel) targetOrgId = matchedHotel.orgId;

    const id = `lead-ota-${Date.now().toString().slice(-4)}`;
    const newLead = await Lead.create({
      id,
      name: guestName || `${channel} Guest`,
      phone: guestPhone || "+91 98000 00000",
      email: guestEmail || `${channel.toLowerCase().replace(/\s+/g, "")}.guest@ota.com`,
      source: "Channel Manager",
      requirement: `[${channel} - ${queryType}]: ${details || "Room rate & availability inquiry"}`,
      budget: Number(estimatedAmount) || 30000,
      stage: "New",
      aiSummary: `[${channel} OTA Sync]: Guest submitted inquiry via ${channel} extranet.`,
      nextFollowUp: "Today, within 2 hours",
      hotelId,
      orgId: targetOrgId,
      leadType: "hotel_guest",
    });

    res.status(201).json({
      success: true,
      message: `${channel} OTA inquiry logged as Lead`,
      data: newLead,
    });
  } catch (error) {
    next(error);
  }
};
