"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "@/components/layout/UserMenu";
import { GlobalSearchModal } from "@/components/layout/GlobalSearchModal";
import { NotificationPopover } from "@/components/layout/NotificationPopover";

import { RoleGuard } from "@/components/layout/RoleGuard";

export default function AIReceptionistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: "Live Conversation", href: "/ai-receptionist" },
    { name: "Knowledge Base", href: "/ai-receptionist/knowledge-base" },
    { name: "AI Lead Pipeline", href: "/ai-receptionist/leads" },
  ];

  const getCurrentTitle = () => {
    if (pathname.includes("/knowledge-base")) return "Knowledge Base";
    if (pathname.includes("/leads")) return "AI Lead Management & Calling";
    return "AI Receptionist — Live Conversations";
  };

  return (
    <RoleGuard
      allowedRoles={["super_admin", "hotel_admin", "ai_receptionist", "hotel_manager", "receptionist"]}
      moduleName="AI Receptionist Autonomous Console"
    >
      <div className="min-h-screen bg-[#FAFAFA] text-[#111827] flex font-sans antialiased selection:bg-red-500 selection:text-white">
      {/* Left Sidebar */}
      <aside className="w-60 bg-white border-r border-[#E5E7EB] flex flex-col justify-between shrink-0 min-h-screen">
        <div>
          {/* Sidebar Top Title */}
          <div className="px-5 py-4 border-b border-[#F3F4F6] flex items-center gap-3">
            <Link
              href="/"
              title="HOS Home"
              className="w-8 h-8 bg-[#EC3013] text-white flex items-center justify-center font-black text-xs rounded tracking-tighter shadow-xs hover:bg-[#D62839] transition-colors"
            >
              HOS
            </Link>
            <div>
              <h2 className="text-[12px] font-bold text-[#111827] uppercase tracking-wider">
                AI Receptionist
              </h2>
              <p className="text-[10px] text-[#9CA3AF]">Autonomous Agent</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/ai-receptionist"
                  ? pathname === "/ai-receptionist"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 text-[13px] font-semibold rounded transition-colors ${
                    isActive
                      ? "text-[#111827] bg-[#F3F4F6] border-l-2 border-[#EC3013]"
                      : "text-[#4B5563] hover:text-[#111827] hover:bg-[#F9FAFB]"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="px-6 py-5 border-t border-[#E5E7EB]">
          <div className="text-[12px] font-bold text-[#111827]">
            Meridian Hotels & Resorts
          </div>
          <div className="text-[11px] text-[#9CA3AF] mt-0.5">
            Hotel Operating System
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-14 bg-white border-b border-[#E5E7EB] px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[13px] text-[#4B5563]">
            <span>AI Receptionist</span>
            <span className="text-[#9CA3AF]">&gt;</span>
            <span className="font-semibold text-[#111827]">{getCurrentTitle()}</span>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-3">
            <GlobalSearchModal />
            <NotificationPopover />
            <div className="h-4 w-[1px] bg-[#E5E7EB]" />
            <UserMenu />
          </div>
        </header>

          {/* Page Content Body */}
          <main className="flex-1 p-6 sm:p-8">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
