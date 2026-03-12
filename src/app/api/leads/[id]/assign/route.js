import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { getUser } from "@/lib/auth";

export async function PATCH(req, context) {
  try {
    const { id } = await context.params;
    const caller = getUser(req);

if (!["super_admin","manager","sales"].includes(caller.role)) {
  return Response.json({ error:"Forbidden" }, { status:403 });
}

    await connectDB();
    const { assignedSales, assignedDesigner } = await req.json();
    console.log("ASSIGN:", id, { assignedSales, assignedDesigner });

    const update = {};
    if (assignedSales    !== undefined) update.assignedSales    = assignedSales    || null;
    if (assignedDesigner !== undefined) update.assignedDesigner = assignedDesigner || null;

    const lead = await Lead.findByIdAndUpdate(id, update, { new: true })
      .populate("assignedSales",    "name email")
      .populate("assignedDesigner", "name email");

    if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });

    return Response.json({ lead, message: "Lead assigned successfully" });

  } catch (error) {
    console.log("ASSIGN ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}