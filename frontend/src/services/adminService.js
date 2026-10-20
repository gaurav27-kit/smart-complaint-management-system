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
export const getAnalytics = async (params = {}) => {
  const response = await API.get("/admin/analytics", {
    params,
  });
  return response.data;
};

// Change Admin Password
export const changeAdminPassword = async (passwordData) => {
  const response = await API.patch("/admin/change-password", passwordData);
  return response.data;
};

// Department & Department Member Services
export const getDepartments = async (params = {}) => {
  const response = await API.get("/departments", {
    params: { limit: 100, isActive: "true", ...params },
  });
  return response.data;
};

export const getDepartmentMembers = async (departmentId = "", params = {}) => {
  const url = departmentId
    ? `/departments/${departmentId}/members`
    : "/departments/members";
  const response = await API.get(url, { params });
  return response.data;
};

export const createDepartmentMember = async (memberData) => {
  const url = memberData.departmentId
    ? `/departments/${memberData.departmentId}/members`
    : "/departments/members";
  const response = await API.post(url, memberData);
  return response.data;
};

export const deleteDepartmentMember = async (memberId) => {
  const response = await API.delete(`/departments/members/${memberId}`);
  return response.data;
};

export const reactivateDepartmentMember = async (memberId) => {
  const response = await API.patch(`/departments/members/${memberId}/reactivate`);
  return response.data;
};

export const assignDepartmentToComplaint = async (id, departmentId) => {
  const response = await API.patch(`/complaints/${id}/assign-department`, {
    departmentId,
  });
  return response.data;
};
