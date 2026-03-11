import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getUser } from "@/lib/auth";

export async function POST(req) {
  try {
    // Only super_admin or manager can create employees
    const caller = getUser(req);
    if (!caller || !["super_admin", "manager"].includes(caller.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password || !role) {
      return Response.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Only sales or designer allowed
    if (!["sales", "designer"].includes(role)) {
      return Response.json(
        { error: "Role must be sales or designer" },
        { status: 400 }
      );
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return Response.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    const employee = await User.create({
      name,
      email,
      password,
      role,
      managerId: caller.id,
    });

    return Response.json(
      { user: employee.toSafeObject(), message: "Employee created successfully" },
      { status: 201 }
    );

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}