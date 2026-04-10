import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL = 'gemini-2.0-flash';

export function getGeminiModel() {
  const key = process.env.GOOGLE_API_KEY?.trim();
  if (!key) {
    throw new Error('GOOGLE_API_KEY is not set');
  }
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      maxOutputTokens: 512,
      temperature: 0.5,
    },
  });
}

/** Single-turn text generation for server routes and scripts. */
export async function generateGeminiText(systemHint: string, userPrompt: string): Promise<string> {
  const model = getGeminiModel();
  const prompt = `${systemHint}\n\n---\n\n${userPrompt}`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return text.trim() || 'No response from the model.';
}
