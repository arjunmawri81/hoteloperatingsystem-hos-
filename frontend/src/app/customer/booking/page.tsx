"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { reservationsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Check, ShieldCheck, BedDouble, Calendar, ArrowRight, Loader2 } from "lucide-react";

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const initialHotel = searchParams.get("hotelName") || "Taj Palace New Delhi";

  const [selectedRoom, setSelectedRoom] = useState("Deluxe Room");
  const [guestName, setGuestName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");

  useEffect(() => {
    if (user) {
      if (!guestName && user.name) setGuestName(user.name);
      if (!email && user.email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
    }
  }, [user]);
  const [checkIn, setCheckIn] = useState(new Date().toISOString().split("T")[0]);
  const [checkOut, setCheckOut] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rooms = [
    {
      id: "Standard Room",
      name: "Standard Room",
      details: "City view · 28 m² · King bed · 2 guests",
      price: "₹2,500/night",
      rawPrice: 2500,
      roomNumber: "102",
      image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "Deluxe Room",
      name: "Deluxe Room",
      details: "Garden & Pool view · 36 m² · King bed · Balcony · 2 guests",
      price: "₹4,500/night",
      rawPrice: 4500,
      roomNumber: "204",
      image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "Executive Suite",
      name: "Executive Suite",
      details: "Panoramic view · 55 m² · Living area · Jacuzzi · 3 guests",
      price: "₹7,500/night",
      rawPrice: 7500,
      roomNumber: "304",
      image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80",
    },
  ];

  const currentRoom = rooms.find((r) => r.id === selectedRoom) || rooms[1];
  const nights = 3;
  const roomTotal = currentRoom.rawPrice * nights;
  const taxes = Math.round(roomTotal * 0.12);
  const total = roomTotal + taxes;

  const handleConfirmPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !phone) {
      setError("Please fill in your name and phone number");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const hotelIdParam = searchParams.get("hotelId");
      const reservation = await reservationsApi.create({
        guestName,
        guestEmail: email || "guest@lucknexa.com",
        guestPhone: phone,
        hotelName: initialHotel,
        hotelId: hotelIdParam || undefined,
        roomType: currentRoom.name,
        roomNumber: currentRoom.roomNumber,
        checkIn,
        checkOut,
        totalAmount: total,
        paidAmount: total,
        status: "confirmed",
        source: "Customer Portal",
      });

      // Trigger real-time system notification
      window.dispatchEvent(
        new CustomEvent("hos_notification", {
          detail: {
            title: "New Booking Created",
            description: `${guestName} booked ${currentRoom.name} at ${initialHotel} (₹${total.toLocaleString("en-IN")})`,
            category: "booking",
            href: "/operations/front-desk",
          },
        })
      );

      // Navigate to My Bookings with new booking state
      router.push(`/customer/my-bookings?booked=${reservation.id}`);
    } catch (err: any) {
      console.error("Booking error:", err);
      setError(err?.message || "Failed to confirm reservation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
          Complete Your Stay Reservation
        </h1>
        <p className="text-[13px] text-[#6B7280] mt-0.5">
          {initialHotel} — select your preferred room &amp; confirm guest details
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Room Selection & Guest Details (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Select Room */}
          <div>
            <h2 className="text-[15px] font-bold text-[#111827] mb-3">
              1. Select Room Category
            </h2>
            <div className="space-y-3">
              {rooms.map((room) => {
                const isSelected = selectedRoom === room.id;
                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoom(room.id)}
                    className={`p-3.5 sm:p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isSelected
                        ? "border-[#EC3013] bg-[#FFF5F5] shadow-xs"
                        : "border-[#E5E7EB] bg-white hover:border-[#D1D5DB]"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 w-full sm:w-auto">
                      <div className="w-20 h-16 sm:w-24 sm:h-18 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                        <img
                          src={room.image}
                          alt={room.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-bold text-[#111827]">
                            {room.name}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-[#EC3013] bg-red-100 px-2 py-0.5 rounded">
                              Selected
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] text-[#6B7280] mt-1">
                          {room.details}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 self-end sm:self-center">
                      <div className="text-[16px] font-black text-[#111827]">
                        {room.price}
                      </div>
                      <div className="text-[11px] text-[#9CA3AF]">excl. taxes</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guest Information */}
          <form id="booking-form" onSubmit={handleConfirmPay} className="space-y-4">
            <h2 className="text-[15px] font-bold text-[#111827]">
              2. Guest Contact &amp; Travel Dates
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eleanor Thornton"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Mobile Phone *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+1 555 0192"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.thornton@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Check-In
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#D1D5DB] rounded text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Check-Out
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#D1D5DB] rounded text-[13px]"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Price Summary Box (4 cols) */}
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-xs space-y-5 sticky top-20">
            <h3 className="text-[16px] font-bold text-[#111827]">
              Reservation Summary
            </h3>

            <div className="text-[13px] space-y-2.5 pb-4 border-b border-[#E5E7EB]">
              <div className="font-semibold text-[#111827]">{initialHotel}</div>
              <div className="text-[#6B7280]">{currentRoom.name} · {nights} Nights</div>
              <div className="text-[#6B7280]">{checkIn} → {checkOut}</div>
            </div>

            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between text-[#4B5563]">
                <span>{currentRoom.name} × {nights} nights</span>
                <span>₹{roomTotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-[#4B5563]">
                <span>Taxes &amp; Tourism Fees</span>
                <span>₹{taxes.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between font-black text-[16px] text-[#111827] pt-3 border-t border-[#E5E7EB]">
                <span>Total Due</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 p-2.5 rounded">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Instant Confirmation · Free cancellation up to 24h prior</span>
            </div>

            <button
              type="submit"
              form="booking-form"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#EC3013] hover:bg-[#D62839] disabled:opacity-50 text-white text-[14px] font-bold rounded shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Confirming...</span>
                </>
              ) : (
                <>
                  <span>Confirm &amp; Pay ₹{total.toLocaleString("en-IN")}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#9CA3AF]">Loading booking form...</div>}>
      <BookingContent />
    </Suspense>
  );
}
