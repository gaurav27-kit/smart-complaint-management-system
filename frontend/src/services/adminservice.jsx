import API from "../api/axios";

// Dashboard Statistics
export const getDashboardStats = async () => {
  const response = await API.get("/admin/dashboard");
  return response.data;
};

// All Complaints
export const getAllComplaints = async (params = {}) => {
  const response = await API.get("/admin/complaints", {
    params,
  });
  return response.data;
};

// Single Complaint
export const getComplaintById = async (id) => {
  const response = await API.get(`/admin/complaints/${id}`);
  return response.data;
};

// Update Complaint Status
export const updateComplaintStatus = async (id, status) => {
  const response = await API.patch(`/admin/complaints/${id}/status`, {
    status,
  });
  return response.data;
};

// Delete Complaint
export const deleteComplaint = async (id) => {
  const response = await API.delete(`/admin/complaints/${id}`);
  return response.data;
};

// Analytics
export const getAnalytics = async () => {
  const response = await API.get("/admin/analytics");
  return response.data;
};

// Change Admin Password
export const changeAdminPassword = async (passwordData) => {
  const response = await API.patch("/admin/change-password", passwordData);
  return response.data;
};

