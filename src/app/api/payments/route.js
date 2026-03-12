import { connectDB } from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Project from "@/models/Project";
import Quote from "@/models/Quote";
import { getUser } from "@/lib/auth";

/* =========================
   GET PAYMENTS
========================= */
export async function GET(req) {
  try {
    const caller = getUser(req);
    if (!caller) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();

    // ✅ Filter out ₹0 records so old bad data never shows in UI
    const payments = await Payment.find({ amount: { $gt: 0 } })
      .populate("projectId", "projectName totalBudget")
      .populate("customerId", "name phone")
      .populate("quoteId", "quoteNumber totalAmount")
      .populate("recordedBy", "name")
      .sort({ paymentDate: -1, createdAt: -1 });

    return Response.json({ payments });
  } catch (e) {
    console.error("GET /api/payments ERROR:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

/* =========================
   CREATE PAYMENT
========================= */
export async function POST(req) {
  try {
    const caller = getUser(req);
    if (!caller) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["super_admin", "manager", "sales"].includes(caller.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();

    body.recordedBy = caller.id;

    /* Convert numeric values */
    body.amount = Number(body.amount) || 0;
    body.installmentNo = body.installmentNo
      ? Number(body.installmentNo)
      : undefined;

    /* ✅ Hard guard — reject zero or negative amount immediately */
    if (body.amount <= 0) {
      return Response.json(
        { error: "Payment amount must be greater than ₹0" },
        { status: 400 }
      );
    }

    /* Auto get customer from project */
    if (!body.customerId && body.projectId) {
      const project = await Project.findById(body.projectId);
      if (project) {
        body.customerId = project.customerId;
      }
    }

    /* Get latest valid quote */
    if (body.projectId) {
      const quote = await Quote.findOne({
        projectId: body.projectId,
        status: { $in: ["approved", "sent", "accepted"] },
      }).sort({ createdAt: -1 });

      if (quote) {
        if (!body.quoteId) {
          body.quoteId = quote._id;
        }
        if (!body.totalAmount) {
          body.totalAmount = quote.totalAmount;
        }
      }
    }

    /* ✅ Fallback to 0, NOT body.amount — prevents false overpayment errors
       when no quote exists for the project                                   */
    if (!body.totalAmount) {
      body.totalAmount = 0;
    }

    /* =========================
       Prevent Overpayment
       Only runs when a real quote total exists (totalAmount > 0)
    ========================= */
    if (body.projectId && body.totalAmount > 0) {
      const existingPayments = await Payment.find({
        projectId: body.projectId,
        amount: { $gt: 0 },
      });

      const totalPaid = existingPayments.reduce(
        (sum, p) => sum + (p.amount || 0),
        0
      );

      if (totalPaid + body.amount > body.totalAmount) {
        const remaining = body.totalAmount - totalPaid;
        return Response.json(
          {
            error: `Payment exceeds quote total. Balance remaining: ₹${remaining.toLocaleString("en-IN")}`,
          },
          { status: 400 }
        );
      }
    }

    /* Create payment */
    const payment = await Payment.create(body);

    /* Return populated payment */
    const populatedPayment = await Payment.findById(payment._id)
      .populate("projectId", "projectName totalBudget")
      .populate("customerId", "name phone")
      .populate("quoteId", "quoteNumber totalAmount")
      .populate("recordedBy", "name");

    return Response.json({ payment: populatedPayment }, { status: 201 });
  } catch (e) {
    console.error("POST /api/payments ERROR:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}