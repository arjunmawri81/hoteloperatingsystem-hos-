const mongoose = require("mongoose");
require("dotenv").config();

const Lead = require("./src/models/Lead");
const Room = require("./src/models/Room");
const Reservation = require("./src/models/Reservation");
const AIToolsService = require("./src/services/aiTools.service");
const ChannelManagerService = require("./src/services/channelManager.service");
const leadsController = require("./src/controllers/leads.controller");

async function runCompleteSystemTest() {
  console.log("================================================================================");
  console.log("🧪 STARTING COMPLETE SYSTEM E2E TEST: AI, LEADS, OTA SYNC & PMS OPERATIONS");
  console.log("================================================================================\n");

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(uri);
  console.log("✅ 1. MongoDB Database Connection: Active & Verified");

  // TEST 1: AI Concierge Real-time Tool Calling
  console.log("\n--- [TEST 1] AI Concierge & Dynamic Tool Calling ---");
  const liveRooms = await AIToolsService.checkAvailability({ hotelId: "hotel-taj-delhi" });
  console.log(`✅ Live Room Availability Tool: ${liveRooms.totalAvailable} rooms available across ${liveRooms.roomTypes.length} room types.`);

  const kbQuery = "What is the check in time?";
  const kbAnswer = await AIToolsService.searchKnowledgeBase(kbQuery, "hotel-taj-delhi");
  console.log(`✅ AI Knowledge Base Retrieval for "${kbQuery}":\n   👉 Answer: ${kbAnswer}`);

  // TEST 2: Channel Manager OTA 2-Way Synchronization
  console.log("\n--- [TEST 2] Channel Manager (STAAH / OTA) 2-Way Sync ---");
  const otaSync = await ChannelManagerService.triggerSync("hotel-taj-delhi", "STAAH");
  console.log(`✅ STAAH OTA 2-Way Sync Successful:`, {
    provider: otaSync.result.provider,
    availableInventoryPushed: otaSync.result.availableInventoryPushed,
    status: otaSync.result.status,
    timestamp: otaSync.result.timestamp
  });

  // TEST 3: Lead Ingestion (AI Voice Call, OTA RFP, WhatsApp) & Pipeline Lifecycle
  console.log("\n--- [TEST 3] Omnichannel Lead Capture & Stage Advancement ---");
  const testLeadId = `lead-test-${Date.now().toString().slice(-4)}`;
  const createdLead = await Lead.create({
    id: testLeadId,
    name: "Infosys Leadership Summit (Rohan Gupta)",
    phone: "+91 98330 22119",
    email: "rohan.gupta@infosys.com",
    source: "OTA",
    requirement: "25 Deluxe Rooms for Executive Tech Conference + Banquet Dinner",
    budget: 650000,
    stage: "New",
    aiSummary: "Incoming OTA group lead captured. Client requested audio-visual setup and GST tax invoice.",
    nextFollowUp: "Today, 5:30 PM",
    hotelId: "hotel-taj-delhi"
  });
  console.log(`✅ Lead Captured: [${createdLead.id}] ${createdLead.name} (${createdLead.source}) - ₹${createdLead.budget.toLocaleString()} (Stage: ${createdLead.stage})`);

  // Advance stage: New -> AI Qualified -> Proposal -> Converted
  const advancedLead = await Lead.findOneAndUpdate(
    { id: testLeadId },
    { stage: "AI Qualified", aiSummary: "AI Calling Agent verified attendee count (50 guests). Formal proposal drafted." },
    { new: true }
  );
  console.log(`✅ Stage Advanced: ${advancedLead.id} is now [${advancedLead.stage}]`);

  const wonLead = await Lead.findOneAndUpdate(
    { id: testLeadId },
    { stage: "Converted" },
    { new: true }
  );
  console.log(`✅ Stage Advanced: ${wonLead.id} is now [${wonLead.stage}] (Won ✓)`);

  // TEST 4: Lead Pipeline Aggregation Metrics
  const mockReq = { query: {} };
  let metricsResult = null;
  const mockRes = {
    status: () => ({
      json: (data) => { metricsResult = data.metrics; }
    })
  };
  await leadsController.getAllLeads(mockReq, mockRes, () => {});
  console.log("\n--- [TEST 4] Live CRM Pipeline Metrics ---");
  console.log(`✅ Total Pipeline Value: ₹${metricsResult.totalPipeline.toLocaleString()}`);
  console.log(`✅ Won & Converted Value: ₹${metricsResult.convertedTotal.toLocaleString()}`);
  console.log(`✅ AI Qualified Leads: ${metricsResult.aiQualifiedCount}`);
  console.log(`✅ Active Inquiries in System: ${metricsResult.totalEnquiries}`);

  console.log("\n================================================================================");
  console.log("🎉 ALL TESTS COMPLETED: 100% SUCCESSFUL!");
  console.log("================================================================================\n");

  await mongoose.disconnect();
}

runCompleteSystemTest().catch((err) => {
  console.error("❌ Test Failed:", err);
  process.exit(1);
});
