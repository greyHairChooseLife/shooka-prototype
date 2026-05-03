'use client';
import { useEffect, useState } from 'react';
import type { CaseMeta, PipelineEvent, AnalysisResult } from '@/lib/types';
import { useAnalyze } from '@/hooks/useAnalyze';

type Props = {
    onEvents: (events: PipelineEvent[]) => void;
    onResult: (result: AnalysisResult) => void;
};

export default function RecentVideos({ onEvents, onResult }: Props) {
    const [videos, setVideos] = useState<CaseMeta[]>([]);
    const { analyze, loading } = useAnalyze(onEvents, onResult);

    useEffect(() => {
        fetch('/api/recent')
            .then((r) => r.json())
            .then(setVideos)
            .catch(() => null);
    }, []);

    if (!videos.length) return null;

    return (
        <div>
            <h2 className="mb-4 text-xl font-semibold">슈카월드 최근 영상</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                {videos.map((v) => (
                    <button
                        key={v.videoId}
                        onClick={() =>
                            analyze(
                                `https://www.youtube.com/watch?v=${v.videoId}`,
                            )
                        }
                        disabled={loading}
                        className="overflow-hidden rounded-lg bg-gray-800 text-left transition-colors hover:bg-gray-700 disabled:opacity-50"
                    >
                        <img
                            src={v.thumbnailUrl}
                            alt={v.videoTitle}
                            className="aspect-video w-full object-cover"
                        />
                        <div className="p-3">
                            <p className="line-clamp-2 text-sm font-medium">
                                {v.videoTitle}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                {new Date(v.publishedAt).toLocaleDateString(
                                    'ko-KR',
                                )}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
