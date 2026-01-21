
import { GoogleGenAI, Type } from "@google/genai";

export const suggestVersionAndReleaseNotes = async (
  currentVersion: string,
  changeDescription: string
) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
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

    if (!response.text) return null;
    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI suggestion error:", error);
    return null;
  }
};
