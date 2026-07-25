/**
 * @file departmentSeeder.js
 * @description Idempotent database seeder for initial SCMS departments.
 *
 * Responsibilities:
 * - Seed default departments into MongoDB
 * - Prevent duplicate insertions by checking department code existence
 * - Safe for repeated execution without side effects
 */

import Department from "../models/Department.js";
import logger from "../utils/logger.js";

const defaultDepartments = [
  {
    name: "Road Department",
    code: "ROAD",
    description: "Handles road maintenance, potholes, street infrastructure, and paving.",
    isActive: true,
  },
  {
    name: "Water Supply",
    code: "WATER",
    description: "Manages municipal water supply, pipeline leaks, pressure, and water quality.",
    isActive: true,
  },
  {
    name: "Electricity",
    code: "ELECTRIC",
    description: "Manages power grid, street lighting power, transformers, and power outages.",
    isActive: true,
  },
  {
    name: "Garbage Management",
    code: "GARBAGE",
    description: "Handles waste collection, dumping sites, recycling, and street sanitation.",
    isActive: true,
  },
  {
    name: "Public Safety",
    code: "SAFETY",
    description: "Manages public safety hazards, dangerous structures, and community safety issues.",
    isActive: true,
  },
  {
    name: "Health Department",
    code: "HEALTH",
    description: "Handles public health inspections, vector control, food hygiene, and sanitation.",
    isActive: true,
  },
  {
    name: "IT Support",
    code: "IT",
    description: "Manages municipal IT infrastructure, online portal services, and digital support.",
    isActive: true,
  },
];

/**
 * Seed default departments idempotently.
 *
 * @param {Object} options
 * @param {mongoose.Types.ObjectId} [options.adminId] - Optional ObjectId of admin user creating the initial seed
 * @returns {Promise<{ seeded: number, skipped: number, total: number }>} Seeding results summary
 */
export const seedDepartments = async ({ adminId } = {}) => {
  let seededCount = 0;
  let skippedCount = 0;

  try {
    logger.info({ message: "Starting department seeding process..." });

    for (const deptData of defaultDepartments) {
      const existingDept = await Department.findOne({ code: deptData.code });

      if (existingDept) {
        skippedCount++;
        continue;
      }

      await Department.create({
        ...deptData,
        ...(adminId && { createdBy: adminId }),
      });

      seededCount++;
    }

    const summary = {
      seeded: seededCount,
      skipped: skippedCount,
      total: defaultDepartments.length,
    };

    logger.info({
      message: "Department seeding completed",
      ...summary,
    });

    return summary;
  } catch (error) {
    logger.error({
      message: "Failed to seed departments",
      error: error.message,
    });
    throw error;
  }
};

export default seedDepartments;
