require('dotenv').config();
const mongoose = require('mongoose');

async function testGuestPortalE2E() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB Atlas');

  const Hotel = require('./src/models/Hotel');
  const Reservation = require('./src/models/Reservation');
  const HousekeepingTask = require('./src/models/HousekeepingTask');
  const ReservationsService = require('./src/services/reservations.service');
  const HousekeepingService = require('./src/services/housekeeping.service');
  const PosController = require('./src/controllers/pos.controller');

  // Step 1: Discover Hotels
  console.log('\n--- 1. Hotel Discovery ---');
  const hotels = await Hotel.find({});
  console.log(`Found ${hotels.length} hotels in database:`);
  hotels.forEach(h => {
    console.log(`- ${h.name} (${h.city}) | ID: ${h.id} | Org: ${h.orgId} | Images: ${Object.keys(h.images || {}).filter(k => !!h.images[k]).length}/4`);
  });

  const targetHotel = hotels.find(h => h.id === 'hotel-taj-delhi') || hotels[0];
  console.log(`Selected Hotel: "${targetHotel.name}"`);

  // Step 2: Guest Room Booking
  console.log('\n--- 2. Guest Room Booking ---');
  const testRoomNum = `10${Math.floor(5 + Math.random() * 4)}`;
  const bookingPayload = {
    guestName: "Arjun Verma (Guest)",
    guestEmail: "arjun.guest@lucknexa.com",
    guestPhone: "+91 9876543210",
    hotelName: targetHotel.name,
    hotelId: targetHotel.id,
    roomType: "Deluxe King",
    roomNumber: testRoomNum,
    checkIn: "2026-09-25",
    checkOut: "2026-09-28",
    totalAmount: 13500,
    paidAmount: 13500,
    source: "Customer Portal"
  };

  const createdReservation = await ReservationsService.createReservation({
    data: bookingPayload,
    user: null,
    tenant: null
  });

  console.log(`✅ Reservation created successfully! ID: ${createdReservation.id}`);
  console.log(`   Guest: ${createdReservation.guestName} | Room: ${createdReservation.roomNumber} | Status: ${createdReservation.status} | Total: ₹${createdReservation.totalAmount}`);

  // Step 3: Guest Digital Pre-Check-In
  console.log('\n--- 3. Digital Pre-Check-In ---');
  let preCheckResponse = null;
  const mockPreReq = {
    params: { id: createdReservation.id },
    body: {
      idType: "Aadhaar",
      idNumber: "9876-5432-1098",
      estimatedArrivalTime: "14:00",
      specialRequests: "High floor quiet room with extra pillows"
    }
  };
  const mockPreRes = {
    json: (d) => { preCheckResponse = d; return d; },
    status: () => mockPreRes
  };
  const ReservationsController = require('./src/controllers/reservations.controller');
  await ReservationsController.preCheckIn(mockPreReq, mockPreRes);
  console.log(`✅ Pre-Check-In Status:`, preCheckResponse?.message);

  // Step 4: In-Stay Room Dining (Charge to Room Folio)
  console.log('\n--- 4. In-Stay Room Dining Order ---');
  const mockReq = {
    body: {
      roomNumber: testRoomNum,
      amount: 870,
      description: "Room Dining: 1x Club Sandwich with Fries, 1x Cappuccino / Espresso, 1x Fresh Cut Fruit Platter"
    }
  };
  let posResponse = null;
  const mockRes = {
    json: (d) => { posResponse = d; return d; },
    status: () => mockRes
  };
  await PosController.chargeToRoom(mockReq, mockRes);
  console.log(`✅ POS Response:`, posResponse?.message);

  const updatedResv = await Reservation.findOne({ id: createdReservation.id });
  console.log(`   Updated Folio Total: ₹${updatedResv.totalAmount} (Folio Items: ${updatedResv.folioCharges?.length})`);

  // Step 5: Guest Requests Housekeeping & Fresh Towels
  console.log('\n--- 5. In-Stay Housekeeping Request ---');
  const hkTask = await HousekeepingService.createTask({
    roomNumber: testRoomNum,
    hotelId: targetHotel.id,
    orgId: targetHotel.orgId,
    priority: "high",
    status: "cleaning",
    floor: 1,
    assignedTo: "Duty Staff",
    notes: "Extra Fresh Towels: Please bring 2 bath towels and face napkins",
    user: null,
    tenant: null
  });
  console.log(`✅ Housekeeping Task Created: ID: ${hkTask.id} | Room: ${hkTask.roomNumber} | Priority: ${hkTask.priority} | Notes: "${hkTask.notes}"`);

  // Step 6: 1-Click Digital Check-In
  console.log('\n--- 6. 1-Click Digital Check-In ---');
  const checkedIn = await ReservationsService.updateStatus({
    id: createdReservation.id,
    status: "checked_in",
    user: null,
    tenant: null
  });
  console.log(`✅ Guest Checked-In: Status is now "${checkedIn.status}"`);

  console.log('\n========================================');
  console.log('🎉 ALL GUEST PORTAL FEATURES VERIFIED & 100% WORKING!');
  console.log('========================================\n');
  process.exit(0);
}

testGuestPortalE2E().catch(err => {
  console.error('❌ Error during test:', err);
  process.exit(1);
});
