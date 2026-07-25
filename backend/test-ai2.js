import { GoogleGenAI } from "@google/genai";

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: "AIzaSyFakeKey123" });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello"
    });
    console.log(response);
  } catch (err) {
    console.error("EXPECTED FAILURE:", err.message);
  }
}
test();
