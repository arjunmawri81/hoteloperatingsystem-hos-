const PosService = require("../services/pos.service");
const RestaurantTable = require("../models/RestaurantTable");
const KOT = require("../models/KOT");
const MenuItem = require("../models/MenuItem");
const Reservation = require("../models/Reservation");
const RestaurantOrder = require("../models/RestaurantOrder");

const DEFAULT_TABLES = [
  { tableNumber: "T-01", section: "Main Dining Hall", capacity: 4, status: "available" },
  { tableNumber: "T-02", section: "Main Dining Hall", capacity: 4, status: "available" },
  { tableNumber: "T-03", section: "Terrace Garden", capacity: 6, status: "available" },
  { tableNumber: "T-04", section: "Terrace Garden", capacity: 2, status: "available" },
  { tableNumber: "T-05", section: "Private Dining (PDR)", capacity: 8, status: "available" },
  { tableNumber: "T-06", section: "Private Dining (PDR)", capacity: 4, status: "available" },
  { tableNumber: "T-07", section: "Poolside Deck", capacity: 4, status: "available" },
  { tableNumber: "T-08", section: "Poolside Deck", capacity: 4, status: "available" },
  { tableNumber: "T-09", section: "Lounge Bar", capacity: 2, status: "available" },
  { tableNumber: "T-10", section: "Lounge Bar", capacity: 6, status: "available" },
];

const DEFAULT_MENU_ITEMS = [
  { name: "Paneer Tikka Angara", category: "Starters", price: 380, description: "Cottage cheese marinated with tandoori spices & charred in clay oven", isVeg: true, prepTimeMinutes: 15 },
  { name: "Murgh Malai Tikka", category: "Starters", price: 460, description: "Tender chicken morsels with cardamom, cream & cheese", isVeg: false, prepTimeMinutes: 18 },
  { name: "Crispy Corn & Water Chestnut", category: "Starters", price: 320, description: "Wok tossed golden corn with scallions & cracked pepper", isVeg: true, prepTimeMinutes: 12 },
  { name: "Dal Makhani Heritage", category: "Main Course", price: 390, description: "Slow cooked black lentils overnight with churned butter & cream", isVeg: true, prepTimeMinutes: 10 },
  { name: "Butter Chicken Delhi Style", category: "Main Course", price: 540, description: "Smoked tandoori chicken simmered in rich satin tomato gravy", isVeg: false, prepTimeMinutes: 20 },
  { name: "Paneer Lababdar", category: "Main Course", price: 420, description: "Paneer cubes in rich spiced onion-tomato and cashew gravy", isVeg: true, prepTimeMinutes: 15 },
  { name: "Dum Gosht Awadhi Biryani", category: "Main Course", price: 620, description: "Fragrant basmati rice layered with spiced mutton & saffron", isVeg: false, prepTimeMinutes: 22 },
  { name: "Subz Handi Biryani", category: "Main Course", price: 440, description: "Seasonal garden vegetables cooked in fragrant dum rice", isVeg: true, prepTimeMinutes: 18 },
  { name: "Garlic Butter Naan", category: "Breads & Rice", price: 95, description: "Clay oven leavened bread brushed with garlic butter", isVeg: true, prepTimeMinutes: 8 },
  { name: "Laccha Paratha", category: "Breads & Rice", price: 85, description: "Multi-layered crispy whole wheat bread with ghee", isVeg: true, prepTimeMinutes: 8 },
  { name: "Jeera Basmati Rice", category: "Breads & Rice", price: 180, description: "Steamed aged basmati rice tempered with roasted cumin", isVeg: true, prepTimeMinutes: 6 },
  { name: "Classic Tiramisu", category: "Desserts", price: 320, description: "Espresso soaked savoiardi biscuits with mascarpone cream", isVeg: true, prepTimeMinutes: 5 },
  { name: "Gulab Jamun with Rabdi", category: "Desserts", price: 260, description: "Warm khoya dumplings topped with thickened saffron milk", isVeg: true, prepTimeMinutes: 5 },
  { name: "Fresh Mint Mojito", category: "Beverages", price: 210, description: "Crushed mint leaves, fresh lime juice & sparkling soda", isVeg: true, prepTimeMinutes: 5 },
  { name: "Mango Lassi Royal", category: "Beverages", price: 180, description: "Chilled yogurt smoothie with Alphonso mango pulp & pistachios", isVeg: true, prepTimeMinutes: 5 },
  { name: "Masala Chai Pot", category: "Beverages", price: 140, description: "Brewed Assam tea leaves with aromatic whole spices", isVeg: true, prepTimeMinutes: 8 },
];

