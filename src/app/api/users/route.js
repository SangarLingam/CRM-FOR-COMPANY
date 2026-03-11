import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const caller = getUser(req);
    if (!caller) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    const filter = { isActive: true };
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select("-password")
      .sort({ name: 1 });

    return Response.json({ users });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}