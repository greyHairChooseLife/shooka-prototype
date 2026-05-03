'use client';
import { useEffect, useState } from 'react';
import type { CaseMeta, PipelineEvent, AnalysisResult } from '@/lib/types';
import { useAnalyze } from '@/hooks/useAnalyze';

type Props = {
    onEvents: (events: PipelineEvent[]) => void;
    onResult: (result: AnalysisResult) => void;
};

export default function CaseCards({ onEvents, onResult }: Props) {
    const [cases, setCases] = useState<CaseMeta[]>([]);
    const { analyze, loading } = useAnalyze(onEvents, onResult);

    useEffect(() => {
        fetch('/api/cases')
            .then((r) => r.json())
            .then(setCases)
            .catch(() => null);
    }, []);

    if (!cases.length) return null;

    return (
        <div>
            <h2 className="mb-4 text-xl font-semibold">이미 분석된 영상</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {cases.map((c) => (
                    <button
                        key={c.videoId}
                        onClick={() => analyze(`https://www.youtube.com/watch?v=${c.videoId}`)}
                        disabled={loading}
                        className="overflow-hidden rounded-lg bg-gray-800 text-left transition-colors hover:bg-gray-700 disabled:opacity-50"
                    >
                        <img
                            src={c.thumbnailUrl}
                            alt={c.videoTitle}
                            className="aspect-video w-full object-cover"
                        />
                        <div className="p-3">
                            <p className="mb-1 text-xs text-indigo-400">
                                {c.channelName === 'shookaworld' ? '슈카월드' : '머니코믹스'}
                            </p>
                            <p className="line-clamp-2 text-sm font-medium">{c.videoTitle}</p>
                            <p className="mt-1 text-xs text-gray-500">
                                분석: {new Date(c.analyzedAt).toLocaleDateString('ko-KR')}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
