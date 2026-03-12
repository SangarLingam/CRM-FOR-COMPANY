import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error:"Unauthorized" }, { status:401 });
    await connectDB();
    const user = await User.findById(caller.id).select("-password");
    return Response.json({ user });
  } catch(e) {
    return Response.json({ error:e.message }, { status:500 });
  }
}

export async function PATCH(req) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error:"Unauthorized" }, { status:401 });
    await connectDB();

    const { name, phone } = await req.json();
    const user = await User.findByIdAndUpdate(
      caller.id,
      { name, phone },
      { new:true }
    ).select("-password");

    return Response.json({ user, message:"Profile updated!" });
  } catch(e) {
    return Response.json({ error:e.message }, { status:500 });
  }
}