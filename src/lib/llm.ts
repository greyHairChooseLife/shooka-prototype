import { callClaude } from '@/lib/anthropic';
import { callGemini } from '@/lib/gemini';

const provider = process.env.AI_PROVIDER || 'anthropic';

async function callLLM(prompt: string): Promise<string> {
    if (provider === 'gemini') return callGemini(prompt);
    return callClaude(prompt);
}

export async function callLLMJSON<T>(prompt: string): Promise<T> {
    const text = await callLLM(prompt);
    const match =
        text.match(/```json\s*([\s\S]*?)```/) ||
        text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (!match) throw new Error('No JSON found in response');
    return JSON.parse(match[1]) as T;
}
