const InventoryItem = require("../models/InventoryItem");
const Supplier = require("../models/Supplier");
const PurchaseOrder = require("../models/PurchaseOrder");
const StockTransaction = require("../models/StockTransaction");
const PurchaseInward = require("../models/PurchaseInward");
const StockIssue = require("../models/StockIssue");

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
    let items = await InventoryItem.find(filter).sort({ createdAt: -1 });
    let allItems = await InventoryItem.find({});

    if (allItems.length === 0 && !category && !search) {
      const defaultItems = [
        {
          sku: "SKU-LIN-101",
          name: "Egyptian Cotton Bath Towels",
          category: "Linen & Bedding",
          quantity: 150,
          minStock: 50,
          unit: "Pieces",
          unitPrice: 450,
          status: "In Stock",
          supplier: "Royal Textiles Ltd",
        },
        {
          sku: "SKU-AME-202",
          name: "Luxury Herbal Shampoo 50ml",
          category: "Guest Amenities",
          quantity: 400,
          minStock: 100,
          unit: "Bottles",
          unitPrice: 35,
          status: "In Stock",
          supplier: "Botanical Amenities",
        },
        {
          sku: "SKU-CLN-303",
          name: "Floor Disinfectant Liquid 5L",
          category: "Cleaning Supplies",
          quantity: 12,
          minStock: 25,
          unit: "Cans",
          unitPrice: 850,
          status: "Low Stock",
          supplier: "CleanTech Chemicals",
        },
        {
          sku: "SKU-FNB-404",
          name: "Premium Arabica Coffee Beans",
          category: "Food & Beverage",
          quantity: 25,
          minStock: 10,
          unit: "Kg",
          unitPrice: 1200,
          status: "In Stock",
          supplier: "Coorg Plantation Imports",
        },
        {
          sku: "SKU-MNT-505",
          name: "LED Warm White Bulbs 12W",
          category: "Maintenance",
          quantity: 80,
          minStock: 30,
          unit: "Pieces",
          unitPrice: 120,
          status: "In Stock",
          supplier: "Philips Commercial",
        },
      ];
      await InventoryItem.insertMany(defaultItems);
      items = await InventoryItem.find(filter).sort({ createdAt: -1 });
      allItems = await InventoryItem.find({});
    }
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

    // Record initial transaction
    await StockTransaction.create({
      transactionId: `TXN-${Date.now()}`,
      itemId: newItem._id.toString(),
      itemName: newItem.name,
      type: "purchase_receipt",
      quantity: qty,
      previousStock: 0,
      newStock: qty,
      department: "General Store",
      reason: "Initial Stock Inflow",
    });

    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    next(error);
  }
};

exports.updateInventoryItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await InventoryItem.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

