import mongoose from "mongoose";

const InstallmentSchema = new mongoose.Schema({
  label:       { type: String }, // "Advance", "Mid Payment", "Final"
  percentage:  { type: Number }, // 30, 40, 30
  amount:      { type: Number },
  dueDate:     { type: Date },
  paidDate:    { type: Date },
  status:      { type: String, enum: ["pending","paid","overdue"], default: "pending" },
  method:      { type: String, enum: ["upi","bank_transfer","cash"] },
  reference:   { type: String },
});

const PaymentSchema = new mongoose.Schema(
  {
    projectId:    { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    customerId:   { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    quoteId:      { type: mongoose.Schema.Types.ObjectId, ref: "Quote" },
    totalAmount:  { type: Number, required: true },
    paidAmount:   { type: Number, default: 0 },
    installments: [InstallmentSchema],
    paymentMethod:{ type: String, enum: ["upi","bank_transfer","cash"] },
    status:       { type: String, enum: ["pending","partial","completed"], default: "pending" },
    reference:    { type: String },
    notes:        { type: String },
    recordedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);