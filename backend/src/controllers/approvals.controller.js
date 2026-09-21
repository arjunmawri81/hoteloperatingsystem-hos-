const ApprovalRequest = require("../models/ApprovalRequest");

// Get all approval requests
exports.getApprovals = async (req, res) => {
  try {
    const { status, hotelId, orgId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (hotelId) filter.hotelId = hotelId;
    if (orgId) filter.orgId = orgId;
    const approvals = await ApprovalRequest.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: approvals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create an approval request
exports.createApproval = async (req, res) => {
  try {
    const request = await ApprovalRequest.create(req.body);
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Act on an approval request (Approve / Reject)
exports.actOnApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, decisionNotes, decisionBy } = req.body; // action: 'approved' | 'rejected'
    const updated = await ApprovalRequest.findByIdAndUpdate(
      id,
      {
        status: action.toLowerCase(),
        decisionNotes,
        decisionBy: decisionBy || "Area Manager",
        decidedAt: new Date(),
      },
      { new: true }
    );
    res.json({ success: true, message: `Request successfully ${action}`, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
