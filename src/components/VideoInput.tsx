'use client';
import { useState } from 'react';
import type { PipelineEvent, AnalysisResult } from '@/lib/types';

type Props = {
    onEvents: (events: PipelineEvent[]) => void;
    onResult: (result: AnalysisResult) => void;
};

export default function VideoInput({ onEvents, onResult }: Props) {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!url.trim() || loading) return;

        setLoading(true);
        onEvents([]);

        const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoUrl: url }),
        });

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        const accumulated: PipelineEvent[] = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const chunk of lines) {
                const dataLine = chunk.replace(/^data: /, '');
                if (!dataLine) continue;
                try {
                    const event = JSON.parse(dataLine) as PipelineEvent;
                    accumulated.push(event);
                    onEvents([...accumulated]);
                    if (event.stage === 'done') onResult(event.result);
                } catch {
                    // 파싱 실패 무시
                }
            }
        }

        setLoading(false);
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
