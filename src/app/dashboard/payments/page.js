"use client";
import { useEffect, useState, useCallback } from "react";
import { paymentsAPI, projectsAPI, quotesAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { PageHeader, Button, Modal, FormField, Input, Select, Spinner } from "@/components/ui";
import { Plus, CreditCard, TrendingUp, CheckCircle } from "lucide-react";

const C = {
  primary:   "#C8974A",
  accent:    "#D4A85A",
  gold:      "#F0C060",
  darkest:   "#2C1A0E",
  darker:    "#3D2410",
  textLight: "#9C7A5A",
  textFaint: "#C4A882",
  border:    "#E8DDD0",
  cream:     "#FAF7F4",
};

const METHODS = [
  { value: "cash",          label: "💵 Cash" },
  { value: "upi",           label: "📱 UPI" },
  { value: "bank_transfer", label: "🏦 Bank Transfer" },
  { value: "cheque",        label: "📄 Cheque" },
  { value: "card",          label: "💳 Card" },
];

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const EMPTY_FORM = {
  projectId:     "",
  amount:        "",
  paymentDate:   new Date().toISOString().slice(0, 10),
  paymentMethod: "upi",
  reference:     "",
  notes:         "",
};

export default function PaymentsPage() {
  const { user }     = useAuth();
  const { addToast } = useToast();

  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [quotes,   setQuotes]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);

  // ── Derived: selected project's approved quote ─────
  const selectedQuote = quotes.find(
    (q) =>
      (q.projectId?._id === form.projectId || q.projectId === form.projectId) &&
      ["approved", "sent", "accepted"].includes(q.status)
  );

  // ── Payments already recorded for selected project ─
  const projectPayments = payments.filter(
    (p) =>
      p.projectId?._id === form.projectId || p.projectId === form.projectId
  );
  const totalPaid   = projectPayments.reduce((s, p) => s + p.amount, 0);
  const quoteTotal  = selectedQuote?.totalAmount || 0;
  const balance     = quoteTotal - totalPaid;
  const paidPercent = quoteTotal > 0 ? Math.min((totalPaid / quoteTotal) * 100, 100) : 0;

  // ── Fetch all data ─────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pd, pj, qt] = await Promise.all([
        paymentsAPI.getAll(),
        projectsAPI.getAll(),
        quotesAPI.getAll(),
      ]);
      setPayments(pd.payments || []);
      setProjects(pj.projects || []);
      setQuotes(qt.quotes    || []);
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Save Payment ───────────────────────────────────
  async function handleSave() {
    if (!form.projectId) {
      addToast("Please select a project", "warning");
      return;
    }
    if (!form.amount) {
      addToast("Please enter payment amount", "warning");
      return;
    }
    if (Number(form.amount) <= 0) {
      addToast("Amount must be greater than 0", "warning");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        amount:  Number(form.amount),
        quoteId: selectedQuote?._id || null,
      };
      await paymentsAPI.create(payload);
      addToast("Payment recorded successfully! 💰", "success");
      setModal(false);
      setForm(EMPTY_FORM);
      await fetchAll(); // ✅ FIX: await so UI refreshes after save
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  // ── Summary stats ──────────────────────────────────
  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
  const thisMonth    = payments
    .filter((p) => {
      const d = new Date(p.paymentDate || p.createdAt);
      const n = new Date();
      return (
        d.getMonth()    === n.getMonth() &&
        d.getFullYear() === n.getFullYear()
      );
    })
    .reduce((s, p) => s + p.amount, 0);

  const canAdd = ["super_admin", "manager", "sales"].includes(user?.role);

  return (
    <div className="p-8 page-enter" style={{ background: C.cream, minHeight: "100vh" }}>

      <PageHeader
        title="Payments"
        subtitle={`${payments.length} transactions`}
        action={
          canAdd ? (
            <Button onClick={() => { setForm(EMPTY_FORM); setModal(true); }}>
              <Plus size={16} /> Record Payment
            </Button>
          ) : null
        }
      />

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Revenue",  value: fmt(totalRevenue),  icon: TrendingUp,  color: C.primary  },
          { label: "This Month",     value: fmt(thisMonth),     icon: CreditCard,  color: "#1E8449"  },
          { label: "Transactions",   value: payments.length,    icon: CheckCircle, color: "#1565C0"  },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-5 border flex items-center gap-4"
            style={{ borderColor: C.border }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${s.color}15` }}
            >
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: C.textFaint }}>{s.label}</p>
              <p className="text-xl font-bold font-display" style={{ color: C.darkest }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Payments Table ── */}
      {loading ? (
        <Spinner />
      ) : (
        <div
          className="bg-white rounded-2xl border shadow-sm overflow-hidden"
          style={{ borderColor: C.border }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.cream }}>
                {["Project / Customer", "Amount", "Method", "Date", "Reference", "Recorded By"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: C.textLight }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-16 text-sm"
                    style={{ color: C.textFaint }}
                  >
                    No payments recorded yet.
                  </td>
                </tr>
              )}
              {payments.map((p) => (
                <tr
                  key={p._id}
                  style={{ borderBottom: `1px solid #FAF7F4` }}
                  className="hover:bg-[#FAF7F4]/60 transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-sm" style={{ color: C.darkest }}>
                      {p.projectId?.projectName || "—"}
                    </p>
                    <p className="text-xs" style={{ color: C.textFaint }}>
                      {p.customerId?.name}
                      {p.customerId?.phone ? ` · ${p.customerId.phone}` : ""}
                    </p>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="text-base font-bold font-display" style={{ color: "#1E8449" }}>
                      {fmt(p.amount)}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-medium capitalize"
                      style={{ background: `${C.primary}12`, color: C.primary }}
                    >
                      {METHODS.find((m) => m.value === p.paymentMethod)?.label || p.paymentMethod}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-sm" style={{ color: C.textLight }}>
                    {p.paymentDate
                      ? new Date(p.paymentDate).toLocaleDateString("en-IN")
                      : new Date(p.createdAt).toLocaleDateString("en-IN")}
                  </td>

                  <td className="px-4 py-3.5 text-xs font-mono" style={{ color: C.textFaint }}>
                    {p.reference || "—"}
                  </td>

                  <td className="px-4 py-3.5 text-xs" style={{ color: C.textLight }}>
                    {p.recordedBy?.name || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Record Payment Modal ── */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title="Record New Payment"
        size="md"
      >
        <div className="space-y-4">

          {/* Project selector */}
          <FormField label="Project" required>
            <Select
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value, amount: "" })}
            >
              <option value="">— Select Project —</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.projectName} ({p.customerId?.name || "—"})
                </option>
              ))}
            </Select>
          </FormField>

          {/* Quote info box */}
          {form.projectId && (
            <>
              {selectedQuote ? (
                <div
                  className="rounded-xl p-4 space-y-3"
                  style={{ background: "#E9F7EF", border: "1px solid #A9DFBF" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold" style={{ color: "#1E8449" }}>
                        ✅ Quote #{selectedQuote.quoteNumber}
                        <span
                          className="ml-2 px-1.5 py-0.5 rounded-md text-xs"
                          style={{ background: "#1E844920", color: "#1E8449" }}
                        >
                          {selectedQuote.status.replace(/_/g, " ").toUpperCase()}
                        </span>
                      </p>
                      <p className="text-lg font-bold font-display mt-1" style={{ color: C.darkest }}>
                        Quote Total: {fmt(quoteTotal)}
                      </p>
                    </div>
                  </div>

                  {/* Payment progress bar */}
                  <div>
                    <div
                      className="flex justify-between text-xs mb-1.5"
                      style={{ color: "#1E8449" }}
                    >
                      <span>Paid: {fmt(totalPaid)}</span>
                      <span>Balance: {fmt(balance)}</span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: "rgba(30,132,73,0.15)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width:      `${paidPercent}%`,
                          background: paidPercent >= 100 ? "#1E8449" : C.primary,
                        }}
                      />
                    </div>
                    <p className="text-xs mt-1 text-right" style={{ color: "#1E8449" }}>
                      {paidPercent.toFixed(0)}% paid
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-center gap-2 p-3 rounded-xl text-sm"
                  style={{ background: "#FEF9E7", border: "1px solid #F0D080", color: "#B7770D" }}
                >
                  ⚠️ No approved quote found. You can still record payment manually.
                </div>
              )}
            </>
          )}

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Amount (₹)" required>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder={balance > 0 ? `Balance: ${fmt(balance)}` : "50000"}
              />
            </FormField>
            <FormField label="Payment Date">
              <Input
                type="date"
                value={form.paymentDate}
                onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
              />
            </FormField>
          </div>

          {/* Method */}
          <FormField label="Payment Method">
            <Select
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
            >
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </Select>
          </FormField>

          {/* Reference */}
          <FormField label="Reference / TXN ID">
            <Input
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              placeholder="UPI / NEFT reference"
            />
          </FormField>

          {/* Notes */}
          <FormField label="Notes">
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional notes"
            />
          </FormField>

          {/* Quick-fill balance button */}
          {selectedQuote && balance > 0 && (
            <button
              onClick={() => setForm({ ...form, amount: String(balance) })}
              className="w-full py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
              style={{
                background: `${C.primary}15`,
                color:       C.primary,
                border:      `1px solid ${C.primary}30`,
              }}
            >
              Fill Remaining Balance → {fmt(balance)}
            </button>
          )}
        </div>

        <div
          className="flex justify-end gap-3 mt-5 pt-4 border-t"
          style={{ borderColor: C.border }}
        >
          <Button variant="secondary" onClick={() => setModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Recording..." : "Record Payment 💰"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}