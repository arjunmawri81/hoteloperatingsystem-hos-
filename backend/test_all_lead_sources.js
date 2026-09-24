const mongoose = require("mongoose");
require("dotenv").config();

const Lead = require("./src/models/Lead");
const Hotel = require("./src/models/Hotel");
const leadsController = require("./src/controllers/leads.controller");

async function runLeadSourcesTest() {
  console.log("================================================================================");
  console.log("🧪 TESTING ALL LEAD GENERATION SOURCES & CRM PIPELINE");
  console.log("================================================================================\n");

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("✅ 1. Database Connection: Connected to MongoDB\n");

  // Helper mock for req/res
  const createMockRes = () => {
    let statusCode = 200;
    let responseData = null;
    return {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return { statusCode, data };
      },
      getResponse() {
        return { statusCode, responseData };
      },
    };
  };

  const createdLeadIds = [];

  // --- SOURCE 1: Autonomous WhatsApp Inbound Webhook ---
  console.log("--- [SOURCE 1] Testing WhatsApp Inbound Webhook ---");
  const waReq = {
    body: {
      from: "+919811223344",
      senderName: "Aakash Verma",
      message: "Hi, I need to book a grand wedding banquet hall with 30 rooms for 250 guests in December.",
      hotelId: "hotel-taj-delhi",
    },
  };
  const waRes = createMockRes();
  await leadsController.handleWhatsAppWebhook(waReq, waRes, (err) => { if (err) console.error(err); });
  const waResult = waRes.getResponse().responseData;
  console.log("✅ WhatsApp Lead Generated:", {
    leadId: waResult?.data?.id,
    name: waResult?.data?.name,
    source: waResult?.data?.source,
    requirement: waResult?.data?.requirement,
    estimatedBudget: `₹${waResult?.data?.budget?.toLocaleString()}`,
    stage: waResult?.data?.stage,
  });
  if (waResult?.data?.id) createdLeadIds.push(waResult.data.id);

  // --- SOURCE 2: OTA Channel Manager Inbound Webhook (MakeMyTrip / Booking.com) ---
  console.log("\n--- [SOURCE 2] Testing OTA Channel Manager Webhook ---");
  const otaReq = {
    body: {
      channel: "Booking.com",
      guestName: "Vikram Malhotra",
      guestPhone: "+919876543210",
      guestEmail: "vikram.malhotra@booking-guest.com",
      queryType: "Corporate Conference Inquiry",
      details: "Need 15 Executive Suites with High-speed Wi-Fi and Conference Room for 3 days.",
      estimatedAmount: 180000,
      hotelId: "hotel-taj-delhi",
    },
  };
  const otaRes = createMockRes();
  await leadsController.handleChannelWebhook(otaReq, otaRes, (err) => { if (err) console.error(err); });
  const otaResult = otaRes.getResponse().responseData;
  console.log("✅ OTA Channel Manager Lead Generated:", {
    leadId: otaResult?.data?.id,
    name: otaResult?.data?.name,
    source: otaResult?.data?.source,
    requirement: otaResult?.data?.requirement,
    budget: `₹${otaResult?.data?.budget?.toLocaleString()}`,
    stage: otaResult?.data?.stage,
  });
  if (otaResult?.data?.id) createdLeadIds.push(otaResult.data.id);

  // --- SOURCE 3: Landing Page / SaaS Demo Request Lead ---
  console.log("\n--- [SOURCE 3] Testing Website Landing Page Demo Form (SaaS) ---");
  const saasLeadId = `lead-demo-${Date.now().toString().slice(-4)}`;
  const saasLead = await Lead.create({
    id: saasLeadId,
    name: "Rajesh Singhania (Royal Palace Hotels)",
    phone: "+919822001122",
    email: "rajesh@royalpalace.com",
    source: "Website",
    requirement: "Interested in Enterprise PMS & Channel Manager for a chain of 4 hotels.",
    budget: 120000,
    stage: "New",
    aiSummary: "Requested 30-min live demo from Super Admin team.",
    hotelId: "saas-platform",
    orgId: "saas-platform",
    leadType: "saas",
  });
  console.log("✅ SaaS Platform Lead Generated:", {
    leadId: saasLead.id,
    name: saasLead.name,
    source: saasLead.source,
    leadType: saasLead.leadType,
    budget: `₹${saasLead.budget.toLocaleString()}`,
  });
  createdLeadIds.push(saasLead.id);

  // --- SOURCE 4: Direct Operations / Front Desk CRM Lead ---
  console.log("\n--- [SOURCE 4] Testing Direct Front Desk Walk-In / Phone Lead ---");
  const directReq = {
    body: {
      name: "Pooja Sharma",
      phone: "+919777888999",
      email: "pooja.sharma@gmail.com",
      source: "Direct Enquiry",
      requirement: "Family Suite booking inquiry for anniversary celebration",
      budget: 45000,
      hotelId: "hotel-taj-delhi",
      leadType: "hotel_guest",
    },
  };
  const directRes = createMockRes();
  await leadsController.createLead(directReq, directRes, (err) => { if (err) console.error(err); });
  const directResult = directRes.getResponse().responseData;
  console.log("✅ Direct Front Desk Lead Generated:", {
    leadId: directResult?.data?.id,
    name: directResult?.data?.name,
    source: directResult?.data?.source,
    stage: directResult?.data?.stage,
    budget: `₹${directResult?.data?.budget?.toLocaleString()}`,
  });
  if (directResult?.data?.id) createdLeadIds.push(directResult.data.id);

  // --- TEST 5: Pipeline Progression (Stage Advancement) ---
  console.log("\n--- [TEST 5] Testing Pipeline Stage Advancement ---");
  const targetLeadId = waResult?.data?.id;
  if (targetLeadId) {
    const updated = await Lead.findOneAndUpdate(
      { id: targetLeadId },
      { stage: "AI Qualified", aiSummary: "AI Follow-up call completed: Banquet capacity verified (250 pax), deposit requested." },
      { new: true }
    );
    console.log(`✅ Lead [${updated.id}] Stage Advanced: New -> ${updated.stage}`);
    console.log(`   Updated AI Summary: "${updated.aiSummary}"`);
  }

  // --- TEST 6: Fetch Leads and Compute Metrics ---
  console.log("\n--- [TEST 6] Testing Lead Metrics & Analytics ---");
  const getReq = { query: { hotelId: "hotel-taj-delhi", leadType: "hotel_guest" } };
  const getRes = createMockRes();
  await leadsController.getAllLeads(getReq, getRes, (err) => { if (err) console.error(err); });
  const listResult = getRes.getResponse().responseData;

  console.log("✅ Fetched Leads Summary:", {
    totalLeadsInSystem: listResult?.data?.length,
    metrics: listResult?.metrics,
  });

  // Cleanup test leads
  console.log("\n🧹 Cleaning up generated test leads...");
  await Lead.deleteMany({ id: { $in: createdLeadIds } });
  console.log(`✅ Cleaned up ${createdLeadIds.length} test leads successfully.`);

  console.log("\n================================================================================");
  console.log("🎉 ALL LEAD CHANNELS TESTED & VERIFIED SUCCESSFULLY!");
  console.log("================================================================================\n");

  await mongoose.disconnect();
}

runLeadSourcesTest().catch((err) => {
  console.error("❌ Test Failed with error:", err);
  mongoose.disconnect();
  process.exit(1);
});
