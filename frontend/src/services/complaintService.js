import API from "../api/axios";

export const getComplaints = async () => {
  const response = await API.get("/complaints");
  return response.data;
};

export const getComplaintById = async (id) => {
  const response = await API.get(`/complaints/${id}`);
  return response.data;
};

/**
 * Create a new complaint. Accepts FormData (when images attached) or plain object.
 */
export const createComplaint = async (data) => {
  const isFormData = data instanceof FormData;
  const response = await API.post("/complaints", data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
  });
  return response.data;
};

/**
 * Update a complaint. Uses PATCH (preferred).
 * Accepts FormData (when images are being added/removed) or plain object.
 */
export const updateComplaint = async (id, data) => {
  const isFormData = data instanceof FormData;
  const response = await API.patch(`/complaints/${id}`, data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
  });
  return response.data;
};

export const deleteComplaint = async (id) => {
  const response = await API.delete(`/complaints/${id}`);
  return response.data;
};

export const getComplaintTimeline = async (id) => {
  const response = await API.get(`/complaints/${id}/timeline`);
  return response.data;
};

const complaintService = {
  getComplaints,
  getComplaintById,
  getComplaintTimeline,
  createComplaint,
  updateComplaint,
  deleteComplaint,
};

export default complaintService;