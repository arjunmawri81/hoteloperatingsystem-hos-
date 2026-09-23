"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { roomsApi, hotelsApi } from "@/lib/api";
import { Hotel } from "@/types";
import {
  BedDouble,
  Plus,
  Zap,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Building2,
  Filter,
  Search,
  X,
  Sparkles,
  User,
} from "lucide-react";

interface Room {
  _id?: string;
  number: string;
  floor: number;
  type: string;
  status: "available" | "occupied" | "dirty" | "out_of_order";
  guest?: string;
  cleaner?: string;
  rate: number;
  hotelId?: string;
  hotelName?: string;
  orgId?: string;
}

interface CustomRoomRow {
  number: string;
  type: string;
  rate: number | string;
  status: "available" | "occupied" | "dirty" | "out_of_order";
}

const generateFloorRooms = (
  floorNum: number = 1,
  count: number = 10,
  baseRate: number = 2500
): CustomRoomRow[] => {
  const safeCount = Math.max(1, Math.min(count, 100));
  return Array.from({ length: safeCount }, (_, i) => {
    const unitSeq = i + 1;
    const roomNum = `${floorNum}${unitSeq < 10 ? `0${unitSeq}` : unitSeq}`;
    let type = "Standard Room";
    let rate = baseRate;

    if (unitSeq % 5 === 4) {
      type = "Deluxe King";
      rate = Math.round(baseRate * 1.4);
    } else if (unitSeq % 5 === 0) {
      type = "Executive Suite";
      rate = Math.round(baseRate * 2.2);
    } else if (unitSeq % 3 === 0) {
      type = "Superior Twin";
      rate = Math.round(baseRate * 1.28);
    }

    return {
      number: roomNum,
      type,
      rate,
      status: "available",
    };
  });
};

