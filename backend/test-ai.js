import { GoogleGenAI } from "@google/genai";

async function test() {
  try {
    const ai = new GoogleGenAI({});
    console.log("Instantiated");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello world"
    });
    console.log(response.text);
  } catch (err) {
    console.error("FAILED:", err);
  }
}
test();
