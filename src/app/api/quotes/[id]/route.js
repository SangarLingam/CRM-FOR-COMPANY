import { connectDB } from "@/lib/mongodb";
import Quote from "@/models/Quote";
import { getUser } from "@/lib/auth";

export async function GET(req, context) {
  try {
    const { id } = await context.params;
    const caller = getUser(req);
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const quote = await Quote.findById(id)
      .populate("projectId")
      .populate("customerId")
      .populate("createdBy", "name email");

    if (!quote) return Response.json({ error: "Quote not found" }, { status: 404 });
    return Response.json({ quote });

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
    const body  = await req.json();
    const quote = await Quote.findByIdAndUpdate(id, body, { new: true });

    if (!quote) return Response.json({ error: "Quote not found" }, { status: 404 });
    return Response.json({ quote });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { id } = await context.params;
    const caller = getUser(req);
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    await Quote.findByIdAndDelete(id);
    return Response.json({ message: "Quote deleted" });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}