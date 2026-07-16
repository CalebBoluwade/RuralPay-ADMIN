"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Store, Settings, LayoutDashboard, Globe, Key } from "lucide-react";

const NAV_ITEMS = [
  { href: "/config", icon: LayoutDashboard, label: "Overview" },
  { href: "/merchants", icon: Store, label: "Merchants" },
  { href: "/api-keys", icon: Key, label: "API Keys" },
  { href: "/tenants", icon: Users, label: "RuralPay App Tenants" },
  { href: "/config", icon: Settings, label: "Tenant App Config" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Globe size={18} className="text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight">RuralPayAdmin</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-indigo-500/10 text-indigo-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
            <span className="text-sm font-medium">AD</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Admin User</p>
            <p className="text-xs text-slate-400">Superuser</p>
          </div>
        </div>
      </div>
    </div>
  );
}
