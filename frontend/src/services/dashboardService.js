import API from "../api/axios";

/**
 * Fetch Department Member Assigned Complaints from backend.
 * Consumes member-specific endpoint /member/complaints.
 * Errors are propagated to the caller for proper UI error handling.
 */
export const getRecentAssignedComplaints = async (params = {}) => {
  const response = await API.get("/member/complaints", { params });
  return response.data;
};

/**
 * Fetch Department Member Dashboard statistics from backend.
 * Consumes member-specific endpoint /member/dashboard.
 * Errors are propagated to the caller for proper UI error handling.
 */
export const getMemberDashboardStats = async () => {
  const response = await API.get("/member/dashboard");
  return response.data;
};

export const assignMemberComplaint = async (id, memberId) => {
  const response = await API.patch(`/member/complaints/${id}/assign`, { memberId });
  return response.data;
};

export const getDepartmentOfficers = async () => {
  const response = await API.get("/member/officers");
  return response.data;
};

export const getMemberProfile = async () => {
  const response = await API.get("/member/profile");
  return response.data;
};

export const changeMemberPassword = async (passwordData) => {
  const response = await API.patch("/member/change-password", passwordData);
  return response.data;
};

const dashboardService = {
  getMemberDashboardStats,
  getRecentAssignedComplaints,
  assignMemberComplaint,
  getDepartmentOfficers,
  getMemberProfile,
  changeMemberPassword,
};

export default dashboardService;
