import { connectDB } from "@/lib/mongodb";
import Payment from "@/models/Payment";
import { getUser } from "@/lib/auth";

export async function GET(req, context) {
  try {
    const { id } = await context.params;
    const caller = getUser(req);
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const payments = await Payment.find({ projectId: id })
      .populate("recordedBy", "name")
      .sort({ paymentDate: -1 });

    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    return Response.json({ payments, total });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}