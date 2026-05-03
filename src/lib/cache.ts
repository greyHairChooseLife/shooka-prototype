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
    const seen = new Set<string>();
    const results: CaseMeta[] = [];

    // DB (실시간 분석 결과)
    const db = getDb();
    const rows = db
        .prepare('SELECT result_json FROM analysis_cache ORDER BY created_at DESC')
        .all() as { result_json: string }[];
    for (const row of rows) {
        const r = JSON.parse(row.result_json) as AnalysisResult;
        if (seen.has(r.videoId)) continue;
        seen.add(r.videoId);
        results.push({
            videoId: r.videoId,
            channelName: r.channelName,
            videoTitle: r.videoTitle,
            thumbnailUrl: r.thumbnailUrl,
            publishedAt: r.publishedAt,
            analyzedAt: r.analyzedAt,
        });
    }

    // 파일 캐시 (사전 분석된 케이스)
    if (fs.existsSync(CACHE_DIR)) {
        const files = fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith('.json'));
        for (const file of files) {
            const raw = fs.readFileSync(path.join(CACHE_DIR, file), 'utf-8');
            const r = JSON.parse(raw) as AnalysisResult;
            if (seen.has(r.videoId)) continue;
            seen.add(r.videoId);
            results.push({
                videoId: r.videoId,
                channelName: r.channelName,
                videoTitle: r.videoTitle,
                thumbnailUrl: r.thumbnailUrl,
                publishedAt: r.publishedAt,
                analyzedAt: r.analyzedAt,
            });
        }
    }

    return results.sort(
        (a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime(),
    );
}
