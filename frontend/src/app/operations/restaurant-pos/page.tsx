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
  Pencil,
  Trash2,
  PlusCircle,
  Sparkles,
  ImageIcon,
  Upload,
} from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";

const FOOD_PRESET_IMAGES = [
  { label: "Paneer / Curry", url: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80" },
  { label: "Juice / Mojito", url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80" },
  { label: "Biryani / Rice", url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80" },
  { label: "Butter Chicken", url: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80" },
  { label: "Naan & Breads", url: "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80" },
  { label: "Dessert / Sweet", url: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80" },
  { label: "Tea / Chai / Coffee", url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80" },
  { label: "Crispy Starter", url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80" },
];

function formatOrderItemsSummary(items: any): string {
  if (!items) return "No items";
  if (typeof items === "string") return items;
  if (Array.isArray(items)) {
    return items
      .map((it: any) => {
        if (!it) return "";
        if (typeof it === "string") return it;
        if (typeof it === "object") {
          const qty = it.quantity || it.qty || 1;
          const name =
            it.name ||
            it.title ||
            it.itemName ||
            (typeof it.item === "object" ? it.item?.name : it.item) ||
            "Dish";
          return `${qty > 1 ? `${qty}x ` : ""}${name}`;
        }
        return String(it);
      })
      .filter(Boolean)
      .join(", ");
  }
  if (typeof items === "object") {
    return items.name || items.title || "Dish";
  }
  return String(items);
}

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

  // Menu Item Modal State (Add & Edit)
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);
  const [isSavingDish, setIsSavingDish] = useState(false);
  const [isDeletingDish, setIsDeletingDish] = useState<string | null>(null);
  const [menuFormData, setMenuFormData] = useState<{
    name: string;
    category: string;
    customCategory: string;
    price: number | string;
    image: string;
    description: string;
    isVeg: boolean;
    prepTimeMinutes: number | string;
    isAvailable: boolean;
  }>({
    name: "",
    category: "Main Course",
    customCategory: "",
    price: "",
    image: "",
    description: "",
    isVeg: true,
    prepTimeMinutes: 15,
    isAvailable: true,
  });

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

  // Smart image file upload handler with auto-compression & resize
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
          setMenuFormData((prev) => ({ ...prev, image: compressedDataUrl }));
        }
      };
      if (typeof event.target?.result === "string") {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  // Open Add Dish Modal
  const handleOpenAddDish = () => {
    setEditingDish(null);
    setMenuFormData({
      name: "",
      category: "Main Course",
      customCategory: "",
      price: "",
      image: "",
      description: "",
      isVeg: true,
      prepTimeMinutes: 15,
      isAvailable: true,
    });
    setIsMenuModalOpen(true);
  };

  // Open Edit Dish Modal
  const handleOpenEditDish = (dish: MenuItem) => {
    setEditingDish(dish);
    const standardCategories = ["Starters", "Main Course", "Breads & Rice", "Desserts", "Beverages"];
    const isCustom = !standardCategories.includes(dish.category);
    setMenuFormData({
      name: dish.name || "",
      category: isCustom ? "custom" : dish.category,
      customCategory: isCustom ? dish.category : "",
      price: dish.price,
      image: dish.image || "",
      description: dish.description || "",
      isVeg: dish.isVeg !== false,
      prepTimeMinutes: dish.prepTimeMinutes || 15,
      isAvailable: dish.isAvailable !== false,
    });
    setIsMenuModalOpen(true);
  };

  // Save Menu Item (Create / Update)
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuFormData.name.trim()) {
      alert("Please enter a dish name");
      return;
    }
    const parsedPrice = Number(menuFormData.price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert("Please enter a valid price greater than 0");
      return;
    }

    const category =
      menuFormData.category === "custom"
        ? (menuFormData.customCategory.trim() || "Main Course")
        : menuFormData.category;

    const payload = {
      name: menuFormData.name.trim(),
      category,
      price: parsedPrice,
      image: menuFormData.image.trim(),
      description: menuFormData.description.trim(),
      isVeg: Boolean(menuFormData.isVeg),
      prepTimeMinutes: Number(menuFormData.prepTimeMinutes) || 15,
      isAvailable: Boolean(menuFormData.isAvailable),
    };

    setIsSavingDish(true);
    try {
      if (editingDish) {
        const dishId = editingDish._id || editingDish.id || editingDish.name;
        const res = await posApi.updateMenuItem(dishId, payload);
        const updated = (res as any)?.data || res;
        setMenuItems((prev) =>
          prev.map((item) =>
            (item._id || item.id) === dishId ? { ...item, ...payload, ...updated } : item
          )
        );
        setToastMsg(`✅ Dish "${payload.name}" updated successfully!`);
      } else {
        const res = await posApi.createMenuItem(payload);
        const created = (res as any)?.data || res || payload;
        setMenuItems((prev) => [created, ...prev.filter((i) => (i._id || i.id) !== (created._id || created.id))]);
        setToastMsg(`✅ New dish "${payload.name}" added to menu!`);
        setActiveTab("menu");
        setCategoryFilter("all");
        setSearchQuery("");
      }
      setTimeout(() => setToastMsg(null), 3500);
      setIsMenuModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to save menu item");
    } finally {
      setIsSavingDish(false);
    }
  };

  // Delete Menu Item
  const handleDeleteMenuItem = async (dish: MenuItem) => {
    const dishId = dish._id || dish.id || dish.name;
    if (!window.confirm(`Are you sure you want to delete "${dish.name}" from the menu?`)) {
      return;
    }

    setIsDeletingDish(dishId);
    try {
      await posApi.deleteMenuItem(dishId);
      setMenuItems((prev) => prev.filter((item) => (item._id || item.id || item.name) !== dishId));
      setToastMsg(`🗑️ Dish "${dish.name}" deleted from menu.`);
      setTimeout(() => setToastMsg(null), 3500);
      loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to delete menu item");
    } finally {
      setIsDeletingDish(null);
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
    const itemsPayload = Object.entries(selectedItems).map(
      ([name, details]) => ({
        name,
        quantity: details.qty,
        price: details.price,
        instructions: "",
      })
    );

    if (itemsPayload.length === 0 || isSubmitting) {
      alert("Please add at least one item to the order.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await posApi.createOrder({
        tableNumber: newOrder.tableNumber,
        roomNumber: newOrder.roomNumber || undefined,
        guestName: newOrder.guestName || "Dine-in Guest",
        items: itemsPayload,
        total: orderCalculatedTotal,
        status: "cooking",
      });

      if (newOrder.roomNumber && newOrder.roomNumber.trim()) {
        try {
          await posApi.chargeToRoom({
            roomNumber: newOrder.roomNumber.trim(),
            amount: orderCalculatedTotal,
            description: `Restaurant Bill: ${itemsPayload.map((i) => `${i.quantity}x ${i.name}`).join(", ")}`,
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
    if (!dish) return false;
    const name = String(dish.name || "").toLowerCase();
    const cat = String(dish.category || "").toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || name.includes(query) || cat.includes(query);
    const matchesCat = categoryFilter === "all" || cat === categoryFilter.toLowerCase();
    return matchesSearch && matchesCat;
  });

  const categories = ["all", ...Array.from(new Set(menuItems.map((m) => m.category).filter(Boolean)))];

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
              onClick={handleOpenAddDish}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] text-[13px] font-semibold rounded shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#EC3013]" />
              <span>Add Dish</span>
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
                            <div className="truncate max-w-[240px]" title={formatOrderItemsSummary(ord.items)}>
                              {formatOrderItemsSummary(ord.items)}
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
          /* Menu Catalog Tab with 86 Out-of-Stock Toggle & Add/Edit Menu (Video 5) */
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-[15px] font-bold text-[#111827]">
                  Menu Catalog &amp; Dish Management
                </h3>
                <p className="text-[12px] text-[#6B7280]">
                  Add new dishes, edit pricing, and instantly toggle 86 (Out of Stock) for live floor &amp; QR orders
                </p>
              </div>

              {/* Actions & Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="text"
                    placeholder="Search dishes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-[12px] border border-[#D1D5DB] rounded bg-white w-40"
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

                <button
                  type="button"
                  onClick={handleOpenAddDish}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EC3013] hover:bg-[#D62839] text-white text-[12px] font-bold rounded shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add New Dish</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {filteredMenuItems.map((dish) => {
                const dishId = dish._id || dish.id || dish.name;
                const isOut = dish.isAvailable === false;
                const isBusy = isUpdatingDish === dishId;
                const isDeleting = isDeletingDish === dishId;

                return (
                  <div
                    key={dishId}
                    className={`rounded-xl border transition-all flex flex-col justify-between overflow-hidden relative group bg-white ${
                      isOut
                        ? "border-red-200 bg-red-50/30 opacity-85"
                        : "border-[#E5E7EB] hover:border-[#CBD5E1] hover:shadow-md"
                    }`}
                  >
                    {/* Dish Photo Banner */}
                    <div className="relative h-36 w-full bg-slate-100 overflow-hidden">
                      {dish.image ? (
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                            isOut ? "grayscale" : ""
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400">
                          <Utensils className="w-8 h-8 stroke-[1.5] text-slate-300 mb-1" />
                          <span className="text-[11px] font-medium text-slate-400">LuckNexa Dining</span>
                        </div>
                      )}

                      {/* Top Overlay Badges */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-xs text-white px-2 py-0.5 rounded shadow-xs">
                            {dish.category}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1 backdrop-blur-xs ${
                              dish.isVeg
                                ? "bg-emerald-900/80 text-emerald-200 border border-emerald-500/40"
                                : "bg-red-900/80 text-red-200 border border-red-500/40"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? "bg-emerald-400" : "bg-red-400"}`} />
                            {dish.isVeg ? "Veg" : "Non-Veg"}
                          </span>
                        </div>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-1 pointer-events-auto">
                          <button
                            type="button"
                            onClick={() => handleOpenEditDish(dish)}
                            title="Edit Dish"
                            className="p-1.5 bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-lg shadow-sm backdrop-blur-xs transition cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDeleteMenuItem(dish)}
                            title="Delete Dish"
                            className="p-1.5 bg-white/90 hover:bg-white text-gray-700 hover:text-red-600 rounded-lg shadow-sm backdrop-blur-xs transition cursor-pointer disabled:opacity-50"
                          >
                            {isDeleting ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* 86 Sold Out Floating Tag */}
                      {isOut && (
                        <div className="absolute inset-0 bg-red-900/40 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="text-[12px] font-extrabold uppercase tracking-wider bg-red-600 text-white px-3 py-1 rounded-full shadow-lg border border-red-300">
                            86 / Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Dish Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-[15px] font-bold ${isOut ? "text-gray-400 line-through" : "text-[#111827]"}`}>
                            {dish.name}
                          </h4>
                          <span className="text-[15px] font-extrabold text-[#111827] font-mono shrink-0">
                            ₹{dish.price}
                          </span>
                        </div>

                        {dish.description && (
                          <p className="text-[12px] text-[#6B7280] mt-1 line-clamp-2 leading-relaxed">
                            {dish.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-3.5 pt-2.5 border-t border-[#F3F4F6] flex items-center justify-between text-[11px]">
                        <span className="text-[#6B7280] flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                          {dish.prepTimeMinutes || 15} mins prep
                        </span>

                        {/* 1-Click 86 Toggle Button */}
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleItemAvailability(dish)}
                          className={`px-3 py-1 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                            isOut
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                              : "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                          }`}
                        >
                          {isBusy ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : isOut ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Mark In-Stock</span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-3.5 h-3.5 text-red-600" />
                              <span>Mark 86 (Out)</span>
                            </>
                          )}
                        </button>
                      </div>
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
                {(Array.isArray(printKotOrder.items) ? printKotOrder.items : [printKotOrder.items]).map((item: any, idx: number) => {
                  const name = typeof item === "string" ? item : item.name || item.title || item.itemName || "Item";
                  const qty = typeof item === "object" ? (item.quantity || item.qty || 1) : 1;
                  return (
                    <div key={idx} className="flex justify-between font-semibold">
                      <span>{name}</span>
                      <span>x{qty}</span>
                    </div>
                  );
                })}
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                    {menuItems.map((dish) => {
                      const isOut = dish.isAvailable === false;
                      return (
                        <button
                          type="button"
                          key={dish.name}
                          disabled={isOut}
                          onClick={() => handleToggleDish(dish)}
                          className={`p-2 rounded-lg border text-left transition flex items-center gap-2 ${
                            isOut
                              ? "border-red-200 bg-red-50/50 opacity-60 cursor-not-allowed"
                              : "border-[#E5E7EB] bg-white hover:border-[#D1D5DB]"
                          }`}
                        >
                          {dish.image && (
                            <img
                              src={dish.image}
                              alt={dish.name}
                              className="w-9 h-9 rounded object-cover shrink-0 border border-gray-100"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className={`font-semibold text-[12px] truncate ${isOut ? "text-red-700" : "text-[#111827]"}`}>
                              {dish.name}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-[#6B7280] mt-0.5">
                              <span className="font-bold">₹{dish.price}</span>
                              {isOut ? (
                                <span className="text-red-600 font-bold">86 (Out)</span>
                              ) : (
                                <span className="truncate">{dish.category}</span>
                              )}
                            </div>
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

        {/* ----------------- ADD / EDIT MENU ITEM MODAL ----------------- */}
        {isMenuModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-50 text-[#EC3013] rounded-lg">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-[#111827]">
                      {editingDish ? "Edit Menu Dish" : "Add New Dish to Menu"}
                    </h3>
                    <p className="text-[11px] text-[#6B7280]">
                      {editingDish
                        ? "Update price, photo, category, cooking time, and description"
                        : "New item with photo will appear in Restaurant POS, KDS & QR digital menu"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="text-[#9CA3AF] hover:text-[#111827] p-1 rounded-md hover:bg-gray-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveMenuItem} className="space-y-4 text-[13px] flex-1 overflow-y-auto pr-1">
                {/* Dish Name */}
                <div>
                  <label className="block text-[11px] font-bold text-[#374151] uppercase tracking-wider mb-1">
                    Dish Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paneer Butter Masala, Fresh Mango Juice"
                    value={menuFormData.name}
                    onChange={(e) => setMenuFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[#111827] font-medium focus:ring-2 focus:ring-red-500/20 focus:border-[#EC3013] outline-none"
                  />
                </div>

                {/* Dish Photo Upload & Presets */}
                <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-[#374151] uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#EC3013]" />
                      <span>Dish Photo (Image URL, Upload or Preset)</span>
                    </label>
                    {menuFormData.image && (
                      <button
                        type="button"
                        onClick={() => setMenuFormData((prev) => ({ ...prev, image: "" }))}
                        className="text-[10px] text-red-600 hover:underline font-semibold cursor-pointer"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>

                  <div className="flex gap-3 items-center">
                    {/* Live Preview / Thumbnail */}
                    <div className="w-20 h-20 rounded-lg border border-dashed border-gray-300 bg-white shrink-0 overflow-hidden flex items-center justify-center relative shadow-xs">
                      {menuFormData.image ? (
                        <img
                          src={menuFormData.image}
                          alt="Dish Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 p-1 text-center">
                          <ImageIcon className="w-6 h-6 stroke-[1.5] mb-0.5" />
                          <span className="text-[9px]">No Photo</span>
                        </div>
                      )}
                    </div>

                    {/* Image URL input + File Upload */}
                    <div className="flex-1 space-y-2">
                      <input
                        type="url"
                        placeholder="Paste image URL (https://...)"
                        value={menuFormData.image}
                        onChange={(e) => setMenuFormData((prev) => ({ ...prev, image: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs border border-[#D1D5DB] rounded-lg bg-white text-[#111827] focus:ring-2 focus:ring-red-500/20 focus:border-[#EC3013] outline-none"
                      />

                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-md shadow-xs cursor-pointer flex items-center gap-1.5 transition">
                          <Upload className="w-3 h-3 text-[#EC3013]" />
                          <span>Upload Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileUpload}
                            className="hidden"
                          />
                        </label>
                        <span className="text-[10px] text-gray-400">JPG, PNG, WebP up to 3MB</span>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Quick Preset Chips */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">
                      ⚡ 1-Click Photo Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {FOOD_PRESET_IMAGES.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setMenuFormData((prev) => ({ ...prev, image: preset.url }))}
                          className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition cursor-pointer flex items-center gap-1 ${
                            menuFormData.image === preset.url
                              ? "bg-red-50 border-red-400 text-red-700 font-bold"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Category & Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#374151] uppercase tracking-wider mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={menuFormData.category}
                      onChange={(e) => setMenuFormData((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-white text-[#111827] font-medium focus:ring-2 focus:ring-red-500/20 focus:border-[#EC3013] outline-none"
                    >
                      <option value="Starters">Starters</option>
                      <option value="Main Course">Main Course</option>
                      <option value="Breads & Rice">Breads &amp; Rice</option>
                      <option value="Desserts">Desserts</option>
                      <option value="Beverages">Beverages</option>
                      <option value="custom">➕ Custom Category...</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#374151] uppercase tracking-wider mb-1">
                      Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        placeholder="280"
                        value={menuFormData.price}
                        onChange={(e) => setMenuFormData((prev) => ({ ...prev, price: e.target.value }))}
                        className="w-full pl-7 pr-3 py-2 border border-[#D1D5DB] rounded-lg text-[#111827] font-mono font-bold focus:ring-2 focus:ring-red-500/20 focus:border-[#EC3013] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* If custom category selected */}
                {menuFormData.category === "custom" && (
                  <div>
                    <label className="block text-[11px] font-bold text-[#374151] uppercase tracking-wider mb-1">
                      Custom Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Continental, Chinese, Mocktails, Soups"
                      value={menuFormData.customCategory}
                      onChange={(e) => setMenuFormData((prev) => ({ ...prev, customCategory: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[#111827] font-medium focus:ring-2 focus:ring-red-500/20 focus:border-[#EC3013] outline-none"
                    />
                  </div>
                )}

                {/* Food Preference & Prep Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#374151] uppercase tracking-wider mb-1">
                      Food Type
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setMenuFormData((prev) => ({ ...prev, isVeg: true }))}
                        className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          menuFormData.isVeg
                            ? "bg-emerald-50 border-emerald-400 text-emerald-800 ring-2 ring-emerald-500/20"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Pure Veg</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMenuFormData((prev) => ({ ...prev, isVeg: false }))}
                        className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          !menuFormData.isVeg
                            ? "bg-red-50 border-red-400 text-red-800 ring-2 ring-red-500/20"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span>Non-Veg</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#374151] uppercase tracking-wider mb-1">
                      Kitchen Prep Time
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="120"
                        placeholder="15"
                        value={menuFormData.prepTimeMinutes}
                        onChange={(e) => setMenuFormData((prev) => ({ ...prev, prepTimeMinutes: e.target.value }))}
                        className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[#111827] font-medium focus:ring-2 focus:ring-red-500/20 focus:border-[#EC3013] outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">mins</span>
                    </div>
                  </div>
                </div>

                {/* Stock Status */}
                <div>
                  <label className="block text-[11px] font-bold text-[#374151] uppercase tracking-wider mb-1">
                    Initial Stock Status
                  </label>
                  <div className="flex items-center gap-4 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="dishAvailability"
                        checked={menuFormData.isAvailable === true}
                        onChange={() => setMenuFormData((prev) => ({ ...prev, isAvailable: true }))}
                        className="text-[#EC3013] focus:ring-red-500"
                      />
                      <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> In-Stock (Available to order)
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="dishAvailability"
                        checked={menuFormData.isAvailable === false}
                        onChange={() => setMenuFormData((prev) => ({ ...prev, isAvailable: false }))}
                        className="text-[#EC3013] focus:ring-red-500"
                      />
                      <span className="text-xs font-semibold text-red-700 flex items-center gap-1">
                        <Ban className="w-3.5 h-3.5 text-red-600" /> 86 (Out of Stock)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-bold text-[#374151] uppercase tracking-wider mb-1">
                    Dish Description / Ingredients (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Short appetizing description or key ingredients for servers and guests..."
                    value={menuFormData.description}
                    onChange={(e) => setMenuFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[#111827] focus:ring-2 focus:ring-red-500/20 focus:border-[#EC3013] outline-none text-xs"
                  />
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
                  <button
                    type="button"
                    disabled={isSavingDish}
                    onClick={() => setIsMenuModalOpen(false)}
                    className="px-4 py-2 border border-[#D1D5DB] rounded-lg text-[#374151] font-semibold hover:bg-gray-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingDish}
                    className="px-5 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingDish ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving Dish...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{editingDish ? "Update Dish" : "Save to Menu"}</span>
                      </>
                    )}
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
