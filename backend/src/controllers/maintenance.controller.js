const MaintenanceRequest = require("../models/MaintenanceRequest");
const LostAndFound = require("../models/LostAndFound");
const Room = require("../models/Room");

// Get all maintenance requests
exports.getMaintenanceRequests = async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find().sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a maintenance request (and update room to maintenance if critical)
exports.createMaintenanceRequest = async (req, res) => {
  try {
    const count = await MaintenanceRequest.countDocuments();
    const ticketId = `MNT-${2000 + count + 1}`;
    const desc = req.body.issueDescription || req.body.description || "Issue reported by guest";
    const priority = req.body.priority === "urgent" ? "critical" : req.body.priority || "high";

    const request = await MaintenanceRequest.create({
      ...req.body,
      issueDescription: desc,
      priority,
      ticketId,
    });

    if (req.body.roomNumber && (priority === "critical" || priority === "urgent")) {
      await Room.findOneAndUpdate(
        { number: { $in: [req.body.roomNumber, `Room ${req.body.roomNumber}`] } },
        { status: "maintenance" }
      );
    }

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update maintenance status
exports.updateMaintenanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;
    const update = { status, resolutionNotes };
    if (status === "resolved") {
      update.resolvedAt = new Date();
    }
    const updated = await MaintenanceRequest.findByIdAndUpdate(id, update, { new: true });

    // If resolved, return room to 'dirty' or 'clean'
    if (status === "resolved" && updated && updated.roomNumber) {
      await Room.findOneAndUpdate({ number: updated.roomNumber }, { status: "dirty" });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get Lost & Found items
exports.getLostAndFound = async (req, res) => {
  try {
    const items = await LostAndFound.find().sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Record a Lost & Found item
exports.createLostAndFound = async (req, res) => {
  try {
    const count = await LostAndFound.countDocuments();
    const itemId = `LF-${5000 + count + 1}`;
    const item = await LostAndFound.create({
      ...req.body,
      itemId,
    });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Claim a Lost & Found item
exports.claimLostAndFound = async (req, res) => {
  try {
    const { id } = req.params;
    const { claimedByGuest, claimedContact } = req.body;
    const item = await LostAndFound.findByIdAndUpdate(
      id,
      {
        status: "claimed",
        claimedByGuest,
        claimedContact,
        claimedDate: new Date(),
      },
      { new: true }
    );
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
