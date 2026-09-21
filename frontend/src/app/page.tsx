"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, ROLE_ROUTE_MAP } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user?.role) {
      // If already logged in, go straight to their workspace
      router.replace(ROLE_ROUTE_MAP[user.role] || "/operations");
    } else {
      // If not logged in, go straight to Sign In
      router.replace("/login");
    }
  }, [isAuthenticated, user, isLoading, router]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center text-[#111827]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-[#E5E7EB] bg-white flex items-center justify-center p-1">
          <img src="/lucknexa-icon.png" alt="LuckNexa" className="w-full h-full object-contain" />
        </div>
        <div className="flex items-center gap-2 text-[13px] text-[#6B7280]">
          <Loader2 className="w-4 h-4 animate-spin text-[#EC3013]" />
          <span>Opening LuckNexa Sign In...</span>
        </div>
      </div>
    </div>
  );
}
