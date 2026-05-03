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
    const isDone = lastEvent.stage === 'done';
    const isError = lastEvent.stage === 'error';

    const completedStages = new Set(
        events
            .filter((e) => e.stage !== 'done' && e.stage !== 'error')
            .map((e) => e.stage),
    );

    const activeStage = !isDone && !isError ? lastEvent.stage : null;

    if (isError) {
        return (
            <div className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
                <span className="mr-2 font-bold">오류</span>
                {'message' in lastEvent ? lastEvent.message : ''}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {STAGES.map((stage) => {
                const isComplete = completedStages.has(stage.key);
                const isActive = activeStage === stage.key;
                const isPending = !isComplete && !isActive && !isDone;

                const matchingEvent = events.find((e) => e.stage === stage.key);
                const message =
                    matchingEvent && 'message' in matchingEvent
                        ? matchingEvent.message
                        : null;

                return (
                    <div
                        key={stage.key}
                        className={`flex items-start gap-3 text-sm transition-opacity ${
                            isPending ? 'opacity-30' : 'opacity-100'
                        }`}
                    >
                        <span className="mt-0.5 w-5 shrink-0 text-center">
                            {isDone || isComplete ? (
                                <span className="text-green-400">✓</span>
                            ) : isActive ? (
                                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                            ) : (
                                <span className="text-gray-600">·</span>
                            )}
                        </span>
                        <div className="min-w-0">
                            <span
                                className={
                                    isDone || isComplete
                                        ? 'text-gray-300'
                                        : isActive
                                          ? 'font-medium text-white'
                                          : 'text-gray-500'
                                }
                            >
                                {stage.label}
                            </span>
                            {message && (
                                <p className="mt-0.5 truncate text-xs text-gray-500">
                                    {message}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}

            {isDone && (
                <div className="mt-3 border-t border-gray-700 pt-3 text-xs text-gray-500">
                    분석 완료
                </div>
            )}
        </div>
    );
}
