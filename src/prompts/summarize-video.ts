type SummarizeInput = {
    title: string;
    description: string;
    transcript: string | null;
};

export function buildSummarizePrompt({
    title,
    description,
    transcript,
}: SummarizeInput): string {
    const transcriptSection = transcript
        ? `\n## 자막 (일부)\n${transcript}`
        : '';

    return `아래 YouTube 영상 정보를 바탕으로 영상의 핵심 내용을 3~5문장으로 요약하세요.
요약은 댓글 분석 및 콘텐츠 기획에 활용되므로, 주제·핵심 주장·다루는 사례를 중심으로 작성하세요.
요약 텍스트만 출력하세요 (JSON 불필요).

## 영상 제목
${title}

## 영상 설명
${description.slice(0, 1000) || '(설명 없음)'}${transcriptSection}`;
}
