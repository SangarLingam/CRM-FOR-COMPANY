import mongoose from "mongoose";

const ActivitySchema = new mongoose.Schema({
  action:     { type: String, required: true },
  note:       { type: String },
  doneBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  doneByName: { type: String },
  doneAt:     { type: Date, default: Date.now },
});

const LeadSchema = new mongoose.Schema(
  {
    customerName:     { type: String, required: true, trim: true },
    phone:            { type: String, required: true },
    email:            { type: String, lowercase: true },
    address:          { type: String },
    leadSource: {
      type: String,
      enum: ["website","referral","social_media","walk_in","other"],
      default: "other",
    },
    status: {
      type: String,
      enum: ["new","contacted","site_visit","quote_sent","won","lost"],
      default: "new",
    },
    assignedSales:    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assignedDesigner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    notes:            { type: String },
    budget:           { type: Number },
    projectType:      { type: String },
    followUpDate:     { type: Date },
    activityLog:      [ActivitySchema],
  },
  { timestamps: true }
);

export default mongoose.models.Lead || mongoose.model("Lead", LeadSchema);