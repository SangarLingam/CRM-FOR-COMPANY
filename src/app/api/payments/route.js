import { connectDB } from "@/lib/mongodb";
import Payment from "@/models/Payment";
import { getUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const payments = await Payment.find()
      .populate("projectId",  "projectName")
      .populate("customerId", "name phone")
      .populate("recordedBy", "name")
      .sort({ paymentDate: -1 });

    return Response.json({ payments });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body    = await req.json();
    body.recordedBy = caller.id;

    const payment = await Payment.create(body);

    return Response.json({ payment }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}