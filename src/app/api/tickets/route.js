import { connectDB } from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import User from "@/models/User";
import { getUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error:"Unauthorized" }, { status:401 });
    await connectDB();

    let filter = {};
    if (["sales","designer"].includes(caller.role)) {
      filter.raisedBy = caller.id;
    } else if (caller.role === "manager") {
      // Manager sees open + in_progress tickets (not escalated)
      filter.status = { $in:["open","in_progress"] };
    } else if (caller.role === "super_admin") {
      // Super admin sees escalated tickets
      filter.status = "escalated";
    }

    const tickets = await Ticket.find(filter)
      .populate("raisedBy","name role")
      .sort({ createdAt:-1 });

    return Response.json({ tickets });
  } catch(e) {
    return Response.json({ error:e.message }, { status:500 });
  }
}

export async function POST(req) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error:"Unauthorized" }, { status:401 });
    await connectDB();

    const body = await req.json();
    const { title, description, priority } = body;
    if (!title || !description) return Response.json({ error:"Title and description required" }, { status:400 });

    // Find a manager to assign
    const manager = await User.findOne({ role:"manager" });

    const ticket = await Ticket.create({
      title, description,
      priority: priority || "medium",
      raisedBy:     caller.id,
      raisedByName: caller.name,
      raisedByRole: caller.role,
      assignedTo:   manager?._id,
      status:       "open",
    });

    return Response.json({ ticket, message:"Ticket raised successfully!" });
  } catch(e) {
    return Response.json({ error:e.message }, { status:500 });
  }
}