export default function HotelAdminRoomsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filters
  const [selectedHotelId, setSelectedHotelId] = useState<string>("all");
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingRoomNumber, setDeletingRoomNumber] = useState<string | null>(null);

  // Single-Floor Creation States (Clean Manual Entry)
  const [createHotelId, setCreateHotelId] = useState("");
  const [createHotelName, setCreateHotelName] = useState("");
  const [floorInput, setFloorInput] = useState<string>("1");
  const [countInput, setCountInput] = useState<string>("10");
  const [selectedCreationFloor, setSelectedCreationFloor] = useState<number>(1);
  const [floorRoomCount, setFloorRoomCount] = useState<number>(10);
  const [roomRows, setRoomRows] = useState<CustomRoomRow[]>(() =>
    generateFloorRooms(1, 10, 2500)
  );

  // Capacity Auto-generator
  const [batchForm, setBatchForm] = useState({
    hotelId: "",
    hotelName: "",
    totalRooms: 12,
    floors: 2,
    defaultRate: 2500,
  });

  const loadData = async () => {
    if (isAuthLoading) return;
    setIsLoading(true);
    try {
      const effectiveOrgId = user?.orgId;
      const [roomsData, hotelsData] = await Promise.all([
        roomsApi.getAll(effectiveOrgId ? { orgId: effectiveOrgId } : undefined),
        hotelsApi.getAll(effectiveOrgId ? { orgId: effectiveOrgId } : undefined),
      ]);

      setRooms(roomsData);
      setHotels(hotelsData);

      if (hotelsData.length > 0) {
        if (!createHotelId) {
          setCreateHotelId(hotelsData[0].id);
          setCreateHotelName(hotelsData[0].name);
        }
        if (!batchForm.hotelId) {
          setBatchForm((prev) => ({
            ...prev,
            hotelId: hotelsData[0].id,
            hotelName: hotelsData[0].name,
            totalRooms: hotelsData[0].totalRooms || 12,
          }));
        }
      }
    } catch (err) {
      console.error("Failed to load room data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading) {
      loadData();
    }
  }, [user?.orgId, isAuthLoading]);

  // Handle manual typing of floor number
  const handleFloorInputChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "");
    setFloorInput(cleaned);
    const parsedFloor = parseInt(cleaned, 10);
    if (!isNaN(parsedFloor) && parsedFloor > 0) {
      setSelectedCreationFloor(parsedFloor);
      setRoomRows(generateFloorRooms(parsedFloor, floorRoomCount, 2500));
    }
  };

  // Handle manual typing of room count on current floor
  const handleCountInputChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "");
    setCountInput(cleaned);
    const parsedCount = parseInt(cleaned, 10);
    if (!isNaN(parsedCount) && parsedCount > 0 && parsedCount <= 200) {
      setFloorRoomCount(parsedCount);
      setRoomRows((prev) => {
        if (parsedCount === prev.length) return prev;
        if (parsedCount < prev.length) {
          return prev.slice(0, parsedCount);
        }
        const additionalCount = parsedCount - prev.length;
        const additionalRows = Array.from({ length: additionalCount }, (_, i) => {
          const unitSeq = prev.length + i + 1;
          const roomNum = `${selectedCreationFloor}${unitSeq < 10 ? `0${unitSeq}` : unitSeq}`;
          return {
            number: roomNum,
            type: "Standard Room",
            rate: 2500,
            status: "available" as const,
          };
        });
        return [...prev, ...additionalRows];
      });
    }
  };

  // Update specific room row field
  const updateRoomRow = (index: number, field: keyof CustomRoomRow, value: any) => {
    setRoomRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Remove room row
  const removeRoomRow = (index: number) => {
    setRoomRows((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      setFloorRoomCount(updated.length);
      setCountInput(updated.length.toString());
      return updated;
    });
  };

  // Add room row to current floor
  const addRoomToFloor = () => {
    setRoomRows((prev) => {
      const last = prev[prev.length - 1];
      const lastNum = last ? parseInt(last.number.replace(/\D/g, ""), 10) : selectedCreationFloor * 100;
      const nextNum = isNaN(lastNum)
        ? `${selectedCreationFloor}01`
        : `${lastNum + 1}`;
      const newRows = [
        ...prev,
        {
          number: nextNum,
          type: "Standard Room",
          rate: 2500,
          status: "available" as const,
        },
      ];
      setFloorRoomCount(newRows.length);
      setCountInput(newRows.length.toString());
      return newRows;
    });
  };

  // Save all rooms for this selected floor
  const handleSaveFloorRooms = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = roomRows.filter((r) => r.number.trim() !== "");
    if (validRows.length === 0) {
      setToastMsg("❌ Please specify at least one room unit number.");
      setTimeout(() => setToastMsg(null), 4000);
      return;
    }

    setIsSubmitting(true);
    try {
      const effectiveOrgId = user?.orgId;
      const selectedHotel = hotels.find((h) => h.id === createHotelId);

      const formattedRooms = validRows.map((r) => ({
        number: r.number.trim(),
        floor: selectedCreationFloor,
        type: r.type || "Standard Room",
        rate: Number(r.rate) || 150,
        status: r.status || "available",
        hotelId: createHotelId || selectedHotel?.id || "hotel-101",
        hotelName: selectedHotel?.name || createHotelName || "Main Property",
        ...(effectiveOrgId ? { orgId: effectiveOrgId } : {}),
      }));

      await roomsApi.createBulk({
        rooms: formattedRooms,
        hotelId: createHotelId || selectedHotel?.id || "hotel-101",
        hotelName: selectedHotel?.name || createHotelName || "Main Property",
        orgId: effectiveOrgId,
      });

      await loadData();
      setIsAddModalOpen(false);
      setToastMsg(`✅ Successfully created ${formattedRooms.length} rooms on Floor ${selectedCreationFloor}!`);
      setTimeout(() => setToastMsg(null), 5000);
    } catch (err: any) {
      console.error("Create rooms error:", err);
      setToastMsg(`❌ ${err?.response?.data?.message || err.message || "Failed to save rooms"}`);
      setTimeout(() => setToastMsg(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle batch generation from hotel capacity
  const handleBatchGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const effectiveOrgId = user?.orgId;
      const selectedHotel = hotels.find((h) => h.id === batchForm.hotelId);

      const res = await roomsApi.batchGenerate({
        hotelId: batchForm.hotelId || selectedHotel?.id || "hotel-101",
        hotelName: selectedHotel?.name || batchForm.hotelName || "Main Property",
        ...(effectiveOrgId ? { orgId: effectiveOrgId } : {}),
        totalRooms: Number(batchForm.totalRooms) || 12,
        floors: Number(batchForm.floors) || 2,
        defaultRate: Number(batchForm.defaultRate) || 180,
      });

      if (Array.isArray(res)) {
        setRooms(res);
      } else {
        await loadData();
      }

      setIsBatchModalOpen(false);
      setToastMsg(`⚡ Successfully generated ${batchForm.totalRooms} room units across ${batchForm.floors} floors!`);
      setTimeout(() => setToastMsg(null), 5000);
    } catch (err: any) {
      console.error("Batch generate error:", err);
      setToastMsg(`❌ ${err?.response?.data?.message || err.message || "Failed to auto-generate rooms"}`);
      setTimeout(() => setToastMsg(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle single room status / rate update
  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    setIsSubmitting(true);
    try {
      const updated = await roomsApi.updateStatus(editingRoom.number, {
        status: editingRoom.status,
        guest: editingRoom.guest || "",
        cleaner: editingRoom.cleaner || "",
        rate: Number(editingRoom.rate),
        type: editingRoom.type,
      });

      setRooms((prev) => prev.map((r) => (r.number === editingRoom.number ? updated : r)));
      setEditingRoom(null);
      setToastMsg(`✅ Room unit ${editingRoom.number} updated successfully`);
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err: any) {
      console.error("Update room error:", err);
      setToastMsg(`❌ Failed to update room: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle room delete
  const handleDeleteRoom = async (number: string) => {
    try {
      await roomsApi.delete(number);
      setRooms((prev) => prev.filter((r) => r.number !== number));
      setDeletingRoomNumber(null);
      setToastMsg(`🗑️ Room unit ${number} removed from inventory`);
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err: any) {
      console.error("Delete room error:", err);
      setToastMsg(`❌ Failed to delete room ${number}`);
    }
  };

  // Filtered rooms
  const filteredRooms = rooms.filter((room) => {
    const hotelMatch = selectedHotelId === "all" || room.hotelId === selectedHotelId;
    const floorMatch = selectedFloor === "all" || room.floor.toString() === selectedFloor;
    const statusMatch = selectedStatus === "all" || room.status === selectedStatus;
    const searchMatch =
      !searchQuery.trim() ||
      room.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.guest && room.guest.toLowerCase().includes(searchQuery.toLowerCase()));

    return hotelMatch && floorMatch && statusMatch && searchMatch;
  });

  // Unique floors present
  const availableFloors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b);

  // Status Helpers
  const getStatusColor = (status: Room["status"]) => {
    switch (status) {
      case "available":
        return "bg-emerald-50 border-emerald-200 text-emerald-800 hover:border-emerald-400";
      case "occupied":
        return "bg-rose-50 border-rose-200 text-rose-800 hover:border-rose-400";
      case "dirty":
        return "bg-amber-50 border-amber-200 text-amber-800 hover:border-amber-400";
      case "out_of_order":
        return "bg-gray-100 border-gray-300 text-gray-800 hover:border-gray-400";
    }
  };

  const getStatusBadge = (status: Room["status"]) => {
    switch (status) {
      case "available":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
            Available
          </span>
        );
      case "occupied":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
            Occupied
          </span>
        );
      case "dirty":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
            Housekeeping
          </span>
        );
      case "out_of_order":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-800 border border-gray-300">
            Out of Order
          </span>
        );
    }
  };

  const counts = {
    total: rooms.length,
    available: rooms.filter((r) => r.status === "available").length,
    occupied: rooms.filter((r) => r.status === "occupied").length,
    dirty: rooms.filter((r) => r.status === "dirty").length,
    out_of_order: rooms.filter((r) => r.status === "out_of_order").length,
    avgRate:
      rooms.length > 0
        ? Math.round(rooms.reduce((acc, r) => acc + (r.rate || 0), 0) / rooms.length)
        : 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#0F172A] tracking-[-0.02em]">
            Room Map &amp; Unit Management
          </h1>
          <p className="text-[13px] text-[#64748B] mt-1 font-normal">
            Build, configure, and manage physical room units floor-by-floor with custom room numbers and nightly pricing.
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadData}
            title="Refresh database"
            className="p-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] rounded text-[#4B5563] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
          </button>

          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#111827] text-[13px] font-bold rounded shadow-2xs transition-colors cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>⚡ Auto-Generate From Capacity</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Rooms</span>
          </button>
        </div>
      </div>

      {/* Toast Notice */}
      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-[13px] px-4 py-3 rounded-lg flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Row (Matching Sidebar Deep Navy Theme) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Units */}
        <div className="relative overflow-hidden bg-[#0B132B] hover:bg-[#0F1A3A] p-4 rounded-xl border border-slate-800/90 shadow-lg hover:border-cyan-500/40 hover:shadow-cyan-950/30 hover:-translate-y-0.5 transition-all duration-200">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-cyan-500/50 to-transparent" />
          <div className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">Total Units</div>
          <div className="text-[24px] font-black text-white mt-1 tracking-tight drop-shadow-xs">{counts.total}</div>
        </div>

        {/* Available */}
        <div className="relative overflow-hidden bg-[#0B132B] hover:bg-[#0F1A3A] p-4 rounded-xl border border-slate-800/90 shadow-lg hover:border-emerald-500/40 hover:shadow-emerald-950/30 hover:-translate-y-0.5 transition-all duration-200">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-500/60 to-transparent" />
          <div className="text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Available</span>
          </div>
          <div className="text-[24px] font-black text-emerald-300 mt-1 tracking-tight drop-shadow-xs">{counts.available}</div>
        </div>

        {/* Occupied */}
        <div className="relative overflow-hidden bg-[#0B132B] hover:bg-[#0F1A3A] p-4 rounded-xl border border-slate-800/90 shadow-lg hover:border-rose-500/40 hover:shadow-rose-950/30 hover:-translate-y-0.5 transition-all duration-200">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-rose-500/60 to-transparent" />
          <div className="text-[10px] font-black text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Occupied</span>
          </div>
          <div className="text-[24px] font-black text-rose-300 mt-1 tracking-tight drop-shadow-xs">{counts.occupied}</div>
        </div>

        {/* Housekeeping */}
        <div className="relative overflow-hidden bg-[#0B132B] hover:bg-[#0F1A3A] p-4 rounded-xl border border-slate-800/90 shadow-lg hover:border-amber-500/40 hover:shadow-amber-950/30 hover:-translate-y-0.5 transition-all duration-200">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-amber-500/60 to-transparent" />
          <div className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Housekeeping</span>
          </div>
          <div className="text-[24px] font-black text-amber-300 mt-1 tracking-tight drop-shadow-xs">{counts.dirty}</div>
        </div>

        {/* Out of Order */}
        <div className="relative overflow-hidden bg-[#0B132B] hover:bg-[#0F1A3A] p-4 rounded-xl border border-slate-800/90 shadow-lg hover:border-slate-500/40 hover:shadow-slate-950/30 hover:-translate-y-0.5 transition-all duration-200">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-slate-500/50 to-transparent" />
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Out of Order</div>
          <div className="text-[24px] font-black text-slate-300 mt-1 tracking-tight drop-shadow-xs">{counts.out_of_order}</div>
        </div>

        {/* Avg Nightly Rate */}
        <div className="relative overflow-hidden bg-[#0B132B] hover:bg-[#0F1A3A] p-4 rounded-xl border border-slate-800/90 shadow-lg hover:border-cyan-500/40 hover:shadow-cyan-950/30 hover:-translate-y-0.5 transition-all duration-200">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-blue-500/60 via-cyan-500/40 to-transparent" />
          <div className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">Avg Nightly Rate</div>
          <div className="text-[24px] font-black text-cyan-300 mt-1 tracking-tight drop-shadow-xs">₹{counts.avgRate}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Hotel Filter */}
          {hotels.length > 0 && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#6B7280]" />
              <select
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(e.target.value)}
                className="px-2.5 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded text-[13px] font-medium text-[#111827] focus:outline-none focus:border-[#EC3013]"
              >
                <option value="all">All Properties ({hotels.length})</option>
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.totalRooms || 0} rooms capacity)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Floor Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-bold text-[#6B7280]">Floor:</span>
            <button
              onClick={() => setSelectedFloor("all")}
              className={`px-2.5 py-1 rounded text-[12px] font-semibold transition-colors ${
                selectedFloor === "all" ? "bg-[#111827] text-white" : "bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]"
              }`}
            >
              All
            </button>
            {(availableFloors.length > 0 ? availableFloors : [1, 2, 3]).map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFloor(f.toString())}
                className={`px-2.5 py-1 rounded text-[12px] font-semibold transition-colors ${
                  selectedFloor === f.toString()
                    ? "bg-[#EC3013] text-white"
                    : "bg-white border border-[#D1D5DB] text-[#374151] hover:bg-[#F3F4F6]"
                }`}
              >
                Fl {f}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#6B7280]" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2 py-1 bg-[#F9FAFB] border border-[#D1D5DB] rounded text-[12px] font-semibold text-[#374151] capitalize"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="dirty">Housekeeping</option>
              <option value="out_of_order">Out of Order</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search room #, type, guest..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013]"
          />
        </div>
      </div>

      {/* Main Room Units Floor Plan View */}
      {rooms.length === 0 ? (
        <div className="bg-white p-12 sm:p-16 rounded-lg border border-[#E5E7EB] text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-[#F3F4F6] rounded-full flex items-center justify-center mx-auto text-[#9CA3AF]">
            <BedDouble className="w-8 h-8 opacity-60" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-[18px] font-bold text-[#111827]">No Room Units Configured</h3>
            <p className="text-[13px] text-[#6B7280]">
              You haven&apos;t created room units for this property yet. Choose a floor and set the number of rooms with custom numbers and prices.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Rooms</span>
            </button>
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-[#D1D5DB] hover:bg-[#F3F4F6] text-[#374151] text-[13px] font-bold rounded transition-colors cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>⚡ Auto-Generate From Capacity</span>
            </button>
          </div>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="bg-white p-12 rounded-lg border border-[#E5E7EB] text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 bg-[#F3F4F6] rounded-full flex items-center justify-center mx-auto text-[#6B7280]">
            <Filter className="w-6 h-6 text-[#9CA3AF]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-[16px] font-bold text-[#111827]">No Rooms Found Matching Filter</h3>
            <p className="text-[13px] text-[#6B7280] max-w-md mx-auto">
              There are currently 0 rooms matching the selected filter criteria. All {rooms.length} property rooms are accounted for in other statuses or floors.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => {
                setSelectedFloor("all");
                setSelectedHotelId("all");
                setSearchQuery("");
              }}
              className="px-4 py-2 bg-[#111827] hover:bg-[#1F2937] text-white text-[12px] font-bold rounded shadow-xs transition-colors cursor-pointer"
            >
              Clear Filters &amp; Show All Rooms ({rooms.length})
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {(availableFloors.length > 0 ? availableFloors : [1, 2, 3, 4])
            .filter((floor) => selectedFloor === "all" || selectedFloor === floor.toString())
            .map((floor) => {
              const floorRooms = filteredRooms.filter((r) => r.floor === floor);
              if (floorRooms.length === 0) return null;

              return (
                <div key={floor} className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-xs space-y-4">
                  {/* Floor Subheader */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#111827] text-white text-[11px] font-bold flex items-center justify-center">
                        {floor}
                      </div>
                      <h3 className="text-[15px] font-bold text-[#111827]">Floor {floor}</h3>
                    </div>
                    <span className="text-[12px] font-semibold text-[#6B7280]">
                      {floorRooms.length} Room Units
                    </span>
                  </div>

                  {/* Room Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
                    {floorRooms.map((room) => (
                      <div
                        key={`${room._id || room.hotelId || room.hotelName || "h"}-${room.number}`}
                        className={`p-3.5 rounded-lg border-2 text-left transition-all flex flex-col justify-between shadow-2xs hover:shadow-md ${getStatusColor(
                          room.status
                        )}`}
                      >
                        {/* Room Card Top */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[16px] font-black text-[#111827] tracking-tight">
                              Room {room.number}
                            </span>
                            <span className="text-[12px] font-bold text-[#111827] bg-white/80 px-2 py-0.5 rounded border border-black/10">
                              ₹{room.rate}
                            </span>
                          </div>

                          <div className="text-[11px] font-semibold text-[#4B5563] truncate">
                            {room.type}
                          </div>

                          {room.hotelName && (
                            <div className="text-[10px] text-[#6B7280] truncate mt-0.5">
                              {room.hotelName}
                            </div>
                          )}

                          {room.guest && (
                            <div className="text-[11px] font-bold text-rose-900 mt-2 truncate flex items-center gap-1 bg-white/60 p-1 rounded">
                              <User className="w-3 h-3 shrink-0" />
                              <span className="truncate">{room.guest}</span>
                            </div>
                          )}
                        </div>

                        {/* Room Card Bottom Actions */}
                        <div className="mt-3 pt-2.5 border-t border-black/10 flex items-center justify-between gap-1">
                          <div>{getStatusBadge(room.status)}</div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingRoom(room)}
                              title="Edit Room Details"
                              className="p-1 rounded hover:bg-white/80 text-[#4B5563] hover:text-[#111827] transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingRoomNumber(room.number)}
                              title="Delete Room Unit"
                              className="p-1 rounded hover:bg-rose-100 text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. CREATE ROOMS MODAL (1 Floor at a Time with Custom Rooms) */}
      {/* ------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xl w-full max-w-4xl p-6 space-y-4 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EC3013]/10 text-[#EC3013] flex items-center justify-center font-bold">
                  <BedDouble className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-[#111827]">
                    Create Rooms (Floor {selectedCreationFloor})
                  </h3>
                  <p className="text-[12px] text-[#6B7280]">
                    Select a floor, choose how many rooms to create on that floor, and customize each room&apos;s number and price.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFloorRooms} className="space-y-4 text-[13px]">
              {/* Floor & Room Count Config Bar */}
              <div className="bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB] space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Property Selector */}
                  {hotels.length > 0 && (
                    <div>
                      <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                        Hotel Property:
                      </label>
                      <select
                        value={createHotelId}
                        onChange={(e) => {
                          const h = hotels.find((hotel) => hotel.id === e.target.value);
                          setCreateHotelId(e.target.value);
                          setCreateHotelName(h?.name || "");
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-[#D1D5DB] rounded text-[13px] font-semibold text-[#111827]"
                      >
                        {hotels.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Floor Number Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                      Floor Number:
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={floorInput}
                      onChange={(e) => handleFloorInputChange(e.target.value)}
                      placeholder="e.g. 1, 2, 3..."
                      className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded text-[13px] font-bold text-[#111827] focus:outline-none focus:border-[#EC3013]"
                    />
                  </div>

                  {/* Number of Rooms on this Floor */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                      Number of Rooms on Floor {selectedCreationFloor}:
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={countInput}
                      onChange={(e) => handleCountInputChange(e.target.value)}
                      placeholder="e.g. 6, 10, 15..."
                      className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded text-[13px] font-bold text-[#111827] focus:outline-none focus:border-[#EC3013]"
                    />
                  </div>
                </div>
              </div>

              {/* Editable Rooms Table for the selected floor */}
              <div className="border border-[#E5E7EB] rounded-lg overflow-hidden max-h-[380px] overflow-y-auto shadow-2xs">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-[#F3F4F6] text-[#6B7280] text-[10px] font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-[#E5E7EB]">
                    <tr>
                      <th className="py-2.5 px-3 w-10">#</th>
                      <th className="py-2.5 px-3 w-36">Room Number *</th>
                      <th className="py-2.5 px-3 w-28">Floor</th>
                      <th className="py-2.5 px-3">Room Class / Type</th>
                      <th className="py-2.5 px-3 w-36">Nightly Price (₹) *</th>
                      <th className="py-2.5 px-3 w-32">Initial Status</th>
                      <th className="py-2.5 px-3 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {roomRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-2 px-3 font-bold text-[#9CA3AF]">{idx + 1}</td>

                        {/* Room Number Input */}
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            required
                            placeholder={`e.g. ${selectedCreationFloor}${idx + 1 < 10 ? `0${idx + 1}` : idx + 1}`}
                            value={row.number}
                            onChange={(e) => updateRoomRow(idx, "number", e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-[#D1D5DB] rounded font-bold text-[#111827] focus:outline-none focus:border-[#EC3013]"
                          />
                        </td>

                        {/* Locked Floor Badge */}
                        <td className="py-2 px-2">
                          <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 border border-gray-300 text-gray-800 font-bold text-[11px] rounded">
                            Floor {selectedCreationFloor}
                          </span>
                        </td>

                        {/* Room Class Dropdown */}
                        <td className="py-2 px-2">
                          <select
                            value={row.type}
                            onChange={(e) => {
                              const t = e.target.value;
                              let autoRate = row.rate;
                              if (t === "Standard Room") autoRate = 2500;
                              if (t === "Deluxe King") autoRate = 3500;
                              if (t === "Superior Twin") autoRate = 3200;
                              if (t === "Executive Suite") autoRate = 5500;
                              if (t === "Presidential Suite") autoRate = 12000;
                              if (t === "Studio Room") autoRate = 2800;
                              updateRoomRow(idx, "type", t);
                              updateRoomRow(idx, "rate", autoRate);
                            }}
                            className="w-full px-2.5 py-1.5 border border-[#D1D5DB] rounded bg-white text-[12px] font-medium"
                          >
                            <option value="Standard Room">Standard Room</option>
                            <option value="Deluxe King">Deluxe King</option>
                            <option value="Superior Twin">Superior Twin</option>
                            <option value="Executive Suite">Executive Suite</option>
                            <option value="Presidential Suite">Presidential Suite</option>
                            <option value="Studio Room">Studio Room</option>
                          </select>
                        </td>

                        {/* Price / Rate Input (No spin buttons) */}
                        <td className="py-2 px-2">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] font-bold text-[13px]">
                              ₹
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              required
                              value={row.rate}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                updateRoomRow(idx, "rate", val ? Number(val) : "");
                              }}
                              className="w-full pl-6 pr-2.5 py-1.5 border border-[#D1D5DB] rounded font-bold text-[#111827] focus:outline-none focus:border-[#EC3013]"
                            />
                          </div>
                        </td>

                        {/* Status Dropdown */}
                        <td className="py-2 px-2">
                          <select
                            value={row.status}
                            onChange={(e) => updateRoomRow(idx, "status", e.target.value as any)}
                            className="w-full px-2 py-1.5 border border-[#D1D5DB] rounded bg-white text-[11px] capitalize font-medium"
                          >
                            <option value="available">Available</option>
                            <option value="occupied">Occupied</option>
                            <option value="dirty">Housekeeping</option>
                            <option value="out_of_order">Out of Order</option>
                          </select>
                        </td>

                        {/* Delete Row Button */}
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeRoomRow(idx)}
                            title="Remove Room"
                            className="p-1 text-[#9CA3AF] hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Helper Tools */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-[#6B7280]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addRoomToFloor}
                    className="px-3 py-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#374151] font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Room on Floor {selectedCreationFloor}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFloorInputChange(floorInput || "1")}
                    className="px-3 py-1.5 text-[#6B7280] hover:text-[#111827] underline cursor-pointer"
                  >
                    Reset Floor {selectedCreationFloor} Defaults
                  </button>
                </div>

                <div className="font-bold text-[#111827]">
                  Floor {selectedCreationFloor}: {roomRows.length} Rooms · Avg Rate: ₹
                  {roomRows.length > 0
                    ? Math.round(
                        roomRows.reduce((acc, r) => acc + (Number(r.rate) || 0), 0) /
                          roomRows.length
                      )
                    : 0}
                  /night
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-[#D1D5DB] rounded text-[#374151] font-semibold hover:bg-[#F3F4F6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || roomRows.length === 0}
                  className="px-6 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <BedDouble className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? "Saving Rooms..."
                      : `Save ${roomRows.length} Rooms for Floor ${selectedCreationFloor}`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. AUTO-GENERATE ROOMS BATCH MODAL */}
      {/* ------------------------------------------------------------- */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="text-[16px] font-bold text-[#111827]">Auto-Generate Room Inventory</h3>
              </div>
              <button onClick={() => setIsBatchModalOpen(false)} className="text-[#9CA3AF] hover:text-[#111827] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded text-[12px] text-amber-900 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                Auto-generator assigns room numbers systematically across your property floors (e.g. 101, 102, 201, 202) and applies standard and deluxe tier room mixes.
              </div>
            </div>

            <form onSubmit={handleBatchGenerate} className="space-y-4 text-[13px]">
              {/* Hotel Property Selector */}
              {hotels.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Select Target Property
                  </label>
                  <select
                    value={batchForm.hotelId}
                    onChange={(e) => {
                      const h = hotels.find((hotel) => hotel.id === e.target.value);
                      setBatchForm({
                        ...batchForm,
                        hotelId: e.target.value,
                        hotelName: h?.name || "",
                        totalRooms: h?.totalRooms || batchForm.totalRooms,
                      });
                    }}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                  >
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.totalRooms || 12} rooms capacity)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Total Units & Floors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Total Rooms to Generate
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    required
                    value={batchForm.totalRooms}
                    onChange={(e) => setBatchForm({ ...batchForm, totalRooms: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Number of Floors
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={batchForm.floors}
                    onChange={(e) => setBatchForm({ ...batchForm, floors: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                  />
                </div>
              </div>

              {/* Default Rate */}
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Base Nightly Rate (₹)
                </label>
                <input
                  type="number"
                  min="100"
                  required
                  value={batchForm.defaultRate}
                  onChange={(e) => setBatchForm({ ...batchForm, defaultRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                />
                <span className="text-[11px] text-[#9CA3AF] mt-1 block">
                  Deluxe (+30%) and Executive (+80%) rates are dynamically calculated based on this base rate.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 border border-[#D1D5DB] rounded text-[#374151] font-semibold hover:bg-[#F3F4F6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>{isSubmitting ? "Generating Units..." : "Generate Rooms Now"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. EDIT ROOM UNIT MODAL */}
      {/* ------------------------------------------------------------- */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-[16px] font-bold text-[#111827]">Edit Room {editingRoom.number}</h3>
                <p className="text-[11px] text-[#6B7280]">Floor {editingRoom.floor} · {editingRoom.hotelName || "Main Property"}</p>
              </div>
              <button onClick={() => setEditingRoom(null)} className="text-[#9CA3AF] hover:text-[#111827] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRoom} className="space-y-4 text-[13px]">
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Status
                </label>
                <select
                  value={editingRoom.status}
                  onChange={(e) => setEditingRoom({ ...editingRoom, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="dirty">Housekeeping / Turnover</option>
                  <option value="out_of_order">Out of Order</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Room Class
                  </label>
                  <input
                    type="text"
                    value={editingRoom.type}
                    onChange={(e) => setEditingRoom({ ...editingRoom, type: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Nightly Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={editingRoom.rate}
                    onChange={(e) => setEditingRoom({ ...editingRoom, rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Current Assigned Guest
                </label>
                <input
                  type="text"
                  placeholder="Guest name (optional)"
                  value={editingRoom.guest || ""}
                  onChange={(e) => setEditingRoom({ ...editingRoom, guest: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="px-4 py-2 border border-[#D1D5DB] rounded text-[#374151] font-semibold hover:bg-[#F3F4F6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. DELETE ROOM CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------- */}
      {deletingRoomNumber && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[#111827]">Delete Room {deletingRoomNumber}?</h3>
                <p className="text-[12px] text-[#6B7280]">
                  This will permanently remove this room unit from database inventory.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setDeletingRoomNumber(null)}
                className="px-3 py-1.5 border border-[#D1D5DB] rounded text-[#374151] text-[12px] font-semibold hover:bg-[#F3F4F6]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteRoom(deletingRoomNumber)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold rounded shadow-xs"
              >
                Delete Unit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
