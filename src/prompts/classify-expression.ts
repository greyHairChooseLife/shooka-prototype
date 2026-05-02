import type { RawComment } from '@/lib/youtube';

const EXPRESSION_TYPES = [
    '칭찬형',
    '비판형',
    '질문형',
    '농담·밈형',
    '정보 보충형',
    '기타',
];

export type ExpressionClassification = {
    index: number;
    type: string;
};

export function buildExpressionPrompt(comments: RawComment[]): string {
    const typesStr = EXPRESSION_TYPES.map((t, i) => `${i + 1}. ${t}`).join(
        '\n',
    );
    const commentsStr = comments.map((c, i) => `[${i}] ${c.text}`).join('\n');

    return `당신은 YouTube 댓글 분류 전문가입니다. 아래 댓글들을 표현 방식으로 분류하세요.

## 표현 방식 유형
${typesStr}

## 댓글
${commentsStr}

## 지시사항
- 각 댓글을 위 유형 중 하나로 분류
- JSON 배열로만 응답

\`\`\`json
[{"index": 0, "type": "유형명"}, ...]
\`\`\``;
}
