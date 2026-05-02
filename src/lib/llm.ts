import { callClaude } from '@/lib/anthropic';
import { callGemini } from '@/lib/gemini';
import { callOpenAI } from '@/lib/openai';

const provider = process.env.AI_PROVIDER || 'openai';

async function callLLM(prompt: string): Promise<string> {
    if (provider === 'gemini') return callGemini(prompt);
    if (provider === 'openai') return callOpenAI(prompt);
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
