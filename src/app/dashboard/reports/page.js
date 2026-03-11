"use client";
import { useEffect, useState } from "react";
import { reportsAPI } from "@/lib/api";
import { PageHeader, Spinner } from "@/components/ui";
import { TrendingUp, DollarSign, Users, FolderOpen } from "lucide-react";

const fmt = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n||0);

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function ReportsPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    reportsAPI.getAll()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8"><Spinner /></div>;
  if (error)   return <div className="p-8 text-red-500">Error: {error}</div>;

  const projectStatusColor = {
    planning:"#0ea5e9", design:"#8b5cf6",
    in_progress:"#f97316", completed:"#10b981"
  };

  const maxLeads = Math.max(...(data.leads.monthly.map(m=>m.count)||[1]));

  return (
    <div className="p-8 page-enter">
      <PageHeader title="Reports" subtitle="Business performance overview"/>

      {/* Top Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {[
          { label:"Total Leads",       value:data.leads.total,            icon:<TrendingUp size={20}/>,  color:"#f97316" },
          { label:"Conversion Rate",   value:`${data.leads.conversionRate}%`, icon:<TrendingUp size={20}/>, color:"#10b981" },
          { label:"Total Revenue",     value:fmt(data.revenue.total),     icon:<DollarSign size={20}/>,  color:"#8b5cf6" },
          { label:"Pending Revenue",   value:fmt(data.revenue.pending),   icon:<DollarSign size={20}/>,  color:"#ef4444" },
        ].map(s=>(
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm">{s.label}</p>
                <p className="text-2xl font-bold font-display mt-1 text-slate-800">{s.value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{background:`${s.color}18`,color:s.color}}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">

        {/* Monthly Leads Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="font-bold text-slate-800 font-display mb-5">Monthly Leads</h2>
          {data.leads.monthly.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No data yet</p>
          ) : (
            <div className="flex items-end gap-2 h-40">
              {data.leads.monthly.map((m,i)=>(
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-slate-600">{m.count}</span>
                  <div className="w-full rounded-t-lg transition-all"
                    style={{
                      height:`${Math.max((m.count/maxLeads)*120,8)}px`,
                      background:"linear-gradient(180deg,#f97316,#ea6510)"
                    }}/>
                  <span className="text-xs text-slate-400">{MONTH_NAMES[m._id.month-1]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lead Sources */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="font-bold text-slate-800 font-display mb-5">Lead Sources</h2>
          {data.leads.sources.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {data.leads.sources.map((s,i)=>{
                const colors=["#f97316","#8b5cf6","#0ea5e9","#10b981","#f59e0b"];
                const total = data.leads.sources.reduce((sum,x)=>sum+x.count,0);
                const pct   = Math.round((s.count/total)*100);
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 capitalize">{s._id?.replace(/_/g," ")}</span>
                      <span className="font-semibold text-slate-800">{s.count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="h-2 rounded-full" style={{width:`${pct}%`,background:colors[i%colors.length]}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">

        {/* Sales Performance */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="font-bold text-slate-800 font-display mb-5">
            🏆 Top Sales
          </h2>
          {data.salesPerformance.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-3">
              {data.salesPerformance.map((s,i)=>(
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{background:i===0?"#f97316":i===1?"#8b5cf6":"#0ea5e9"}}>
                    {i+1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.wonCount} leads won</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Designer Workload */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="font-bold text-slate-800 font-display mb-5">
            🎨 Designer Workload
          </h2>
          {data.designerWorkload.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-3">
              {data.designerWorkload.map((d,i)=>(
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                      style={{background:"#10b981"}}>
                      {d.name?.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{d.name}</span>
                  </div>
                  <span className="text-xs bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full font-semibold">
                    {d.activeProjects} active
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Status */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="font-bold text-slate-800 font-display mb-5">
            📁 Project Status
          </h2>
          {data.projectStats.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-3">
              {data.projectStats.map((p,i)=>(
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 capitalize">{p._id?.replace(/_/g," ")}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full"
                      style={{background:projectStatusColor[p._id]||"#94a3b8"}}/>
                    <span className="text-sm font-semibold text-slate-800">{p.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lead Conversion Summary */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h2 className="font-bold text-slate-800 font-display mb-5">Lead Conversion Summary</h2>
        <div className="grid grid-cols-3 gap-6 text-center">
          {[
            { label:"Total Leads",  value:data.leads.total, color:"#0ea5e9" },
            { label:"Won",          value:data.leads.won,   color:"#10b981" },
            { label:"Lost",         value:data.leads.lost,  color:"#ef4444" },
          ].map(item=>(
            <div key={item.label} className="p-4 rounded-2xl"
              style={{background:`${item.color}10`}}>
              <p className="text-3xl font-bold font-display" style={{color:item.color}}>{item.value}</p>
              <p className="text-slate-500 text-sm mt-1">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-slate-100 rounded-full h-3 overflow-hidden">
          <div className="h-3 rounded-full transition-all"
            style={{
              width:`${data.leads.conversionRate}%`,
              background:"linear-gradient(90deg,#10b981,#059669)"
            }}/>
        </div>
        <p className="text-center text-sm text-slate-500 mt-2">
          <span className="font-bold text-emerald-600">{data.leads.conversionRate}%</span> conversion rate
        </p>
      </div>
    </div>
  );
}