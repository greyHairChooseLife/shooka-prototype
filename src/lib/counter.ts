import { getDb } from '@/lib/db';
import type { UsageStatus } from '@/lib/types';

const LIMIT = parseInt(process.env.USAGE_LIMIT_PER_DAY || '15', 10);
const DAY_MS = 24 * 60 * 60 * 1000;

export function getUsage(): UsageStatus {
    const db = getDb();
    const row = db
        .prepare('SELECT count, reset_at FROM usage_counter WHERE id = 1')
        .get() as { count: number; reset_at: number } | undefined;

    if (!row) return { count: 0, limit: LIMIT, resetAt: Date.now() + DAY_MS };

    if (Date.now() > row.reset_at) {
        const newResetAt = Date.now() + DAY_MS;
        db.prepare(
            'UPDATE usage_counter SET count = 0, reset_at = ? WHERE id = 1',
        ).run(newResetAt);
        return { count: 0, limit: LIMIT, resetAt: newResetAt };
    }

    return { count: row.count, limit: LIMIT, resetAt: row.reset_at };
}

export function consumeUsage(): boolean {
    const usage = getUsage();
    if (usage.count >= usage.limit) return false;

    const db = getDb();
    db.prepare('UPDATE usage_counter SET count = count + 1 WHERE id = 1').run();
    return true;
}
