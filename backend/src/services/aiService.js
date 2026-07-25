import GeminiProvider from "./ai/geminiProvider.js";
import {
  COMPLAINT_ANALYSIS_SYSTEM_PROMPT,
  buildComplaintAnalysisPrompt,
} from "../prompts/complaintPrompt.js";

class AIService {
  constructor() {
    this.provider = null;
    this.initialized = false;
  }

  /**
   * Initializes the correct AI provider based on environment variables.
   * Defaults to Gemini if GEMINI_API_KEY is present.
   */
  init() {
    if (this.initialized) return;

    if (process.env.GEMINI_API_KEY) {
      this.provider = new GeminiProvider();
      this.initialized = true;
      console.log("AI Service initialized using GeminiProvider");
    } else {
      console.warn("No AI API keys found. AI features will be disabled.");
    }
  }

  /**
   * Analyzes a complaint title and description to predict metadata.
   * @param {string} title 
   * @param {string} description 
   * @returns {Promise<Object>}
   */
  async analyzeComplaint(title, description) {
    this.init();

    if (!this.provider) {
      throw new Error("AI Service is not configured. Please set an API key.");
    }

    if (!title || !description) {
      throw new Error("Title and description are required for AI analysis.");
    }

    const userPrompt = buildComplaintAnalysisPrompt(title, description);

    try {
      const result = await this.provider.analyze(
        COMPLAINT_ANALYSIS_SYSTEM_PROMPT,
        userPrompt
      );

      // Validate required fields from the expected JSON schema
      const requiredFields = ["category", "priority", "department", "severity", "summary", "estimatedResolution", "confidence"];
      for (const field of requiredFields) {
        if (result[field] === undefined) {
          throw new Error(`AI response missing expected field: ${field}`);
        }
      }

      return {
        ...result,
        modelName: this.provider.modelName,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error("AIService - analyzeComplaint failed:", error);
      throw error;
    }
  }
}

export default new AIService();
