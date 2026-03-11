import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { signToken } from "@/lib/auth";

export async function POST(req) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    // Check fields
    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check password
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create token
    const token = signToken({
      id:    user._id,
      email: user.email,
      role:  user.role,
      name:  user.name,
    });

    return Response.json({
      token,
      user: user.toSafeObject(),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}