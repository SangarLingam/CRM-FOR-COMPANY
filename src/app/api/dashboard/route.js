import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Project from "@/models/Project";
import Quote from "@/models/Quote";
import Payment from "@/models/Payment";
import Customer from "@/models/Customer";
import { getUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error:"Unauthorized" }, { status:401 });
    await connectDB();

    const now       = new Date();
    const sixAgo    = new Date(); sixAgo.setMonth(now.getMonth() - 5);

    // ── Basic counts ──────────────────────────────
    const filter = {};
    if (caller.role === "sales")    filter.assignedSales    = caller.id;
    if (caller.role === "designer") filter.assignedDesigner = caller.id;

    const [totalLeads, wonLeads, lostLeads, newLeads,
           totalProjects, activeProjects, completedProjects,
           totalQuotes, acceptedQuotes,
           totalCustomers, recentLeads, payments] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.countDocuments({...filter, status:"won"}),
      Lead.countDocuments({...filter, status:"lost"}),
      Lead.countDocuments({...filter, status:"new"}),
      Project.countDocuments(),
      Project.countDocuments({ status:{$in:["planning","design","in_progress"]} }),
      Project.countDocuments({ status:"completed" }),
      Quote.countDocuments(),
      Quote.countDocuments({ status:"accepted" }),
      Customer.countDocuments(),
      Lead.find(filter).sort({ createdAt:-1 }).limit(8)
        .populate("assignedSales","name")
        .populate("assignedDesigner","name"),
      Payment.find().sort({ paymentDate:-1 }),
    ]);

    const revenue = payments.reduce((s,p) => s+(p.amount||0), 0);

    // ── Monthly leads (last 6 months) ─────────────
    const monthlyLeads = await Lead.aggregate([
      { $match: { createdAt:{ $gte:sixAgo }, ...filter } },
      { $group: { _id:{ month:{ $month:"$createdAt" }, year:{ $year:"$createdAt" } }, count:{ $sum:1 } } },
      { $sort: { "_id.year":1, "_id.month":1 } }
    ]);

    // ── Monthly revenue (last 6 months) ───────────
    const monthlyRevenue = await Payment.aggregate([
      { $match: { paymentDate:{ $gte:sixAgo } } },
      { $group: { _id:{ month:{ $month:"$paymentDate" }, year:{ $year:"$paymentDate" } }, total:{ $sum:"$amount" } } },
      { $sort: { "_id.year":1, "_id.month":1 } }
    ]);

    // ── Lead sources ──────────────────────────────
    const leadSources = await Lead.aggregate([
      { $group: { _id:"$leadSource", count:{ $sum:1 } } },
      { $sort: { count:-1 } }
    ]);

    // ── Project status breakdown ───────────────────
    const projectStatus = await Project.aggregate([
      { $group: { _id:"$status", count:{ $sum:1 } } }
    ]);

    // ── Activity log (recent actions across leads) ─
    const leadsWithActivity = await Lead.find({
      "activityLog.0": { $exists:true }
    }).select("customerName activityLog").limit(20);

    const activityTimeline = leadsWithActivity
      .flatMap(l => l.activityLog.map(a => ({
        leadName: l.customerName,
        action:   a.action,
        note:     a.note,
        doneBy:   a.doneByName,
        doneAt:   a.doneAt,
      })))
      .sort((a,b) => new Date(b.doneAt) - new Date(a.doneAt))
      .slice(0, 10);

    // ── Notifications (pending approvals etc.) ─────
    const [pendingQuotes, newLeadsCount, overdueProjects] = await Promise.all([
      Quote.countDocuments({ status:"pending_approval" }),
      Lead.countDocuments({ status:"new", createdAt:{ $gte: new Date(Date.now() - 86400000) } }),
      Project.countDocuments({ endDate:{ $lt:now }, status:{ $ne:"completed" } }),
    ]);

    const notifications = [];
    if (pendingQuotes > 0)   notifications.push({ type:"warning", msg:`${pendingQuotes} quote(s) pending your approval` });
    if (newLeadsCount > 0)   notifications.push({ type:"info",    msg:`${newLeadsCount} new lead(s) added today` });
    if (overdueProjects > 0) notifications.push({ type:"error",   msg:`${overdueProjects} project(s) are overdue` });

    // ── Build chart data (merge months) ───────────
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const last6  = Array.from({length:6}, (_,i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5-i));
      return { month:MONTHS[d.getMonth()], monthNum:d.getMonth()+1, year:d.getFullYear(), leads:0, revenue:0 };
    });

    monthlyLeads.forEach(m => {
      const idx = last6.findIndex(x => x.monthNum===m._id.month && x.year===m._id.year);
      if (idx >= 0) last6[idx].leads = m.count;
    });
    monthlyRevenue.forEach(m => {
      const idx = last6.findIndex(x => x.monthNum===m._id.month && x.year===m._id.year);
      if (idx >= 0) last6[idx].revenue = m.total;
    });

    return Response.json({
      leads:     { total:totalLeads, won:wonLeads, lost:lostLeads, new:newLeads },
      projects:  { total:totalProjects, active:activeProjects, completed:completedProjects },
      quotes:    { total:totalQuotes, accepted:acceptedQuotes },
      revenue,
      totalCustomers,
      recentLeads,
      chartData:      last6,
      leadSources,
      projectStatus,
      activityTimeline,
      notifications,
    });

  } catch(error) {
    console.log("DASHBOARD ERROR:", error);
    return Response.json({ error:error.message }, { status:500 });
  }
}