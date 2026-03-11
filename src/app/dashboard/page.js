"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { dashboardAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, Spinner } from "@/components/ui";
import Link from "next/link";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { TrendingUp, FolderOpen, FileText, DollarSign,
         Users, Bell, ChevronRight, UserCircle, BarChart2 } from "lucide-react";

const fmt    = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n||0);
const fmtShort = n => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(0)}K` : `₹${n}`;

const COLORS = ["#C8974A","#8B6914","#D4A85A","#6B3F1F","#F0C060","#3D2410"];

const PIE_LABELS = {
  website:"Website", referral:"Referral",
  social_media:"Social Media", walk_in:"Walk In", other:"Other"
};

const PROJECT_COLORS = {
  planning:"#1565C0", design:"#76448A",
  in_progress:"#B7770D", completed:"#1E8449"
};

// ── Quick nav cards ────────────────────────────────────
const QUICK_NAV = [
  { label:"Leads",     href:"/dashboard/leads",     icon:Users,       color:"#C8974A", desc:"Manage enquiries" },
  { label:"Projects",  href:"/dashboard/projects",  icon:FolderOpen,  color:"#8B6914", desc:"Track progress" },
  { label:"Quotes",    href:"/dashboard/quotes",    icon:FileText,    color:"#D4A85A", desc:"Quotations" },
  { label:"Payments",  href:"/dashboard/payments",  icon:DollarSign,  color:"#6B3F1F", desc:"Collections" },
  { label:"Customers", href:"/dashboard/customers", icon:UserCircle,  color:"#B7770D", desc:"Client list" },
  { label:"Reports",   href:"/dashboard/reports",   icon:BarChart2,   color:"#76448A", desc:"Analytics" },
];

// ── Custom tooltip ─────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg p-3 border border-[#F0E8DC] text-sm">
      <p className="font-semibold text-[#2C1A0E] mb-1">{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{ color:p.color }} className="text-xs">
          {p.name}: {p.name==="Revenue" ? fmtShort(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

// ── Notification panel ─────────────────────────────────
function NotificationPanel({ notifications, onClose }) {
  const ref = useRef();
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const iconMap = { warning:"⚠️", info:"ℹ️", error:"🔴" };
  const bgMap   = { warning:"bg-yellow-50 border-yellow-200", info:"bg-blue-50 border-blue-200", error:"bg-red-50 border-red-200" };

  return (
    <div ref={ref}
      className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-[#F0E8DC] z-50 overflow-hidden modal-enter"
      style={{ boxShadow:"0 20px 60px rgba(44,26,14,0.2)" }}>
      <div className="px-4 py-3 border-b border-[#F0E8DC]"
        style={{ background:"linear-gradient(135deg,#FAF0E6,#FFF8F0)" }}>
        <p className="font-bold text-[#2C1A0E] font-display text-sm">Notifications</p>
      </div>
      {notifications.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-2xl mb-2">🎉</p>
          <p className="text-sm text-[#9C7A5A]">All caught up!</p>
        </div>
      ) : (
        <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
          {notifications.map((n,i) => (
            <div key={i} className={`flex items-start gap-2 p-3 rounded-xl border text-sm ${bgMap[n.type]}`}>
              <span>{iconMap[n.type]}</span>
              <p className="text-[#2C1A0E] leading-snug">{n.msg}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user }    = useAuth();
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [showNotif, setShowNotif] = useState(false);
  const [chartTab,  setChartTab]  = useState("revenue"); // revenue | leads

  const fetchDashboard = useCallback(async () => {
    try {
      const d = await dashboardAPI.getStats();
      setData(d);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    // Auto refresh every 60 seconds
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (loading) return <div className="p-8"><Spinner /></div>;
  if (!data)   return <div className="p-8 text-red-500">Failed to load dashboard.</div>;

  const isManager = ["super_admin","manager"].includes(user?.role);

  const stats = [
    { label:"Total Leads",     value:data.leads.total,     icon:<TrendingUp size={20}/>, color:"#C8974A", sub:`${data.leads.new} new today`,         href:"/dashboard/leads" },
    { label:"Active Projects", value:data.projects.active, icon:<FolderOpen size={20}/>, color:"#8B6914", sub:`${data.projects.completed} completed`, href:"/dashboard/projects" },
    { label:"Quotes Sent",     value:data.quotes.total,    icon:<FileText size={20}/>,   color:"#D4A85A", sub:`${data.quotes.accepted} accepted`,      href:"/dashboard/quotes" },
    { label:"Revenue",         value:fmt(data.revenue),    icon:<DollarSign size={20}/>, color:"#6B3F1F", sub:"total collected",                       href:"/dashboard/payments" },
  ];

  // Pie data for lead sources
  const pieData = (data.leadSources||[]).map(s => ({
    name: PIE_LABELS[s._id] || s._id,
    value: s.count,
  }));

  // Project donut
  const donutData = (data.projectStatus||[]).map(s => ({
    name:  s._id?.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase()),
    value: s.count,
    color: PROJECT_COLORS[s._id] || "#C8974A",
  }));

  const notifCount = data.notifications?.length || 0;

  return (
    <div className="p-8 page-enter">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#2C1A0E] font-display">
            Good {new Date().getHours()<12?"Morning":"Afternoon"}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-[#9C7A5A] mt-0.5">
            {new Date().toLocaleDateString("en-IN",{ weekday:"long", year:"numeric", month:"long", day:"numeric" })}
          </p>
        </div>

        {/* Notification bell */}
        <div className="relative">
          <button onClick={()=>setShowNotif(s=>!s)}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105"
            style={{ background:"linear-gradient(135deg,#FAF0E6,#F0E8DC)", border:"1px solid #E8DDD0" }}>
            <Bell size={18} color="#8B6914"/>
            {notifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold"
                style={{ background:"linear-gradient(135deg,#C8974A,#D4A85A)" }}>
                {notifCount}
              </span>
            )}
          </button>
          {showNotif && (
            <NotificationPanel
              notifications={data.notifications||[]}
              onClose={()=>setShowNotif(false)}
            />
          )}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8 stagger">
        {stats.map(s=>(
          <Link key={s.label} href={s.href}
            className="bg-white rounded-2xl p-5 border border-[#F0E8DC] shadow-sm card-hover relative overflow-hidden block">
            <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-10"
              style={{ background:s.color }}/>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white mb-3 flex-shrink-0"
              style={{ background:`linear-gradient(135deg,${s.color},${s.color}CC)`,
                boxShadow:`0 4px 12px ${s.color}40` }}>
              {s.icon}
            </div>
            <p className="text-2xl font-bold font-display text-[#2C1A0E]">{s.value}</p>
            <p className="text-sm text-[#9C7A5A] mt-0.5">{s.label}</p>
            <p className="text-xs text-[#C4A882] mt-0.5">{s.sub}</p>
            <ChevronRight size={14} className="absolute bottom-4 right-4" color="#C4A882"/>
          </Link>
        ))}
      </div>

      {/* ── Quick Navigation ── */}
      <div className="mb-8">
        <h2 className="font-bold text-[#2C1A0E] font-display mb-4">Quick Access</h2>
        <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
          {QUICK_NAV.filter(n => {
            if (!isManager && (n.label==="Reports")) return false;
            return true;
          }).map(n=>(
            <Link key={n.label} href={n.href}
              className="bg-white rounded-2xl p-4 border border-[#F0E8DC] shadow-sm card-hover text-center block">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                style={{ background:`${n.color}18`, color:n.color }}>
                <n.icon size={18}/>
              </div>
              <p className="text-xs font-bold text-[#2C1A0E]">{n.label}</p>
              <p className="text-xs text-[#C4A882] mt-0.5">{n.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">

        {/* Line/Bar chart — Revenue + Leads */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#F0E8DC] shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-[#2C1A0E] font-display">Performance — Last 6 Months</h2>
            <div className="flex gap-1 bg-[#FAF7F4] rounded-xl p-1">
              {["revenue","leads"].map(t=>(
                <button key={t} onClick={()=>setChartTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                    chartTab===t ? "text-white shadow-sm" : "text-[#9C7A5A]"
                  }`}
                  style={chartTab===t ? { background:"linear-gradient(135deg,#C8974A,#D4A85A)" } : {}}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            {chartTab === "revenue" ? (
              <LineChart data={data.chartData||[]} margin={{ top:5, right:10, left:0, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0E8DC"/>
                <XAxis dataKey="month" tick={{ fontSize:11, fill:"#9C7A5A" }} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v=>fmtShort(v)} tick={{ fontSize:10, fill:"#9C7A5A" }} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#C8974A" strokeWidth={2.5}
                  dot={{ fill:"#C8974A", r:4, strokeWidth:2, stroke:"white" }}
                  activeDot={{ r:6, fill:"#C8974A" }}/>
              </LineChart>
            ) : (
              <BarChart data={data.chartData||[]} margin={{ top:5, right:10, left:0, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0E8DC"/>
                <XAxis dataKey="month" tick={{ fontSize:11, fill:"#9C7A5A" }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:10, fill:"#9C7A5A" }} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="leads" name="Leads" radius={[6,6,0,0]}
                  fill="url(#barGrad)"/>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C8974A"/>
                    <stop offset="100%" stopColor="#D4A85A80"/>
                  </linearGradient>
                </defs>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Lead Source Pie Chart */}
        <div className="bg-white rounded-2xl p-6 border border-[#F0E8DC] shadow-sm">
          <h2 className="font-bold text-[#2C1A0E] font-display mb-4">Lead Sources</h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-[#C4A882] text-sm">No data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    dataKey="value" paddingAngle={3}>
                    {pieData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={(v,n)=>[v,n]}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.map((d,i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background:COLORS[i%COLORS.length] }}/>
                      <span className="text-[#5C3D1E]">{d.name}</span>
                    </div>
                    <span className="font-semibold text-[#2C1A0E]">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Recent Leads */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#F0E8DC] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0E8DC]"
            style={{ background:"linear-gradient(135deg,#FAF0E6,#FFF8F0)" }}>
            <h2 className="font-bold text-[#2C1A0E] font-display">Recent Leads</h2>
            <Link href="/dashboard/leads"
              className="text-xs font-semibold flex items-center gap-1 hover:underline"
              style={{ color:"#C8974A" }}>
              View all <ChevronRight size={12}/>
            </Link>
          </div>
          <div className="divide-y divide-[#FAF7F4]">
            {(data.recentLeads||[]).length === 0 && (
              <p className="text-center py-12 text-[#C4A882] text-sm">No leads yet</p>
            )}
            {(data.recentLeads||[]).map(lead=>(
              <div key={lead._id} className="flex items-center gap-3 px-6 py-3 hover:bg-[#FAF7F4] transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background:"linear-gradient(135deg,#C8974A,#D4A85A)" }}>
                  {lead.customerName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#2C1A0E] text-sm">{lead.customerName}</p>
                  <p className="text-[#9C7A5A] text-xs">{lead.phone}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full badge-${lead.status}`}>
                    {lead.status?.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase())}
                  </span>
                  <p className="text-xs text-[#C4A882] mt-0.5">
                    {new Date(lead.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Project Donut */}
          <div className="bg-white rounded-2xl p-5 border border-[#F0E8DC] shadow-sm">
            <h2 className="font-bold text-[#2C1A0E] font-display mb-4">Projects</h2>
            {donutData.length === 0 ? (
              <p className="text-center py-4 text-[#C4A882] text-sm">No projects yet</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={38} outerRadius={58}
                      dataKey="value" paddingAngle={3}>
                      {donutData.map((d,i) => <Cell key={i} fill={d.color}/>)}
                    </Pie>
                    <Tooltip formatter={(v,n)=>[v,n]}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-1">
                  {donutData.map((d,i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background:d.color }}/>
                        <span className="text-[#5C3D1E]">{d.name}</span>
                      </div>
                      <span className="font-bold text-[#2C1A0E]">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-2xl p-5 border border-[#F0E8DC] shadow-sm">
            <h2 className="font-bold text-[#2C1A0E] font-display mb-4">Activity Timeline</h2>
            {(data.activityTimeline||[]).length === 0 ? (
              <p className="text-center py-4 text-[#C4A882] text-sm">No activity yet</p>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-3 top-0 bottom-0 w-px" style={{ background:"#F0E8DC" }}/>
                <div className="space-y-4">
                  {(data.activityTimeline||[]).slice(0,6).map((a,i)=>(
                    <div key={i} className="flex gap-3 relative">
                      {/* Dot */}
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 z-10"
                        style={{ background:"linear-gradient(135deg,#C8974A,#D4A85A)", color:"white" }}>
                        ✦
                      </div>
                      <div className="flex-1 pb-1">
                        <p className="text-xs font-semibold text-[#2C1A0E] leading-snug">{a.action}</p>
                        <p className="text-xs text-[#9C7A5A]">{a.leadName}</p>
                        {a.note && <p className="text-xs text-[#C4A882] truncate">{a.note}</p>}
                        <p className="text-xs text-[#C4A882] mt-0.5">
                          {a.doneBy} · {new Date(a.doneAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>
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