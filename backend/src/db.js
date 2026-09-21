require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/hos";

const connectDB = async () => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const conn = await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 20000,
        connectTimeoutMS: 20000,
      });
      console.log(`📡 MongoDB connected: ${conn.connection.host}`);
      try {
        const Room = require("./models/Room");
        await Room.collection.dropIndex("number_1").catch(() => {});
        await Room.syncIndexes().catch(() => {});
      } catch (idxErr) {}
      return conn;
    } catch (error) {
      console.warn(`⚠️ Attempt ${attempt}/3: Database connection warning: ${error.message}`);
      if (attempt < 3) {
        console.log("Retrying in 2 seconds...");
        await new Promise((r) => setTimeout(r, 2000));
      } else {
        console.warn(`💡 If using MongoDB Atlas, verify your IP is whitelisted (0.0.0.0/0) in MongoDB Atlas Security Network Access.`);
        return null;
      }
    }
  }
};

module.exports = connectDB;
