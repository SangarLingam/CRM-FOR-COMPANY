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
    if (!caller || !["super_admin","manager"].includes(caller.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    // Lead conversion stats
    const totalLeads = await Lead.countDocuments();
    const wonLeads   = await Lead.countDocuments({ status: "won" });
    const lostLeads  = await Lead.countDocuments({ status: "lost" });
    const conversionRate = totalLeads ? Math.round((wonLeads / totalLeads) * 100) : 0;

    // Revenue stats
    const payments   = await Payment.find();
    const totalRevenue  = payments.reduce((s,p) => s + (p.paidAmount||0), 0);
    const pendingRevenue= payments.reduce((s,p) => s + ((p.totalAmount||0) - (p.paidAmount||0)), 0);

    // Lead source breakdown
    const leadSources = await Lead.aggregate([
      { $group: { _id: "$leadSource", count: { $sum: 1 } } },
      { $sort:  { count: -1 } }
    ]);

    // Monthly leads (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyLeads = await Lead.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year:  { $year:  "$createdAt" },
          },
          count: { $sum: 1 },
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Top sales performers
    const salesPerformance = await Lead.aggregate([
      { $match: { status: "won", assignedSales: { $ne: null } } },
      { $group: { _id: "$assignedSales", wonCount: { $sum: 1 } } },
      { $sort: { wonCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        }
      },
      { $unwind: "$user" },
      { $project: { name: "$user.name", wonCount: 1 } }
    ]);

    // Designer workload
    const designerWorkload = await Project.aggregate([
      { $match: { status: { $ne: "completed" }, designerId: { $ne: null } } },
      { $group: { _id: "$designerId", activeProjects: { $sum: 1 } } },
      { $sort: { activeProjects: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        }
      },
      { $unwind: "$user" },
      { $project: { name: "$user.name", activeProjects: 1 } }
    ]);

    // Project status breakdown
    const projectStats = await Project.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Quote stats
    const quoteStats = await Quote.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    return Response.json({
      leads: {
        total: totalLeads,
        won:   wonLeads,
        lost:  lostLeads,
        conversionRate,
        sources:  leadSources,
        monthly:  monthlyLeads,
      },
      revenue: {
        total:   totalRevenue,
        pending: pendingRevenue,
      },
      salesPerformance,
      designerWorkload,
      projectStats,
      quoteStats,
    });

  } catch (error) {
    console.log("REPORTS ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}