import type { RawComment } from '@/lib/youtube';

const FEEDBACK_CATEGORIES = [
    '콘텐츠 길이',
    '주제 깊이',
    '주제 다양성',
    '사실 정확성',
    '출연자 구성',
    '영상 구성',
    '시의성',
    '기타',
];

export type FeedbackClassification = {
    index: number;
    category: string;
};

export function buildFeedbackPrompt(comments: RawComment[]): string {
    const categoriesStr = FEEDBACK_CATEGORIES.map(
        (c, i) => `${i + 1}. ${c}`,
    ).join('\n');
    const commentsStr = comments
        .map((c, i) => `[${i}] (좋아요 ${c.likeCount}) ${c.text}`)
        .join('\n');

    return `당신은 YouTube 댓글 분류 전문가입니다. 아래 댓글들을 잠재 피드백 카테고리로 분류하세요.

## 카테고리
${categoriesStr}

## 댓글 (인덱스: 텍스트)
${commentsStr}

## 지시사항
- 각 댓글을 위 카테고리 중 하나로 분류
- 카테고리가 명확히 맞지 않으면 "기타"
- JSON 배열로만 응답 (다른 텍스트 없이)

\`\`\`json
[{"index": 0, "category": "카테고리명"}, ...]
\`\`\``;
}
