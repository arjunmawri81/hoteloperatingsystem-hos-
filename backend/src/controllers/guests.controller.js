const Guest = require("../models/Guest");
const Complaint = require("../models/Complaint");
const Reservation = require("../models/Reservation");

exports.getAllGuests = async (req, res, next) => {
  try {
    const { segment, search, orgId } = req.query;
    const filter = {};

    const userRole = req.user?.role || req.tenant?.role;
    let targetOrgId = req.user?.orgId || req.tenant?.orgId;
    if (userRole === "super_admin") {
      targetOrgId = orgId || req.tenant?.orgId || null;
    } else if (!targetOrgId && orgId && orgId !== "all" && orgId !== "org-1") {
      targetOrgId = orgId;
    }

    if (userRole === "super_admin" && !targetOrgId) {
      // super_admin sees all
    } else if (targetOrgId && targetOrgId !== "all") {
      filter.orgId = targetOrgId;
    } else if (userRole && userRole !== "super_admin") {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    if (segment && segment !== "all") {
      filter.segment = segment;
    }
    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      const searchCondition = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { preferences: searchRegex },
      ];
      filter.$or = searchCondition;
    }
    const guests = await Guest.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: guests.length, data: guests });
  } catch (error) {
    next(error);
  }
};

exports.lookupGuestByPhone = async (req, res, next) => {
  try {
    const { phone } = req.query;
    if (!phone || phone.length < 5) {
      return res.status(400).json({ success: false, message: "Valid phone number required" });
    }

    // Check Guest CRM
    const guest = await Guest.findOne({ phone: { $regex: phone.replace(/[^0-9]/g, ""), $options: "i" } });
    // Check past reservation
    const lastResv = await Reservation.findOne({ guestPhone: { $regex: phone.replace(/[^0-9]/g, ""), $options: "i" } }).sort({ createdAt: -1 });

    if (!guest && !lastResv) {
      return res.status(200).json({ success: true, exists: false, data: null });
    }

    return res.status(200).json({
      success: true,
      exists: true,
      data: {
        name: guest?.name || lastResv?.guestName || "",
        email: guest?.email || lastResv?.guestEmail || "",
        phone: guest?.phone || lastResv?.guestPhone || phone,
        idType: lastResv?.idType || "Aadhaar",
        idNumber: lastResv?.idNumber || "",
        corporateName: lastResv?.corporateName || "",
        corporateGstin: lastResv?.corporateGstin || "",
        staysCount: guest?.stays || 1,
        preferences: guest?.preferences || "",
        isVip: guest?.segment === "VIP",
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createGuest = async (req, res, next) => {
  try {
    const { name, email, phone, stays, totalSpend, segment, preferences, notes } = req.body;
    const id = `gst-${Date.now().toString().slice(-4)}`;
    const newGuest = await Guest.create({
      id,
      name,
      email: email || "guest@example.com",
      phone,
      stays: Number(stays) || 1,
      totalSpend: Number(totalSpend) || 0,
      segment: segment || "New",
      preferences: preferences || "Standard preferences",
      notes: notes || "Registered at front desk",
    });
    res.status(201).json({ success: true, data: newGuest });
  } catch (error) {
    next(error);
  }
};

// Guest Stays History
exports.getGuestHistory = async (req, res) => {
  try {
    const { guestName } = req.params;
    const reservations = await Reservation.find({
      guestName: new RegExp(guestName, "i"),
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: reservations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Complaint Management ---
exports.getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.json({ success: true, data: complaints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createComplaint = async (req, res) => {
  try {
    const count = await Complaint.countDocuments();
    const ticketNumber = `TKT-${8000 + count + 1}`;
    const complaint = await Complaint.create({
      ...req.body,
      ticketNumber,
    });
    res.status(201).json({ success: true, data: complaint });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;
    const update = { status, resolutionNotes };
    if (status === "resolved" || status === "closed") {
      update.resolvedAt = new Date();
    }
    const updated = await Complaint.findByIdAndUpdate(id, update, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
