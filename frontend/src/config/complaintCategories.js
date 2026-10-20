/**
 * @file complaintCategories.js
 * @description Centralized Citizen-Friendly Complaint Categories configuration with stable internal values.
 */

export const COMPLAINT_CATEGORIES = [
  {
    label: "Road Damage / Potholes",
    value: "ROAD_DAMAGE",
    department: "ROAD",
  },
  {
    label: "Water Supply / Leakage",
    value: "WATER_LEAKAGE",
    department: "WATER",
  },
  {
    label: "Garbage Collection",
    value: "GARBAGE_COLLECTION",
    department: "GARBAGE",
  },
  {
    label: "Street Light Issue",
    value: "STREET_LIGHT",
    department: "ELECTRIC",
  },
  {
    label: "Drainage Problem",
    value: "DRAINAGE",
    department: "ROAD",
  },
  {
    label: "Public Safety",
    value: "PUBLIC_SAFETY",
    department: "SAFETY",
  },
  {
    label: "Health & Sanitation",
    value: "HEALTH_SANITATION",
    department: "HEALTH",
  },
  {
    label: "IT / Website Issue",
    value: "IT_WEBSITE",
    department: "IT",
  },
  {
    label: "Other",
    value: "OTHER",
    department: null,
  },
];

/**
 * Map raw AI category predictions to the corresponding internal category value.
 *
 * @param {string} suggestedCategory - Category predicted by AI assistant
 * @returns {string} Matching internal category value (e.g., ROAD_DAMAGE)
 */
export const mapAISuggestionToCategory = (suggestedCategory) => {
  if (!suggestedCategory || typeof suggestedCategory !== "string") {
    return "OTHER";
  }

  const norm = suggestedCategory.trim().toUpperCase();

  if (norm.includes("ROAD_DAMAGE") || norm.includes("POTHOLE") || norm === "ROAD") return "ROAD_DAMAGE";
  if (norm.includes("WATER_LEAKAGE") || norm.includes("LEAK") || norm === "WATER") return "WATER_LEAKAGE";
  if (norm.includes("GARBAGE_COLLECTION") || norm.includes("WASTE") || norm === "GARBAGE") return "GARBAGE_COLLECTION";
  if (norm.includes("STREET_LIGHT") || norm.includes("LIGHT")) return "STREET_LIGHT";
  if (norm.includes("DRAINAGE") || norm.includes("SEWER")) return "DRAINAGE";
  if (norm.includes("PUBLIC_SAFETY") || norm.includes("SAFETY")) return "PUBLIC_SAFETY";
  if (norm.includes("HEALTH_SANITATION") || norm.includes("HEALTH") || norm.includes("SANITATION")) return "HEALTH_SANITATION";
  if (norm.includes("IT_WEBSITE") || norm.includes("WEBSITE") || norm === "IT") return "IT_WEBSITE";

  return "OTHER";
};

/**
 * Get user-friendly display label for any category value (including legacy category strings).
 *
 * @param {string} categoryValue - Category value or legacy string
 * @returns {string} User-friendly display label
 */
export const getCategoryLabel = (categoryValue) => {
  if (!categoryValue || typeof categoryValue !== "string") {
    return "Other";
  }

  const match = COMPLAINT_CATEGORIES.find(
    (c) => c.value === categoryValue || c.label === categoryValue
  );

  if (match) {
    return match.label;
  }

  // Handle legacy string values for backwards compatibility
  const norm = categoryValue.trim().toUpperCase();
  if (norm === "ROAD") return "Road Damage / Potholes";
  if (norm === "WATER") return "Water Supply / Leakage";
  if (norm === "GARBAGE") return "Garbage Collection";
  if (norm === "STREET LIGHT" || norm === "STREET LIGHT ISSUE") return "Street Light Issue";
  if (norm === "DRAINAGE" || norm === "DRAINAGE PROBLEM") return "Drainage Problem";
  if (norm === "ELECTRICITY" || norm === "ELECTRIC") return "Street Light Issue";
  if (norm === "HEALTH") return "Health & Sanitation";
  if (norm === "SAFETY" || norm === "PUBLIC SAFETY") return "Public Safety";
  if (norm === "IT") return "IT / Website Issue";

  return categoryValue;
};
