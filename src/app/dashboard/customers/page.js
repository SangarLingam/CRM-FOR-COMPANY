// app/dashboard/customers/page.js
"use client";
import { useEffect, useState, useCallback } from "react";
import { customersAPI } from "@/lib/api";
import { PageHeader, Spinner } from "@/components/ui";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [search,    setSearch]    = useState("");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await customersAPI.getAll(search);
      setCustomers(data.customers || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  return (
    <div className="p-8 page-enter">
      <PageHeader title="Customers" subtitle={`${customers.length} customers`} />

      <div className="mb-6">
        <input placeholder="Search customers..."
          value={search} onChange={e=>setSearch(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white w-72"/>
      </div>

      {error   && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-sm">{error}</div>}
      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Customer","Phone","Email","Address","Source","Since"].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400 text-sm">
                    No customers yet. Customers are auto-created when a lead is marked as Won.
                  </td>
                </tr>
              )}
              {customers.map(c=>(
                <tr key={c._id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                        style={{ background:"linear-gradient(135deg,#8b5cf6,#6d28d9)" }}>
                        {c.name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-800 text-sm">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{c.phone}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-500">{c.email||"—"}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-500 max-w-xs truncate">{c.address||"—"}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-lg capitalize">
                      {c.leadId?.leadSource?.replace(/_/g," ")||"—"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-400">
                    {new Date(c.createdAt).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}