import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { runPipeline } from '../src/lib/pipeline';

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY,
});

async function getLatestVideoIds(
    channelId: string,
    count = 2,
): Promise<string[]> {
    const res = await youtube.search.list({
        part: ['id'],
        channelId,
        maxResults: count,
        order: 'date',
        type: ['video'],
    });
    return (res.data.items || [])
        .map((item) => item.id!.videoId!)
        .filter(Boolean);
}

async function buildCache(channelId: string, channelSlug: string, count = 2) {
    console.log(`\n[${channelSlug}] 최신 ${count}개 영상 분석 시작`);
    const videoIds = await getLatestVideoIds(channelId, count);

    for (const videoId of videoIds) {
        console.log(`  Processing ${videoId}...`);
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const result = await runPipeline(videoUrl, (event) => {
            console.log(
                `    [${event.stage}]`,
                'message' in event ? event.message : '완료',
            );
        });

        const outPath = path.join(
            process.cwd(),
            'data',
            'cache',
            `${channelSlug}-${videoId}.json`,
        );
        fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
        console.log(`  Saved: ${outPath}`);
    }
}

async function main() {
    const shookaChannelId = process.env.SHOOKAWORLD_CHANNEL_ID;
    const moneyChannelId = process.env.MONEYCOMICS_CHANNEL_ID;

    if (!shookaChannelId || !moneyChannelId) {
        throw new Error(
            'SHOOKAWORLD_CHANNEL_ID 또는 MONEYCOMICS_CHANNEL_ID 환경변수 없음',
        );
    }

    await buildCache(shookaChannelId, 'shookaworld');
    await buildCache(moneyChannelId, 'moneycomics');
    console.log('\n캐시 빌드 완료. data/cache/ 확인.');
}

main().catch(console.error);
