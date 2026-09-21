"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { posApi } from "@/lib/api";
import { MenuItem } from "@/types";
import {
  Utensils,
  Plus,
  Minus,
  ShoppingBag,
  Clock,
  Sparkles,
  CheckCircle2,
  ChefHat,
  X,
  Send,
  Flame,
  AlertCircle,
} from "lucide-react";

function MenuContent() {
  const searchParams = useSearchParams();
  const tableParam = searchParams.get("table") || "T-05";

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<{ [id: string]: { item: MenuItem; quantity: number } }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cookingNotes, setCookingNotes] = useState("");
  const [guestName, setGuestName] = useState("");
  const [orderPlaced, setOrderPlaced] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadMenu() {
      try {
        const data = await posApi.getMenu();
        setMenuItems(data);
      } catch {
        // Fallback default mock items if backend offline
        setMenuItems([
          { name: "Paneer Tikka Angara", category: "Starters", price: 380, description: "Cottage cheese charred with spices in tandoor", isVeg: true, isAvailable: true, prepTimeMinutes: 15 },
          { name: "Murgh Malai Tikka", category: "Starters", price: 460, description: "Tender chicken morsels with cream & cheese", isVeg: false, isAvailable: true, prepTimeMinutes: 18 },
          { name: "Dal Makhani Heritage", category: "Main Course", price: 390, description: "Slow cooked black lentils with churned butter", isVeg: true, isAvailable: true, prepTimeMinutes: 10 },
          { name: "Butter Chicken Delhi Style", category: "Main Course", price: 540, description: "Smoked chicken in rich satin tomato gravy", isVeg: false, isAvailable: true, prepTimeMinutes: 20 },
          { name: "Garlic Butter Naan", category: "Breads & Rice", price: 95, description: "Clay oven leavened bread brushed with garlic butter", isVeg: true, isAvailable: true, prepTimeMinutes: 8 },
          { name: "Dum Gosht Awadhi Biryani", category: "Main Course", price: 620, description: "Fragrant rice layered with spiced mutton & saffron", isVeg: false, isAvailable: true, prepTimeMinutes: 22 },
          { name: "Classic Tiramisu", category: "Desserts", price: 320, description: "Espresso soaked biscuits with mascarpone cream", isVeg: true, isAvailable: true, prepTimeMinutes: 5 },
          { name: "Fresh Mint Mojito", category: "Beverages", price: 210, description: "Crushed mint, fresh lime & sparkling soda", isVeg: true, isAvailable: true, prepTimeMinutes: 5 },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    loadMenu();
  }, []);

  const categories = ["All", ...Array.from(new Set(menuItems.map((m) => m.category).filter(Boolean)))];

  const filteredItems = menuItems.filter((item) => {
    if (!item) return false;
    if (selectedCategory === "All") return true;
    return String(item.category || "").toLowerCase() === selectedCategory.toLowerCase();
  });

  const addToCart = (item: MenuItem) => {
    const key = item._id || item.id || item.name;
    setCart((prev) => {
      const current = prev[key]?.quantity || 0;
      return { ...prev, [key]: { item, quantity: current + 1 } };
    });
  };

  const removeFromCart = (item: MenuItem) => {
    const key = item._id || item.id || item.name;
    setCart((prev) => {
      const current = prev[key]?.quantity || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }
      return { ...prev, [key]: { item, quantity: current - 1 } };
    });
  };

  const totalItemsCount = Object.values(cart).reduce((sum, entry) => sum + entry.quantity, 0);
  const totalAmount = Object.values(cart).reduce(
    (sum, entry) => sum + entry.item.price * entry.quantity,
    0
  );

  const handlePlaceOrder = async () => {
    if (totalItemsCount === 0) return;
    setIsSubmitting(true);
    try {
      const itemsPayload = Object.values(cart).map((entry) => ({
        name: entry.item.name,
        quantity: entry.quantity,
        instructions: cookingNotes || "",
      }));

      const payload = {
        tableNumber: tableParam,
        guestName: guestName.trim() || "Dine-in Guest",
        items: itemsPayload,
        total: totalAmount,
        status: "cooking",
      };

      const res = await posApi.createOrder(payload);
      setOrderPlaced({
        orderId: res?.data?.id || `ORD-${Date.now().toString().slice(-4)}`,
        kotNumber: res?.kot?.kotNumber || `KOT-${Math.floor(1000 + Math.random() * 900)}`,
        items: itemsPayload,
        total: totalAmount,
      });
      setCart({});
      setIsCartOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to submit order. Please alert the waiter.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            Order Sent to Kitchen
          </span>

          <h2 className="text-2xl font-black mt-3 text-white">Food is Being Prepared!</h2>
          <p className="text-sm text-slate-300 mt-1">
            Kitchen has received your ticket for <strong className="text-white">{tableParam}</strong>.
          </p>

          <div className="my-5 p-4 rounded-2xl bg-slate-900/80 border border-slate-700/60 text-left">
            <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span>Ticket: <strong className="text-orange-400">{orderPlaced.kotNumber}</strong></span>
              <span>Table: <strong className="text-white">{tableParam}</strong></span>
            </div>

            <div className="py-2.5 space-y-1.5">
              {orderPlaced.items.map((it: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-slate-200">
                    <strong className="text-orange-400 mr-2">{it.quantity}x</strong>
                    {it.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-slate-800 text-white">
              <span>Estimated Total:</span>
              <span className="text-emerald-400 font-mono">₹{orderPlaced.total}</span>
            </div>
          </div>

          {/* Live Kitchen Status Steps */}
          <div className="space-y-3 text-xs text-left mb-6">
            <div className="flex items-center gap-3 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Order Confirmed & Ticket Printed</span>
            </div>
            <div className="flex items-center gap-3 text-orange-400 font-medium animate-pulse">
              <Flame className="w-4 h-4" />
              <span>Chef is Cooking in Kitchen (Avg 15 mins)</span>
            </div>
            <div className="flex items-center gap-3 text-slate-500">
              <Clock className="w-4 h-4" />
              <span>Waiter will serve at Table {tableParam}</span>
            </div>
          </div>

          <button
            onClick={() => setOrderPlaced(null)}
            className="w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition"
          >
            Order More Items
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Mobile Restaurant Banner Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-base shadow-sm">
              🍽️
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                Meridian Grand Dining
              </h1>
              <span className="text-xs text-slate-500 font-medium">
                Contactless Digital Menu &amp; Ordering
              </span>
            </div>
          </div>

          {/* Table Indicator Badge */}
          <div className="px-3 py-1 rounded-xl bg-neutral-900 text-white flex flex-col items-center">
            <span className="text-[9px] font-bold text-amber-400 tracking-wider uppercase">
              TABLE
            </span>
            <span className="text-xs font-black text-amber-300">{tableParam}</span>
          </div>
        </div>

        {/* Category Scroll Bar */}
        <div className="max-w-xl mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-slate-100">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? "bg-orange-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Food Items List */}
      <main className="max-w-xl mx-auto px-4 py-4 space-y-3.5">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading gourmet menu...</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">No items in this category.</div>
        ) : (
          filteredItems.map((item) => {
            const key = item._id || item.id || item.name;
            const currentQty = cart[key]?.quantity || 0;

            return (
              <div
                key={key}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4"
              >
                {/* Dish Photo if available */}
                {item.image && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50 relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Veg / Non-Veg Icon */}
                    <span
                      className={`w-4 h-4 rounded-sm border flex items-center justify-center p-0.5 shrink-0 ${
                        item.isVeg ? "border-emerald-600" : "border-rose-600"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.isVeg ? "bg-emerald-600" : "bg-rose-600"
                        }`}
                      />
                    </span>
                    <h3 className="font-extrabold text-sm text-slate-900 truncate">{item.name}</h3>
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-2">{item.description}</p>
                  )}

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      ₹{item.price}
                    </span>
                    {item.prepTimeMinutes && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {item.prepTimeMinutes} mins
                      </span>
                    )}
                  </div>
                </div>

                {/* Add to Cart Controls */}
                <div className="flex flex-col items-end justify-center shrink-0">
                  {currentQty === 0 ? (
                    <button
                      onClick={() => addToCart(item)}
                      className="px-4 py-1.5 rounded-xl border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-black text-xs transition shadow-sm cursor-pointer"
                    >
                      ADD +
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl p-1">
                      <button
                        onClick={() => removeFromCart(item)}
                        className="w-7 h-7 rounded-lg bg-white border border-orange-200 text-orange-700 flex items-center justify-center hover:bg-orange-100 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-xs text-orange-950 px-1">{currentQty}</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center hover:bg-orange-500 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-3 inset-x-3 max-w-xl mx-auto z-40">
          <div className="bg-slate-900 text-white rounded-2xl p-3.5 shadow-2xl flex items-center justify-between border border-slate-700">
            <div>
              <span className="text-[11px] font-bold text-orange-400 block uppercase tracking-wider">
                {totalItemsCount} {totalItemsCount === 1 ? "Item" : "Items"} added
              </span>
              <span className="text-base font-black text-white font-mono">
                Total: ₹{totalAmount}
              </span>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-orange-900/50 transition active:scale-98"
            >
              <ShoppingBag className="w-4 h-4" />
              View Cart & Order
            </button>
          </div>
        </div>
      )}

      {/* Cart & Checkout Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Your Order</h3>
                <p className="text-xs text-slate-500">Table {tableParam}</p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {Object.values(cart).map((entry) => (
                <div
                  key={entry.item._id || entry.item.name}
                  className="flex items-center justify-between py-2 border-b border-slate-100"
                >
                  <div>
                    <span className="font-bold text-sm text-slate-800">{entry.item.name}</span>
                    <span className="text-xs text-slate-400 block">
                      ₹{entry.item.price} each
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeFromCart(entry.item)}
                      className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="font-bold text-xs">{entry.quantity}</span>
                    <button
                      onClick={() => addToCart(entry.item)}
                      className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Special Cooking Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={cookingNotes}
                  onChange={(e) => setCookingNotes(e.target.value)}
                  placeholder="e.g. Less spicy, extra butter, no onion"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Arjun Verma"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-sm font-black">
                <span>Grand Total:</span>
                <span className="text-emerald-700 font-mono text-base">₹{totalAmount}</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition disabled:opacity-50"
              >
                {isSubmitting ? "Sending to Kitchen..." : "Send Order to Kitchen 👨‍🍳"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading Menu...</div>}>
      <MenuContent />
    </Suspense>
  );
}
