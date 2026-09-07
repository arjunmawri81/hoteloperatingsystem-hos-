"use client";

import Link from "next/link";
import Image from "next/image";

interface BrandLogoProps {
  variant?: "compact" | "full" | "icon-only" | "emblem";
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  className?: string;
  subtitle?: string;
  dark?: boolean;
}

export function BrandLogo({
  variant = "compact",
  size = "md",
  href = "/",
  className = "",
  subtitle,
  dark = false,
}: BrandLogoProps) {
  const sizeMap = {
    sm: { icon: "w-8 h-8", text: "text-[13px]", sub: "text-[10px]" },
    md: { icon: "w-9 h-9", text: "text-[15px]", sub: "text-[11px]" },
    lg: { icon: "w-11 h-11", text: "text-[19px]", sub: "text-[12px]" },
    xl: { icon: "w-16 h-16", text: "text-[26px]", sub: "text-[14px]" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`flex items-center gap-2.5 group select-none ${className}`}>
      <div className={`relative ${currentSize.icon} shrink-0 rounded-xl overflow-hidden shadow-sm border border-slate-700/30 group-hover:scale-105 transition-transform bg-[#090D16] flex items-center justify-center p-0.5`}>
        <img
          src={variant === "emblem" ? "/lucknexa-emblem.png" : "/lucknexa-icon.png"}
          alt="LuckNexa"
          className="w-full h-full object-contain"
        />
      </div>

      {variant !== "icon-only" && (
        <div className="flex flex-col">
          <div className={`font-black tracking-tight leading-none ${currentSize.text} ${dark ? "text-white" : "text-[#111827]"}`}>
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent font-black">
              Luck
            </span>
            <span className={dark ? "text-white" : "text-[#111827]"}>Nexa</span>
          </div>
          <p className={`font-medium leading-tight mt-0.5 tracking-tight ${currentSize.sub} ${dark ? "text-gray-400" : "text-[#6B7280]"}`}>
            {subtitle || "AI-Powered Hotel OS"}
          </p>
        </div>
      )}
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} title="LuckNexa Home" className="inline-flex items-center">
      {content}
    </Link>
  );
}

export default BrandLogo;
