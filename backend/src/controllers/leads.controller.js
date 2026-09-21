const Lead = require("../models/Lead");

exports.getAllLeads = async (req, res, next) => {
  try {
    const { stage, search, hotelId } = req.query;
    const filter = {};
    if (stage && stage !== "all") {
      filter.stage = stage;
    }
    if (hotelId && hotelId !== "all") {
      filter.hotelId = hotelId;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { requirement: { $regex: search, $options: "i" } },
        { source: { $regex: search, $options: "i" } },
      ];
    }
    const leads = await Lead.find(filter).sort({ createdAt: -1 });

    const metricFilter = (hotelId && hotelId !== "all") ? { hotelId } : {};
    const allLeads = await Lead.find(metricFilter);
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

exports.createLead = async (req, res, next) => {
  try {
    const { name, phone, email, source, requirement, budget, stage, aiSummary, nextFollowUp, hotelId } = req.body;
    const id = `lead-${Date.now().toString().slice(-4)}`;

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
      hotelId: hotelId || (req.user && req.user.hotelId) || "hotel-taj-delhi",
    });
    res.status(201).json({ success: true, data: newLead });
  } catch (error) {
    next(error);
  }
};

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
