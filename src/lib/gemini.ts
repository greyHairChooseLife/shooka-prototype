import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

export async function callGemini(prompt: string): Promise<string> {
    const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: 0.1 },
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
}
