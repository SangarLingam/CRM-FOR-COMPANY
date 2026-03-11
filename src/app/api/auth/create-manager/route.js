import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getUser } from "@/lib/auth";

export async function POST(req) {
  try {
    const caller = getUser(req);
    console.log("Caller:", caller);

    if (!caller || caller.role !== "super_admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    console.log("DB connected");

    // ✅ Read full body including password
    const body = await req.json();
    console.log("Full Body:", body); // now shows password too

    const { name, email, password } = body;

    // Validate all fields
    if (!name || !email || !password) {
      return Response.json(
        { error: `Missing fields: ${!name?"name ":""}${!email?"email ":""}${!password?"password":""}` },
        { status: 400 }
      );
    }

    // Check duplicate email
    const exists = await User.findOne({ email });
    if (exists) {
      return Response.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    // Create manager
    const manager = await User.create({
      name,
      email,
      password,
      role: "manager",
    });

    console.log("Manager created:", manager._id);

    return Response.json(
      { user: manager.toSafeObject(), message: "Manager created successfully" },
      { status: 201 }
    );

  } catch (error) {
    console.log("CREATE MANAGER ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}