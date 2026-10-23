/**
 * Format raw 24-character MongoDB ObjectId into a clean, simple, reliable ID
 * e.g. "6a7c493c9f1badd5c8c1e57c" -> "#C1E57C"
 */
export const formatComplaintId = (id) => {
  if (!id) return "N/A";
  const str = String(id).trim();
  if (str.startsWith("#")) return str.toUpperCase();
  return `#${str.slice(-6).toUpperCase()}`;
};

export default formatComplaintId;
