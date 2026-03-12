"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { PageHeader, Spinner } from "@/components/ui";
import { Download, TrendingUp, Users, DollarSign, FolderOpen } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

const C = {
  primary:"#C8974A", accent:"#D4A85A", gold:"#F0C060",
  darkest:"#2C1A0E", darker:"#3D2410",
  textFaint:"#C4A882", textLight:"#9C7A5A", cream:"#FAF7F4",
};

const fmt      = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n||0);
const fmtShort = n => n>=100000?`₹${(n/100000).toFixed(1)}L`:n>=1000?`₹${(n/1000).toFixed(0)}K`:`₹${n||0}`;

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 text-xs shadow-xl"
      style={{ background:C.darkest, border:`1px solid ${C.primary}40`, color:"white" }}>
      <p className="font-bold mb-1" style={{ color:C.gold }}>{label}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{ color:C.accent }}>
          {p.name}: {p.name==="Revenue" ? fmtShort(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const { user }     = useAuth();
  const { addToast } = useToast();
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [downloading,setDownloading]= useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  const fetchReports = useCallback(async () => {
    try {
      const res  = await fetch("/api/reports", { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      setData(json);
    } catch(e) { addToast(e.message, "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // ── CSV Download ──────────────────────────────────
  async function downloadSalesReport() {
    setDownloading(true);
    try {
      const res  = await fetch("/api/reports?type=sales_csv", {
        headers:{ Authorization:`Bearer ${token}` }
      });
      const json = await res.json();
      const rows = json.rows || [];

      const headers = [
        "Customer Name","Phone","Email","Status","Lead Source",
        "Assigned Sales","Assigned Designer","Budget","Quote Amount",
        "Paid Amount","Balance","Created Date"
      ];

      const csvRows = [
        headers.join(","),
        ...rows.map(r => [
          `"${r.customerName}"`, `"${r.phone}"`, `"${r.email}"`,
          r.status, r.source, `"${r.assignedSales}"`, `"${r.assignedDesigner}"`,
          r.budget, r.quoteAmount, r.paidAmount, r.balance, r.createdAt,
        ].join(","))
      ];

      const blob = new Blob([csvRows.join("\n")], { type:"text/csv" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `Sales_Report_${new Date().toLocaleDateString("en-IN").replace(/\//g,"-")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      addToast("Sales report downloaded! 📊", "success");
    } catch(e) {
      addToast(e.message, "error");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return <div className="p-8"><Spinner /></div>;
  if (!data)   return <div className="p-8 text-red-500">Failed to load reports.</div>;

  const { summary, salesPerf, designerPerf, monthly } = data;

  const summaryCards = [
    { label:"Total Leads",      value:summary.totalLeads,             icon:<TrendingUp size={18}/>, color:C.primary },
    { label:"Won Leads",        value:summary.wonLeads,               icon:<Users size={18}/>,      color:"#2D7A4F" },
    { label:"Conversion Rate",  value:`${summary.conversionRate}%`,   icon:<TrendingUp size={18}/>, color:C.accent },
    { label:"Total Revenue",    value:fmt(summary.totalRevenue),      icon:<DollarSign size={18}/>, color:C.gold },
    { label:"Active Projects",  value:summary.activeProjects,         icon:<FolderOpen size={18}/>, color:"#7B6BB5" },
    { label:"Total Projects",   value:summary.totalProjects,          icon:<FolderOpen size={18}/>, color:C.darker.replace("#","") ? C.primary : C.primary },
  ];

  return (
    <div className="p-8 page-enter" style={{ background:C.cream, minHeight:"100vh" }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color:C.darkest }}>Reports</h1>
          <p className="text-sm mt-0.5" style={{ color:C.textLight }}>Business analytics overview</p>
        </div>
        <button onClick={downloadSalesReport} disabled={downloading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
          style={{ background:`linear-gradient(135deg,${C.primary},${C.accent})`,
            boxShadow:`0 4px 15px ${C.primary}50` }}>
          <Download size={16}/>
          {downloading ? "Downloading..." : "Download Sales Report"}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {summaryCards.map(s=>(
          <div key={s.label} className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background:`linear-gradient(135deg,${C.darkest},${C.darker})`,
              border:`1px solid ${s.color}25` }}>
            <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full opacity-20"
              style={{ background:s.color }}/>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-white"
              style={{ background:`linear-gradient(135deg,${s.color},${s.color}BB)` }}>
              {s.icon}
            </div>
            <p className="text-2xl font-bold font-display" style={{ color:"white" }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color:`${s.color}CC` }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="rounded-2xl p-6"
          style={{ background:`linear-gradient(135deg,${C.darkest},${C.darker})`,
            border:`1px solid ${C.primary}25` }}>
          <h2 className="font-bold font-display mb-5" style={{ color:"white" }}>Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthly} margin={{ top:5, right:10, left:0, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,151,74,0.1)"/>
              <XAxis dataKey="month" tick={{ fontSize:11, fill:C.textFaint }} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={fmtShort} tick={{ fontSize:10, fill:C.textFaint }} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Line type="monotone" dataKey="revenue" name="Revenue"
                stroke={C.primary} strokeWidth={2.5}
                dot={{ fill:C.primary, r:4, stroke:C.darker, strokeWidth:2 }}
                activeDot={{ r:6, fill:C.gold }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Leads Chart */}
        <div className="rounded-2xl p-6"
          style={{ background:`linear-gradient(135deg,${C.darkest},${C.darker})`,
            border:`1px solid ${C.primary}25` }}>
          <h2 className="font-bold font-display mb-5" style={{ color:"white" }}>Monthly Leads</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly} margin={{ top:5, right:10, left:0, bottom:5 }}>
              <defs>
                <linearGradient id="rBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.primary}/>
                  <stop offset="100%" stopColor={`${C.primary}40`}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,151,74,0.1)"/>
              <XAxis dataKey="month" tick={{ fontSize:11, fill:C.textFaint }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10, fill:C.textFaint }} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Bar dataKey="leads" name="Leads" radius={[6,6,0,0]} fill="url(#rBarGrad)"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales Performance */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl overflow-hidden"
          style={{ background:`linear-gradient(135deg,${C.darkest},${C.darker})`,
            border:`1px solid ${C.primary}25` }}>
          <div className="px-6 py-4" style={{ borderBottom:`1px solid ${C.primary}20` }}>
            <h2 className="font-bold font-display" style={{ color:"white" }}>Sales Performance</h2>
          </div>
          {salesPerf.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color:C.textFaint }}>No sales data</p>
          ) : (
            <div className="divide-y" style={{ borderColor:`${C.primary}12` }}>
              {salesPerf.map((s,i)=>(
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background:`linear-gradient(135deg,${C.primary},${C.accent})` }}>
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color:"white" }}>{s.name}</p>
                    <p className="text-xs" style={{ color:C.textFaint }}>
                      {s.leads} leads · {s.won} won · {s.conversion}% conversion
                    </p>
                    <div className="w-full rounded-full mt-1.5" style={{ height:"4px", background:"rgba(255,255,255,0.08)" }}>
                      <div className="rounded-full h-full"
                        style={{ width:`${s.conversion}%`, background:`linear-gradient(90deg,${C.primary},${C.gold})` }}/>
                    </div>
                  </div>
                  <p className="text-sm font-bold flex-shrink-0" style={{ color:C.accent }}>{fmt(s.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Designer Workload */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background:`linear-gradient(135deg,${C.darkest},${C.darker})`,
            border:`1px solid ${C.primary}25` }}>
          <div className="px-6 py-4" style={{ borderBottom:`1px solid ${C.primary}20` }}>
            <h2 className="font-bold font-display" style={{ color:"white" }}>Designer Workload</h2>
          </div>
          {designerPerf.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color:C.textFaint }}>No designer data</p>
          ) : (
            <div className="divide-y" style={{ borderColor:`${C.primary}12` }}>
              {designerPerf.map((d,i)=>(
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background:"linear-gradient(135deg,#7B6BB5,#9B8BC5)" }}>
                    {d.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color:"white" }}>{d.name}</p>
                    <p className="text-xs" style={{ color:C.textFaint }}>
                      {d.leads} assigned · {d.projects} projects
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold" style={{ color:"#2D7A4F" }}>✅ {d.completed}</p>
                    <p className="text-xs" style={{ color:C.accent }}>🔨 {d.active} active</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}