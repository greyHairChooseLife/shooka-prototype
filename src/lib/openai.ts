import OpenAI from 'openai';

export async function callOpenAI(prompt: string): Promise<string> {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const msg = await client.chat.completions.create({
        model: modelName,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
    });
    const content = msg.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from OpenAI');
    return content;
}
