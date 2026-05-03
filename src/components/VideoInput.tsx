'use client';
import { useState } from 'react';
import type { PipelineEvent, AnalysisResult } from '@/lib/types';
import { useAnalyze } from '@/hooks/useAnalyze';

type Props = {
    onEvents: (events: PipelineEvent[]) => void;
    onResult: (result: AnalysisResult) => void;
};

export default function VideoInput({ onEvents, onResult }: Props) {
    const [url, setUrl] = useState('');
    const { analyze, loading } = useAnalyze(onEvents, onResult);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!url.trim()) return;
        await analyze(url.trim());
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 rounded-lg border border-gray-600 bg-gray-800 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                disabled={loading}
            />
            <button
                type="submit"
                disabled={loading || !url.trim()}
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium transition-colors hover:bg-blue-500 disabled:opacity-50"
            >
                {loading ? '분석 중...' : '분석 시작'}
            </button>
        </form>
    );
}
