import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Customer from "@/models/Customer";
import Project from "@/models/Project";
import { getUser } from "@/lib/auth";

// ── Allowed transitions per role ──────────────────────
const ALLOWED = {
  sales:       { new:["contacted"], contacted:["site_visit"] },
  designer:    { site_visit:["won","lost"] },
  manager:     { new:["contacted","site_visit","won","lost"], contacted:["site_visit","won","lost"], site_visit:["won","lost"] },
  super_admin: { new:["contacted","site_visit","won","lost"], contacted:["site_visit","won","lost"], site_visit:["won","lost"] },
};

export async function PATCH(req, context) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error:"Unauthorized" }, { status:401 });
    await connectDB();

    const { id }     = await context.params;
    const { status } = await req.json();
    const lead       = await Lead.findById(id);
    if (!lead) return Response.json({ error:"Lead not found" }, { status:404 });

    // ── Designer can only update their own assigned lead ──
    if (caller.role === "designer") {
      if (lead.assignedDesigner?.toString() !== caller.id) {
        return Response.json({ error:"You can only update leads assigned to you" }, { status:403 });
      }
    }

    // ── Sales can only update leads they created ──
    if (caller.role === "sales") {
      if (lead.assignedSales?.toString() !== caller.id) {
        return Response.json({ error:"You can only update your own leads" }, { status:403 });
      }
    }

    // ── Check transition is allowed ──
    const allowed = ALLOWED[caller.role]?.[lead.status] || [];
    if (!allowed.includes(status)) {
      return Response.json({
        error:`${caller.role} cannot change status from "${lead.status}" to "${status}"`
      }, { status:403 });
    }

    lead.status = status;
    lead.activityLog = lead.activityLog || [];
    lead.activityLog.push({
      action:    `Status changed to ${status}`,
      doneByName: caller.name,
      doneAt:    new Date(),
    });

    // ── Auto-create Customer + Project on Won ──
    if (status === "won") {
      let customer = await Customer.findOne({ leadId:lead._id });
      if (!customer) {
        customer = await Customer.create({
          leadId:  lead._id,
          name:    lead.customerName,
          phone:   lead.phone,
          email:   lead.email    || "",
          address: lead.address  || "",
        });
      }
      const existing = await Project.findOne({ leadId:lead._id });
      if (!existing) {
        await Project.create({
          leadId:      lead._id,
          customerId:  customer._id,
          projectName: `${lead.customerName} - ${lead.projectType || "Interior"} Project`,
          status:      "planning",
          designerId:  lead.assignedDesigner,
          totalBudget: lead.budget || 0,
        });
      }
      lead.customerId = customer._id;
      return Response.json({
        lead: await lead.save(),
        message: "Lead marked as Won! 🎉 Customer & Project created automatically.",
      });
    }

    await lead.save();
    return Response.json({ lead, message:`Status updated to ${status}` });

  } catch(e) {
    return Response.json({ error:e.message }, { status:500 });
  }
}