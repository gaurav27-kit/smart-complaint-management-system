import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";

async function listModels() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.list();
    // In @google/genai, ai.models.list() returns an iterable or array of models
    // Let's just print them
    for await (const model of response) {
      if (model.name.includes("flash") || model.name.includes("pro")) {
        console.log(model.name);
      }
    }
  } catch (err) {
    console.error("Failed to list models:", err.message);
  }
}

listModels();
