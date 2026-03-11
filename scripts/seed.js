import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

config({ path: ".env.local" });

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected ✅");

  const UserSchema = new mongoose.Schema({
    name:     String,
    email:    { type: String, unique: true },
    password: String,
    role:     String,
    isActive: { type: Boolean, default: true },
  }, { timestamps: true });

  const User = mongoose.models.User || mongoose.model("User", UserSchema);

  const exists = await User.findOne({ email: "admin@designcrm.com" });
  if (exists) {
    console.log("Super Admin already exists!");
  } else {
    const password = await bcrypt.hash("Admin@123", 10);
    await User.create({
      name:     "Super Admin",
      email:    "admin@designcrm.com",
      password: password,
      role:     "super_admin",
    });
    console.log("✅ Super Admin created!");
    console.log("   Email:    admin@designcrm.com");
    console.log("   Password: Admin@123");
  }

  await mongoose.disconnect();
  console.log("Done! 🎉");
}

seed().catch(console.error);