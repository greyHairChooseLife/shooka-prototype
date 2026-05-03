import { NextRequest } from 'next/server';
import { z } from 'zod';
import { extractVideoId } from '@/lib/youtube';
import { getCached, setCached } from '@/lib/cache';
import { consumeUsage } from '@/lib/counter';
import { runPipeline } from '@/lib/pipeline';
import type { PipelineEvent } from '@/lib/types';

const schema = z.object({ videoUrl: z.string().url(), force: z.boolean().optional() });

const ALLOWED_CHANNELS = [
    process.env.SHOOKAWORLD_CHANNEL_ID,
    process.env.MONEYCOMICS_CHANNEL_ID,
].filter(Boolean);

function encodeSSE(event: PipelineEvent): string {
    return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return new Response(JSON.stringify({ error: '유효하지 않은 요청' }), {
            status: 400,
        });
    }

    const { videoUrl, force } = parsed.data;
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
        return new Response(
            JSON.stringify({ error: '유효하지 않은 YouTube URL' }),
            {
                status: 400,
            },
        );
    }

    const stream = new ReadableStream({
        async start(controller) {
            const send = (event: PipelineEvent) => {
                controller.enqueue(new TextEncoder().encode(encodeSSE(event)));
            };

            try {
                if (!force) {
                    const cached = getCached(videoId);
                    if (cached) {
                        send({ stage: 'done', result: cached });
                        return;
                    }
                }

                const allowed = consumeUsage();
                if (!allowed) {
                    send({
                        stage: 'error',
                        message:
                            '오늘 분석 한도에 도달했습니다. 내일 자정에 초기화됩니다.',
                    });
                    return;
                }

                const result = await runPipeline(videoUrl, send);

                if (
                    ALLOWED_CHANNELS.length > 0 &&
                    !ALLOWED_CHANNELS.includes(result.channelId)
                ) {
                    send({
                        stage: 'error',
                        message:
                            '이 도구는 슈카월드 / 머니코믹스 채널 영상만 분석합니다.',
                    });
                    return;
                }

                setCached(videoId, result);
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : '분석 중 오류가 발생했습니다.';
                send({ stage: 'error', message });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        },
    });
}
