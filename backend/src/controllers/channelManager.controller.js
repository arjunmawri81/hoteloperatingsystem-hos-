const ChannelManager = require("../models/ChannelManager");
const ChannelMapping = require("../models/ChannelMapping");
const SyncLog = require("../models/SyncLog");
const ChannelManagerService = require("../services/channelManager.service");

// Get Channel Manager providers & status
exports.getChannels = async (req, res) => {
  try {
    let channels = await ChannelManager.find();
    if (channels.length === 0) {
      channels = await ChannelManager.insertMany([
        {
          provider: "STAAH",
          hotelId: "hotel-101",
          hotelCode: "STAAH-HOS-991",
          status: "connected",
          twoWaySyncEnabled: true,
          lastSyncTime: new Date(),
        },
        {
          provider: "SiteMinder",
          hotelId: "hotel-101",
          hotelCode: "SM-IND-404",
          status: "connected",
          twoWaySyncEnabled: true,
          lastSyncTime: new Date(),
        },
        {
          provider: "eZee",
          hotelId: "hotel-101",
          hotelCode: "EZEE-LIVE-201",
          status: "connected",
          twoWaySyncEnabled: true,
          lastSyncTime: new Date(),
        },
      ]);
    }
    res.json({ success: true, data: channels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get room and rate mappings
exports.getMappings = async (req, res) => {
  try {
    let mappings = await ChannelMapping.find();
    if (mappings.length === 0) {
      mappings = await ChannelMapping.insertMany([
        {
          provider: "STAAH",
          hosRoomType: "Deluxe King",
          channelRoomCode: "STH-DLX-01",
          otaRoomName: "Booking.com Deluxe King",
          baseRate: 4500,
          channelRateMultiplier: 1.05,
          stopSell: false,
          minStay: 1,
          maxStay: 30,
        },
        {
          provider: "SiteMinder",
          hosRoomType: "Superior Twin",
          channelRoomCode: "SM-TWN-02",
          otaRoomName: "MakeMyTrip Twin Deluxe",
          baseRate: 3800,
          channelRateMultiplier: 1.08,
          stopSell: false,
          minStay: 1,
          maxStay: 14,
        },
        {
          provider: "eZee",
          hosRoomType: "Executive Suite",
          channelRoomCode: "EZ-STE-03",
          otaRoomName: "Agoda Luxury Suite",
          baseRate: 8500,
          channelRateMultiplier: 1.10,
          stopSell: false,
          minStay: 2,
          maxStay: 60,
        },
      ]);
    }
    res.json({ success: true, data: mappings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Trigger manual or automatic sync
exports.triggerSync = async (req, res) => {
  try {
    const { hotelId, provider } = req.body;
    const result = await ChannelManagerService.triggerSync(hotelId || "hotel-101", provider || "STAAH");
    res.json({ success: true, message: "Channel synchronization completed successfully.", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update restrictions (Stop sell, min stay, max stay)
exports.updateRestriction = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await ChannelManagerService.updateRestriction(id, req.body);
    res.json({ success: true, message: "Inventory restriction updated.", data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Add a new Channel Provider / OTA
exports.addChannel = async (req, res) => {
  try {
    const { provider, hotelCode, apiKey, hotelId } = req.body;
    if (!provider) {
      return res.status(400).json({ success: false, message: "Channel provider name is required." });
    }

    const newChannel = await ChannelManager.create({
      provider,
      hotelId: hotelId || "hotel-101",
      hotelCode: hotelCode || `${provider.toUpperCase().replace(/\s+/g, "")}-${Date.now().toString().slice(-4)}`,
      apiKey: apiKey || "",
      status: "connected",
      twoWaySyncEnabled: true,
      lastSyncTime: new Date(),
    });

    res.status(201).json({ success: true, message: `${provider} connected successfully!`, data: newChannel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete / Disconnect a Channel Provider
exports.deleteChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ChannelManager.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Channel not found." });
    }
    res.json({ success: true, message: "Channel disconnected and removed successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add a new Room & Rate Mapping
exports.addMapping = async (req, res) => {
  try {
    const { provider, hosRoomType, channelRoomCode, otaRoomName, baseRate, channelRateMultiplier, minStay, maxStay } = req.body;
    if (!hosRoomType || !channelRoomCode) {
      return res.status(400).json({ success: false, message: "HOS Room Type and Channel Room Code are required." });
    }

    const mapping = await ChannelMapping.create({
      hotelId: "hotel-101",
      provider: provider || "STAAH",
      hosRoomType,
      channelRoomCode,
      otaRoomName: otaRoomName || `${hosRoomType} Standard`,
      baseRate: Number(baseRate) || 3500,
      channelRateMultiplier: Number(channelRateMultiplier) || 1.0,
      stopSell: false,
      minStay: Number(minStay) || 1,
      maxStay: Number(maxStay) || 30,
    });

    res.status(201).json({ success: true, message: "New room mapping created successfully.", data: mapping });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a Room & Rate Mapping
exports.deleteMapping = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ChannelMapping.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Mapping not found." });
    }
    res.json({ success: true, message: "Room mapping removed successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get sync logs
exports.getSyncLogs = async (req, res) => {
  try {
    const logs = await SyncLog.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
