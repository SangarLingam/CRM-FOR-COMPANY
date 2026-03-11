import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import { getUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const filter = {};
    if (status) filter.status = status;
    if (caller.role === "designer") filter.designerId = caller.id;

    const projects = await Project.find(filter)
      .populate("customerId", "name phone email")
      .populate("designerId", "name email")
      .sort({ createdAt: -1 });

    return Response.json({ projects });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();
    const project = await Project.create(body);

    return Response.json({ project }, { status: 201 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}