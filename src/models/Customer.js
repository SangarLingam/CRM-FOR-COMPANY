import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    leadId:  { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true },
    name:    { type: String, required: true },
    phone:   { type: String, required: true },
    email:   { type: String, lowercase: true },
    address: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);