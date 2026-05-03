import type { RawComment } from '@/lib/youtube';
import { ANALYSIS_CATEGORIES } from '@/lib/types';

export type CommentClassification = {
    index: number;
    category: string | null;
};

export function buildClassifyPrompt(
    comments: RawComment[],
    videoSummary: string,
): string {
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

## 주의: 이 채널 시청자의 댓글 문화
이 채널의 시청자들은 밈, 반어법, 과장된 자조적 표현을 일상적으로 사용한다.
- "나 망했다", "이러면 안 되는데 ㅋㅋ", "역시 난 안 돼" 같은 표현은 실제 불만이 아니라 공감의 유머일 수 있음
- "이게 맞냐?", "진짜요?" 같은 반문도 부정이 아니라 놀람·공감 표현인 경우가 많음
- 표면적 의미가 아닌 **맥락과 분위기**를 고려해서 분류할 것
- 단, 반어로 포장된 실질적 비판(오류 지적, 불만)은 해당 카테고리로 분류

## 제외 기준 (null 처리)
- "ㅋㅋ", "ㄷㄷ", "응원합니다", "감사해요" 등 단순 리액션·감탄사
- 의미 없는 단발 이모지
- 내용 없이 밈 텍스트만 있는 댓글 (예: "ㅇㅇ 그래서 망한 거 아닌가요 ㅋㅋ" 수준의 농담)

## 댓글
${commentsStr}

## 지시사항
- 각 댓글을 위 카테고리 중 하나로 분류하거나, 제외 기준에 해당하면 null
- JSON 배열로만 응답 (다른 텍스트 없이)

\`\`\`json
[{"index": 0, "category": "Topic Value"}, {"index": 1, "category": null}, ...]
\`\`\``;
}
