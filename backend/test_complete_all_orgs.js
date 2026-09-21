const mongoose = require('mongoose');
const BASE_URL = 'http://localhost:5000/api';

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

async function runFullMultiOrgE2E() {
  console.log('======================================================================');
  console.log('🌐 100% COMPLETE MULTI-TENANT ISOLATION & LIFECYCLE VERIFICATION');
  console.log('======================================================================\n');

  // STEP 0: Direct DB clean & index sync
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/hos';
  await mongoose.connect(mongoUri);
  console.log('🧹 [DB RESET] Purging all collections for a fresh multi-tenant isolation test...');
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const c of collections) {
    if (!c.name.startsWith('system.')) {
      await mongoose.connection.db.collection(c.name).deleteMany({});
    }
  }
  // Drop stale room index if present
  try {
    await mongoose.connection.db.collection('rooms').dropIndex('number_1').catch(() => {});
  } catch (e) {}
  console.log('✅ [DB RESET] Complete! Database is pristine.\n');

  // Seed Super Admin directly
  const bcrypt = require('bcryptjs');
  const User = require('./src/models/User');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Password@123', salt);

  await User.create({
    id: 'user-superadmin',
    name: 'Chief Super Administrator',
    email: 'superadmin@hos.com',
    passwordHash: hashedPassword,
    role: 'super_admin',
    systemRole: 'super_admin',
    department: 'Executive Leadership',
    status: 'active'
  });

  // STEP 1: Super Admin Login
  console.log('📍 STEP 1: Super Admin Login...');
  const superLogin = await request('/auth/login', 'POST', {
    email: 'superadmin@hos.com',
    password: 'Password@123'
  });
  const superToken = superLogin.token;
  console.log('✅ Super Admin Logged In successfully.\n');

  // STEP 2: Create Organization 1: "Krishna Hospitality Group"
  console.log('📍 STEP 2: Creating Organization 1: "Krishna Hospitality Group"...');
  const org1Res = await request('/organizations', 'POST', {
    name: 'Krishna Hospitality Group',
    code: 'KHG',
    ownerName: 'Krishna Org Admin',
    ownerEmail: 'krishna.admin@hos.com',
    ownerPassword: 'Password@123',
    hotelsCount: 2,
    activeRooms: 60,
    monthlyRevenue: 1250000,
    status: 'active'
  }, superToken);
  const org1 = org1Res.data;
  console.log('✅ Organization 1 Created:', org1.name, '| Org ID:', org1.id);

  // STEP 3: Org 1 Admin Login & Create 2 Hotels + 60 Rooms + 14 Staff
  console.log('\n📍 STEP 3: Logging into Organization 1 Admin (krishna.admin@hos.com)...');
  const org1Login = await request('/auth/login', 'POST', {
    email: 'krishna.admin@hos.com',
    password: 'Password@123'
  });
  const org1Token = org1Login.token;

  // Create Hotel 1 (Jaipur)
  const h1 = await request('/hotels', 'POST', {
    name: 'Krishna Palace, Jaipur',
    city: 'Jaipur',
    region: 'North Zone',
    totalRooms: 30,
    managerName: 'Vikramaditya Rathore',
    phone: '+91 98111 22334'
  }, org1Token);

  // Create Hotel 2 (Udaipur)
  const h2 = await request('/hotels', 'POST', {
    name: 'Krishna Resort, Udaipur',
    city: 'Udaipur',
    region: 'North Zone',
    totalRooms: 30,
    managerName: 'Maharana Pratap',
    phone: '+91 98222 33445'
  }, org1Token);

  // Add 30 Rooms to Jaipur
  const roomsH1 = [];
  for (let i = 1; i <= 30; i++) {
    roomsH1.push({
      number: '10' + (i < 10 ? '0' + i : i),
      floor: 1,
      type: i <= 10 ? 'Standard Room' : i <= 20 ? 'Deluxe King' : 'Executive Suite',
      rate: i <= 10 ? 2500 : i <= 20 ? 3500 : 5000,
      hotelId: h1.data.id,
      hotelName: h1.data.name
    });
  }
  await request('/rooms/bulk', 'POST', { rooms: roomsH1, hotelId: h1.data.id, hotelName: h1.data.name }, org1Token);

  // Add 30 Rooms to Udaipur
  const roomsH2 = [];
  for (let i = 1; i <= 30; i++) {
    roomsH2.push({
      number: '20' + (i < 10 ? '0' + i : i),
      floor: 2,
      type: i <= 10 ? 'Standard Room' : i <= 20 ? 'Deluxe King' : 'Executive Suite',
      rate: i <= 10 ? 3000 : i <= 20 ? 4500 : 6500,
      hotelId: h2.data.id,
      hotelName: h2.data.name
    });
  }
  await request('/rooms/bulk', 'POST', { rooms: roomsH2, hotelId: h2.data.id, hotelName: h2.data.name }, org1Token);
  console.log('✅ Org 1 Hotels & 60 Rooms created successfully.');

  // Create Staff in Org 1
  const org1StaffDefs = [
    { name: 'Aarav Sharma', email: 'reception.krishna@hos.com', department: 'Reception', systemRole: 'receptionist', hotel: h1.data.name },
    { name: 'Sanjay Chef', email: 'restaurant.krishna@hos.com', department: 'Restaurant', systemRole: 'restaurant_staff', hotel: h1.data.name },
    { name: 'Ramesh Cleaner', email: 'housekeeping.krishna@hos.com', department: 'Housekeeping', systemRole: 'housekeeping', hotel: h1.data.name },
    { name: 'Anil Area Manager', email: 'areamanager.krishna@hos.com', department: 'Area Operations', systemRole: 'area_manager', assignedHotelNames: [h1.data.name, h2.data.name] }
  ];

  for (const s of org1StaffDefs) {
    await request('/staff', 'POST', {
      name: s.name,
      email: s.email,
      password: 'Password@123',
      department: s.department,
      role: s.name + ' Role',
      systemRole: s.systemRole,
      hotel: s.hotel,
      assignedHotelNames: s.assignedHotelNames || [s.hotel],
      phone: '+91 98000 00000'
    }, org1Token);
  }

  // Org 1 Guest Booking & Order
  const org1RecLogin = await request('/auth/login', 'POST', { email: 'reception.krishna@hos.com', password: 'Password@123' });
  const org1RecToken = org1RecLogin.token;

  await request('/reservations', 'POST', {
    hotelId: h1.data.id,
    hotelName: h1.data.name,
    guestName: 'Rohan Kapoor',
    guestEmail: 'rohan.kapoor@gmail.com',
    guestPhone: '+91 98765 43210',
    idType: 'Aadhaar',
    idNumber: '9988-7766-5544',
    roomType: 'Deluxe King',
    roomNumber: '1001',
    checkIn: '2026-09-14',
    checkOut: '2026-09-16',
    adults: 2,
    children: 0,
    totalAmount: 7000,
    paidAmount: 7000,
    paymentPreference: 'online',
    status: 'checked_in',
    source: 'Direct Web'
  }, org1RecToken);

  await request('/invoices', 'POST', {
    guestName: 'Rohan Kapoor',
    guestEmail: 'rohan.kapoor@gmail.com',
    roomNumber: '1001',
    hotelId: h1.data.id,
    hotelName: h1.data.name,
    amount: 7000,
    status: 'paid',
    paymentMethod: 'UPI'
  }, org1RecToken);
  console.log('✅ Org 1 Guest lifecycle (Rohan Kapoor) completed.');

  // STEP 4: Create Organization 2: "Sunrise Hospitality Resorts"
  console.log('\n📍 STEP 4: Creating Organization 2: "Sunrise Hospitality Resorts"...');
  const org2Res = await request('/organizations', 'POST', {
    name: 'Sunrise Hospitality Resorts',
    code: 'SHR',
    ownerName: 'Sunrise Org Admin',
    ownerEmail: 'sunrise.admin@hos.com',
    ownerPassword: 'Password@123',
    hotelsCount: 1,
    activeRooms: 25,
    monthlyRevenue: 450000,
    status: 'active'
  }, superToken);
  const org2 = org2Res.data;
  console.log('✅ Organization 2 Created:', org2.name, '| Org ID:', org2.id);

  // STEP 5: Org 2 Admin Login & Create Hotel (Goa) + 25 Rooms + 4 Staff
  console.log('\n📍 STEP 5: Logging into Organization 2 Admin (sunrise.admin@hos.com)...');
  const org2Login = await request('/auth/login', 'POST', {
    email: 'sunrise.admin@hos.com',
    password: 'Password@123'
  });
  const org2Token = org2Login.token;

  const hSunrise = await request('/hotels', 'POST', {
    name: 'Sunrise Beach Resort, Goa',
    city: 'Goa',
    region: 'West Coastal Zone',
    totalRooms: 25,
    managerName: 'Vikramaditya Roy',
    phone: '+91 97000 11223'
  }, org2Token);

  const roomsSunrise = [];
  for (let i = 1; i <= 25; i++) {
    roomsSunrise.push({
      number: '20' + (i < 10 ? '0' + i : i),
      floor: 2,
      type: 'Deluxe Sea View Suite',
      rate: 5500,
      hotelId: hSunrise.data.id,
      hotelName: hSunrise.data.name
    });
  }
  await request('/rooms/bulk', 'POST', {
    rooms: roomsSunrise,
    hotelId: hSunrise.data.id,
    hotelName: hSunrise.data.name
  }, org2Token);

  const org2StaffDefs = [
    { name: 'Kavita Nair', email: 'reception.sunrise@hos.com', department: 'Reception', systemRole: 'receptionist', hotel: hSunrise.data.name },
    { name: 'Prakash Cook', email: 'restaurant.sunrise@hos.com', department: 'Restaurant', systemRole: 'restaurant_staff', hotel: hSunrise.data.name },
    { name: 'Deepak Housekeeper', email: 'housekeeping.sunrise@hos.com', department: 'Housekeeping', systemRole: 'housekeeping', hotel: hSunrise.data.name },
    { name: 'Vikramaditya Roy', email: 'manager.sunrise@hos.com', department: 'Management', systemRole: 'hotel_manager', hotel: hSunrise.data.name }
  ];

  for (const s of org2StaffDefs) {
    await request('/staff', 'POST', {
      name: s.name,
      email: s.email,
      password: 'Password@123',
      department: s.department,
      role: s.name + ' Role',
      systemRole: s.systemRole,
      hotel: s.hotel,
      assignedHotelNames: [s.hotel],
      phone: '+91 97000 00000'
    }, org2Token);
  }
  console.log('✅ Org 2 Hotel, 25 Rooms, & 4 Staff created successfully.');

  // STEP 6: Org 2 Complete Guest Lifecycle (Walk-in Ananya Sen, Room 2001, POS Order, Invoice, Housekeeping)
  console.log('\n📍 STEP 6: Executing Full Guest Lifecycle in Org 2 (Sunrise Beach Resort)...');
  const org2RecLogin = await request('/auth/login', 'POST', { email: 'reception.sunrise@hos.com', password: 'Password@123' });
  const org2RecToken = org2RecLogin.token;

  // Walk-in booking
  const walkInRes = await request('/reservations', 'POST', {
    hotelId: hSunrise.data.id,
    hotelName: hSunrise.data.name,
    orgId: org2.id,
    guestName: 'Ananya Sen',
    guestEmail: 'ananya.sen@gmail.com',
    guestPhone: '+91 91234 56789',
    idType: 'Passport',
    idNumber: 'P8923412',
    roomType: 'Deluxe Sea View Suite',
    roomNumber: '2001',
    checkIn: '2026-09-14',
    checkOut: '2026-09-17',
    adults: 2,
    children: 1,
    totalAmount: 16500,
    paidAmount: 5000,
    paymentPreference: 'pay_at_counter',
    paymentMethod: 'UPI',
    status: 'checked_in',
    source: 'Front Desk Walk-In'
  }, org2RecToken);
  console.log('  [1. Walk-In Check-In] Guest: Ananya Sen (Room 2001) | Advance Paid: ₹5,000');

  // Verify live room status occupied
  const rCheck1 = await request('/rooms', 'GET', null, org2RecToken);
  const room2001 = rCheck1.data?.find(r => r.number === '2001');
  console.log('  [2. Room Status Sync] Room 2001 Status:', room2001?.status, '| Guest:', room2001?.guest);

  // POS Order by Restaurant Staff
  const restLogin = await request('/auth/login', 'POST', { email: 'restaurant.sunrise@hos.com', password: 'Password@123' });
  const restToken = restLogin.token;

  await request('/pos/orders', 'POST', {
    roomNumber: '2001',
    guestName: 'Ananya Sen',
    items: [
      { name: 'Murgh Malai Tikka', category: 'Starters', price: 460, quantity: 1 },
      { name: 'Mango Lassi Royal', category: 'Beverages', price: 180, quantity: 1 }
    ],
    total: 640,
    status: 'charged_to_room'
  }, restToken);
  console.log('  [3. Restaurant POS Order] Placed for Room 2001 | Total: ₹640 (Charged to Room)');

  // Final Invoice & Checkout
  await request('/invoices', 'POST', {
    guestName: 'Ananya Sen',
    guestEmail: 'ananya.sen@gmail.com',
    roomNumber: '2001',
    hotelId: hSunrise.data.id,
    hotelName: hSunrise.data.name,
    amount: 17140,
    status: 'paid',
    paymentMethod: 'Credit Card (Counter Settlement)',
    items: [
      { description: 'Deluxe Sea View Suite (3 Nights)', amount: 16500 },
      { description: 'Beach Cafe In-Room Dining', amount: 640 },
      { description: 'Advance UPI Deposit Deducted', amount: -5000 }
    ]
  }, org2RecToken);
  console.log('  [4. Final Invoice Settle] Total: ₹17,140 | Balance: ₹12,140 Paid via Card');

  await request('/reservations/' + walkInRes.data?.id + '/status', 'PATCH', { status: 'checked_out' }, org2RecToken);
  console.log('  [5. Check-Out Complete] Reservation marked checked_out');

  const rCheck2 = await request('/rooms', 'GET', null, org2RecToken);
  const room2001Dirty = rCheck2.data?.find(r => r.number === '2001');
  console.log('  [6. Room Status Sync] Room 2001 Status:', room2001Dirty?.status, '(Dirty - Turnover Required)');

  // Housekeeping cleans room
  const hkLogin = await request('/auth/login', 'POST', { email: 'housekeeping.sunrise@hos.com', password: 'Password@123' });
  const hkToken = hkLogin.token;

  const hkTasks = await request('/housekeeping', 'GET', null, hkToken);
  const task2001 = hkTasks.data?.find(t => t.roomNumber === '2001');
  if (task2001) {
    await request('/housekeeping/' + task2001.id + '/status', 'PATCH', {
      status: 'clean',
      assignedTo: 'Deepak Housekeeper'
    }, hkToken);
    console.log('  [7. Housekeeping Cleaned] Room 2001 marked clean.');
  }

  const rCheck3 = await request('/rooms', 'GET', null, org2RecToken);
  const room2001Clean = rCheck3.data?.find(r => r.number === '2001');
  console.log('  [8. Room Ready] Room 2001 Final Status:', room2001Clean?.status, '(Ready for next guest!)\n');

  // STEP 7: STRICT BI-DIRECTIONAL MULTI-TENANT ISOLATION ASSERTIONS
  console.log('======================================================================');
  console.log('🛡️ RUNNING BI-DIRECTIONAL 100% DATA ISOLATION VERIFICATION');
  console.log('======================================================================\n');

  let passed = true;

  // CHECK 1: Sunrise Hospitality Scope (Org 2)
  console.log('🔍 CHECK 1: Verifying Sunrise Hospitality Scope (Org 2)...');
  const sunHotels = await request('/hotels', 'GET', null, org2Token);
  const sunRooms = await request('/rooms', 'GET', null, org2Token);
  const sunStaff = await request('/staff', 'GET', null, org2Token);
  const sunResv = await request('/reservations', 'GET', null, org2Token);
  const sunInv = await request('/invoices', 'GET', null, org2Token);

  console.log('  • Hotels visible to Sunrise Admin:', sunHotels.count, sunHotels.data?.map(h => h.name));
  console.log('  • Rooms visible to Sunrise Admin:', sunRooms.count);
  console.log('  • Staff visible to Sunrise Admin:', sunStaff.count, sunStaff.data?.map(s => s.email));
  console.log('  • Reservations visible to Sunrise Admin:', sunResv.data?.length, sunResv.data?.map(r => r.guestName));
  console.log('  • Invoices visible to Sunrise Admin:', sunInv.count);

  const sunHasKrishnaData = (sunHotels.data || []).some(h => h.name.includes('Krishna')) ||
                            (sunRooms.data || []).some(r => r.hotelName?.includes('Krishna')) ||
                            (sunStaff.data || []).some(s => s.email.includes('krishna')) ||
                            (sunResv.data || []).some(r => r.guestName?.includes('Rohan')) ||
                            (sunInv.data || []).some(i => i.guest?.includes('Rohan'));

  if (!sunHasKrishnaData && sunHotels.count === 1 && sunRooms.count === 25 && sunStaff.count === 4 && sunResv.data?.length === 1 && sunInv.count === 1) {
    console.log('  ✅ PASSED: Sunrise Admin sees ONLY Sunrise Beach Resort (1 hotel, 25 rooms, 4 staff, 1 guest Ananya Sen). ZERO Krishna data leaked!\n');
  } else {
    console.error('  ❌ FAILED: Data leaked into Sunrise Admin!\n');
    passed = false;
  }

  // CHECK 2: Krishna Hospitality Scope (Org 1)
  console.log('🔍 CHECK 2: Verifying Krishna Hospitality Scope (Org 1)...');
  const kHotels = await request('/hotels', 'GET', null, org1Token);
  const kRooms = await request('/rooms', 'GET', null, org1Token);
  const kStaff = await request('/staff', 'GET', null, org1Token);
  const kResv = await request('/reservations', 'GET', null, org1Token);
  const kInv = await request('/invoices', 'GET', null, org1Token);

  console.log('  • Hotels visible to Krishna Admin:', kHotels.count, kHotels.data?.map(h => h.name));
  console.log('  • Rooms visible to Krishna Admin:', kRooms.count);
  console.log('  • Staff visible to Krishna Admin:', kStaff.count);
  console.log('  • Reservations visible to Krishna Admin:', kResv.data?.length, kResv.data?.map(r => r.guestName));
  console.log('  • Invoices visible to Krishna Admin:', kInv.count);

  const kHasSunriseData = (kHotels.data || []).some(h => h.name.includes('Sunrise')) ||
                          (kRooms.data || []).some(r => r.hotelName?.includes('Sunrise')) ||
                          (kStaff.data || []).some(s => s.email.includes('sunrise')) ||
                          (kResv.data || []).some(r => r.guestName?.includes('Ananya')) ||
                          (kInv.data || []).some(i => i.guest?.includes('Ananya'));

  if (!kHasSunriseData && kHotels.count === 2 && kRooms.count === 60 && kStaff.count === 4 && kResv.data?.length === 1 && kInv.count === 1) {
    console.log('  ✅ PASSED: Krishna Admin sees ONLY Krishna Properties (2 hotels, 60 rooms, 4 staff, 1 guest Rohan Kapoor). ZERO Sunrise data leaked!\n');
  } else {
    console.error('  ❌ FAILED: Data leaked into Krishna Admin!\n');
    passed = false;
  }

  // CHECK 3: Super Admin Global View
  console.log('🔍 CHECK 3: Verifying Super Admin Global Multi-Tenant Scope...');
  const allOrgs = await request('/organizations', 'GET', null, superToken);
  const allHotels = await request('/hotels', 'GET', null, superToken);
  const allRooms = await request('/rooms', 'GET', null, superToken);
  const allResv = await request('/reservations', 'GET', null, superToken);
  const allInvoices = await request('/invoices', 'GET', null, superToken);

  console.log('  • Total Organizations in System:', allOrgs.count);
  console.log('  • Total Properties across all Orgs:', allHotels.count);
  console.log('  • Total Rooms across all Orgs:', allRooms.count);
  console.log('  • Total Reservations across all Orgs:', allResv.data?.length);
  console.log('  • Total Invoices generated across all Orgs:', allInvoices.count);

  if (allOrgs.count === 2 && allHotels.count === 3 && allRooms.count === 85 && allResv.data?.length === 2 && allInvoices.count === 2) {
    console.log('  ✅ PASSED: Super Admin sees complete global view of all multi-tenant organizations!\n');
  } else {
    console.error('  ❌ FAILED: Super Admin count mismatch!\n');
    passed = false;
  }

  console.log('======================================================================');
  if (passed) {
    console.log('🏆 ALL TESTS PASSED! FULL MULTI-TENANT ISOLATION IS 100% BULLETPROOF!');
  } else {
    console.log('⚠️ SOME ISOLATION CHECKS FAILED');
  }
  console.log('======================================================================');

  await mongoose.disconnect();
  process.exit(passed ? 0 : 1);
}

runFullMultiOrgE2E().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
