import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Customer from "@/models/Customer";
import Project from "@/models/Project";
import { getUser } from "@/lib/auth";

const VALID = ["new","contacted","site_visit","quote_sent","won","lost"];

export async function PATCH(req, context) {
  try {
    const { id } = await context.params;
    const caller = getUser(req);
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { status } = await req.json();
    console.log("STATUS UPDATE:", id, status);

    if (!VALID.includes(status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }

    const lead = await Lead.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });

    // Auto create Customer + Project when WON
    if (status === "won") {
      let customer = await Customer.findOne({ leadId: lead._id });

      if (!customer) {
        customer = await Customer.create({
          leadId:  lead._id,
          name:    lead.customerName,
          phone:   lead.phone,
          email:   lead.email,
          address: lead.address,
        });
        console.log("Customer created:", customer._id);
      }

      const existingProject = await Project.findOne({ leadId: lead._id });
      if (!existingProject) {
        await Project.create({
          customerId:  customer._id,
          leadId:      lead._id,
          projectName: `${lead.customerName} - Interior Design`,
          designerId:  lead.assignedDesigner || null,
          status:      "planning",
        });
        console.log("Project created!");
      }

      return Response.json({
        lead,
        message: "Lead won! Customer and Project created automatically ✅",
      });
    }

    return Response.json({ lead, message: "Status updated successfully" });

  } catch (error) {
    console.log("STATUS ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}