
import { GoogleGenAI, Type } from "@google/genai";

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: "Server configuration error: API_KEY missing" }) 
    };
  }

  try {
    const { currentVersion, changeDescription } = JSON.parse(event.body);
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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: response.text
    };
  } catch (error: any) {
    console.error("AI Suggestion Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
