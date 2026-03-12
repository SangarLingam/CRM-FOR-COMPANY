import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PATCH(req) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error:"Unauthorized" }, { status:401 });
    await connectDB();

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword)
      return Response.json({ error:"All fields required" }, { status:400 });
    if (newPassword.length < 6)
      return Response.json({ error:"Password must be at least 6 characters" }, { status:400 });

    const user = await User.findById(caller.id);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return Response.json({ error:"Current password is incorrect" }, { status:400 });

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    return Response.json({ message:"Password updated successfully!" });
  } catch(e) {
    return Response.json({ error:e.message }, { status:500 });
  }
}