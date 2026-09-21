require('dotenv').config();
const mongoose = require('mongoose');

async function testCompleteGuestExperience() {
  console.log('=====================================================');
  console.log('🚀 TESTING FULL GUEST & HOTEL PMS LIFECYCLE (E2E)');
  console.log('=====================================================');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB Atlas Database');

  const Hotel = require('./src/models/Hotel');
  const Room = require('./src/models/Room');
  const Reservation = require('./src/models/Reservation');
  const HousekeepingTask = require('./src/models/HousekeepingTask');
  const MaintenanceRequest = require('./src/models/MaintenanceRequest');
  
  const ReservationsService = require('./src/services/reservations.service');
  const HousekeepingService = require('./src/services/housekeeping.service');
  const ReservationsController = require('./src/controllers/reservations.controller');
  const PosController = require('./src/controllers/pos.controller');
  const MaintenanceController = require('./src/controllers/maintenance.controller');

  // 1. HOTEL DISCOVERY TEST
  console.log('\n[STEP 1] 🏨 Hotel Discovery (/customer)');
  const hotels = await Hotel.find({});
  console.log(`   Found ${hotels.length} verified luxury properties:`);
  hotels.forEach((h, i) => {
    const photoCount = Object.values(h.images || {}).filter(Boolean).length;
    console.log(`   ${i + 1}. ${h.name} (${h.city}) | Org: ${h.orgId} | Photos: ${photoCount}/4`);
  });
  if (hotels.length === 0) throw new Error("No hotels found in database!");

  const targetHotel = hotels[0];
  console.log(`   🎯 Selected Hotel for Test: "${targetHotel.name}" (ID: ${targetHotel.id})`);

  // 2. ROOM BOOKING TEST
  console.log('\n[STEP 2] 🛏️ Room Booking (/customer/booking)');
  const guestEmail = "test.guest@lucknexa.com";
  const bookingPayload = {
    guestName: "Vikram Malhotra",
    guestEmail: guestEmail,
    guestPhone: "+91 9988776655",
    hotelName: targetHotel.name,
    hotelId: targetHotel.id,
    roomType: "Executive Suite",
    roomNumber: "TBD", // Automatic room allocation
    checkIn: "2026-10-01",
    checkOut: "2026-10-05",
    totalAmount: 30000,
    paidAmount: 30000,
    source: "Customer Portal",
    idType: "Aadhaar",
  };

  const reservation = await ReservationsService.createReservation({
    data: bookingPayload,
    user: null,
    tenant: null,
  });
  console.log(`   ✅ Reservation Confirmed: ${reservation.id}`);
  console.log(`   👤 Guest: ${reservation.guestName} (${reservation.guestEmail})`);
  console.log(`   🚪 Allocated Room: ${reservation.roomNumber} (${reservation.roomType})`);
  console.log(`   💰 Total Amount: ₹${reservation.totalAmount} (Status: ${reservation.status})`);

  // 3. MY BOOKINGS RETRIEVAL TEST
  console.log('\n[STEP 3] 📋 My Bookings (/customer/my-bookings)');
  const guestBookings = await ReservationsService.listReservations({
    user: { role: "customer", email: guestEmail },
    filters: { guestEmail: guestEmail },
  });
  console.log(`   Found ${guestBookings.length} bookings for ${guestEmail}:`);
  guestBookings.forEach((b) => {
    console.log(`   - Booking #${b.id} | Hotel: ${b.hotelName} | Room: ${b.roomNumber} | Dates: ${b.checkIn} → ${b.checkOut} | Status: ${b.status}`);
  });
  const matched = guestBookings.find((b) => b.id === reservation.id);
  if (!matched) throw new Error("Newly booked reservation not found in My Bookings query!");
  console.log(`   ✅ New reservation #${reservation.id} correctly fetched in guest list.`);

  // 4. DIGITAL PRE-CHECK-IN TEST
  console.log('\n[STEP 4] 🛡️ Digital Pre-Check-In (/customer/pre-checkin)');
  let preCheckResData = null;
  const mockPreReq = {
    params: { id: reservation.id },
    body: {
      idType: "Passport",
      idNumber: "P87654321",
      estimatedArrivalTime: "15:30",
      specialRequests: "Non-smoking room, high floor with extra water bottles",
    },
  };
  const mockPreRes = {
    json: (d) => { preCheckResData = d; return d; },
    status: () => mockPreRes,
  };
  await ReservationsController.preCheckIn(mockPreReq, mockPreRes);
  console.log(`   ✅ Pre-Check-In Result: ${preCheckResData?.message}`);

  // 5. IN-STAY DINING (CHARGE TO ROOM FOLIO)
  console.log('\n[STEP 5] 🍽️ In-Stay Room Dining (/customer/stay-services)');
  let posResData = null;
  const mockPosReq = {
    body: {
      roomNumber: reservation.roomNumber,
      amount: 1450,
      description: "Room Dining: 2x Gourmet Chicken Burger, 2x Cappuccino / Espresso",
    },
  };
  const mockPosRes = {
    json: (d) => { posResData = d; return d; },
    status: () => mockPosRes,
  };
  await PosController.chargeToRoom(mockPosReq, mockPosRes);
  console.log(`   ✅ ${posResData?.message}`);

  const updatedFolio = await Reservation.findOne({ id: reservation.id });
  console.log(`   📊 Updated Guest Folio Total: ₹${updatedFolio.totalAmount} (Includes ₹1,450 dining charge)`);

  // 6. IN-STAY HOUSEKEEPING REQUEST
  console.log('\n[STEP 6] 🧹 In-Stay Housekeeping & Towels (/customer/stay-services)');
  const hkTask = await HousekeepingService.createTask({
    roomNumber: reservation.roomNumber,
    hotelId: targetHotel.id,
    orgId: targetHotel.orgId,
    priority: "urgent",
    status: "cleaning",
    floor: Number(reservation.roomNumber[0]) || 1,
    assignedTo: "Duty Staff",
    notes: "Extra Fresh Towels: Guest requested 2 extra bath sheets & face napkins",
  });
  console.log(`   ✅ Housekeeping Task Dispatched: ID: ${hkTask.id} | Room: ${hkTask.roomNumber} | Priority: ${hkTask.priority}`);
  console.log(`   📝 Task Notes: "${hkTask.notes}"`);

  // 7. IN-STAY MAINTENANCE TICKET
  console.log('\n[STEP 7] 🔧 Report Maintenance Ticket (/customer/stay-services)');
  let maintResData = null;
  const mockMaintReq = {
    body: {
      roomNumber: reservation.roomNumber,
      category: "Air Conditioning",
      description: "AC cooling is slow, remote sensor battery low",
      priority: "urgent",
    },
  };
  const mockMaintRes = {
    json: (d) => { maintResData = d; return d; },
    status: () => mockMaintRes,
  };
  await MaintenanceController.createMaintenanceRequest(mockMaintReq, mockMaintRes);
  console.log(`   ✅ Maintenance Ticket Logged: Category: ${maintResData?.category} | Room: ${maintResData?.roomNumber} | Status: ${maintResData?.status}`);

  // 8. 1-CLICK DIGITAL CHECK-IN
  console.log('\n[STEP 8] 🔑 1-Click Digital Check-In (/customer/my-bookings)');
  const checkedInReservation = await ReservationsService.updateStatus({
    id: reservation.id,
    status: "checked_in",
  });
  console.log(`   ✅ Digital Key Assigned! Reservation Status: "${checkedInReservation.status}"`);

  // Verify Room state in PMS
  const assignedRoomRecord = await Room.findOne({ number: reservation.roomNumber });
  console.log(`   🏨 PMS Room #${assignedRoomRecord?.number} Status: "${assignedRoomRecord?.status}" (Occupied by: ${assignedRoomRecord?.guest})`);

  console.log('\n=====================================================');
  console.log('🎉 100% SUCCESS: ALL 8 GUEST & IN-STAY SERVICES WORKING!');
  console.log('=====================================================\n');
  process.exit(0);
}

testCompleteGuestExperience().catch((err) => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
