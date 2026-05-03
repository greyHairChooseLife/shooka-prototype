'use client';
import { useState } from 'react';
import type { ActionItem, FeedbackCategory } from '@/lib/types';
import { CATEGORY_LABELS, type AnalysisCategory } from '@/lib/types';

type Props = {
    items: ActionItem[];
    categoryDistribution: FeedbackCategory[];
};

export default function ActionCards({ items, categoryDistribution }: Props) {
    const [expanded, setExpanded] = useState<number | null>(null);

    function getComments(sourceCategory: string) {
        const cat = categoryDistribution.find((c) => c.category === sourceCategory);
        return cat?.sampleComments ?? [];
    }

    return (
        <div>
            <h3 className="mb-4 text-lg font-semibold">액션 아이템</h3>
            <div className="grid gap-3">
                {items.map((item, i) => {
                    const comments = getComments(item.sourceCategory);
                    const isOpen = expanded === i;
                    const label = CATEGORY_LABELS[item.sourceCategory as AnalysisCategory] ?? item.sourceCategory;

                    return (
                        <div
                            key={i}
                            className="rounded-lg border border-gray-700 bg-gray-800"
                        >
                            <button
                                className="w-full p-4 text-left"
                                onClick={() => setExpanded(isOpen ? null : i)}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <p className="text-sm font-medium">{item.title}</p>
                                    <span className="shrink-0 rounded bg-gray-700 px-1.5 py-0.5 text-xs text-gray-300">
                                        {item.impactScore ?? '—'}점
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-gray-400">{item.rationale}</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="rounded bg-indigo-900/50 px-2 py-0.5 text-xs text-indigo-300">
                                        {label}
                                    </span>
                                    {comments.length > 0 && (
                                        <span className="text-xs text-gray-500">
                                            {isOpen ? '▲ 댓글 숨기기' : `▼ 근거 댓글 ${comments.length}개`}
                                        </span>
                                    )}
                                </div>
                            </button>

                            {isOpen && comments.length > 0 && (
                                <div className="border-t border-gray-700 px-4 pb-4 pt-3 space-y-2">
                                    {comments.map((c, j) => (
                                        <div
                                            key={j}
                                            className="border-l-2 border-indigo-700 pl-3 text-sm text-gray-300"
                                        >
                                            <span className="text-xs text-yellow-400">
                                                좋아요 {c.likeCount}
                                            </span>{' '}
                                            {c.text}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
