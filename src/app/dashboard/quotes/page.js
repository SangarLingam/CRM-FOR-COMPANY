"use client";
import { useEffect, useState, useCallback } from "react";
import { quotesAPI, projectsAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { PageHeader, Button, Modal, FormField, Input, Select, Textarea, Spinner } from "@/components/ui";
import { Plus, Eye, Pencil, Trash2, AlertCircle } from "lucide-react";

const EMPTY_ITEM = { name:"", description:"", quantity:1, unitPrice:0 };
const fmt = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n||0);

const STATUS_COLOR = {
  draft:            "bg-slate-100 text-slate-500",
  pending_approval: "bg-yellow-50 text-yellow-600",
  approved:         "bg-blue-50 text-blue-600",
  revision:         "bg-red-50 text-red-500",
  sent:             "bg-orange-50 text-orange-600",
  accepted:         "bg-green-50 text-green-600",
  rejected:         "bg-red-50 text-red-500",
};

const STATUS_LABEL = {
  draft:            "Draft",
  pending_approval: "Pending Approval",
  approved:         "Approved",
  revision:         "Needs Revision",
  sent:             "Sent",
  accepted:         "Accepted",
  rejected:         "Rejected",
};

export default function QuotesPage() {
  const { user }     = useAuth();
  const { addToast } = useToast();
  const [quotes,    setQuotes]    = useState([]);
  const [projects,  setProjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null);
  const [selected,  setSelected]  = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [revReason, setRevReason] = useState("");
  const [form,      setForm]      = useState({
    projectId:"", customerId:"", items:[{...EMPTY_ITEM}],
    notes:"", tax:0, discount:0, validUntil:""
  });

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await quotesAPI.getAll();
      setQuotes(data.quotes || []);
    } catch(e) {
      addToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);
  useEffect(() => {
    projectsAPI.getAll().then(d => setProjects(d.projects || []));
  }, []);

  function onProjectChange(projectId) {
    const proj = projects.find(p => p._id === projectId);
    setForm(f => ({ ...f, projectId, customerId: proj?.customerId?._id || "" }));
  }

  function addItem()         { setForm(f => ({...f, items:[...f.items,{...EMPTY_ITEM}]})); }
  function removeItem(i)     { setForm(f => ({...f, items:f.items.filter((_,idx)=>idx!==i)})); }
  function updateItem(i,k,v) {
    setForm(f => {
      const items = [...f.items];
      items[i] = {...items[i], [k]:(k==="quantity"||k==="unitPrice")?Number(v):v};
      return {...f, items};
    });
  }

  const subtotal = form.items.reduce((s,i) => s+(i.quantity*i.unitPrice), 0);
  const total    = subtotal + Number(form.tax) - Number(form.discount);

  function openAdd() {
    setSelected(null);
    setForm({ projectId:"", customerId:"", items:[{...EMPTY_ITEM}], notes:"", tax:0, discount:0, validUntil:"" });
    setModal("form");
  }

  function openEdit(q) {
    setSelected(q);
    setForm({
      projectId:  q.projectId?._id  || q.projectId  || "",
      customerId: q.customerId?._id || q.customerId || "",
      items: q.items?.map(i=>({ name:i.name, description:i.description||"", quantity:i.quantity, unitPrice:i.unitPrice })) || [{...EMPTY_ITEM}],
      notes:      q.notes      || "",
      tax:        q.tax        || 0,
      discount:   q.discount   || 0,
      validUntil: q.validUntil ? q.validUntil.slice(0,10) : "",
    });
    setModal("form");
  }

  async function handleSave() {
    if (!form.projectId) { addToast("Please select a project", "warning"); return; }
    if (form.items.some(i => !i.name)) { addToast("All items must have a name", "warning"); return; }
    setSaving(true);
    try {
      if (selected) {
        await quotesAPI.update(selected._id, form);
        addToast("Quote updated successfully!", "success");
      } else {
        await quotesAPI.create(form);
        addToast("Quote created successfully!", "success");
      }
      setModal(null);
      fetchQuotes();
    } catch(e) {
      addToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this quote?")) return;
    try {
      await quotesAPI.delete(id);
      addToast("Quote deleted!", "success");
      fetchQuotes();
    } catch(e) {
      addToast(e.message, "error");
    }
  }

  async function handleAction(id, action) {
    try {
      if (action === "revision") {
        if (!revReason.trim()) { addToast("Please enter a revision reason", "warning"); return; }
        await quotesAPI.revision(id, revReason);
        addToast("Quote sent for revision!", "info");
        setModal(null);
      } else {
        await quotesAPI[action](id);
        const msgs = {
          submit:  "Quote submitted for approval!",
          approve: "Quote approved! ✅",
          send:    "Quote sent to customer! 📧",
          accept:  "Quote accepted! ✅",
          reject:  "Quote rejected.",
        };
        addToast(msgs[action] || "Done!", action === "reject" ? "error" : "success");
      }
      fetchQuotes();
    } catch(e) {
      addToast(e.message, "error");
    }
  }

  const isManager  = ["super_admin","manager"].includes(user?.role);
  const isDesigner = user?.role === "designer";

  function getActions(q) {
    const actions = [];
    if (isDesigner || isManager) {
      if (q.status === "draft" || q.status === "revision") {
        actions.push({ label:"Submit", fn:()=>handleAction(q._id,"submit"), cls:"bg-yellow-50 text-yellow-600 hover:bg-yellow-100" });
      }
    }
    if (isManager) {
      if (q.status === "pending_approval") {
        actions.push({ label:"✅ Approve", fn:()=>handleAction(q._id,"approve"), cls:"bg-green-50 text-green-600 hover:bg-green-100" });
        actions.push({ label:"↩ Revision", fn:()=>{ setSelected(q); setRevReason(""); setModal("revision"); }, cls:"bg-orange-50 text-orange-500 hover:bg-orange-100" });
      }
      if (q.status === "approved") {
        actions.push({ label:"📧 Send", fn:()=>handleAction(q._id,"send"), cls:"bg-blue-50 text-blue-600 hover:bg-blue-100" });
      }
      if (q.status === "sent") {
        actions.push({ label:"Accept", fn:()=>handleAction(q._id,"accept"), cls:"bg-green-50 text-green-600 hover:bg-green-100" });
        actions.push({ label:"Reject", fn:()=>handleAction(q._id,"reject"), cls:"bg-red-50 text-red-500 hover:bg-red-100" });
      }
    }
    return actions;
  }

  const canEditDelete = q => ["draft","revision"].includes(q.status) && (isManager || isDesigner);

  return (
    <div className="p-8 page-enter">
      <PageHeader
        title="Quotes"
        subtitle={`${quotes.length} quotations`}
        action={<Button onClick={openAdd}><Plus size={16}/> New Quote</Button>}
      />

      {/* Status legend */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {Object.entries(STATUS_LABEL).map(([k,v])=>(
          <span key={k} className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[k]}`}>{v}</span>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Quote #","Project","Customer","Amount","Status","Created","Actions"].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotes.length === 0 && (
                <tr><td colSpan={7} className="text-center py-16 text-slate-400 text-sm">No quotes yet.</td></tr>
              )}
              {quotes.map(q=>(
                <tr key={q._id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-500">{q.quoteNumber}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-800">{q.projectId?.projectName}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{q.customerId?.name}</td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-slate-800">{fmt(q.totalAmount)}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[q.status]}`}>
                      {STATUS_LABEL[q.status]}
                    </span>
                    {q.status==="revision" && q.revisionReason && (
                      <p className="text-xs text-red-400 mt-1 max-w-xs truncate">↩ {q.revisionReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-400">
                    {new Date(q.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {getActions(q).map(({label,fn,cls})=>(
                        <button key={label} onClick={fn}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${cls}`}>
                          {label}
                        </button>
                      ))}
                      <button onClick={()=>{ setSelected(q); setModal("view"); }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                        <Eye size={14}/>
                      </button>
                      {canEditDelete(q) && (
                        <button onClick={()=>openEdit(q)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 transition-colors">
                          <Pencil size={14}/>
                        </button>
                      )}
                      {canEditDelete(q) && (
                        <button onClick={()=>handleDelete(q._id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                          <Trash2 size={14}/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modal==="form"} onClose={()=>setModal(null)}
        title={selected?"Edit Quote":"Create New Quote"} size="xl">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Project" required>
              <Select value={form.projectId} onChange={e=>onProjectChange(e.target.value)}>
                <option value="">— Select Project —</option>
                {projects.map(p=><option key={p._id} value={p._id}>{p.projectName} ({p.customerId?.name})</option>)}
              </Select>
            </FormField>
            <FormField label="Valid Until">
              <Input type="date" value={form.validUntil} onChange={e=>setForm({...form,validUntil:e.target.value})}/>
            </FormField>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-700">Line Items</p>
              <Button size="sm" variant="secondary" onClick={addItem}><Plus size={13}/> Add Item</Button>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Item Name","Description","Qty","Unit Price (₹)","Total",""].map(h=>(
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item,idx)=>(
                    <tr key={idx} className="border-t border-slate-100">
                      <td className="px-2 py-2 w-36"><Input value={item.name} onChange={e=>updateItem(idx,"name",e.target.value)} placeholder="Item name"/></td>
                      <td className="px-2 py-2"><Input value={item.description} onChange={e=>updateItem(idx,"description",e.target.value)} placeholder="Details"/></td>
                      <td className="px-2 py-2 w-16"><Input type="number" value={item.quantity} min="1" onChange={e=>updateItem(idx,"quantity",e.target.value)}/></td>
                      <td className="px-2 py-2 w-32"><Input type="number" value={item.unitPrice} min="0" onChange={e=>updateItem(idx,"unitPrice",e.target.value)}/></td>
                      <td className="px-3 py-2 font-semibold text-slate-700 w-28">₹{(item.quantity*item.unitPrice).toLocaleString("en-IN")}</td>
                      <td className="px-2 py-2"><button onClick={()=>removeItem(idx)} className="text-red-300 hover:text-red-500">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span><span className="font-medium">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Tax (₹)</span>
                <Input className="w-24 text-right !py-1.5" type="number" value={form.tax} onChange={e=>setForm({...form,tax:e.target.value})}/>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Discount (₹)</span>
                <Input className="w-24 text-right !py-1.5" type="number" value={form.discount} onChange={e=>setForm({...form,discount:e.target.value})}/>
              </div>
              <div className="flex justify-between font-bold text-slate-800 pt-2 border-t border-slate-200 text-base">
                <span>Total</span>
                <span style={{color:"#C8974A"}}>₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <FormField label="Notes">
            <Textarea rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Payment terms, conditions..."/>
          </FormField>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={()=>setModal(null)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving?"Saving...":selected?"Save Changes":"Create Quote"}</Button>
        </div>
      </Modal>

      {/* Revision Modal */}
      <Modal isOpen={modal==="revision"} onClose={()=>setModal(null)} title="Send for Revision" size="sm">
        <div className="space-y-3">
          <div className="flex items-start gap-2 bg-red-50 p-3 rounded-xl">
            <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0"/>
            <p className="text-sm text-red-600">Designer will be asked to revise this quote.</p>
          </div>
          <FormField label="Revision Reason" required>
            <Textarea rows={3} value={revReason} onChange={e=>setRevReason(e.target.value)} placeholder="What needs to be changed?"/>
          </FormField>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={()=>setModal(null)}>Cancel</Button>
          <Button variant="danger" onClick={()=>handleAction(selected._id,"revision")}>Send for Revision</Button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={modal==="view"} onClose={()=>setModal(null)} title={`Quote: ${selected?.quoteNumber}`} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Project</p>
                <p className="font-semibold text-slate-800">{selected.projectId?.projectName}</p>
                <p className="text-sm text-slate-500">{selected.customerId?.name}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[selected.status]}`}>
                {STATUS_LABEL[selected.status]}
              </span>
            </div>
            {selected.revisionReason && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-red-600 mb-1">↩ Revision Required</p>
                <p className="text-sm text-red-500">{selected.revisionReason}</p>
              </div>
            )}
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {["Item","Qty","Unit Price","Total"].map(h=>(
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.items?.map((item,i)=>(
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.name}</p>
                        {item.description && <p className="text-slate-400 text-xs">{item.description}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.quantity}</td>
                      <td className="px-4 py-3 text-slate-600">{fmt(item.unitPrice)}</td>
                      <td className="px-4 py-3 font-semibold">{fmt(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-end pt-2">
              <div className="text-xs text-slate-400 space-y-1">
                {selected.notes && <p>📝 {selected.notes}</p>}
                {selected.validUntil && <p>📅 Valid until: {new Date(selected.validUntil).toLocaleDateString("en-IN")}</p>}
                {selected.approvedBy && <p>✅ Approved by Manager</p>}
                {selected.revisions?.length > 0 && <p>↩ {selected.revisions.length} revision(s)</p>}
              </div>
              <p className="text-2xl font-bold font-display" style={{color:"#C8974A"}}>{fmt(selected.totalAmount)}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}