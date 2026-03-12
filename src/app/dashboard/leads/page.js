"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { leadsAPI, usersAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { PageHeader, Button, Modal, FormField, Input, Select, Textarea, Spinner } from "@/components/ui";
import { Plus, Pencil, Trash2, UserPlus, ChevronRight, ArrowRightCircle } from "lucide-react";

const C = {
  primary:"#C8974A", accent:"#D4A85A", gold:"#F0C060",
  darkest:"#2C1A0E", darker:"#3D2410", deep:"#6B3F1F",
  textLight:"#9C7A5A", textFaint:"#C4A882",
  border:"#E8DDD0", cream:"#FAF7F4",
};

const SOURCES = ["website","referral","social_media","walk_in","other"];
const EMPTY   = {
  customerName:"", phone:"", email:"", address:"",
  leadSource:"website", notes:"", budget:"", projectType:""
};

const STATUS_ACTIONS = {
  sales: [
    { from:["new"],       to:"contacted",  label:"✅ Mark Contacted", color:"#1565C0" },
    { from:["contacted"], to:"site_visit", label:"📅 Set Site Visit", color:"#B7770D" },
  ],
  designer: [
    { from:["site_visit"], to:"won",  label:"🏆 Mark Won",  color:"#1E8449" },
    { from:["site_visit"], to:"lost", label:"❌ Mark Lost", color:"#C0392B" },
  ],
  manager: [
    { from:["new"],                    to:"contacted",  label:"✅ Contacted",  color:"#1565C0" },
    { from:["contacted"],              to:"site_visit", label:"📅 Site Visit", color:"#B7770D" },
    { from:["site_visit","contacted"], to:"won",        label:"🏆 Won",        color:"#1E8449" },
    { from:["site_visit","contacted"], to:"lost",       label:"❌ Lost",       color:"#C0392B" },
  ],
  super_admin: [
    { from:["new"],                    to:"contacted",  label:"✅ Contacted",  color:"#1565C0" },
    { from:["contacted"],              to:"site_visit", label:"📅 Site Visit", color:"#B7770D" },
    { from:["site_visit","contacted"], to:"won",        label:"🏆 Won",        color:"#1E8449" },
    { from:["site_visit","contacted"], to:"lost",       label:"❌ Lost",       color:"#C0392B" },
  ],
};

const STEPS      = ["new","contacted","site_visit","won"];
const STEP_LABEL = { new:"New", contacted:"Contacted", site_visit:"Site Visit", won:"Won" };

