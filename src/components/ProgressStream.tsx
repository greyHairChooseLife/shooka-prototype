'use client';
import type { PipelineEvent } from '@/lib/types';

const STAGES = [
    { key: 'collecting', label: '댓글 수집' },
    { key: 'filtering', label: '댓글 정제' },
    { key: 'summarizing', label: '영상 요약' },
    { key: 'classifying-feedback', label: '댓글 분류' },
    { key: 'aggregating', label: '집계' },
    { key: 'generating-actions', label: '액션 아이템 생성' },
] as const;

export default function ProgressStream({
    events,
}: {
    events: PipelineEvent[];
}) {
    if (!events.length) return null;

    const lastEvent = events[events.length - 1];
    const isError = lastEvent.stage === 'error';

    if (isError) {
        return (
            <div className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
                <span className="mr-2 font-bold">오류</span>
                {'message' in lastEvent ? lastEvent.message : ''}
            </div>
        );
    }

    const activeStage = lastEvent.stage !== 'done' ? lastEvent.stage : null;

    // 각 stage의 마지막 이벤트를 사용 (완료 메시지가 "중..." 메시지를 덮어씀)
    const lastEventByStage = new Map<string, string>();
    for (const e of events) {
        if (e.stage !== 'done' && e.stage !== 'error' && 'message' in e) {
            lastEventByStage.set(e.stage, e.message);
        }
    }

    // 현재 활성 stage 이전의 모든 stage는 완료
    const activeIndex = STAGES.findIndex((s) => s.key === activeStage);
    const isComplete = (key: string) => {
        const idx = STAGES.findIndex((s) => s.key === key);
        return activeStage === null || idx < activeIndex;
    };

    return (
        <div className="space-y-3">
            {STAGES.map((stage) => {
                const complete = isComplete(stage.key);
                const active = activeStage === stage.key;
                const pending = !complete && !active;
                const message = lastEventByStage.get(stage.key) ?? null;

                return (
                    <div
                        key={stage.key}
                        className={`flex items-start gap-3 text-sm transition-opacity ${
                            pending ? 'opacity-25' : 'opacity-100'
                        }`}
                    >
                        {/* 아이콘 */}
                        <span className="mt-0.5 w-5 shrink-0 text-center">
                            {complete ? (
                                <span className="text-green-400">✓</span>
                            ) : active ? (
                                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                            ) : (
                                <span className="text-gray-600">·</span>
                            )}
                        </span>

                        {/* 레이블 + 메시지 */}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                                <span
                                    className={
                                        complete
                                            ? 'text-gray-300'
                                            : active
                                              ? 'font-medium text-white'
                                              : 'text-gray-500'
                                    }
                                >
                                    {stage.label}
                                </span>
                                {message && (
                                    <span className="text-xs text-gray-500">
                                        {message}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
