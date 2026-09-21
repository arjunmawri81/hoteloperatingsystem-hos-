"use client";

import { useState } from "react";
import { reservationsApi } from "@/lib/api";
import { ShieldCheck, Search, CheckCircle2, Clock, FileText, ArrowRight, Sparkles } from "lucide-react";

export default function PreCheckInPage() {
  const [bookingId, setBookingId] = useState("");
  const [reservation, setReservation] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [idType, setIdType] = useState("Aadhaar");
  const [idNumber, setIdNumber] = useState("");
  const [arrivalTime, setArrivalTime] = useState("14:00");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId.trim()) return;

    setIsSearching(true);
    setErrorMsg(null);
    try {
      const resv = await reservationsApi.getById(bookingId.trim());
      if (!resv) {
        setErrorMsg("Booking not found. Please verify your Booking ID (e.g. RES-101).");
        setReservation(null);
      } else {
        setReservation(resv);
      }
    } catch (err: any) {
      setErrorMsg("Failed to lookup reservation. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handlePreCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservation) return;

    setIsSubmitting(true);
    try {
      await reservationsApi.preCheckIn(reservation.id, {
        idType,
        idNumber,
        estimatedArrivalTime: arrivalTime,
        specialRequests,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Pre-check-in failed. Please contact front desk.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-[#EC3013]" /> Digital Pre-Check-In
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Skip the front-desk paperwork! Submit your ID details in advance for express 10-second key collection.
        </p>
      </div>

      {isSuccess ? (
        <div className="bg-white border border-emerald-200 rounded-2xl p-8 shadow-sm text-center space-y-4 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Pre-Check-In Confirmed!</h2>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Thank you, <strong>{reservation.guestName}</strong>. Your ID has been submitted for{" "}
            <strong>Room {reservation.roomNumber} ({reservation.roomType})</strong>. Your key will be sanitized and waiting
            at the express counter upon your arrival.
          </p>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 max-w-xs mx-auto text-left text-xs space-y-1 font-mono">
            <div>Booking: #{reservation.id}</div>
            <div>Arrival Date: {reservation.checkIn}</div>
            <div>Estimated Time: {arrivalTime}</div>
            <div>ID Verified: {idType}</div>
          </div>
          <button
            onClick={() => {
              setIsSuccess(false);
              setReservation(null);
              setBookingId("");
            }}
            className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-lg text-xs"
          >
            Done
          </button>
        </div>
      ) : (
        <>
          {/* Step 1: Lookup Booking */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" /> Step 1: Enter Your Booking ID
            </h3>
            <form onSubmit={handleLookup} className="flex gap-3">
              <input
                type="text"
                required
                placeholder="e.g. RES-101"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-mono uppercase focus:outline-none focus:border-[#EC3013]"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-6 py-2.5 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSearching ? "Searching..." : "Find Booking"}
              </button>
            </form>

            {errorMsg && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                ⚠️ {errorMsg}
              </div>
            )}
          </div>

          {/* Step 2: Pre-Check-in Form */}
          {reservation && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-5 animate-in fade-in">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-sm text-gray-900">{reservation.guestName}</div>
                  <div className="text-gray-500">
                    Room {reservation.roomNumber} · {reservation.roomType}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{reservation.checkIn}</div>
                  <div className="text-emerald-700 font-semibold uppercase">{reservation.status}</div>
                </div>
              </div>

              <form onSubmit={handlePreCheckInSubmit} className="space-y-4 text-xs">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#EC3013]" /> Step 2: Guest ID & Arrival Details
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Government ID Type *</label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-xl bg-white text-xs"
                    >
                      <option value="Aadhaar">Aadhaar Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving License">Driving License</option>
                      <option value="Voter ID">Voter ID Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">ID Card Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 5489 1234 8921"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Estimated Arrival Time *</label>
                  <input
                    type="time"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Special Preferences / Requests</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. High floor room, quiet corner, early luggage drop"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs"
                  ></textarea>
                </div>

                <div className="pt-3 border-t">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
                  >
                    <span>{isSubmitting ? "Submitting..." : "Complete Express Pre-Check-In"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
