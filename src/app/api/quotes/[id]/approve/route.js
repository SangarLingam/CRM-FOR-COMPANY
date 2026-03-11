import { connectDB } from "@/lib/mongodb";
import Quote from "@/models/Quote";
import { getUser } from "@/lib/auth";

export async function PATCH(req, context) {
  try {
    const { id } = await context.params;
    const caller = getUser(req);
    if (!caller || !["super_admin","manager"].includes(caller.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const quote = await Quote.findByIdAndUpdate(
      id,
      {
        status:     "approved",
        approvedBy: caller.id,
        approvedAt: new Date(),
      },
      { new: true }
    );
    if (!quote) return Response.json({ error: "Quote not found" }, { status: 404 });
    return Response.json({ quote, message: "Quote approved ✅" });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}