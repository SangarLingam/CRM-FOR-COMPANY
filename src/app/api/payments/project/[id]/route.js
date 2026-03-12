import { connectDB } from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Project from "@/models/Project";
import Quote from "@/models/Quote";
import { getUser } from "@/lib/auth";

export async function GET(req, context) {
  try {

    const { id } = context.params;

    const caller = getUser(req);
    if (!caller) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    /* Get project payments */
    const payments = await Payment.find({ projectId: id })
      .populate("recordedBy", "name")
      .sort({ paymentDate: -1 });

    /* Calculate total paid */
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    /* Get quote total */
    const quote = await Quote.findOne({
      projectId: id,
      status: { $in: ["approved", "sent", "accepted"] }
    }).sort({ createdAt: -1 });

    const quoteTotal = quote?.totalAmount || 0;

    /* Remaining balance */
    const remaining = quoteTotal > 0
      ? Math.max(quoteTotal - totalPaid, 0)
      : 0;

    return Response.json({
      payments,
      summary: {
        quoteTotal,
        totalPaid,
        remaining
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}