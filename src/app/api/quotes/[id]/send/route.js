import { connectDB } from "@/lib/mongodb";
import Quote from "@/models/Quote";
import { getUser } from "@/lib/auth";

export async function PATCH(req, context) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error:"Unauthorized" }, { status:401 });

    // Only sales or manager/super_admin can send quote to customer
    if (!["sales","manager","super_admin"].includes(caller.role)) {
      return Response.json({ error:"Only Sales can send quote to customer" }, { status:403 });
    }
    await connectDB();

    const { id }  = await context.params;
    const quote   = await Quote.findById(id)
      .populate("projectId",  "projectName")
      .populate("customerId", "name phone email");

    if (!quote) return Response.json({ error:"Quote not found" }, { status:404 });
    if (quote.status !== "approved") {
      return Response.json({ error:"Quote must be approved before sending" }, { status:400 });
    }

    quote.status   = "sent";
    quote.sentBy   = caller.id;
    quote.sentAt   = new Date();
    await quote.save();

    return Response.json({ quote, message:"Quote marked as sent to customer!" });
  } catch(e) {
    return Response.json({ error:e.message }, { status:500 });
  }
}