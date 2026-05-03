import type { PipelineEvent } from '@/lib/types';

const STAGE_LABELS: Record<string, string> = {
    collecting: '댓글 수집',
    filtering: '댓글 정제',
    'classifying-feedback': '잠재 피드백 분류',
    'classifying-expression': '표현 방식 분류',
    aggregating: '집계',
    'generating-actions': '액션 아이템 생성',
    done: '완료',
    error: '오류',
};

export default function ProgressStream({
    events,
}: {
    events: PipelineEvent[];
}) {
    if (!events.length) return null;

    return (
        <div className="space-y-1 text-sm">
            {events.map((event, i) => (
                <div
                    key={i}
                    className={`flex items-center gap-2 ${
                        event.stage === 'error'
                            ? 'text-red-400'
                            : 'text-gray-300'
                    }`}
                >
                    <span className="w-36 font-mono text-xs text-gray-500">
                        [{STAGE_LABELS[event.stage] || event.stage}]
                    </span>
                    <span>{'message' in event ? event.message : ''}</span>
                </div>
            ))}
        </div>
    );
}
