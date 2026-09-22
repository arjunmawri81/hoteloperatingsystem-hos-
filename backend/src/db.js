require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/hos";

let cachedPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (!cachedPromise) {
    cachedPromise = mongoose
      .connect(MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        bufferCommands: false,
      })
      .then((conn) => {
        console.log(`📡 MongoDB connected: ${conn.connection.host}`);
        try {
          const Room = require("./models/Room");
          Room.collection.dropIndex("number_1").catch(() => {});
          Room.syncIndexes().catch(() => {});
        } catch (idxErr) {}
        return conn;
      })
      .catch((error) => {
        cachedPromise = null;
        console.warn(`Database connection warning: ${error.message}`);
        return null;
      });
  }

  return cachedPromise;
};

module.exports = connectDB;
