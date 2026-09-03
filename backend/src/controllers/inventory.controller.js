const InventoryItem = require("../models/InventoryItem");

exports.getAllInventory = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const filter = {};
    if (category && category !== "all") {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { supplier: { $regex: search, $options: "i" } },
      ];
    }
    const items = await InventoryItem.find(filter).sort({ createdAt: -1 });

    const allItems = await InventoryItem.find({});
    const totalValue = allItems.reduce((acc, it) => acc + (it.quantity || 0) * (it.unitPrice || 0), 0);
    const lowStockCount = allItems.filter((it) => it.status === "Low Stock" || it.status === "Critical").length;

    res.status(200).json({
      success: true,
      count: items.length,
      metrics: {
        totalSKUs: allItems.length,
        totalValue,
        lowStockCount,
      },
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

exports.createInventoryItem = async (req, res, next) => {
  try {
    const { sku, name, category, quantity, minStock, unit, unitPrice, supplier } = req.body;
    const qty = Number(quantity) || 0;
    const min = Number(minStock) || 10;
    const status = qty <= min * 0.5 ? "Critical" : qty <= min ? "Low Stock" : "In Stock";

    const newItem = await InventoryItem.create({
      sku: sku || `SKU-${Date.now().toString().slice(-4)}`,
      name,
      category: category || "Guest Amenities",
      quantity: qty,
      minStock: min,
      unit: unit || "Units",
      unitPrice: Number(unitPrice) || 0,
      status,
      supplier: supplier || "Direct Supplies",
    });
    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    next(error);
  }
};

exports.adjustStock = async (req, res, next) => {
  try {
    const { sku } = req.params;
    const { delta } = req.body;

    const item = await InventoryItem.findOne({ sku });
    if (!item) {
      return res.status(404).json({ success: false, message: `Item with SKU ${sku} not found.` });
    }

    const newQty = Math.max(0, item.quantity + Number(delta));
    const status = newQty <= item.minStock * 0.5 ? "Critical" : newQty <= item.minStock ? "Low Stock" : "In Stock";

    item.quantity = newQty;
    item.status = status;
    await item.save();

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};
