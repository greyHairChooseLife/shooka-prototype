import fs from 'fs';
import path from 'path';
import { getDb } from '@/lib/db';
import type { ChannelName } from '@/lib/types';

const DEFAULTS_DIR = path.join(process.cwd(), 'src/prompts/defaults');

export type PromptName =
    | 'generate-actions-shookaworld'
    | 'generate-actions-moneycomics';

export const PROMPT_NAMES: PromptName[] = [
    'generate-actions-shookaworld',
    'generate-actions-moneycomics',
];

export const PROMPT_LABELS: Record<PromptName, string> = {
    'generate-actions-shookaworld': '슈카월드 액션 아이템',
    'generate-actions-moneycomics': '머니코믹스 액션 아이템',
};

export function actionsPromptName(channel: ChannelName): PromptName {
    return `generate-actions-${channel}` as PromptName;
}

function readDefault(name: PromptName): string {
    return fs.readFileSync(path.join(DEFAULTS_DIR, `${name}.md`), 'utf-8');
}

export function getPrompt(name: PromptName): string {
    const db = getDb();
    const row = db
        .prepare('SELECT content FROM prompts WHERE name = ?')
        .get(name) as { content: string } | undefined;
    return row?.content ?? readDefault(name);
}

export function savePrompt(name: PromptName, content: string): void {
    const db = getDb();
    db.prepare(
        `INSERT INTO prompts (name, content, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(name) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at`,
    ).run(name, content, new Date().toISOString());
}

export function resetPrompt(name: PromptName): void {
    const db = getDb();
    db.prepare('DELETE FROM prompts WHERE name = ?').run(name);
}

export function isCustomized(name: PromptName): boolean {
    const db = getDb();
    const row = db.prepare('SELECT 1 FROM prompts WHERE name = ?').get(name);
    return !!row;
}
