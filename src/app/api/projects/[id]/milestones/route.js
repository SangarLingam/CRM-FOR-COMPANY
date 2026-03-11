import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import { getUser } from "@/lib/auth";

// Add milestone
export async function POST(req, context) {
  try {
    const { id } = await context.params;
    const caller = getUser(req);
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { title, description, dueDate, order } = await req.json();

    const project = await Project.findByIdAndUpdate(
      id,
      { $push: { milestones: { title, description, dueDate, order } } },
      { new: true }
    );

    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
    return Response.json({ project, message: "Milestone added" });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Update milestone status
export async function PATCH(req, context) {
  try {
    const { id } = await context.params;
    const caller = getUser(req);
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { milestoneId, status } = await req.json();

    const update = {
      "milestones.$.status": status,
    };
    if (status === "completed") {
      update["milestones.$.completedAt"] = new Date();
    }

    const project = await Project.findOneAndUpdate(
      { _id: id, "milestones._id": milestoneId },
      { $set: update },
      { new: true }
    );

    if (!project) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ project });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}