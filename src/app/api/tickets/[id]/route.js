import { connectDB } from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import User from "@/models/User";
import { getUser } from "@/lib/auth";

export async function PATCH(req, context) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error:"Unauthorized" }, { status:401 });
    await connectDB();

    const { id }   = await context.params;
    const body     = await req.json();
    const { action, note } = body;

    const ticket = await Ticket.findById(id);
    if (!ticket) return Response.json({ error:"Ticket not found" }, { status:404 });

    if (action === "in_progress" && caller.role === "manager") {
      ticket.status      = "in_progress";
      ticket.managerNote = note || "";
    }

    if (action === "escalate" && caller.role === "manager") {
      const superAdmin   = await User.findOne({ role:"super_admin" });
      ticket.status      = "escalated";
      ticket.managerNote = note || "";
      ticket.assignedTo  = superAdmin?._id;
    }

    if (action === "resolve") {
      ticket.status     = "resolved";
      ticket.resolvedAt = new Date();
      if (caller.role === "manager")    ticket.managerNote = note || "";
      if (caller.role === "super_admin") ticket.adminNote  = note || "";
    }

    await ticket.save();
    return Response.json({ ticket, message:"Ticket updated!" });
  } catch(e) {
    return Response.json({ error:e.message }, { status:500 });
  }
}