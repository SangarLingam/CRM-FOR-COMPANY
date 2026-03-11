import { connectDB } from "@/lib/mongodb";
import Quote from "@/models/Quote";
import { getUser } from "@/lib/auth";

export async function PATCH(req, context) {
  try {
    const { id } = await context.params;
    const caller = getUser(req);
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const quote = await Quote.findByIdAndUpdate(
      id, { status: "accepted" }, { new: true }
    );
    if (!quote) return Response.json({ error: "Quote not found" }, { status: 404 });
    return Response.json({ quote, message: "Quote accepted!" });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}