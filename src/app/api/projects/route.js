import { connectDB } from "@/lib/mongodb";
import Project  from "@/models/Project";
import Customer from "@/models/Customer"; // ⭐ ADD THIS
import User     from "@/models/User";     // ⭐ ADD THIS
import { getUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error:"Unauthorized" }, { status:401 });
    await connectDB();

    let filter = {};
    if (caller.role === "designer") filter.designerId = caller.id;

    const projects = await Project.find(filter)
      .populate("customerId", "name phone email")
      .populate("designerId", "name")
      .populate("leadId",     "customerName status")
      .sort({ createdAt:-1 });

    return Response.json({ projects });
  } catch(e) {
    console.error("GET /api/projects ERROR:", e);
    return Response.json({ error:e.message }, { status:500 });
  }
}

export async function POST(req) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error:"Unauthorized" }, { status:401 });
    if (!["super_admin","manager"].includes(caller.role)) {
      return Response.json({ error:"Forbidden" }, { status:403 });
    }
    await connectDB();
    const body    = await req.json();
    const project = await Project.create(body);
    return Response.json({ project }, { status:201 });
  } catch(e) {
    console.error("POST /api/projects ERROR:", e);
    return Response.json({ error:e.message }, { status:500 });
  }
}