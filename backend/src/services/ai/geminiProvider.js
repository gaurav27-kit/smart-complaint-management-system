import { GoogleGenAI } from "@google/genai";
import AIProvider from "./aiProvider.js";

/**
 * Gemini implementation of the AIProvider using @google/genai.
 */
export default class GeminiProvider extends AIProvider {
  constructor(config = {}) {
    super(config);
    // Explicitly pass the API key to prevent ADC fallback errors
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GeminiProvider initialized without an API key.");
    }
    this.ai = new GoogleGenAI({ apiKey });
    // Use gemini-2.0-flash as the default fast and cost-effective model
    this.modelName = config.modelName || "gemini-2.0-flash";
  }

  /**
   * Analyzes the text and enforces a JSON object response.
   */
  async analyze(systemPrompt, userPrompt) {
    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          }
        ],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          temperature: 0.1, // Low temperature for deterministic categorization
        },
      });

      const responseText = response.text;
      
      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error("Gemini failed to return valid JSON:", responseText);
        throw new Error("AI returned invalid JSON format.");
      }
    } catch (error) {
      console.error("Gemini API Error:", error.message);
      throw error;
    }
  }
}