class PosController {
  static async getOrders(req, res, next) {
    try {
      const orders = await PosService.listOrders({
        status: req.query.status,
      });
      return res.status(200).json({
        success: true,
        count: orders.length,
        data: orders,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createOrder(req, res, next) {
    try {
      const order = await PosService.createOrder({
        data: req.body,
        user: req.user,
        tenant: req.tenant,
        ipAddress: req.ip || req.connection?.remoteAddress,
      });

      // Automatically create KOT for Kitchen Display System (KDS)
      const kotCount = await KOT.countDocuments();
      const kotNumber = `KOT-${1000 + kotCount + 1}`;
      const items = (req.body.items || []).map((item) => {
        if (typeof item === "string") {
          return { name: item.trim(), quantity: 1, instructions: "" };
        }
        return {
          name: item.name || item.title || "Dish",
          quantity: Number(item.quantity) || 1,
          instructions: item.instructions || "",
        };
      });

      const newKOT = await KOT.create({
        kotNumber,
        orderId: order.id || (order._id ? order._id.toString() : `ORD-${Date.now()}`),
        tableNumber: req.body.tableNumber || "T-01",
        roomNumber: req.body.roomNumber || null,
        serverName: req.body.serverName || (req.user?.name || "Server"),
        items,
        status: "new",
      });

      // Update table status to occupied if table specified
      if (req.body.tableNumber) {
        await RestaurantTable.findOneAndUpdate(
          { tableNumber: req.body.tableNumber },
          {
            status: "occupied",
            currentOrderId: order.id,
            currentGuestName: req.body.guestName || "Guest",
            roomNumber: req.body.roomNumber || null,
          }
        );
      }

      return res.status(201).json({
        success: true,
        message: "POS Order and Kitchen KOT created successfully",
        data: order,
        kot: newKOT,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const order = await PosService.updateOrderStatus({
        id,
        status,
        user: req.user,
        tenant: req.tenant,
        ipAddress: req.ip || req.connection?.remoteAddress,
      });
      return res.status(200).json({
        success: true,
        message: `Order ${id} status updated to ${status}`,
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  // --- Restaurant Table Management ---
  static async getTables(req, res) {
    try {
      let tables = await RestaurantTable.find().sort({ tableNumber: 1 });
      if (tables.length === 0) {
        await RestaurantTable.insertMany(DEFAULT_TABLES);
        tables = await RestaurantTable.find().sort({ tableNumber: 1 });
      }
      res.json({ success: true, data: tables });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async createTable(req, res) {
    try {
      const { tableNumber, section, capacity } = req.body;
      const existing = await RestaurantTable.findOne({ tableNumber });
      if (existing) {
        return res.status(400).json({ success: false, message: "Table already exists" });
      }
      const table = await RestaurantTable.create({ tableNumber, section, capacity });
      res.status(201).json({ success: true, data: table });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async updateTableStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, currentGuestName, roomNumber } = req.body;
      const table = await RestaurantTable.findByIdAndUpdate(
        id,
        { status, currentGuestName, roomNumber },
        { new: true }
      );
      res.json({ success: true, data: table });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async transferTable(req, res) {
    try {
      const { sourceTableNumber, targetTableNumber } = req.body;
      if (!sourceTableNumber || !targetTableNumber) {
        return res.status(400).json({ success: false, message: "Both source and target table numbers are required" });
      }

      const source = await RestaurantTable.findOne({ tableNumber: sourceTableNumber });
      const target = await RestaurantTable.findOne({ tableNumber: targetTableNumber });

      if (!source) {
        return res.status(404).json({ success: false, message: `Source table ${sourceTableNumber} not found` });
      }
      if (!target) {
        return res.status(404).json({ success: false, message: `Target table ${targetTableNumber} not found` });
      }

      await RestaurantOrder.updateMany(
        { tableNumber: sourceTableNumber, status: { $nin: ["paid", "cancelled"] } },
        { tableNumber: targetTableNumber }
      );
      await KOT.updateMany(
        { tableNumber: sourceTableNumber, status: { $ne: "completed" } },
        { tableNumber: targetTableNumber }
      );

      target.status = "occupied";
      target.currentOrderId = source.currentOrderId;
      target.currentGuestName = source.currentGuestName;
      target.roomNumber = source.roomNumber;
      await target.save();

      source.status = "cleaning";
      source.currentOrderId = null;
      source.currentGuestName = null;
      source.roomNumber = null;
      await source.save();

      res.json({
        success: true,
        message: `Successfully transferred orders from ${sourceTableNumber} to ${targetTableNumber}`,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // --- Kitchen Order Tickets (KOT) for KDS Screen ---
  static async getKOTs(req, res) {
    try {
      const filter = {};
      if (req.query.status && req.query.status !== "all") {
        filter.status = req.query.status;
      }
      const kots = await KOT.find(filter).sort({ createdAt: -1 }).limit(100);
      res.json({ success: true, data: kots });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async updateKOTStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body; // new, preparing, ready, served, completed
      const kot = await KOT.findByIdAndUpdate(id, { status }, { new: true });
      if (!kot) {
        return res.status(404).json({ success: false, message: "KOT not found" });
      }

      // Sync Order status
      if (kot.orderId) {
        await RestaurantOrder.findOneAndUpdate(
          { id: kot.orderId },
          { status: status === "ready" ? "ready" : status === "served" ? "served" : "cooking" }
        );
      }

      // If marked as served or completed, table can transition
      if (status === "completed" && kot.tableNumber) {
        await RestaurantTable.findOneAndUpdate(
          { tableNumber: kot.tableNumber },
          { status: "cleaning", currentOrderId: null }
        );
      }

      res.json({ success: true, data: kot });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  // --- Menu Management ---
  static async getMenu(req, res) {
    try {
      let items = await MenuItem.find().sort({ category: 1, name: 1 });
      if (items.length === 0) {
        await MenuItem.insertMany(DEFAULT_MENU_ITEMS);
        items = await MenuItem.find().sort({ category: 1, name: 1 });
      }
      res.json({ success: true, count: items.length, data: items });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async createMenuItem(req, res) {
    try {
      const item = await MenuItem.create(req.body);
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async updateMenuItem(req, res) {
    try {
      const { id } = req.params;
      const item = await MenuItem.findByIdAndUpdate(id, req.body, { new: true });
      res.json({ success: true, data: item });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async deleteMenuItem(req, res) {
    try {
      const { id } = req.params;
      await MenuItem.findByIdAndDelete(id);
      res.json({ success: true, message: "Menu item deleted" });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  // --- Post Restaurant Charge to Guest Room Folio ---
  static async chargeToRoom(req, res) {
    try {
      const { roomNumber, amount, description } = req.body;
      const cleanRoom = String(roomNumber || "").replace(/room\s*/i, "").trim();
      const activeReservation = await Reservation.findOne({
        $or: [
          { roomNumber: cleanRoom },
          { roomNumber: `Room ${cleanRoom}` },
          { roomNumber: new RegExp(`^${cleanRoom}$`, "i") },
        ],
        status: { $in: ["confirmed", "checked_in"] },
      });

      if (!activeReservation) {
        return res.status(404).json({
          success: false,
          message: `No active reservation found for room ${roomNumber} to post charge.`,
        });
      }

      activeReservation.folioCharges = activeReservation.folioCharges || [];
      activeReservation.folioCharges.push({
        description: description || "Restaurant Dining Bill",
        department: "Restaurant",
        amount: Number(amount),
        date: new Date(),
      });
      activeReservation.totalAmount = (activeReservation.totalAmount || 0) + Number(amount);
      await activeReservation.save();

      res.json({
        success: true,
        message: `Charge of ₹${amount} posted to Room ${roomNumber} (Folio ID: ${activeReservation.id})`,
        data: activeReservation,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = PosController;
