
import { GoogleGenAI, Type } from "@google/genai";

// During build time, process.env.API_KEY might be undefined, 
// but Vite will inject it at runtime.
const apiKey = (process.env as any).API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const suggestVersionAndReleaseNotes = async (
  currentVersion: string,
  changeDescription: string
) => {
  if (!apiKey) {
    console.warn("API_KEY is missing. AI suggestions will not work.");
    return null;
  }
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Current Version: ${currentVersion}. Change Description: ${changeDescription}. 
      Suggest the next semantic version number and a professional summarized release note for functional documentation.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedVersion: { type: Type.STRING },
            formalDescription: { type: Type.STRING },
            impactLevel: { type: Type.STRING, description: "Low, Medium, or High" }
          },
          required: ["suggestedVersion", "formalDescription", "impactLevel"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini suggestion error:", error);
    return null;
  }
};
