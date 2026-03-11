"use client";
import { useEffect, useState, useCallback } from "react";
import { projectsAPI, usersAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { PageHeader, StatusBadge, Button, Modal, FormField, Input, Select, Textarea, Spinner } from "@/components/ui";
import { Pencil } from "lucide-react";

const STATUSES     = ["planning","design","in_progress","completed"];
const STATUS_ICONS = { planning:"📋", design:"🎨", in_progress:"🔨", completed:"✅" };

export default function ProjectsPage() {
  const { user }      = useAuth();
  const { addToast }  = useToast();
  const [projects,   setProjects]  = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [filter,     setFilter]    = useState("");
  const [modal,      setModal]     = useState(false);
  const [selected,   setSelected]  = useState(null);
  const [form,       setForm]      = useState({});
  const [saving,     setSaving]    = useState(false);
  const [designers,  setDesigners] = useState([]);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.status = filter;
      const data = await projectsAPI.getAll(params);
      setProjects(data.projects || []);
    } catch(e) {
      addToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  useEffect(() => {
    usersAPI.getAll("designer").then(d => setDesigners(d.users || []));
  }, []);

  function openEdit(p) {
    setSelected(p);
    setForm({
      projectName: p.projectName,
      status:      p.status,
      designerId:  p.designerId?._id || "",
      description: p.description    || "",
      startDate:   p.startDate?.slice(0,10) || "",
      endDate:     p.endDate?.slice(0,10)   || "",
      totalBudget: p.totalBudget || "",
    });
    setModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await projectsAPI.update(selected._id, form);
      addToast("Project updated successfully!", "success");
      setModal(false);
      fetchProjects();
    } catch(e) {
      addToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  const fmt = n => n ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

  return (
    <div className="p-8 page-enter">
      <PageHeader title="Projects" subtitle={`${projects.length} projects`}/>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["", ...STATUSES].map(s=>(
          <button key={s} onClick={()=>setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${filter===s ? "text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            style={filter===s ? { background:"linear-gradient(135deg,#C8974A,#D4A85A)" } : {}}>
            {s ? `${STATUS_ICONS[s]} ${s.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase())}` : "All Projects"}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.length === 0 && (
            <div className="col-span-3 bg-white rounded-2xl p-12 text-center border border-slate-100">
              <p className="text-slate-400 text-sm">No projects yet. Projects are created automatically when a lead is marked as Won.</p>
            </div>
          )}
          {projects.map(project=>(
            <div key={project._id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 pr-2">
                  <h3 className="font-semibold text-slate-800 text-sm leading-snug">{project.projectName}</h3>
                  <p className="text-slate-400 text-xs mt-0.5">{project.customerId?.name}</p>
                </div>
                <StatusBadge status={project.status}/>
              </div>
              <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                {project.designerId?.name && <p>🎨 {project.designerId.name}</p>}
                {project.startDate && (
                  <p>📅 {new Date(project.startDate).toLocaleDateString("en-IN")}
                    {project.endDate && ` → ${new Date(project.endDate).toLocaleDateString("en-IN")}`}
                  </p>
                )}
                <p>💰 {fmt(project.totalBudget)}</p>
                {project.description && <p className="text-slate-400 truncate">📝 {project.description}</p>}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <div className="flex items-center gap-1.5">
                  {STATUSES.map((s,i)=>(
                    <div key={s} className="h-2 rounded-full transition-all"
                      style={{
                        width: STATUSES.indexOf(project.status) >= i ? "20px" : "8px",
                        background: STATUSES.indexOf(project.status) >= i ? "#C8974A" : "#e2e8f0",
                      }}/>
                  ))}
                </div>
                <button onClick={()=>openEdit(project)}
                  className="flex items-center gap-1 text-sm font-medium hover:underline"
                  style={{ color:"#C8974A" }}>
                  <Pencil size={11}/> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Modal isOpen={modal} onClose={()=>setModal(false)} title="Update Project" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField label="Project Name" required>
              <Input value={form.projectName||""} onChange={e=>setForm({...form,projectName:e.target.value})}/>
            </FormField>
          </div>
          <FormField label="Status">
            <Select value={form.status||""} onChange={e=>setForm({...form,status:e.target.value})}>
              {STATUSES.map(s=>(
                <option key={s} value={s}>{s.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase())}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Designer">
            <Select value={form.designerId||""} onChange={e=>setForm({...form,designerId:e.target.value})}>
              <option value="">— Select Designer —</option>
              {designers.map(d=><option key={d._id} value={d._id}>{d.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Start Date">
            <Input type="date" value={form.startDate||""} onChange={e=>setForm({...form,startDate:e.target.value})}/>
          </FormField>
          <FormField label="End Date">
            <Input type="date" value={form.endDate||""} onChange={e=>setForm({...form,endDate:e.target.value})}/>
          </FormField>
          <FormField label="Total Budget (₹)">
            <Input type="number" value={form.totalBudget||""} onChange={e=>setForm({...form,totalBudget:e.target.value})}/>
          </FormField>
          <div className="col-span-2">
            <FormField label="Description">
              <Textarea rows={2} value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})}/>
            </FormField>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={()=>setModal(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving?"Saving...":"Save Changes"}</Button>
        </div>
      </Modal>
    </div>
  );
}