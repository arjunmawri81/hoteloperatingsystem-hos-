"use client";

import { useState, useEffect } from "react";
import { roomsApi } from "@/lib/api";
import {
  BedDouble,
  User,
  Sparkles,
  AlertCircle,
  Filter,
  CheckCircle2,
  RefreshCw,
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
}

export default function RoomMapPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterFloor, setFilterFloor] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const res = await roomsApi.getAll();
      setRooms(res);
      if (selectedRoom) {
        const refreshed = res.find((r: Room) => r.number === selectedRoom.number);
        if (refreshed) setSelectedRoom(refreshed);
      }
    } catch (e) {
      console.error("Error loading rooms from database:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleStatusChange = async (newStatus: Room["status"]) => {
    if (!selectedRoom) return;

    try {
      const updated = await roomsApi.updateStatus(selectedRoom.number, {
        status: newStatus,
        guest: newStatus === "available" ? "" : selectedRoom.guest,
      });

      setRooms(rooms.map((r) => (r.number === selectedRoom.number ? updated : r)));
      setSelectedRoom(updated);
      setToastMsg(`✅ Room ${selectedRoom.number} status updated to "${newStatus.replace("_", " ")}" in database`);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRooms = rooms.filter((room) => {
    const statusMatch = filterStatus === "all" || room.status === filterStatus;
    const floorMatch = filterFloor === "all" || room.floor.toString() === filterFloor;
    return statusMatch && floorMatch;
  });

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

        <button
          onClick={loadRooms}
          title="Refresh database records"
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 border border-[#D1D5DB] rounded text-[#374151] hover:bg-[#F3F4F6] text-[13px] font-semibold transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* Toast Notice */}
      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[13px] px-4 py-2.5 rounded flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] shadow-xs">
          <div className="text-[11px] font-bold text-[#6B7280] uppercase">Total Rooms</div>
          <div className="text-[20px] font-bold text-[#111827] mt-1">{counts.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] shadow-xs">
          <div className="text-[11px] font-bold text-emerald-600 uppercase">Available</div>
          <div className="text-[20px] font-bold text-emerald-700 mt-1">{counts.available}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] shadow-xs">
          <div className="text-[11px] font-bold text-rose-600 uppercase">Occupied</div>
          <div className="text-[20px] font-bold text-rose-700 mt-1">{counts.occupied}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] shadow-xs">
          <div className="text-[11px] font-bold text-amber-600 uppercase">Dirty / Turnover</div>
          <div className="text-[20px] font-bold text-amber-700 mt-1">{counts.dirty}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] shadow-xs">
          <div className="text-[11px] font-bold text-gray-500 uppercase">Maintenance</div>
          <div className="text-[20px] font-bold text-gray-700 mt-1">{counts.out_of_order}</div>
        </div>
      </div>

      {/* Controls / Filter Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-[#E5E7EB] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#6B7280]" />
          <span className="text-[13px] font-bold text-[#374151]">Status:</span>
          {["all", "available", "occupied", "dirty", "out_of_order"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded text-[12px] font-semibold capitalize transition-colors ${
                filterStatus === status
                  ? "bg-[#111827] text-white"
                  : "bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]"
              }`}
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-[#374151]">Floor:</span>
          {["all", "1", "2", "3", "4"].map((floor) => (
            <button
              key={floor}
              onClick={() => setFilterFloor(floor)}
              className={`px-3 py-1 rounded text-[12px] font-semibold transition-colors ${
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
          {[1, 2, 3, 4]
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
            })}
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
                    <span className="font-bold text-[#111827]">${selectedRoom.rate}/night</span>
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
    </div>
  );
}
