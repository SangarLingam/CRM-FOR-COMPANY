import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import { getUser } from "@/lib/auth";

export async function GET(req, context) {
  try {
    const { id } = await context.params;
    const caller = getUser(req);
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const project = await Project.findById(id)
      .populate("customerId", "name phone email address")
      .populate("designerId", "name email");

    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
    return Response.json({ project });

  } catch (error) {
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

    const project = await Project.findByIdAndUpdate(id, body, { new: true })
      .populate("customerId", "name phone email")
      .populate("designerId", "name email");

    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
    return Response.json({ project });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}