require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hos';

async function resetAndSeedSuperAdmin() {
  console.log('======================================================================');
  console.log('🧹 COMPLETE DATABASE PURGE & FRESH SUPER ADMIN SEED');
  console.log('======================================================================\n');

  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`📡 Connected to MongoDB: ${conn.connection.host}`);

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n🗑️ Purging ${collections.length} collections...`);
    for (const c of collections) {
      if (!c.name.startsWith('system.')) {
        await mongoose.connection.db.collection(c.name).deleteMany({});
        console.log(`  • Cleared collection: ${c.name}`);
      }
    }

    // Drop stale indexes on rooms if any
    try {
      if (collections.some(c => c.name === 'rooms')) {
        await mongoose.connection.db.collection('rooms').dropIndex('number_1').catch(() => {});
      }
    } catch (idxErr) {}

    // Seed ONLY Super Admin
    const User = require('./src/models/User');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password@123', salt);

    const superAdmin = await User.create({
      id: 'super-admin-root',
      name: 'Super Admin',
      email: 'superadmin@hos.com',
      passwordHash: passwordHash,
      role: 'super_admin',
      systemRole: 'super_admin',
      department: 'Executive Leadership',
      status: 'active'
    });

    console.log('\n👑 Super Admin created successfully!');
    console.log('----------------------------------------------------------------------');
    console.log('  Email:    superadmin@hos.com');
    console.log('  Password: Password@123');
    console.log('  Role:     super_admin');
    console.log('----------------------------------------------------------------------');
    console.log('\n✅ Database is now 100% clean and ready for your manual testing!\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  }
}

resetAndSeedSuperAdmin();
