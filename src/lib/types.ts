export type ChannelName = 'shookaworld' | 'moneycomics';

export type SampleComment = {
    text: string;
    likeCount: number;
    author: string;
};

export const ANALYSIS_CATEGORIES = [
    'Topic Value',
    'Expertise & Correction',
    'Future Demand',
    'Viewer Identity',
] as const;

export type AnalysisCategory = (typeof ANALYSIS_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<AnalysisCategory, string> = {
    'Topic Value': '주제 만족도',
    'Expertise & Correction': '전문성·정정',
    'Future Demand': '콘텐츠 요청',
    'Viewer Identity': '시청자 공감',
};

export type FeedbackCategory = {
    category: string;
    weightedScore: number;
    commentCount: number;
    sampleComments: SampleComment[];
};

export type ActionItem = {
    title: string;
    rationale: string;
    sourceCategory: AnalysisCategory;
    impactScore: number;
};

export type AnalysisResult = {
    videoId: string;
    channelId: string;
    channelName: ChannelName;
    videoTitle: string;
    videoSummary: string;
    videoUrl: string;
    publishedAt: string;
    thumbnailUrl: string;
    analyzedAt: string;
    commentCount: number;
    categoryDistribution: FeedbackCategory[];
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
    | { stage: 'summarizing'; message: string }
    | { stage: 'classifying-feedback'; message: string }
    | { stage: 'aggregating'; message: string }
    | { stage: 'generating-actions'; message: string }
    | { stage: 'done'; result: AnalysisResult }
    | { stage: 'error'; message: string };
