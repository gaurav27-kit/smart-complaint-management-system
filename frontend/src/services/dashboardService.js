import API from "../api/axios";

/**
 * Fetch Department Member Assigned Complaints from backend.
 * Consumes member-specific endpoint /api/member/complaints.
 */
export const getRecentAssignedComplaints = async (params = {}) => {
  try {
    const response = await API.get("/api/member/complaints", { params });
    return response.data;
  } catch (error) {
    const fallback = await API.get("/complaints", { params });
    return fallback.data;
  }
};

/**
 * Fetch Department Member Dashboard statistics from backend.
 * Consumes member-specific endpoint /api/member/dashboard.
 */
export const getMemberDashboardStats = async () => {
  try {
    const response = await API.get("/api/member/dashboard");
    return response.data;
  } catch (error) {
    // Fallback: derive metrics from /complaints if server is restarting
    const data = await getRecentAssignedComplaints();
    const complaints = Array.isArray(data)
      ? data
      : data.complaints || data.data || [];

    const total = complaints.length;
    const pending = complaints.filter(
      (c) => c.status?.toLowerCase() === "pending"
    ).length;
    const inProgress = complaints.filter(
      (c) => c.status?.toLowerCase() === "in progress"
    ).length;
    const resolved = complaints.filter(
      (c) => c.status?.toLowerCase() === "resolved"
    ).length;
    const closed = complaints.filter(
      (c) => c.status?.toLowerCase() === "closed"
    ).length;

    return {
      success: true,
      totalComplaints: total,
      pending,
      inProgress,
      resolved,
      closed,
      complaints,
    };
  }
};

const dashboardService = {
  getMemberDashboardStats,
  getRecentAssignedComplaints,
};

export default dashboardService;
