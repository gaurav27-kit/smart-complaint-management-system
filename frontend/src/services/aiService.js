import API from "../api/axios";

/**
 * Calls the backend AI analysis endpoint.
 *
 * @param {string} title 
 * @param {string} description 
 * @returns {Promise<Object>} The AI prediction metadata
 */
export const analyzeComplaintText = async (title, description) => {
  const response = await API.post("/ai/analyze-complaint", {
    title,
    description,
  });
  return response.data.data;
};

const aiService = {
  analyzeComplaintText,
};

export default aiService;
