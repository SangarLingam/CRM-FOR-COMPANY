import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Project from "@/models/Project";
import Quote from "@/models/Quote";
import Payment from "@/models/Payment";
import User from "@/models/User";
import { getUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error:"Unauthorized" }, { status:401 });
    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "summary";

    // ── Sales Report (CSV download data) ──────────
    if (type === "sales_csv") {
      const leads = await Lead.find()
        .populate("assignedSales",    "name email")
        .populate("assignedDesigner", "name")
        .sort({ createdAt:-1 });

      const quotes   = await Quote.find({ status:"accepted" });
      const payments = await Payment.find();

      const rows = leads.map(l => {
        const quote   = quotes.find(q => (q.projectId?.toString() === l._id?.toString()));
        const paid    = payments
          .filter(p => p.customerId?.toString() === l.customerId?.toString())
          .reduce((s,p) => s+(p.amount||0), 0);
        return {
          customerName:     l.customerName,
          phone:            l.phone,
          email:            l.email || "",
          status:           l.status,
          source:           l.leadSource,
          assignedSales:    l.assignedSales?.name || "",
          assignedDesigner: l.assignedDesigner?.name || "",
          budget:           l.budget || 0,
          quoteAmount:      quote?.totalAmount || 0,
          paidAmount:       paid,
          balance:          (quote?.totalAmount||0) - paid,
          createdAt:        new Date(l.createdAt).toLocaleDateString("en-IN"),
        };
      });

      return Response.json({ rows });
    }

    // ── Summary report ─────────────────────────────
    const [leads, projects, quotes, payments, users] = await Promise.all([
      Lead.find().populate("assignedSales","name"),
      Project.find(),
      Quote.find({ status:"accepted" }),
      Payment.find().populate("recordedBy","name"),
      User.find({ role:{ $in:["sales","designer"] } }),
    ]);

    const totalRevenue  = payments.reduce((s,p) => s+(p.amount||0), 0);
    const conversionRate = leads.length
      ? Math.round((leads.filter(l=>l.status==="won").length / leads.length) * 100)
      : 0;

    // Sales performance
    const salesPerf = users
      .filter(u => u.role === "sales")
      .map(u => {
        const myLeads = leads.filter(l => l.assignedSales?._id?.toString() === u._id.toString());
        const myWon   = myLeads.filter(l => l.status==="won");
        const myPay   = payments.filter(p => p.recordedBy?._id?.toString() === u._id.toString());
        return {
          name:       u.name,
          leads:      myLeads.length,
          won:        myWon.length,
          conversion: myLeads.length ? Math.round((myWon.length/myLeads.length)*100) : 0,
          revenue:    myPay.reduce((s,p)=>s+(p.amount||0),0),
        };
      });

    // Designer workload
    const designerPerf = users
      .filter(u => u.role === "designer")
      .map(u => {
        const myLeads    = leads.filter(l => l.assignedDesigner?._id?.toString() === u._id.toString() || l.assignedDesigner?.toString() === u._id.toString());
        const myProjects = projects.filter(p => p.designerId?.toString() === u._id.toString());
        return {
          name:     u.name,
          leads:    myLeads.length,
          projects: myProjects.length,
          active:   myProjects.filter(p=>p.status!=="completed").length,
          completed:myProjects.filter(p=>p.status==="completed").length,
        };
      });

    // Monthly payments for chart
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthly = Array.from({length:6}, (_,i) => {
      const d = new Date(); d.setMonth(d.getMonth()-(5-i));
      return { month:MONTHS[d.getMonth()], monthNum:d.getMonth()+1, year:d.getFullYear(), revenue:0, leads:0 };
    });
    payments.forEach(p => {
      const m = new Date(p.paymentDate).getMonth()+1;
      const y = new Date(p.paymentDate).getFullYear();
      const idx = monthly.findIndex(x=>x.monthNum===m && x.year===y);
      if (idx>=0) monthly[idx].revenue += p.amount||0;
    });
    leads.forEach(l => {
      const m = new Date(l.createdAt).getMonth()+1;
      const y = new Date(l.createdAt).getFullYear();
      const idx = monthly.findIndex(x=>x.monthNum===m && x.year===y);
      if (idx>=0) monthly[idx].leads++;
    });

    return Response.json({
      summary: {
        totalLeads:      leads.length,
        wonLeads:        leads.filter(l=>l.status==="won").length,
        lostLeads:       leads.filter(l=>l.status==="lost").length,
        conversionRate,
        totalRevenue,
        totalProjects:   projects.length,
        activeProjects:  projects.filter(p=>p.status!=="completed").length,
      },
      salesPerf,
      designerPerf,
      monthly,
    });

  } catch(e) {
    return Response.json({ error:e.message }, { status:500 });
  }
}