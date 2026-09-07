"use client";

import { useState, useEffect } from "react";
import { inventoryApi } from "@/lib/api";
import { Plus, X, Search, Package, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";

interface InventoryItem {
  _id?: string;
  sku: string;
  name: string;
  category: "Linen & Bedding" | "Guest Amenities" | "Cleaning Supplies" | "Food & Beverage" | "Maintenance";
  quantity: number;
  minStock: number;
  unit: string;
  unitPrice: number;
  status: "In Stock" | "Low Stock" | "Critical";
  supplier: string;
}

export default function InventoryManagementPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [metrics, setMetrics] = useState<any>({ totalSKUs: 0, totalValue: 0, lowStockCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [newItem, setNewItem] = useState({
    sku: "",
    name: "",
    category: "Guest Amenities" as InventoryItem["category"],
    quantity: 100,
    minStock: 30,
    unit: "Units",
    unitPrice: 150.0,
    supplier: "Direct Supplies",
  });

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const res = await inventoryApi.getAll();
      if (res && res.data) {
        setItems(res.data);
        if (res.metrics) setMetrics(res.metrics);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name) return;

    try {
      const created = await inventoryApi.create({
        sku: newItem.sku || `SKU-${Date.now().toString().slice(-4)}`,
        name: newItem.name,
        category: newItem.category,
        quantity: Number(newItem.quantity),
        minStock: Number(newItem.minStock),
        unit: newItem.unit,
        unitPrice: Number(newItem.unitPrice),
        supplier: newItem.supplier,
      });

      setItems([created, ...items]);
      setIsModalOpen(false);
      setToastMsg(`✅ Stock item "${created.name}" saved to MongoDB database`);
      setTimeout(() => setToastMsg(null), 3500);

      setNewItem({
        sku: "",
        name: "",
        category: "Guest Amenities",
        quantity: 100,
        minStock: 30,
        unit: "Units",
        unitPrice: 12.0,
        supplier: "Direct Supplies",
      });
    } catch (err) {
      console.error("Failed to add inventory item:", err);
    }
  };

  const handleAdjustStock = async (sku: string, delta: number) => {
    try {
      const updated = await inventoryApi.adjust(sku, delta);
      setItems(items.map((it) => (it.sku === sku ? updated : it)));
      setToastMsg(`Stock for SKU ${sku} adjusted in database`);
      setTimeout(() => setToastMsg(null), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = items.filter((it) => {
    const matchesSearch =
      it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.supplier.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat = categoryFilter === "all" || it.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const totalValue = items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
  const lowStockCount = items.filter((it) => it.status === "Low Stock" || it.status === "Critical").length;

  const categories = ["all", "Linen & Bedding", "Guest Amenities", "Cleaning Supplies", "Food & Beverage", "Maintenance"];

  return (
    <RoleGuard
      allowedRoles={["super_admin", "hotel_admin", "hotel_manager"]}
      moduleName="Inventory & Stock Management"
    >
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
            Inventory &amp; Stock Management
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Hotel consumables, linen par-levels, stock audits &amp; reordering (Database Persisted)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadInventory}
            title="Refresh database records"
            className="p-2 border border-[#D1D5DB] rounded text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock Item</span>
          </button>
        </div>
      </div>

      {/* Toast Notice */}
      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[13px] px-4 py-2.5 rounded flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-xs">
          <div className="text-[11px] font-bold text-[#6B7280] uppercase">Total Active SKUs</div>
          <div className="text-[24px] font-bold text-[#111827] mt-1.5">{items.length} Items</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-xs">
          <div className="text-[11px] font-bold text-[#6B7280] uppercase">Total Inventory Value</div>
          <div className="text-[24px] font-bold text-[#111827] mt-1.5">₹{totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-xs">
          <div className="text-[11px] font-bold text-rose-600 uppercase">Low Stock Alerts</div>
          <div className="text-[24px] font-bold text-rose-700 mt-1.5">{lowStockCount} Critical / Low</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded text-[12px] font-semibold capitalize transition-colors ${
                categoryFilter === cat
                  ? "bg-[#111827] text-white"
                  : "text-[#4B5563] hover:bg-[#F3F4F6]"
              }`}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search SKU, item, supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013] w-full sm:w-64"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-[#F9FAFB]">
                <th className="py-3 px-4 font-bold">SKU</th>
                <th className="py-3 px-4 font-bold">ITEM DESCRIPTION</th>
                <th className="py-3 px-4 font-bold">CATEGORY</th>
                <th className="py-3 px-4 font-bold">STOCK ON HAND</th>
                <th className="py-3 px-4 font-bold">MIN PAR</th>
                <th className="py-3 px-4 font-bold">STATUS</th>
                <th className="py-3 px-4 text-right font-bold">QUICK ADJUST</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#9CA3AF]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#EC3013]" />
                      <span>Loading inventory catalog from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#9CA3AF]">
                    No inventory items in database yet. Click &quot;Add Stock Item&quot; to begin cataloging supplies.
                  </td>
                </tr>
              ) : (
                filteredItems.map((it) => (
                  <tr key={it.sku} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#111827]">
                      {it.sku}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#111827]">
                      <div>{it.name}</div>
                      <div className="text-[11px] text-[#9CA3AF]">{it.supplier} · ₹{(it.unitPrice || 0).toFixed(2)} / {it.unit}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-[#F3F4F6] text-[#374151] px-2 py-0.5 rounded text-[11px] font-medium">
                        {it.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#111827]">
                      {it.quantity} {it.unit}
                    </td>
                    <td className="py-3.5 px-4 text-[#6B7280]">
                      {it.minStock} {it.unit}
                    </td>
                    <td className="py-3.5 px-4">
                      {it.status === "In Stock" ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          In Stock
                        </span>
                      ) : it.status === "Low Stock" ? (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Low Stock
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Critical
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => handleAdjustStock(it.sku, -5)}
                        className="px-2 py-1 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#111827] text-[11px] font-bold rounded shadow-xs"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustStock(it.sku, 10)}
                        className="px-2 py-1 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#111827] text-[11px] font-bold rounded shadow-xs"
                      >
                        +10
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Stock Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#EC3013]" />
                <h3 className="text-[16px] font-bold text-[#111827]">Add Stock Item</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4 text-[13px]">
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Item Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Microfiber Cleaning Cloths (Pack of 12)"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SKU-CLN-09"
                    value={newItem.sku}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white"
                  >
                    <option value="Linen & Bedding">Linen &amp; Bedding</option>
                    <option value="Guest Amenities">Guest Amenities</option>
                    <option value="Cleaning Supplies">Cleaning Supplies</option>
                    <option value="Food & Beverage">Food &amp; Beverage</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Min Par
                  </label>
                  <input
                    type="number"
                    value={newItem.minStock}
                    onChange={(e) => setNewItem({ ...newItem, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Supplier / Vendor
                </label>
                <input
                  type="text"
                  placeholder="e.g. EcoAmenities Global"
                  value={newItem.supplier}
                  onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#D1D5DB] rounded text-[#374151] font-semibold hover:bg-[#F3F4F6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded shadow-xs"
                >
                  Save to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </RoleGuard>
  );
}
