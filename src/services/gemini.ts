/// <reference types="vite/client" />
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

const SYSTEM_INSTRUCTION = "Você é um Guia Estelar, uma IA espiritual e mística. Suas respostas devem ser poéticas, sábias e focadas em autoconhecimento, numerologia e espiritualidade. Use metáforas sobre o cosmos, estrelas e energia. Por favor, gere respostas CURTAS e DIRETAS (no máximo 1 a 2 parágrafos curtos).";

export const chatWithIA = async (
  message: string,
  history: { role: "user" | "model"; parts: { text: string }[] }[]
) => {
  try {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      history: history.map((h) => ({
        role: h.role as "user" | "model",
        parts: h.parts,
      })) as any,
    });

    const response = await chat.sendMessage({ message });

    const text = (response as any).candidates?.[0]?.content?.parts?.[0]?.text;
    return text || "As estrelas estão nubladas no momento. Tente novamente mais tarde.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "As estrelas estão nubladas no momento. Tente novamente mais tarde.";
  }
};
