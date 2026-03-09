import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

export const chatWithIA = async (message: string, history: { role: "user" | "model"; parts: { text: string }[] }[]) => {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: "Você é um Guia Estelar, uma IA espiritual e mística. Suas respostas devem ser poéticas, sábias e focadas em autoconhecimento, numerologia e espiritualidade. Use metáforas sobre o cosmos, estrelas e energia. Por favor, gere respostas CURTAS e DIRETAS (no máximo 1 a 2 parágrafos curtos).",
      },
      history: history,
    });

    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "As estrelas estão nubladas no momento. Tente novamente mais tarde.";
  }
};
