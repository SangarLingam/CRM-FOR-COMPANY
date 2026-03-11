import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { getUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page   = parseInt(searchParams.get("page")  || "1");
    const limit  = parseInt(searchParams.get("limit") || "20");

    const filter = {};
    if (caller.role === "sales")    filter.assignedSales    = caller.id;
    if (caller.role === "designer") filter.assignedDesigner = caller.id;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { phone:        { $regex: search, $options: "i" } },
        { email:        { $regex: search, $options: "i" } },
      ];
    }

    const total = await Lead.countDocuments(filter);
    const leads = await Lead.find(filter)
      .populate("assignedSales",    "name email")
      .populate("assignedDesigner", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return Response.json({ leads, total, page, pages: Math.ceil(total / limit) });

  } catch (error) {
    console.log("GET LEADS ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();

    if (caller.role === "sales") {
      body.assignedSales = caller.id;
    }

    const lead = await Lead.create(body);
    return Response.json({ lead }, { status: 201 });

  } catch (error) {
    console.log("POST LEAD ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}