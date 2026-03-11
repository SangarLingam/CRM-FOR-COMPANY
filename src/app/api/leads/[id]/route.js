import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { getUser } from "@/lib/auth";

export async function GET(req, context) {
  try {
    const { id } = await context.params;
    const caller = getUser(req);
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const lead = await Lead.findById(id)
      .populate("assignedSales",    "name email")
      .populate("assignedDesigner", "name email");

    if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });
    return Response.json({ lead });

  } catch (error) {
    console.log("GET LEAD ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  try {
    const { id } = await context.params;
    const caller = getUser(req);
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();

    const lead = await Lead.findByIdAndUpdate(id, body, { new: true })
      .populate("assignedSales",    "name email")
      .populate("assignedDesigner", "name email");

    if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });
    return Response.json({ lead });

  } catch (error) {
    console.log("PATCH LEAD ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { id } = await context.params;
    const caller = getUser(req);
    if (!caller || !["super_admin", "manager"].includes(caller.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    await Lead.findByIdAndDelete(id);
    console.log("Lead deleted:", id);

    return Response.json({ message: "Lead deleted successfully" });

  } catch (error) {
    console.log("DELETE LEAD ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}