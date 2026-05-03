import { NextResponse } from 'next/server';
import { PROMPT_NAMES, getPrompt, isCustomized } from '@/lib/prompt-store';

export async function GET() {
    const prompts = PROMPT_NAMES.map((name) => ({
        name,
        content: getPrompt(name),
        customized: isCustomized(name),
    }));
    return NextResponse.json(prompts);
}
