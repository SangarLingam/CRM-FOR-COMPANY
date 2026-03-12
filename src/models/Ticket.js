import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema({
  title:       { type:String, required:true },
  description: { type:String, required:true },
  priority:    { type:String, enum:["low","medium","high"], default:"medium" },
  status:      { type:String, enum:["open","in_progress","escalated","resolved"], default:"open" },
  raisedBy:    { type:mongoose.Schema.Types.ObjectId, ref:"User", required:true },
  raisedByName:{ type:String },
  raisedByRole:{ type:String },
  assignedTo:  { type:mongoose.Schema.Types.ObjectId, ref:"User" },
  managerNote: { type:String },
  adminNote:   { type:String },
  resolvedAt:  { type:Date },
}, { timestamps:true });

export default mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);