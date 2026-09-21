"use client";

import { useState, useEffect } from "react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import {
  Calendar,
  Users,
  Building2,
  DollarSign,
  Plus,
  Clock,
  Sparkles,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";

interface BanquetHall {
  _id: string;
  name: string;
  code: string;
  capacity: number;
  layout: string;
  basePricePerDay: number;
  image?: string;
  areaSqFt?: number;
  dimension?: string;
  facilities: string[];
  status: string;
}

interface EventBooking {
  _id: string;
  bookingId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  hallName: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  packageName: string;
  totalAmount: number;
  advancePaid: number;
  balanceDue: number;
  status: string;
}

export default function BanquetManagementPage() {
  const [halls, setHalls] = useState<BanquetHall[]>([]);
  const [bookings, setBookings] = useState<EventBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bookings" | "calendar" | "halls">("bookings");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Settle Payment State
  const [selectedBookingForSettle, setSelectedBookingForSettle] = useState<EventBooking | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleMode, setSettleMode] = useState<string>("UPI / Card");
  const [isSettling, setIsSettling] = useState(false);

  // New Booking Form State
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    hallName: "Grand Kohinoor Ballroom",
    eventType: "Corporate Conference",
    eventDate: new Date().toISOString().split("T")[0],
    startTime: "10:00 AM",
    endTime: "06:00 PM",
    guestCount: 100,
    packageName: "Executive Delegate Package",
    totalAmount: 75000,
    advancePaid: 25000,
  });

  // New Hall Form State
  const [isHallModalOpen, setIsHallModalOpen] = useState(false);
  const [hallFormData, setHallFormData] = useState({
    name: "",
    code: "",
    capacity: 200,
    layout: "Round Table",
    basePricePerDay: 50000,
    areaSqFt: 4500,
    dimension: "80ft x 55ft",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80",
    facilities: "Central AC, Stage, LED Video Wall, Sound System, Valet Parking",
    status: "available",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hallsRes, bookingsRes] = await Promise.all([
        fetch("http://localhost:5000/api/banquet/halls"),
        fetch("http://localhost:5000/api/banquet/bookings"),
      ]);

      if (hallsRes.ok) {
        const hData = await hallsRes.json();
        setHalls(hData.data || []);
      }
      if (bookingsRes.ok) {
        const bData = await bookingsRes.json();
        setBookings(bData.data || []);
      }
    } catch (err) {
      console.error("Error fetching banquet data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/banquet/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        setToast("Event booking confirmed successfully!");
        setIsModalOpen(false);
        fetchData();
        setTimeout(() => setToast(null), 4000);

        // Broadcast real-time system notification to top Bell icon
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("hos_notification", {
              detail: {
                title: "New Banquet Event Booked",
                description: `${formData.customerName} booked ${formData.hallName} (${formData.eventType}) on ${formData.eventDate}`,
                category: "banquet",
                href: "/operations/banquet",
              },
            })
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateHall = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const facilitiesArr = hallFormData.facilities.split(",").map((f) => f.trim()).filter(Boolean);
      const res = await fetch("http://localhost:5000/api/banquet/halls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...hallFormData,
          facilities: facilitiesArr,
        }),
      });
      if (res.ok) {
        setToast("New Banquet Hall / Venue added successfully!");
        setIsHallModalOpen(false);
        setHallFormData({
          name: "",
          code: "",
          capacity: 200,
          layout: "Round Table",
          basePricePerDay: 50000,
          areaSqFt: 4500,
          dimension: "80ft x 55ft",
          image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80",
          facilities: "Central AC, Stage, Projector, Sound System, Valet Parking",
          status: "available",
        });
        fetchData();
        setTimeout(() => setToast(null), 4000);
      }
    } catch (err) {
      console.error("Error creating hall:", err);
    }
  };

  const handleSettlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForSettle) return;
    try {
      setIsSettling(true);
      const bookingId = selectedBookingForSettle._id || selectedBookingForSettle.bookingId;
      const res = await fetch(`http://localhost:5000/api/banquet/bookings/${bookingId}/settle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountPaid: settleAmount, paymentMode: settleMode }),
      });
      if (res.ok) {
        setToast(`Payment of ₹${settleAmount.toLocaleString()} collected via ${settleMode} successfully!`);
        setSelectedBookingForSettle(null);
        fetchData();
        setTimeout(() => setToast(null), 4000);
      } else {
        const errData = await res.json().catch(() => ({}));
        setToast(errData.message || "Failed to record payment.");
        setTimeout(() => setToast(null), 4000);
      }
    } catch (err) {
      console.error("Error settling payment:", err);
      setToast("Network error: Could not reach backend server.");
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <RoleGuard
      allowedRoles={["super_admin", "hotel_admin", "hotel_manager", "banquet_staff"]}
      moduleName="Banquet & Event Management"
    >
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Toast Alert */}
      {toast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold text-sm">{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Banquet &amp; Event Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage luxury halls, corporate summits, weddings, and customized catering packages.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          Book Event / Hall
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("bookings")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "bookings"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Upcoming Event Bookings ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab("calendar")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "calendar"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Month Event Calendar
        </button>
        <button
          onClick={() => setActiveTab("halls")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "halls"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Halls &amp; Venues ({halls.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === "bookings" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {booking.bookingId}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                      booking.status === "confirmed"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mt-2">
                  {booking.customerName}
                </h3>
                <p className="text-xs text-amber-700 font-semibold mt-0.5">
                  {booking.eventType} · {booking.hallName}
                </p>

                <div className="mt-4 space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold">{booking.eventDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{booking.startTime} – {booking.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{booking.guestCount} Guests Expected</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Total Billing</p>
                  <p className="text-sm font-extrabold text-slate-900">
                    ₹{booking.totalAmount.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-emerald-600 font-medium">
                    Adv: ₹{booking.advancePaid.toLocaleString()}
                  </p>
                  <p className="text-xs font-bold text-rose-600">
                    Due: ₹{booking.balanceDue.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Settle Due Balance Action */}
              <div className="mt-3 pt-2">
                {booking.balanceDue > 0 ? (
                  <button
                    onClick={() => {
                      setSelectedBookingForSettle(booking);
                      setSettleAmount(booking.balanceDue);
                    }}
                    className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                  >
                    💳 Collect Due Balance (₹{booking.balanceDue.toLocaleString()})
                  </button>
                ) : (
                  <div className="w-full bg-emerald-50 text-emerald-700 text-xs font-bold py-2 rounded-xl text-center border border-emerald-200 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Fully Settled &amp; Paid
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MONTH CALENDAR VIEW */}
      {activeTab === "calendar" && (() => {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        const monthNames = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayIndex = new Date(year, month, 1).getDay();
        const totalSlots = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;
        const todayStr = new Date().toISOString().split("T")[0];

        const prevMonth = () => {
          setCalendarDate(new Date(year, month - 1, 1));
        };
        const nextMonth = () => {
          setCalendarDate(new Date(year, month + 1, 1));
        };

        return (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
            {/* Calendar Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <button
                  onClick={prevMonth}
                  className="p-2 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-600 transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-black text-slate-900 min-w-[200px] text-center sm:text-left">
                  {monthNames[month]} {year}
                </h2>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-600 transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Legend & Quick Actions */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Corporate Summit
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  Wedding / Banquet
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Confirmed &amp; Paid
                </span>
                <button
                  onClick={() => setCalendarDate(new Date())}
                  className="ml-2 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-2xl overflow-hidden border border-slate-200">
              {/* Day Headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 py-3 text-center text-xs font-extrabold text-slate-500 uppercase tracking-wider"
                >
                  {dayName}
                </div>
              ))}

              {/* Day Cells */}
              {Array.from({ length: totalSlots }).map((_, i) => {
                const dayNumber = i - firstDayIndex + 1;
                const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
                const dateStr = isCurrentMonth
                  ? `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`
                  : "";

                const dayBookings = isCurrentMonth
                  ? bookings.filter((b) => b.eventDate === dateStr)
                  : [];

                const isToday = isCurrentMonth && dateStr === todayStr;

                return (
                  <div
                    key={i}
                    className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${
                      isCurrentMonth
                        ? isToday
                          ? "bg-amber-50/60 font-medium"
                          : "bg-white hover:bg-slate-50/80"
                        : "bg-slate-50/50 text-slate-300"
                    }`}
                  >
                    {isCurrentMonth ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                              isToday
                                ? "bg-slate-900 text-white shadow-sm"
                                : "text-slate-700"
                            }`}
                          >
                            {dayNumber}
                          </span>
                          {dayBookings.length > 0 && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                              {dayBookings.length} Booked
                            </span>
                          )}
                        </div>

                        {/* Events list for this day */}
                        <div className="mt-1.5 space-y-1 flex-1 overflow-y-auto max-h-[85px]">
                          {dayBookings.map((b) => (
                            <div
                              key={b._id}
                              onClick={() => {
                                if (b.balanceDue > 0) {
                                  setSelectedBookingForSettle(b);
                                  setSettleAmount(b.balanceDue);
                                }
                              }}
                              className={`text-[11px] p-1.5 rounded-lg border leading-tight cursor-pointer transition-all hover:scale-[1.02] shadow-xs ${
                                b.eventType.includes("Wedding")
                                  ? "bg-rose-50 border-rose-200 text-rose-900"
                                  : b.eventType.includes("Corporate")
                                  ? "bg-amber-50 border-amber-200 text-amber-900"
                                  : "bg-indigo-50 border-indigo-200 text-indigo-900"
                              }`}
                              title={`${b.customerName} - ${b.hallName} (${b.startTime} to ${b.endTime})\nTotal: ₹${b.totalAmount} | Due: ₹${b.balanceDue}`}
                            >
                              <div className="font-extrabold truncate">{b.hallName.split(" ")[0]} · {b.customerName}</div>
                              <div className="text-[10px] opacity-80 truncate">{b.eventType}</div>
                            </div>
                          ))}
                        </div>

                        {/* Empty day quick book button on hover */}
                        {dayBookings.length === 0 && (
                          <button
                            onClick={() => {
                              setFormData({
                                ...formData,
                                eventDate: dateStr,
                              });
                              setIsModalOpen(true);
                            }}
                            className="text-[10px] text-slate-400 hover:text-slate-900 font-semibold text-center w-full py-0.5 rounded hover:bg-slate-100 transition-colors mt-auto opacity-0 hover:opacity-100"
                          >
                            + Book Event
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-slate-300"></span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {activeTab === "halls" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Venue &amp; Hall Inventory ({halls.length} Venues)</h3>
              <p className="text-xs text-slate-500">Add luxury banquet spaces, lawn gardens, and boardrooms.</p>
            </div>
            <button
              onClick={() => setIsHallModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              + Add New Hall / Venue
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {halls.map((hall) => {
              const fallbackImg = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80";
              const hallImg = hall.image || fallbackImg;

              return (
                <div
                  key={hall._id}
                  className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Real Venue Hero Image */}
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                      <img
                        src={hallImg}
                        alt={hall.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = fallbackImg;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

                      <div className="absolute top-3 left-3">
                        <span className="bg-slate-900/80 backdrop-blur-md text-white text-xs font-mono font-bold px-2.5 py-1 rounded-lg border border-white/20">
                          {hall.code}
                        </span>
                      </div>

                      <div className="absolute top-3 right-3">
                        <span className="text-xs font-bold text-emerald-900 bg-emerald-100/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-xs">
                          {hall.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h3 className="text-lg font-black leading-tight drop-shadow-sm">{hall.name}</h3>
                        <p className="text-xs text-slate-200 mt-0.5 flex items-center gap-2">
                          <span>👥 {hall.capacity} Guests</span>
                          <span>·</span>
                          <span>📐 {hall.areaSqFt ? `${hall.areaSqFt.toLocaleString()} sq.ft` : "4,500 sq.ft"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span>Layout: <strong className="text-slate-900">{hall.layout}</strong></span>
                        <span>Dimensions: <strong className="text-slate-900">{hall.dimension || "80ft x 55ft"}</strong></span>
                      </div>

                      {/* Facilities Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {hall.facilities.map((fac, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200/60"
                          >
                            ✓ {fac}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium">Base Venue Charge</span>
                      <p className="text-base font-black text-slate-900">
                        ₹{hall.basePricePerDay.toLocaleString()}
                        <span className="text-xs font-normal text-slate-500"> / day</span>
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setFormData({ ...formData, hallName: hall.name, totalAmount: hall.basePricePerDay });
                        setIsModalOpen(true);
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all hover:scale-105"
                    >
                      Book Hall
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
            <h2 className="text-lg font-black text-slate-900">New Banquet &amp; Event Booking</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter event details and guest requirements.</p>

            <form onSubmit={handleCreateBooking} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Customer / Organization Name</label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="e.g. Deloitte India or Sharma Wedding"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="+91 98..."
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    placeholder="contact@email.com"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Select Hall</label>
                  <select
                    value={formData.hallName}
                    onChange={(e) => setFormData({ ...formData, hallName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    {halls.map((h) => (
                      <option key={h._id} value={h.name}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Event Type</label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="Corporate Conference">Corporate Conference</option>
                    <option value="Wedding">Wedding</option>
                    <option value="Birthday / Anniversary">Birthday / Anniversary</option>
                    <option value="Exhibition">Exhibition</option>
                    <option value="Cocktail Dinner">Cocktail Dinner</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Total Bill (₹)</label>
                  <input
                    type="number"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Advance Paid (₹)</label>
                  <input
                    type="number"
                    value={formData.advancePaid}
                    onChange={(e) => setFormData({ ...formData, advancePaid: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-xl"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Settle Balance Modal */}
      {selectedBookingForSettle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400">{selectedBookingForSettle.bookingId}</span>
                <h2 className="text-lg font-black text-slate-900">Collect Due Payment</h2>
              </div>
              <button
                onClick={() => setSelectedBookingForSettle(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSettlePayment} className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Client Name:</span>
                  <span className="font-bold text-slate-800">{selectedBookingForSettle.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hall & Event:</span>
                  <span className="font-semibold text-slate-800">{selectedBookingForSettle.hallName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Event Bill:</span>
                  <span className="font-bold text-slate-900">₹{selectedBookingForSettle.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Advance Paid:</span>
                  <span className="font-bold text-emerald-600">₹{selectedBookingForSettle.advancePaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-1.5 mt-1 font-bold text-sm">
                  <span className="text-rose-600">Total Due Balance:</span>
                  <span className="text-rose-600">₹{selectedBookingForSettle.balanceDue.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Payment Mode</label>
                <select
                  value={settleMode}
                  onChange={(e) => setSettleMode(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="UPI / QR Code">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Credit / Debit Card">Credit / Debit Card</option>
                  <option value="Cash Counter">Cash Counter</option>
                  <option value="Net Banking / NEFT">Net Banking / NEFT</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Amount to Collect (₹)</label>
                <input
                  type="number"
                  required
                  max={selectedBookingForSettle.balanceDue}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForSettle(null)}
                  className="px-4 py-2 font-bold text-slate-500 hover:text-slate-800 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSettling || settleAmount <= 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md transition-all flex items-center gap-1.5"
                >
                  {isSettling ? "Recording..." : `Confirm Collect (₹${settleAmount.toLocaleString()})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add New Hall Modal */}
      {isHallModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 relative border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Add New Banquet Hall / Venue</h2>
                <p className="text-xs text-slate-500">Configure new luxury event hall, lawn, or meeting space.</p>
              </div>
              <button
                onClick={() => setIsHallModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHall} className="space-y-4 text-xs">
              {/* Photo Preset Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Select Luxury Venue Photo Preset</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  {[
                    { label: "🏛️ Grand Ballroom", url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80" },
                    { label: "🌿 Garden Lawn", url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80" },
                    { label: "💼 Boardroom", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80" },
                    { label: "🏊 Poolside Lawn", url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80" },
                  ].map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setHallFormData({ ...hallFormData, image: p.url })}
                      className={`px-2.5 py-2 rounded-xl border text-[11px] font-bold text-left transition-all ${
                        hallFormData.image === p.url
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <input
                  type="url"
                  placeholder="Or paste custom image URL (https://...)"
                  value={hallFormData.image}
                  onChange={(e) => setHallFormData({ ...hallFormData, image: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                />
              </div>

              {/* Photo Preview */}
              {hallFormData.image && (
                <div className="relative h-28 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={hallFormData.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                    Live Photo Preview
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hall / Venue Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Palm Garden Lawn"
                    value={hallFormData.name}
                    onChange={(e) => setHallFormData({ ...hallFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hall Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RPG-04"
                    value={hallFormData.code}
                    onChange={(e) => setHallFormData({ ...hallFormData, code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-medium uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Seating Layout</label>
                  <select
                    value={hallFormData.layout}
                    onChange={(e) => setHallFormData({ ...hallFormData, layout: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
                  >
                    <option value="Round Table">Round Table (Wedding/Banquet)</option>
                    <option value="Theater">Theater (Summit/Conference)</option>
                    <option value="U-Shape">U-Shape (Boardroom)</option>
                    <option value="Classroom">Classroom</option>
                    <option value="Cluster">Cluster Style</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Guest Capacity (Max Pax)</label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={hallFormData.capacity}
                    onChange={(e) => setHallFormData({ ...hallFormData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Base Venue Charge (₹ / day)</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={hallFormData.basePricePerDay}
                    onChange={(e) => setHallFormData({ ...hallFormData, basePricePerDay: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Area (sq.ft) &amp; Dimensions</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={hallFormData.areaSqFt}
                    onChange={(e) => setHallFormData({ ...hallFormData, areaSqFt: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Key Facilities (comma separated)</label>
                <input
                  type="text"
                  placeholder="Stage, LED Video Wall, Central AC, Valet Parking, Green Room"
                  value={hallFormData.facilities}
                  onChange={(e) => setHallFormData({ ...hallFormData, facilities: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsHallModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:text-slate-800 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md transition-all"
                >
                  Save Hall to Inventory
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
