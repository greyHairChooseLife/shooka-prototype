import type { FeedbackCategory, ChannelName } from '@/lib/types';
import { getPrompt, actionsPromptName } from '@/lib/prompt-store';

export function buildActionsPrompt(
    videoTitle: string,
    categoryDistribution: FeedbackCategory[],
    channel: ChannelName,
): string {
    const distributionStr = categoryDistribution
        .map(
            (f) =>
                `### ${f.category} (가중점수: ${f.weightedScore}, 댓글수: ${f.commentCount})\n대표 댓글:\n${f.sampleComments
                    .slice(0, 3)
                    .map((c) => `- (좋아요 ${c.likeCount}) "${c.text}"`)
                    .join('\n')}`,
        )
        .join('\n\n');

    return getPrompt(actionsPromptName(channel))
        .replace('{{videoTitle}}', videoTitle)
        .replace('{{categoryDistribution}}', distributionStr);
}
