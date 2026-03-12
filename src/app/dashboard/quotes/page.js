"use client";
import { useEffect, useState, useCallback } from "react";
import { quotesAPI, projectsAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { PageHeader, Button, Modal, FormField, Input, Select, Textarea, Spinner } from "@/components/ui";
import { Plus, Eye, Pencil, Trash2, AlertCircle, MessageCircle, Mail } from "lucide-react";

const C = {
  primary:"#C8974A", accent:"#D4A85A", gold:"#F0C060",
  darkest:"#2C1A0E", darker:"#3D2410",
  textLight:"#9C7A5A", textFaint:"#C4A882",
  border:"#E8DDD0", cream:"#FAF7F4",
};

const EMPTY_ITEM = { name:"", description:"", quantity:1, unitPrice:0 };
const fmt = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n||0);

const STATUS_CONFIG = {
  draft:            { bg:"#F2F3F4", color:"#626567", label:"Draft" },
  pending_approval: { bg:"#FEF9E7", color:"#B7770D", label:"Pending Approval" },
  approved:         { bg:"#EAF2FF", color:"#1565C0", label:"Approved ✅" },
  revision:         { bg:"#FDEDEC", color:"#C0392B", label:"Needs Revision ↩" },
  sent:             { bg:"#F4ECF7", color:"#76448A", label:"Sent to Customer 📧" },
  accepted:         { bg:"#E9F7EF", color:"#1E8449", label:"Accepted 🎉" },
  rejected:         { bg:"#FDEDEC", color:"#C0392B", label:"Rejected" },
};

// ── Build WhatsApp message ─────────────────────────────
function buildWhatsAppMsg(quote) {
  const items = (quote.items||[]).map(i =>
    `  • ${i.name} × ${i.quantity} = ₹${(i.total||i.quantity*i.unitPrice).toLocaleString("en-IN")}`
  ).join("\n");

  return encodeURIComponent(
`Hello ${quote.customerId?.name || ""},

We are pleased to share your interior design quote:

📋 *Quote #${quote.quoteNumber}*
🏠 Project: ${quote.projectId?.projectName || ""}

📦 *Items:*
${items}

💰 *Total Amount: ${fmt(quote.totalAmount)}*
${quote.validUntil ? `📅 Valid Until: ${new Date(quote.validUntil).toLocaleDateString("en-IN")}` : ""}
${quote.notes ? `📝 Notes: ${quote.notes}` : ""}

Please review and let us know if you'd like to proceed.

Thank you! 🙏`
  );
}

