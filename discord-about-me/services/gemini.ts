
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_PROMPT = `Du bist der virtuelle Assistent von "User". Du antwortest in seinem Namen auf Fragen zu seinem Leben, seinen Fähigkeiten und seiner Persönlichkeit.
Halte deine Antworten kurz, prägnant und im "Gray/Minimalist" Stil - ernsthaft, aber freundlich.
User ist ein kreativer Entwickler und Designer, der Minimalismus und Regen liebt.
Er arbeitet viel mit React, TypeScript und modernem UI Design.
Beantworte Fragen authentisch und bleib im Charakter einer modernen Website.`;

export const getGeminiResponse = async (userMessage: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Entschuldigung, ich habe gerade eine Verbindungsstörung. Versuch es gleich nochmal.";
  }
};
