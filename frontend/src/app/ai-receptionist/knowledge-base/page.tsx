"use client";

import { useState } from "react";
import { Plus, X, Search, CheckCircle2, BookOpen, Tag } from "lucide-react";

interface Article {
  id: string;
  category: string;
  question: string;
  answer: string;
  updated: string;
  status: "published" | "draft";
}

const INITIAL_ARTICLES: Article[] = [
  {
    id: "kb-1",
    category: "Check-In / Out",
    question: "What are the standard check-in and check-out times?",
    answer: "Standard check-in is at 2:00 PM and check-out is at 11:00 AM. Early check-in is subject to room availability on arrival.",
    updated: "Aug 10, 2026",
    status: "published",
  },
  {
    id: "kb-2",
    category: "Facilities",
    question: "Is there a fitness center and pool on-site?",
    answer: "Yes, our outdoor heated pool and 24/7 fitness center on the 4th floor are complimentary for all staying guests.",
    updated: "Aug 8, 2026",
    status: "published",
  },
  {
    id: "kb-3",
    category: "Policies",
    question: "What is the cancellation and refund policy?",
    answer: "Direct bookings can be cancelled free of charge up to 24 hours prior to the check-in date. Late cancellations incur a 1-night charge.",
    updated: "Aug 5, 2026",
    status: "published",
  },
  {
    id: "kb-4",
    category: "Dining",
    question: "What are the restaurant and room service hours?",
    answer: "Breakfast is served from 6:30 AM to 10:30 AM. In-room dining and bar service operate 24 hours daily.",
    updated: "Jul 30, 2026",
    status: "published",
  },
  {
    id: "kb-5",
    category: "Parking",
    question: "Is valet parking available?",
    answer: "Secure on-site valet parking is available for $25 per vehicle per night with unlimited in-and-out privileges.",
    updated: "Jul 22, 2026",
    status: "draft",
  },
];

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [newArticle, setNewArticle] = useState({
    category: "Facilities",
    question: "",
    answer: "",
    status: "published" as Article["status"],
  });

  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticle.question || !newArticle.answer) return;

    const created: Article = {
      id: `kb-${Date.now()}`,
      category: newArticle.category,
      question: newArticle.question,
      answer: newArticle.answer,
      updated: "Just now",
      status: newArticle.status,
    };

    setArticles([created, ...articles]);
    setIsModalOpen(false);
    setToastMsg(`✅ Article added to AI Knowledge Base`);
    setTimeout(() => setToastMsg(null), 3500);

    setNewArticle({
      category: "Facilities",
      question: "",
      answer: "",
      status: "published",
    });
  };

  const filteredArticles = articles.filter((a) => {
    const matchesSearch =
      a.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "all" || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", "Check-In / Out", "Facilities", "Policies", "Dining", "Parking"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
            AI Knowledge Base
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Hotel policies, FAQs, and property details used by the AI Concierge ({articles.length} articles)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Article</span>
        </button>
      </div>

      {/* Toast Notice */}
      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[13px] px-4 py-2.5 rounded flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="bg-white p-3.5 rounded-lg border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded text-[12px] font-semibold capitalize transition-colors ${
                categoryFilter === cat
                  ? "bg-[#111827] text-white"
                  : "text-[#4B5563] hover:bg-[#F3F4F6]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search Q&A or policy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013] w-full sm:w-64"
          />
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-[#F9FAFB]">
                <th className="py-3 px-4 font-bold">CATEGORY</th>
                <th className="py-3 px-4 font-bold">QUESTION &amp; AI ANSWER</th>
                <th className="py-3 px-4 font-bold">UPDATED</th>
                <th className="py-3 px-4 text-right font-bold">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#9CA3AF]">
                    No articles found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredArticles.map((art) => (
                  <tr key={art.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-4 px-4 font-semibold text-[#374151] whitespace-nowrap">
                      <span className="bg-[#F3F4F6] text-[#4B5563] px-2 py-0.5 rounded text-[11px] font-bold">
                        {art.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 space-y-1">
                      <div className="font-bold text-[#111827] text-[14px]">
                        {art.question}
                      </div>
                      <div className="text-[12px] text-[#4B5563] leading-relaxed">
                        {art.answer}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[#6B7280] whitespace-nowrap">
                      {art.updated}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {art.status === "published" ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Published
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded border border-[#E5E7EB]">
                          Draft
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Article Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-2xl max-w-lg w-full p-6 space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#EC3013]" />
                <h3 className="text-[16px] font-bold text-[#111827]">Add Knowledge Article</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-4 text-[13px]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={newArticle.category}
                    onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white"
                  >
                    <option value="Check-In / Out">Check-In / Out</option>
                    <option value="Facilities">Facilities</option>
                    <option value="Policies">Policies</option>
                    <option value="Dining">Dining</option>
                    <option value="Parking">Parking</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={newArticle.status}
                    onChange={(e) => setNewArticle({ ...newArticle, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Guest Question / Topic *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Can I store luggage before check-in?"
                  value={newArticle.question}
                  onChange={(e) => setNewArticle({ ...newArticle, question: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  AI Answer / Property Policy *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Yes, complimentary secure luggage storage is available at the concierge desk at any time."
                  value={newArticle.answer}
                  onChange={(e) => setNewArticle({ ...newArticle, answer: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#D1D5DB] rounded text-[#374151] font-semibold hover:bg-[#F3F4F6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded shadow-xs"
                >
                  Save to Knowledge Base
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
