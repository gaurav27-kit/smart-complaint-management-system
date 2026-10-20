import aiService from "../services/aiService.js";
import logger from "../utils/logger.js";

// @desc    Analyze complaint title and description using AI
// @route   POST /api/ai/analyze-complaint
// @access  Private
export const analyzeComplaint = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (
      typeof title !== "string" ||
      typeof description !== "string" ||
      !title.trim() ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title and description must be non-empty strings.",
      });
    }

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (trimmedTitle.length > 200 || trimmedDescription.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Title cannot exceed 200 characters and description cannot exceed 2000 characters.",
      });
    }

    const analysisResult = await aiService.analyzeComplaint(trimmedTitle, trimmedDescription);

    return res.status(200).json({
      success: true,
      data: analysisResult,
    });
  } catch (error) {
    logger.error({ message: "AI Analysis Error", error: error.message });
    
    // Distinguish between service configuration errors and API/parsing errors
    if (error.message.includes("not configured")) {
      return res.status(503).json({
        success: false,
        message: "AI service is currently unavailable.",
      });
    }

    if (error.message.includes("429") || error.message.toLowerCase().includes("quota")) {
      return res.status(429).json({
        success: false,
        message: "AI service quota exceeded. Please check your API key billing details or try again later.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to analyze complaint. Please try again or proceed manually.",
    });
  }
};
