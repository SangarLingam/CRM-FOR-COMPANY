import { connectDB } from "@/lib/mongodb";
import Customer from "@/models/Customer";
import { getUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const filter = {};
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const customers = await Customer.find(filter)
      .populate("leadId", "leadSource status")
      .sort({ createdAt: -1 });

    return Response.json({ customers });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}