// --- Suppliers ---
exports.getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json({ success: true, data: suppliers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const count = await Supplier.countDocuments();
    const code = req.body.code || `SUP-${100 + count + 1}`;
    const supplier = await Supplier.create({ ...req.body, code });
    res.status(201).json({ success: true, data: supplier });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// --- Purchase Orders ---
exports.getPurchaseOrders = async (req, res) => {
  try {
    const pos = await PurchaseOrder.find().sort({ createdAt: -1 });
    res.json({ success: true, data: pos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createPurchaseOrder = async (req, res) => {
  try {
    const count = await PurchaseOrder.countDocuments();
    const poNumber = `PO-${3000 + count + 1}`;
    const subtotal = (req.body.items || []).reduce((sum, it) => sum + (it.totalPrice || 0), 0);
    const taxAmount = Math.round(subtotal * 0.18);
    const grandTotal = subtotal + taxAmount;

    const po = await PurchaseOrder.create({
      ...req.body,
      poNumber,
      subtotal,
      taxAmount,
      grandTotal,
    });
    res.status(201).json({ success: true, data: po });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updatePOStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approvedBy } = req.body;
    const po = await PurchaseOrder.findByIdAndUpdate(id, { status, approvedBy }, { new: true });
    res.json({ success: true, data: po });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// --- Stock Adjustments & Movement Ledger ---
exports.adjustStock = async (req, res) => {
  try {
    const { itemId, adjustmentQty, type, reason, department } = req.body;
    const item = await InventoryItem.findById(itemId);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    const prev = item.quantity;
    const change = Number(adjustmentQty);
    const nextQty = Math.max(0, prev + change);

    item.quantity = nextQty;
    item.status = nextQty <= item.minStock * 0.5 ? "Critical" : nextQty <= item.minStock ? "Low Stock" : "In Stock";
    await item.save();

    const txn = await StockTransaction.create({
      transactionId: `TXN-${Date.now()}`,
      itemId: item._id.toString(),
      itemName: item.name,
      type: type || "damage_writeoff",
      quantity: change,
      previousStock: prev,
      newStock: nextQty,
      department: department || "General Store",
      reason: reason || "Manual stock adjustment",
    });

    res.json({ success: true, message: "Stock adjusted and logged to ledger", data: { item, txn } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStockLedger = async (req, res) => {
  try {
    const ledger = await StockTransaction.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: ledger });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- GRN / Purchase Inward (Video 4) ---
exports.createPurchaseInward = async (req, res) => {
  try {
    const { vendorName, vendorGstin, invoiceNumber, invoiceDate, department, items = [], totalAmount, receivedBy, notes } = req.body;

    if (!vendorName || !invoiceNumber || items.length === 0) {
      return res.status(400).json({ success: false, message: "Vendor, invoice number, and at least 1 item required" });
    }

    const grnNumber = `GRN-${Date.now().toString().slice(-6)}`;

    const grn = await PurchaseInward.create({
      grnNumber,
      vendorName,
      vendorGstin: vendorGstin || "",
      invoiceNumber,
      invoiceDate: invoiceDate || new Date(),
      department: department || "Housekeeping",
      items,
      totalAmount: Number(totalAmount) || 0,
      receivedBy: receivedBy || "Store Keeper",
      notes: notes || "",
    });

    // Increment inventory stock for each received item
    for (const itm of items) {
      const existing = await InventoryItem.findOne({ sku: itm.sku });
      if (existing) {
        const prevStock = existing.quantity;
        existing.quantity += Number(itm.quantity);
        existing.unitPrice = Number(itm.unitPrice) || existing.unitPrice;
        existing.status = existing.quantity <= existing.minStock ? "Low Stock" : "In Stock";
        await existing.save();

        await StockTransaction.create({
          transactionId: `TXN-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          itemId: existing._id.toString(),
          itemName: existing.name,
          type: "purchase_receipt",
          quantity: Number(itm.quantity),
          previousStock: prevStock,
          newStock: existing.quantity,
          department: department || "General Store",
          reason: `GRN #${grnNumber} from ${vendorName}`,
        });
      } else {
        // Create new item if not exists
        const newItem = await InventoryItem.create({
          sku: itm.sku,
          name: itm.name,
          category: department === "Kitchen & F&B" ? "Food & Beverage" : "Guest Amenities",
          quantity: Number(itm.quantity),
          minStock: 20,
          unitPrice: Number(itm.unitPrice) || 0,
          supplier: vendorName,
          status: "In Stock",
        });

        await StockTransaction.create({
          transactionId: `TXN-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          itemId: newItem._id.toString(),
          itemName: newItem.name,
          type: "purchase_receipt",
          quantity: Number(itm.quantity),
          previousStock: 0,
          newStock: Number(itm.quantity),
          department: department || "General Store",
          reason: `New Item GRN #${grnNumber}`,
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: `GRN #${grnNumber} generated and stock updated successfully.`,
      data: grn,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPurchaseInwards = async (req, res) => {
  try {
    const list = await PurchaseInward.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Departmental Stock Issue (Video 4) ---
exports.createStockIssue = async (req, res) => {
  try {
    const { department, issuedToStaff, purpose, items = [] } = req.body;

    if (!department || !issuedToStaff || items.length === 0) {
      return res.status(400).json({ success: false, message: "Department, staff name, and items required" });
    }

    const issueNumber = `ISS-${Date.now().toString().slice(-6)}`;

    const issue = await StockIssue.create({
      issueNumber,
      department,
      issuedToStaff,
      purpose: purpose || "Departmental usage",
      items,
      date: new Date(),
    });

    // Deduct stock
    for (const itm of items) {
      const existing = await InventoryItem.findOne({ sku: itm.sku });
      if (existing) {
        const prev = existing.quantity;
        const deduct = Math.min(existing.quantity, Number(itm.quantity));
        existing.quantity -= deduct;
        existing.status = existing.quantity <= existing.minStock * 0.5 ? "Critical" : existing.quantity <= existing.minStock ? "Low Stock" : "In Stock";
        await existing.save();

        await StockTransaction.create({
          transactionId: `TXN-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          itemId: existing._id.toString(),
          itemName: existing.name,
          type: "department_issue",
          quantity: -deduct,
          previousStock: prev,
          newStock: existing.quantity,
          department,
          reason: `Issued to ${issuedToStaff} (${purpose})`,
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: `Stock Issue #${issueNumber} completed. Inventory deducted.`,
      data: issue,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStockIssues = async (req, res) => {
  try {
    const list = await StockIssue.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
