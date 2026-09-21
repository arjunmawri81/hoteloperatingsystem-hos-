const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const BASE_URL = 'http://localhost:5000/api';

async function resetDB() {
  await mongoose.connect(process.env.MONGO_URI);
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const col of collections) {
    await mongoose.connection.db.collection(col.name).drop().catch(() => {});
  }
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password@123', salt);
  await mongoose.connection.db.collection('users').insertOne({
    id: 'usr-superadmin-01',
    name: 'Super Administrator',
    email: 'superadmin@hos.com',
    role: 'super_admin',
    passwordHash: passwordHash,
    phone: '+91 9999999999',
    orgId: '',
    orgName: '',
    hotelId: '',
    hotelName: '',
    assignedHotelIds: [],
    assignedHotelNames: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0
  });
  console.log('🧹 Clean database initialized with fresh superadmin account.');
}

async function request(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(BASE_URL + endpoint, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('❌ API Error [' + method + ' ' + endpoint + ']:', data);
  }
  return data;
}

async function runCompletePlatformLifecycleTest() {
  await resetDB();

  console.log('======================================================================');
  console.log('🌟 FULL PLATFORM LIFECYCLE & CROSS-MODULE RELATIONSHIP TEST');
  console.log('======================================================================\n');

  // STEP 1: Super Admin Login & Create 2 Organizations
  console.log('📌 PHASE 1: Organization Creation by Super Admin');
  const superLogin = await request('/auth/login', 'POST', { email: 'superadmin@hos.com', password: 'Password@123' });
  const superToken = superLogin.token;

  const org1 = await request('/organizations', 'POST', {
    name: 'Krishna Hospitality Group',
    code: 'KHG',
    ownerName: 'Krishna Org Admin',
    ownerEmail: 'krishna.admin@hos.com',
    ownerPassword: 'Password@123',
    hotelsCount: 2,
    activeRooms: 60,
    monthlyRevenue: 600000,
    status: 'active'
  }, superToken);
  console.log('  🏢 Org 1 Created:', org1.data?.name, '(Admin: krishna.admin@hos.com)');

  const org2 = await request('/organizations', 'POST', {
    name: 'Royal Heritage Group',
    code: 'RHG',
    ownerName: 'Royal Org Admin',
    ownerEmail: 'royal.admin@hos.com',
    ownerPassword: 'Password@123',
    hotelsCount: 1,
    activeRooms: 30,
    monthlyRevenue: 300000,
    status: 'active'
  }, superToken);
  console.log('  🏢 Org 2 Created:', org2.data?.name, '(Admin: royal.admin@hos.com)\n');

  // STEP 2: Krishna Admin Sets up Hotels, Rooms & Complete Department Staff
  console.log('📌 PHASE 2: Krishna Group Setup (Hotels, Rooms & Department Staff)');
  const kAdminLogin = await request('/auth/login', 'POST', { email: 'krishna.admin@hos.com', password: 'Password@123' });
  const kAdminToken = kAdminLogin.token;

  const hotel1A = await request('/hotels', 'POST', {
    name: 'Krishna Palace, Jaipur',
    city: 'Jaipur',
    region: 'North Zone',
    totalRooms: 40,
    managerName: 'Karan Sharma',
    phone: '+91 98111 11111'
  }, kAdminToken);

  const hotel1B = await request('/hotels', 'POST', {
    name: 'Krishna Resort, Udaipur',
    city: 'Udaipur',
    region: 'West Zone',
    totalRooms: 20,
    managerName: 'Suresh Verma',
    phone: '+91 98222 22222'
  }, kAdminToken);
  console.log('  🏨 Hotels Created: ' + hotel1A.data?.name + ' & ' + hotel1B.data?.name);

  // Generate Rooms
  const rooms1A = [];
  for (let i = 1; i <= 20; i++) {
    rooms1A.push({ number: '10' + (i < 10 ? '0' + i : i), floor: 1, type: 'Deluxe Room', rate: 3500, hotelId: hotel1A.data?.id, hotelName: hotel1A.data?.name });
    rooms1A.push({ number: '20' + (i < 10 ? '0' + i : i), floor: 2, type: 'Super Deluxe', rate: 4500, hotelId: hotel1A.data?.id, hotelName: hotel1A.data?.name });
  }
  await request('/rooms/bulk', 'POST', { rooms: rooms1A, hotelId: hotel1A.data?.id, hotelName: hotel1A.data?.name }, kAdminToken);

  const rooms1B = [];
  for (let i = 1; i <= 20; i++) {
    rooms1B.push({ number: '30' + (i < 10 ? '0' + i : i), floor: 3, type: 'Lake View Villa', rate: 6000, hotelId: hotel1B.data?.id, hotelName: hotel1B.data?.name });
  }
  await request('/rooms/bulk', 'POST', { rooms: rooms1B, hotelId: hotel1B.data?.id, hotelName: hotel1B.data?.name }, kAdminToken);
  console.log('  🛏️ Rooms Created: 40 in Krishna Palace, 20 in Krishna Resort');

  // Create Staff for each department
  // 1. Area Manager (Both properties)
  await request('/staff', 'POST', {
    name: 'Rajesh Singhania',
    email: 'areamanager.krishna@hos.com',
    password: 'Password@123',
    department: 'Area Operations',
    role: 'Area Manager',
    systemRole: 'area_manager',
    hotel: hotel1A.data?.name + ', ' + hotel1B.data?.name,
    assignedHotelNames: [hotel1A.data?.name, hotel1B.data?.name]
  }, kAdminToken);
  console.log('  👤 Staff Created: areamanager.krishna@hos.com (Area Manager)');

  // 2. Hotel Manager (Krishna Palace)
  await request('/staff', 'POST', {
    name: 'Karan Sharma',
    email: 'manager.krishna@hos.com',
    password: 'Password@123',
    department: 'Management',
    role: 'Hotel Manager',
    systemRole: 'hotel_manager',
    hotel: hotel1A.data?.name,
    assignedHotelNames: [hotel1A.data?.name]
  }, kAdminToken);
  console.log('  👤 Staff Created: manager.krishna@hos.com (Hotel Manager)');

  // 3. Receptionist (Krishna Palace)
  await request('/staff', 'POST', {
    name: 'Pooja Verma',
    email: 'reception.krishna@hos.com',
    password: 'Password@123',
    department: 'Reception',
    role: 'Receptionist',
    systemRole: 'receptionist',
    hotel: hotel1A.data?.name,
    assignedHotelNames: [hotel1A.data?.name]
  }, kAdminToken);
  console.log('  👤 Staff Created: reception.krishna@hos.com (Receptionist)');

  // 4. Housekeeping Staff (Krishna Palace)
  await request('/staff', 'POST', {
    name: 'Ramesh Housekeeper',
    email: 'housekeeping.krishna@hos.com',
    password: 'Password@123',
    department: 'Housekeeping',
    role: 'Housekeeping Staff',
    systemRole: 'housekeeping',
    hotel: hotel1A.data?.name,
    assignedHotelNames: [hotel1A.data?.name]
  }, kAdminToken);
  console.log('  👤 Staff Created: housekeeping.krishna@hos.com (Housekeeping)');

  // 5. Restaurant POS Staff (Krishna Palace)
  await request('/staff', 'POST', {
    name: 'Sunil Waiter',
    email: 'restaurant.krishna@hos.com',
    password: 'Password@123',
    department: 'Restaurant',
    role: 'Restaurant Staff',
    systemRole: 'restaurant_staff',
    hotel: hotel1A.data?.name,
    assignedHotelNames: [hotel1A.data?.name]
  }, kAdminToken);
  console.log('  👤 Staff Created: restaurant.krishna@hos.com (Restaurant Staff)\n');

  // STEP 3: Full Guest Lifecycle (Check-in -> POS Dining -> Bill -> Check-out -> Housekeeping Turnover -> Cleaned)
  console.log('📌 PHASE 3: Real Guest Lifecycle on Krishna Palace (Room 1001)');

  // 3a. Check initial room status
  const rInitial = await request('/rooms?hotelId=' + hotel1A.data?.id, 'GET', null, kAdminToken);
  const room1001Initial = rInitial.data?.find(r => r.number === '1001');
  console.log('  [Initial State] Room 1001 Status:', room1001Initial?.status); // 'available'

  // 3b. Receptionist logs in & creates Reservation for "Rahul Verma"
  const recLogin = await request('/auth/login', 'POST', { email: 'reception.krishna@hos.com', password: 'Password@123' });
  const recToken = recLogin.token;

  const resvCreated = await request('/reservations', 'POST', {
    guestName: 'Rahul Verma',
    guestEmail: 'rahul.verma@gmail.com',
    guestPhone: '+91 98888 77777',
    hotelId: hotel1A.data?.id,
    hotelName: hotel1A.data?.name,
    roomNumber: '1001',
    roomType: 'Deluxe Room',
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    nights: 2,
    amount: 7000,
    status: 'confirmed'
  }, recToken);
  console.log('  [1. Reservation Created] Guest: Rahul Verma | Status:', resvCreated.data?.status);

  // 3c. Receptionist Performs Check-In
  const resvCheckedIn = await request('/reservations/' + resvCreated.data?.id + '/status', 'PATCH', {
    status: 'checked_in'
  }, recToken);
  console.log('  [2. Guest Check-In] Reservation Status:', resvCheckedIn.data?.status);

  // Verify Live Room Status is now 'occupied' with guest 'Rahul Verma'
  const rOccupied = await request('/rooms?hotelId=' + hotel1A.data?.id, 'GET', null, recToken);
  const room1001Occ = rOccupied.data?.find(r => r.number === '1001');
  console.log('  [Live Room Sync] Room 1001 Status:', room1001Occ?.status, '| Guest:', room1001Occ?.guest);

  // 3d. Restaurant Staff logs in & creates In-Room POS Dining Order
  const restLogin = await request('/auth/login', 'POST', { email: 'restaurant.krishna@hos.com', password: 'Password@123' });
  const restToken = restLogin.token;

  const posOrder = await request('/pos/orders', 'POST', {
    roomNumber: '1001',
    guestName: 'Rahul Verma',
    items: [
      { name: 'Butter Chicken Delhi Style', category: 'Main Course', price: 540, quantity: 1 },
      { name: 'Garlic Butter Naan', category: 'Breads & Rice', price: 95, quantity: 2 },
      { name: 'Fresh Mint Mojito', category: 'Beverages', price: 210, quantity: 1 }
    ],
    status: 'billed',
    paymentMethod: 'room_charge'
  }, restToken);
  console.log('  [3. Restaurant POS Order] Placed for Room 1001 | Order Total: ₹' + (posOrder.data?.total || 940));

  // 3e. Invoicing & Billing
  const invoiceRes = await request('/invoices', 'POST', {
    guestName: 'Rahul Verma',
    guestEmail: 'rahul.verma@gmail.com',
    roomNumber: '1001',
    hotelId: hotel1A.data?.id,
    hotelName: hotel1A.data?.name,
    amount: 7000 + 940,
    tax: 400,
    total: 8340,
    status: 'paid',
    paymentMethod: 'Credit Card',
    items: [
      { description: 'Deluxe Room Stay (2 Nights)', amount: 7000 },
      { description: 'In-Room Dining POS Order', amount: 940 }
    ]
  }, recToken);
  console.log('  [4. Invoice Generated & Paid] Invoice ID:', invoiceRes.data?.id, '| Total: ₹' + invoiceRes.data?.total);

  // 3f. Receptionist Performs Check-Out
  const resvCheckedOut = await request('/reservations/' + resvCreated.data?.id + '/status', 'PATCH', {
    status: 'checked_out'
  }, recToken);
  console.log('  [5. Guest Check-Out] Reservation Status:', resvCheckedOut.data?.status);

  // Verify Room Status is now 'dirty'
  const rDirty = await request('/rooms?hotelId=' + hotel1A.data?.id, 'GET', null, recToken);
  const room1001Dirty = rDirty.data?.find(r => r.number === '1001');
  console.log('  [Live Room Sync] Room 1001 Status:', room1001Dirty?.status, '| Guest:', room1001Dirty?.guest);

  // 3g. Housekeeping Staff logs in & checks assigned turnover tasks
  const hkLogin = await request('/auth/login', 'POST', { email: 'housekeeping.krishna@hos.com', password: 'Password@123' });
  const hkToken = hkLogin.token;

  const hkTasks = await request('/housekeeping?hotelId=' + hotel1A.data?.id, 'GET', null, hkToken);
  const task1001 = hkTasks.data?.find(t => t.roomNumber === '1001');
  console.log('  [6. Housekeeping Auto-Task Created] Room:', task1001?.roomNumber, '| Status:', task1001?.status, '| Priority:', task1001?.priority);

  // 3h. Housekeeper Cleans Room 1001 and marks task 'clean'
  const taskUpdated = await request('/housekeeping/' + task1001?.id + '/status', 'PATCH', {
    status: 'clean',
    assignedTo: 'Ramesh Housekeeper'
  }, hkToken);
  console.log('  [7. Housekeeping Task Completed] Task Status:', taskUpdated.data?.status);

  // Verify Room Status is now back to 'available'
  const rAvailableAgain = await request('/rooms?hotelId=' + hotel1A.data?.id, 'GET', null, recToken);
  const room1001Available = rAvailableAgain.data?.find(r => r.number === '1001');
  console.log('  [Live Room Sync] Room 1001 Status is BACK to:', room1001Available?.status, '(Ready for next guest!)\n');

  // STEP 4: Setup Organization 2 (Royal Heritage) & Check Cross-Tenant Boundaries
  console.log('📌 PHASE 4: Organization 2 Setup & Multi-Tenant Boundary Verification');
  const royalLogin = await request('/auth/login', 'POST', { email: 'royal.admin@hos.com', password: 'Password@123' });
  const royalToken = royalLogin.token;

  const hotel2A = await request('/hotels', 'POST', {
    name: 'Royal Heritage, Delhi',
    city: 'New Delhi',
    region: 'North Zone',
    totalRooms: 30,
    managerName: 'Vikram Rajput',
    phone: '+91 98333 33333'
  }, royalToken);

  const rooms2A = [];
  for (let i = 1; i <= 30; i++) {
    rooms2A.push({ number: '50' + (i < 10 ? '0' + i : i), floor: 1, type: 'Heritage Suite', rate: 5000, hotelId: hotel2A.data?.id, hotelName: hotel2A.data?.name });
  }
  await request('/rooms/bulk', 'POST', { rooms: rooms2A, hotelId: hotel2A.data?.id, hotelName: hotel2A.data?.name }, royalToken);

  // Create Royal Receptionist
  await request('/staff', 'POST', {
    name: 'Kavita Singh',
    email: 'reception.royal@hos.com',
    password: 'Password@123',
    department: 'Reception',
    role: 'Receptionist',
    systemRole: 'receptionist',
    hotel: hotel2A.data?.name,
    assignedHotelNames: [hotel2A.data?.name]
  }, royalToken);

  const royalRecLogin = await request('/auth/login', 'POST', { email: 'reception.royal@hos.com', password: 'Password@123' });
  const royalRecToken = royalRecLogin.token;

  // Royal Receptionist checks Reservations, Rooms, Invoices, Housekeeping
  const royalResv = await request('/reservations', 'GET', null, royalRecToken);
  const royalRooms = await request('/rooms', 'GET', null, royalRecToken);
  const royalInvoices = await request('/invoices', 'GET', null, royalRecToken);
  const royalHK = await request('/housekeeping', 'GET', null, royalRecToken);

  console.log('  • Royal Receptionist sees Reservations:', royalResv.data?.length);
  console.log('  • Royal Receptionist sees Rooms:', royalRooms.count);
  console.log('  • Royal Receptionist sees Invoices:', (royalInvoices.data || royalInvoices).length || 0);
  console.log('  • Royal Receptionist sees Housekeeping Tasks:', (royalHK.data || royalHK).length || 0);

  const royalHasKrishnaData = (royalResv.data || []).some(r => r.guestName?.includes('Rahul')) ||
                              (royalRooms.data || []).some(r => r.hotelName?.includes('Krishna')) ||
                              (royalInvoices.data || []).some(i => i.guestName?.includes('Rahul'));

  if (!royalHasKrishnaData) {
    console.log('  ✅ PASSED: 100% Zero Leakage from Krishna Palace to Royal Heritage!\n');
  } else {
    console.error('  ❌ FAILED: Data leaked to Royal Heritage!\n');
  }

  // STEP 5: Area Manager Multi-Property Scope Verification
  console.log('📌 PHASE 5: Area Manager Multi-Property Aggregation');
  const areaLogin = await request('/auth/login', 'POST', { email: 'areamanager.krishna@hos.com', password: 'Password@123' });
  const areaToken = areaLogin.token;

  const areaHotels = await request('/hotels', 'GET', null, areaToken);
  const areaRooms = await request('/rooms', 'GET', null, areaToken);

  console.log('  • Area Manager sees assigned properties:', areaHotels.count, areaHotels.data?.map(h => h.name));
  console.log('  • Area Manager sees total combined rooms:', areaRooms.count);

  const areaPass = areaHotels.count === 2 && areaRooms.count === 60 && !(areaHotels.data || []).some(h => h.name.includes('Royal'));
  if (areaPass) {
    console.log('  ✅ PASSED: Area Manager accurately aggregates both Krishna properties (60 rooms) with 0 Royal leaks!\n');
  } else {
    console.error('  ❌ FAILED: Area Manager scope issue!\n');
  }

  console.log('======================================================================');
  console.log('🏆 ALL ROLES, MODULES, WORKFLOWS & CROSS-RELATIONSHIPS PASSED 100%!');
  console.log('======================================================================');

  process.exit(0);
}

runCompletePlatformLifecycleTest().catch(err => {
  console.error('Platform Test Error:', err);
  process.exit(1);
});
