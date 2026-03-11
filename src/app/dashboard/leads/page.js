"use client";
import { useEffect, useState, useCallback } from "react";
import { leadsAPI, usersAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { PageHeader, StatusBadge, Button, Modal, FormField, Input, Select, Textarea, Spinner } from "@/components/ui";
import { Plus, Pencil, Trash2, UserPlus, CheckCircle } from "lucide-react";

const STATUSES = ["new","contacted","site_visit","quote_sent","won","lost"];
const SOURCES  = ["website","referral","social_media","walk_in","other"];
const EMPTY    = { customerName:"",phone:"",email:"",address:"",leadSource:"website",notes:"",budget:"",projectType:"" };

export default function LeadsPage() {
  const { user }        = useAuth();
  const { addToast }    = useToast();
  const [leads,        setLeads]       = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [search,       setSearch]      = useState("");
  const [filter,       setFilter]      = useState("");
  const [modal,        setModal]       = useState(null);
  const [selected,     setSelected]    = useState(null);
  const [form,         setForm]        = useState(EMPTY);
  const [saving,       setSaving]      = useState(false);
  const [designers,    setDesigners]   = useState([]);
  const [salesTeam,    setSalesTeam]   = useState([]);

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

  function openAdd()     { setForm(EMPTY); setModal("add"); }
  function openEdit(l)   { setSelected(l); setForm({...l, budget:l.budget||""}); setModal("edit"); }
  function openStatus(l) { setSelected(l); setModal("status"); }
  function openAssign(l) {
    setSelected(l);
    setForm({ assignedSales:l.assignedSales?._id||"", assignedDesigner:l.assignedDesigner?._id||"" });
    setModal("assign");
  }

  async function handleSave() {
    if (!form.customerName) { addToast("Customer name is required", "warning"); return; }
    if (!form.phone)         { addToast("Phone number is required",  "warning"); return; }
    setSaving(true);
    try {
      if (modal === "add") {
        await leadsAPI.create(form);
        addToast("Lead added successfully!", "success");
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

  async function handleStatusChange(status) {
    try {
      const res = await leadsAPI.updateStatus(selected._id, status);
      addToast(res.message || "Status updated!", "success");
      setModal(null);
      fetchLeads();
    } catch(e) {
      addToast(e.message, "error");
    }
  }

  async function handleAssign() {
    setSaving(true);
    try {
      await leadsAPI.assign(selected._id, {
        assignedSales:    form.assignedSales    || null,
        assignedDesigner: form.assignedDesigner || null,
      });
      addToast("Lead assigned successfully!", "success");
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

  const canManage = ["super_admin","manager"].includes(user?.role);

  return (
    <div className="p-8 page-enter">
      <PageHeader
        title="Leads"
        subtitle={`${leads.length} leads`}
        action={<Button onClick={openAdd}><Plus size={16}/> Add Lead</Button>}
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input placeholder="Search name or phone..."
          value={search} onChange={e=>setSearch(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white w-64"/>
        <select value={filter} onChange={e=>setFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white">
          <option value="">All Statuses</option>
          {STATUSES.map(s=>(
            <option key={s} value={s}>
              {s.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Customer","Contact","Source","Status","Assigned","Budget","Actions"].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr><td colSpan={7} className="text-center py-16 text-slate-400 text-sm">No leads found. Add your first lead!</td></tr>
              )}
              {leads.map(lead=>(
                <tr key={lead._id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ background:"linear-gradient(135deg,#C8974A,#D4A85A)" }}>
                        {lead.customerName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{lead.customerName}</p>
                        {lead.email && <p className="text-slate-400 text-xs">{lead.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 text-sm">{lead.phone}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-lg capitalize">
                      {lead.leadSource?.replace(/_/g," ")}
                    </span>
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge status={lead.status}/></td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">
                    {lead.assignedDesigner?.name && <p>🎨 {lead.assignedDesigner.name}</p>}
                    {lead.assignedSales?.name    && <p>📞 {lead.assignedSales.name}</p>}
                    {!lead.assignedDesigner && !lead.assignedSales && <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">
                    {lead.budget ? `₹${Number(lead.budget).toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={()=>openStatus(lead)}
                        className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-400 transition-colors" title="Status">
                        <CheckCircle size={14}/>
                      </button>
                      {canManage && (
                        <button onClick={()=>openAssign(lead)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 transition-colors" title="Assign">
                          <UserPlus size={14}/>
                        </button>
                      )}
                      <button onClick={()=>openEdit(lead)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors" title="Edit">
                        <Pencil size={14}/>
                      </button>
                      {canManage && (
                        <button onClick={()=>handleDelete(lead._id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors" title="Delete">
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
      <Modal isOpen={modal==="add"||modal==="edit"} onClose={()=>setModal(null)}
        title={modal==="add"?"Add New Lead":"Edit Lead"} size="lg">
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
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={()=>setModal(null)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving?"Saving...":modal==="add"?"Add Lead":"Save Changes"}</Button>
        </div>
      </Modal>

      {/* Status Modal */}
      <Modal isOpen={modal==="status"} onClose={()=>setModal(null)} title="Change Status" size="sm">
        <p className="text-slate-500 text-sm mb-4">Current: <StatusBadge status={selected?.status||"new"}/></p>
        <div className="grid grid-cols-2 gap-2">
          {STATUSES.map(s=>(
            <button key={s} onClick={()=>handleStatusChange(s)}
              className={`py-2.5 px-3 rounded-xl text-sm font-medium text-left hover:opacity-80 badge-${s}`}>
              {s.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase())}
            </button>
          ))}
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={modal==="assign"} onClose={()=>setModal(null)} title="Assign Lead" size="sm">
        <div className="space-y-4">
          <FormField label="Sales Employee">
            <Select value={form.assignedSales||""} onChange={e=>setForm({...form,assignedSales:e.target.value})}>
              <option value="">— Select Sales —</option>
              {salesTeam.map(u=><option key={u._id} value={u._id}>{u.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Designer">
            <Select value={form.assignedDesigner||""} onChange={e=>setForm({...form,assignedDesigner:e.target.value})}>
              <option value="">— Select Designer —</option>
              {designers.map(u=><option key={u._id} value={u._id}>{u.name}</option>)}
            </Select>
          </FormField>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={()=>setModal(null)}>Cancel</Button>
          <Button onClick={handleAssign} disabled={saving}>{saving?"Saving...":"Assign"}</Button>
        </div>
      </Modal>
    </div>
  );
}