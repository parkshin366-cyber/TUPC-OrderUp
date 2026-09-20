import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./config/db";
import User from "./models/User";

dotenv.config();

async function seedAdmin() {
  try {
    await connectDB();

    const adminUsername = "admin";
    const adminEmail = "admin@tupc-orderup.local";
    const adminPassword = "Admin123456";

    const existingAdmin = await User.findOne({
      $or: [
        { username: adminUsername },
        { email: adminEmail },
      ],
    });

    if (existingAdmin) {
      console.log("Admin account already exists.");
      console.log(`Username: ${existingAdmin.username}`);
      console.log(`Role: ${existingAdmin.role}`);
      console.log(`Status: ${existingAdmin.status}`);

      await mongoose.connection.close();
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await User.create({
      firstName: "Master",
      lastName: "Admin",
      username: adminUsername,
      email: adminEmail,
      contact: "09000000000",
      password: hashedPassword,
      role: "admin",
      status: "approved",
    });

    console.log("----------------------------------------");
    console.log("Admin account created successfully");
    console.log(`Username: ${admin.username}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Status: ${admin.status}`);
    console.log("----------------------------------------");

    await mongoose.connection.close();
  } catch (error) {
    console.error("Admin seed failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedAdmin();