'use client';
import { useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import type { FeedbackCategory } from '@/lib/types';

export default function FeedbackChart({ data }: { data: FeedbackCategory[] }) {
    const [expanded, setExpanded] = useState<string | null>(null);

    return (
        <div>
            <h3 className="mb-4 text-lg font-semibold">댓글 카테고리 분포</h3>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ left: 16, right: 16 }}
                >
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                        type="category"
                        dataKey="category"
                        width={100}
                        tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                        formatter={(value) => [`${value}`, '가중 점수']}
                        contentStyle={{
                            background: '#1f2937',
                            border: 'none',
                            fontSize: 12,
                        }}
                    />
                    <Bar
                        dataKey="weightedScore"
                        radius={[0, 4, 4, 0]}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onClick={(d: any) =>
                            setExpanded(
                                d.category === expanded ? null : d.category,
                            )
                        }
                    >
                        {data.map((entry) => (
                            <Cell
                                key={entry.category}
                                fill={
                                    entry.category === expanded
                                        ? '#3b82f6'
                                        : '#6366f1'
                                }
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {expanded &&
                (() => {
                    const item = data.find((d) => d.category === expanded);
                    if (!item) return null;
                    return (
                        <div className="mt-4 space-y-2 rounded-lg bg-gray-800 p-4">
                            <p className="text-sm font-medium text-blue-400">
                                {item.category} — 대표 댓글
                            </p>
                            {item.sampleComments.map((c, i) => (
                                <div
                                    key={i}
                                    className="border-l-2 border-gray-600 pl-3 text-sm text-gray-300"
                                >
                                    <span className="text-xs text-yellow-400">
                                        좋아요 {c.likeCount}
                                    </span>{' '}
                                    {c.text}
                                </div>
                            ))}
                        </div>
                    );
                })()}
        </div>
    );
}
