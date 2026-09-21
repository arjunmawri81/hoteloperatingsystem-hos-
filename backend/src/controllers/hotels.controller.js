const Hotel = require("../models/Hotel");
const AuditService = require("../services/audit.service");

class HotelsController {
  static async getAll(req, res, next) {
    const { orgId, region, status, hotelId } = req.query;
    const filter = {};

    const userRole = req.user?.role || req.tenant?.role;
    let targetOrgId = req.user?.orgId || req.tenant?.orgId;
    if (userRole === "super_admin") {
      targetOrgId = orgId || req.tenant?.orgId || null;
    } else if (!targetOrgId && orgId && orgId !== "all" && orgId !== "org-1") {
      targetOrgId = orgId;
    }

    const targetHotelId = hotelId || req.tenant?.hotelId || req.user?.hotelId;

    if (userRole === "super_admin" && !targetOrgId && !targetHotelId) {
      // Super admin sees all properties if no filter requested
    } else if (targetOrgId && targetOrgId !== "all") {
      filter.orgId = targetOrgId;

      if (userRole === "area_manager") {
        const assignedNames = req.user?.assignedHotelNames || [];
        if (assignedNames.length > 0) {
          filter.name = { $in: assignedNames };
        }
      } else if (
        ["hotel_manager", "receptionist", "housekeeping", "restaurant_staff", "kitchen_staff", "finance"].includes(userRole)
      ) {
        if (targetHotelId) {
          filter.id = targetHotelId;
        } else if (req.user?.hotelName) {
          filter.name = new RegExp(`^${req.user.hotelName.trim()}$`, "i");
        }
      }
    } else if (userRole && userRole !== "super_admin" && userRole !== "customer") {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

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
    const {
      name,
      city,
      region,
      totalRooms,
      managerName,
      phone,
      orgId,
      images,
      legalKyc,
      locationDetails,
      policies,
      verificationStatus,
    } = req.body;

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
        images: images || {},
        legalKyc: legalKyc || {},
        locationDetails: locationDetails || {},
        policies: policies || {
          checkInTime: "12:00 PM",
          checkOutTime: "11:00 AM",
          category: "3-Star Hotel",
          amenities: ["Free High-Speed Wi-Fi", "Air Conditioning (AC)", "24/7 Power Backup"],
        },
        verificationStatus: verificationStatus || "verified",
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
