const express = require("express");
const { mockHotels } = require("../data/mockData");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/hotels
 * Query params: orgId, region, status
 */
router.get("/", (req, res) => {
  const { orgId, region, status } = req.query;
  let result = [...mockHotels];

  if (orgId) {
    result = result.filter((h) => h.orgId === orgId);
  }
  if (region) {
    result = result.filter((h) => h.region.toLowerCase().includes(region.toLowerCase()));
  }
  if (status) {
    result = result.filter((h) => h.status === status);
  }

  return res.status(200).json({
    success: true,
    count: result.length,
    data: result,
  });
});

/**
 * GET /api/hotels/:id
 */
router.get("/:id", (req, res) => {
  const hotel = mockHotels.find((h) => h.id === req.params.id);
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
});

/**
 * POST /api/hotels
 */
router.post("/", verifyToken, (req, res) => {
  const { name, city, region, totalRooms, managerName, phone, orgId } = req.body;

  if (!name || !city) {
    return res.status(400).json({
      success: false,
      message: "Hotel name and city are required",
    });
  }

  const newHotel = {
    id: `hotel-${Date.now()}`,
    orgId: orgId || req.user?.orgId || "org-1",
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
  };

  mockHotels.push(newHotel);

  return res.status(201).json({
    success: true,
    message: "Hotel added successfully",
    data: newHotel,
  });
});

module.exports = router;
