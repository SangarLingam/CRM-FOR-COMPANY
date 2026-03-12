import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
{
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },

  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer"
  },

  quoteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quote"
  },

  amount: {
    type: Number,
    required: true,
    default: 0
  },

  totalAmount: {
    type: Number
  },

  installmentNo: {
    type: Number
  },

  paymentDate: {
    type: Date,
    default: Date.now
  },

  nextPaymentDate: {
    type: Date
  },

  paymentMethod: {
    type: String,
    enum: ["cash", "upi", "bank_transfer", "cheque", "card"],
    default: "upi"
  },

  reference: {
    type: String
  },

  notes: {
    type: String
  },

  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

},
{
  timestamps: true
});

export default mongoose.models.Payment ||
       mongoose.model("Payment", PaymentSchema);