/**
 * Base AIProvider interface/abstraction.
 * All specific AI implementations (Gemini, OpenAI, Claude, etc.) should extend this.
 */
export default class AIProvider {
  /**
   * Initialize the provider with necessary configuration/API keys.
   */
  constructor(config) {
    if (new.target === AIProvider) {
      throw new TypeError("Cannot construct AIProvider instances directly");
    }
  }

  /**
   * Analyze the given text and return structured JSON.
   *
   * @param {string} systemPrompt - The system instructions.
   * @param {string} userPrompt - The user's input to analyze.
   * @returns {Promise<Object>} The parsed JSON result.
   */
  async analyze(systemPrompt, userPrompt) {
    throw new Error("Method 'analyze()' must be implemented by subclass.");
  }
}
