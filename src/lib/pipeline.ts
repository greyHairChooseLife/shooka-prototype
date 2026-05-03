import { getVideoMeta, fetchComments, fetchTranscript, type RawComment } from '@/lib/youtube';
import { callLLM, callLLMJSON } from '@/lib/llm';
import { buildSummarizePrompt } from '@/prompts/summarize-video';
import { buildClassifyPrompt, type CommentClassification } from '@/prompts/classify-feedback';
import { buildActionsPrompt } from '@/prompts/generate-actions';
import type {
    AnalysisResult,
    FeedbackCategory,
    ActionItem,
    PipelineEvent,
} from '@/lib/types';

function filterComments(comments: RawComment[]): RawComment[] {
    return comments.filter((c) => {
        const text = c.text.trim();
        if (text.length < 5) return false;
        if (/^[\p{Emoji}\s]+$/u.test(text)) return false;
        return true;
    });
}

function buildCategoryDistribution(
    comments: RawComment[],
    classifications: CommentClassification[],
): FeedbackCategory[] {
    const map = new Map<string, { weightedScore: number; comments: RawComment[] }>();

    for (const cls of classifications) {
        if (cls.category === null) continue;
        const comment = comments[cls.index];
        if (!comment) continue;
        const existing = map.get(cls.category) || { weightedScore: 0, comments: [] };
        existing.weightedScore += comment.likeCount + 1;
        existing.comments.push(comment);
        map.set(cls.category, existing);
    }

    return Array.from(map.entries())
        .map(([category, data]) => ({
            category,
            weightedScore: data.weightedScore,
            commentCount: data.comments.length,
            sampleComments: data.comments
                .sort((a, b) => b.likeCount - a.likeCount)
                .slice(0, 3)
                .map((c) => ({ text: c.text, likeCount: c.likeCount, author: c.author })),
        }))
        .sort((a, b) => b.weightedScore - a.weightedScore);
}

export async function runPipeline(
    videoUrl: string,
    onEvent: (event: PipelineEvent) => void,
): Promise<AnalysisResult> {
    onEvent({ stage: 'collecting', message: '영상 메타데이터·댓글 수집 중...' });
    const videoId =
        videoUrl.match(/[?&]v=([^&]+)/)?.at(1) ||
        videoUrl.match(/youtu\.be\/([^?]+)/)?.at(1);
    if (!videoId) throw new Error('유효하지 않은 YouTube URL');

    const [meta, rawComments, transcript] = await Promise.all([
        getVideoMeta(videoId),
        fetchComments(videoId),
        fetchTranscript(videoId),
    ]);
    onEvent({ stage: 'collecting', message: `댓글 ${rawComments.length}개 수집 완료` });

    onEvent({ stage: 'filtering', message: '댓글 정제 중...' });
    const comments = filterComments(rawComments);
    onEvent({ stage: 'filtering', message: `${comments.length}개 댓글 정제 완료` });

    onEvent({
        stage: 'summarizing',
        message: transcript ? '자막 기반 영상 요약 중...' : '영상 설명 기반 요약 중...',
    });
    const videoSummary = await callLLM(
        buildSummarizePrompt({ title: meta.title, description: meta.description, transcript }),
    );
    onEvent({ stage: 'summarizing', message: '영상 요약 완료' });

    onEvent({ stage: 'classifying-feedback', message: '댓글 분류 중...' });
    const classifications = await callLLMJSON<CommentClassification[]>(
        buildClassifyPrompt(comments, videoSummary),
    );
    onEvent({ stage: 'classifying-feedback', message: '댓글 분류 완료' });

    onEvent({ stage: 'aggregating', message: '결과 집계 중...' });
    const categoryDistribution = buildCategoryDistribution(comments, classifications);

    const channelName =
        meta.channelId === process.env.SHOOKAWORLD_CHANNEL_ID
            ? 'shookaworld'
            : 'moneycomics';

    onEvent({ stage: 'generating-actions', message: '액션 아이템 생성 중...' });
    const actionItems = (await callLLMJSON<ActionItem[]>(
        buildActionsPrompt(meta.title, videoSummary, categoryDistribution, channelName),
    )).sort((a, b) => (b.impactScore ?? 0) - (a.impactScore ?? 0));
    onEvent({ stage: 'generating-actions', message: '액션 아이템 생성 완료' });

    const result: AnalysisResult = {
        videoId,
        channelId: meta.channelId,
        channelName,
        videoTitle: meta.title,
        videoSummary,
        videoUrl,
        publishedAt: meta.publishedAt,
        thumbnailUrl: meta.thumbnailUrl,
        analyzedAt: new Date().toISOString(),
        commentCount: comments.length,
        categoryDistribution,
        actionItems,
    };

    onEvent({ stage: 'done', result });
    return result;
}