// ── Workflow Steps ──────────────────────────────────────
function WorkflowSteps({ status }) {
  if (status === "lost") return (
    <span className="text-xs px-2 py-1 rounded-full font-semibold"
      style={{ background:"#FDEDEC", color:"#C0392B" }}>❌ Lost</span>
  );
  const cur = STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((s,i) => (
        <div key={s} className="flex items-center gap-1">
          <div className="text-xs px-2 py-0.5 rounded-full font-medium transition-all"
            style={{
              background: i < cur ? `${C.primary}80` : i === cur ? C.primary : "#E8DDD0",
              color:      i <= cur ? "white" : C.textFaint,
              opacity:    i > cur ? 0.35 : 1,
            }}>
            {STEP_LABEL[s]}
          </div>
          {i < STEPS.length-1 && (
            <ChevronRight size={10} style={{ color: i < cur ? C.primary : "#E8DDD0" }}/>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Status Popup (fixed position — bypasses overflow:hidden) ──
function StatusPopup({ lead, actions, onSelect, onClose, position }) {
  const ref = useRef();

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const available = actions.filter(a => a.from.includes(lead.status));

  return (
    <div ref={ref}
      className="fixed z-[999] w-52 rounded-2xl overflow-hidden shadow-2xl modal-enter"
      style={{
        top:    position.top,
        right:  position.right,
        background:`linear-gradient(135deg,${C.darkest},${C.darker})`,
        border:`1px solid ${C.primary}30`,
        boxShadow:`0 15px 50px rgba(44,26,14,0.5)`
      }}>

      {/* Header */}
      <div className="px-4 py-2.5" style={{ borderBottom:`1px solid ${C.primary}20` }}>
        <p className="text-xs font-bold" style={{ color:C.accent }}>Update Status</p>
        <p className="text-xs mt-0.5" style={{ color:C.textFaint }}>
          Current:{" "}
          <span style={{ color:"white" }}>
            {lead.status.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase())}
          </span>
        </p>
      </div>

      {/* Options */}
      <div className="p-2">
        {available.length === 0 ? (
          <p className="text-xs text-center py-3" style={{ color:C.textFaint }}>
            No actions available
          </p>
        ) : (
          available.map(action => (
            <button key={action.to}
              onClick={() => { onSelect(action.to); onClose(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all hover:scale-[1.02]"
              style={{ color:action.color }}
              onMouseEnter={e => e.currentTarget.style.background=`${action.color}18`}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}>
              <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background:`${action.color}20` }}>
                {action.label.split(" ")[0]}
              </span>
              {action.label.split(" ").slice(1).join(" ")}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const { user }     = useAuth();
  const { addToast } = useToast();

  const [leads,       setLeads]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState("");
  const [modal,       setModal]       = useState(null);
  const [selected,    setSelected]    = useState(null);
  const [form,        setForm]        = useState(EMPTY);
  const [saving,      setSaving]      = useState(false);
  const [designers,   setDesigners]   = useState([]);
  const [salesTeam,   setSalesTeam]   = useState([]);
  const [statusPopup, setStatusPopup] = useState(null);
  const [popupPos,    setPopupPos]    = useState({ top:0, right:0 }); // ← fixed position

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.status = filter;
      if (search) params.search = search;
      const data = await leadsAPI.getAll(params);
      setLeads(data.leads || []);
    } catch(e) {
      addToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => {
    usersAPI.getAll("designer").then(d => setDesigners(d.users || []));
    usersAPI.getAll("sales").then(d => setSalesTeam(d.users || []));
  }, []);

  function openAdd()   { setForm(EMPTY); setModal("add"); }
  function openEdit(l) { setSelected(l); setForm({...l, budget:l.budget||""}); setModal("edit"); }
  function openAssign(l) {
    setSelected(l);
    setForm({
      assignedSales:    l.assignedSales?._id    || "",
      assignedDesigner: l.assignedDesigner?._id || "",
    });
    setModal("assign");
  }

  async function handleSave() {
    if (!form.customerName) { addToast("Customer name is required", "warning"); return; }
    if (!form.phone)         { addToast("Phone number is required",  "warning"); return; }
    setSaving(true);
    try {
      if (modal === "add") {
        await leadsAPI.create(form);
        addToast("Lead added successfully! 🎯", "success");
      } else {
        await leadsAPI.update(selected._id, form);
        addToast("Lead updated successfully!", "success");
      }
      setModal(null);
      fetchLeads();
    } catch(e) {
      addToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(leadId, status) {
    try {
      const res = await leadsAPI.updateStatus(leadId, status);
      addToast(res.message || "Status updated!", "success");
      fetchLeads();
    } catch(e) {
      addToast(e.message, "error");
    }
  }

  async function handleAssign() {
    if (!form.assignedDesigner) {
      addToast("Please select a designer for site visit", "warning");
      return;
    }
    setSaving(true);
    try {
      await leadsAPI.assign(selected._id, {
        assignedSales:    form.assignedSales    || null,
        assignedDesigner: form.assignedDesigner || null,
      });
      if (["sales","manager","super_admin"].includes(role) && selected.status === "contacted") {
        await leadsAPI.updateStatus(selected._id, "site_visit");
      }
      addToast("Designer assigned! Status → Site Visit ✅", "success");
      setModal(null);
      fetchLeads();
    } catch(e) {
      addToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this lead? This cannot be undone.")) return;
    try {
      await leadsAPI.delete(id);
      addToast("Lead deleted!", "success");
      fetchLeads();
    } catch(e) {
      addToast(e.message, "error");
    }
  }

  const role      = user?.role;
  const canAdd    = ["super_admin","manager","sales","designer"].includes(role);
  const canDelete = ["super_admin","manager","sales"].includes(role);
  const canAssign = ["super_admin","manager","sales"].includes(role);
  const myActions = STATUS_ACTIONS[role] || [];

  function hasStatusActions(lead) {
    return myActions.some(a => a.from.includes(lead.status));
  }

  function showAssignBtn(lead) {
    if (!canAssign) return false;
    if (["won","lost"].includes(lead.status)) return false;
    if (role === "sales") return lead.status === "contacted" && !lead.assignedDesigner;
    if (["manager","super_admin"].includes(role)) return true;
    return false;
  }

  return (
    <div className="p-8 page-enter" style={{ background:C.cream, minHeight:"100vh" }}>

      <PageHeader
        title="Leads"
        subtitle={`${leads.length} leads`}
        action={canAdd
          ? <Button onClick={openAdd}><Plus size={16}/> Add Lead</Button>
          : null}
      />

      {/* ── Workflow Banner ── */}
      <div className="mb-6 p-4 rounded-2xl"
        style={{ background:`linear-gradient(135deg,${C.darkest},${C.darker})`,
          border:`1px solid ${C.primary}25` }}>
        <p className="text-xs font-bold mb-3" style={{ color:C.accent }}>📋 Workflow</p>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {[
            { step:"1", label:"Sales creates lead",                  role:"Sales",    color:C.primary },
            { step:"2", label:"Sales calls → Contacted",             role:"Sales",    color:C.primary },
            { step:"3", label:"Sales assigns designer → Site Visit", role:"Sales",    color:C.primary },
            { step:"4", label:"Designer → Won / Lost",               role:"Designer", color:"#10b981" },
            { step:"5", label:"Designer creates & submits quote",    role:"Designer", color:"#10b981" },
            { step:"6", label:"Manager approves quote",              role:"Manager",  color:"#8b5cf6" },
            { step:"7", label:"Sales sends quote + payment",         role:"Sales",    color:C.primary },
          ].map(s => (
            <div key={s.step} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background:"rgba(255,255,255,0.05)", border:`1px solid ${s.color}25` }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ background:s.color, fontSize:"10px" }}>{s.step}</span>
              <span style={{ color:"rgba(255,255,255,0.7)" }}>{s.label}</span>
              <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold"
                style={{ background:`${s.color}20`, color:s.color }}>{s.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input placeholder="Search name or phone..."
          value={search} onChange={e=>setSearch(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm w-64 outline-none"
          style={{ background:"white", border:`1px solid ${C.border}`, color:C.darkest }}/>
        <select value={filter} onChange={e=>setFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background:"white", border:`1px solid ${C.border}`, color:C.darkest }}>
          <option value="">All Statuses</option>
          {["new","contacted","site_visit","won","lost"].map(s=>(
            <option key={s} value={s}>
              {s.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase())}
            </option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
          style={{ background:`${C.primary}15`, color:C.primary, border:`1px solid ${C.primary}30` }}>
          {role === "sales"       && "👤 Create leads, assign designer, send quotes"}
          {role === "designer"    && "🎨 Only your assigned leads visible"}
          {role === "manager"     && "👔 Full control over all leads"}
          {role === "super_admin" && "🔑 Full access"}
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden"
          style={{ borderColor:C.border }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom:`1px solid ${C.border}`, background:C.cream }}>
                {["Customer","Contact","Progress","Assigned To","Budget","Actions"].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color:C.textLight }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-sm" style={{ color:C.textFaint }}>
                    {role === "designer"
                      ? "No leads assigned to you yet."
                      : "No leads found. Add your first lead!"}
                  </td>
                </tr>
              )}
              {leads.map(lead=>(
                <tr key={lead._id} style={{ borderBottom:`1px solid #FAF7F4` }}
                  className="hover:bg-[#FAF7F4]/60 transition-colors">

                  {/* Customer */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background:`linear-gradient(135deg,${C.primary},${C.accent})` }}>
                        {lead.customerName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color:C.darkest }}>{lead.customerName}</p>
                        {lead.email && <p className="text-xs" style={{ color:C.textFaint }}>{lead.email}</p>}
                        <span className="text-xs capitalize" style={{ color:C.textFaint }}>
                          {lead.leadSource?.replace(/_/g," ")}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-3.5 text-sm" style={{ color:C.textLight }}>{lead.phone}</td>

                  {/* Progress */}
                  <td className="px-4 py-3.5">
                    <WorkflowSteps status={lead.status}/>
                  </td>

                  {/* Assigned */}
                  <td className="px-4 py-3.5 text-xs" style={{ color:C.textLight }}>
                    {lead.assignedDesigner?.name && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-5 h-5 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                          style={{ background:"#10b981" }}>D</span>
                        {lead.assignedDesigner.name}
                      </div>
                    )}
                    {lead.assignedSales?.name && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                          style={{ background:C.primary }}>S</span>
                        {lead.assignedSales.name}
                      </div>
                    )}
                    {!lead.assignedDesigner && !lead.assignedSales && (
                      <span style={{ color:C.textFaint }}>—</span>
                    )}
                  </td>

                  {/* Budget */}
                  <td className="px-4 py-3.5 text-sm font-semibold" style={{ color:C.darkest }}>
                    {lead.budget ? `₹${Number(lead.budget).toLocaleString("en-IN")}` : "—"}
                  </td>

                  {/* ── Actions ── */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">

                      {/* ⭐ Status Update Icon → fixed popup */}
                      {!["won","lost"].includes(lead.status) && hasStatusActions(lead) && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setPopupPos({
                                top:   rect.bottom + 8,
                                right: window.innerWidth - rect.right,
                              });
                              setStatusPopup(statusPopup === lead._id ? null : lead._id);
                            }}
                            title="Update Status"
                            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                            style={{
                              background: statusPopup === lead._id
                                ? `linear-gradient(135deg,${C.primary},${C.accent})`
                                : `${C.primary}15`,
                              border:`1px solid ${C.primary}40`,
                              color: statusPopup === lead._id ? "white" : C.primary,
                            }}>
                            <ArrowRightCircle size={15}/>
                          </button>

                          {/* Popup renders fixed — not clipped by table overflow */}
                          {statusPopup === lead._id && (
                            <StatusPopup
                              lead={lead}
                              actions={myActions}
                              position={popupPos}
                              onSelect={(status) => handleStatusChange(lead._id, status)}
                              onClose={() => setStatusPopup(null)}
                            />
                          )}
                        </div>
                      )}

                      {/* Assign Designer — Sales + Manager */}
                      {showAssignBtn(lead) && (
                        <button onClick={() => openAssign(lead)}
                          title={lead.assignedDesigner ? "Reassign Designer" : "Assign Designer"}
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                          style={{
                            background: lead.assignedDesigner ? `${C.textFaint}15` : `${C.primary}15`,
                            border:     lead.assignedDesigner ? `1px solid ${C.border}` : `1px solid ${C.primary}40`,
                            color:      lead.assignedDesigner ? C.textLight : C.primary,
                          }}>
                          <UserPlus size={14}/>
                        </button>
                      )}

                      {/* Edit */}
                      {canAdd && !["won","lost"].includes(lead.status) && (
                        <button onClick={() => openEdit(lead)}
                          title="Edit Lead"
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                          style={{ background:`${C.textFaint}10`, border:`1px solid ${C.border}`, color:C.textFaint }}
                          onMouseEnter={e=>{
                            e.currentTarget.style.background=`${C.primary}15`;
                            e.currentTarget.style.color=C.primary;
                          }}
                          onMouseLeave={e=>{
                            e.currentTarget.style.background=`${C.textFaint}10`;
                            e.currentTarget.style.color=C.textFaint;
                          }}>
                          <Pencil size={13}/>
                        </button>
                      )}

                      {/* Delete */}
                      {canDelete && (
                        <button onClick={() => handleDelete(lead._id)}
                          title="Delete Lead"
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                          style={{ background:`${C.textFaint}10`, border:`1px solid ${C.border}`, color:C.textFaint }}
                          onMouseEnter={e=>{
                            e.currentTarget.style.background="#C0392B15";
                            e.currentTarget.style.color="#C0392B";
                          }}
                          onMouseLeave={e=>{
                            e.currentTarget.style.background=`${C.textFaint}10`;
                            e.currentTarget.style.color=C.textFaint;
                          }}>
                          <Trash2 size={13}/>
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

      {/* ── Add/Edit Modal ── */}
      <Modal isOpen={modal==="add"||modal==="edit"} onClose={()=>setModal(null)}
        title={modal==="add" ? "Add New Lead" : "Edit Lead"} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Customer Name" required>
            <Input value={form.customerName||""} onChange={e=>setForm({...form,customerName:e.target.value})} placeholder="Full name"/>
          </FormField>
          <FormField label="Phone" required>
            <Input value={form.phone||""} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="9876543210"/>
          </FormField>
          <FormField label="Email">
            <Input type="email" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@example.com"/>
          </FormField>
          <FormField label="Lead Source">
            <Select value={form.leadSource||"website"} onChange={e=>setForm({...form,leadSource:e.target.value})}>
              {SOURCES.map(s=><option key={s} value={s}>{s.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase())}</option>)}
            </Select>
          </FormField>
          <FormField label="Budget (₹)">
            <Input type="number" value={form.budget||""} onChange={e=>setForm({...form,budget:e.target.value})} placeholder="500000"/>
          </FormField>
          <FormField label="Project Type">
            <Input value={form.projectType||""} onChange={e=>setForm({...form,projectType:e.target.value})} placeholder="Residential, Commercial..."/>
          </FormField>
          <div className="col-span-2">
            <FormField label="Address">
              <Input value={form.address||""} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Full address"/>
            </FormField>
          </div>
          <div className="col-span-2">
            <FormField label="Notes">
              <Textarea rows={3} value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Any notes..."/>
            </FormField>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t" style={{ borderColor:C.border }}>
          <Button variant="secondary" onClick={()=>setModal(null)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : modal==="add" ? "Add Lead" : "Save Changes"}
          </Button>
        </div>
      </Modal>

      {/* ── Assign Designer Modal ── */}
      <Modal isOpen={modal==="assign"} onClose={()=>setModal(null)}
        title="Assign Designer for Site Visit" size="sm">
        <div className="p-3 rounded-xl mb-4 text-xs"
          style={{ background:`${C.primary}12`, border:`1px solid ${C.primary}25`, color:C.primary }}>
          📋 Assigning a designer will automatically set status to <strong>Site Visit</strong>
        </div>
        <div className="space-y-4">
          <FormField label="Select Designer" required>
            <Select value={form.assignedDesigner||""} onChange={e=>setForm({...form,assignedDesigner:e.target.value})}>
              <option value="">— Choose Designer —</option>
              {designers.map(u=><option key={u._id} value={u._id}>{u.name}</option>)}
            </Select>
          </FormField>
          {["super_admin","manager"].includes(role) && (
            <FormField label="Sales Employee">
              <Select value={form.assignedSales||""} onChange={e=>setForm({...form,assignedSales:e.target.value})}>
                <option value="">— Choose Sales —</option>
                {salesTeam.map(u=><option key={u._id} value={u._id}>{u.name}</option>)}
              </Select>
            </FormField>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t" style={{ borderColor:C.border }}>
          <Button variant="secondary" onClick={()=>setModal(null)}>Cancel</Button>
          <Button onClick={handleAssign} disabled={saving}>
            {saving ? "Assigning..." : "Assign Designer →"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}