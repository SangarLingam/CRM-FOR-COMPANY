import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true },
    password:  { type: String, required: true },
    role:      {
      type: String,
      enum: ["super_admin", "manager", "sales", "designer"],
      required: true,
    },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isActive:  { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

UserSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.models.User || mongoose.model("User", UserSchema);