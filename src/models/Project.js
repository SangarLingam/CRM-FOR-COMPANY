import mongoose from "mongoose";

const MilestoneSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  status:      { type: String, enum: ["pending","in_progress","completed"], default: "pending" },
  dueDate:     { type: Date },
  completedAt: { type: Date },
  order:       { type: Number, default: 0 },
});

const ProjectSchema = new mongoose.Schema(
  {
    customerId:  { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    leadId:      { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },
    projectName: { type: String, required: true },
    designerId:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status:      {
      type: String,
      enum: ["planning","design","in_progress","completed"],
      default: "planning",
    },
    startDate:   { type: Date },
    endDate:     { type: Date },
    description: { type: String },
    totalBudget: { type: Number },
    milestones:  [MilestoneSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Project || mongoose.model("Project", ProjectSchema);