// ── Build Email ────────────────────────────────────────
function buildEmail(quote) {
  const subject = encodeURIComponent(`Interior Design Quote #${quote.quoteNumber} - ${quote.projectId?.projectName||""}`);
  const items   = (quote.items||[]).map(i =>
    `  - ${i.name} x${i.quantity} = ₹${(i.total||i.quantity*i.unitPrice).toLocaleString("en-IN")}`
  ).join("\n");

  const body = encodeURIComponent(
`Dear ${quote.customerId?.name || ""},

Please find your interior design quotation details below:

Quote Number: ${quote.quoteNumber}
Project: ${quote.projectId?.projectName || ""}

ITEMS:
${items}

Total Amount: ${fmt(quote.totalAmount)}
${quote.validUntil ? `Valid Until: ${new Date(quote.validUntil).toLocaleDateString("en-IN")}` : ""}
${quote.notes ? `Notes: ${quote.notes}` : ""}

Kindly review the quote and confirm if you wish to proceed.

Warm regards,
Interior Design Team`
  );
  return { subject, body };
}

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
  const [filterStatus, setFilterStatus] = useState("");
  const [form,      setForm]      = useState({
    projectId:"", items:[{...EMPTY_ITEM}],
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

  function addItem()         { setForm(f=>({...f,items:[...f.items,{...EMPTY_ITEM}]})); }
  function removeItem(i)     { setForm(f=>({...f,items:f.items.filter((_,idx)=>idx!==i)})); }
  function updateItem(i,k,v) {
    setForm(f => {
      const items = [...f.items];
      items[i] = {...items[i],[k]:(k==="quantity"||k==="unitPrice")?Number(v):v};
      return {...f,items};
    });
  }

  const subtotal = form.items.reduce((s,i)=>s+(i.quantity*i.unitPrice),0);
  const total    = subtotal + Number(form.tax) - Number(form.discount);

  function openAdd() {
    setSelected(null);
    setForm({ projectId:"", items:[{...EMPTY_ITEM}], notes:"", tax:0, discount:0, validUntil:"" });
    setModal("form");
  }

  function openEdit(q) {
    setSelected(q);
    setForm({
      projectId:  q.projectId?._id  || q.projectId  || "",
      items: q.items?.map(i=>({ name:i.name, description:i.description||"", quantity:i.quantity, unitPrice:i.unitPrice })) || [{...EMPTY_ITEM}],
      notes:      q.notes      || "",
      tax:        q.tax        || 0,
      discount:   q.discount   || 0,
      validUntil: q.validUntil ? q.validUntil.slice(0,10) : "",
    });
    setModal("form");
  }

  async function handleSave() {
    if (!form.projectId)          { addToast("Please select a project", "warning"); return; }
    if (form.items.some(i=>!i.name)) { addToast("All items must have a name", "warning"); return; }
    setSaving(true);
    try {
      if (selected) {
        await quotesAPI.update(selected._id, form);
        addToast("Quote updated! ✏️", "success");
      } else {
        await quotesAPI.create(form);
        addToast("Quote created! 📋", "success");
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

  async function handleAction(id, action, extra) {
    try {
      if (action === "revision") {
        if (!revReason.trim()) { addToast("Please enter revision reason", "warning"); return; }
        await quotesAPI.revision(id, revReason);
        addToast("Sent for revision! Designer will update the quote. ↩", "info");
        setModal(null);
      } else {
        await quotesAPI[action](id, extra);
        const msgs = {
          submit:  "Quote submitted for manager approval! 🕐",
          approve: "Quote approved! ✅ Sales can now send to customer.",
          send:    "Quote marked as sent! 📬",
          accept:  "Quote accepted! 🎉",
          reject:  "Quote rejected.",
        };
        addToast(msgs[action] || "Done!", action==="reject" ? "error" : "success");
      }
      fetchQuotes();
    } catch(e) {
      addToast(e.message, "error");
    }
  }

  // ── Send to Customer via WhatsApp ──────────────────
  function sendWhatsApp(quote) {
    const phone = quote.customerId?.phone?.replace(/[^0-9]/g,"");
    if (!phone) { addToast("Customer phone not found!", "error"); return; }
    const msg = buildWhatsAppMsg(quote);
    window.open(`https://wa.me/91${phone}?text=${msg}`, "_blank");
    // Mark as sent
    handleAction(quote._id, "send");
  }

  // ── Send to Customer via Email ─────────────────────
  function sendEmail(quote) {
    const email = quote.customerId?.email;
    if (!email) { addToast("Customer email not found!", "warning"); return; }
    const { subject, body } = buildEmail(quote);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
    // Mark as sent
    handleAction(quote._id, "send");
  }

  const isManager  = ["super_admin","manager"].includes(user?.role);
  const isSales    = user?.role === "sales";
  const isDesigner = user?.role === "designer";

  // ── Action buttons per role + status ──────────────
  function getActions(q) {
    const actions = [];

    // Designer: submit (draft/revision)
    if ((isDesigner || isManager) && ["draft","revision"].includes(q.status)) {
      actions.push({
        label: "Submit for Approval →",
        fn:    ()=>handleAction(q._id,"submit"),
        style: { background:"#FEF9E7", color:"#B7770D", border:"1px solid #F0D080" }
      });
    }

    // Manager: approve / revision
    if (isManager && q.status === "pending_approval") {
      actions.push({
        label: "✅ Approve",
        fn:    ()=>handleAction(q._id,"approve"),
        style: { background:"#E9F7EF", color:"#1E8449", border:"1px solid #A9DFBF" }
      });
      actions.push({
        label: "↩ Revision",
        fn:    ()=>{ setSelected(q); setRevReason(""); setModal("revision"); },
        style: { background:"#FDEDEC", color:"#C0392B", border:"1px solid #F5B7B1" }
      });
    }

    // ⭐ SALES: Send to customer (WhatsApp + Email) — only when approved
    if ((isSales || isManager) && q.status === "approved") {
      actions.push({
        label: "💬 WhatsApp",
        fn:    ()=>sendWhatsApp(q),
        style: { background:"#E8F8E8", color:"#1E8449", border:"1px solid #A9DFBF" },
        icon:  "whatsapp"
      });
      actions.push({
        label: "📧 Email",
        fn:    ()=>sendEmail(q),
        style: { background:"#EAF2FF", color:"#1565C0", border:"1px solid #90B8E8" },
        icon:  "email"
      });
    }

    return actions;
  }

  const canCreateQuote = isDesigner || isManager;
  const canEditDelete  = q => ["draft","revision"].includes(q.status) && (isDesigner || isManager);

  const filtered = filterStatus ? quotes.filter(q=>q.status===filterStatus) : quotes;

  return (
    <div className="p-8 page-enter" style={{ background:C.cream, minHeight:"100vh" }}>

      <PageHeader
        title="Quotes"
        subtitle={`${quotes.length} quotations`}
        action={canCreateQuote
          ? <Button onClick={openAdd}><Plus size={16}/> New Quote</Button>
          : null}
      />

      {/* ── Role Hint ── */}
      <div className="mb-5 p-4 rounded-2xl"
        style={{ background:`linear-gradient(135deg,${C.darkest},${C.darker})`,
          border:`1px solid ${C.primary}25` }}>
        <div className="flex items-center gap-6 text-xs flex-wrap">
          {isDesigner && (
            <span style={{ color:C.accent }}>🎨 <strong>You:</strong> Create quote → Submit for approval → Update if revision requested</span>
          )}
          {isManager && (
            <span style={{ color:C.accent }}>👔 <strong>You:</strong> Review submitted quotes → Approve or request revision</span>
          )}
          {isSales && (
            <span style={{ color:C.accent }}>📞 <strong>You:</strong> Send approved quotes to customer via WhatsApp or Email</span>
          )}
        </div>
      </div>

      {/* ── Status Filter ── */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["", ...Object.keys(STATUS_CONFIG)].map(s => (
          <button key={s} onClick={()=>setFilterStatus(s)}
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
            style={filterStatus === s
              ? { background:C.primary, color:"white" }
              : s ? { background:STATUS_CONFIG[s]?.bg, color:STATUS_CONFIG[s]?.color }
                  : { background:"white", border:`1px solid ${C.border}`, color:C.textLight }}>
            {s ? STATUS_CONFIG[s].label : `All (${quotes.length})`}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden"
          style={{ borderColor:C.border }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom:`1px solid ${C.border}`, background:C.cream }}>
                {["Quote #","Project / Customer","Amount","Status","Actions"].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color:C.textLight }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-sm" style={{ color:C.textFaint }}>
                    No quotes found.
                  </td>
                </tr>
              )}
              {filtered.map(q=>(
                <tr key={q._id} style={{ borderBottom:`1px solid #FAF7F4` }}
                  className="hover:bg-[#FAF7F4]/60 transition-colors">

                  {/* Quote # */}
                  <td className="px-4 py-4">
                    <span className="font-mono text-xs font-bold px-2 py-1 rounded-lg"
                      style={{ background:`${C.primary}12`, color:C.primary }}>
                      {q.quoteNumber}
                    </span>
                    <p className="text-xs mt-1" style={{ color:C.textFaint }}>
                      {new Date(q.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </td>

                  {/* Project / Customer */}
                  <td className="px-4 py-4">
                    <p className="font-semibold text-sm" style={{ color:C.darkest }}>
                      {q.projectId?.projectName}
                    </p>
                    <p className="text-xs" style={{ color:C.textLight }}>
                      👤 {q.customerId?.name}
                      {q.customerId?.phone && ` · 📞 ${q.customerId.phone}`}
                    </p>
                    {q.status === "revision" && q.revisionReason && (
                      <div className="mt-1.5 px-2 py-1 rounded-lg text-xs"
                        style={{ background:"#FDEDEC", color:"#C0392B" }}>
                        ↩ {q.revisionReason}
                      </div>
                    )}
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-4">
                    <p className="text-base font-bold font-display" style={{ color:C.darkest }}>
                      {fmt(q.totalAmount)}
                    </p>
                    {q.items?.length > 0 && (
                      <p className="text-xs" style={{ color:C.textFaint }}>
                        {q.items.length} item{q.items.length>1?"s":""}
                      </p>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={{ background:STATUS_CONFIG[q.status]?.bg,
                        color:STATUS_CONFIG[q.status]?.color }}>
                      {STATUS_CONFIG[q.status]?.label}
                    </span>
                    {/* WhatsApp/Email sent indicator */}
                    {q.status === "sent" && (
                      <p className="text-xs mt-1" style={{ color:C.textFaint }}>
                        Sent {q.sentAt ? new Date(q.sentAt).toLocaleDateString("en-IN") : ""}
                      </p>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 flex-wrap">

                      {/* Dynamic action buttons */}
                      {getActions(q).map(({label,fn,style})=>(
                        <button key={label} onClick={fn}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                          style={style}>
                          {label}
                        </button>
                      ))}

                      {/* View */}
                      <button onClick={()=>{ setSelected(q); setModal("view"); }}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color:C.textFaint }}
                        onMouseEnter={e=>e.currentTarget.style.color=C.primary}
                        onMouseLeave={e=>e.currentTarget.style.color=C.textFaint}>
                        <Eye size={14}/>
                      </button>

                      {/* Edit (designer only, draft/revision) */}
                      {canEditDelete(q) && (
                        <button onClick={()=>openEdit(q)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color:C.textFaint }}
                          onMouseEnter={e=>e.currentTarget.style.color="#1565C0"}
                          onMouseLeave={e=>e.currentTarget.style.color=C.textFaint}>
                          <Pencil size={14}/>
                        </button>
                      )}

                      {/* Delete */}
                      {canEditDelete(q) && (
                        <button onClick={()=>handleDelete(q._id)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color:C.textFaint }}
                          onMouseEnter={e=>e.currentTarget.style.color="#C0392B"}
                          onMouseLeave={e=>e.currentTarget.style.color=C.textFaint}>
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

      {/* ── Create/Edit Quote Modal ── */}
      <Modal isOpen={modal==="form"} onClose={()=>setModal(null)}
        title={selected ? `Edit Quote${selected.status==="revision" ? " (Revision Requested)" : ""}` : "Create Quote"}
        size="xl">

        {/* Revision banner */}
        {selected?.status === "revision" && selected?.revisionReason && (
          <div className="mb-4 p-3 rounded-xl flex items-start gap-2"
            style={{ background:"#FDEDEC", border:"1px solid #F5B7B1" }}>
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color:"#C0392B" }}/>
            <div>
              <p className="text-xs font-bold" style={{ color:"#C0392B" }}>Revision Required by Manager</p>
              <p className="text-xs mt-0.5" style={{ color:"#C0392B" }}>{selected.revisionReason}</p>
            </div>
          </div>
        )}

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Project" required>
              <Select value={form.projectId} onChange={e=>setForm({...form,projectId:e.target.value})}>
                <option value="">— Select Project —</option>
                {projects.map(p=>(
                  <option key={p._id} value={p._id}>
                    {p.projectName} ({p.customerId?.name})
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Valid Until">
              <Input type="date" value={form.validUntil} onChange={e=>setForm({...form,validUntil:e.target.value})}/>
            </FormField>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold" style={{ color:C.darkest }}>Line Items</p>
              <Button size="sm" variant="secondary" onClick={addItem}><Plus size={13}/> Add Item</Button>
            </div>
            <div className="rounded-xl overflow-hidden border" style={{ borderColor:C.border }}>
              <table className="w-full text-sm">
                <thead style={{ background:C.cream, borderBottom:`1px solid ${C.border}` }}>
                  <tr>
                    {["Item Name","Description","Qty","Unit Price","Total",""].map(h=>(
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold"
                        style={{ color:C.textLight }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item,idx)=>(
                    <tr key={idx} style={{ borderTop:`1px solid #FAF7F4` }}>
                      <td className="px-2 py-2 w-36">
                        <Input value={item.name} onChange={e=>updateItem(idx,"name",e.target.value)} placeholder="Item"/>
                      </td>
                      <td className="px-2 py-2">
                        <Input value={item.description} onChange={e=>updateItem(idx,"description",e.target.value)} placeholder="Details"/>
                      </td>
                      <td className="px-2 py-2 w-16">
                        <Input type="number" min="1" value={item.quantity} onChange={e=>updateItem(idx,"quantity",e.target.value)}/>
                      </td>
                      <td className="px-2 py-2 w-32">
                        <Input type="number" min="0" value={item.unitPrice} onChange={e=>updateItem(idx,"unitPrice",e.target.value)}/>
                      </td>
                      <td className="px-3 py-2 font-bold w-28" style={{ color:C.primary }}>
                        ₹{(item.quantity*item.unitPrice).toLocaleString("en-IN")}
                      </td>
                      <td className="px-2 py-2">
                        {form.items.length > 1 && (
                          <button onClick={()=>removeItem(idx)} style={{ color:"#C0392B" }}>✕</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between" style={{ color:C.textLight }}>
                <span>Subtotal</span>
                <span className="font-medium">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color:C.textLight }}>Tax (₹)</span>
                <Input className="w-24 text-right !py-1.5" type="number"
                  value={form.tax} onChange={e=>setForm({...form,tax:e.target.value})}/>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color:C.textLight }}>Discount (₹)</span>
                <Input className="w-24 text-right !py-1.5" type="number"
                  value={form.discount} onChange={e=>setForm({...form,discount:e.target.value})}/>
              </div>
              <div className="flex justify-between font-bold text-base pt-2"
                style={{ borderTop:`1px solid ${C.border}`, color:C.darkest }}>
                <span>Total</span>
                <span style={{ color:C.primary }}>₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <FormField label="Notes / Payment Terms">
            <Textarea rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}
              placeholder="Payment terms, conditions, remarks..."/>
          </FormField>
        </div>

        <div className="flex justify-end gap-3 mt-5 pt-4 border-t" style={{ borderColor:C.border }}>
          <Button variant="secondary" onClick={()=>setModal(null)}>Cancel</Button>
          <Button variant="secondary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save as Draft"}
          </Button>
          <Button onClick={async()=>{
            await handleSave();
            // Also submit if it was a revision
            if (selected?.status === "revision") {
              await handleAction(selected._id, "submit");
            }
          }} disabled={saving}>
            {saving ? "Saving..." : selected?.status==="revision" ? "Save & Resubmit →" : "Save & Submit →"}
          </Button>
        </div>
      </Modal>

      {/* ── Revision Modal ── */}
      <Modal isOpen={modal==="revision"} onClose={()=>setModal(null)} title="Request Revision" size="sm">
        <div className="space-y-3">
          <div className="p-3 rounded-xl flex items-start gap-2"
            style={{ background:"#FDEDEC", border:"1px solid #F5B7B1" }}>
            <AlertCircle size={15} style={{ color:"#C0392B", flexShrink:0, marginTop:"2px" }}/>
            <p className="text-xs" style={{ color:"#C0392B" }}>
              This quote will be sent back to the designer for changes.
            </p>
          </div>
          <FormField label="What needs to be changed?" required>
            <Textarea rows={3} value={revReason} onChange={e=>setRevReason(e.target.value)}
              placeholder="Be specific — e.g. Please update pricing for flooring items..."/>
          </FormField>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t" style={{ borderColor:C.border }}>
          <Button variant="secondary" onClick={()=>setModal(null)}>Cancel</Button>
          <Button variant="danger" onClick={()=>handleAction(selected._id,"revision")}>
            Send for Revision ↩
          </Button>
        </div>
      </Modal>

      {/* ── View Modal ── */}
      <Modal isOpen={modal==="view"} onClose={()=>setModal(null)}
        title={`Quote ${selected?.quoteNumber}`} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-lg font-display" style={{ color:C.darkest }}>
                  {selected.projectId?.projectName}
                </p>
                <p className="text-sm" style={{ color:C.textLight }}>
                  👤 {selected.customerId?.name}
                  {selected.customerId?.phone && ` · 📞 ${selected.customerId.phone}`}
                  {selected.customerId?.email && ` · ✉️ ${selected.customerId.email}`}
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{ background:STATUS_CONFIG[selected.status]?.bg,
                  color:STATUS_CONFIG[selected.status]?.color }}>
                {STATUS_CONFIG[selected.status]?.label}
              </span>
            </div>

            {selected.revisionReason && (
              <div className="p-3 rounded-xl" style={{ background:"#FDEDEC", border:"1px solid #F5B7B1" }}>
                <p className="text-xs font-bold" style={{ color:"#C0392B" }}>↩ Revision Note</p>
                <p className="text-xs mt-0.5" style={{ color:"#C0392B" }}>{selected.revisionReason}</p>
              </div>
            )}

            {/* Items Table */}
            <div className="rounded-xl overflow-hidden border" style={{ borderColor:C.border }}>
              <table className="w-full text-sm">
                <thead style={{ background:C.cream }}>
                  <tr>
                    {["Item","Qty","Unit Price","Total"].map(h=>(
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase"
                        style={{ color:C.textLight }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.items?.map((item,i)=>(
                    <tr key={i} style={{ borderTop:`1px solid #FAF7F4` }}>
                      <td className="px-4 py-3">
                        <p className="font-medium" style={{ color:C.darkest }}>{item.name}</p>
                        {item.description && <p className="text-xs" style={{ color:C.textFaint }}>{item.description}</p>}
                      </td>
                      <td className="px-4 py-3" style={{ color:C.textLight }}>{item.quantity}</td>
                      <td className="px-4 py-3" style={{ color:C.textLight }}>{fmt(item.unitPrice)}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color:C.darkest }}>{fmt(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-between items-end">
              <div className="text-xs space-y-1" style={{ color:C.textFaint }}>
                {selected.notes && <p>📝 {selected.notes}</p>}
                {selected.validUntil && <p>📅 Valid: {new Date(selected.validUntil).toLocaleDateString("en-IN")}</p>}
              </div>
              <div className="text-right">
                {selected.tax > 0 && <p className="text-xs" style={{ color:C.textFaint }}>Tax: +{fmt(selected.tax)}</p>}
                {selected.discount > 0 && <p className="text-xs" style={{ color:C.textFaint }}>Discount: -{fmt(selected.discount)}</p>}
                <p className="text-2xl font-bold font-display" style={{ color:C.primary }}>
                  {fmt(selected.totalAmount)}
                </p>
              </div>
            </div>

            {/* WhatsApp + Email send buttons in view modal for Sales */}
            {(isSales || isManager) && selected.status === "approved" && (
              <div className="pt-4 border-t" style={{ borderColor:C.border }}>
                <p className="text-xs font-bold mb-3" style={{ color:C.textLight }}>
                  ⭐ Send to Customer
                </p>
                <div className="flex gap-3">
                  <button onClick={()=>{ sendWhatsApp(selected); setModal(null); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-80"
                    style={{ background:"#E8F8E8", color:"#1E8449", border:"1px solid #A9DFBF" }}>
                    <MessageCircle size={18}/> Send via WhatsApp
                  </button>
                  <button onClick={()=>{ sendEmail(selected); setModal(null); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-80"
                    style={{ background:"#EAF2FF", color:"#1565C0", border:"1px solid #90B8E8" }}>
                    <Mail size={18}/> Send via Email
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}