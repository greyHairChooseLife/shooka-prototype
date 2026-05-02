import type { FeedbackCategory } from '@/lib/types';

export function buildActionsPrompt(
    videoTitle: string,
    feedbackDistribution: FeedbackCategory[],
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

    return `당신은 YouTube 콘텐츠 전략가입니다. 댓글 분석 결과를 바탕으로 다음 영상 기획에 활용할 수 있는 구체적인 액션 아이템을 생성하세요.

## 영상 제목
${videoTitle}

## 잠재 피드백 분포 (좋아요 가중 점수 순)
${feedbackStr}

## 지시사항
- 5~7개의 액션 아이템 생성
- 각 아이템은 즉시 실행 가능한 구체적 제안이어야 함
- 근거가 되는 피드백 카테고리와 대표 댓글을 명시
- JSON 배열로만 응답

\`\`\`json
[
  {
    "title": "액션 제안 (1~2문장)",
    "rationale": "어떤 피드백에 근거한 제안인지 설명",
    "sourceFeedback": "피드백 카테고리명"
  }
]
\`\`\``;
}
