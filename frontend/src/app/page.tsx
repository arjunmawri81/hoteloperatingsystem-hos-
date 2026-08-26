import Link from "next/link";

export default function HomePage() {
  const panels = [
    {
      title: "Super Admin",
      role: "Platform Owner",
      path: "/super-admin",
      desc: "Multi-tenant overview & organization management",
    },
    {
      title: "Hotel Admin",
      role: "Company / Chain Owner",
      path: "/hotel-admin",
      desc: "Portfolio metrics & property management",
    },
    {
      title: "Area Manager",
      role: "Regional Manager",
      path: "/area-manager",
      desc: "Regional cluster oversight & approvals",
    },
    {
      title: "Hotel Operations",
      role: "Front Desk & Staff PMS",
      path: "/operations",
      desc: "Arrivals, Room map, Housekeeping, POS, Billing",
    },
    {
      title: "Customer Portal",
      role: "Guest Booking",
      path: "/customer",
      desc: "Hotel discovery & direct room reservation",
    },
    {
      title: "AI Receptionist",
      role: "Guest Care",
      path: "/ai-receptionist",
      desc: "24/7 AI guest conversations & escalations",
    },
  ];

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-[#111827] flex flex-col justify-between p-8 sm:p-12 font-sans antialiased">
      {/* Top Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between pb-8 border-b border-[#E5E7EB]">
        <div>
          <div className="text-[22px] font-bold tracking-tight text-[#111827]">
            HOS
          </div>
          <p className="text-[12px] text-[#9CA3AF] tracking-wide mt-0.5">
            Hotel Operating System
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-[13px] font-bold text-[#111827] bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] rounded-sm transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-[13px] font-bold text-white bg-[#E63946] hover:bg-[#D62839] rounded-sm transition-colors shadow-sm"
          >
            Register Org
          </Link>
        </div>
      </div>

      {/* Main Grid of Panels */}
      <div className="max-w-5xl mx-auto w-full py-12">
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">
            Select a Panel
          </h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            Choose an interface to test live views
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {panels.map((p) => (
            <Link
              key={p.path}
              href={p.path}
              className="bg-white p-6 rounded-md border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-[#D1D5DB] hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="text-[11px] font-bold text-[#E63946] uppercase tracking-wider">
                  {p.role}
                </div>
                <h2 className="text-[18px] font-bold text-[#111827] mt-2 group-hover:text-[#E63946] transition-colors">
                  {p.title}
                </h2>
                <p className="text-[13px] text-[#6B7280] mt-2 leading-relaxed">
                  {p.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#F3F4F6] flex items-center justify-between text-[12px] font-bold text-[#111827]">
                <span>Open Panel</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto w-full pt-8 border-t border-[#E5E7EB] text-center text-[12px] text-[#9CA3AF]">
        Meridian Hotels & Resorts · Hotel Operating System
      </div>
    </main>
  );
}
