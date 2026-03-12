import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { getUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error:"Unauthorized" }, { status:401 });
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const filter = {};

    // ── Role-based visibility ──────────────────────
    if (caller.role === "sales") {
      filter.assignedSales = caller.id;
    } else if (caller.role === "designer") {
      // Designer ONLY sees leads assigned to them
      filter.assignedDesigner = caller.id;
    }
    // Manager + Super Admin see all

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { customerName: { $regex:search, $options:"i" } },
        { phone:        { $regex:search, $options:"i" } },
      ];
    }

    const leads = await Lead.find(filter)
      .populate("assignedSales",    "name")
      .populate("assignedDesigner", "name")
      .sort({ createdAt:-1 });

    return Response.json({ leads });
  } catch(e) {
    return Response.json({ error:e.message }, { status:500 });
  }
}

export async function POST(req) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error:"Unauthorized" }, { status:401 });
    if (caller.role === "designer")
      return Response.json({ error:"Designers cannot create leads" }, { status:403 });
    await connectDB();

    const body = await req.json();
    const lead = await Lead.create({
      ...body,
      assignedSales: caller.role === "sales" ? caller.id : body.assignedSales,
      createdBy: caller.id,
    });

    return Response.json({ lead, message:"Lead created!" });
  } catch(e) {
    return Response.json({ error:e.message }, { status:500 });
  }
}