import { google } from 'googleapis';
import { YoutubeTranscript } from 'youtube-transcript';

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY,
});

export type RawComment = {
    text: string;
    likeCount: number;
    author: string;
    publishedAt: string;
};

export type VideoMeta = {
    videoId: string;
    channelId: string;
    title: string;
    description: string;
    publishedAt: string;
    thumbnailUrl: string;
};

export function extractVideoId(url: string): string | null {
    const patterns = [
        /[?&]v=([^&]+)/,
        /youtu\.be\/([^?]+)/,
        /youtube\.com\/embed\/([^?]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

export async function getVideoMeta(videoId: string): Promise<VideoMeta> {
    const res = await youtube.videos.list({
        part: ['snippet'],
        id: [videoId],
    });

    const item = res.data.items?.[0];
    if (!item) throw new Error(`Video not found: ${videoId}`);

    const snippet = item.snippet!;
    if (snippet.liveBroadcastContent === 'live') {
        throw new Error('라이브 방송 중인 영상은 분석할 수 없습니다.');
    }

    return {
        videoId,
        channelId: snippet.channelId!,
        title: snippet.title!,
        description: snippet.description || '',
        publishedAt: snippet.publishedAt!,
        thumbnailUrl:
            snippet.thumbnails?.high?.url ||
            snippet.thumbnails?.default?.url ||
            '',
    };
}

export async function fetchComments(videoId: string): Promise<RawComment[]> {
    const allComments: RawComment[] = [];
    let pageToken: string | undefined;

    for (let page = 0; page < 4; page++) {
        const res = await youtube.commentThreads.list({
            part: ['snippet'],
            videoId,
            maxResults: 100,
            order: 'relevance',
            pageToken,
        });

        const items = res.data.items || [];
        for (const item of items) {
            const top = item.snippet?.topLevelComment?.snippet;
            if (!top) continue;
            allComments.push({
                text: top.textDisplay || '',
                likeCount: top.likeCount || 0,
                author: top.authorDisplayName || '',
                publishedAt: top.publishedAt || '',
            });
        }

        pageToken = res.data.nextPageToken || undefined;
        if (!pageToken) break;
    }

    const sorted = [...allComments].sort((a, b) => b.likeCount - a.likeCount);

    const top100 = sorted.slice(0, 100);

    const top100Texts = new Set(top100.map((c) => c.text));
    const rest = allComments.filter((c) => !top100Texts.has(c.text));
    const shuffled = rest.sort(() => Math.random() - 0.5).slice(0, 100);

    return [...top100, ...shuffled];
}

// 자막이 없으면 null 반환
export async function fetchTranscript(videoId: string): Promise<string | null> {
    try {
        const items = await YoutubeTranscript.fetchTranscript(videoId, {
            lang: 'ko',
        }).catch(() => YoutubeTranscript.fetchTranscript(videoId));
        const text = items.map((i) => i.text).join(' ');
        // 토큰 절약을 위해 최대 8000자로 자름
        return text.slice(0, 8000);
    } catch {
        return null;
    }
}
