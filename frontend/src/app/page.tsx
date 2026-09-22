"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth, ROLE_ROUTE_MAP } from "@/context/AuthContext";
import { ArrowRight, ArrowUpRight, Menu, X, ChevronDown } from "lucide-react";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Platform", href: "#platform" },
  { label: "Guest Experience", href: "#guest" },
  { label: "Pricing", href: "#pricing" },
];

const MODULES = [
  {
    number: "01",
    title: "Front Desk & PMS",
    short: "Smart check-in under 30 seconds. Interactive room map, Aadhaar ID capture, and auto-calculated GST folio billing.",
    stat: "< 30s", statLabel: "Walk-in Check-in",
    accent: "bg-amber-500",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    link: "/operations/front-desk",
  },
  {
    number: "02",
    title: "AI Receptionist",
    short: "Generative AI that handles guest questions, room availability, room service, and escalates to your team when needed.",
    stat: "24/7", statLabel: "Always Available",
    accent: "bg-slate-900",
    image: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&w=800&q=80",
    link: "/ai-receptionist",
  },
  {
    number: "03",
    title: "Restaurant & QR Dining",
    short: "Table-specific QR codes, live Kitchen Display System with bell alerts, and direct room folio bill posting.",
    stat: "0", statLabel: "Paper KOTs",
    accent: "bg-orange-500",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
    link: "/operations/restaurant-pos",
  },
  {
    number: "04",
    title: "Banquet & Events",
    short: "End-to-end event hall booking, slot conflict protection, layout planning, and advance payment milestones.",
    stat: "0", statLabel: "Double Bookings",
    accent: "bg-stone-800",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80",
    link: "/operations/banquet",
  },
  {
    number: "05",
    title: "OTA Channel Manager",
    short: "2-way live sync across MakeMyTrip, Agoda, and Booking.com — rates, availability, and stop-sell in one click.",
    stat: "2-Way", statLabel: "Live OTA Sync",
    accent: "bg-yellow-500",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80",
    link: "/operations/channel-manager",
  },
  {
    number: "06",
    title: "Executive Analytics",
    short: "Real-time occupancy, RevPAR, ADR, and departmental revenue dashboards with one-click CSV export.",
    stat: "Live", statLabel: "RevPAR Tracking",
    accent: "bg-neutral-900",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    link: "/operations/reports",
  },
];

