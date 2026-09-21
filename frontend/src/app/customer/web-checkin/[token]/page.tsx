"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { reservationsApi } from "@/lib/api";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Camera,
  Upload,
  User,
  CreditCard,
  Building2,
  Calendar,
  PenTool,
  QrCode,
  ArrowRight,
  Plus,
  Trash2,
  AlertCircle,
  FileCheck,
} from "lucide-react";

export default function WebCheckInGuestPage() {
  const params = useParams();
  const token = params?.token as string;

  const [isLoading, setIsLoading] = useState(true);
  const [reservation, setReservation] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [idType, setIdType] = useState("Aadhaar");
  const [idNumber, setIdNumber] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Male");
  const [address, setAddress] = useState("");
  const [estimatedArrival, setEstimatedArrival] = useState("14:00");
  const [specialRequests, setSpecialRequests] = useState("");

  // Co-guests
  const [coGuests, setCoGuests] = useState<{ name: string; age: number; idType: string; idNumber: string }[]>([]);

  // Payment preference
  const [paymentPref, setPaymentPref] = useState<"pay_at_hotel" | "partial_deposit" | "full_online">("pay_at_hotel");

  // AI OCR State
  const [isScanningAI, setIsScanningAI] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);

  // Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const res = await reservationsApi.getWebCheckInDetails(token);
        if (res && res.success && res.data) {
          setReservation(res.data);
          setGuestName(res.data.guestName || "");
          setGuestPhone(res.data.guestPhone || "");
          setGuestEmail(res.data.guestEmail || "");
          if (res.data.isPreCheckedIn) {
            setIsCompleted(true);
          }
        } else {
          setErrorMsg(res.message || "Invalid or expired check-in link.");
        }
      } catch (err: any) {
        setErrorMsg("Failed to load reservation details. The link may have expired.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [token]);

  // Digital Signature Canvas Drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111827";
    setIsDrawing(true);
    setHasSigned(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  // AI OCR Upload & Extract
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedDocName(file.name);
    setIsScanningAI(true);
    setAiSuccess(false);

    try {
      // Simulate reading data / image text
      const res = await reservationsApi.verifyIdDocument({
        fileName: file.name,
        preferredType: idType,
      });

      if (res && res.success && res.data) {
        if (res.data.idType) setIdType(res.data.idType);
        if (res.data.idNumber) setIdNumber(res.data.idNumber);
        if (res.data.dob) setDob(res.data.dob);
        if (res.data.gender) setGender(res.data.gender);
        if (res.data.address) setAddress(res.data.address);
        setAiSuccess(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanningAI(false);
    }
  };

  const addCoGuest = () => {
    setCoGuests([...coGuests, { name: "", age: 25, idType: "Aadhaar", idNumber: "" }]);
  };

  const removeCoGuest = (idx: number) => {
    setCoGuests(coGuests.filter((_, i) => i !== idx));
  };

  const updateCoGuest = (idx: number, field: string, value: any) => {
    const updated = [...coGuests];
    (updated[idx] as any)[field] = value;
    setCoGuests(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    let sigDataUrl = "";
    if (canvasRef.current && hasSigned) {
      sigDataUrl = canvasRef.current.toDataURL("image/png");
    }

    setIsSubmitting(true);
    try {
      const res = await reservationsApi.submitWebCheckIn(token, {
        idType,
        idNumber,
        idDocUrl: uploadedDocName || "digital_verified",
        signatureUrl: sigDataUrl,
        coGuests,
        paymentPreference: paymentPref,
        estimatedArrivalTime: estimatedArrival,
        specialRequests,
        autoCheckIn: true,
      });

      if (res && res.success) {
        setIsCompleted(true);
      } else {
        alert(res.message || "Failed to submit web check-in.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to submit web check-in. Please contact the hotel.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-300 text-[14px]">Loading your reservation details...</p>
      </div>
    );
  }

  if (errorMsg || !reservation) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-4 text-center">
        <div className="w-14 h-14 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold mb-1">Check-In Link Unavailable</h2>
        <p className="text-gray-400 text-[14px] max-w-sm mb-6">{errorMsg || "This link may have expired or is invalid."}</p>
        <p className="text-xs text-gray-500">Please contact the front desk team for assistance.</p>
      </div>
    );
  }

  // Completed State: Digital Fast-Track Check-In Pass
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 py-10 font-sans selection:bg-emerald-500 selection:text-white">
        <div className="max-w-md w-full bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Web Check-In Verified
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white mt-1">
              Key Ready at Front Desk!
            </h1>
            <p className="text-xs text-gray-400">
              Show this digital pass upon arrival for priority key handover.
            </p>
          </div>

          {/* Boarding Pass Card */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 space-y-3 font-mono text-[12px]">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className="text-gray-400">GUEST</span>
              <span className="font-bold text-white uppercase">{reservation.guestName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className="text-gray-400">HOTEL</span>
              <span className="font-bold text-white truncate max-w-[200px]">{reservation.hotelName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className="text-gray-400">ROOM / CATEGORY</span>
              <span className="font-bold text-emerald-400">
                {reservation.roomNumber ? `Room ${reservation.roomNumber}` : reservation.roomType}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className="text-gray-400">STAY DATES</span>
              <span className="font-bold text-white">{reservation.checkIn} → {reservation.checkOut}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">ID VERIFIED</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> AI Verified
              </span>
            </div>
          </div>

          {/* QR Code Graphic */}
          <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center text-slate-900 space-y-2">
            <QrCode className="w-28 h-28 text-slate-900" />
            <div className="text-[11px] font-bold tracking-wider font-mono">
              PASS: {reservation.id}
            </div>
          </div>

          <div className="text-center text-[12px] text-gray-400">
            Welcome to {reservation.hotelName}. No queues, no paperwork required!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-white flex flex-col items-center p-4 py-8 font-sans antialiased">
      <div className="max-w-lg w-full space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[12px] font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fast-Track Mobile Web Check-In</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {reservation.hotelName || "Hotel Web Check-In"}
          </h1>
          <p className="text-xs text-gray-400">
            Complete your arrival details in 2 minutes for zero-wait check-in.
          </p>
        </div>

        {/* Stay Summary Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex justify-between items-center text-[13px] border-b border-slate-800 pb-2.5">
            <div>
              <span className="text-gray-400 text-xs block">Guest Name</span>
              <span className="font-bold text-white">{reservation.guestName}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-400 text-xs block">Room Category</span>
              <span className="font-bold text-emerald-400">{reservation.roomType}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[12px] text-gray-300">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <span>In: <b>{reservation.checkIn}</b></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <span>Out: <b>{reservation.checkOut}</b></span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: AI Document Scanner */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-white">AI ID Verification (Zero Typing)</h3>
                  <p className="text-[11px] text-gray-400">Aadhaar, Passport, or Driving License</p>
                </div>
              </div>
              {aiSuccess && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Auto-Filled
                </span>
              )}
            </div>

            {/* Document Upload / Camera Trigger Box */}
            <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/60 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors group text-center space-y-2">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleDocumentUpload}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-gray-400 group-hover:text-emerald-400 transition-colors">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[13px] font-bold text-gray-200 group-hover:text-emerald-400 block">
                  {uploadedDocName ? `Uploaded: ${uploadedDocName}` : "Take Photo or Upload ID Proof"}
                </span>
                <span className="text-[11px] text-gray-500">
                  Click to capture from camera or choose photo from gallery
                </span>
              </div>
            </label>

            {isScanningAI && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-400 text-xs animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>AI is scanning document and extracting details...</span>
              </div>
            )}

            {/* Verified Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
              <div>
                <label className="block text-gray-400 font-semibold mb-1">ID Document Type</label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Aadhaar">Aadhaar Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">ID Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5482 9102 3841"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Date of Birth</label>
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-gray-400 font-semibold mb-1">Permanent Residential Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, State, PIN code"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Co-Guests */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-bold text-white">Co-Guests Traveling With You</h3>
                <p className="text-[11px] text-gray-400">Add family or accompanying guest details</p>
              </div>
              <button
                type="button"
                onClick={addCoGuest}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-gray-200 rounded border border-slate-700 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add Guest
              </button>
            </div>

            {coGuests.map((cg, idx) => (
              <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-[12px]">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-400">Guest #{idx + 2}</span>
                  <button type="button" onClick={() => removeCoGuest(idx)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={cg.name}
                    onChange={(e) => updateCoGuest(idx, "name", e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  />
                  <input
                    type="number"
                    placeholder="Age"
                    value={cg.age}
                    onChange={(e) => updateCoGuest(idx, "age", Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Section 3: Arrival & Requests */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3 text-[12px]">
            <h3 className="text-[14px] font-bold text-white">Arrival &amp; Preferences</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 font-semibold mb-1">Estimated Arrival Time</label>
                <input
                  type="time"
                  value={estimatedArrival}
                  onChange={(e) => setEstimatedArrival(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-gray-400 font-semibold mb-1">Special Stay Requests</label>
                <input
                  type="text"
                  placeholder="e.g. Quiet room, extra towels, late arrival"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Payment Preference */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-[14px] font-bold text-white">Payment Preference</h3>
            <div className="space-y-2 text-[13px]">
              {[
                { id: "pay_at_hotel", title: "Pay at Hotel Counter", desc: "Pay via Cash, UPI, or Card during check-in" },
                { id: "partial_deposit", title: "Pay 50% Advance Deposit", desc: `Pay ₹${Math.round(reservation.totalAmount * 0.5).toLocaleString("en-IN")} online to guarantee room` },
                { id: "full_online", title: "Pay 100% Full Payment Online", desc: `Pay ₹${reservation.totalAmount?.toLocaleString("en-IN")} now for express key handover` },
              ].map((opt) => (
                <label
                  key={opt.id}
                  onClick={() => setPaymentPref(opt.id as any)}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    paymentPref === opt.id
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentPref"
                    checked={paymentPref === opt.id}
                    onChange={() => setPaymentPref(opt.id as any)}
                    className="mt-1 text-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-white block">{opt.title}</span>
                    <span className="text-[11px] text-gray-400">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Section 5: Digital Signature Pad */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-bold text-white">Guest Digital Signature</h3>
                <p className="text-[11px] text-gray-400">Sign with your finger or mouse below</p>
              </div>
              {hasSigned && (
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="border border-slate-700 rounded-xl bg-white overflow-hidden touch-none">
              <canvas
                ref={canvasRef}
                width={460}
                height={130}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-[130px] cursor-crosshair"
              />
            </div>
            <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>By submitting, you accept standard hotel policies &amp; verification terms.</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !idNumber}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-lg transition-all ${
              isSubmitting || !idNumber
                ? "bg-slate-800 text-gray-500 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black cursor-pointer shadow-emerald-500/20"
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Submitting Check-In...</span>
              </>
            ) : (
              <>
                <span>Complete Web Check-In &amp; Get Key Pass</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
