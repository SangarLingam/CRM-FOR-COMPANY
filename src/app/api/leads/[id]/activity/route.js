import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { getUser } from "@/lib/auth";

export async function POST(req, context) {
  try {
    const { id } = await context.params;
    const caller = getUser(req);
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { action, note } = await req.json();

    const lead = await Lead.findByIdAndUpdate(
      id,
      {
        $push: {
          activityLog: {
            action,
            note,
            doneBy:     caller.id,
            doneByName: caller.name,
            doneAt:     new Date(),
          }
        }
      },
      { new: true }
    );

    if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });
    return Response.json({ lead, message: "Activity logged" });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}