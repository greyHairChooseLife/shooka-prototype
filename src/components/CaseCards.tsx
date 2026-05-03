'use client';
import { useEffect, useState } from 'react';
import type { CaseMeta, AnalysisResult } from '@/lib/types';

type Props = { onSelect: (result: AnalysisResult) => void };

export default function CaseCards({ onSelect }: Props) {
    const [cases, setCases] = useState<CaseMeta[]>([]);

    useEffect(() => {
        fetch('/api/cases')
            .then((r) => r.json())
            .then(setCases)
            .catch(() => null);
    }, []);

    async function handleClick(videoId: string) {
        const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
            }),
        });

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

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
                    const event = JSON.parse(dataLine);
                    if (event.stage === 'done') onSelect(event.result);
                } catch {
                    // 파싱 실패 무시
                }
            }
        }
    }

    if (!cases.length) return null;

    return (
        <div>
            <h2 className="mb-4 text-xl font-semibold">이미 분석된 영상</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {cases.map((c) => (
                    <button
                        key={c.videoId}
                        onClick={() => handleClick(c.videoId)}
                        className="overflow-hidden rounded-lg bg-gray-800 text-left transition-colors hover:bg-gray-700"
                    >
                        <img
                            src={c.thumbnailUrl}
                            alt={c.videoTitle}
                            className="aspect-video w-full object-cover"
                        />
                        <div className="p-3">
                            <p className="mb-1 text-xs text-indigo-400">
                                {c.channelName === 'shookaworld'
                                    ? '슈카월드'
                                    : '머니코믹스'}
                            </p>
                            <p className="line-clamp-2 text-sm font-medium">
                                {c.videoTitle}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
