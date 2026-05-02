import { getVideoMeta, fetchComments, type RawComment } from '@/lib/youtube';
import { callClaudeJSON } from '@/lib/anthropic';
import {
    buildFeedbackPrompt,
    type FeedbackClassification,
} from '@/prompts/classify-feedback';
import {
    buildExpressionPrompt,
    type ExpressionClassification,
} from '@/prompts/classify-expression';
import { buildActionsPrompt } from '@/prompts/generate-actions';
import type {
    AnalysisResult,
    FeedbackCategory,
    ExpressionCategory,
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

function buildFeedbackDistribution(
    comments: RawComment[],
    classifications: FeedbackClassification[],
): FeedbackCategory[] {
    const map = new Map<string, { weightedScore: number; comments: RawComment[] }>();

    for (const cls of classifications) {
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

function buildExpressionDistribution(
    classifications: ExpressionClassification[],
): ExpressionCategory[] {
    const map = new Map<string, number>();
    for (const cls of classifications) {
        map.set(cls.type, (map.get(cls.type) || 0) + 1);
    }
    return Array.from(map.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);
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

    const [meta, rawComments] = await Promise.all([
        getVideoMeta(videoId),
        fetchComments(videoId),
    ]);
    onEvent({ stage: 'collecting', message: `댓글 ${rawComments.length}개 수집 완료` });

    onEvent({ stage: 'filtering', message: '댓글 정제 중...' });
    const comments = filterComments(rawComments);
    onEvent({ stage: 'filtering', message: `${comments.length}개 댓글 정제 완료` });

    onEvent({ stage: 'classifying-feedback', message: '잠재 피드백 분류 중...' });
    const feedbackClassifications = await callClaudeJSON<FeedbackClassification[]>(
        buildFeedbackPrompt(comments),
    );
    onEvent({ stage: 'classifying-feedback', message: '잠재 피드백 분류 완료' });

    onEvent({ stage: 'classifying-expression', message: '표현 방식 분류 중...' });
    const expressionClassifications = await callClaudeJSON<ExpressionClassification[]>(
        buildExpressionPrompt(comments),
    );
    onEvent({ stage: 'classifying-expression', message: '표현 방식 분류 완료' });

    onEvent({ stage: 'aggregating', message: '결과 집계 중...' });
    const feedbackDistribution = buildFeedbackDistribution(comments, feedbackClassifications);
    const expressionDistribution = buildExpressionDistribution(expressionClassifications);

    onEvent({ stage: 'generating-actions', message: '액션 아이템 생성 중...' });
    const actionItems = await callClaudeJSON<ActionItem[]>(
        buildActionsPrompt(meta.title, feedbackDistribution),
    );
    onEvent({ stage: 'generating-actions', message: '액션 아이템 생성 완료' });

    const channelName =
        meta.channelId === process.env.SHOOKAWORLD_CHANNEL_ID ? 'shookaworld' : 'moneycomics';

    const result: AnalysisResult = {
        videoId,
        channelId: meta.channelId,
        channelName,
        videoTitle: meta.title,
        videoUrl,
        publishedAt: meta.publishedAt,
        thumbnailUrl: meta.thumbnailUrl,
        analyzedAt: new Date().toISOString(),
        commentCount: comments.length,
        feedbackDistribution,
        expressionDistribution,
        actionItems,
    };

    onEvent({ stage: 'done', result });
    return result;
}
