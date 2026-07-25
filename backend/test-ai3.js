import dotenv from "dotenv";
dotenv.config();

import aiService from "./src/services/aiService.js";

async function test() {
  console.log("API Key exists?", !!process.env.GEMINI_API_KEY);
  try {
    const result = await aiService.analyzeComplaint("Test title", "Test description for a road problem");
    console.log("Success:", result);
  } catch (err) {
    console.error("FULL ERROR DETAILS:");
    console.error(err);
    console.error("Error Message:", err.message);
    if (err.response) {
      console.error("Error Response:", err.response);
    }
  }
}

test();
