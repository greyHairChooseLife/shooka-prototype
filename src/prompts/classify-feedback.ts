import type { RawComment } from '@/lib/youtube';
import { ANALYSIS_CATEGORIES } from '@/lib/types';

export type CommentClassification = {
    index: number;
    category: string | null;
};

export function buildClassifyPrompt(comments: RawComment[], videoSummary: string): string {
    const categoriesStr = ANALYSIS_CATEGORIES.map(
        (c, i) => `${i + 1}. ${c}`,
    ).join('\n');
    const commentsStr = comments
        .map((c, i) => `[${i}] (좋아요 ${c.likeCount}) ${c.text}`)
        .join('\n');

    return `당신은 YouTube 댓글 분류 전문가입니다. 아래 영상 요약과 댓글들을 참고하여 각 댓글을 4가지 카테고리로 분류하세요.

## 영상 요약
${videoSummary}

## 카테고리
${categoriesStr}

## 분류 기준
1. Topic Value — 주제/내용에 대한 만족 또는 불만 반응
2. Expertise & Correction — 전문 지식 보완 또는 사실 오류 지적
3. Future Demand — 다음에 보고 싶은 주제나 기능 직·간접 요청
4. Viewer Identity — 자신의 상황을 대입하거나 감정을 토로하는 댓글

## 제외 기준 (null 처리)
- "ㅋㅋ", "ㄷㄷ", "응원합니다", "감사해요" 등 단순 리액션·감탄사
- 의미 없는 단발 이모지

## 댓글
${commentsStr}

## 지시사항
- 각 댓글을 위 카테고리 중 하나로 분류하거나, 제외 기준에 해당하면 null
- JSON 배열로만 응답 (다른 텍스트 없이)

\`\`\`json
[{"index": 0, "category": "Topic Value"}, {"index": 1, "category": null}, ...]
\`\`\``;
}
