import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import type { CaseMeta } from '@/lib/types';

const youtube = google.youtube({ version: 'v3', auth: process.env.YOUTUBE_API_KEY });

let cache: { data: CaseMeta[]; expiresAt: number } | null = null;
const TTL_MS = 10 * 60 * 1000;

export async function GET() {
    if (cache && Date.now() < cache.expiresAt) {
        return NextResponse.json(cache.data);
    }

    try {
        const channelId = process.env.SHOOKAWORLD_CHANNEL_ID;
        if (!channelId) return NextResponse.json([]);

        const res = await youtube.search.list({
            part: ['snippet'],
            channelId,
            order: 'date',
            maxResults: 5,
            type: ['video'],
        });

        const items: CaseMeta[] = (res.data.items ?? []).map((item) => ({
            videoId: item.id!.videoId!,
            channelName: 'shookaworld',
            videoTitle: item.snippet!.title!,
            thumbnailUrl:
                item.snippet!.thumbnails?.high?.url ||
                item.snippet!.thumbnails?.default?.url ||
                '',
            publishedAt: item.snippet!.publishedAt!,
        }));

        cache = { data: items, expiresAt: Date.now() + TTL_MS };
        return NextResponse.json(items);
    } catch {
        return NextResponse.json([]);
    }
}
