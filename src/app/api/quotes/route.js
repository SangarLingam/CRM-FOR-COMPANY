import { connectDB } from "@/lib/mongodb";
import Quote    from "@/models/Quote";
import Project  from "@/models/Project";
import Customer from "@/models/Customer"; // ⭐ ADD THIS
import User     from "@/models/User";     // ⭐ ADD THIS
import { getUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error:"Unauthorized" }, { status:401 });
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let filter = {};
    if (status)                    filter.status    = status;
    if (caller.role === "designer") filter.createdBy = caller.id;

    const quotes = await Quote.find(filter)
      .populate("projectId",  "projectName")
      .populate("customerId", "name phone email")
      .populate("createdBy",  "name")
      .sort({ createdAt:-1 });

    return Response.json({ quotes });
  } catch(e) {
    console.error("GET /api/quotes ERROR:", e);
    return Response.json({ error:e.message }, { status:500 });
  }
}

export async function POST(req) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error:"Unauthorized" }, { status:401 });
    if (!["super_admin","manager","designer"].includes(caller.role)) {
      return Response.json({ error:"Only designers can create quotes" }, { status:403 });
    }
    await connectDB();

    const body = await req.json();

    // ⭐ Auto-fetch customerId from project
    if (!body.customerId && body.projectId) {
      const project = await Project.findById(body.projectId);
      if (!project) return Response.json({ error:"Project not found" }, { status:404 });
      body.customerId = project.customerId;
    }

    if (!body.customerId) {
      return Response.json({ error:"Customer not found for this project" }, { status:400 });
    }

    // Calculate totals
    const items = (body.items || []).map(item => ({
      ...item,
      total: item.quantity * item.unitPrice,
    }));

    const subtotal    = items.reduce((s,i) => s + i.total, 0);
    const tax         = Number(body.tax      || 0);
    const discount    = Number(body.discount || 0);
    const totalAmount = subtotal + tax - discount;

    body.items       = items;
    body.totalAmount = totalAmount;
    body.createdBy   = caller.id;
    body.status      = "draft";

    const quote = await Quote.create(body);
    return Response.json({ quote }, { status:201 });

  } catch(e) {
    console.error("POST /api/quotes ERROR:", e);
    return Response.json({ error:e.message }, { status:500 });
  }
}