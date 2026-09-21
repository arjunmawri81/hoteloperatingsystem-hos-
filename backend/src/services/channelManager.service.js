const ChannelManager = require("../models/ChannelManager");
const ChannelMapping = require("../models/ChannelMapping");
const SyncLog = require("../models/SyncLog");
const Room = require("../models/Room");
const Reservation = require("../models/Reservation");

class ChannelManagerService {
  /**
   * Run 2-way sync across all configured OTA channels
   */
  static async triggerSync(hotelId = "hotel-101", provider = "STAAH") {
    try {
      // 1. Get channel mapping
      const mappings = await ChannelMapping.find({ provider });
      const availableRoomsCount = await Room.countDocuments({ status: "available" });

      // 2. Mock OTA Adapter payload transmission
      const syncResult = {
        hotelId,
        provider,
        timestamp: new Date().toISOString(),
        availableInventoryPushed: availableRoomsCount,
        mappingsUpdated: mappings.length,
        status: "success",
      };

      // 3. Record in SyncLog
      const log = await SyncLog.create({
        hotelId,
        provider,
        syncType: "full",
        direction: "outbound_to_ota",
        status: "success",
        recordsAffected: mappings.length,
        payloadSnippet: `Pushed ${availableRoomsCount} available rooms across ${mappings.length} mapped rate categories`,
      });

      // 4. Update last sync time on channel config
      await ChannelManager.findOneAndUpdate(
        { hotelId, provider },
        { lastSyncTime: new Date(), status: "connected" },
        { upsert: true }
      );

      return { success: true, log, result: syncResult };
    } catch (error) {
      await SyncLog.create({
        hotelId,
        provider,
        syncType: "full",
        direction: "outbound_to_ota",
        status: "failed",
        errorMessage: error.message,
      });
      throw error;
    }
  }

  /**
   * Update restriction (Stop Sell or Min Stay)
   */
  static async updateRestriction(mappingId, { stopSell, minStay, maxStay }) {
    return await ChannelMapping.findByIdAndUpdate(
      mappingId,
      {
        ...(stopSell !== undefined && { stopSell }),
        ...(minStay !== undefined && { minStay }),
        ...(maxStay !== undefined && { maxStay }),
      },
      { new: true }
    );
  }
}

module.exports = ChannelManagerService;
