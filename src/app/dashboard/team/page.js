"use client";
import { useEffect, useState, useCallback } from "react";
import { usersAPI, authAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { PageHeader, Button, Modal, FormField, Input, Select, Spinner } from "@/components/ui";
import { Plus } from "lucide-react";

const ROLE_COLOR = { super_admin:"#C8974A", manager:"#8B6914", sales:"#6B8E4E", designer:"#7B6BB5" };
const ROLE_LABEL = { super_admin:"Super Admin", manager:"Manager", sales:"Sales", designer:"Designer" };

export default function TeamPage() {
  const { user }     = useAuth();
  const { addToast } = useToast();
  const [team,    setTeam]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [formErr, setFormErr] = useState("");
  const [form,    setForm]    = useState({ name:"", email:"", password:"", role:"sales" });

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usersAPI.getAll();
      setTeam(data.users || []);
    } catch(e) {
      addToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  async function handleCreate() {
    if (!form.name || !form.email || !form.password) {
      setFormErr("All fields are required.");
      return;
    }
    setSaving(true);
    setFormErr("");
    try {
      if (form.role === "manager") {
        await authAPI.createManager(form);
      } else {
        await authAPI.createEmployee(form);
      }
      addToast(`${ROLE_LABEL[form.role]} account created successfully! 🎉`, "success");
      setModal(false);
      fetchTeam();
    } catch(e) {
      setFormErr(e.message);
      addToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  const grouped = {
    manager:  team.filter(u => u.role === "manager"),
    sales:    team.filter(u => u.role === "sales"),
    designer: team.filter(u => u.role === "designer"),
  };

  const roleOptions = user?.role === "super_admin"
    ? [{ value:"manager",label:"Manager" },{ value:"sales",label:"Sales Employee" },{ value:"designer",label:"Designer" }]
    : [{ value:"sales",label:"Sales Employee" },{ value:"designer",label:"Designer" }];

  return (
    <div className="p-8 page-enter">
      <PageHeader
        title="Team"
        subtitle={`${team.length} members`}
        action={
          <Button onClick={()=>{ setForm({name:"",email:"",password:"",role:"sales"}); setFormErr(""); setModal(true); }}>
            <Plus size={16}/> Add Member
          </Button>
        }
      />

      {loading ? <Spinner /> : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([role, members]) => members.length > 0 && (
            <div key={role}>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"
                style={{ color:ROLE_COLOR[role] }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ background:ROLE_COLOR[role] }}/>
                {ROLE_LABEL[role]}s ({members.length})
              </h2>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {members.map(member=>(
                  <div key={member._id}
                    className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4 card-hover">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                      style={{ background:`linear-gradient(135deg,${ROLE_COLOR[member.role]},${ROLE_COLOR[member.role]}AA)` }}>
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{member.name}</p>
                      <p className="text-slate-400 text-xs truncate">{member.email}</p>
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background:`${ROLE_COLOR[member.role]}15`, color:ROLE_COLOR[member.role] }}>
                        {ROLE_LABEL[member.role]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {team.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
              <p className="text-slate-400 text-sm">No team members yet. Add your first member!</p>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modal} onClose={()=>setModal(false)} title="Add Team Member" size="sm">
        <div className="space-y-4">
          {formErr && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">
              {formErr}
            </div>
          )}
          <FormField label="Full Name" required>
            <Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Full name"/>
          </FormField>
          <FormField label="Email" required>
            <Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@studio.com"/>
          </FormField>
          <FormField label="Password" required hint="Minimum 6 characters">
            <Input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="••••••••"/>
          </FormField>
          <FormField label="Role" required>
            <Select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
              {roleOptions.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
          </FormField>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={()=>setModal(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}>{saving?"Creating...":"Create Account"}</Button>
        </div>
      </Modal>
    </div>
  );
}