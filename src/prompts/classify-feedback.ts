import type { RawComment } from '@/lib/youtube';
import { ANALYSIS_CATEGORIES } from '@/lib/types';

export type CommentClassification = {
    index: number;
    category: string | null;
};

// LLM은 1~4 숫자로 응답 — 서버에서 카테고리 이름으로 매핑
type RawClassification = {
    index: number;
    category: number | null;
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

## 주의: 밈·농담 판단 기준
이 채널 시청자들은 밈, 반어법, 과장된 자조적 표현을 일상적으로 사용한다.
댓글이 밈/농담인지 판단할 때 **위의 영상 요약을 기준**으로 삼을 것.

판단 흐름:
1. 댓글 내용이 영상 주제와 실질적 연관이 있는가?
   - 있다면 → 표현이 유머적이더라도 해당 카테고리로 분류
   - 없다면 → 아래 제외 기준 적용
2. 반어/자조적 표현("나 망했다 ㅋㅋ", "역시 난 안 돼")이라도 영상 주제에 자신의 상황을 대입한 것이라면 → 4
3. 유머로 포장됐지만 실질적 오류 지적이나 요청이 담겨 있다면 → 해당 카테고리 번호로 분류
4. 영상 내용과 무관한 순수 밈/농담 ("ㄷㄷ 실화냐", "ㄹㅇ임?") → null

## 제외 기준 (null 처리)
- "ㅋㅋ", "ㄷㄷ", "응원합니다", "감사해요" 등 단순 리액션·감탄사
- 의미 없는 단발 이모지
- 영상 주제와 무관한 순수 밈·농담

## 댓글
${commentsStr}

## 지시사항
- 각 댓글을 카테고리 번호(1~4)로 분류하거나, 제외 기준에 해당하면 null
- JSON 배열로만 응답 (다른 텍스트 없이)

\`\`\`json
[{"index": 0, "category": 1}, {"index": 1, "category": null}, ...]
\`\`\``;
}

export function parseClassifications(
    raw: RawClassification[],
): CommentClassification[] {
    return raw.map((r) => ({
        index: r.index,
        category:
            r.category !== null &&
            r.category >= 1 &&
            r.category <= ANALYSIS_CATEGORIES.length
                ? ANALYSIS_CATEGORIES[r.category - 1]
                : null,
    }));
}
