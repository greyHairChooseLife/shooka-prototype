import fs from 'fs';
import path from 'path';
import { getDb } from '@/lib/db';
import type { AnalysisResult, CaseMeta } from '@/lib/types';

const CACHE_DIR = path.join(process.cwd(), 'data', 'cache');

export function getCached(videoId: string): AnalysisResult | null {
    if (fs.existsSync(CACHE_DIR)) {
        const files = fs
            .readdirSync(CACHE_DIR)
            .filter((f) => f.endsWith(`-${videoId}.json`));
        if (files.length > 0) {
            const raw = fs.readFileSync(
                path.join(CACHE_DIR, files[0]),
                'utf-8',
            );
            return JSON.parse(raw) as AnalysisResult;
        }
    }

    const db = getDb();
    const row = db
        .prepare('SELECT result_json FROM analysis_cache WHERE video_id = ?')
        .get(videoId) as { result_json: string } | undefined;
    if (row) return JSON.parse(row.result_json) as AnalysisResult;

    return null;
}

export function setCached(videoId: string, result: AnalysisResult): void {
    const db = getDb();
    db.prepare(
        'INSERT OR REPLACE INTO analysis_cache (video_id, result_json, created_at) VALUES (?, ?, ?)',
    ).run(videoId, JSON.stringify(result), Date.now());
}

export function listCaseMetas(): CaseMeta[] {
    if (!fs.existsSync(CACHE_DIR)) return [];
    const files = fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith('.json'));
    return files.map((file) => {
        const raw = fs.readFileSync(path.join(CACHE_DIR, file), 'utf-8');
        const result = JSON.parse(raw) as AnalysisResult;
        return {
            videoId: result.videoId,
            channelName: result.channelName,
            videoTitle: result.videoTitle,
            thumbnailUrl: result.thumbnailUrl,
            publishedAt: result.publishedAt,
        };
    });
}
