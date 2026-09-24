require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hos';

async function deleteAllUsers() {
  console.log('======================================================================');
  console.log('🗑️ DELETING ALL USERS FROM DATABASE (INCLUDING SUPER ADMIN & ALL ROLES)');
  console.log('======================================================================\n');

  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`📡 Connected to MongoDB: ${conn.connection.host}`);

    const User = require('./src/models/User');
    const totalUsersBefore = await User.countDocuments();
    console.log(`\n👥 Found ${totalUsersBefore} total user(s) in database.`);

    const result = await User.deleteMany({});
    console.log(`✅ Successfully deleted ${result.deletedCount} user(s) from 'users' collection.`);

    const totalUsersAfter = await User.countDocuments();
    console.log(`📊 Remaining users in database: ${totalUsersAfter}`);
    console.log('\n✨ All users have been completely deleted from the database!\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to delete users:', error);
    process.exit(1);
  }
}

deleteAllUsers();
