"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { roomsApi, hotelsApi } from "@/lib/api";
import { Hotel } from "@/types";
import {
  BedDouble,
  User,
  Sparkles,
  AlertCircle,
  Filter,
  CheckCircle2,
  RefreshCw,
  Plus,
  Zap,
  X,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { useAuth } from "@/context/AuthContext";

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

export default function RoomMapPage() {
  const { user } = useAuth();
  const canManageRooms =
    user?.role === "super_admin" ||
    user?.role === "hotel_admin" ||
    user?.role === "hotel_manager";

  const [rooms, setRooms] = useState<Room[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterFloor, setFilterFloor] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals & Mode
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Single Floor Room Creation States (Clean Manual Entry)
  const [createHotelId, setCreateHotelId] = useState("");
  const [createHotelName, setCreateHotelName] = useState("");
  const [floorInput, setFloorInput] = useState<string>("1");
  const [countInput, setCountInput] = useState<string>("10");
  const [selectedCreationFloor, setSelectedCreationFloor] = useState<number>(1);
  const [floorRoomCount, setFloorRoomCount] = useState<number>(10);
  const [roomRows, setRoomRows] = useState<CustomRoomRow[]>(() =>
    generateFloorRooms(1, 10, 2500)
  );

  // Batch Generation Form (Capacity Auto-generator)
  const [batchForm, setBatchForm] = useState({
    hotelId: "",
    hotelName: "",
    totalRooms: 12,
    floors: 2,
    defaultRate: 2500,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const roomParams: any = {};
      const hotelParams: any = {};
      if (user?.hotelId) roomParams.hotelId = user.hotelId;
      if (user?.hotelName) roomParams.hotelName = user.hotelName;
      if (user?.orgId) {
        roomParams.orgId = user.orgId;
        hotelParams.orgId = user.orgId;
      }

      const [roomsData, hotelsData] = await Promise.all([
        roomsApi.getAll(Object.keys(roomParams).length > 0 ? roomParams : undefined),
        hotelsApi.getAll(Object.keys(hotelParams).length > 0 ? hotelParams : undefined),
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

      if (selectedRoom) {
        const refreshed = roomsData.find((r: Room) => r.number === selectedRoom.number);
        if (refreshed) setSelectedRoom(refreshed);
      }
    } catch (e) {
      console.error("Error loading rooms from database:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.hotelId, user?.orgId]);

  const handleStatusChange = async (newStatus: Room["status"]) => {
    if (!selectedRoom) return;

    try {
      const updated = await roomsApi.updateStatus(selectedRoom.number, {
        status: newStatus,
        guest: newStatus === "available" ? "" : selectedRoom.guest,
      });

      setRooms(rooms.map((r) => (r.number === selectedRoom.number ? updated : r)));
      setSelectedRoom(updated);
      setToastMsg(`✅ Room ${selectedRoom.number} status updated to "${newStatus.replace("_", " ")}"`);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFloorInputChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "");
    setFloorInput(cleaned);
    const parsedFloor = parseInt(cleaned, 10);
    if (!isNaN(parsedFloor) && parsedFloor > 0) {
      setSelectedCreationFloor(parsedFloor);
      setRoomRows(generateFloorRooms(parsedFloor, floorRoomCount, 2500));
    }
  };

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

  const updateRoomRow = (index: number, field: keyof CustomRoomRow, value: any) => {
    setRoomRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeRoomRow = (index: number) => {
    setRoomRows((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      setFloorRoomCount(updated.length);
      setCountInput(updated.length.toString());
      return updated;
    });
  };

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
      const selectedHotel = hotels.find((h) => h.id === createHotelId);
      const formattedRooms = validRows.map((r) => ({
        number: r.number.trim(),
        floor: selectedCreationFloor,
        type: r.type || "Standard Room",
        rate: Number(r.rate) || 150,
        status: r.status || "available",
        hotelId: createHotelId || selectedHotel?.id || "hotel-101",
        hotelName: selectedHotel?.name || createHotelName || "Main Property",
      }));

      await roomsApi.createBulk({
        rooms: formattedRooms,
        hotelId: createHotelId || selectedHotel?.id || "hotel-101",
        hotelName: selectedHotel?.name || createHotelName || "Main Property",
      });

      await loadData();
      setIsAddModalOpen(false);
      setToastMsg(`✅ Successfully created ${formattedRooms.length} rooms on Floor ${selectedCreationFloor}!`);
      setTimeout(() => setToastMsg(null), 5000);
    } catch (err: any) {
      console.error("Multi-room create error:", err);
      setToastMsg(`❌ ${err?.response?.data?.message || err.message || "Failed to create rooms"}`);
      setTimeout(() => setToastMsg(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const selectedHotel = hotels.find((h) => h.id === batchForm.hotelId);
      const res = await roomsApi.batchGenerate({
        hotelId: batchForm.hotelId || selectedHotel?.id || "hotel-101",
        hotelName: selectedHotel?.name || batchForm.hotelName || "Main Property",
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
      setToastMsg(`⚡ Generated ${batchForm.totalRooms} rooms across ${batchForm.floors} floors!`);
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      setToastMsg(`❌ ${err?.response?.data?.message || err.message || "Failed to auto-generate rooms"}`);
      setTimeout(() => setToastMsg(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRooms = rooms.filter((room) => {
    const statusMatch = filterStatus === "all" || room.status === filterStatus;
    const floorMatch = filterFloor === "all" || room.floor.toString() === filterFloor;
    return statusMatch && floorMatch;
  });

  const availableFloors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b);

  const getStatusColor = (status: Room["status"]) => {
    switch (status) {
      case "available":
        return "bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-400";
      case "occupied":
        return "bg-rose-50 border-rose-200 text-rose-700 hover:border-rose-400";
      case "dirty":
        return "bg-amber-50 border-amber-200 text-amber-700 hover:border-amber-400";
      case "out_of_order":
        return "bg-gray-100 border-gray-300 text-gray-700 hover:border-gray-400";
    }
  };

  const getStatusBadge = (status: Room["status"]) => {
    switch (status) {
      case "available":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Available</span>;
      case "occupied":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">Occupied</span>;
      case "dirty":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">Housekeeping</span>;
      case "out_of_order":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-800">Out of Order</span>;
    }
  };

  const counts = {
    total: rooms.length,
    available: rooms.filter((r) => r.status === "available").length,
    occupied: rooms.filter((r) => r.status === "occupied").length,
    dirty: rooms.filter((r) => r.status === "dirty").length,
    out_of_order: rooms.filter((r) => r.status === "out_of_order").length,
  };

  return (
    <RoleGuard
      allowedRoles={["super_admin", "hotel_admin", "hotel_manager", "receptionist", "housekeeping"]}
      moduleName="Interactive Room Map & Floorplan"
    >
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
            Interactive Room Map
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Real-time visual floor plan &amp; room management (Database Persisted)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManageRooms && (
            <>
              <Link
                href="/hotel-admin/rooms"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#D1D5DB] rounded text-[#374151] hover:bg-[#F3F4F6] text-[13px] font-semibold transition-colors"
              >
                <span>Hotel Admin Room Setup</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#6B7280]" />
              </Link>

              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D1D5DB] hover:bg-[#F3F4F6] text-[#111827] text-[13px] font-bold rounded shadow-2xs transition-colors cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>⚡ Auto-Generate</span>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Rooms</span>
              </button>
            </>
          )}

          <button
            onClick={loadData}
            title="Refresh database records"
            className="p-1.5 border border-[#D1D5DB] rounded text-[#374151] hover:bg-[#F3F4F6] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Toast Notice */}
      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[13px] px-4 py-2.5 rounded flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Room Map Metric Cards (Vibrant Reference Style - Red, Green, Orange, Cyan) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="relative overflow-hidden bg-[#E53935] hover:bg-[#D32F2F] p-6 rounded-xl text-white shadow-lg shadow-red-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                {counts.occupied}
              </div>
              <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                Occupied Rooms
              </div>
              <div className="text-[11px] text-white/75 font-medium">
                Live in-house guests
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
              <User className="w-7 h-7 stroke-[2]" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-[#43A047] hover:bg-[#388E3C] p-6 rounded-xl text-white shadow-lg shadow-green-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                {counts.available}
              </div>
              <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                Available Clean
              </div>
              <div className="text-[11px] text-white/75 font-medium">
                Ready for check-in
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
              <BedDouble className="w-7 h-7 stroke-[2]" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-[#FB8C00] hover:bg-[#F57C00] p-6 rounded-xl text-white shadow-lg shadow-orange-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                {counts.dirty}
              </div>
              <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                Dirty / Turnover
              </div>
              <div className="text-[11px] text-white/75 font-medium">
                In housekeeping queue
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
              <Sparkles className="w-7 h-7 stroke-[2]" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-[#00ACC1] hover:bg-[#0097A7] p-6 rounded-xl text-white shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                {counts.total}
              </div>
              <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                Total Inventory
              </div>
              <div className="text-[11px] text-white/75 font-medium">
                {counts.out_of_order > 0 ? `${counts.out_of_order} maintenance` : "All rooms operational"}
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
              <Zap className="w-7 h-7 stroke-[2]" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls / Filter Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-[#E5E7EB] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#6B7280]" />
          <span className="text-[13px] font-bold text-[#374151]">Status:</span>
          {[
            { id: "all", label: "All" },
            { id: "available", label: "Available" },
            { id: "occupied", label: "Occupied" },
            { id: "dirty", label: "Dirty" },
            { id: "out_of_order", label: "Out of Order" },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterStatus(st.id)}
              className={`px-3 py-1 rounded text-[12px] font-semibold transition-colors cursor-pointer ${
                filterStatus === st.id
                  ? "bg-[#111827] text-white"
                  : "bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-[#374151]">Floor:</span>
          {["all", ...(availableFloors.length > 0 ? availableFloors.map(String) : ["1", "2", "3"])].map((floor) => (
            <button
              key={floor}
              onClick={() => setFilterFloor(floor)}
              className={`px-3 py-1 rounded text-[12px] font-semibold transition-colors cursor-pointer ${
                filterFloor === floor
                  ? "bg-[#EC3013] text-white"
                  : "bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]"
              }`}
            >
              {floor === "all" ? "All Floors" : `Floor ${floor}`}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Rooms + Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rooms Grid */}
        <div className="lg:col-span-2 space-y-6">
          {rooms.length === 0 ? (
            <div className="bg-white p-12 rounded-lg border border-[#E5E7EB] text-center space-y-4 shadow-xs">
              <BedDouble className="w-12 h-12 text-[#9CA3AF] mx-auto opacity-50" />
              <div className="space-y-1">
                <h3 className="text-[16px] font-bold text-[#111827]">No Rooms in Database</h3>
                <p className="text-[13px] text-[#6B7280] max-w-md mx-auto">
                  {canManageRooms
                    ? "No room units have been added for this property yet. Select a floor and choose the number of rooms to create."
                    : "No room units are currently configured for this property. Please contact your Hotel Administrator."}
                </p>
              </div>
              {canManageRooms && (
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
                    <span>⚡ Auto-Generate 12 Rooms</span>
                  </button>
                </div>
              )}
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="bg-white p-10 rounded-lg border border-[#E5E7EB] text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 bg-[#F3F4F6] rounded-full flex items-center justify-center mx-auto text-[#6B7280]">
                <Filter className="w-6 h-6 text-[#9CA3AF]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[16px] font-bold text-[#111827]">
                  No {filterStatus !== "all" ? (filterStatus === "out_of_order" ? "Out of Order" : filterStatus === "dirty" ? "Dirty / Turnover" : filterStatus === "occupied" ? "Occupied" : "Available") : ""} Rooms Found
                  {filterFloor !== "all" ? ` on Floor ${filterFloor}` : ""}
                </h3>
                <p className="text-[13px] text-[#6B7280] max-w-md mx-auto">
                  There are currently 0 rooms matching the &quot;{filterStatus.replace("_", " ")}&quot; status filter
                  {filterFloor !== "all" ? ` on Floor ${filterFloor}` : ""}. All {rooms.length} property rooms are currently in other statuses.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setFilterStatus("all");
                    setFilterFloor("all");
                  }}
                  className="px-4 py-2 bg-[#111827] hover:bg-[#1F2937] text-white text-[12px] font-bold rounded shadow-xs transition-colors cursor-pointer"
                >
                  Show All Rooms ({rooms.length})
                </button>
              </div>
            </div>
          ) : (
            (availableFloors.length > 0 ? availableFloors : [1, 2, 3, 4])
              .filter((floor) => filterFloor === "all" || filterFloor === floor.toString())
              .map((floor) => {
                const floorRooms = filteredRooms.filter((r) => r.floor === floor);
                if (floorRooms.length === 0) return null;

                return (
                  <div key={floor} className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
                      <h3 className="text-[14px] font-bold text-[#111827]">Floor {floor}</h3>
                      <span className="text-[11px] text-[#6B7280]">
                        {floorRooms.length} Rooms
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                      {floorRooms.map((room) => {
                        const isSelected = selectedRoom?.number === room.number;
                        return (
                          <button
                            key={room.number}
                            onClick={() => setSelectedRoom(room)}
                            className={`p-3 rounded-lg border-2 text-left transition-all relative ${getStatusColor(
                              room.status
                            )} ${isSelected ? "ring-2 ring-[#EC3013] shadow-md scale-105" : ""}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[14px] font-bold">{room.number}</span>
                              <BedDouble className="w-4 h-4 opacity-70" />
                            </div>
                            <div className="text-[10px] font-medium truncate opacity-80">
                              {room.type}
                            </div>
                            {room.guest && (
                              <div className="text-[10px] font-bold mt-2 truncate flex items-center gap-1">
                                <User className="w-3 h-3 shrink-0" />
                                <span className="truncate">{room.guest}</span>
                              </div>
                            )}
                            <div className="mt-2">{getStatusBadge(room.status)}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* Room Details Sidebar Panel */}
        <div>
          <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-xs sticky top-4 space-y-6">
            <h2 className="text-[16px] font-bold text-[#111827] pb-3 border-b border-[#E5E7EB]">
              Room Details &amp; Control
            </h2>

            {selectedRoom ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[24px] font-bold text-[#111827]">
                      Room {selectedRoom.number}
                    </span>
                    <span className="text-[12px] text-[#6B7280] block">
                      Floor {selectedRoom.floor} · {selectedRoom.type}
                    </span>
                  </div>
                  {getStatusBadge(selectedRoom.status)}
                </div>

                <div className="bg-[#F9FAFB] p-3.5 rounded border border-[#E5E7EB] space-y-2 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Nightly Rate:</span>
                    <span className="font-bold text-[#111827]">₹{selectedRoom.rate}/night</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Current Guest:</span>
                    <span className="font-bold text-[#111827]">{selectedRoom.guest || "None"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Assigned Cleaner:</span>
                    <span className="font-bold text-[#111827]">{selectedRoom.cleaner || "None"}</span>
                  </div>
                </div>

                {/* Quick Status Modifiers */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-[#6B7280] uppercase">
                    Update Room Status (Saves to MongoDB)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleStatusChange("available")}
                      className={`p-2 rounded text-[12px] font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                        selectedRoom.status === "available"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white border-[#D1D5DB] text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Available</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange("occupied")}
                      className={`p-2 rounded text-[12px] font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                        selectedRoom.status === "occupied"
                          ? "bg-rose-600 text-white border-rose-600"
                          : "bg-white border-[#D1D5DB] text-rose-700 hover:bg-rose-50"
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Occupied</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange("dirty")}
                      className={`p-2 rounded text-[12px] font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                        selectedRoom.status === "dirty"
                          ? "bg-amber-600 text-white border-amber-600"
                          : "bg-white border-[#D1D5DB] text-amber-700 hover:bg-amber-50"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Dirty (Turnover)</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange("out_of_order")}
                      className={`p-2 rounded text-[12px] font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                        selectedRoom.status === "out_of_order"
                          ? "bg-gray-700 text-white border-gray-700"
                          : "bg-white border-[#D1D5DB] text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Out of Order</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-[#9CA3AF]">
                <BedDouble className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-[13px] font-medium">Select a room from the grid to view details &amp; update status</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. CREATE ROOMS MODAL (1 Floor at a Time with Custom Rooms) */}
      {/* ------------------------------------------------------------- */}
      {canManageRooms && isAddModalOpen && (
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
                    Select a floor, set the number of rooms on that floor, and customize each room&apos;s number and price.
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

      {/* Auto-Generate Modal */}
      {canManageRooms && isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="text-[16px] font-bold text-[#111827]">Auto-Generate Rooms</h3>
              </div>
              <button onClick={() => setIsBatchModalOpen(false)} className="text-[#9CA3AF] hover:text-[#111827] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBatchGenerate} className="space-y-4 text-[13px]">
              {hotels.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Target Property
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
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  >
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.totalRooms || 12} rooms capacity)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Total Rooms
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    required
                    value={batchForm.totalRooms}
                    onChange={(e) => setBatchForm({ ...batchForm, totalRooms: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Floors
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={batchForm.floors}
                    onChange={(e) => setBatchForm({ ...batchForm, floors: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Base Rate (₹/night)
                </label>
                <input
                  type="number"
                  min="100"
                  required
                  value={batchForm.defaultRate}
                  onChange={(e) => setBatchForm({ ...batchForm, defaultRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 border border-[#D1D5DB] rounded text-[#374151] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-xs flex items-center gap-1.5"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>{isSubmitting ? "Generating..." : "Generate Now"}</span>
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
