const Hotel = require("../models/Hotel");
const AuditService = require("../services/audit.service");

class HotelsController {
  static async getAll(req, res, next) {
    const { orgId, region, status } = req.query;
    const filter = {};

    if (orgId) filter.orgId = orgId;
    if (region) filter.region = new RegExp(region, "i");
    if (status) filter.status = status;

    try {
      const hotels = await Hotel.find(filter);
      return res.status(200).json({
        success: true,
        count: hotels.length,
        data: hotels,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const hotel = await Hotel.findOne({ id: req.params.id });
      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: "Hotel not found",
        });
      }
      return res.status(200).json({
        success: true,
        data: hotel,
      });
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    const { name, city, region, totalRooms, managerName, phone, orgId } = req.body;

    try {
      const newHotel = new Hotel({
        id: `hotel-${Date.now()}`,
        orgId: orgId || req.tenant?.orgId || "org-1",
        name,
        city,
        region: region || "General",
        totalRooms: Number(totalRooms) || 50,
        occupiedRooms: 0,
        occupancyRate: 0,
        rating: 5.0,
        managerName: managerName || "General Manager",
        phone: phone || "+91 90000 00000",
        status: "open",
      });

      await newHotel.save();

      await AuditService.log({
        userId: req.user?.id || "system",
        userRole: req.user?.role || "hotel_admin",
        orgId: newHotel.orgId,
        hotelId: newHotel.id,
        action: "CREATE_HOTEL",
        resource: "hotels",
        resourceId: newHotel.id,
        details: { name, city, region },
        ipAddress: req.ip || req.connection?.remoteAddress,
      });

      return res.status(201).json({
        success: true,
        message: "Hotel added successfully",
        data: newHotel,
      });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const hotel = await Hotel.findOneAndDelete({ id });
      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: "Hotel not found",
        });
      }

      await AuditService.log({
        userId: req.user?.id || "system",
        userRole: req.user?.role || "hotel_admin",
        orgId: hotel.orgId,
        hotelId: hotel.id,
        action: "DELETE_HOTEL",
        resource: "hotels",
        resourceId: hotel.id,
        details: { name: hotel.name },
        ipAddress: req.ip || req.connection?.remoteAddress,
      });

      return res.status(200).json({
        success: true,
        message: `Property "${hotel.name}" deleted successfully`,
        data: hotel,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = HotelsController;
