"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { executiveBriefingApi } from "@/lib/api";
import {
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Mic,
  MicOff,
  Send,
  Building2,
  UtensilsCrossed,
  PartyPopper,
  Coins,
  Boxes,
  Sparkle,
  TrendingUp,
  X,
  Layers,
  ChevronRight,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Copy,
  Check,
  Headphones,
} from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  text: string;
  highlightKey?: string;
}

interface NarrationData {
  title: string;
  summary: string;
  chapters: Chapter[];
}

interface QAItem {
  question: string;
  answer: string;
  timestamp: string;
  category?: string;
}

export function AIBusinessAssistantModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();

  // Settings State
  const [language, setLanguage] = useState<"hinglish" | "hindi" | "english">("hinglish");
  const [period, setPeriod] = useState<"today" | "yesterday" | "mtd">("today");
  const [selectedHotelId, setSelectedHotelId] = useState<string>("all");

  // Data State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [narration, setNarration] = useState<NarrationData | null>(null);

  // Playback State
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);

  // Q&A / Interruption State
  const [questionInput, setQuestionInput] = useState<string>("");
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [qaHistory, setQaHistory] = useState<QAItem[]>([]);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // SpeechSynthesis Ref
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Synthesis & Recognition on client
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }

    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = language === "hindi" ? "hi-IN" : "en-IN";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setQuestionInput(transcript);
            handleAskQuestion(transcript);
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      stopSpeech();
    };
  }, [language]);

  // Load Snapshot and Narration when Modal Opens or Settings Change
  useEffect(() => {
    if (isOpen) {
      loadBriefingData();
    } else {
      stopSpeech();
    }
  }, [isOpen, period, language, selectedHotelId]);

  const loadBriefingData = async () => {
    setIsLoading(true);
    stopSpeech();
    try {
      const snapRes = await executiveBriefingApi.getSnapshot({
        period,
        hotelId: selectedHotelId !== "all" ? selectedHotelId : undefined,
      });
      const activeSnapshot = snapRes?.data || snapRes;
      setSnapshot(activeSnapshot);

      const narrRes = await executiveBriefingApi.getNarration({
        language,
        period,
        snapshot: activeSnapshot,
      });

      if (narrRes?.narration) {
        setNarration(narrRes.narration);
        setCurrentChapterIndex(0);
      }
    } catch (err) {
      console.error("Failed to load briefing:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const stopSpeech = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
  };

  const speakText = (text: string, onEndCallback?: () => void) => {
    if (!synthRef.current || isMuted) {
      setIsPlaying(true);
      return;
    }

    synthRef.current.cancel();

    // Clean markdown asterisks for natural voice
    const plainText = text.replace(/[*_#`]/g, "");

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    // Pick best matching Indian/Hindi voice
    const voices = synthRef.current.getVoices();
    let selectedVoice = null;
    if (language === "hindi") {
      selectedVoice = voices.find((v) => v.lang.includes("hi") || v.name.toLowerCase().includes("hindi"));
    } else {
      selectedVoice =
        voices.find((v) => v.lang === "en-IN" || v.name.toLowerCase().includes("india")) ||
        voices.find((v) => v.lang.startsWith("en"));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => {
      if (onEndCallback) {
        onEndCallback();
      } else {
        setIsPlaying(false);
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
    setIsPlaying(true);
  };

  // Play a specific chapter
  const playChapter = (index: number) => {
    if (!narration || !narration.chapters[index]) return;
    setCurrentChapterIndex(index);
    const chapter = narration.chapters[index];

    speakText(chapter.text, () => {
      // Auto-advance to next chapter if available
      if (index + 1 < narration.chapters.length) {
        playChapter(index + 1);
      } else {
        setIsPlaying(false);
      }
    });
  };

  // Toggle Play / Pause
  const togglePlayPause = () => {
    if (isPlaying) {
      if (synthRef.current?.speaking) {
        synthRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (synthRef.current?.paused) {
        synthRef.current.resume();
        setIsPlaying(true);
      } else {
        playChapter(currentChapterIndex);
      }
    }
  };

  const handleNextChapter = () => {
    if (!narration) return;
    if (currentChapterIndex + 1 < narration.chapters.length) {
      playChapter(currentChapterIndex + 1);
    }
  };

  const handlePrevChapter = () => {
    if (!narration) return;
    if (currentChapterIndex > 0) {
      playChapter(currentChapterIndex - 1);
    }
  };

  // Mic Interruption
  const toggleVoiceMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      stopSpeech();
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Speech recognition already active or unavailable:", err);
      }
    }
  };

  // Handle Question Submission (Voice or Text)
  const handleAskQuestion = async (queryText?: string) => {
    const q = (queryText || questionInput).trim();
    if (!q) return;

    // Pause ongoing audio briefing
    stopSpeech();
    setIsAsking(true);
    setQuestionInput("");

    try {
      const res = await executiveBriefingApi.askQuestion({
        question: q,
        language,
        snapshot,
        conversationHistory: qaHistory,
      });

      const newQa: QAItem = {
        question: q,
        answer: res.answer || "Answer processed.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        category: res.category,
      };

      setQaHistory((prev) => [newQa, ...prev]);

      // If user commanded to resume
      if (res.action === "resume_briefing") {
        speakText(res.answer, () => {
          playChapter(currentChapterIndex);
        });
      } else {
        // Speak answer and offer resume
        speakText(res.answer);
      }
    } catch (err) {
      console.error("Ask question error:", err);
    } finally {
      setIsAsking(false);
    }
  };

  const handleCopyTranscript = () => {
    if (!narration) return;
    const text = narration.chapters.map((c) => `### ${c.title}\n${c.text}`).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const activeChapter = narration?.chapters[currentChapterIndex];
  const highlightKey = activeChapter?.highlightKey || "revenue";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[90vh] max-h-[860px] bg-[#0A101F] text-slate-100 rounded-3xl border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col overflow-hidden font-sans">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-[#0E172A] border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  Executive AI Business Assistant
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  Voice Intelligence v2.0
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{snapshot?.meta?.orgName || user?.orgName || "Meridian Hotel Group"}</span>
                <span>•</span>
                <span className="text-cyan-400 font-medium">
                  {snapshot?.meta?.authorizedPropertiesCount || 1} Properties Scoped
                </span>
                <span>•</span>
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{snapshot?.meta?.formattedTime || "Live Snapshot"}</span>
              </p>
            </div>
          </div>

          {/* Quick Property Selector & Language & Close */}
          <div className="flex items-center gap-2.5">
            {/* Property / Hotel Selector Dropdown */}
            {snapshot?.meta?.hotelsList && snapshot.meta.hotelsList.length > 1 && (
              <div className="flex items-center bg-[#131E36] px-2 py-1 rounded-xl border border-cyan-500/30 text-xs">
                <Building2 className="w-3.5 h-3.5 text-cyan-400 mr-1.5 shrink-0" />
                <select
                  value={selectedHotelId}
                  onChange={(e) => setSelectedHotelId(e.target.value)}
                  className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-[#0B132B] text-white">
                    🏢 All Properties ({snapshot.meta.hotelsList.length})
                  </option>
                  {snapshot.meta.hotelsList.map((h: any) => (
                    <option key={h.id} value={h.id} className="bg-[#0B132B] text-white">
                      {h.name} {h.city ? `(${h.city})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Language Switcher */}
            <div className="flex items-center bg-[#131E36] p-1 rounded-xl border border-slate-700/60 text-xs font-semibold">
              <button
                onClick={() => setLanguage("hinglish")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  language === "hinglish"
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Hinglish
              </button>
              <button
                onClick={() => setLanguage("hindi")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  language === "hindi"
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLanguage("english")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  language === "english"
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                English
              </button>
            </div>

            {/* Time Period Filter */}
            <div className="flex items-center bg-[#131E36] p-1 rounded-xl border border-slate-700/60 text-xs font-medium">
              <button
                onClick={() => setPeriod("today")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  period === "today"
                    ? "bg-blue-600 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setPeriod("yesterday")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  period === "yesterday"
                    ? "bg-blue-600 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Yesterday
              </button>
              <button
                onClick={() => setPeriod("mtd")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  period === "mtd"
                    ? "bg-blue-600 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                MTD
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                stopSpeech();
                onClose();
              }}
              className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-all border border-slate-700/60 ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
          
          {/* Left Panel: Audio Player, Active Narration & Voice Controls (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between p-6 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-[#0B1224]/50 overflow-y-auto custom-scrollbar">
            
            {/* Active Chapter Header & Waveform */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-[11px] font-bold border border-blue-500/20 uppercase tracking-wider">
                    Chapter {currentChapterIndex + 1} of {narration?.chapters?.length || 1}
                  </span>
                  <span className="text-xs text-slate-400 font-medium truncate">
                    {activeChapter?.title || "Executive Overview"}
                  </span>
                </div>

                {/* Copy transcript */}
                <button
                  onClick={handleCopyTranscript}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-cyan-400 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-all"
                  title="Copy full briefing transcript"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy Script"}</span>
                </button>
              </div>

              {/* Glowing Dynamic Voice Waveform Box */}
              <div className="relative p-5 rounded-2xl bg-gradient-to-b from-[#111C38] to-[#0A1124] border border-cyan-500/20 shadow-inner overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                      {isPlaying ? "Narration Playing..." : isAsking ? "Thinking Answer..." : "Executive Briefing Ready"}
                    </span>
                  </div>

                  {/* Audio Waveform Bars */}
                  <div className="flex items-center gap-1 h-5">
                    {[16, 28, 44, 20, 36, 48, 24, 40, 18, 32].map((height, i) => (
                      <span
                        key={i}
                        className={`w-1 rounded-full bg-cyan-400 transition-all duration-300 ${
                          isPlaying ? "animate-pulse" : "opacity-40"
                        }`}
                        style={{
                          height: isPlaying ? `${Math.max(6, (height * (i % 3 + 1)) % 22)}px` : "6px",
                          animationDelay: `${i * 80}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Active Spoken Text Box */}
                <div className="min-h-[110px] text-sm text-slate-200 leading-relaxed font-medium">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-24 gap-3 text-cyan-400">
                      <Sparkles className="w-5 h-5 animate-spin" />
                      <span>Generating verified multi-module executive briefing...</span>
                    </div>
                  ) : activeChapter ? (
                    <p className="transition-all animate-in fade-in duration-300">
                      "{activeChapter.text}"
                    </p>
                  ) : (
                    <p className="text-slate-400">Click Play Briefing to begin your voice report.</p>
                  )}
                </div>

                {/* Progress bar across chapters */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-1.5">
                  {(narration?.chapters || []).map((ch, idx) => (
                    <button
                      key={ch.id}
                      onClick={() => playChapter(idx)}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        idx === currentChapterIndex
                          ? "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                          : idx < currentChapterIndex
                          ? "bg-blue-600"
                          : "bg-slate-800"
                      }`}
                      title={ch.title}
                    />
                  ))}
                </div>
              </div>

              {/* Playback Controls Toolbar */}
              <div className="flex items-center justify-between bg-[#0F182E] p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevChapter}
                    disabled={currentChapterIndex === 0}
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 transition-all"
                    title="Previous Chapter"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={togglePlayPause}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950" />}
                    <span>{isPlaying ? "Pause Briefing" : "Play Briefing"}</span>
                  </button>

                  <button
                    onClick={handleNextChapter}
                    disabled={!narration || currentChapterIndex === narration.chapters.length - 1}
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 transition-all"
                    title="Next Chapter"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Speed button */}
                  <button
                    onClick={() => {
                      const nextRate = speechRate === 1.0 ? 1.2 : speechRate === 1.2 ? 0.9 : 1.0;
                      setSpeechRate(nextRate);
                    }}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-400 transition-all"
                  >
                    {speechRate}x Speed
                  </button>

                  {/* Mute toggle */}
                  <button
                    onClick={() => {
                      setIsMuted(!isMuted);
                      if (!isMuted) synthRef.current?.cancel();
                    }}
                    className={`p-2 rounded-xl border transition-all ${
                      isMuted
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                        : "bg-slate-800 text-slate-300 border-slate-700/60"
                    }`}
                    title={isMuted ? "Unmute Voice" : "Mute Voice"}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Mid-Briefing Interruption / Q&A Box */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ask Instant Breakdown / Interrupt Briefing</span>
                </label>
                <span className="text-[11px] text-slate-500">Press Mic to speak or type</span>
              </div>

              {/* Quick sample chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] custom-scrollbar">
                {[
                  "Banquet ka balance kitna hai?",
                  "Cash Counter collection?",
                  "Low stock items list?",
                  "Dirty rooms kitne hain?",
                  "Resume Briefing",
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskQuestion(chip)}
                    className="shrink-0 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-slate-700/50 transition-all"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Interactive Input Bar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleVoiceMic}
                  className={`p-3 rounded-xl transition-all shadow-md ${
                    isListening
                      ? "bg-rose-500 text-white animate-bounce shadow-rose-500/50"
                      : "bg-slate-800 text-slate-300 hover:text-cyan-400 hover:bg-slate-700"
                  }`}
                  title={isListening ? "Listening... click to stop" : "Speak to AI"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
                  placeholder={
                    isListening
                      ? "Listening to your voice..."
                      : "Ask any breakdown: 'Banquet details', 'Top restaurant dish', etc."
                  }
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#0F172A] border border-slate-700/80 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                />

                <button
                  onClick={() => handleAskQuestion()}
                  disabled={isAsking || !questionInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                >
                  {isAsking ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Ask</span>
                </button>
              </div>

              {/* Recent Q&A Answers Carousel */}
              {qaHistory.length > 0 && (
                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300">
                    <span>Q: "{qaHistory[0].question}"</span>
                    <button
                      onClick={() => playChapter(currentChapterIndex)}
                      className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <span>▶️ Resume Briefing</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 leading-snug font-medium">
                    {qaHistory[0].answer}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Live Synchronized Verified Report Cards (5 Cols) */}
          <div className="lg:col-span-5 p-6 bg-[#080E1C] overflow-y-auto custom-scrollbar space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Verified Report Snapshot</span>
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                100% Deterministic Data
              </span>
            </div>

            {/* 1. Gross Revenue KPI Card */}
            <div
              className={`p-4 rounded-2xl transition-all duration-300 border ${
                highlightKey === "revenue"
                  ? "bg-gradient-to-br from-cyan-950/60 to-[#102038] border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)] scale-[1.02]"
                  : "bg-[#0E172A] border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Total Gross Revenue ({snapshot?.meta?.reportingPeriod || "Today"})
                </span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">
                {snapshot?.kpis?.formattedGrossRevenue || "₹0"}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <span>Rooms: ₹{snapshot?.rooms?.roomRevenue?.toLocaleString("en-IN") || 0}</span>
                <span>F&amp;B: ₹{snapshot?.restaurant?.revenue?.toLocaleString("en-IN") || 0}</span>
                <span>Banquet: ₹{snapshot?.banquet?.revenue?.toLocaleString("en-IN") || 0}</span>
              </div>
            </div>

            {/* 2. Hotel & Rooms Performance Card */}
            <div
              className={`p-4 rounded-2xl transition-all duration-300 border ${
                highlightKey === "rooms"
                  ? "bg-gradient-to-br from-blue-950/60 to-[#112344] border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)] scale-[1.02]"
                  : "bg-[#0E172A] border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-slate-300 uppercase">Rooms &amp; Occupancy</span>
                </div>
                <span className="text-sm font-black text-blue-400">
                  {snapshot?.rooms?.occupancyRate || "0%"} Occupancy
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Occupied</div>
                  <div className="font-bold text-white text-sm">
                    {snapshot?.rooms?.occupiedRooms || 0} / {snapshot?.rooms?.totalRooms || 0}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">ADR</div>
                  <div className="font-bold text-white text-sm">{snapshot?.kpis?.adr || "₹0"}</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Dirty / Cleaning</div>
                  <div className="font-bold text-amber-400 text-sm">
                    {snapshot?.rooms?.dirtyRooms || 0} rooms
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Restaurant & Banquet Cards */}
            <div
              className={`p-4 rounded-2xl transition-all duration-300 border ${
                highlightKey === "restaurant"
                  ? "bg-gradient-to-br from-amber-950/60 to-[#2c1d0c] border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] scale-[1.02]"
                  : "bg-[#0E172A] border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-300 uppercase">F&amp;B &amp; Banquet</span>
                </div>
                <span className="text-xs font-bold text-amber-400">
                  {snapshot?.restaurant?.activeKOTs || 0} Live KOTs
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Restaurant Revenue:</span>
                  <span className="font-bold text-white">{snapshot?.restaurant?.formattedRevenue || "₹0"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Banquet Pending Balance:</span>
                  <span className="font-bold text-rose-400">{snapshot?.banquet?.formattedBalanceDue || "₹0"}</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate pt-1 border-t border-slate-800">
                  🔥 Top Dish: <span className="text-amber-300 font-medium">{snapshot?.restaurant?.topItems?.[0] || "Buffet Meal"}</span>
                </div>
              </div>
            </div>

            {/* 4. Cash Counter & Collections */}
            <div
              className={`p-4 rounded-2xl transition-all duration-300 border ${
                highlightKey === "cash"
                  ? "bg-gradient-to-br from-emerald-950/60 to-[#0e271e] border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] scale-[1.02]"
                  : "bg-[#0E172A] border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-300 uppercase">Cash &amp; Finance</span>
                </div>
                <span className="text-xs font-bold text-emerald-400">
                  {snapshot?.cashCounter?.openShifts || 0} Open Shifts
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div>
                  <div className="text-slate-400 text-[10px]">Cash In Hand</div>
                  <div className="text-base font-black text-white">
                    {snapshot?.cashCounter?.formattedCashCollected || "₹0"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-[10px]">Audit Discrepancy</div>
                  <div className="text-sm font-bold text-emerald-400">
                    ₹{snapshot?.cashCounter?.discrepancy || 0} (OK)
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Inventory & Housekeeping Alerts */}
            <div
              className={`p-4 rounded-2xl transition-all duration-300 border ${
                highlightKey === "operations"
                  ? "bg-gradient-to-br from-rose-950/60 to-[#2c0f16] border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)] scale-[1.02]"
                  : "bg-[#0E172A] border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-slate-300 uppercase">Operations &amp; Alerts</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                  {snapshot?.inventory?.lowStockCount || 0} Low Stock
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="text-slate-400">
                  Critical Items:{" "}
                  <span className="text-rose-300 font-medium">
                    {snapshot?.inventory?.criticalAlertItems?.slice(0, 2).join(", ") || "None"}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Pending Cleaning Tasks:</span>
                  <span className="font-bold text-white">{snapshot?.housekeeping?.pendingTasks || 0}</span>
                </div>
              </div>
            </div>

            {/* 6. CRM & Leads Card */}
            <div
              className={`p-4 rounded-2xl transition-all duration-300 border ${
                highlightKey === "crm"
                  ? "bg-gradient-to-br from-purple-950/60 to-[#221035] border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)] scale-[1.02]"
                  : "bg-[#0E172A] border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-slate-300 uppercase">CRM &amp; Sales Pipeline</span>
                </div>
                <span className="text-xs font-bold text-purple-400">
                  {snapshot?.crm?.conversionRate || "0%"} Conversion
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">Active Pipeline Leads:</span>
                <span className="font-bold text-white">{snapshot?.crm?.totalLeads || 0} total ({snapshot?.crm?.hotLeads || 0} hot)</span>
              </div>
            </div>

            {/* 7. Multi-Property Breakdown Matrix */}
            {snapshot?.propertyBreakdowns && snapshot.propertyBreakdowns.length > 1 && (
              <div className="p-4 rounded-2xl bg-[#0D1527] border border-cyan-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-black uppercase text-cyan-300">Property Wise Breakdown</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Click property to ask</span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pt-1">
                  {snapshot.propertyBreakdowns.map((prop: any) => (
                    <button
                      key={prop.hotelId}
                      onClick={() => handleAskQuestion(`${prop.hotelName} ka report batao`)}
                      className="w-full p-2.5 rounded-xl bg-[#0A101F] hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                          {prop.hotelName} {prop.city ? `(${prop.city})` : ""}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {prop.occupiedRooms}/{prop.totalRooms} rooms occupied • {prop.dirtyRooms} dirty
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-emerald-400">{prop.occupancyRate}</div>
                        <div className="text-[10px] text-slate-400">{prop.formattedRevenue}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
