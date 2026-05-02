export type ChannelName = 'shookaworld' | 'moneycomics';

export type SampleComment = {
    text: string;
    likeCount: number;
    author: string;
};

export type FeedbackCategory = {
    category: string;
    weightedScore: number;
    commentCount: number;
    sampleComments: SampleComment[];
};

export type ExpressionCategory = {
    type: string;
    count: number;
};

export type ActionItem = {
    title: string;
    rationale: string;
    sourceFeedback: string;
};

export type AnalysisResult = {
    videoId: string;
    channelId: string;
    channelName: ChannelName;
    videoTitle: string;
    videoUrl: string;
    publishedAt: string;
    thumbnailUrl: string;
    analyzedAt: string;
    commentCount: number;
    feedbackDistribution: FeedbackCategory[];
    expressionDistribution: ExpressionCategory[];
    actionItems: ActionItem[];
};

export type UsageStatus = {
    count: number;
    limit: number;
    resetAt: number;
};

export type CaseMeta = {
    videoId: string;
    channelName: ChannelName;
    videoTitle: string;
    thumbnailUrl: string;
    publishedAt: string;
};

export type PipelineEvent =
    | { stage: 'collecting'; message: string }
    | { stage: 'filtering'; message: string }
    | { stage: 'classifying-feedback'; message: string }
    | { stage: 'classifying-expression'; message: string }
    | { stage: 'aggregating'; message: string }
    | { stage: 'generating-actions'; message: string }
    | { stage: 'done'; result: AnalysisResult }
    | { stage: 'error'; message: string };
