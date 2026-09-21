const RatePlan = require("../models/RatePlan");

exports.getAllRatePlans = async (req, res, next) => {
  try {
    let plans = await RatePlan.find({ isActive: true }).sort({ code: 1 });
    if (plans.length === 0) {
      // Seed initial standard rate plans as per PDF Sec 12.9
      plans = await RatePlan.insertMany([
        {
          id: "rp-ep",
          code: "EP",
          name: "European Plan (Room Only)",
          description: "Room stay with complimentary high speed Wi-Fi.",
          inclusions: ["Room Only", "Complimentary Wi-Fi", "Access to Gym"],
          priceMultiplier: 1.0,
          minNights: 1,
        },
        {
          id: "rp-cp",
          code: "CP",
          name: "Continental Plan (With Breakfast)",
          description: "Includes gourmet buffet breakfast at restaurant.",
          inclusions: ["Buffet Breakfast", "Complimentary Wi-Fi", "Early Morning Coffee"],
          priceMultiplier: 1.15,
          minNights: 1,
        },
        {
          id: "rp-map",
          code: "MAP",
          name: "Modified American Plan (Half Board)",
          description: "Includes breakfast and choice of lunch or dinner.",
          inclusions: ["Buffet Breakfast", "Lunch or Dinner Included", "Wi-Fi"],
          priceMultiplier: 1.35,
          minNights: 1,
        },
        {
          id: "rp-corp",
          code: "CORP",
          name: "Corporate Executive Plan",
          description: "Special business rate with late checkout & airport pickup.",
          inclusions: ["Breakfast", "Late Checkout 2 PM", "Express Laundry 2 pcs"],
          priceMultiplier: 1.2,
          minNights: 1,
        },
      ]);
    }
    return res.status(200).json({ success: true, count: plans.length, data: plans });
  } catch (error) {
    next(error);
  }
};

exports.createRatePlan = async (req, res, next) => {
  try {
    const { code, name, description, inclusions, priceMultiplier, fixedExtraCharge, minNights } = req.body;
    const newPlan = await RatePlan.create({
      id: `rp-${Date.now()}`,
      code,
      name,
      description,
      inclusions: inclusions || [],
      priceMultiplier: Number(priceMultiplier) || 1.0,
      fixedExtraCharge: Number(fixedExtraCharge) || 0,
      minNights: Number(minNights) || 1,
    });
    return res.status(201).json({ success: true, message: "Rate plan created", data: newPlan });
  } catch (error) {
    next(error);
  }
};
