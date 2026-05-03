import type { FeedbackCategory, ChannelName } from '@/lib/types';
import { getPrompt, actionsPromptName } from '@/lib/prompt-store';

export function buildActionsPrompt(
    videoTitle: string,
    feedbackDistribution: FeedbackCategory[],
    channel: ChannelName,
): string {
    const feedbackStr = feedbackDistribution
        .slice(0, 6)
        .map(
            (f) =>
                `- ${f.category} (가중점수: ${f.weightedScore}, 댓글수: ${f.commentCount})\n  대표 댓글: ${f.sampleComments
                    .slice(0, 2)
                    .map((c) => `"${c.text}"`)
                    .join(', ')}`,
        )
        .join('\n');

    return getPrompt(actionsPromptName(channel))
        .replace('{{videoTitle}}', videoTitle)
        .replace('{{feedbackDistribution}}', feedbackStr);
}
