"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BookingPage() {
  const router = useRouter();
  const [selectedRoom, setSelectedRoom] = useState("Deluxe Room");
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const rooms = [
    {
      id: "Standard Room",
      name: "Standard Room",
      details: "City view · 28 m² · 2 guests",
      price: "$142/night",
      rawPrice: 142,
    },
    {
      id: "Deluxe Room",
      name: "Deluxe Room",
      details: "River view · 34 m² · 2 guests",
      price: "$180/night",
      rawPrice: 180,
    },
    {
      id: "Suite",
      name: "Suite",
      details: "Corner suite · 52 m² · 3 guests",
      price: "$260/night",
      rawPrice: 260,
    },
  ];

  const currentRoom = rooms.find((r) => r.id === selectedRoom) || rooms[1];
  const nights = 3;
  const roomTotal = currentRoom.rawPrice * nights;
  const taxes = 64;
  const total = roomTotal + taxes;

  const handleConfirmPay = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/customer/my-bookings");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">
          Booking
        </h1>
        <p className="text-[14px] text-[#6B7280] mt-1">
          Select a room and confirm your stay
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Room Selection & Guest Details (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Select Room */}
          <div>
            <h2 className="text-[14px] font-bold text-[#111827] mb-3">
              Select Room
            </h2>
            <div className="space-y-4">
              {rooms.map((room) => {
                const isSelected = selectedRoom === room.id;
                return (
                  <div
                    key={room.id}
                    className={`bg-[#E5E7EB]/40 p-6 rounded-md transition-all text-center ${
                      isSelected
                        ? "border-2 border-[#E63946] bg-white shadow-xs"
                        : "border border-transparent hover:border-[#D1D5DB]"
                    }`}
                  >
                    <div className="text-[16px] font-bold text-[#111827]">
                      {room.name}
                    </div>
                    <div className="text-[12px] text-[#6B7280] mt-0.5">
                      {room.details}
                    </div>
                    <div className="text-[15px] font-bold text-[#111827] mt-3">
                      {room.price}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedRoom(room.id)}
                      className={`mt-3 px-6 py-1.5 text-[13px] font-bold rounded-sm border transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-white border-[#D1D5DB] text-[#111827]"
                          : "bg-white border-[#D1D5DB] text-[#111827] hover:bg-[#F9FAFB]"
                      }`}
                    >
                      {isSelected ? "Selected" : "Select"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guest Details */}
          <div>
            <h2 className="text-[14px] font-bold text-[#111827] mb-3">
              Guest Details
            </h2>
            <form onSubmit={handleConfirmPay} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] text-[#6B7280] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Guest name"
                    className="w-full px-3 py-2 bg-[#E5E7EB]/40 border border-[#D1D5DB] rounded-sm text-[13px] text-[#111827] focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-[#6B7280] mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 000 0000"
                    className="w-full px-3 py-2 bg-[#E5E7EB]/40 border border-[#D1D5DB] rounded-sm text-[13px] text-[#111827] focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] text-[#6B7280] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="guest@email.com"
                  className="w-full px-3 py-2 bg-[#E5E7EB]/40 border border-[#D1D5DB] rounded-sm text-[13px] text-[#111827] focus:outline-none focus:bg-white"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Price Summary (4 cols) */}
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-md border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-5">
            <h2 className="text-[16px] font-bold text-[#111827]">
              Price Summary
            </h2>

            <div className="space-y-3 text-[14px]">
              <div className="flex items-center justify-between text-[#4B5563]">
                <span>
                  {currentRoom.name} × {nights} nights
                </span>
                <span className="font-medium text-[#111827]">${roomTotal}</span>
              </div>
              <div className="flex items-center justify-between text-[#4B5563]">
                <span>Taxes & fees</span>
                <span className="font-medium text-[#111827]">${taxes}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
              <span className="text-[16px] font-bold text-[#111827]">Total</span>
              <span className="text-[18px] font-bold text-[#111827]">
                ${total}
              </span>
            </div>

            <button
              onClick={handleConfirmPay}
              className="w-full py-3 bg-[#E63946] hover:bg-[#D62839] text-white text-[13px] font-bold rounded-sm shadow-sm transition-colors cursor-pointer"
            >
              Confirm & Pay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
