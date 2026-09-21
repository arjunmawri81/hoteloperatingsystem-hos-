"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { posApi, reservationsApi } from "@/lib/api";
import { RestaurantOrder, MenuItem, RestaurantTable, Reservation } from "@/types";
import {
  Utensils,
  Plus,
  CheckCircle2,
  X,
  RefreshCw,
  Clock,
  DollarSign,
  Printer,
  Receipt,
  ChefHat,
  QrCode,
  Search,
  BookOpen,
  CreditCard,
  Building,
  ArrowRightLeft,
  AlertCircle,
  Check,
  Ban,
} from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";

export default function RestaurantPOSPage() {
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [checkedInReservations, setCheckedInReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [printKotOrder, setPrintKotOrder] = useState<RestaurantOrder | null>(null);
  const [activeTab, setActiveTab] = useState<"floor" | "menu">("floor");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Table Transfer Modal State
  const [transferModal, setTransferModal] = useState<{
    isOpen: boolean;
    sourceTable: string;
    targetTable: string;
  }>({
    isOpen: false,
    sourceTable: "",
    targetTable: "",
  });
  const [isTransferring, setIsTransferring] = useState(false);
  const [isUpdatingDish, setIsUpdatingDish] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{ [name: string]: { qty: number; price: number } }>({});
  const [newOrder, setNewOrder] = useState<{
    tableNumber: string;
    roomNumber: string;
    guestName: string;
    notes: string;
  }>({
    tableNumber: "T-01",
    roomNumber: "",
    guestName: "",
    notes: "",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ordersData, tablesData, menuData, resData] = await Promise.all([
        posApi.getOrders(),
        posApi.getTables(),
        posApi.getMenu(),
        reservationsApi.getAll({ status: "checked_in" }),
      ]);
      setOrders(ordersData);
      setTables(tablesData);
      setMenuItems(menuData);
      setCheckedInReservations(resData || []);
    } catch (e) {
      console.error("Failed to load restaurant POS data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleDish = (dish: MenuItem) => {
    if (dish.isAvailable === false) {
      setToastMsg(`⚠️ "${dish.name}" is 86 (Out of Stock). Cannot add to order.`);
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }
    setSelectedItems((prev) => {
      const cur = prev[dish.name]?.qty || 0;
      return {
        ...prev,
        [dish.name]: { qty: cur + 1, price: dish.price },
      };
    });
  };

  const handleRemoveDish = (name: string) => {
    setSelectedItems((prev) => {
      const cur = prev[name]?.qty || 0;
      if (cur <= 1) {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      }
      return { ...prev, [name]: { ...prev[name], qty: cur - 1 } };
    });
  };

  // 1-Click 86 / Out-of-Stock Toggle (Video 5)
  const handleToggleItemAvailability = async (dish: MenuItem) => {
    const dishId = dish._id || dish.id;
    if (!dishId) return;

    const newStatus = dish.isAvailable === false ? true : false;
    setIsUpdatingDish(dishId);

    try {
      await posApi.updateMenuItem(dishId, { isAvailable: newStatus });
      setMenuItems((prev) =>
        prev.map((item) =>
          (item._id || item.id) === dishId ? { ...item, isAvailable: newStatus } : item
        )
      );
      setToastMsg(
        newStatus
          ? `✅ "${dish.name}" marked as AVAILABLE`
          : `⚠️ "${dish.name}" marked as 86 (OUT OF STOCK)`
      );
      setTimeout(() => setToastMsg(null), 3500);
    } catch (err: any) {
      alert(err?.message || "Failed to update item availability");
    } finally {
      setIsUpdatingDish(null);
    }
  };

  // Table Transfer Handler (Video 5)
  const handleTransferTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferModal.sourceTable || !transferModal.targetTable) {
      alert("Please select both source and destination tables.");
      return;
    }
    if (transferModal.sourceTable === transferModal.targetTable) {
      alert("Source and destination tables must be different.");
      return;
    }

    setIsTransferring(true);
    try {
      await posApi.transferTable({
        sourceTableNumber: transferModal.sourceTable,
        targetTableNumber: transferModal.targetTable,
      });
      setToastMsg(`✅ Table transferred: ${transferModal.sourceTable} ➔ ${transferModal.targetTable}`);
      setTimeout(() => setToastMsg(null), 4000);
      setTransferModal({ isOpen: false, sourceTable: "", targetTable: "" });
      loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to transfer table");
    } finally {
      setIsTransferring(false);
    }
  };

  const orderCalculatedTotal = Object.values(selectedItems).reduce(
    (sum, item) => sum + item.qty * item.price,
    0
  );

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemNames = Object.entries(selectedItems).map(
      ([name, details]) => `${details.qty}x ${name}`
    );

    if (itemNames.length === 0 || isSubmitting) {
      alert("Please add at least one item to the order.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await posApi.createOrder({
        tableNumber: newOrder.tableNumber,
        roomNumber: newOrder.roomNumber || undefined,
        guestName: newOrder.guestName || "Dine-in Guest",
        items: itemNames,
        total: orderCalculatedTotal,
        status: "cooking",
      });

      if (newOrder.roomNumber && newOrder.roomNumber.trim()) {
        try {
          await posApi.chargeToRoom({
            roomNumber: newOrder.roomNumber.trim(),
            amount: orderCalculatedTotal,
            description: `Restaurant Bill: ${itemNames.join(", ")}`,
          });
        } catch (folioErr) {
          console.warn("Could not post to room folio:", folioErr);
        }
      }

      setIsModalOpen(false);
      setToastMsg(`✅ Order ${created.id || "created"} dispatched to kitchen!`);
      setTimeout(() => setToastMsg(null), 4000);

      setSelectedItems({});
      setNewOrder({
        tableNumber: tables[0]?.tableNumber || "T-01",
        roomNumber: "",
        guestName: "",
        notes: "",
      });
      loadData();
    } catch (e: any) {
      alert(e.message || "Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const advanceOrderStatus = async (orderId: string) => {
    const currentOrder = orders.find((o) => o.id === orderId);
    if (!currentOrder) return;

    let nextStatus = "ready";
    if (currentOrder.status === "cooking" || currentOrder.status === "preparing") nextStatus = "ready";
    else if (currentOrder.status === "ready") nextStatus = "served";
    else if (currentOrder.status === "served") nextStatus = "paid";

    try {
      await posApi.updateStatus(orderId, nextStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus as any } : o))
      );

      if (nextStatus === "paid") {
        const tbl = tables.find((t) => t.tableNumber === currentOrder.tableNumber);
        if (tbl) {
          await posApi.updateTableStatus(tbl._id || tbl.id || "", { status: "available" });
        }
      }

      setToastMsg(`✅ Order ${orderId} marked as ${nextStatus.toUpperCase()}`);
      setTimeout(() => setToastMsg(null), 3000);
      loadData();
    } catch (err: any) {
      setToastMsg(`❌ Error updating status: ${err?.message || "Server error"}`);
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "cooking":
      case "preparing":
        return <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Preparing</span>;
      case "ready":
        return <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Ready for Pickup</span>;
      case "served":
        return <span className="text-[11px] font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">Served</span>;
      case "paid":
        return <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Paid</span>;
      default:
        return <span className="text-[11px] font-semibold text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">{status}</span>;
    }
  };

  // Filtered menu dishes
  const filteredMenuItems = menuItems.filter((dish) => {
    const matchesSearch =
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === "all" || dish.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCat;
  });

  const categories = ["all", ...Array.from(new Set(menuItems.map((m) => m.category)))];

  return (
    <RoleGuard
      allowedRoles={["super_admin", "hotel_admin", "hotel_manager", "restaurant_staff", "kitchen_staff"]}
      moduleName="Restaurant POS & Kitchen"
    >
      <div className="space-y-6">
        {/* Standard LuckNexa Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
              Restaurant POS &amp; Dining
            </h1>
            <p className="text-[13px] text-[#6B7280] mt-0.5">
              Live floor tables, 86 dish management, table transfer, and room folio charges
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/operations/kitchen-kds"
              className="px-3.5 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] text-[13px] font-semibold rounded shadow-xs transition-colors flex items-center gap-1.5"
            >
              <ChefHat className="w-4 h-4 text-[#4B5563]" />
              <span>Kitchen KDS</span>
            </Link>

            <Link
              href="/operations/restaurant-pos/qr-studio"
              className="px-3.5 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] text-[13px] font-semibold rounded shadow-xs transition-colors flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4 text-[#4B5563]" />
              <span>Table QR Codes</span>
            </Link>

            <button
              onClick={loadData}
              title="Refresh"
              className="p-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] rounded text-[#4B5563] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Dining Order</span>
            </button>
          </div>
        </div>

        {/* Action Toast Notice */}
        {toastMsg && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[13px] px-4 py-2.5 rounded-lg flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Clean LuckNexa Segmented Navigation */}
        <div className="flex items-center gap-2 border-b border-[#E5E7EB]">
          <button
            onClick={() => setActiveTab("floor")}
            className={`pb-2.5 px-3 text-[13px] font-bold border-b-2 transition-colors ${
              activeTab === "floor"
                ? "border-[#EC3013] text-[#EC3013]"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            Dining Floor &amp; Live Orders
          </button>
          <button
            onClick={() => setActiveTab("menu")}
            className={`pb-2.5 px-3 text-[13px] font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "menu"
                ? "border-[#EC3013] text-[#EC3013]"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            <span>Menu Catalog &amp; 86 Out-of-Stock</span>
            <span className="text-[11px] px-1.5 py-0.2 bg-gray-100 rounded text-gray-700 font-normal">
              {menuItems.length}
            </span>
          </button>
        </div>

        {activeTab === "floor" ? (
          /* Main Two Column Grid: Floor Tables & Active Orders */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Floor Tables (5 cols) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-bold text-[#111827]">
                    Restaurant Floor Layout ({tables.length} Tables)
                  </h2>
                  <p className="text-[11px] text-[#6B7280]">Click table to take order or transfer</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#6B7280]">
                    {tables.filter((t) => t.status === "occupied").length} / {tables.length} Occupied
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {tables.map((tb) => {
                  const isOccupied = tb.status === "occupied";
                  const isReserved = tb.status === "reserved";
                  const isCleaning = tb.status === "cleaning";

                  return (
                    <div
                      key={tb._id || tb.id || tb.tableNumber}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isOccupied
                          ? "border-blue-400 bg-blue-50/70"
                          : isReserved
                          ? "border-amber-400 bg-amber-50/70"
                          : isCleaning
                          ? "border-purple-300 bg-purple-50/60"
                          : "border-[#E5E7EB] bg-white hover:border-[#9CA3AF]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] font-bold text-[#111827]">{tb.tableNumber}</span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            isOccupied
                              ? "bg-blue-100 text-blue-800"
                              : isReserved
                              ? "bg-amber-100 text-amber-800"
                              : isCleaning
                              ? "bg-purple-100 text-purple-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {tb.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#6B7280] truncate mt-1">
                        {tb.section} • {tb.capacity} seats
                      </div>

                      {/* Action buttons inside table card */}
                      <div className="mt-2 pt-2 border-t border-gray-200/60 flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setNewOrder((prev) => ({ ...prev, tableNumber: tb.tableNumber }));
                            setIsModalOpen(true);
                          }}
                          className="text-[11px] font-semibold text-[#EC3013] hover:underline"
                        >
                          + Order
                        </button>

                        {isOccupied && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const firstAvailable = tables.find(
                                (t) => t.status === "available" && t.tableNumber !== tb.tableNumber
                              )?.tableNumber || "";
                              setTransferModal({
                                isOpen: true,
                                sourceTable: tb.tableNumber,
                                targetTable: firstAvailable,
                              });
                            }}
                            title="Transfer / Move Table"
                            className="p-1 text-gray-600 hover:text-blue-600 hover:bg-white rounded transition flex items-center gap-1 text-[10px] font-medium"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>Move</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-[#F3F4F6] flex items-center justify-between text-[11px] text-[#6B7280]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Occupied
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" /> Cleaning
                </span>
              </div>
            </div>

            {/* Right: Active Kitchen & Dining Orders (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-lg border border-[#E5E7EB] shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-bold text-[#111827]">
                    Active Kitchen &amp; Dining Orders ({orders.length})
                  </h2>
                  <span className="text-[11px] text-[#6B7280]">Live kitchen status &amp; billing</span>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-2.5 py-1 bg-[#EC3013] text-white text-[11px] font-bold rounded shadow-xs hover:bg-[#D62839]"
                >
                  + New Order
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-white">
                      <th className="py-2.5 px-4 font-bold">ORDER</th>
                      <th className="py-2.5 px-4 font-bold">TABLE / ROOM</th>
                      <th className="py-2.5 px-4 font-bold">ITEMS</th>
                      <th className="py-2.5 px-4 font-bold">STATUS</th>
                      <th className="py-2.5 px-4 text-right font-bold">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-[#9CA3AF]">
                          No active restaurant orders
                        </td>
                      </tr>
                    ) : (
                      orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-[#F9FAFB] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#111827]">
                            {ord.id}
                          </td>
                          <td className="py-3 px-4 text-[#374151] font-semibold">
                            <div className="flex items-center gap-1.5">
                              <span>{ord.tableNumber}</span>
                              {ord.status !== "paid" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const firstAvailable = tables.find(
                                      (t) => t.status === "available" && t.tableNumber !== ord.tableNumber
                                    )?.tableNumber || "";
                                    setTransferModal({
                                      isOpen: true,
                                      sourceTable: ord.tableNumber,
                                      targetTable: firstAvailable,
                                    });
                                  }}
                                  title="Transfer order to another table"
                                  className="text-gray-400 hover:text-blue-600 p-0.5"
                                >
                                  <ArrowRightLeft className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            {ord.roomNumber && (
                              <div className="text-[11px] text-[#EC3013] font-medium flex items-center gap-1 mt-0.5">
                                <Building className="w-3 h-3" /> Room {ord.roomNumber}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[#4B5563]">
                            <div className="truncate max-w-[200px]">
                              {Array.isArray(ord.items) ? ord.items.join(", ") : ord.items}
                            </div>
                            <div className="text-[11px] font-bold text-[#111827] mt-0.5">
                              ₹{ord.total}
                            </div>
                          </td>
                          <td className="py-3 px-4">{getOrderStatusBadge(ord.status)}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPrintKotOrder(ord)}
                                title="Print Kitchen Order Ticket (KOT)"
                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded border border-gray-200 transition-colors cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {ord.status !== "paid" ? (
                                <button
                                  type="button"
                                  onClick={() => advanceOrderStatus(ord.id)}
                                  className="px-3 py-1 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#111827] text-[11px] font-bold rounded shadow-xs cursor-pointer transition-colors"
                                >
                                  {ord.status === "cooking" || ord.status === "preparing"
                                    ? "Mark Ready"
                                    : ord.status === "ready"
                                    ? "Mark Served"
                                    : "Close Bill"}
                                </button>
                              ) : (
                                <span className="text-[11px] font-semibold text-emerald-700">Settled</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Menu Catalog Tab with 86 Out-of-Stock Toggle (Video 5) */
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-[15px] font-bold text-[#111827]">
                  Menu Catalog &amp; 86 Out-of-Stock Management
                </h3>
                <p className="text-[12px] text-[#6B7280]">
                  Instantly toggle 86 (Out of Stock) to block servers and contactless QR ordering when ingredients run out
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="text"
                    placeholder="Search dishes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-[12px] border border-[#D1D5DB] rounded bg-white w-44"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 text-[12px] border border-[#D1D5DB] rounded bg-white font-medium text-[#374151] capitalize"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {filteredMenuItems.map((dish) => {
                const dishId = dish._id || dish.id || dish.name;
                const isOut = dish.isAvailable === false;
                const isBusy = isUpdatingDish === dishId;

                return (
                  <div
                    key={dishId}
                    className={`p-3.5 rounded-lg border transition-all flex flex-col justify-between ${
                      isOut
                        ? "border-red-200 bg-red-50/40 opacity-75"
                        : "border-[#E5E7EB] bg-white hover:border-[#D1D5DB]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase text-[#6B7280]">
                          {dish.category}
                        </span>
                        <div className="flex items-center gap-2">
                          {isOut && (
                            <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200">
                              86 / Sold Out
                            </span>
                          )}
                          <span className="text-[13px] font-bold text-[#111827] font-mono">
                            ₹{dish.price}
                          </span>
                        </div>
                      </div>
                      <h4 className={`text-[13px] font-bold ${isOut ? "text-gray-500 line-through" : "text-[#111827]"}`}>
                        {dish.name}
                      </h4>
                      <p className="text-[12px] text-[#6B7280] mt-0.5 line-clamp-2">{dish.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#F3F4F6] flex items-center justify-between text-[11px]">
                      <span className="text-[#6B7280]">
                        {dish.isVeg ? "🟢 Pure Veg" : "🔴 Non-Veg"} • {dish.prepTimeMinutes || 15}m prep
                      </span>

                      {/* 1-Click 86 Toggle Button */}
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleToggleItemAvailability(dish)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded border transition-colors flex items-center gap-1 ${
                          isOut
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                            : "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                        }`}
                      >
                        {isBusy ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : isOut ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Mark In-Stock</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3 h-3 text-red-600" />
                            <span>Mark 86 (Out)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------- TABLE TRANSFER MODAL (Video 5) ----------------- */}
        {transferModal.isOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-2xl max-w-sm w-full p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                  <h3 className="text-[15px] font-bold text-[#111827]">Transfer Table</h3>
                </div>
                <button
                  onClick={() => setTransferModal({ isOpen: false, sourceTable: "", targetTable: "" })}
                  className="text-[#9CA3AF] hover:text-[#111827]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleTransferTable} className="space-y-3.5 text-[13px]">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    From Table (Source)
                  </label>
                  <select
                    value={transferModal.sourceTable}
                    onChange={(e) =>
                      setTransferModal({ ...transferModal, sourceTable: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white font-semibold text-[#111827]"
                  >
                    {tables.map((t) => (
                      <option key={t.tableNumber} value={t.tableNumber}>
                        {t.tableNumber} ({t.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    To Table (Destination)
                  </label>
                  <select
                    value={transferModal.targetTable}
                    onChange={(e) =>
                      setTransferModal({ ...transferModal, targetTable: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white font-semibold text-[#111827]"
                  >
                    <option value="">Select Destination Table</option>
                    {tables
                      .filter((t) => t.tableNumber !== transferModal.sourceTable)
                      .map((t) => (
                        <option key={t.tableNumber} value={t.tableNumber}>
                          {t.tableNumber} ({t.section} • {t.status})
                        </option>
                      ))}
                  </select>
                </div>

                <p className="text-[11px] text-[#6B7280] bg-blue-50 p-2 rounded border border-blue-200">
                  Moving table will transfer all active orders and KOTs to the destination table, and mark the source table for cleaning.
                </p>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => setTransferModal({ isOpen: false, sourceTable: "", targetTable: "" })}
                    className="px-3 py-1.5 border border-[#D1D5DB] rounded text-[#374151] font-semibold hover:bg-[#F3F4F6]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isTransferring}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isTransferring ? "Moving..." : "Confirm Transfer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ----------------- THERMAL KOT SLIP MODAL (PDF Sec 17.5) ----------------- */}
        {printKotOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-xs w-full p-6 shadow-2xl relative font-mono text-gray-900 border border-gray-300">
              <button
                onClick={() => setPrintKotOrder(null)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 print:hidden"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center border-b pb-2 mb-3">
                <h4 className="font-bold text-sm uppercase tracking-wider">KITCHEN ORDER TICKET</h4>
                <p className="text-[11px] text-gray-500">HOTEL RESTAURANT &amp; KITCHEN</p>
              </div>

              <div className="text-xs space-y-1 border-b pb-2 mb-3">
                <div className="flex justify-between font-bold text-sm">
                  <span>TABLE: {printKotOrder.tableNumber}</span>
                  {printKotOrder.roomNumber && <span className="text-[#EC3013]">ROOM: {printKotOrder.roomNumber}</span>}
                </div>
                <div className="flex justify-between text-gray-600 text-[10px]">
                  <span>Order: #{printKotOrder.id}</span>
                  <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>

              <div className="space-y-1.5 border-b pb-3 mb-3 text-xs">
                <div className="font-bold text-gray-700 border-b border-dashed pb-1 flex justify-between text-[11px]">
                  <span>ITEM</span>
                  <span>QTY</span>
                </div>
                {(Array.isArray(printKotOrder.items) ? printKotOrder.items : [printKotOrder.items]).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between font-semibold">
                    <span>{typeof item === "string" ? item : item.name || "Item"}</span>
                    <span>x1</span>
                  </div>
                ))}
              </div>

              <div className="text-center pt-1 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="w-full py-2 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Thermal KOT
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- NEW ORDER MODAL WITH ROOM SELECTOR ----------------- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-[#EC3013]" />
                  <h3 className="text-[16px] font-bold text-[#111827]">New Restaurant Order</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#9CA3AF] hover:text-[#111827] p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOrder} className="space-y-4 text-[13px] flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                      Table Number
                    </label>
                    <select
                      value={newOrder.tableNumber}
                      onChange={(e) => setNewOrder({ ...newOrder, tableNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white font-semibold text-[#111827]"
                    >
                      {tables.map((t) => (
                        <option key={t.tableNumber} value={t.tableNumber}>
                          {t.tableNumber} ({t.section})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                      Charge to Room (Folio)
                    </label>
                    {checkedInReservations.length > 0 ? (
                      <select
                        value={newOrder.roomNumber}
                        onChange={(e) => {
                          const val = e.target.value;
                          const res = checkedInReservations.find((r) => r.roomNumber === val);
                          setNewOrder({
                            ...newOrder,
                            roomNumber: val,
                            guestName: res?.guestName || newOrder.guestName,
                          });
                        }}
                        className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white text-[#111827] font-medium"
                      >
                        <option value="">No Room (Direct Pay)</option>
                        {checkedInReservations.map((r) => (
                          <option key={r.id || r.roomNumber} value={r.roomNumber}>
                            Room {r.roomNumber} ({r.guestName})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. 204"
                        value={newOrder.roomNumber}
                        onChange={(e) => setNewOrder({ ...newOrder, roomNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-[#111827]"
                      />
                    )}
                  </div>
                </div>

                {/* Dish Selector Grid with 86 Protection */}
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1.5">
                    Click Dishes to Add (86 dishes disabled):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-[#F9FAFB] rounded border border-[#E5E7EB]">
                    {menuItems.map((dish) => {
                      const isOut = dish.isAvailable === false;
                      return (
                        <button
                          type="button"
                          key={dish.name}
                          disabled={isOut}
                          onClick={() => handleToggleDish(dish)}
                          className={`p-2 rounded border text-left transition ${
                            isOut
                              ? "border-red-200 bg-red-50/50 opacity-60 cursor-not-allowed"
                              : "border-[#E5E7EB] bg-white hover:border-[#D1D5DB]"
                          }`}
                        >
                          <div className={`font-semibold text-[12px] truncate ${isOut ? "text-red-700" : "text-[#111827]"}`}>
                            {dish.name}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-[#6B7280] mt-0.5">
                            <span>₹{dish.price}</span>
                            {isOut ? (
                              <span className="text-red-600 font-bold">86 (Out)</span>
                            ) : (
                              <span>{dish.category}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Items Summary */}
                <div className="p-3 bg-[#F9FAFB] rounded border border-[#E5E7EB]">
                  <div className="font-bold text-[11px] text-[#374151] uppercase mb-1">
                    Order Summary ({Object.keys(selectedItems).length} items):
                  </div>
                  {Object.keys(selectedItems).length === 0 ? (
                    <p className="text-[12px] text-[#9CA3AF] italic">Select dishes above to add to this order</p>
                  ) : (
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {Object.entries(selectedItems).map(([name, details]) => (
                        <div key={name} className="flex justify-between items-center text-[12px]">
                          <span className="font-semibold text-[#111827]">{details.qty}x {name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[#4B5563]">₹{details.qty * details.price}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDish(name)}
                              className="w-5 h-5 rounded bg-white border border-[#D1D5DB] text-[#374151] flex items-center justify-center font-bold text-xs"
                            >
                              -
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t border-[#E5E7EB] flex justify-between font-bold text-[14px] text-[#111827]">
                    <span>Total:</span>
                    <span className="font-mono text-[#EC3013]">₹{orderCalculatedTotal}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-[#D1D5DB] rounded text-[#374151] font-semibold hover:bg-[#F3F4F6] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || orderCalculatedTotal === 0}
                    className="px-5 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded shadow-xs disabled:opacity-50"
                  >
                    {isSubmitting ? "Sending..." : "Send to Kitchen"}
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
