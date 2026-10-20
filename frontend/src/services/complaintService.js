import API from "../api/axios";

export const getComplaints = async (page = 1, limit = 20) => {
  const response = await API.get("/complaints", {
    params: { page, limit },
  });
  return response.data;
};

export const getComplaintById = async (id) => {
  try {
    const response = await API.get(`/complaints/${id}`);
    return response.data;
  } catch (error) {
    const response = await API.get(`/member/complaints/${id}`);
    return response.data;
  }
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

/**
 * Update complaint status using existing backend endpoints.
 */
export const updateComplaintStatus = async (id, statusData) => {
  const payload = typeof statusData === "string" ? { status: statusData } : statusData;
  try {
    const response = await API.patch(`/member/complaints/${id}/status`, payload);
    return response.data;
  } catch {
    try {
      const response = await API.patch(`/complaints/${id}/status`, payload);
      return response.data;
    } catch {
      try {
        const response = await API.patch(`/admin/complaints/${id}/status`, payload);
        return response.data;
      } catch {
        const response = await API.patch(`/complaints/${id}`, payload);
        return response.data;
      }
    }
  }
};

/**
 * Add an internal resolution note to a complaint via POST /member/complaints/:id/notes
 */
export const addComplaintNote = async (id, noteText) => {
  const response = await API.post(`/member/complaints/${id}/notes`, {
    note: noteText,
  });
  return response.data;
};

/**
 * Upload resolution proof files for a complaint via POST /member/complaints/:id/proof
 */
export const uploadResolutionProof = async (id, fileItems) => {
  const formData = new FormData();

  if (Array.isArray(fileItems)) {
    fileItems.forEach((item) => {
      const rawFile = item.file || item.fileObj || item.raw || item;
      if (rawFile instanceof File) {
        formData.append("images", rawFile);
      }
    });
  } else if (fileItems instanceof FormData) {
    const response = await API.post(`/member/complaints/${id}/proof`, fileItems, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  const response = await API.post(`/member/complaints/${id}/proof`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
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
  updateComplaintStatus,
  addComplaintNote,
  uploadResolutionProof,
  deleteComplaint,
};

export default complaintService;