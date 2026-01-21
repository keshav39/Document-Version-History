
import { GoogleGenAI, Type } from "@google/genai";

export const suggestVersionAndReleaseNotes = async (
  currentVersion: string,
  changeDescription: string
) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
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

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI suggestion error:", error);
    return null;
  }
};