export default function LandingPage() {
  const { user, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const dashboardHref =
    isAuthenticated && user?.role
      ? ROLE_ROUTE_MAP[user.role] || "/operations"
      : "/login";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F4F5] text-[#111] font-sans antialiased">

      {/* ─── NAVBAR ─────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#F4F4F5]/95 shadow-[0_1px_0_rgba(0,0,0,0.07)] backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-[68px] flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center group-hover:bg-amber-400 transition-colors duration-200 shadow-sm">
              <img
                src="/lucknexa-icon.png"
                alt=""
                className="w-6 h-6 object-contain"
              />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-[#111]">
              LuckNexa
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} className="text-[13px] font-medium text-[#555] hover:text-[#111] transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Link href={dashboardHref} className="h-9 px-4 flex items-center gap-1.5 rounded-lg bg-[#111] hover:bg-[#222] text-white text-[13px] font-semibold transition-colors">
                Open Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="h-9 px-4 flex items-center text-[13px] font-semibold text-[#444] hover:text-[#111] transition-colors">
                  Sign in
                </Link>
                <Link href="/signup" className="h-9 px-4 flex items-center rounded-lg bg-[#111] hover:bg-[#222] text-white text-[13px] font-semibold transition-colors shadow-sm">
                  Get started →
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-[#555] rounded-lg hover:bg-black/5">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-black/5 px-5 py-5 space-y-1 shadow-lg">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}
                className="block py-2.5 text-[14px] font-medium text-[#444] hover:text-[#111]">
                {l.label}
              </a>
            ))}
            <div className="pt-4 flex flex-col gap-2 border-t border-black/5 mt-4">
              <Link href="/login" className="text-center py-2.5 text-[14px] font-semibold text-[#111] bg-black/5 rounded-lg">Sign in</Link>
              <Link href="/signup" className="text-center py-2.5 text-[14px] font-semibold text-white bg-[#111] rounded-lg">Get started</Link>
            </div>
          </div>
        )}
      </header>

      {/* ─── HERO ───────────────────────────────────────────────────────── */}
      <section id="home" className="pt-[68px] bg-[#F4F4F5]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] min-h-[calc(100vh-68px)]">

            {/* Left — Editorial copy */}
            <div className="flex flex-col justify-center space-y-8 py-16 lg:py-24 lg:pr-16">

              <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[#888]">
                Hotel &amp; Restaurant Operating System
              </p>

              <h1 className="text-[48px] sm:text-[60px] lg:text-[68px] leading-[1.02] font-black text-[#0e0e0e] tracking-[-2px]">
                Run your<br />
                entire hotel<br />
                <em className="not-italic text-amber-500">intelligently.</em>
              </h1>

              <p className="text-[15px] sm:text-[17px] text-[#555] leading-[1.65] max-w-[420px] font-normal">
                LuckNexa is the all-in-one platform for front desk, dining, events, housekeeping, and revenue — built for hoteliers who want to stop context-switching.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link href="/login" className="h-12 px-7 flex items-center gap-2 rounded-xl bg-[#111] hover:bg-[#222] text-white text-[14px] font-bold transition-all hover:scale-[1.02] shadow-lg shadow-black/10">
                  Open platform <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/menu" className="h-12 px-6 flex items-center rounded-xl border border-black/10 bg-white hover:bg-black/[0.03] text-[#111] text-[14px] font-semibold transition-all shadow-sm">
                  See QR dining demo
                </Link>
              </div>

              <div className="flex items-center gap-8 pt-2 border-t border-black/10">
                <div>
                  <div className="text-[26px] font-black text-[#111] tracking-tight">30s</div>
                  <div className="text-[11px] text-[#888] font-medium mt-0.5">Walk-in check-in</div>
                </div>
                <div className="w-px h-8 bg-black/10" />
                <div>
                  <div className="text-[26px] font-black text-[#111] tracking-tight">24 / 7</div>
                  <div className="text-[11px] text-[#888] font-medium mt-0.5">AI guest support</div>
                </div>
                <div className="w-px h-8 bg-black/10" />
                <div>
                  <div className="text-[26px] font-black text-[#111] tracking-tight">0</div>
                  <div className="text-[11px] text-[#888] font-medium mt-0.5">Double bookings</div>
                </div>
              </div>
            </div>

            {/* Right — Amber panel */}
            <div className="hidden lg:flex bg-amber-400 flex-col justify-center items-center px-14 py-20 relative overflow-visible">

              <div className="relative w-full max-w-[300px]">
                <div className="rounded-[20px] overflow-hidden shadow-2xl shadow-black/25">
                  <img
                    src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=90"
                    alt="Luxury hotel room"
                    className="w-full aspect-[3/4] object-cover"
                  />
                  {/* Front Desk overlay card */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/96 backdrop-blur-sm rounded-xl p-3.5 shadow-lg">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#888]">Front Desk</span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        LIVE
                      </span>
                    </div>
                    <div className="text-[13px] font-bold text-[#111]">Room 304 — Checked In</div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[11px] text-[#666]">Rahul Sharma · 3 nights</span>
                      <span className="text-[12px] font-bold text-[#111]">₹13,500</span>
                    </div>
                  </div>
                </div>

                {/* AI Concierge card — top right */}
                <div
                  className="absolute rounded-[14px] p-3.5"
                  style={{
                    top: "-24px", right: "-52px", width: "178px",
                    background: "rgba(255,251,235,0.94)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    boxShadow: "0 4px 16px rgba(120,60,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)",
                    border: "1px solid rgba(217,168,60,0.22)",
                  }}
                >
                  <div className="text-[9px] uppercase tracking-[0.12em] font-bold text-amber-700/70 mb-1.5">AI Concierge</div>
                  <div className="text-[11.5px] font-semibold text-amber-950 leading-snug">"What's the Wi-Fi password?"</div>
                  <div className="mt-2 text-[10px] text-emerald-700 font-bold">→ Answered in 0.8s</div>
                </div>

                {/* OTA Sync card — bottom left */}
                <div
                  className="absolute rounded-[14px] px-3.5 py-3"
                  style={{
                    bottom: "-28px", left: "-52px", width: "196px",
                    background: "#78350f",
                    boxShadow: "0 4px 16px rgba(40,15,0,0.35), inset 0 1px 0 rgba(255,200,80,0.15)",
                    border: "1px solid rgba(255,180,50,0.12)",
                  }}
                >
                  <div className="text-[9px] uppercase tracking-[0.12em] font-bold text-amber-400/60 mb-1">OTA Sync</div>
                  <div className="text-[12px] font-bold text-amber-50 leading-snug">MakeMyTrip ↔ Updated</div>
                  <div className="text-[10px] text-amber-300 font-semibold mt-0.5">₹5,200 / night applied</div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── PLATFORM MODULES ───────────────────────────────────────────── */}
      <section id="platform" className="py-24 bg-white border-t border-black/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[#888] mb-3">Platform</p>
              <h2 className="text-[38px] sm:text-[48px] font-black text-[#0e0e0e] tracking-[-1.5px] leading-[1.1]">
                Every tool your<br />hotel actually needs.
              </h2>
            </div>
            <Link href="/login" className="flex items-center gap-2 text-[13px] font-semibold text-[#111] hover:text-amber-600 transition-colors group">
              Explore full platform
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULES.map((mod) => (
              <Link href={mod.link} key={mod.number}
                className="group relative block rounded-2xl overflow-hidden border border-black/8 hover:border-black/15 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
                style={{ minHeight: "280px" }}
              >
                {/* Background image */}
                <img
                  src={mod.image}
                  alt={mod.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Very light overlay at top, warm amber-dark at bottom */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/20 to-amber-950/80" />
                {/* Warm amber color cast — ties image to brand */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/8 to-transparent" />
                {/* Hover lift */}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />

                {/* Content — text on dark bottom */}
                <div className="relative z-10 p-7 flex flex-col h-full" style={{ minHeight: "280px" }}>
                  <div className="flex items-start justify-between mb-auto">
                    <span className="text-[11px] font-black tracking-widest text-white/70 uppercase bg-black/20 backdrop-blur-sm px-2 py-1 rounded-md">{mod.number}</span>
                    <ArrowUpRight className="w-4 h-4 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="mt-auto pt-5">
                    <h3 className="text-[20px] font-black text-white tracking-tight leading-snug mb-1.5 drop-shadow-sm">{mod.title}</h3>
                    <p className="text-[12.5px] text-white/80 leading-relaxed line-clamp-2">{mod.short}</p>
                    <div className="mt-4 pt-4 border-t border-white/20 flex items-end justify-between">
                      <div>
                        <div className="text-[26px] font-black text-white tracking-tight leading-none drop-shadow-sm">{mod.stat}</div>
                        <div className="text-[10.5px] text-white/70 font-medium mt-1">{mod.statLabel}</div>
                      </div>
                      <div className={`w-2.5 h-2.5 rounded-full ${mod.accent} ring-2 ring-white/30`} />
                    </div>
                  </div>
                </div>

              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* ─── GUEST EXPERIENCE ───────────────────────────────────────────── */}
      <section id="guest" className="py-24 bg-[#F4F4F5] overflow-hidden relative border-t border-black/5">

        <div className="max-w-6xl mx-auto px-5 sm:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            <div className="space-y-7">
              <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[#888]">Guest Experience</p>
              <h2 className="text-[38px] sm:text-[48px] font-black tracking-[-1.5px] leading-[1.1] text-[#0e0e0e]">
                Guests check in<br />before they<br />even <em className="not-italic text-amber-500">arrive.</em>
              </h2>
              <p className="text-[15px] text-[#555] leading-relaxed max-w-[400px]">
                Send a digital pre-check-in link via WhatsApp. Guests upload their ID, fill in arrival time, and sign a digital registration card — your team sees it in real-time.
              </p>
              <div className="space-y-3 pt-2">
                {["Aadhaar / Passport ID digital capture", "Digital signature registration card", "Real-time guest profile in front desk", "Zero paper. Zero queue."].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-[14px] text-[#444] font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 pt-4">
                <Link href="/customer/pre-checkin" className="h-11 px-6 flex items-center gap-2 rounded-xl bg-[#111] hover:bg-[#222] text-white text-[13px] font-bold transition-all shadow-sm">
                  Try digital pre-check-in <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/customer/ai-concierge" className="h-11 px-5 flex items-center text-[13px] font-semibold text-[#555] hover:text-[#111] border border-black/10 hover:border-black/20 rounded-xl bg-white transition-all">
                  AI Concierge demo
                </Link>
              </div>
            </div>

            {/* Chat mockup — light themed */}
            <div className="relative">
              <div className="bg-white rounded-2xl overflow-hidden border border-black/8 shadow-xl shadow-black/6">
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-black/6">
                  <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-[#111] text-[12px] font-black">AI</div>
                  <div>
                    <div className="text-[13px] font-bold text-[#111]">LuckNexa Concierge</div>
                    <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      Active now
                    </div>
                  </div>
                  {/* macOS dots */}
                  <div className="ml-auto flex gap-1.5">
                    {["#ff5f57", "#febc2e", "#28c840"].map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />)}
                  </div>
                </div>

                {/* Messages */}
                <div className="p-5 space-y-3.5 min-h-[260px] bg-[#F4F4F5]">
                  <div className="flex justify-end">
                    <div className="max-w-[75%] bg-amber-400 text-[#111] text-[13px] font-medium rounded-2xl rounded-tr-sm px-4 py-2.5">
                      What time is breakfast served?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[80%] bg-white text-[#333] text-[13px] rounded-2xl rounded-tl-sm px-4 py-2.5 border border-black/6 shadow-sm">
                      Good morning! Breakfast is served daily from <strong className="text-[#111]">7:00 AM to 10:30 AM</strong> at the All-Day Dining on Level 2. Would you like a table reservation?
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[75%] bg-amber-400 text-[#111] text-[13px] font-medium rounded-2xl rounded-tr-sm px-4 py-2.5">
                      Yes, for 2 people at 8am please.
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[80%] bg-white text-[#333] text-[13px] rounded-2xl rounded-tl-sm px-4 py-2.5 border border-black/6 shadow-sm">
                      Done! Table for 2 at 8:00 AM reserved for Room 304. Enjoy your stay, Mr. Sharma! 🎉
                    </div>
                  </div>
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-black/6 bg-white flex items-center gap-3">
                  <div className="flex-1 bg-[#F4F4F5] border border-black/8 rounded-xl px-4 py-2.5 text-[13px] text-[#bbb]">
                    Ask anything about your stay...
                  </div>
                  <button className="w-9 h-9 rounded-xl bg-amber-400 hover:bg-amber-500 flex items-center justify-center shrink-0 transition-colors">
                    <ArrowRight className="w-4 h-4 text-[#111]" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-amber-400 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,0,0,0.06),transparent_60%)]" />
        <div className="max-w-6xl mx-auto px-5 sm:px-8 relative text-center">
          <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-amber-900/60 mb-5">Ready to start?</p>
          <h2 className="text-[44px] sm:text-[60px] font-black text-[#111] tracking-[-2px] leading-[1.05] max-w-2xl mx-auto">
            Your hotel. Fully in control.
          </h2>
          <p className="mt-5 text-[16px] text-amber-950/70 max-w-lg mx-auto leading-relaxed">
            Set up your property in minutes. No long onboarding, no complex setup — just a smarter way to run hospitality.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="h-13 px-8 py-3.5 flex items-center gap-2 rounded-xl bg-[#111] hover:bg-[#222] text-white text-[15px] font-bold shadow-xl shadow-black/20 transition-all hover:scale-[1.02]">
              Get started free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="h-13 px-7 py-3.5 flex items-center rounded-xl border-2 border-black/20 hover:border-black/40 text-[#111] text-[15px] font-bold transition-all">
              Sign in to your account
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="bg-[#EDEDEE] border-t border-black/5 py-12">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">

            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center shadow-sm">
                  <img src="/lucknexa-icon.png" alt="" className="w-5 h-5 object-contain" />
                </div>
                <span className="text-[15px] font-bold text-[#111]">LuckNexa</span>
              </div>
              <p className="text-[12px] text-[#999] pl-10">Hotel &amp; Restaurant Operating System</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-12 gap-y-4">
              <div className="space-y-2">
                <div className="text-[11px] font-black uppercase tracking-widest text-[#aaa]">Operations</div>
                <Link href="/operations/front-desk" className="block text-[12px] text-[#666] hover:text-[#111] transition-colors">Front Desk</Link>
                <Link href="/operations/restaurant-pos" className="block text-[12px] text-[#666] hover:text-[#111] transition-colors">Restaurant POS</Link>
                <Link href="/operations/banquet" className="block text-[12px] text-[#666] hover:text-[#111] transition-colors">Banquet</Link>
              </div>
              <div className="space-y-2">
                <div className="text-[11px] font-black uppercase tracking-widest text-[#aaa]">Revenue</div>
                <Link href="/operations/channel-manager" className="block text-[12px] text-[#666] hover:text-[#111] transition-colors">OTA Sync</Link>
                <Link href="/operations/reports" className="block text-[12px] text-[#666] hover:text-[#111] transition-colors">Analytics</Link>
                <Link href="/ai-receptionist" className="block text-[12px] text-[#666] hover:text-[#111] transition-colors">AI Reception</Link>
              </div>
              <div className="space-y-2">
                <div className="text-[11px] font-black uppercase tracking-widest text-[#aaa]">Guests</div>
                <Link href="/menu" className="block text-[12px] text-[#666] hover:text-[#111] transition-colors">Digital QR Menu</Link>
                <Link href="/customer/pre-checkin" className="block text-[12px] text-[#666] hover:text-[#111] transition-colors">Pre Check-in</Link>
                <Link href="/customer/ai-concierge" className="block text-[12px] text-[#666] hover:text-[#111] transition-colors">AI Concierge</Link>
              </div>
              <div className="space-y-2">
                <div className="text-[11px] font-black uppercase tracking-widest text-[#aaa]">Account</div>
                <Link href="/login" className="block text-[12px] text-[#666] hover:text-[#111] transition-colors">Sign in</Link>
                <Link href="/signup" className="block text-[12px] text-[#666] hover:text-[#111] transition-colors">Sign up</Link>
                <Link href="/super-admin" className="block text-[12px] text-[#666] hover:text-[#111] transition-colors">Admin</Link>
              </div>
            </div>

          </div>
          <div className="mt-10 pt-6 border-t border-black/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-[11px] text-[#bbb]">© {new Date().getFullYear()} LuckNexa Hospitality Systems. All rights reserved.</span>
            <span className="text-[11px] text-[#bbb]">Built for modern hoteliers.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
