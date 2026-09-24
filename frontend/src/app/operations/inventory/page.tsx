"use client";

import { useState, useEffect } from "react";
import { inventoryApi } from "@/lib/api";
import {
  Plus,
  X,
  Search,
  Package,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Truck,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  FileText,
  Boxes,
  Layers,
  Store,
  History,
  Trash2,
  Sparkles,
} from "lucide-react";
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
  const [grnList, setGrnList] = useState<any[]>([]);
  const [issuesList, setIssuesList] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({ totalSKUs: 0, totalValue: 0, lowStockCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "housekeeping" | "kitchen" | "grn" | "issues">("all");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals State
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isGrnModalOpen, setIsGrnModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  // New Item State
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

  // GRN Purchase Inward State
  const [grnVendor, setGrnVendor] = useState("Royal Linen Mills Pvt Ltd");
  const [grnVendorGstin, setGrnVendorGstin] = useState("29ABCDE1234F1Z5");
  const [grnInvoiceNo, setGrnInvoiceNo] = useState("INV-2026-9041");
  const [grnDepartment, setGrnDepartment] = useState("Housekeeping");
  const [grnItems, setGrnItems] = useState<Array<{
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    unit?: string;
    isCustomNew?: boolean;
  }>>([
    { sku: "SKU-LIN-101", name: "Egyptian Cotton Bath Towels", quantity: 50, unitPrice: 450, unit: "Pieces", isCustomNew: false },
  ]);

  // Stock Issue State (Video 4)
  const [issueDept, setIssueDept] = useState("Housekeeping");
  const [issueStaff, setIssueStaff] = useState("Ramu Housekeeping Lead");
  const [issuePurpose, setIssuePurpose] = useState("Daily Floor 1 & 2 guest room replenishment");
  const [issueSelectedSku, setIssueSelectedSku] = useState("SKU-LIN-101");
  const [issueQuantity, setIssueQuantity] = useState(15);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const [res, grns, issues] = await Promise.all([
        inventoryApi.getAll(),
        inventoryApi.getGRNs(),
        inventoryApi.getIssues(),
      ]);

      if (res && res.data) {
        setItems(res.data);
        if (res.metrics) setMetrics(res.metrics);
      }
      setGrnList(grns || []);
      setIssuesList(issues || []);
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
    try {
      const created = await inventoryApi.create(newItem);
      if (created) {
        setToastMsg(`SKU ${created.sku} added to stock successfully!`);
        setIsAddItemModalOpen(false);
        setNewItem({
          sku: "",
          name: "",
          category: "Guest Amenities",
          quantity: 100,
          minStock: 30,
          unit: "Units",
          unitPrice: 150.0,
          supplier: "Direct Supplies",
        });
        loadInventory();
      }
    } catch (err: any) {
      alert(err.message || "Failed to add item");
    }
  };

  // Submit GRN Purchase Inward
  const handleSubmitGRN = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (grnItems.length === 0) {
        alert("Please add at least one item");
        return;
      }

      // Check validation for each row
      for (const item of grnItems) {
        if (!item.name || !item.sku || item.quantity <= 0) {
          alert("Please fill all item names, SKU, and valid quantities");
          return;
        }
      }

      const totalAmount = grnItems.reduce((sum, itm) => sum + (Number(itm.quantity) * (Number(itm.unitPrice) || 0) * 1.18), 0);
      const res = await inventoryApi.createGRN({
        vendorName: grnVendor,
        vendorGstin: grnVendorGstin,
        invoiceNumber: grnInvoiceNo,
        department: grnDepartment,
        items: grnItems.map((itm) => ({
          sku: itm.sku,
          name: itm.name,
          quantity: Number(itm.quantity),
          unitPrice: Number(itm.unitPrice) || 0,
          unit: itm.unit || "Units",
        })),
        totalAmount,
        receivedBy: "Store Manager",
      });

      if (res && res.success) {
        setToastMsg(`✅ Purchase Inward ${res.data?.grnNumber || "GRN"} recorded and ${grnItems.length} item(s) added/increased!`);
        setIsGrnModalOpen(false);
        loadInventory();
      } else {
        alert(res.message || "Failed to record GRN");
      }
    } catch (err: any) {
      alert(err.message || "GRN entry failed");
    }
  };

  // Submit Departmental Stock Issue
  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetItem = items.find((i) => i.sku === issueSelectedSku);
      const res = await inventoryApi.createIssue({
        department: issueDept,
        issuedToStaff: issueStaff,
        purpose: issuePurpose,
        items: [
          {
            sku: issueSelectedSku,
            name: targetItem?.name || issueSelectedSku,
            quantity: Number(issueQuantity),
            unit: targetItem?.unit || "Units",
          },
        ],
      });

      if (res && res.success) {
        setToastMsg(`📦 ${issueQuantity} units issued to ${issueStaff} for ${issueDept}!`);
        setIsIssueModalOpen(false);
        loadInventory();
      } else {
        alert(res.message || "Failed to issue stock");
      }
    } catch (err: any) {
      alert(err.message || "Stock issue failed");
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "housekeeping") {
      return matchesSearch && (item.category === "Linen & Bedding" || item.category === "Guest Amenities" || item.category === "Cleaning Supplies");
    }
    if (activeTab === "kitchen") {
      return matchesSearch && item.category === "Food & Beverage";
    }
    return matchesSearch;
  });

  const lowStockItems = items.filter((i) => i.quantity <= i.minStock);

  return (
    <RoleGuard
      allowedRoles={["super_admin", "hotel_admin", "hotel_manager", "inventory_staff"]}
      moduleName="Inventory & Procurement"
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
              Smart Inventory &amp; Stock Control
            </h1>
            <p className="text-[13px] text-[#6B7280] mt-0.5">
              Departmental stores, vendor purchase inward (GRN), staff stock issue &amp; low-stock alerts
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadInventory}
              title="Refresh"
              className="p-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] rounded text-[#4B5563] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
            </button>

            <button
              onClick={() => setIsIssueModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] text-[13px] font-bold rounded shadow-xs transition-colors"
            >
              <ArrowUpRight className="w-4 h-4 text-indigo-600" />
              <span>Issue to Staff</span>
            </button>

            <button
              onClick={() => setIsGrnModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] text-[13px] font-bold rounded shadow-xs transition-colors"
            >
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Purchase Inward (GRN)</span>
            </button>

            <button
              onClick={() => setIsAddItemModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Item / SKU</span>
            </button>
          </div>
        </div>

        {/* Toast */}
        {toastMsg && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[13px] px-4 py-2.5 rounded-lg flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMsg}</span>
            </div>
            <button onClick={() => setToastMsg(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Low Stock Urgent Alert Banner */}
        {lowStockItems.length > 0 && (
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between text-amber-900 text-[13px]">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">{lowStockItems.length} Items Running Low!</span>
                <span className="text-amber-800 text-xs block">
                  {lowStockItems.map((i) => i.name).slice(0, 3).join(", ")}
                  {lowStockItems.length > 3 ? ` and ${lowStockItems.length - 3} more` : ""} need reordering.
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsGrnModalOpen(true)}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold shrink-0"
            >
              Quick Restock (GRN)
            </button>
          </div>
        )}

        {/* Metric Cards (Vibrant Reference Style - Red, Green, Orange, Cyan) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="relative overflow-hidden bg-[#E53935] hover:bg-[#D32F2F] p-6 rounded-xl text-white shadow-lg shadow-red-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                  {lowStockItems.length}
                </div>
                <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                  Low Stock Alerts
                </div>
                <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                  Requires urgent reorder
                </div>
              </div>
              <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
                <AlertTriangle className="w-7 h-7 stroke-[2]" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-[#43A047] hover:bg-[#388E3C] p-6 rounded-xl text-white shadow-lg shadow-green-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                  ₹{items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0).toLocaleString("en-IN")}
                </div>
                <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                  Stock Valuation
                </div>
                <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                  Store inventory asset value
                </div>
              </div>
              <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
                <Package className="w-7 h-7 stroke-[2]" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-[#FB8C00] hover:bg-[#F57C00] p-6 rounded-xl text-white shadow-lg shadow-orange-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                  {grnList.length}
                </div>
                <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                  Purchase Inwards (GRN)
                </div>
                <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                  Vendor invoices inwarded
                </div>
              </div>
              <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
                <Truck className="w-7 h-7 stroke-[2]" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-[#00ACC1] hover:bg-[#0097A7] p-6 rounded-xl text-white shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                  {items.length} SKUs
                </div>
                <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                  Total Active Items
                </div>
                <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                  Across hotel departments
                </div>
              </div>
              <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
                <Boxes className="w-7 h-7 stroke-[2]" />
              </div>
            </div>
          </div>
        </div>

        {/* Departmental Store Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] overflow-x-auto">
          {[
            { key: "all", label: "All Items", icon: Boxes },
            { key: "housekeeping", label: "Housekeeping Store", icon: Store },
            { key: "kitchen", label: "Kitchen & F&B Store", icon: Store },
            { key: "grn", label: `Purchase Inwards (${grnList.length})`, icon: Truck },
            { key: "issues", label: `Staff Issues (${issuesList.length})`, icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`pb-2.5 px-3.5 text-[13px] font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? "border-[#EC3013] text-[#EC3013]"
                    : "border-transparent text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1, 2, 3: INVENTORY ITEMS TABLE */}
        {(activeTab === "all" || activeTab === "housekeeping" || activeTab === "kitchen") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search item, SKU or supplier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded text-[13px] focus:outline-none focus:border-[#EC3013]"
                />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                      <th className="py-3 px-4">SKU Code</th>
                      <th className="py-3 px-4">Item Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-right">In Stock</th>
                      <th className="py-3 px-4 text-right">Min Threshold</th>
                      <th className="py-3 px-4 text-right">Unit Price</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Supplier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {filteredItems.map((item) => {
                      const isLow = item.quantity <= item.minStock;
                      return (
                        <tr key={item.sku} className="hover:bg-[#F9FAFB]">
                          <td className="py-3 px-4 font-mono font-bold text-[#111827]">{item.sku}</td>
                          <td className="py-3 px-4 font-semibold text-[#111827]">{item.name}</td>
                          <td className="py-3 px-4 text-gray-600">{item.category}</td>
                          <td className={`py-3 px-4 text-right font-black ${isLow ? "text-red-600" : "text-emerald-700"}`}>
                            {item.quantity} {item.unit}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-500 font-medium">{item.minStock} {item.unit}</td>
                          <td className="py-3 px-4 text-right font-medium">₹{item.unitPrice}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${isLow ? "bg-red-100 text-red-800 border border-red-200" : "bg-emerald-100 text-emerald-800"}`}>
                              {isLow ? "Low Stock" : "In Stock"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{item.supplier || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GRN PURCHASE INWARD HISTORY */}
        {activeTab === "grn" && (
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-[#111827]">Goods Receipt Notes (GRN Purchases)</h3>
                <p className="text-[12px] text-gray-500">Record of vendor bills and stock increases</p>
              </div>
              <button
                onClick={() => setIsGrnModalOpen(true)}
                className="px-3 py-1.5 bg-[#EC3013] text-white text-xs font-bold rounded"
              >
                + New Purchase Inward
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b text-[10px] font-bold text-[#6B7280] uppercase">
                    <th className="py-3 px-4">GRN No.</th>
                    <th className="py-3 px-4">Vendor &amp; GSTIN</th>
                    <th className="py-3 px-4">Invoice No.</th>
                    <th className="py-3 px-4">Department Store</th>
                    <th className="py-3 px-4">Items Received</th>
                    <th className="py-3 px-4 text-right">Invoice Value</th>
                    <th className="py-3 px-4">Received By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {grnList.map((grn) => (
                    <tr key={grn.grnNumber} className="hover:bg-[#F9FAFB]">
                      <td className="py-3 px-4 font-mono font-bold text-[#111827]">{grn.grnNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{grn.vendorName}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{grn.vendorGstin}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">{grn.invoiceNumber}</td>
                      <td className="py-3 px-4 text-gray-700 font-medium">{grn.department}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {grn.items?.map((it: any) => `${it.name} (${it.quantity})`).join(", ")}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700">
                        ₹{Number(grn.totalAmount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{grn.receivedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: STAFF ISSUES HISTORY */}
        {activeTab === "issues" && (
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-[#111827]">Departmental Stock Issues</h3>
                <p className="text-[12px] text-gray-500">Store issues given to Housekeeping, F&amp;B and Maintenance staff</p>
              </div>
              <button
                onClick={() => setIsIssueModalOpen(true)}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded"
              >
                + Issue Stock to Staff
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b text-[10px] font-bold text-[#6B7280] uppercase">
                    <th className="py-3 px-4">Issue No.</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Issued To Staff</th>
                    <th className="py-3 px-4">Purpose</th>
                    <th className="py-3 px-4">Items Issued</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {issuesList.map((iss) => (
                    <tr key={iss.issueNumber} className="hover:bg-[#F9FAFB]">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">{iss.issueNumber}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{iss.department}</td>
                      <td className="py-3 px-4 text-gray-800 font-bold">{iss.issuedToStaff}</td>
                      <td className="py-3 px-4 text-gray-600">{iss.purpose}</td>
                      <td className="py-3 px-4 font-medium text-emerald-700">
                        {iss.items?.map((it: any) => `${it.name} (${it.quantity} ${it.unit || ""})`).join(", ")}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-[12px]">
                        {new Date(iss.date || iss.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL: PURCHASE INWARD (GRN) */}
        {isGrnModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 space-y-4 animate-in fade-in my-8 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="text-[17px] font-bold text-gray-900">Goods Receipt Note (Purchase Inward)</h3>
                    <p className="text-[11px] text-gray-500">Record vendor delivery, increase stock &amp; register new items directly</p>
                  </div>
                </div>
                <button onClick={() => setIsGrnModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitGRN} className="space-y-4 text-[13px] overflow-y-auto pr-1 flex-1">
                {/* Vendor & Invoice Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50/70 p-3.5 rounded-lg border border-gray-200">
                  <div className="sm:col-span-1">
                    <label className="block font-bold text-gray-700 text-xs mb-1">Vendor / Supplier Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amul Dairy / City Grocery"
                      value={grnVendor}
                      onChange={(e) => setGrnVendor(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-[13px] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 text-xs mb-1">Vendor GSTIN (Optional)</label>
                    <input
                      type="text"
                      placeholder="29ABCDE1234F1Z5"
                      value={grnVendorGstin}
                      onChange={(e) => setGrnVendorGstin(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 font-mono text-[12px] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 text-xs mb-1">Vendor Bill / Inv No.</label>
                    <input
                      type="text"
                      required
                      placeholder="INV-9821"
                      value={grnInvoiceNo}
                      onChange={(e) => setGrnInvoiceNo(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 font-mono text-[12px] bg-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-bold text-gray-700 text-xs mb-1">Target Department Store</label>
                    <select
                      value={grnDepartment}
                      onChange={(e) => setGrnDepartment(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white font-semibold text-xs"
                    >
                      <option value="Housekeeping">Housekeeping Store</option>
                      <option value="Kitchen & F&B">Kitchen &amp; Restaurant (F&amp;B Store)</option>
                      <option value="Front Desk & Maintenance">Front Desk &amp; Maintenance</option>
                      <option value="General Store">Central / General Store</option>
                    </select>
                  </div>
                </div>

                {/* Items in Invoice (Multi-Item List) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gray-800 text-xs uppercase tracking-wide">
                        Items Received in Bill ({grnItems.length})
                      </span>
                      <p className="text-[11px] text-gray-500">
                        Choose existing inventory items or click "New Item" to add unlisted goods on the fly
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const randomSku = `SKU-ITEM-${Date.now().toString().slice(-4)}`;
                        setGrnItems((prev) => [
                          ...prev,
                          { sku: items[0]?.sku || randomSku, name: items[0]?.name || "New Item", quantity: 10, unitPrice: 100, unit: items[0]?.unit || "Units", isCustomNew: false },
                        ]);
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 rounded text-xs font-bold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Another Item Row</span>
                    </button>
                  </div>

                  {grnItems.map((itemRow, index) => (
                    <div
                      key={index}
                      className="p-3 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-2.5 hover:border-gray-300 transition-all"
                    >
                      <div className="flex items-center justify-between text-xs pb-1 border-b border-gray-100">
                        <span className="font-bold text-gray-600">Item #{index + 1}</span>

                        <div className="flex items-center gap-3">
                          {/* Toggle between existing and custom */}
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-200">
                            <input
                              type="checkbox"
                              checked={itemRow.isCustomNew || false}
                              onChange={(e) => {
                                const isCustom = e.target.checked;
                                const newSku = isCustom ? `SKU-${Date.now().toString().slice(-5)}` : (items[0]?.sku || "");
                                const newName = isCustom ? "" : (items[0]?.name || "");
                                setGrnItems((prev) =>
                                  prev.map((r, i) =>
                                    i === index
                                      ? { ...r, isCustomNew: isCustom, sku: newSku, name: newName, unit: isCustom ? "kg" : (items[0]?.unit || "Units") }
                                      : r
                                  )
                                );
                              }}
                              className="w-3.5 h-3.5 accent-indigo-600 rounded"
                            />
                            <span>➕ Add as Brand New / Custom Item</span>
                          </label>

                          {grnItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setGrnItems((prev) => prev.filter((_, i) => i !== index))}
                              className="text-rose-600 hover:text-rose-800 p-0.5"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Item Inputs */}
                      {!itemRow.isCustomNew ? (
                        /* Dropdown for existing items */
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                          <div className="sm:col-span-6">
                            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Select Existing Item</label>
                            <select
                              value={itemRow.sku}
                              onChange={(e) => {
                                const selected = items.find((i) => i.sku === e.target.value);
                                setGrnItems((prev) =>
                                  prev.map((r, i) =>
                                    i === index
                                      ? {
                                          ...r,
                                          sku: e.target.value,
                                          name: selected?.name || "Item",
                                          unitPrice: selected?.unitPrice || r.unitPrice,
                                          unit: selected?.unit || "Units",
                                        }
                                      : r
                                  )
                                );
                              }}
                              className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white text-xs font-medium"
                            >
                              {items.map((i) => (
                                <option key={i.sku} value={i.sku}>
                                  {i.name} ({i.sku}) — Curr: {i.quantity} {i.unit}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Qty</label>
                            <input
                              type="number"
                              min="1"
                              value={itemRow.quantity}
                              onChange={(e) =>
                                setGrnItems((prev) =>
                                  prev.map((r, i) => (i === index ? { ...r, quantity: Number(e.target.value) } : r))
                                )
                              }
                              className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs font-bold text-emerald-700 bg-white"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Rate (₹)</label>
                            <input
                              type="number"
                              min="0"
                              value={itemRow.unitPrice}
                              onChange={(e) =>
                                setGrnItems((prev) =>
                                  prev.map((r, i) => (i === index ? { ...r, unitPrice: Number(e.target.value) } : r))
                                )
                              }
                              className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs font-medium bg-white"
                            />
                          </div>

                          <div className="sm:col-span-2 flex flex-col justify-end">
                            <span className="text-[11px] font-semibold text-gray-500">Row Total</span>
                            <span className="text-xs font-bold text-gray-900 py-1.5">
                              ₹{(Number(itemRow.quantity) * Number(itemRow.unitPrice || 0)).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* Input fields for Brand New Custom Item */
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-indigo-50/40 p-2.5 rounded border border-indigo-100">
                          <div className="sm:col-span-4">
                            <label className="block text-[11px] font-bold text-indigo-900 mb-0.5">
                              New Item Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Amul Butter 500g, Fresh Paneer"
                              value={itemRow.name}
                              onChange={(e) =>
                                setGrnItems((prev) =>
                                  prev.map((r, i) => (i === index ? { ...r, name: e.target.value } : r))
                                )
                              }
                              className="w-full border border-indigo-300 rounded px-2 py-1 text-xs bg-white font-semibold"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[11px] font-bold text-indigo-900 mb-0.5">SKU Code</label>
                            <input
                              type="text"
                              required
                              value={itemRow.sku}
                              onChange={(e) =>
                                setGrnItems((prev) =>
                                  prev.map((r, i) => (i === index ? { ...r, sku: e.target.value } : r))
                                )
                              }
                              className="w-full border border-indigo-300 rounded px-2 py-1 text-xs font-mono bg-white"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-indigo-900 mb-0.5">Unit</label>
                            <select
                              value={itemRow.unit || "kg"}
                              onChange={(e) =>
                                setGrnItems((prev) =>
                                  prev.map((r, i) => (i === index ? { ...r, unit: e.target.value } : r))
                                )
                              }
                              className="w-full border border-indigo-300 rounded px-1.5 py-1 text-xs bg-white"
                            >
                              <option value="kg">kg</option>
                              <option value="Liters">Liters</option>
                              <option value="Pieces">Pieces</option>
                              <option value="Packets">Packets</option>
                              <option value="Bottles">Bottles</option>
                              <option value="Units">Units</option>
                              <option value="Boxes">Boxes</option>
                            </select>
                          </div>

                          <div className="sm:col-span-1">
                            <label className="block text-[11px] font-bold text-indigo-900 mb-0.5">Qty</label>
                            <input
                              type="number"
                              min="1"
                              value={itemRow.quantity}
                              onChange={(e) =>
                                setGrnItems((prev) =>
                                  prev.map((r, i) => (i === index ? { ...r, quantity: Number(e.target.value) } : r))
                                )
                              }
                              className="w-full border border-indigo-300 rounded px-1.5 py-1 text-xs font-bold text-emerald-700 bg-white"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-indigo-900 mb-0.5">Rate (₹)</label>
                            <input
                              type="number"
                              min="0"
                              value={itemRow.unitPrice}
                              onChange={(e) =>
                                setGrnItems((prev) =>
                                  prev.map((r, i) => (i === index ? { ...r, unitPrice: Number(e.target.value) } : r))
                                )
                              }
                              className="w-full border border-indigo-300 rounded px-1.5 py-1 text-xs bg-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Total Summary */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-emerald-900">Items Total: </span>
                    <span className="text-emerald-700 font-semibold">
                      ₹{grnItems.reduce((s, itm) => s + (Number(itm.quantity || 0) * Number(itm.unitPrice || 0)), 0).toLocaleString("en-IN")}
                    </span>
                    <span className="text-gray-500 ml-2">(+18% GST Est.)</span>
                  </div>

                  <div className="text-right">
                    <span className="text-gray-600 font-medium">Grand Total: </span>
                    <span className="text-sm font-black text-emerald-800">
                      ₹{(grnItems.reduce((s, itm) => s + (Number(itm.quantity || 0) * Number(itm.unitPrice || 0)), 0) * 1.18).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsGrnModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Generate GRN &amp; Increase Stock</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ISSUE STOCK TO DEPARTMENT */}
        {isIssueModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-[17px] font-bold text-gray-900">Issue Store Stock to Staff</h3>
                </div>
                <button onClick={() => setIsIssueModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitIssue} className="space-y-3 text-[13px]">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Department</label>
                  <select
                    value={issueDept}
                    onChange={(e) => setIssueDept(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-white font-semibold"
                  >
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Kitchen & F&B">Kitchen &amp; Restaurant F&amp;B</option>
                    <option value="Front Desk & Maintenance">Front Desk &amp; Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Issued to Staff Name</label>
                  <input
                    type="text"
                    required
                    value={issueStaff}
                    onChange={(e) => setIssueStaff(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-[13px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Select Item to Issue</label>
                  <select
                    value={issueSelectedSku}
                    onChange={(e) => setIssueSelectedSku(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-[13px]"
                  >
                    {items.map((i) => (
                      <option key={i.sku} value={i.sku}>
                        {i.name} (Current Stock: {i.quantity} {i.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Quantity to Issue</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={issueQuantity}
                    onChange={(e) => setIssueQuantity(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-[14px] font-black text-indigo-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Purpose / Notes</label>
                  <input
                    type="text"
                    value={issuePurpose}
                    onChange={(e) => setIssuePurpose(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-[13px]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setIsIssueModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded font-semibold text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold shadow-xs"
                  >
                    Confirm Issue &amp; Deduct Stock
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD NEW SKU */}
        {isAddItemModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-[17px] font-bold text-gray-900">Add New Inventory Item</h3>
                <button onClick={() => setIsAddItemModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-3 text-[13px]">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SKU-LIN-105"
                    value={newItem.sku}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Item Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dental Kit Luxury"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Category</label>
                    <select
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value as any })}
                      className="w-full border border-gray-300 rounded px-2.5 py-2 bg-white text-xs"
                    >
                      <option value="Guest Amenities">Guest Amenities</option>
                      <option value="Linen & Bedding">Linen &amp; Bedding</option>
                      <option value="Cleaning Supplies">Cleaning Supplies</option>
                      <option value="Food & Beverage">Food &amp; Beverage</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Initial Qty</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded px-3 py-2 font-bold"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setIsAddItemModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded font-semibold text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white rounded font-bold"
                  >
                    Create SKU
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
