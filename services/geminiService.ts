import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

// CAMBIO AQUÍ: Usamos process.env.API_KEY para cumplir con las guías
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let chat: Chat | null = null;

function getChatSession(): Chat {
  if (!chat) {
    chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
  }
  return chat;
}

export async function sendMessage(message: string): Promise<string> {
  const currentChat = getChatSession();
  const response: GenerateContentResponse = await currentChat.sendMessage({ message });
  return response.text || "";
}