"use client";
import { useEffect, useState, useCallback } from "react";
import { paymentsAPI, projectsAPI, quotesAPI } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { PageHeader, Button, Modal, FormField, Input, Select, Spinner } from "@/components/ui";
import { Plus } from "lucide-react";

const METHODS     = ["upi","bank_transfer","cash"];
const METHOD_ICON = { upi:"📱", bank_transfer:"🏦", cash:"💵" };
const fmt = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n||0);

export default function PaymentsPage() {
  const { addToast } = useToast();
  const [payments,  setPayments] = useState([]);
  const [projects,  setProjects] = useState([]);
  const [quotes,    setQuotes]   = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [modal,     setModal]    = useState(false);
  const [saving,    setSaving]   = useState(false);
  const [form,      setForm]     = useState({
    projectId:"", customerId:"", quoteId:"",
    amount:"", paymentMethod:"upi",
    reference:"", notes:"",
    paymentDate: new Date().toISOString().slice(0,10),
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pData, prData, qData] = await Promise.all([
        paymentsAPI.getAll(),
        projectsAPI.getAll(),
        quotesAPI.getAll({ status:"accepted" }),
      ]);
      setPayments(pData.payments || []);
      setProjects(prData.projects || []);
      setQuotes(qData.quotes || []);
    } catch(e) {
      addToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function onProjectChange(projectId) {
    const proj  = projects.find(p => p._id === projectId);
    const quote = quotes.find(q => (q.projectId?._id || q.projectId) === projectId);
    setForm(f => ({
      ...f,
      projectId,
      customerId: proj?.customerId?._id || "",
      quoteId:    quote?._id || "",
      amount:     "",
    }));
  }

  function getProjectSummary(projectId) {
    const proj     = projects.find(p => p._id === projectId);
    const quote    = quotes.find(q => (q.projectId?._id || q.projectId) === projectId);
    const projPays = payments.filter(p => (p.projectId?._id || p.projectId) === projectId);
    const totalPaid  = projPays.reduce((s,p) => s+(p.amount||0), 0);
    const quoteTotal = quote?.totalAmount || 0;
    const balance    = quoteTotal - totalPaid;
    const pct        = quoteTotal ? Math.min(Math.round((totalPaid/quoteTotal)*100), 100) : 0;
    return { quoteTotal, totalPaid, balance:Math.max(balance,0), pct, customerName:proj?.customerId?.name };
  }

  async function handleSave() {
    if (!form.projectId) { addToast("Please select a project", "warning"); return; }
    if (!form.amount)    { addToast("Please enter an amount",  "warning"); return; }

    const summary = getProjectSummary(form.projectId);

    if (summary.quoteTotal === 0) {
      addToast("No accepted quote found for this project. Get the quote accepted first.", "warning");
      return;
    }
    if (summary.balance <= 0) {
      addToast("This project is already fully paid! No balance remaining.", "info");
      return;
    }
    if (Number(form.amount) > summary.balance) {
      addToast(`Amount exceeds balance! Max allowed: ${fmt(summary.balance)}`, "error");
      return;
    }

    setSaving(true);
    try {
      await paymentsAPI.create(form);
      addToast("Payment recorded successfully! 💰", "success");
      setModal(false);
      fetchAll();
    } catch(e) {
      addToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  function openAdd() {
    setForm({
      projectId:"", customerId:"", quoteId:"",
      amount:"", paymentMethod:"upi", reference:"", notes:"",
      paymentDate: new Date().toISOString().slice(0,10),
    });
    setModal(true);
  }

  const totalReceived = payments.reduce((s,p) => s+(p.amount||0), 0);
  const totalQuoted   = quotes.reduce((s,q) => s+(q.totalAmount||0), 0);
  const totalBalance  = Math.max(totalQuoted - totalReceived, 0);

  const projectIds = [...new Set(payments.map(p => p.projectId?._id || p.projectId))].filter(Boolean);

  return (
    <div className="p-8 page-enter">
      <PageHeader
        title="Payments"
        subtitle="Track payments per project"
        action={<Button onClick={openAdd}><Plus size={16}/> Record Payment</Button>}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl p-5 text-white" style={{ background:"linear-gradient(135deg,#10b981,#059669)" }}>
          <p className="text-emerald-100 text-sm font-medium">Total Received</p>
          <p className="text-3xl font-bold font-display mt-1">{fmt(totalReceived)}</p>
          <p className="text-emerald-200 text-xs mt-1">{payments.length} payments recorded</p>
        </div>
        <div className="rounded-2xl p-5 text-white" style={{ background:"linear-gradient(135deg,#C8974A,#D4A85A)" }}>
          <p className="text-orange-100 text-sm font-medium">Total Quoted</p>
          <p className="text-3xl font-bold font-display mt-1">{fmt(totalQuoted)}</p>
          <p className="text-orange-200 text-xs mt-1">{quotes.length} accepted quotes</p>
        </div>
        <div className="rounded-2xl p-5 text-white" style={{ background:"linear-gradient(135deg,#ef4444,#dc2626)" }}>
          <p className="text-red-100 text-sm font-medium">Total Balance Due</p>
          <p className="text-3xl font-bold font-display mt-1">{fmt(totalBalance)}</p>
          <p className="text-red-200 text-xs mt-1">pending collection</p>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* Project-wise Cards */}
          {projectIds.length > 0 && (
            <div className="mb-8">
              <h2 className="font-bold text-slate-800 font-display mb-4">Project-wise Summary</h2>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {projectIds.map(pid => {
                  const { quoteTotal, totalPaid, balance, pct, customerName } = getProjectSummary(pid);
                  const proj         = projects.find(p => p._id === pid);
                  const projPayments = payments.filter(p => (p.projectId?._id || p.projectId) === pid);
                  return (
                    <div key={pid} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{proj?.projectName || "Project"}</p>
                          <p className="text-slate-400 text-xs">{customerName}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold
                          ${pct>=100 ? "bg-green-50 text-green-600" : pct>0 ? "bg-orange-50 text-orange-600" : "bg-red-50 text-red-500"}`}>
                          {pct>=100 ? "✅ Paid" : `${pct}% paid`}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 mb-3">
                        <div className="h-2.5 rounded-full transition-all"
                          style={{ width:`${pct}%`, background:pct>=100 ? "linear-gradient(90deg,#10b981,#059669)" : "linear-gradient(90deg,#C8974A,#D4A85A)" }}/>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center mb-3">
                        <div className="bg-slate-50 rounded-xl p-2">
                          <p className="text-xs text-slate-400">Quoted</p>
                          <p className="text-xs font-bold text-slate-700">{fmt(quoteTotal)}</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-2">
                          <p className="text-xs text-emerald-500">Received</p>
                          <p className="text-xs font-bold text-emerald-600">{fmt(totalPaid)}</p>
                        </div>
                        <div className={`rounded-xl p-2 ${balance>0 ? "bg-red-50" : "bg-green-50"}`}>
                          <p className={`text-xs ${balance>0 ? "text-red-400" : "text-emerald-500"}`}>Balance</p>
                          <p className={`text-xs font-bold ${balance>0 ? "text-red-500" : "text-emerald-600"}`}>
                            {balance>0 ? fmt(balance) : "Nil"}
                          </p>
                        </div>
                      </div>
                      {projPayments.length > 0 && (
                        <div className="border-t border-slate-100 pt-3 space-y-1.5">
                          {projPayments.map(p=>(
                            <div key={p._id} className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">
                                {METHOD_ICON[p.paymentMethod]} {new Date(p.paymentDate).toLocaleDateString("en-IN")}
                                {p.reference && ` · ${p.reference}`}
                              </span>
                              <span className="font-semibold text-emerald-600">+{fmt(p.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Payments Table */}
          <h2 className="font-bold text-slate-800 font-display mb-4">All Payment Records</h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Date","Project","Customer","Method","Paid","Balance Due","Reference"].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-16 text-slate-400 text-sm">No payments recorded yet.</td></tr>
                )}
                {payments.map(p => {
                  const pid     = p.projectId?._id || p.projectId;
                  const summary = getProjectSummary(pid);
                  return (
                    <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5 text-sm text-slate-500">{new Date(p.paymentDate).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-800">{p.projectId?.projectName}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">{p.customerId?.name}</td>
                      <td className="px-4 py-3.5 text-sm">
                        {METHOD_ICON[p.paymentMethod]} {p.paymentMethod?.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase())}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-emerald-600">{fmt(p.amount)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-sm font-semibold ${summary.balance>0 ? "text-red-500" : "text-emerald-600"}`}>
                          {summary.balance>0 ? fmt(summary.balance) : "✅ Fully Paid"}
                        </span>
                        {summary.quoteTotal > 0 && (
                          <div className="w-20 bg-slate-100 rounded-full h-1.5 mt-1">
                            <div className="h-1.5 rounded-full"
                              style={{ width:`${summary.pct}%`, background:summary.pct>=100 ? "#10b981" : "#C8974A" }}/>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-slate-400">{p.reference||"—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal */}
      <Modal isOpen={modal} onClose={()=>setModal(false)} title="Record New Payment">
        <div className="space-y-4">
          <FormField label="Project" required>
            <Select value={form.projectId} onChange={e=>onProjectChange(e.target.value)}>
              <option value="">— Select Project —</option>
              {projects.map(p=>(
                <option key={p._id} value={p._id}>{p.projectName} ({p.customerId?.name})</option>
              ))}
            </Select>
          </FormField>

          {form.projectId && (() => {
            const s = getProjectSummary(form.projectId);
            if (s.quoteTotal === 0) return (
              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-sm text-yellow-600">
                ⚠️ No accepted quote found for this project.
              </div>
            );
            if (s.balance <= 0) return (
              <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-sm text-emerald-600 font-medium">
                ✅ This project is already fully paid!
              </div>
            );
            return (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400">Quoted</p>
                  <p className="text-sm font-bold text-slate-700">{fmt(s.quoteTotal)}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-xs text-emerald-500">Received</p>
                  <p className="text-sm font-bold text-emerald-600">{fmt(s.totalPaid)}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <p className="text-xs text-red-400">Balance</p>
                  <p className="text-sm font-bold text-red-500">{fmt(s.balance)}</p>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Amount (₹)" required>
              <Input type="number" value={form.amount}
                onChange={e => {
                  const val = Number(e.target.value);
                  const s   = getProjectSummary(form.projectId);
                  setForm({...form, amount: s.quoteTotal>0 && val>s.balance ? s.balance : e.target.value});
                }}
                placeholder="50000"/>
              {form.projectId && (() => {
                const s = getProjectSummary(form.projectId);
                return s.balance > 0 ? (
                  <p className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                    <span>Max: <span className="font-semibold" style={{color:"#C8974A"}}>{fmt(s.balance)}</span></span>
                    <button type="button" onClick={()=>setForm({...form,amount:s.balance})}
                      className="underline hover:no-underline text-xs" style={{color:"#C8974A"}}>
                      Pay full balance
                    </button>
                  </p>
                ) : null;
              })()}
            </FormField>
            <FormField label="Payment Date">
              <Input type="date" value={form.paymentDate} onChange={e=>setForm({...form,paymentDate:e.target.value})}/>
            </FormField>
          </div>

          <FormField label="Payment Method">
            <Select value={form.paymentMethod} onChange={e=>setForm({...form,paymentMethod:e.target.value})}>
              {METHODS.map(m=>(
                <option key={m} value={m}>{METHOD_ICON[m]} {m.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase())}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Reference / TXN ID">
            <Input value={form.reference} onChange={e=>setForm({...form,reference:e.target.value})} placeholder="UPI / NEFT reference"/>
          </FormField>
          <FormField label="Notes">
            <Input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Optional notes"/>
          </FormField>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={()=>setModal(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving?"Saving...":"Record Payment"}</Button>
        </div>
      </Modal>
    </div>
  );
}