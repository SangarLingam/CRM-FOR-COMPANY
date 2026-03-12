const BASE = "";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function apiFetch(url, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

// ─── AUTH ─────────────────────────────────────────
export const authAPI = {
  login:          (body) => apiFetch("/api/auth/login",           { method:"POST", body:JSON.stringify(body) }),
  createManager:  (body) => apiFetch("/api/auth/create-manager",  { method:"POST", body:JSON.stringify(body) }),
  createEmployee: (body) => apiFetch("/api/auth/create-employee", { method:"POST", body:JSON.stringify(body) }),
};

// ─── USERS ────────────────────────────────────────
export const usersAPI = {
  getAll: (role) => apiFetch(`/api/users${role ? `?role=${role}` : ""}`),
};

// ─── LEADS ────────────────────────────────────────
export const leadsAPI = {
  getAll:       (params={}) => { const q = new URLSearchParams(params).toString(); return apiFetch(`/api/leads${q?`?${q}`:""}`); },
  create:       (body)      => apiFetch("/api/leads",                   { method:"POST",  body:JSON.stringify(body) }),
  update:       (id,body)   => apiFetch(`/api/leads/${id}`,             { method:"PATCH", body:JSON.stringify(body) }),
  delete:       (id)        => apiFetch(`/api/leads/${id}`,             { method:"DELETE" }),
  updateStatus: (id,status) => apiFetch(`/api/leads/${id}/status`,      { method:"PATCH", body:JSON.stringify({ status }) }),
  assign:       (id,body)   => apiFetch(`/api/leads/${id}/assign`,      { method:"PATCH", body:JSON.stringify(body) }),
  addActivity:  (id,body)   => apiFetch(`/api/leads/${id}/activity`,    { method:"POST",  body:JSON.stringify(body) }),
};

// ─── PROJECTS ─────────────────────────────────────
export const projectsAPI = {
  getAll:           (params={}) => { const q = new URLSearchParams(params).toString(); return apiFetch(`/api/projects${q?`?${q}`:""}`); },
  getOne:           (id)        => apiFetch(`/api/projects/${id}`),
  create:           (body)      => apiFetch("/api/projects",                      { method:"POST",  body:JSON.stringify(body) }),
  update:           (id,body)   => apiFetch(`/api/projects/${id}`,                { method:"PATCH", body:JSON.stringify(body) }),
  addMilestone:     (id,body)   => apiFetch(`/api/projects/${id}/milestones`,     { method:"POST",  body:JSON.stringify(body) }),
  updateMilestone:  (id,body)   => apiFetch(`/api/projects/${id}/milestones`,     { method:"PATCH", body:JSON.stringify(body) }),
};

// ─── QUOTES ───────────────────────────────────────
export const quotesAPI = {
  getAll:   (params={}) => { const q = new URLSearchParams(params).toString(); return apiFetch(`/api/quotes${q?`?${q}`:""}`); },
  getOne:   (id)        => apiFetch(`/api/quotes/${id}`),
  create:   (body)      => apiFetch("/api/quotes",                { method:"POST",   body:JSON.stringify(body) }),
  update:   (id,body)   => apiFetch(`/api/quotes/${id}`,          { method:"PATCH",  body:JSON.stringify(body) }),
  delete:   (id)        => apiFetch(`/api/quotes/${id}`,          { method:"DELETE" }),  // ← NEW
  submit:   (id)        => apiFetch(`/api/quotes/${id}/submit`,   { method:"PATCH" }),
  approve:  (id)        => apiFetch(`/api/quotes/${id}/approve`,  { method:"PATCH" }),
  revision: (id,reason) => apiFetch(`/api/quotes/${id}/revision`, { method:"PATCH",  body:JSON.stringify({ reason }) }),
  send:     (id)        => apiFetch(`/api/quotes/${id}/send`,     { method:"PATCH" }),
  accept:   (id)        => apiFetch(`/api/quotes/${id}/accept`,   { method:"PATCH" }),
  reject:   (id)        => apiFetch(`/api/quotes/${id}/reject`,   { method:"PATCH" }),
};

// ─── PAYMENTS ─────────────────────────────────────
export const paymentsAPI = {
  getAll:       ()     => apiFetch("/api/payments"),
  getByProject: (id)   => apiFetch(`/api/payments/project/${id}`),
  create:       (body) => apiFetch("/api/payments", { method:"POST", body:JSON.stringify(body) }),
  payInstallment:(id,body)=> apiFetch(`/api/payments/${id}/installment`, { method:"PATCH", body:JSON.stringify(body) }),
};

// ─── CUSTOMERS ────────────────────────────────────
export const customersAPI = {
  getAll: (search) => apiFetch(`/api/customers${search?`?search=${search}`:""}`),
};

// ─── DASHBOARD ────────────────────────────────────
export const dashboardAPI = {
  getStats: () => apiFetch("/api/dashboard"),
};

// ─── REPORTS ──────────────────────────────────────
export const reportsAPI = {
  getAll: () => apiFetch("/api/reports"),
};



// ── Settings API ───────────────────────────────
export const settingsAPI = {
  getProfile:      ()     => req("/api/settings/profile"),
  updateProfile:   (body) => req("/api/settings/profile",  "PATCH", body),
  updatePassword:  (body) => req("/api/settings/password", "PATCH", body),
};

// ── Tickets API ────────────────────────────────
export const ticketsAPI = {
  getAll:  ()           => req("/api/tickets"),
  create:  (body)       => req("/api/tickets",     "POST",  body),
  update:  (id, body)   => req(`/api/tickets/${id}`, "PATCH", body),
};