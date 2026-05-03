import type {
    FeedbackCategory,
    ChannelName,
    AnalysisCategory,
} from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';
import { getPrompt, actionsPromptName } from '@/lib/prompt-store';

export function buildActionsPrompt(
    videoTitle: string,
    videoSummary: string,
    categoryDistribution: FeedbackCategory[],
    channel: ChannelName,
    totalCommentCount: number,
): string {
    const totalScore = categoryDistribution.reduce((s, c) => s + c.weightedScore, 0);

    const distributionStr = categoryDistribution
        .map((f) => {
            const label = CATEGORY_LABELS[f.category as AnalysisCategory] ?? f.category;
            const pct = totalScore > 0 ? Math.round((f.weightedScore / totalScore) * 100) : 0;
            const commentsStr = f.sampleComments
                .slice(0, 5)
                .map((c, i) => `  [${i}] (좋아요 ${c.likeCount}) "${c.text}"`)
                .join('\n');
            return `### ${label}\n- 비중: ${pct}% (가중점수 ${f.weightedScore} / 전체 ${totalScore})\n- 해당 댓글 수: ${f.commentCount}개\n대표 댓글 (좋아요순 상위):\n${commentsStr}`;
        })
        .join('\n\n');

    return getPrompt(actionsPromptName(channel))
        .replace('{{videoTitle}}', videoTitle)
        .replace('{{videoSummary}}', videoSummary)
        .replace('{{totalCommentCount}}', String(totalCommentCount))
        .replace('{{categoryDistribution}}', distributionStr);
}
