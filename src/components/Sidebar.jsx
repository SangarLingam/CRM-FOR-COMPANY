"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard, Users, FolderOpen, FileText,
  CreditCard, UserCircle, LogOut, Home, BarChart2
} from "lucide-react";

const NAV = [
  { label:"Dashboard", href:"/dashboard",           icon:LayoutDashboard, roles:["super_admin","manager","sales","designer"] },
  { label:"Leads",     href:"/dashboard/leads",     icon:Users,           roles:["super_admin","manager","sales","designer"] },
  { label:"Projects",  href:"/dashboard/projects",  icon:FolderOpen,      roles:["super_admin","manager","sales","designer"] },
  { label:"Quotes",    href:"/dashboard/quotes",    icon:FileText,        roles:["super_admin","manager","designer"] },
  { label:"Payments",  href:"/dashboard/payments",  icon:CreditCard,      roles:["super_admin","manager","sales"] },
  { label:"Customers", href:"/dashboard/customers", icon:UserCircle,      roles:["super_admin","manager","sales"] },
  { label:"Reports",   href:"/dashboard/reports",   icon:BarChart2,       roles:["super_admin","manager"] },
  { label:"Team",      href:"/dashboard/team",      icon:Users,           roles:["super_admin","manager"] },
];

const ROLE_COLOR = { super_admin:"#C8974A", manager:"#8b5cf6", sales:"#0ea5e9", designer:"#10b981" };
const ROLE_LABEL = { super_admin:"Super Admin", manager:"Manager", sales:"Sales", designer:"Designer" };

export default function Sidebar() {

  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const navItems = NAV.filter(n => n.roles.includes(user.role));

  return (
    <aside
      className="fixed top-0 left-0 h-full flex flex-col z-30 w-[260px]"
      style={{ background:"#2C1A0E", borderRight:"1px solid rgba(255,255,255,0.06)" }}
    >

      {/* LOGO */}
      <div
        className="px-5 py-5 flex items-center gap-3"
        style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background:"linear-gradient(135deg,#C8974A,#D4A85A)" }}
        >
          <Home size={16} color="white"/>
        </div>

        <div>
          <p className="text-white font-semibold text-sm font-display leading-none">
            DesignCRM
          </p>
          <p className="text-slate-500 text-xs mt-0.5">
            Interior Studio
          </p>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">

        {navItems.map(({ label, href, icon:Icon }) => {

          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));

          return (

            <Link
              key={href}
              href={href}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${
                active
                  ? "text-[#FAF7F4] bg-gradient-to-r from-[#C8974A]/20 to-[#C8974A]/10 shadow-[0_0_0_1px_rgba(200,151,74,0.25)]"
                  : "text-[#C4A882] hover:text-[#FAF7F4] hover:bg-[#3D2410]"

              }`}
            >

              {/* ACTIVE INDICATOR */}
              {active && (
               <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r bg-[#C8974A] shadow-[0_0_6px_rgba(200,151,74,0.6)]"/>
              )}

              <Icon
                size={17}
                className={`transition-all duration-200 ${
                  active
                    ? "text-[#C8974A]"
                   : "group-hover:scale-110 group-hover:text-[#FAF7F4]"
                }`}
              />

              {label}

            </Link>

          );

        })}

      </nav>

      {/* USER SECTION */}
      <div
        className="px-4 py-4"
        style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}
      >

        <div className="flex items-center gap-3 mb-3">

          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
            style={{ background:ROLE_COLOR[user.role] }}
          >
            {user.name?.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">

            <p className="text-white text-sm font-medium truncate">
              {user.name}
            </p>

            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{
                background:`${ROLE_COLOR[user.role]}25`,
                color:ROLE_COLOR[user.role]
              }}
            >
              {ROLE_LABEL[user.role]}
            </span>

          </div>

        </div>

        {/* LOGOUT */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-sm transition-all duration-200"
        >
          <LogOut size={15}/>
          Sign out
        </button>

      </div>

    </aside>
  );
}