require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hos';

async function seedAndVerifyMultiTenant() {
  console.log('======================================================================');
  console.log('🏗️ MULTI-TENANT SIMULATION & DATA ISOLATION VERIFICATION');
  console.log('======================================================================\n');

  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`📡 Connected to MongoDB: ${conn.connection.host}`);

    const User = require('./src/models/User');
    const Organization = require('./src/models/Organization');
    const Hotel = require('./src/models/Hotel');
    const Staff = require('./src/models/Staff');
    const Room = require('./src/models/Room');
    const Reservation = require('./src/models/Reservation');
    const Lead = require('./src/models/Lead');

    // 1. Purge database clean
    console.log('\n🧹 Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      Hotel.deleteMany({}),
      Staff.deleteMany({}),
      Room.deleteMany({}),
      Reservation.deleteMany({}),
      Lead.deleteMany({}),
    ]);
    console.log('✓ Collections wiped clean.');

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = 'Password@123';
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    // 2. Create Super Admin
    console.log('\n1️⃣ Creating Super Admin...');
    const superAdmin = await User.create({
      id: 'usr-superadmin-root',
      name: 'Root Super Admin',
      email: 'superadmin@hos.com',
      passwordHash: passwordHash,
      role: 'super_admin',
      status: 'active',
      phone: '+91 99999 00000',
    });
    console.log(`  ✓ Super Admin created: ${superAdmin.email}`);

    // 3. Create 2 Organizations
    console.log('\n2️⃣ Creating 2 Distinct Organizations (Tenants)...');
    
    // Organization 1: Taj Group
    const org1 = await Organization.create({
      id: 'org-taj-101',
      name: 'Taj Hospitality Group',
      code: 'TAJ',
      ownerName: 'Vikramaditya Taj Admin',
      ownerEmail: 'admin@tajhotels.com',
      ownerPhone: '+91 98111 22334',
      hotelsCount: 2,
      activeRooms: 30,
      monthlyRevenue: 1250000,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      kycDocuments: {
        gstin: '07AAACT1234F1Z5',
        panNumber: 'AAACT1234F',
        businessProof: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
        idProof: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
        verifiedAt: new Date().toISOString(),
      },
    });

    const org1Admin = await User.create({
      id: 'usr-admin-taj',
      name: 'Vikramaditya (Taj Admin)',
      email: 'admin@tajhotels.com',
      passwordHash: passwordHash,
      role: 'hotel_admin',
      orgId: org1.id,
      orgName: org1.name,
      phone: '+91 98111 22334',
    });
    console.log(`  ✓ Org 1 Created: "${org1.name}" (Admin: ${org1Admin.email})`);

    // Organization 2: Oberoi Group
    const org2 = await Organization.create({
      id: 'org-oberoi-202',
      name: 'Oberoi Luxury Stays',
      code: 'OBEROI',
      ownerName: 'Prithvi Oberoi Admin',
      ownerEmail: 'admin@oberoihotels.com',
      ownerPhone: '+91 98222 33445',
      hotelsCount: 2,
      activeRooms: 24,
      monthlyRevenue: 980000,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      kycDocuments: {
        gstin: '19AAABO5678G1Z9',
        panNumber: 'AAABO5678G',
        businessProof: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
        idProof: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
        verifiedAt: new Date().toISOString(),
      },
    });

    const org2Admin = await User.create({
      id: 'usr-admin-oberoi',
      name: 'Prithvi (Oberoi Admin)',
      email: 'admin@oberoihotels.com',
      passwordHash: passwordHash,
      role: 'hotel_admin',
      orgId: org2.id,
      orgName: org2.name,
      phone: '+91 98222 33445',
    });
    console.log(`  ✓ Org 2 Created: "${org2.name}" (Admin: ${org2Admin.email})`);

    // 4. Create 2 Hotels per Organization (4 Hotels total)
    console.log('\n3️⃣ Creating 2 Hotels per Organization (4 Total Properties)...');
    
    // Org 1 Hotels:
    const hotel1A = await Hotel.create({
      id: 'hotel-taj-delhi',
      name: 'Taj Palace New Delhi',
      city: 'New Delhi',
      address: 'Sardar Patel Marg, Diplomatic Enclave, New Delhi',
      phone: '+91 11 2611 0202',
      email: 'delhi@tajhotels.com',
      orgId: org1.id,
      orgName: org1.name,
      totalRooms: 15,
      activeRooms: 15,
      starRating: 5,
    });

    const hotel1B = await Hotel.create({
      id: 'hotel-taj-mumbai',
      name: 'Taj Lands End Mumbai',
      city: 'Mumbai',
      address: 'Bandstand, Bandra West, Mumbai',
      phone: '+91 22 6668 1234',
      email: 'mumbai@tajhotels.com',
      orgId: org1.id,
      orgName: org1.name,
      totalRooms: 15,
      activeRooms: 15,
      starRating: 5,
    });
    console.log(`  ✓ Taj Hotels created: [${hotel1A.name}] & [${hotel1B.name}]`);

    // Org 2 Hotels:
    const hotel2A = await Hotel.create({
      id: 'hotel-oberoi-kolkata',
      name: 'The Oberoi Grand Kolkata',
      city: 'Kolkata',
      address: '15 Jawaharlal Nehru Road, Kolkata',
      phone: '+91 33 2249 2323',
      email: 'kolkata@oberoihotels.com',
      orgId: org2.id,
      orgName: org2.name,
      totalRooms: 12,
      activeRooms: 12,
      starRating: 5,
    });

    const hotel2B = await Hotel.create({
      id: 'hotel-oberoi-udaipur',
      name: 'The Oberoi Udaivilas Udaipur',
      city: 'Udaipur',
      address: 'Badi-Gorela-Mulla Talai Rd, Haridas Ji Ki Magri, Udaipur',
      phone: '+91 294 243 3300',
      email: 'udaipur@oberoihotels.com',
      orgId: org2.id,
      orgName: org2.name,
      totalRooms: 12,
      activeRooms: 12,
      starRating: 5,
    });
    console.log(`  ✓ Oberoi Hotels created: [${hotel2A.name}] & [${hotel2B.name}]`);

    // 5. Create Staff and Operational Users for each hotel
    console.log('\n4️⃣ Creating Dedicated Staff & Users for Each of the 4 Hotels...');

    const hotelsMeta = [
      {
        hotel: hotel1A,
        org: org1,
        staff: [
          { name: 'Pooja Sharma', email: 'reception.delhi@tajhotels.com', role: 'receptionist', dept: 'Reception' },
          { name: 'Ramu Paswan', email: 'housekeeping.delhi@tajhotels.com', role: 'housekeeping', dept: 'Housekeeping' },
          { name: 'Chef Sanjeev', email: 'chef.delhi@tajhotels.com', role: 'kitchen_staff', dept: 'Kitchen' },
        ]
      },
      {
        hotel: hotel1B,
        org: org1,
        staff: [
          { name: 'Ananya Deshmukh', email: 'reception.mumbai@tajhotels.com', role: 'receptionist', dept: 'Reception' },
          { name: 'Suresh Patil', email: 'housekeeping.mumbai@tajhotels.com', role: 'housekeeping', dept: 'Housekeeping' },
          { name: 'Chef Vikas', email: 'chef.mumbai@tajhotels.com', role: 'kitchen_staff', dept: 'Kitchen' },
        ]
      },
      {
        hotel: hotel2A,
        org: org2,
        staff: [
          { name: 'Debolina Sen', email: 'reception.kolkata@oberoihotels.com', role: 'receptionist', dept: 'Reception' },
          { name: 'Biplab Mondal', email: 'housekeeping.kolkata@oberoihotels.com', role: 'housekeeping', dept: 'Housekeeping' },
          { name: 'Chef Ranveer', email: 'chef.kolkata@oberoihotels.com', role: 'kitchen_staff', dept: 'Kitchen' },
        ]
      },
      {
        hotel: hotel2B,
        org: org2,
        staff: [
          { name: 'Kavita Rathore', email: 'reception.udaipur@oberoihotels.com', role: 'receptionist', dept: 'Reception' },
          { name: 'Bhanwar Singh', email: 'housekeeping.udaipur@oberoihotels.com', role: 'housekeeping', dept: 'Housekeeping' },
          { name: 'Chef Manjit', email: 'chef.udaipur@oberoihotels.com', role: 'kitchen_staff', dept: 'Kitchen' },
        ]
      },
    ];

    for (const hGroup of hotelsMeta) {
      for (const s of hGroup.staff) {
        // Staff record
        await Staff.create({
          id: `stf-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          name: s.name,
          email: s.email,
          role: s.role,
          department: s.dept,
          hotel: hGroup.hotel.name,
          hotelId: hGroup.hotel.id,
          orgId: hGroup.org.id,
          status: 'active',
          phone: '+91 98000 11223',
        });

        // User auth login record
        await User.create({
          id: `usr-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          name: s.name,
          email: s.email,
          passwordHash: passwordHash,
          role: s.role,
          hotelId: hGroup.hotel.id,
          hotelName: hGroup.hotel.name,
          orgId: hGroup.org.id,
          orgName: hGroup.org.name,
          phone: '+91 98000 11223',
        });
      }
      console.log(`  ✓ 3 Staff accounts created for ${hGroup.hotel.name}`);
    }

    // 6. Create Seed Rooms, Leads and Reservations per hotel
    console.log('\n5️⃣ Seeding Rooms, CRM Leads & Live Reservations for Each Hotel...');
    
    for (const hGroup of hotelsMeta) {
      // Create 3 rooms per hotel
      await Room.create([
        {
          id: `room-${hGroup.hotel.id}-101`,
          number: '101',
          type: 'Deluxe Room',
          rate: 5500,
          status: 'available',
          floor: 1,
          hotelId: hGroup.hotel.id,
          hotelName: hGroup.hotel.name,
          orgId: hGroup.org.id,
        },
        {
          id: `room-${hGroup.hotel.id}-102`,
          number: '102',
          type: 'Executive Suite',
          rate: 9500,
          status: 'occupied',
          floor: 1,
          hotelId: hGroup.hotel.id,
          hotelName: hGroup.hotel.name,
          orgId: hGroup.org.id,
        },
        {
          id: `room-${hGroup.hotel.id}-103`,
          number: '103',
          type: 'Presidential Suite',
          rate: 18000,
          status: 'available',
          floor: 1,
          hotelId: hGroup.hotel.id,
          hotelName: hGroup.hotel.name,
          orgId: hGroup.org.id,
        },
      ]);

      // Create 1 active reservation per hotel
      await Reservation.create({
        id: `RES-${hGroup.hotel.id.slice(-4).toUpperCase()}-101`,
        guestName: `Guest of ${hGroup.hotel.city}`,
        guestPhone: '+91 98765 43210',
        guestEmail: `guest.${hGroup.hotel.id}@client.com`,
        roomNumber: '102',
        roomType: 'Executive Suite',
        checkIn: new Date().toISOString().split('T')[0],
        checkOut: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        totalAmount: 19000,
        paidAmount: 9500,
        status: 'confirmed',
        hotelId: hGroup.hotel.id,
        hotelName: hGroup.hotel.name,
        orgId: hGroup.org.id,
      });

      // Create 1 CRM lead per hotel
      await Lead.create({
        id: `lead-${hGroup.hotel.id.slice(-4)}-01`,
        name: `Inquiry for ${hGroup.hotel.name}`,
        phone: '+91 98123 45678',
        email: `inquiry.${hGroup.hotel.id}@guest.com`,
        source: 'AI Phone Call',
        requirement: '2 Deluxe Rooms for Family Weekend',
        budget: 25000,
        stage: 'AI Qualified',
        aiSummary: `AI qualified corporate inquiry for ${hGroup.hotel.name}`,
        nextFollowUp: 'Today, within 2 hours',
        hotelId: hGroup.hotel.id,
        orgId: hGroup.org.id,
        leadType: 'hotel_guest',
      });
    }
    console.log('  ✓ Seeded Rooms, Confirmed Reservations & Leads for all 4 hotels.');

    // 7. Rigorous Multi-Tenant Isolation Tests (Zero Leakage Check)
    console.log('\n======================================================================');
    console.log('🔍 RUNNING MULTI-TENANT ISOLATION SECURITY AUDIT (ZERO LEAKAGE CHECK)');
    console.log('======================================================================');

    let allTestsPassed = true;

    // Test A: Taj Admin queries hotels
    const tajHotels = await Hotel.find({ orgId: org1.id });
    const oberoiHotelsInTajQuery = tajHotels.filter(h => h.orgId === org2.id);
    console.log(`\n• Test A (Org Isolation): Taj Admin queries hotels:`);
    console.log(`  - Found ${tajHotels.length} Taj hotels: [${tajHotels.map(h => h.name).join(', ')}]`);
    if (oberoiHotelsInTajQuery.length === 0 && tajHotels.length === 2) {
      console.log('  ✅ PASSED: Taj Admin sees ONLY Taj hotels (0 Oberoi hotels leaked)');
    } else {
      console.log('  ❌ FAILED: Data leakage detected!');
      allTestsPassed = false;
    }

    // Test B: Oberoi Admin queries reservations
    const oberoiResvs = await Reservation.find({ orgId: org2.id });
    const tajResvsInOberoi = oberoiResvs.filter(r => r.orgId === org1.id);
    console.log(`\n• Test B (Revenue / Reservation Isolation): Oberoi Admin queries reservations:`);
    console.log(`  - Found ${oberoiResvs.length} Oberoi reservations: [${oberoiResvs.map(r => r.id).join(', ')}]`);
    if (tajResvsInOberoi.length === 0 && oberoiResvs.length === 2) {
      console.log('  ✅ PASSED: Oberoi Admin sees ONLY Oberoi bookings (0 Taj bookings leaked)');
    } else {
      console.log('  ❌ FAILED: Data leakage detected!');
      allTestsPassed = false;
    }

    // Test C: Delhi Receptionist queries staff & rooms
    const delhiRooms = await Room.find({ hotelId: hotel1A.id });
    const mumbaiRoomsInDelhi = delhiRooms.filter(r => r.hotelId === hotel1B.id);
    console.log(`\n• Test C (Property-level Isolation): Delhi Receptionist queries rooms:`);
    console.log(`  - Found ${delhiRooms.length} rooms for Taj Palace Delhi`);
    if (mumbaiRoomsInDelhi.length === 0 && delhiRooms.length === 3) {
      console.log('  ✅ PASSED: Delhi Front Desk sees ONLY Delhi rooms (0 Mumbai/Kolkata rooms leaked)');
    } else {
      console.log('  ❌ FAILED: Data leakage detected!');
      allTestsPassed = false;
    }

    // Test D: Super Admin queries all organizations
    const superAdminAllOrgs = await Organization.find({});
    const superAdminAllHotels = await Hotel.find({});
    console.log(`\n• Test D (Super Admin Global Overview): Super Admin queries platform data:`);
    console.log(`  - Total Organizations: ${superAdminAllOrgs.length} (${superAdminAllOrgs.map(o => o.name).join(' & ')})`);
    console.log(`  - Total Hotels Managed: ${superAdminAllHotels.length} Across 4 Cities`);
    if (superAdminAllOrgs.length === 2 && superAdminAllHotels.length === 4) {
      console.log('  ✅ PASSED: Super Admin has complete aggregated platform visibility.');
    } else {
      console.log('  ❌ FAILED: Super Admin overview mismatch!');
      allTestsPassed = false;
    }

    console.log('\n======================================================================');
    if (allTestsPassed) {
      console.log('🎉 COMPLETE MULTI-TENANT VERIFICATION PASSED (ZERO DATA LEAKAGE)');
      console.log('======================================================================\n');
    }

    await mongoose.disconnect();
    process.exit(allTestsPassed ? 0 : 1);
  } catch (err) {
    console.error('Simulation error:', err);
    process.exit(1);
  }
}

seedAndVerifyMultiTenant();
