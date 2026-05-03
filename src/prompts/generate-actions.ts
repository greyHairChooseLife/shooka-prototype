import type { FeedbackCategory, ChannelName, AnalysisCategory } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';
import { getPrompt, actionsPromptName } from '@/lib/prompt-store';

export function buildActionsPrompt(
    videoTitle: string,
    videoSummary: string,
    categoryDistribution: FeedbackCategory[],
    channel: ChannelName,
): string {
    const distributionStr = categoryDistribution
        .map((f) => {
            const label = CATEGORY_LABELS[f.category as AnalysisCategory] ?? f.category;
            const commentsStr = f.sampleComments
                .slice(0, 5)
                .map((c, i) => `  [${i}] (좋아요 ${c.likeCount}) "${c.text}"`)
                .join('\n');
            return `### ${label} (가중점수: ${f.weightedScore}, 댓글수: ${f.commentCount})\n대표 댓글:\n${commentsStr}`;
        })
        .join('\n\n');

    return getPrompt(actionsPromptName(channel))
        .replace('{{videoTitle}}', videoTitle)
        .replace('{{videoSummary}}', videoSummary)
        .replace('{{categoryDistribution}}', distributionStr);
}
