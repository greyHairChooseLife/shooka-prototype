import { NextResponse } from 'next/server';
import {
    savePrompt,
    resetPrompt,
    type PromptName,
    PROMPT_NAMES,
} from '@/lib/prompt-store';

type Params = { params: Promise<{ name: string }> };

function isValidName(name: string): name is PromptName {
    return PROMPT_NAMES.includes(name as PromptName);
}

export async function PUT(req: Request, { params }: Params) {
    const { name } = await params;
    if (!isValidName(name)) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const { content } = await req.json();
    if (typeof content !== 'string' || !content.trim()) {
        return NextResponse.json(
            { error: 'content required' },
            { status: 400 },
        );
    }
    savePrompt(name, content);
    return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
    const { name } = await params;
    if (!isValidName(name)) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    resetPrompt(name);
    return NextResponse.json({ ok: true });
}
