import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const model = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';

export async function callClaude(prompt: string): Promise<string> {
    const msg = await client.messages.create({
        model,
        max_tokens: 4096,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
    });
    const block = msg.content[0];
    if (block.type !== 'text') throw new Error('Unexpected response type');
    return block.text;
}

export async function callClaudeJSON<T>(prompt: string): Promise<T> {
    const text = await callClaude(prompt);
    const match =
        text.match(/```json\s*([\s\S]*?)```/) ||
        text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (!match) throw new Error('No JSON found in response');
    return JSON.parse(match[1]) as T;
}
