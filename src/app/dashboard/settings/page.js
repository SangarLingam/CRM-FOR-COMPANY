"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { PageHeader, Button, FormField } from "@/components/ui";
import { User, Lock, Ticket } from "lucide-react";

const C = {
  primary:"#C8974A", accent:"#D4A85A", darkest:"#2C1A0E",
  darker:"#3D2410", textLight:"#9C7A5A", textFaint:"#C4A882",
  border:"#E8DDD0", cream:"#FAF7F4", gold:"#F0C060",
};

const PRIORITY_COLOR = {
  low:    { bg:"#E9F7EF", text:"#1E8449" },
  medium: { bg:"#FEF9E7", text:"#B7770D" },
  high:   { bg:"#FDEDEC", text:"#C0392B" },
};
const STATUS_COLOR = {
  open:        { bg:"#EAF2FF", text:"#1565C0" },
  in_progress: { bg:"#FEF9E7", text:"#B7770D" },
  escalated:   { bg:"#FDEDEC", text:"#C0392B" },
  resolved:    { bg:"#E9F7EF", text:"#1E8449" },
};

// ✅ FIX: Read token from cookie (not localStorage — token is stored in cookie)
function getTokenFromCookie() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? match[1] : "";
}

// ✅ Build auth headers — tries cookie token first, falls back to localStorage
function authHeaders(extra = {}) {
  const cookieToken = getTokenFromCookie();
  const lsToken     = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  const token       = cookieToken || lsToken || "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export default function SettingsPage() {
  const { user }     = useAuth();
  const { addToast } = useToast();

  const [tab,         setTab]        = useState("profile");
  // ✅ FIX: always initialize with "" so inputs are never "uncontrolled"
  const [profile,     setProfile]    = useState({ name:"", email:"", phone:"" });
  const [pwForm,      setPwForm]     = useState({ currentPassword:"", newPassword:"", confirmPassword:"" });
  const [tickets,     setTickets]    = useState([]);
  const [newTicket,   setNewTicket]  = useState({ title:"", description:"", priority:"medium" });
  const [loading,     setLoading]    = useState(false);
  const [ticketLoad,  setTicketLoad] = useState(false);
  const [actionModal, setActionModal]= useState(null);
  const [actionNote,  setActionNote] = useState("");

  useEffect(() => {
    setProfile({
      name:  user?.name  || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
  }, [user]);

  useEffect(() => {
    if (tab === "tickets") fetchTickets();
  }, [tab]);

  // ── Fetch Tickets ──────────────────────────────────
  async function fetchTickets() {
    setTicketLoad(true);
    try {
      const res  = await fetch("/api/tickets", {
        cache: "no-store",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load tickets");
      setTickets(data.tickets || []);
    } catch(e) {
      addToast(e.message, "error");
    } finally {
      setTicketLoad(false);
    }
  }

  // ── Profile Save ───────────────────────────────────
  async function handleProfileSave() {
    if (!profile.name) { addToast("Name is required", "warning"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ name:profile.name, phone:profile.phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addToast("Profile updated successfully!", "success");
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, name:profile.name }));
    } catch(e) {
      addToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  // ── Password Save ──────────────────────────────────
  async function handlePasswordSave() {
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      addToast("All fields are required", "warning"); return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      addToast("New passwords do not match", "error"); return;
    }
    if (pwForm.newPassword.length < 6) {
      addToast("Password must be at least 6 characters", "warning"); return;
    }
    setLoading(true);
    try {
      const res  = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ currentPassword:pwForm.currentPassword, newPassword:pwForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addToast("Password updated successfully! 🔐", "success");
      setPwForm({ currentPassword:"", newPassword:"", confirmPassword:"" });
    } catch(e) {
      addToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  // ── Raise Ticket ───────────────────────────────────
  async function handleRaiseTicket() {
    if (!newTicket.title || !newTicket.description) {
      addToast("Title and description are required", "warning"); return;
    }
    setLoading(true);
    try {
      const res  = await fetch("/api/tickets", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(newTicket),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addToast("Ticket raised successfully! 🎫", "success");
      setNewTicket({ title:"", description:"", priority:"medium" });
      fetchTickets();
    } catch(e) {
      addToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  // ── Ticket Action (manager / super_admin) ──────────
  async function handleTicketAction() {
    if (!actionModal) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/tickets/${actionModal.ticket._id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ action:actionModal.action, note:actionNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const msgs = {
        in_progress: "Ticket marked in progress!",
        escalate:    "Ticket escalated to Super Admin! ⬆️",
        resolve:     "Ticket resolved! ✅",
      };
      addToast(msgs[actionModal.action] || "Done!", "success");
      setActionModal(null);
      setActionNote("");
      fetchTickets();
    } catch(e) {
      addToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  const isManager    = ["super_admin","manager"].includes(user?.role);
  const isSuperAdmin = user?.role === "super_admin";

  const ROLE_COLOR = {
    super_admin:"#C8974A", manager:"#8B6914",
    sales:"#6B8E4E", designer:"#7B6BB5",
  };
  const ROLE_LABEL = {
    super_admin:"Super Admin", manager:"Manager",
    sales:"Sales", designer:"Designer",
  };

  const TABS = [
    { key:"profile",  label:"Profile",  icon:User   },
    { key:"password", label:"Password", icon:Lock   },
    { key:"tickets",  label:"Tickets",  icon:Ticket },
  ];

  return (
    <div className="p-8 page-enter" style={{ background:C.cream, minHeight:"100vh" }}>
      <PageHeader title="Settings" subtitle="Manage your account"/>

      <div className="flex gap-6">

        {/* ── Tab Sidebar ── */}
        <div className="w-52 flex-shrink-0">
          <div className="rounded-2xl overflow-hidden"
            style={{ background:`linear-gradient(135deg,${C.darkest},${C.darker})`,
              border:`1px solid ${C.primary}25` }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-left transition-all"
                style={tab === t.key
                  ? { background:`linear-gradient(135deg,${C.primary}30,${C.accent}20)`,
                      borderLeft:`3px solid ${C.primary}`, color:"white" }
                  : { color:C.textFaint, borderLeft:"3px solid transparent" }}>
                <t.icon size={16} color={tab === t.key ? C.accent : C.textFaint}/>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="flex-1">

          {/* ── PROFILE TAB ── */}
          {tab === "profile" && (
            <div className="rounded-2xl p-6"
              style={{ background:`linear-gradient(135deg,${C.darkest},${C.darker})`,
                border:`1px solid ${C.primary}25` }}>
              <h2 className="font-bold font-display text-lg mb-6" style={{ color:"white" }}>
                My Profile
              </h2>
              <div className="flex items-center gap-4 mb-6 pb-6"
                style={{ borderBottom:`1px solid ${C.primary}20` }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
                  style={{ background:`linear-gradient(135deg,${C.primary},${C.accent})`,
                    boxShadow:`0 8px 25px ${C.primary}50` }}>
                  {user?.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-lg" style={{ color:"white" }}>{user?.name}</p>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ background:`${ROLE_COLOR[user?.role]}25`, color:ROLE_COLOR[user?.role] }}>
                    {ROLE_LABEL[user?.role]}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Full Name">
                  <input value={profile.name}
                    onChange={e => setProfile({...profile, name:e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background:"rgba(255,255,255,0.08)", border:`1px solid ${C.primary}30`, color:"white" }}
                    onFocus={e  => e.target.style.borderColor = C.primary}
                    onBlur={e   => e.target.style.borderColor = `${C.primary}30`}/>
                </FormField>
                <FormField label="Email (cannot change)">
                  <input value={profile.email} disabled
                    className="w-full px-4 py-2.5 rounded-xl text-sm"
                    style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${C.primary}15`,
                      color:C.textFaint, cursor:"not-allowed" }}/>
                </FormField>
                <FormField label="Phone">
                  <input value={profile.phone}
                    onChange={e => setProfile({...profile, phone:e.target.value})}
                    placeholder="9876543210"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background:"rgba(255,255,255,0.08)", border:`1px solid ${C.primary}30`, color:"white" }}
                    onFocus={e  => e.target.style.borderColor = C.primary}
                    onBlur={e   => e.target.style.borderColor = `${C.primary}30`}/>
                </FormField>
                <FormField label="Role">
                  <input value={ROLE_LABEL[user?.role]} disabled
                    className="w-full px-4 py-2.5 rounded-xl text-sm"
                    style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${C.primary}15`,
                      color:C.textFaint, cursor:"not-allowed" }}/>
                </FormField>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={handleProfileSave} disabled={loading}>
                  {loading ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </div>
          )}

          {/* ── PASSWORD TAB ── */}
          {tab === "password" && (
            <div className="rounded-2xl p-6"
              style={{ background:`linear-gradient(135deg,${C.darkest},${C.darker})`,
                border:`1px solid ${C.primary}25` }}>
              <h2 className="font-bold font-display text-lg mb-6" style={{ color:"white" }}>
                Change Password
              </h2>
              <div className="max-w-sm space-y-4">
                {[
                  { label:"Current Password",     key:"currentPassword"  },
                  { label:"New Password",          key:"newPassword"      },
                  { label:"Confirm New Password",  key:"confirmPassword"  },
                ].map(f => (
                  <FormField key={f.key} label={f.label}>
                    <input type="password"
                      value={pwForm[f.key]}
                      onChange={e => setPwForm({...pwForm, [f.key]:e.target.value})}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background:"rgba(255,255,255,0.08)", border:`1px solid ${C.primary}30`, color:"white" }}
                      onFocus={e => e.target.style.borderColor = C.primary}
                      onBlur={e  => e.target.style.borderColor = `${C.primary}30`}/>
                  </FormField>
                ))}
                <div className="p-3 rounded-xl text-xs"
                  style={{ background:`${C.primary}12`, border:`1px solid ${C.primary}25` }}>
                  <p style={{ color:C.accent }}>🔐 Password requirements:</p>
                  <p style={{ color:C.textFaint }} className="mt-1">• Minimum 6 characters</p>
                </div>
                <Button onClick={handlePasswordSave} disabled={loading}>
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </div>
          )}

          {/* ── TICKETS TAB ── */}
          {tab === "tickets" && (
            <div className="space-y-5">

              {/* Raise ticket — only sales/designer */}
              {["sales","designer"].includes(user?.role) && (
                <div className="rounded-2xl p-6"
                  style={{ background:`linear-gradient(135deg,${C.darkest},${C.darker})`,
                    border:`1px solid ${C.primary}25` }}>
                  <h2 className="font-bold font-display text-lg mb-5" style={{ color:"white" }}>
                    🎫 Raise New Ticket
                  </h2>
                  <div className="space-y-4">
                    <FormField label="Title">
                      <input value={newTicket.title}
                        onChange={e => setNewTicket({...newTicket, title:e.target.value})}
                        placeholder="Brief issue title..."
                        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background:"rgba(255,255,255,0.08)", border:`1px solid ${C.primary}30`, color:"white" }}
                        onFocus={e => e.target.style.borderColor = C.primary}
                        onBlur={e  => e.target.style.borderColor = `${C.primary}30`}/>
                    </FormField>
                    <FormField label="Description">
                      <textarea rows={3} value={newTicket.description}
                        onChange={e => setNewTicket({...newTicket, description:e.target.value})}
                        placeholder="Describe your issue in detail..."
                        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                        style={{ background:"rgba(255,255,255,0.08)", border:`1px solid ${C.primary}30`, color:"white" }}
                        onFocus={e => e.target.style.borderColor = C.primary}
                        onBlur={e  => e.target.style.borderColor = `${C.primary}30`}/>
                    </FormField>
                    <FormField label="Priority">
                      <select value={newTicket.priority}
                        onChange={e => setNewTicket({...newTicket, priority:e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background:"rgba(255,255,255,0.08)", border:`1px solid ${C.primary}30`, color:"white" }}>
                        <option value="low"    style={{ background:C.darkest }}>🟢 Low</option>
                        <option value="medium" style={{ background:C.darkest }}>🟡 Medium</option>
                        <option value="high"   style={{ background:C.darkest }}>🔴 High</option>
                      </select>
                    </FormField>
                    <Button onClick={handleRaiseTicket} disabled={loading}>
                      {loading ? "Raising..." : "Raise Ticket →"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Tickets List */}
              <div className="rounded-2xl overflow-hidden"
                style={{ background:`linear-gradient(135deg,${C.darkest},${C.darker})`,
                  border:`1px solid ${C.primary}25` }}>
                <div className="px-6 py-4" style={{ borderBottom:`1px solid ${C.primary}20` }}>
                  <h2 className="font-bold font-display" style={{ color:"white" }}>
                    {isManager ? (isSuperAdmin ? "Escalated Tickets" : "Team Tickets") : "My Tickets"}
                  </h2>
                </div>

                {ticketLoad ? (
                  <div className="py-12 flex justify-center">
                    <div className="w-8 h-8 rounded-full border-4 animate-spin"
                      style={{ borderColor:`${C.primary}30`, borderTopColor:C.primary }}/>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-3xl mb-2">🎉</p>
                    <p className="text-sm" style={{ color:C.textFaint }}>No tickets found!</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor:`${C.primary}12` }}>
                    {tickets.map(ticket => {
                      const pc = PRIORITY_COLOR[ticket.priority] || PRIORITY_COLOR.medium;
                      const sc = STATUS_COLOR[ticket.status]     || STATUS_COLOR.open;
                      return (
                        <div key={ticket._id} className="px-6 py-4 hover:bg-white/5 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <p className="font-semibold text-sm" style={{ color:"white" }}>{ticket.title}</p>
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{ background:pc.bg, color:pc.text }}>
                                  {ticket.priority}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{ background:sc.bg, color:sc.text }}>
                                  {ticket.status.replace(/_/g," ")}
                                </span>
                              </div>
                              <p className="text-xs mb-2" style={{ color:C.textFaint }}>{ticket.description}</p>
                              {ticket.raisedByName && (
                                <p className="text-xs" style={{ color:C.textFaint }}>
                                  By: <span style={{ color:C.accent }}>{ticket.raisedByName}</span>
                                  {" · "}{new Date(ticket.createdAt).toLocaleDateString("en-IN")}
                                </p>
                              )}
                              {ticket.managerNote && (
                                <p className="text-xs mt-1 px-3 py-1.5 rounded-lg"
                                  style={{ background:`${C.primary}12`, color:C.accent }}>
                                  📝 Manager: {ticket.managerNote}
                                </p>
                              )}
                              {ticket.adminNote && (
                                <p className="text-xs mt-1 px-3 py-1.5 rounded-lg"
                                  style={{ background:"#1E844920", color:"#2D7A4F" }}>
                                  ✅ Admin: {ticket.adminNote}
                                </p>
                              )}
                            </div>

                            {/* ✅ FIX: was `caller?.role` (undefined) — now correctly uses `user?.role` */}
                            {ticket.status !== "resolved" && (
                              <div className="flex flex-col gap-1.5 flex-shrink-0">
                                {user?.role === "manager" && ticket.status === "open" && (
                                  <button
                                    onClick={() => { setActionModal({ticket, action:"in_progress"}); setActionNote(""); }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                    style={{ background:`${C.primary}20`, color:C.accent }}>
                                    In Progress
                                  </button>
                                )}
                                {user?.role === "manager" && ["open","in_progress"].includes(ticket.status) && (
                                  <>
                                    <button
                                      onClick={() => { setActionModal({ticket, action:"escalate"}); setActionNote(""); }}
                                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                      style={{ background:"#C0392B20", color:"#C0392B" }}>
                                      ⬆ Escalate
                                    </button>
                                    <button
                                      onClick={() => { setActionModal({ticket, action:"resolve"}); setActionNote(""); }}
                                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                      style={{ background:"#1E844920", color:"#2D7A4F" }}>
                                      ✅ Resolve
                                    </button>
                                  </>
                                )}
                                {user?.role === "super_admin" && ticket.status === "escalated" && (
                                  <button
                                    onClick={() => { setActionModal({ticket, action:"resolve"}); setActionNote(""); }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                    style={{ background:"#1E844920", color:"#2D7A4F" }}>
                                    ✅ Resolve
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Action Modal ── */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:"rgba(28,15,5,0.7)", backdropFilter:"blur(4px)" }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden modal-enter"
            style={{ background:`linear-gradient(135deg,${C.darkest},${C.darker})`,
              border:`1px solid ${C.primary}40`,
              boxShadow:`0 25px 80px rgba(44,26,14,0.5)` }}>
            <div className="px-5 py-4" style={{ borderBottom:`1px solid ${C.primary}20` }}>
              <p className="font-bold font-display" style={{ color:"white" }}>
                {actionModal.action === "escalate"   ? "⬆ Escalate to Super Admin"
                  : actionModal.action === "resolve" ? "✅ Resolve Ticket"
                  : "Mark In Progress"}
              </p>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs" style={{ color:C.textFaint }}>
                Ticket: <span style={{ color:C.accent }}>{actionModal.ticket.title}</span>
              </p>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color:C.textFaint }}>
                  {actionModal.action === "escalate" ? "Reason for escalation" : "Resolution note"}
                </label>
                <textarea rows={3} value={actionNote}
                  onChange={e => setActionNote(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background:"rgba(255,255,255,0.08)", border:`1px solid ${C.primary}30`, color:"white" }}/>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setActionModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ background:"rgba(255,255,255,0.06)", color:C.textFaint }}>
                  Cancel
                </button>
                <button onClick={handleTicketAction} disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all text-white"
                  style={{ background:`linear-gradient(135deg,${C.primary},${C.accent})` }}>
                  {loading ? "Saving..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}