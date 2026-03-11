import mongoose from "mongoose";

const QuoteItemSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String },
  quantity:    { type: Number, required: true, min: 1 },
  unitPrice:   { type: Number, required: true, min: 0 },
  total:       { type: Number },
});

const RevisionSchema = new mongoose.Schema({
  revisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reason:    { type: String },
  revivedAt: { type: Date, default: Date.now },
});

const QuoteSchema = new mongoose.Schema(
  {
    projectId:      { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    customerId:     { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    quoteNumber:    { type: String, unique: true },
    items:          [QuoteItemSchema],
    subtotal:       { type: Number, default: 0 },
    tax:            { type: Number, default: 0 },
    discount:       { type: Number, default: 0 },
    totalAmount:    { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft","pending_approval","approved","sent","accepted","rejected","revision"],
      default: "draft",
    },
    notes:          { type: String },
    validUntil:     { type: Date },
    createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt:     { type: Date },
    revisionReason: { type: String },
    revisions:      [RevisionSchema],
  },
  { timestamps: true }
);

QuoteSchema.pre("save", function () {
  if (!this.quoteNumber) {
    this.quoteNumber = "QT-" + Date.now();
  }
  this.subtotal = this.items.reduce((sum, item) => {
    item.total = item.quantity * item.unitPrice;
    return sum + item.total;
  }, 0);
  this.totalAmount = this.subtotal + (Number(this.tax) || 0) - (Number(this.discount) || 0);
});

delete mongoose.models["Quote"];
export default mongoose.model("Quote", QuoteSchema);