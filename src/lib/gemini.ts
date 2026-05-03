import { GoogleGenerativeAI } from '@google/generative-ai';

export async function callGemini(prompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: 0.1 },
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
}
