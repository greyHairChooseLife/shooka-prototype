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

    // 한국어 카테고리명 → FeedbackCategory 맵
    const categoryMap = new Map(
        categoryDistribution.map((c) => [
            CATEGORY_LABELS[c.category as AnalysisCategory] ?? c.category,
            c,
        ]),
    );

    const visibleItems = items.filter((item) => {
        const cat = categoryMap.get(item.sourceCategory);
        if (!cat) return false;
        return item.sourceCommentIndices.some(
            (idx) => cat.sampleComments[idx] !== undefined,
        );
    });

    if (!visibleItems.length) return null;

    return (
        <div>
            <h3 className="mb-4 text-lg font-semibold">액션 아이템</h3>
            <div className="grid gap-3">
                {visibleItems.map((item, i) => {
                    const cat = categoryMap.get(item.sourceCategory)!;
                    const sourceComments = item.sourceCommentIndices
                        .map((idx) => cat.sampleComments[idx])
                        .filter(Boolean);
                    const isOpen = expanded === i;

                    return (
                        <div
                            key={i}
                            className="rounded-lg border border-gray-700 bg-gray-800"
                        >
                            <button
                                className="w-full p-4 text-left"
                                onClick={() => setExpanded(isOpen ? null : i)}
                            >
                                <p className="text-sm font-medium">
                                    {item.title}
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                    {item.rationale}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="rounded bg-indigo-900/50 px-2 py-0.5 text-xs text-indigo-300">
                                        {item.sourceCategory}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {isOpen
                                            ? '▲ 댓글 숨기기'
                                            : `▼ 근거 댓글 ${sourceComments.length}개`}
                                    </span>
                                </div>
                            </button>

                            {isOpen && (
                                <div className="space-y-2 border-t border-gray-700 px-4 pt-3 pb-4">
                                    {sourceComments.map((c, j) => (
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
