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
    LabelList,
} from 'recharts';
import type { FeedbackCategory } from '@/lib/types';
import { CATEGORY_LABELS, type AnalysisCategory } from '@/lib/types';

function toLabel(category: string): string {
    return CATEGORY_LABELS[category as AnalysisCategory] ?? category;
}

export default function FeedbackChart({ data }: { data: FeedbackCategory[] }) {
    const [expanded, setExpanded] = useState<string | null>(null);

    const total = data.reduce((sum, d) => sum + d.weightedScore, 0);
    const chartData = data.map((d) => ({
        ...d,
        label: toLabel(d.category),
        percent: total > 0 ? Math.round((d.weightedScore / total) * 100) : 0,
    }));

    return (
        <div>
            <h3 className="mb-1 text-lg font-semibold">댓글 카테고리 분포</h3>
            <p className="mb-4 text-xs text-gray-500">value 축: 좋아요 수 누적 가중 점수</p>
            <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 16, right: 24, left: 8, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                        formatter={(value, _name, props) => [
                            `${value} (${props.payload.percent}%)`,
                            '가중 점수',
                        ]}
                        contentStyle={{
                            background: '#1f2937',
                            border: 'none',
                            fontSize: 12,
                        }}
                    />
                    <Bar
                        dataKey="weightedScore"
                        radius={[4, 4, 0, 0]}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onClick={(d: any) =>
                            setExpanded(d.category === expanded ? null : d.category)
                        }
                        cursor="pointer"
                    >
                        <LabelList
                            dataKey="percent"
                            position="top"
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(v: any) => `${v}%`}
                            style={{ fontSize: 11, fill: '#9ca3af' }}
                        />
                        {chartData.map((entry) => (
                            <Cell
                                key={entry.category}
                                fill={entry.category === expanded ? '#3b82f6' : '#6366f1'}
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
                                {toLabel(item.category)} — 대표 댓글
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
