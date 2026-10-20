import dotenv from "dotenv";
dotenv.config({ path: "backend/.env" });
import connectDB from "../config/db.js";
import Department from "../models/Department.js";
import { seedDepartments } from "../seeders/departmentSeeder.js";

async function run() {
  try {
    await connectDB();
    console.log("Connected to DB.");

    const countBefore = await Department.countDocuments();
    console.log(`Number of departments before: ${countBefore}`);

    const result = await seedDepartments();
    console.log("Seed result:", result);

    const countAfter = await Department.countDocuments();
    console.log(`Number of departments after: ${countAfter}`);

    const depts = await Department.find({}, { name: 1, code: 1, isActive: 1 }).lean();
    console.log("MongoDB Verification Output (All Departments):");
    console.log(JSON.stringify(depts, null, 2));

    process.exit(0);
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  }
}

run();
