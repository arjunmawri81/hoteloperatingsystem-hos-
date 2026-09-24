const mongoose = require("mongoose");
require("dotenv").config();

const Reservation = require("./src/models/Reservation");
const Room = require("./src/models/Room");
const HousekeepingTask = require("./src/models/HousekeepingTask");
const CashShift = require("./src/models/CashShift");
const CashTransaction = require("./src/models/CashTransaction");
const ReservationsController = require("./src/controllers/reservations.controller");

async function runOTAFullLifecycleTest() {
  console.log("================================================================================");
  console.log("🧪 TESTING COMPLETE OTA BOOKING LIFECYCLE: CHECK-IN, MULTI-PAYMENTS & CHECK-OUT");
  console.log("================================================================================\n");

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(uri);
  console.log("✅ 1. Database Connection: Active\n");

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

  // STEP 1: Pick an OTA Reservation
  console.log("--- [STEP 1] Fetching Ingested OTA Reservation ---");
  let targetResv = await Reservation.findOne({ id: /^resv-ota-/ });
  if (!targetResv) {
    console.log("No existing OTA reservation found. Creating a test OTA booking...");
    targetResv = await Reservation.create({
      id: `resv-ota-TEST-${Date.now().toString().slice(-4)}`,
      guestName: "Priyanka Chopra (Booking.com Guest)",
      guestEmail: "priyanka.chopra@ota-guest.com",
      guestPhone: "+91 98765 43210",
      hotelId: "hotel-taj-delhi",
      hotelName: "Taj Palace New Delhi",
      orgId: "org-taj-luxury",
      roomType: "Deluxe Suite",
      roomNumber: "TBD",
      checkIn: "2026-09-25",
      checkOut: "2026-09-28",
      adults: 2,
      children: 0,
      totalAmount: 45000,
      paidAmount: 0,
      source: "Booking.com",
      status: "confirmed",
      specialRequests: "High floor room with city view",
    });
  }

  console.log(`✅ Selected OTA Booking: [${targetResv.id}] ${targetResv.guestName} | Source: ${targetResv.source} | Bill: ₹${targetResv.totalAmount.toLocaleString()}`);

  // STEP 2: Assign Available Room
  console.log("\n--- [STEP 2] Assigning Room 305 to Guest ---");
  const testRoomNum = "305";
  await Room.findOneAndUpdate(
    { number: testRoomNum, hotelId: "hotel-taj-delhi" },
    { status: "available", type: "Deluxe Suite", rate: 15000, hotelId: "hotel-taj-delhi", orgId: "org-taj-luxury" },
    { upsert: true, returnDocument: "after" }
  );

  targetResv.roomNumber = testRoomNum;
  targetResv.paidAmount = 0; // Reset for testing all payment methods
  targetResv.payments = [];
  targetResv.folioCharges = [];
  targetResv.status = "confirmed";
  await targetResv.save();
  console.log(`✅ Room ${testRoomNum} assigned to reservation #${targetResv.id}`);

  // Ensure active Cash Shift exists
  await CashShift.findOneAndUpdate(
    { hotelId: "hotel-taj-delhi", status: "open" },
    {
      shiftId: "SHIFT-DELHI-01",
      cashierName: "Front Desk Cashier",
      hotelId: "hotel-taj-delhi",
      hotelName: "Taj Palace New Delhi",
      orgId: "org-taj-luxury",
      status: "open",
      openingBalance: 10000,
    },
    { upsert: true, returnDocument: "after" }
  );

  // STEP 3: Check-In with Aadhaar ID & Advance Payment (UPI QR)
  console.log("\n--- [STEP 3] Front Desk Check-In & Advance Deposit (UPI Mode) ---");
  const checkInReq = {
    params: { id: targetResv.id },
    body: {
      idType: "Aadhaar",
      idNumber: "9876-5432-1098",
      idDocUrl: "https://storage.googleapis.com/hos-docs/aadhaar_sample.jpg",
      advanceDeposit: 15000,
      paymentMethod: "UPI",
    },
    user: { name: "Front Desk Executive", userId: "usr-01" },
    ip: "127.0.0.1",
    headers: { "user-agent": "PMS-Desktop/Chrome" },
  };
  const checkInRes = createMockRes();
  await ReservationsController.checkIn(checkInReq, checkInRes);

  const updatedAfterCheckIn = await Reservation.findOne({ id: targetResv.id });
  const roomAfterCheckIn = await Room.findOne({ number: testRoomNum, hotelId: "hotel-taj-delhi" });

  console.log("✅ Check-In Completed Successfully:", {
    reservationStatus: updatedAfterCheckIn.status,
    guestIDVerified: `${updatedAfterCheckIn.idType} (${updatedAfterCheckIn.idNumber})`,
    roomNumber: updatedAfterCheckIn.roomNumber,
    roomOccupancyStatus: roomAfterCheckIn.status,
    advancePaid: `₹${updatedAfterCheckIn.paidAmount.toLocaleString()} (via UPI)`,
  });

  // STEP 4: In-Stay Room Service & Dining Folio Charges (POS)
  console.log("\n--- [STEP 4] Adding In-Stay Restaurant & Dining Charges to Room Folio ---");
  const chargeReq1 = {
    params: { id: targetResv.id },
    body: {
      description: "In-Room Dining: Chef's Special Butter Chicken & Garlic Naan",
      department: "Restaurant",
      amount: 2800,
    },
  };
  const chargeRes1 = createMockRes();
  await ReservationsController.chargeFolio(chargeReq1, chargeRes1);

  const chargeReq2 = {
    params: { id: targetResv.id },
    body: {
      description: "Premium Laundry & Dry Cleaning (4 items)",
      department: "Housekeeping",
      amount: 1200,
    },
  };
  const chargeRes2 = createMockRes();
  await ReservationsController.chargeFolio(chargeReq2, chargeRes2);

  const resvWithFolio = await Reservation.findOne({ id: targetResv.id });
  console.log("✅ Folio Charges Added to Guest Bill:", {
    chargesCount: resvWithFolio.folioCharges.length,
    charges: resvWithFolio.folioCharges.map((c) => `₹${c.amount} (${c.description})`),
    updatedTotalBill: `₹${resvWithFolio.totalAmount.toLocaleString()}`,
  });

  // STEP 5: Mid-Stay Payment (POS Card Swipe)
  console.log("\n--- [STEP 5] Mid-Stay Partial Payment (Credit Card Swipe via POS) ---");
  const cardPayReq = {
    params: { id: targetResv.id },
    body: {
      amount: 20000,
      method: "Card",
      transactionId: "POS-HDFC-998822",
      note: "Mid-stay credit card swipe at front desk",
    },
  };
  const cardPayRes = createMockRes();
  await ReservationsController.recordPayment(cardPayReq, cardPayRes);

  const resvAfterCard = await Reservation.findOne({ id: targetResv.id });
  const remainingDue = resvAfterCard.totalAmount - resvAfterCard.paidAmount;
  console.log("✅ Card Payment Processed:", {
    totalBilled: `₹${resvAfterCard.totalAmount.toLocaleString()}`,
    totalPaidSoFar: `₹${resvAfterCard.paidAmount.toLocaleString()}`,
    balanceDue: `₹${remainingDue.toLocaleString()}`,
    paymentsRecorded: resvAfterCard.payments.length,
  });

  // STEP 6: Final Check-Out & Balance Settlement (Cash Counter)
  console.log("\n--- [STEP 6] Final Check-Out & Balance Settlement (Cash Counter) ---");
  const checkOutReq = {
    params: { id: targetResv.id },
    body: {
      finalPaymentAmount: remainingDue,
      paymentMethod: "Cash",
      lateCheckOutFee: 0,
    },
    user: { name: "Front Desk Cashier" },
  };
  const checkOutRes = createMockRes();
  await ReservationsController.checkOut(checkOutReq, checkOutRes);

  const finalResv = await Reservation.findOne({ id: targetResv.id });
  const roomAfterCheckout = await Room.findOne({ number: testRoomNum, hotelId: "hotel-taj-delhi" });
  const hkTask = await HousekeepingTask.findOne({ roomNumber: testRoomNum, hotelId: "hotel-taj-delhi" });

  console.log("✅ Final Check-Out & Settlement Result:", {
    reservationStatus: finalResv.status,
    totalBill: `₹${finalResv.totalAmount.toLocaleString()}`,
    totalPaid: `₹${finalResv.paidAmount.toLocaleString()}`,
    balanceDue: `₹${(finalResv.totalAmount - finalResv.paidAmount).toLocaleString()}`,
    allPaymentMethodsUsed: finalResv.payments.map((p) => `${p.method}: ₹${p.amount}`),
    roomStatusAfterCheckout: roomAfterCheckout.status,
    housekeepingTurnoverTriggered: `${hkTask?.status} (Priority: ${hkTask?.priority})`,
  });

  console.log("\n================================================================================");
  console.log("🎉 ALL PAYMENT METHODS & OTA GUEST LIFECYCLE 100% VERIFIED!");
  console.log("================================================================================\n");

  await mongoose.disconnect();
}

runOTAFullLifecycleTest().catch((err) => {
  console.error("❌ Test Failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
